-- REVIEW ONLY. Isolated staging pnjdlogwegnqbsfpcofw; no hosted execution authorised.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PRIVATE FUNCTION REVIEW FUSE: separate staging approval required'; END $$;
SET LOCAL lock_timeout='5s';
CREATE SCHEMA busy_app_function_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA busy_app_function_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE busy_app_function_private.settings(id boolean PRIMARY KEY DEFAULT true CHECK(id),execution_closed boolean NOT NULL DEFAULT false);
INSERT INTO busy_app_function_private.settings VALUES(true,false);
ALTER TABLE busy_app_function_private.settings ENABLE ROW LEVEL SECURITY;
CREATE TABLE busy_app_function_private.heads(function_id uuid PRIMARY KEY,business_id uuid NOT NULL REFERENCES public.busy_businesses(id),app_id uuid NOT NULL REFERENCES public.busy_mini_apps(id),owner_id uuid NOT NULL REFERENCES auth.users(id),current_version integer NOT NULL CHECK(current_version BETWEEN 1 AND 16),revision bigint NOT NULL CHECK(revision>0),disabled boolean NOT NULL DEFAULT false,changed_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE INDEX ON busy_app_function_private.heads(business_id,app_id);
CREATE TABLE busy_app_function_private.versions(function_id uuid NOT NULL REFERENCES busy_app_function_private.heads(function_id),version integer NOT NULL CHECK(version BETWEEN 1 AND 16),business_id uuid NOT NULL,app_id uuid NOT NULL,owner_id uuid NOT NULL,source_app_revision bigint NOT NULL,spec jsonb NOT NULL,canonical_text text NOT NULL,spec_hash text NOT NULL CHECK(spec_hash~'^[a-f0-9]{64}$'),approved_by uuid NOT NULL,approved_at timestamptz NOT NULL DEFAULT clock_timestamp(),request_key uuid NOT NULL,PRIMARY KEY(function_id,version),UNIQUE(app_id,request_key),CHECK(approved_by=owner_id),CHECK(octet_length(canonical_text)<=24000),CHECK(canonical_text=spec::text),CHECK(spec_hash=encode(sha256(convert_to(canonical_text,'UTF8')),'hex')));
ALTER TABLE busy_app_function_private.heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE busy_app_function_private.versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA busy_app_function_private FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION busy_app_function_private.immutable() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$ BEGIN RAISE EXCEPTION 'Function versions and approvals are immutable' USING ERRCODE='42501'; END $$;
CREATE TRIGGER immutable_version BEFORE UPDATE OR DELETE ON busy_app_function_private.versions FOR EACH ROW EXECUTE FUNCTION busy_app_function_private.immutable();
CREATE FUNCTION busy_app_function_private.number(v jsonb) RETURNS numeric LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$ DECLARE n numeric; BEGIN IF jsonb_typeof(v) IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Numeric value required';END IF;n:=(v#>>'{}')::numeric;IF abs(n)>1000000000 OR trunc(n*1000000)<>n*1000000 THEN RAISE EXCEPTION 'Numeric range or precision';END IF;RETURN n;END $$;
CREATE FUNCTION busy_app_function_private.expression(e jsonb,inputs jsonb,depth integer) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$
DECLARE op text;types text[]:='{}';r jsonb;child jsonb;nodes integer:=1;t text;arity integer;
BEGIN
 IF depth>12 OR jsonb_typeof(e) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Bounded expression required';END IF;op:=e->>'op';
 IF op='input' THEN IF NOT(e ?& ARRAY['op','id']) OR e-ARRAY['op','id']<>'{}' OR NOT(inputs ? (e->>'id')) THEN RAISE EXCEPTION 'Unknown input';END IF;RETURN jsonb_build_object('type',inputs->> (e->>'id'),'nodes',1);END IF;
 IF op='literal' THEN IF NOT(e ?& ARRAY['op','value']) OR e-ARRAY['op','value']<>'{}' OR coalesce(jsonb_typeof(e->'value'),'') NOT IN ('number','boolean') THEN RAISE EXCEPTION 'Typed literal required';END IF;IF jsonb_typeof(e->'value')='number' THEN PERFORM busy_app_function_private.number(e->'value');END IF;RETURN jsonb_build_object('type',jsonb_typeof(e->'value'),'nodes',1);END IF;
 IF coalesce(op,'') NOT IN ('add','sub','mul','div','min','max','ceil','abs','lt','lte','eq','gte','gt','and','or','not','if') OR e-ARRAY['op','args']<>'{}' OR jsonb_typeof(e->'args') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Unknown operation';END IF;
 arity:=CASE WHEN op='if' THEN 3 WHEN op IN ('ceil','abs','not') THEN 1 ELSE 2 END;IF jsonb_array_length(e->'args')<>arity THEN RAISE EXCEPTION 'Wrong arity';END IF;
 FOR child IN SELECT value FROM jsonb_array_elements(e->'args') LOOP r:=busy_app_function_private.expression(child,inputs,depth+1);nodes:=nodes+(r->>'nodes')::integer;types:=array_append(types,r->>'type');IF nodes>256 THEN RAISE EXCEPTION 'Expression work limit';END IF;END LOOP;
 IF op='if' THEN IF types[1]<>'boolean' OR types[2]<>types[3] THEN RAISE EXCEPTION 'Conditional type mismatch';END IF;t:=types[2];
 ELSIF op IN ('and','or','not') THEN IF EXISTS(SELECT 1 FROM unnest(types)x WHERE x<>'boolean') THEN RAISE EXCEPTION 'Boolean operands required';END IF;t:='boolean';
 ELSE IF EXISTS(SELECT 1 FROM unnest(types)x WHERE x<>'number') THEN RAISE EXCEPTION 'Numeric operands required';END IF;t:=CASE WHEN op IN ('lt','lte','eq','gte','gt') THEN 'boolean' ELSE 'number' END;END IF;
 RETURN jsonb_build_object('type',t,'nodes',nodes);
END $$;
CREATE FUNCTION busy_app_function_private.evaluate(e jsonb,p_values jsonb) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$
DECLARE op text:=e->>'op';a jsonb;b jsonb;x numeric;y numeric;n numeric;
BEGIN
 IF op='input' THEN RETURN p_values->(e->>'id');ELSIF op='literal' THEN RETURN e->'value';END IF;
 IF op='if' THEN IF (busy_app_function_private.evaluate(e->'args'->0,p_values)#>>'{}')::boolean THEN RETURN busy_app_function_private.evaluate(e->'args'->1,p_values);ELSE RETURN busy_app_function_private.evaluate(e->'args'->2,p_values);END IF;END IF;
 a:=busy_app_function_private.evaluate(e->'args'->0,p_values);
 IF op='not' THEN RETURN to_jsonb(NOT (a#>>'{}')::boolean);END IF;
 IF op NOT IN ('ceil','abs') THEN b:=busy_app_function_private.evaluate(e->'args'->1,p_values);END IF;
 IF op='and' THEN RETURN to_jsonb((a#>>'{}')::boolean AND (b#>>'{}')::boolean);ELSIF op='or' THEN RETURN to_jsonb((a#>>'{}')::boolean OR (b#>>'{}')::boolean);END IF;
 x:=busy_app_function_private.number(a);IF b IS NOT NULL THEN y:=busy_app_function_private.number(b);END IF;
 IF op='lt' THEN RETURN to_jsonb(x<y);ELSIF op='lte' THEN RETURN to_jsonb(x<=y);ELSIF op='eq' THEN RETURN to_jsonb(x=y);ELSIF op='gte' THEN RETURN to_jsonb(x>=y);ELSIF op='gt' THEN RETURN to_jsonb(x>y);END IF;
 n:=CASE op WHEN 'ceil' THEN ceil(x) WHEN 'abs' THEN abs(x) WHEN 'add' THEN x+y WHEN 'sub' THEN x-y WHEN 'mul' THEN round(x*y,6) WHEN 'div' THEN round(x/y,6) WHEN 'min' THEN least(x,y) WHEN 'max' THEN greatest(x,y) ELSE NULL END;
 IF n IS NULL OR abs(n)>1000000000 THEN RAISE EXCEPTION 'Invalid or overflowing result';END IF;RETURN to_jsonb(n);
END $$;
CREATE FUNCTION busy_app_function_private.validate(spec jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$
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
CREATE FUNCTION public.busy_private_function_v1(p_business_id uuid,p_actor_id uuid,p_app_id uuid,p_action text,p_function_id uuid,p_version integer,p_expected_state bigint,p_expected_app bigint,p_request_key uuid,p_spec jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a public.busy_mini_apps%ROWTYPE;h busy_app_function_private.heads%ROWTYPE;v busy_app_function_private.versions%ROWTYPE;list jsonb;text_value text;next_version integer;
BEGIN
 IF p_actor_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=p_actor_id AND role='owner' FOR SHARE) THEN RAISE EXCEPTION 'Current owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO a FROM public.busy_mini_apps WHERE business_id=p_business_id AND id=p_app_id AND created_by=p_actor_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Original owned app required' USING ERRCODE='42501';END IF;
 IF p_action='list' THEN SELECT coalesce(jsonb_agg(jsonb_build_object('functionId',function_id,'version',current_version,'stateRevision',revision,'disabled',disabled) ORDER BY function_id),'[]') INTO list FROM busy_app_function_private.heads WHERE app_id=a.id AND business_id=p_business_id AND owner_id=p_actor_id;RETURN jsonb_build_object('functions',list,'appRevision',a.draft_revision);END IF;
 SELECT * INTO h FROM busy_app_function_private.heads WHERE function_id=p_function_id FOR UPDATE;
 IF FOUND AND (h.app_id<>a.id OR h.owner_id<>p_actor_id OR h.business_id<>p_business_id) THEN RAISE EXCEPTION 'Foreign function' USING ERRCODE='42501';END IF;
 IF p_action='save' THEN
  IF p_expected_app IS DISTINCT FROM a.draft_revision OR coalesce(h.revision,0) IS DISTINCT FROM p_expected_state OR p_version IS DISTINCT FROM coalesce(h.current_version,0) OR p_request_key IS NULL THEN RAISE EXCEPTION 'Stale approval or request' USING ERRCODE='40001';END IF;
  IF EXISTS(SELECT 1 FROM busy_app_function_private.versions WHERE app_id=a.id AND request_key=p_request_key) THEN RAISE EXCEPTION 'Request already recorded; inspect rather than replay' USING ERRCODE='40001';END IF;
  IF p_spec->'scope' IS DISTINCT FROM jsonb_build_object('ownerId',p_actor_id,'businessId',p_business_id,'projectId',a.id,'sourceRevision',a.draft_revision) OR busy_app_function_private.validate(p_spec) IS NOT TRUE THEN RAISE EXCEPTION 'Validated exact-source calculation required' USING ERRCODE='22023';END IF;
  next_version:=coalesce(h.current_version,0)+1;IF next_version>16 OR h.function_id IS NULL AND (SELECT count(*) FROM busy_app_function_private.heads WHERE app_id=a.id)>=8 THEN RAISE EXCEPTION 'Private function history limit';END IF;
  IF h.function_id IS NULL THEN INSERT INTO busy_app_function_private.heads VALUES(p_function_id,p_business_id,a.id,p_actor_id,1,1,false,clock_timestamp()) RETURNING * INTO h;ELSE UPDATE busy_app_function_private.heads SET current_version=next_version,revision=revision+1,disabled=false,changed_at=clock_timestamp() WHERE function_id=h.function_id RETURNING * INTO h;END IF;
  text_value:=p_spec::text;
  INSERT INTO busy_app_function_private.versions(function_id,version,business_id,app_id,owner_id,source_app_revision,spec,canonical_text,spec_hash,approved_by,request_key) VALUES(h.function_id,next_version,p_business_id,a.id,p_actor_id,a.draft_revision,p_spec,text_value,encode(sha256(convert_to(text_value,'UTF8')),'hex'),p_actor_id,p_request_key) RETURNING * INTO v;
 ELSIF p_action='disable' THEN
  IF h.function_id IS NULL OR p_expected_app IS DISTINCT FROM a.draft_revision OR p_expected_state IS DISTINCT FROM h.revision OR p_version IS DISTINCT FROM h.current_version OR h.disabled THEN RAISE EXCEPTION 'Stale disable review' USING ERRCODE='40001';END IF;UPDATE busy_app_function_private.heads SET disabled=true,revision=revision+1,changed_at=clock_timestamp() WHERE function_id=h.function_id RETURNING * INTO h;
 ELSIF p_action IS DISTINCT FROM 'read' THEN RAISE EXCEPTION 'Unsupported private operation';END IF;
 IF h.function_id IS NULL THEN RAISE EXCEPTION 'Function unavailable';END IF;
 SELECT * INTO v FROM busy_app_function_private.versions WHERE function_id=h.function_id AND version=CASE WHEN p_action='save' THEN h.current_version ELSE p_version END;
 IF NOT FOUND OR v.spec_hash<>encode(sha256(convert_to(v.spec::text,'UTF8')),'hex') THEN RAISE EXCEPTION 'Artifact integrity failure';END IF;
 RETURN jsonb_build_object('artifact',to_jsonb(v),'stateRevision',h.revision,'currentVersion',h.current_version,'appRevision',a.draft_revision,'status',CASE WHEN (SELECT execution_closed FROM busy_app_function_private.settings WHERE id) THEN 'locked' WHEN h.disabled THEN 'disabled' WHEN v.version<>h.current_version THEN 'superseded' ELSE 'accepted_private' END,'publicExecution',false);
END $$;
ALTER FUNCTION public.busy_private_function_v1(uuid,uuid,uuid,text,uuid,integer,bigint,bigint,uuid,jsonb) OWNER TO postgres;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA busy_app_function_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.busy_private_function_v1(uuid,uuid,uuid,text,uuid,integer,bigint,bigint,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_private_function_v1(uuid,uuid,uuid,text,uuid,integer,bigint,bigint,uuid,jsonb) TO service_role;
COMMIT;
