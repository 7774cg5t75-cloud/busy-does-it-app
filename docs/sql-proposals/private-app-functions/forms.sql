-- REVIEW ONLY. After artifacts.sql, isolated staging only. No hosted approval.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PRIVATE FORM REVIEW FUSE: separate staging approval required'; END $$;
SET LOCAL lock_timeout='5s';
-- Preserve the original validator OID/callers; retain its exact finite v1 body under a private helper.
CREATE FUNCTION busy_app_function_private.validate_calculation(spec jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$
DECLARE f jsonb;o jsonb;c jsonb;r jsonb;v jsonb;types jsonb:='{}';ids text[]:='{}';output_ids text[]:='{}';total integer:=0;results jsonb;n numeric;
BEGIN
 IF jsonb_typeof(spec) IS DISTINCT FROM 'object' OR NOT(spec ?& ARRAY['version','kind','title','purpose','scope','inputs','outputs','cases']) OR jsonb_typeof(spec->'title') IS DISTINCT FROM 'string' OR jsonb_typeof(spec->'purpose') IS DISTINCT FROM 'string' OR octet_length(spec::text)>24000 OR spec-ARRAY['version','kind','title','purpose','scope','inputs','outputs','cases']<>'{}' OR (SELECT count(*) FROM jsonb_object_keys(spec))<>8 OR spec->'version' IS DISTINCT FROM '1'::jsonb OR spec->'kind' IS DISTINCT FROM '"private-calculation"'::jsonb OR length(spec->>'title') NOT BETWEEN 1 AND 80 OR length(spec->>'purpose') NOT BETWEEN 1 AND 240 THEN RETURN false;END IF;
 IF jsonb_typeof(spec->'inputs')<>'array' OR jsonb_array_length(spec->'inputs') NOT BETWEEN 1 AND 8 OR jsonb_typeof(spec->'outputs')<>'array' OR jsonb_array_length(spec->'outputs') NOT BETWEEN 1 AND 8 OR jsonb_typeof(spec->'cases')<>'array' OR jsonb_array_length(spec->'cases') NOT BETWEEN 1 AND 4 THEN RETURN false;END IF;
 FOR f IN SELECT value FROM jsonb_array_elements(spec->'inputs') LOOP
  IF NOT(f ?& ARRAY['id','label','type','default']) OR jsonb_typeof(f->'label') IS DISTINCT FROM 'string' OR coalesce(f->>'id','')!~'^[a-z][a-z0-9_]{0,31}$' OR f->>'id'=ANY(ids) OR f->>'id' IN ('constructor','prototype') OR length(f->>'label') NOT BETWEEN 1 AND 80 OR coalesce(f->>'type','') NOT IN ('number','boolean') THEN RETURN false;END IF;ids:=array_append(ids,f->>'id');types:=types||jsonb_build_object(f->>'id',f->>'type');
  IF f->>'type'='number' THEN IF NOT(f ?& ARRAY['unit','min','max']) OR jsonb_typeof(f->'unit') IS DISTINCT FROM 'string' OR f-ARRAY['id','label','type','unit','min','max','default']<>'{}' OR length(f->>'unit') NOT BETWEEN 1 AND 32 OR busy_app_function_private.number(f->'min')>busy_app_function_private.number(f->'max') OR busy_app_function_private.number(f->'default') NOT BETWEEN busy_app_function_private.number(f->'min') AND busy_app_function_private.number(f->'max') THEN RETURN false;END IF;
  ELSIF f-ARRAY['id','label','type','default']<>'{}' OR jsonb_typeof(f->'default') IS DISTINCT FROM 'boolean' THEN RETURN false;END IF;
 END LOOP;
 FOR o IN SELECT value FROM jsonb_array_elements(spec->'outputs') LOOP
  IF NOT(o ?& ARRAY['id','label','type','expression']) OR jsonb_typeof(o->'label') IS DISTINCT FROM 'string' OR coalesce(o->>'id','')!~'^[a-z][a-z0-9_]{0,31}$' OR o->>'id'=ANY(output_ids) OR o->>'id' IN ('constructor','prototype') OR length(o->>'label') NOT BETWEEN 1 AND 80 THEN RETURN false;END IF;output_ids:=array_append(output_ids,o->>'id');r:=busy_app_function_private.expression(o->'expression',types,0);total:=total+(r->>'nodes')::integer;IF total>256 OR r->>'type' IS DISTINCT FROM o->>'type' THEN RETURN false;END IF;
  IF o->>'type'='number' THEN IF NOT(o ?& ARRAY['unit','decimals']) OR jsonb_typeof(o->'unit') IS DISTINCT FROM 'string' OR jsonb_typeof(o->'decimals') IS DISTINCT FROM 'number' OR (o->>'decimals')::numeric<>trunc((o->>'decimals')::numeric) OR o-ARRAY['id','label','type','unit','decimals','expression']<>'{}' OR length(o->>'unit') NOT BETWEEN 1 AND 32 OR (o->>'decimals')::integer NOT BETWEEN 0 AND 6 THEN RETURN false;END IF;ELSIF o-ARRAY['id','label','type','expression']<>'{}' THEN RETURN false;END IF;
 END LOOP;
 FOR c IN SELECT value FROM jsonb_array_elements(spec->'cases') LOOP
  IF NOT(c ?& ARRAY['label','inputs','expected']) OR jsonb_typeof(c->'label') IS DISTINCT FROM 'string' OR c-ARRAY['label','inputs','expected']<>'{}' OR length(c->>'label') NOT BETWEEN 1 AND 80 OR jsonb_typeof(c->'inputs')<>'object' OR (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(c->'inputs')k) IS DISTINCT FROM (SELECT array_agg(k ORDER BY k) FROM unnest(ids)k) THEN RETURN false;END IF;
  FOR f IN SELECT value FROM jsonb_array_elements(spec->'inputs') LOOP v:=c->'inputs'->(f->>'id');IF jsonb_typeof(v) IS DISTINCT FROM f->>'type' THEN RETURN false;END IF;IF f->>'type'='number' AND busy_app_function_private.number(v) NOT BETWEEN busy_app_function_private.number(f->'min') AND busy_app_function_private.number(f->'max') THEN RETURN false;END IF;END LOOP;
  results:='{}';FOR o IN SELECT value FROM jsonb_array_elements(spec->'outputs') LOOP v:=busy_app_function_private.evaluate(o->'expression',c->'inputs');IF o->>'type'='number' THEN n:=round(busy_app_function_private.number(v),(o->>'decimals')::integer);PERFORM busy_app_function_private.number(to_jsonb(n));v:=to_jsonb(n);END IF;results:=results||jsonb_build_object(o->>'id',v);END LOOP;IF results IS DISTINCT FROM c->'expected' THEN RETURN false;END IF;
 END LOOP;
 RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;

CREATE FUNCTION busy_app_function_private.utf16_length(s text) RETURNS integer LANGUAGE sql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$ SELECT length(s)+(SELECT count(*)::int FROM generate_series(1,length(s))i WHERE ascii(substr(s,i,1))>65535) $$;
CREATE FUNCTION busy_app_function_private.form_result(spec jsonb,vals jsonb) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$
DECLARE f jsonb;v jsonb;missing boolean;valid boolean:=true;o jsonb;outputs jsonb:=NULL;calc_values jsonb:='{}';n numeric;
BEGIN
 IF jsonb_typeof(vals) IS DISTINCT FROM 'object' OR octet_length(vals::text)>24000 OR EXISTS(SELECT 1 FROM jsonb_object_keys(vals)k WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(spec->'fields')x WHERE x->>'id'=k)) THEN RAISE EXCEPTION 'Bounded known form inputs required';END IF;
 FOR f IN SELECT value FROM jsonb_array_elements(spec->'fields') LOOP
  IF f ? 'when' AND (vals->(f->'when'->>'field')) IS DISTINCT FROM f->'when'->'equals' THEN CONTINUE;END IF;
  v:=vals->(f->>'id');missing:=v IS NULL OR v='null' OR jsonb_typeof(v)='string' AND btrim(v#>>'{}')='';
  IF missing THEN IF (f->>'required')::boolean OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(spec->'calculation'->'inputs','[]'))x WHERE x->>'id'=f->>'id') THEN valid:=false;END IF;CONTINUE;END IF;
  IF f->>'type'='number' THEN IF jsonb_typeof(v) IS DISTINCT FROM 'number' THEN valid:=false;ELSIF abs((v#>>'{}')::numeric)>1000000000 OR trunc((v#>>'{}')::numeric*1000000)<>(v#>>'{}')::numeric*1000000 THEN valid:=false;ELSE n:=busy_app_function_private.number(v);IF n NOT BETWEEN busy_app_function_private.number(f->'min') AND busy_app_function_private.number(f->'max') THEN valid:=false;END IF;END IF;
  ELSIF f->>'type'='text' THEN IF jsonb_typeof(v) IS DISTINCT FROM 'string' OR busy_app_function_private.utf16_length(v#>>'{}')>(f->>'maxLength')::int OR (v#>>'{}')~'[<>[:cntrl:]]' THEN valid:=false;END IF;
  ELSIF f->>'type'='boolean' THEN IF jsonb_typeof(v) IS DISTINCT FROM 'boolean' THEN valid:=false;END IF;
  ELSIF f->>'type'='choice' THEN IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(f->'options')x WHERE x->'value'=v) THEN valid:=false;END IF;END IF;
 END LOOP;
 IF valid AND spec->'calculation'<>'null' THEN
  FOR f IN SELECT value FROM jsonb_array_elements(spec->'calculation'->'inputs') LOOP calc_values:=calc_values||jsonb_build_object(f->>'id',vals->(f->>'id'));END LOOP;
  outputs:='{}';FOR o IN SELECT value FROM jsonb_array_elements(spec->'calculation'->'outputs') LOOP v:=busy_app_function_private.evaluate(o->'expression',calc_values);IF o->>'type'='number' THEN v:=to_jsonb(round(busy_app_function_private.number(v),(o->>'decimals')::int));END IF;outputs:=outputs||jsonb_build_object(o->>'id',v);END LOOP;
 END IF;
 RETURN jsonb_build_object('valid',valid,'outputs',outputs);
EXCEPTION WHEN division_by_zero OR numeric_value_out_of_range THEN RETURN jsonb_build_object('valid',false,'outputs',NULL);
END $$;
CREATE FUNCTION busy_app_function_private.validate_form(spec jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$
DECLARE f jsonb;p jsonb;o jsonb;c jsonb;r jsonb;seen jsonb:='{}';base text[]:=ARRAY['id','label','type','required','default'];allowed text[];
BEGIN
 IF jsonb_typeof(spec) IS DISTINCT FROM 'object' OR NOT(spec ?& ARRAY['version','kind','title','purpose','scope','fields','calculation','cases']) OR spec-ARRAY['version','kind','title','purpose','scope','fields','calculation','cases']<>'{}' OR spec->'version' IS DISTINCT FROM '1'::jsonb OR spec->>'kind' IS DISTINCT FROM 'private-form' OR octet_length(spec::text)>24000 OR jsonb_typeof(spec->'title') IS DISTINCT FROM 'string' OR busy_app_function_private.utf16_length(spec->>'title') NOT BETWEEN 1 AND 80 OR jsonb_typeof(spec->'purpose') IS DISTINCT FROM 'string' OR busy_app_function_private.utf16_length(spec->>'purpose') NOT BETWEEN 1 AND 240 OR (spec->>'title')~'[<>[:cntrl:]]' OR (spec->>'purpose')~'[<>[:cntrl:]]' THEN RETURN false;END IF;
 IF jsonb_typeof(spec->'fields') IS DISTINCT FROM 'array' OR jsonb_array_length(spec->'fields') NOT BETWEEN 1 AND 8 OR jsonb_typeof(spec->'cases') IS DISTINCT FROM 'array' OR jsonb_array_length(spec->'cases') NOT BETWEEN 1 AND 4 THEN RETURN false;END IF;
 FOR f IN SELECT value FROM jsonb_array_elements(spec->'fields') LOOP
  IF NOT(f ?& base) OR coalesce(f->>'id','')!~'^[a-z][a-z0-9_]{0,31}$' OR f->>'id' IN ('constructor','prototype') OR seen ? (f->>'id') OR jsonb_typeof(f->'label') IS DISTINCT FROM 'string' OR busy_app_function_private.utf16_length(f->>'label') NOT BETWEEN 1 AND 80 OR (f->>'label')~'[<>[:cntrl:]]' OR jsonb_typeof(f->'required') IS DISTINCT FROM 'boolean' OR coalesce(f->>'type','') NOT IN ('number','text','choice','boolean') THEN RETURN false;END IF;
  allowed:=base||ARRAY['when']||CASE f->>'type' WHEN 'number' THEN ARRAY['unit','min','max'] WHEN 'text' THEN ARRAY['maxLength'] WHEN 'choice' THEN ARRAY['options'] ELSE ARRAY[]::text[] END;
  IF f-allowed<>'{}' THEN RETURN false;END IF;
  IF f ? 'when' THEN p:=seen->(f->'when'->>'field');IF p IS NULL OR p ? 'when' OR NOT(f->'when' ?& ARRAY['field','equals']) OR (f->'when')-ARRAY['field','equals']<>'{}' OR p->>'type' NOT IN ('boolean','choice') OR p->>'type'='boolean' AND jsonb_typeof(f->'when'->'equals') IS DISTINCT FROM 'boolean' OR p->>'type'='choice' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p->'options')x WHERE x->'value'=f->'when'->'equals') THEN RETURN false;END IF;END IF;
  IF f->>'type'='number' THEN IF NOT(f ?& ARRAY['unit','min','max']) OR jsonb_typeof(f->'unit') IS DISTINCT FROM 'string' OR busy_app_function_private.utf16_length(f->>'unit') NOT BETWEEN 1 AND 32 OR busy_app_function_private.number(f->'min')>busy_app_function_private.number(f->'max') OR f->'default'<>'null' AND busy_app_function_private.number(f->'default') NOT BETWEEN busy_app_function_private.number(f->'min') AND busy_app_function_private.number(f->'max') THEN RETURN false;END IF;
  ELSIF f->>'type'='text' THEN IF jsonb_typeof(f->'maxLength') IS DISTINCT FROM 'number' OR (f->>'maxLength')::numeric<>trunc((f->>'maxLength')::numeric) OR (f->>'maxLength')::int NOT BETWEEN 1 AND 240 OR jsonb_typeof(f->'default') IS DISTINCT FROM 'string' OR busy_app_function_private.utf16_length(f->>'default')>(f->>'maxLength')::int THEN RETURN false;END IF;
  ELSIF f->>'type'='boolean' THEN IF jsonb_typeof(f->'default') IS DISTINCT FROM 'boolean' THEN RETURN false;END IF;
  ELSE
   IF jsonb_typeof(f->'options') IS DISTINCT FROM 'array' OR jsonb_array_length(f->'options') NOT BETWEEN 1 AND 8 OR (SELECT count(DISTINCT x->>'value') FROM jsonb_array_elements(f->'options')x)<>jsonb_array_length(f->'options') THEN RETURN false;END IF;
   FOR o IN SELECT value FROM jsonb_array_elements(f->'options') LOOP IF NOT(o ?& ARRAY['value','label']) OR o-ARRAY['value','label']<>'{}' OR coalesce(o->>'value','')!~'^[a-z][a-z0-9_]{0,31}$' OR o->>'value' IN ('constructor','prototype') OR jsonb_typeof(o->'label') IS DISTINCT FROM 'string' OR busy_app_function_private.utf16_length(o->>'label') NOT BETWEEN 1 AND 80 OR (o->>'label')~'[<>[:cntrl:]]' THEN RETURN false;END IF;END LOOP;
   IF f->'default'<>'""' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(f->'options')x WHERE x->'value'=f->'default') THEN RETURN false;END IF;
  END IF;
  seen:=seen||jsonb_build_object(f->>'id',f);
 END LOOP;
 IF spec->'calculation'<>'null' THEN
  IF busy_app_function_private.validate_calculation(spec->'calculation') IS NOT TRUE OR spec->'scope' IS DISTINCT FROM spec->'calculation'->'scope' THEN RETURN false;END IF;
  FOR f IN SELECT value FROM jsonb_array_elements(spec->'calculation'->'inputs') LOOP p:=seen->(f->>'id');IF p IS NULL OR p->'required' IS DISTINCT FROM 'true'::jsonb OR p ? 'when' OR p->>'type' IS DISTINCT FROM f->>'type' OR f->>'type'='number' AND (p->'min' IS DISTINCT FROM f->'min' OR p->'max' IS DISTINCT FROM f->'max' OR p->'unit' IS DISTINCT FROM f->'unit') THEN RETURN false;END IF;END LOOP;
 END IF;
 FOR c IN SELECT value FROM jsonb_array_elements(spec->'cases') LOOP
  IF NOT(c ?& ARRAY['label','values','valid','outputs']) OR c-ARRAY['label','values','valid','outputs']<>'{}' OR jsonb_typeof(c->'label') IS DISTINCT FROM 'string' OR busy_app_function_private.utf16_length(c->>'label') NOT BETWEEN 1 AND 80 OR jsonb_typeof(c->'valid') IS DISTINCT FROM 'boolean' THEN RETURN false;END IF;
  r:=busy_app_function_private.form_result(spec,c->'values');IF r->'valid' IS DISTINCT FROM c->'valid' OR r->'outputs' IS DISTINCT FROM c->'outputs' THEN RETURN false;END IF;
 END LOOP;RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;
CREATE OR REPLACE FUNCTION busy_app_function_private.validate(spec jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$ SELECT CASE WHEN spec->>'kind'='private-form' THEN busy_app_function_private.validate_form(spec) ELSE busy_app_function_private.validate_calculation(spec) END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA busy_app_function_private FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
