-- Separate review candidate; never install into hosted storage without approval.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'WORK PREPARATION REVIEW FUSE: separate hosted approval required'; END $$;
CREATE TABLE busy_work_private.preparation_settings(id boolean PRIMARY KEY DEFAULT true CHECK(id),closed boolean NOT NULL DEFAULT true);
INSERT INTO busy_work_private.preparation_settings VALUES(true,true);
REVOKE ALL ON busy_work_private.preparation_settings FROM PUBLIC,anon,authenticated,service_role;
ALTER TABLE busy_work_private.preparation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_work_engagements ADD COLUMN preparation_plan jsonb,ADD COLUMN preparation_revision bigint NOT NULL DEFAULT 0 CHECK(preparation_revision>=0),ADD COLUMN preparation_quote_revision bigint,ADD COLUMN preparation_operation text,ADD COLUMN preparation_operations text[] NOT NULL DEFAULT '{}' CHECK(cardinality(preparation_operations)<=512),ADD COLUMN preparation_history jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(preparation_history)='array' AND jsonb_array_length(preparation_history)<=5);
CREATE FUNCTION busy_work_private.valid_preparation(p jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$
DECLARE s jsonb;i jsonb;ids text[]:='{}';curr integer:=0;
BEGIN
 IF p IS NULL OR jsonb_typeof(p)<>'object' OR p-ARRAY['version','title','stages']<>'{}' OR p->'version' IS DISTINCT FROM '1'::jsonb OR jsonb_typeof(p->'title') IS DISTINCT FROM 'string' OR length(btrim(p->>'title')) NOT BETWEEN 1 AND 100 OR p->>'title' ~ '[[:cntrl:]]' OR jsonb_typeof(p->'stages') IS DISTINCT FROM 'array' OR octet_length(p::text)>24000 THEN RETURN false;END IF;
 IF jsonb_array_length(p->'stages') NOT BETWEEN 1 AND 8 THEN RETURN false;END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(p->'stages') LOOP
  IF jsonb_typeof(s)<>'object' OR s-ARRAY['id','title','status','items']<>'{}' OR jsonb_typeof(s->'id') IS DISTINCT FROM 'string' OR (s->>'id') !~ '^[a-z][a-z0-9_-]{0,31}$' OR s->>'id'=ANY(ids) OR jsonb_typeof(s->'title') IS DISTINCT FROM 'string' OR length(btrim(s->>'title')) NOT BETWEEN 1 AND 80 OR s->>'title' ~ '[[:cntrl:]]' OR jsonb_typeof(s->'status') IS DISTINCT FROM 'string' OR s->>'status' NOT IN ('todo','current','done') OR jsonb_typeof(s->'items') IS DISTINCT FROM 'array' THEN RETURN false;END IF;
  ids:=array_append(ids,s->>'id');IF s->>'status'='current' THEN curr:=curr+1;END IF;
  IF curr>1 OR jsonb_array_length(s->'items') NOT BETWEEN 1 AND 12 THEN RETURN false;END IF;
  FOR i IN SELECT value FROM jsonb_array_elements(s->'items') LOOP
   IF jsonb_typeof(i)<>'object' OR i-ARRAY['id','text','done']<>'{}' OR jsonb_typeof(i->'id') IS DISTINCT FROM 'string' OR (i->>'id') !~ '^[a-z][a-z0-9_-]{0,31}$' OR i->>'id'=ANY(ids) OR jsonb_typeof(i->'text') IS DISTINCT FROM 'string' OR length(btrim(i->>'text')) NOT BETWEEN 1 AND 240 OR i->>'text' ~ '[[:cntrl:]]' OR jsonb_typeof(i->'done') IS DISTINCT FROM 'boolean' OR (s->>'status'='done' AND i->'done'<>'true') THEN RETURN false;END IF;ids:=array_append(ids,i->>'id');
  END LOOP;
 END LOOP;
 RETURN true;
END $$;
ALTER TABLE public.business_work_engagements ADD CONSTRAINT busy_work_preparation_valid CHECK(preparation_plan IS NULL OR busy_work_private.valid_preparation(preparation_plan));
-- Original authenticated source_review is required BEFORE this service-only call.
-- Exact snapshot CAS locks that reviewed source across this transaction; no client
-- identity/hash can replace the independently authenticated source review.
CREATE FUNCTION busy_work_private.preparation_target(b uuid,c text,e uuid,a uuid,q bigint,snap bigint) RETURNS public.business_work_engagements LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE;role text;rev bigint;
BEGIN
 IF (SELECT closed FROM busy_work_private.preparation_settings WHERE id FOR SHARE) IS DISTINCT FROM false THEN RAISE EXCEPTION 'Private preparation is closed';END IF;
 SELECT m.role INTO role FROM public.busy_business_memberships m WHERE business_id=b AND user_id=a FOR SHARE;
 IF a IS NULL OR role IS DISTINCT FROM 'owner' THEN RAISE EXCEPTION 'Current owner required' USING ERRCODE='42501';END IF;
 SELECT revision INTO rev FROM public.busy_business_snapshots WHERE business_id=b FOR SHARE;
 IF snap IS NULL OR rev IS DISTINCT FROM snap THEN RAISE EXCEPTION 'Reviewed source changed' USING ERRCODE='40001';END IF;
 SELECT * INTO r FROM public.business_work_engagements WHERE business_id=b AND customer_id=c AND id=e FOR UPDATE;
 IF NOT FOUND OR r.created_by<>a OR r.kind<>'quote' OR r.status<>'Prepared' OR q IS NULL OR r.revision IS DISTINCT FROM q THEN RAISE EXCEPTION 'Exact private Prepared quote required' USING ERRCODE='40001';END IF;
 RETURN r;
END $$;
CREATE FUNCTION public.busy_work_preparation_read_v1(b uuid,c text,e uuid,a uuid,q bigint,snap bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE:=busy_work_private.preparation_target(b,c,e,a,q,snap);
BEGIN RETURN jsonb_build_object('businessId',b,'customerId',c,'engagementId',e,'enquiryId',r.enquiry_id,'ownerId',a,'quoteRevision',r.revision,'snapshotRevision',snap,'revision',r.preparation_revision,'plan',r.preparation_plan,'needsReview',r.preparation_plan IS NOT NULL AND r.preparation_quote_revision IS DISTINCT FROM r.revision,'canUndo',jsonb_array_length(r.preparation_history)>0,'undoPlan',r.preparation_history->0,'privateOnly',true,'businessStatus','Prepared','notOwnReceipt',true);END $$;
CREATE FUNCTION public.busy_work_preparation_write_v1(b uuid,c text,e uuid,a uuid,q bigint,snap bigint,expected bigint,p jsonb,op text,mode text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE:=busy_work_private.preparation_target(b,c,e,a,q,snap);old jsonb;s jsonb;prev text;next_history jsonb;
BEGIN
 IF expected IS NULL OR expected<>r.preparation_revision OR op IS NULL OR op !~ '^[A-Za-z0-9_-]{8,120}$' OR op=ANY(r.preparation_operations) OR cardinality(r.preparation_operations)>=512 OR mode IS NULL OR mode NOT IN ('save','undo') THEN RAISE EXCEPTION 'Preparation revision or approval conflict' USING ERRCODE='40001';END IF;
 IF mode='undo' THEN
  IF p IS NOT NULL OR jsonb_array_length(r.preparation_history)=0 THEN RAISE EXCEPTION 'No reviewed undo';END IF;p:=r.preparation_history->0;IF p='null' THEN p:=NULL;END IF;
  next_history:=r.preparation_history-0;
 ELSE
  IF busy_work_private.valid_preparation(p) IS DISTINCT FROM true THEN RAISE EXCEPTION 'Unsupported preparation';END IF;
  FOR s IN SELECT value FROM jsonb_array_elements(p->'stages') LOOP
   SELECT value INTO old FROM jsonb_array_elements(coalesce(r.preparation_plan->'stages','[]')) WHERE value->>'id'=s->>'id';prev:=coalesce(old->>'status','todo');
   IF (prev='todo' AND s->>'status'='done') OR (prev='done' AND s->>'status'='todo') THEN RAISE EXCEPTION 'Review the intermediate preparation stage';END IF;
  END LOOP;
  SELECT coalesce(jsonb_agg(value ORDER BY n),'[]') INTO next_history FROM jsonb_array_elements(jsonb_build_array(r.preparation_plan)||r.preparation_history) WITH ORDINALITY x(value,n) WHERE n<=5;
 END IF;
 UPDATE public.business_work_engagements SET preparation_plan=p,preparation_revision=expected+1,preparation_quote_revision=q,preparation_operation=op,preparation_operations=array_append(preparation_operations,op),preparation_history=next_history WHERE id=e;
 RETURN jsonb_build_object('businessId',b,'customerId',c,'engagementId',e,'ownerId',a,'quoteRevision',q,'revision',expected+1,'operationId',op,'privateOnly',true,'businessStatus','Prepared','ownOperationReceipt',true);
END $$;
REVOKE ALL ON FUNCTION busy_work_private.valid_preparation(jsonb),busy_work_private.preparation_target(uuid,text,uuid,uuid,bigint,bigint),public.busy_work_preparation_read_v1(uuid,text,uuid,uuid,bigint,bigint),public.busy_work_preparation_write_v1(uuid,text,uuid,uuid,bigint,bigint,bigint,jsonb,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_work_preparation_read_v1(uuid,text,uuid,uuid,bigint,bigint),public.busy_work_preparation_write_v1(uuid,text,uuid,uuid,bigint,bigint,bigint,jsonb,text,text) TO service_role;
ALTER TABLE busy_work_private.preparation_settings OWNER TO postgres;
ALTER FUNCTION busy_work_private.valid_preparation(jsonb) OWNER TO postgres;
ALTER FUNCTION busy_work_private.preparation_target(uuid,text,uuid,uuid,bigint,bigint) OWNER TO postgres;
ALTER FUNCTION public.busy_work_preparation_read_v1(uuid,text,uuid,uuid,bigint,bigint) OWNER TO postgres;
ALTER FUNCTION public.busy_work_preparation_write_v1(uuid,text,uuid,uuid,bigint,bigint,bigint,jsonb,text,text) OWNER TO postgres;
COMMIT;
