-- Canonical Work private extension, not a job/CRM database or hosted installation.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'ENQUIRY PREPARATION REVIEW FUSE: separate hosted approval required'; END $$;
CREATE TABLE busy_work_private.enquiry_preparation_settings(id boolean PRIMARY KEY DEFAULT true CHECK(id),closed boolean NOT NULL DEFAULT true);
INSERT INTO busy_work_private.enquiry_preparation_settings VALUES(true,true);
CREATE TABLE busy_work_private.enquiry_preparations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),business_id uuid NOT NULL REFERENCES public.busy_businesses(id) ON DELETE RESTRICT,customer_id text NOT NULL CHECK(length(customer_id) BETWEEN 1 AND 240),enquiry_id text NOT NULL CHECK(length(enquiry_id) BETWEEN 1 AND 240),owner_id uuid NOT NULL,
 revision bigint NOT NULL CHECK(revision>0),plan jsonb CHECK(plan IS NULL OR busy_work_private.valid_preparation(plan)),history jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(history)='array' AND jsonb_array_length(history)<=5),operations text[] NOT NULL CHECK(cardinality(operations) BETWEEN 1 AND 512),
 original_context jsonb NOT NULL CHECK(jsonb_typeof(original_context)='object' AND octet_length(original_context::text)<=64000),source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),customer_hash text NOT NULL CHECK(customer_hash ~ '^[a-f0-9]{64}$'),reviewed_snapshot_revision bigint NOT NULL CHECK(reviewed_snapshot_revision>0),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(business_id,customer_id,enquiry_id,owner_id)
);
ALTER TABLE busy_work_private.enquiry_preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE busy_work_private.enquiry_preparation_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON busy_work_private.enquiry_preparations,busy_work_private.enquiry_preparation_settings FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION busy_work_private.lock_enquiry_preparation(b uuid,c text,e text,a uuid) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE role text;s bigint;
BEGIN
 SELECT m.role INTO role FROM public.busy_business_memberships m WHERE business_id=b AND user_id=a FOR SHARE;
 IF a IS NULL OR role IS DISTINCT FROM 'owner' OR c IS NULL OR e IS NULL OR length(c) NOT BETWEEN 1 AND 240 OR length(e) NOT BETWEEN 1 AND 240 THEN RAISE EXCEPTION 'Current exact owner source required';END IF;
 SELECT revision INTO s FROM public.busy_business_snapshots WHERE business_id=b FOR SHARE;IF s IS NULL THEN RAISE EXCEPTION 'Original source unavailable';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(b::text||':'||a::text||':'||c||':'||e,0));RETURN s;
END $$;
-- Owner-only continuity marker survives retaining lockdown. It exposes no plan.
CREATE FUNCTION public.busy_work_enquiry_plan_marker_v1(b uuid,c text,e text,a uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN PERFORM busy_work_private.lock_enquiry_preparation(b,c,e,a);RETURN jsonb_build_object('existingEnquiryPlan',EXISTS(SELECT 1 FROM busy_work_private.enquiry_preparations WHERE business_id=b AND customer_id=c AND enquiry_id=e AND owner_id=a AND plan IS NOT NULL));END $$;
REVOKE ALL ON FUNCTION public.busy_work_enquiry_plan_marker_v1(uuid,text,text,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_work_enquiry_plan_marker_v1(uuid,text,text,uuid) TO service_role;
ALTER FUNCTION public.busy_work_enquiry_plan_marker_v1(uuid,text,text,uuid) OWNER TO postgres;
CREATE FUNCTION public.busy_work_enquiry_preparation_v1(b uuid,c text,e text,a uuid,mode text,snap bigint,expected bigint,context jsonb,p jsonb,op text,app jsonb,quote jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE current_snapshot bigint;r busy_work_private.enquiry_preparations%ROWTYPE;q public.business_work_engagements%ROWTYPE;s jsonb;old jsonb;prev text;next_history jsonb;changed boolean;result jsonb;app_basis jsonb;
BEGIN
 IF (SELECT closed FROM busy_work_private.preparation_settings WHERE id FOR SHARE) IS DISTINCT FROM false OR (SELECT closed FROM busy_work_private.enquiry_preparation_settings WHERE id FOR SHARE) IS DISTINCT FROM false THEN RAISE EXCEPTION 'Enquiry preparation is closed';END IF;
 IF mode IS NULL OR mode NOT IN ('basis','read','save','undo','review_source','preview') THEN RAISE EXCEPTION 'Unsupported private operation';END IF;
 current_snapshot:=busy_work_private.lock_enquiry_preparation(b,c,e,a);
 SELECT * INTO r FROM busy_work_private.enquiry_preparations WHERE business_id=b AND customer_id=c AND enquiry_id=e AND owner_id=a FOR UPDATE;
 SELECT * INTO q FROM public.business_work_engagements WHERE business_id=b AND customer_id=c AND enquiry_id=e AND created_by=a AND preparation_plan IS NOT NULL LIMIT 1;
 IF mode='basis' THEN RETURN jsonb_build_object('snapshotRevision',current_snapshot,'existingQuotePlan',q.id IS NOT NULL,'existingEnquiryPlan',r.plan IS NOT NULL,'preparationId',r.id);END IF;
 -- Context is supplied ONLY by the original authenticated source-review RPC in
 -- the trusted service; source snapshot CAS preserves that review until commit.
 IF snap IS NULL OR snap<>current_snapshot OR context->>'businessId' IS DISTINCT FROM b::text OR context->>'ownerId' IS DISTINCT FROM a::text OR context->>'customerId' IS DISTINCT FROM c OR context->>'enquiryId' IS DISTINCT FROM e OR context->'snapshotRevision' IS DISTINCT FROM to_jsonb(snap) OR coalesce(context->>'sourceHash','')!~'^[a-f0-9]{64}$' OR coalesce(context->>'customerHash','')!~'^[a-f0-9]{64}$' OR jsonb_typeof(context->'enquiry') IS DISTINCT FROM 'object' OR octet_length(context::text)>64000 THEN RAISE EXCEPTION 'Original reviewed filed source required';END IF;
 IF quote IS NOT NULL THEN
  IF jsonb_typeof(quote)<>'object' OR quote-ARRAY['id','revision']<>'{}' THEN RAISE EXCEPTION 'Exact quote reference required';END IF;
  SELECT * INTO q FROM public.business_work_engagements WHERE business_id=b AND customer_id=c AND enquiry_id=e AND created_by=a AND id=(quote->>'id')::uuid FOR SHARE;
  IF NOT FOUND OR q.kind<>'quote' OR q.status<>'Prepared' OR to_jsonb(q.revision) IS DISTINCT FROM quote->'revision' OR q.source_hash IS DISTINCT FROM context->>'sourceHash' OR q.customer_hash IS DISTINCT FROM context->>'customerHash' THEN RAISE EXCEPTION 'Quote reference changed or is unrelated';END IF;
 END IF;
 changed:=r.id IS NOT NULL AND (r.source_hash IS DISTINCT FROM context->>'sourceHash' OR r.customer_hash IS DISTINCT FROM context->>'customerHash');
 IF mode IN ('save','undo','review_source') THEN
  IF expected IS NULL OR expected<>coalesce(r.revision,0) OR op IS NULL OR op !~ '^work_[a-f0-9-]{36}$' OR op=ANY(coalesce(r.operations,'{}')) OR cardinality(coalesce(r.operations,'{}'))>=512 THEN RAISE EXCEPTION 'Private revision/nonce conflict';END IF;
  IF mode<>'review_source' AND changed THEN RAISE EXCEPTION 'Review the changed enquiry before editing its plan';END IF;
  IF EXISTS(SELECT 1 FROM public.business_work_engagements WHERE business_id=b AND customer_id=c AND enquiry_id=e AND created_by=a AND preparation_plan IS NOT NULL) THEN RAISE EXCEPTION 'Continue the original quote plan; never duplicate mutable progress';END IF;
  IF mode='review_source' THEN IF r.id IS NULL OR p IS NOT NULL THEN RAISE EXCEPTION 'Existing source review required';END IF;p:=r.plan;next_history:=r.history;
  ELSIF mode='undo' THEN IF r.id IS NULL OR p IS NOT NULL OR jsonb_array_length(r.history)=0 THEN RAISE EXCEPTION 'No reviewed undo';END IF;p:=r.history->0;IF p='null' THEN p:=NULL;END IF;next_history:=r.history-0;
  ELSE
   IF busy_work_private.valid_preparation(p) IS DISTINCT FROM true THEN RAISE EXCEPTION 'Unsupported finite plan';END IF;
   FOR s IN SELECT value FROM jsonb_array_elements(p->'stages') LOOP
    SELECT value INTO old FROM jsonb_array_elements(coalesce(r.plan->'stages','[]')) WHERE value->>'id'=s->>'id';prev:=coalesce(old->>'status','todo');
    IF prev='todo' AND s->>'status'='done' OR prev='done' AND s->>'status'='todo' THEN RAISE EXCEPTION 'Intermediate private stage review required';END IF;
   END LOOP;
   SELECT coalesce(jsonb_agg(value ORDER BY n),'[]') INTO next_history FROM jsonb_array_elements(jsonb_build_array(r.plan)||coalesce(r.history,'[]')) WITH ORDINALITY x(value,n) WHERE n<=5;
  END IF;
  IF r.id IS NULL THEN
   INSERT INTO busy_work_private.enquiry_preparations(business_id,customer_id,enquiry_id,owner_id,revision,plan,history,operations,original_context,source_hash,customer_hash,reviewed_snapshot_revision) VALUES(b,c,e,a,1,p,next_history,ARRAY[op],context,context->>'sourceHash',context->>'customerHash',snap) RETURNING * INTO r;
  ELSE UPDATE busy_work_private.enquiry_preparations SET revision=revision+1,plan=p,history=next_history,operations=array_append(operations,op),source_hash=context->>'sourceHash',customer_hash=context->>'customerHash',reviewed_snapshot_revision=snap WHERE id=r.id RETURNING * INTO r;END IF;
  RETURN jsonb_build_object('businessId',b,'customerId',c,'enquiryId',e,'ownerId',a,'preparationId',r.id,'revision',r.revision,'operationId',op,'ownOperationReceipt',true,'targetKind','filed_enquiry','lifecycle','owner_private_preparation','privateOnly',true);
 END IF;
 IF mode='preview' THEN
  IF r.plan IS NULL OR changed OR expected IS DISTINCT FROM r.revision OR jsonb_typeof(app) IS DISTINCT FROM 'object' OR app-ARRAY['id','revision']<>'{}' THEN RAISE EXCEPTION 'Current reviewed App/plan required';END IF;
  -- Reuse the ORIGINAL finite owner/App authority, never raw service table reads.
  app_basis:=public.busy_private_function_v1(b,a,(app->>'id')::uuid,'list',NULL,NULL,NULL,NULL,NULL,NULL);
  IF app_basis->'appRevision' IS DISTINCT FROM app->'revision' THEN RAISE EXCEPTION 'App revision changed';END IF;
 END IF;
 RETURN jsonb_build_object('businessId',b,'customerId',c,'enquiryId',e,'ownerId',a,'preparationId',r.id,'revision',coalesce(r.revision,0),'snapshotRevision',snap,'plan',r.plan,'canUndo',coalesce(jsonb_array_length(r.history)>0,false),'undoPlan',r.history->0,'needsSourceReview',changed,'originalContext',r.original_context,'sourceContext',context,'existingQuotePlan',q.preparation_plan IS NOT NULL,'targetKind','filed_enquiry','lifecycle','owner_private_preparation','privateOnly',true,'notOwnReceipt',true)||CASE WHEN mode='preview' THEN jsonb_build_object('displayOnly',true,'appId',app->'id','appRevision',app->'revision') ELSE '{}' END;
END $$;
-- Preserve immutable original enquiry identity/history even after source review.
CREATE FUNCTION busy_work_private.protect_enquiry_preparation() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
BEGIN IF ROW(NEW.id,NEW.business_id,NEW.customer_id,NEW.enquiry_id,NEW.owner_id,NEW.original_context,NEW.created_at) IS DISTINCT FROM ROW(OLD.id,OLD.business_id,OLD.customer_id,OLD.enquiry_id,OLD.owner_id,OLD.original_context,OLD.created_at) THEN RAISE EXCEPTION 'Immutable original preparation source';END IF;RETURN NEW;END $$;
CREATE TRIGGER busy_enquiry_preparation_identity BEFORE UPDATE ON busy_work_private.enquiry_preparations FOR EACH ROW EXECUTE FUNCTION busy_work_private.protect_enquiry_preparation();
-- One mutable progress owner per exact source. Old quote-only plans still work;
-- an enquiry-first plan can be referenced from a quote, never cloned into it.
ALTER FUNCTION public.busy_work_preparation_write_v1(uuid,text,uuid,uuid,bigint,bigint,bigint,jsonb,text,text) RENAME TO busy_work_preparation_quote_original_v1;
REVOKE ALL ON FUNCTION public.busy_work_preparation_quote_original_v1(uuid,text,uuid,uuid,bigint,bigint,bigint,jsonb,text,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.busy_work_preparation_write_v1(b uuid,c text,e uuid,a uuid,q bigint,snap bigint,expected bigint,p jsonb,op text,mode text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE enquiry text;
BEGIN
 SELECT enquiry_id INTO enquiry FROM public.business_work_engagements WHERE business_id=b AND customer_id=c AND id=e AND created_by=a;
 PERFORM busy_work_private.lock_enquiry_preparation(b,c,enquiry,a);
 IF EXISTS(SELECT 1 FROM busy_work_private.enquiry_preparations WHERE business_id=b AND customer_id=c AND enquiry_id=enquiry AND owner_id=a AND plan IS NOT NULL) THEN RAISE EXCEPTION 'Continue the original enquiry plan; no duplicate progress';END IF;
 RETURN public.busy_work_preparation_quote_original_v1(b,c,e,a,q,snap,expected,p,op,mode);
END $$;
REVOKE ALL ON FUNCTION busy_work_private.lock_enquiry_preparation(uuid,text,text,uuid),busy_work_private.protect_enquiry_preparation(),public.busy_work_enquiry_preparation_v1(uuid,text,text,uuid,text,bigint,bigint,jsonb,jsonb,text,jsonb,jsonb),public.busy_work_preparation_write_v1(uuid,text,uuid,uuid,bigint,bigint,bigint,jsonb,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_work_enquiry_preparation_v1(uuid,text,text,uuid,text,bigint,bigint,jsonb,jsonb,text,jsonb,jsonb),public.busy_work_preparation_write_v1(uuid,text,uuid,uuid,bigint,bigint,bigint,jsonb,text,text) TO service_role;
ALTER TABLE busy_work_private.enquiry_preparation_settings OWNER TO postgres;
ALTER TABLE busy_work_private.enquiry_preparations OWNER TO postgres;
ALTER FUNCTION busy_work_private.lock_enquiry_preparation(uuid,text,text,uuid) OWNER TO postgres;
ALTER FUNCTION busy_work_private.protect_enquiry_preparation() OWNER TO postgres;
ALTER FUNCTION public.busy_work_enquiry_preparation_v1(uuid,text,text,uuid,text,bigint,bigint,jsonb,jsonb,text,jsonb,jsonb) OWNER TO postgres;
ALTER FUNCTION public.busy_work_preparation_write_v1(uuid,text,uuid,uuid,bigint,bigint,bigint,jsonb,text,text) OWNER TO postgres;
COMMIT;
