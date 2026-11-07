-- Review candidate only: after private artifacts/screens and canonical Work preparation proposals.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'OPERATIONAL SCREEN REVIEW FUSE: separate hosted approval required'; END $$;
SET LOCAL lock_timeout='5s';
CREATE TABLE busy_app_function_private.operational_settings(id boolean PRIMARY KEY DEFAULT true CHECK(id),closed boolean NOT NULL DEFAULT true);
INSERT INTO busy_app_function_private.operational_settings VALUES(true,true);
-- A finite private App placement extension, never a customer screen or copied Work plan.
CREATE TABLE busy_app_function_private.operational_heads(app_id uuid PRIMARY KEY REFERENCES public.busy_mini_apps(id),business_id uuid NOT NULL,owner_id uuid NOT NULL,revision integer NOT NULL CHECK(revision BETWEEN 1 AND 32));
CREATE TABLE busy_app_function_private.operational_versions(app_id uuid NOT NULL REFERENCES busy_app_function_private.operational_heads(app_id),revision integer NOT NULL,app_revision bigint NOT NULL CHECK(app_revision>0),binding jsonb,approved_by uuid NOT NULL,request_key uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(app_id,revision),UNIQUE(app_id,request_key),CHECK(binding IS NULL OR octet_length(binding::text)<=4000));
CREATE TRIGGER operational_immutable BEFORE UPDATE OR DELETE ON busy_app_function_private.operational_versions FOR EACH ROW EXECUTE FUNCTION busy_app_function_private.immutable();
ALTER TABLE busy_app_function_private.operational_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE busy_app_function_private.operational_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE busy_app_function_private.operational_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON busy_app_function_private.operational_settings,busy_app_function_private.operational_heads,busy_app_function_private.operational_versions FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.busy_private_operational_v1(b uuid,a uuid,app uuid,mode text,app_rev bigint,expected integer,request uuid,selection jsonb,context jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE basis jsonb;h busy_app_function_private.operational_heads%ROWTYPE;v busy_app_function_private.operational_versions%ROWTYPE;w jsonb;target jsonb;current_snapshot bigint;stored jsonb;
BEGIN
 IF (SELECT closed FROM busy_app_function_private.operational_settings WHERE id FOR SHARE) IS DISTINCT FROM false THEN RAISE EXCEPTION 'Operational placement closed';END IF;
 IF mode IS NULL OR mode NOT IN ('read','save','remove','check') THEN RAISE EXCEPTION 'Finite private operation required';END IF;
 -- Original App authority independently checks current membership/creator and private eligibility.
 basis:=public.busy_private_function_v1(b,a,app,'list',NULL,NULL,NULL,NULL,NULL,NULL);
 IF app_rev IS NULL OR basis->'appRevision' IS DISTINCT FROM to_jsonb(app_rev) THEN RAISE EXCEPTION 'Current App review required';END IF;
 -- Serialise placement changes on the original App (including first placement).
 PERFORM 1 FROM public.busy_mini_apps WHERE id=app AND business_id=b AND created_by=a FOR UPDATE;
 SELECT * INTO h FROM busy_app_function_private.operational_heads WHERE app_id=app FOR UPDATE;
 IF h.app_id IS NOT NULL AND (h.business_id<>b OR h.owner_id<>a) THEN RAISE EXCEPTION 'Wrong original owner';END IF;
 SELECT * INTO v FROM busy_app_function_private.operational_versions WHERE app_id=app AND revision=h.revision;
 IF mode='read' THEN
  RETURN jsonb_build_object('businessId',b,'ownerId',a,'appId',app,'appRevision',app_rev,'revision',coalesce(h.revision,0),'binding',v.binding,'status',CASE WHEN v.binding IS NULL THEN 'empty' WHEN v.app_revision<>app_rev THEN 'needs_review' ELSE 'accepted_private' END,'privateOnly',true,'notOwnReceipt',true);
 END IF;
 IF expected IS NULL OR expected<>coalesce(h.revision,0) THEN RAISE EXCEPTION 'Placement changed';END IF;
 IF mode='check' THEN
  IF v.binding IS NULL OR v.app_revision<>app_rev THEN RAISE EXCEPTION 'Re-review the App placement';END IF;target:=v.binding;
 ELSE target:=selection;END IF;
 IF mode<>'remove' THEN
  IF jsonb_typeof(target) IS DISTINCT FROM 'object' OR NOT(target ?& ARRAY['version','screenId','source','preparationId','reviewedRevision','snapshotRevision']) OR target-ARRAY['version','screenId','source','preparationId','reviewedRevision','snapshotRevision','sourceHash','customerHash']<>'{}' OR target->'version' IS DISTINCT FROM '1'::jsonb OR target->>'screenId' NOT IN ('business_profile','services','contact') OR jsonb_typeof(target->'source') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Typed original Work placement required';END IF;
  IF NOT EXISTS(SELECT 1 FROM public.busy_mini_apps x CROSS JOIN LATERAL jsonb_array_elements(x.draft_config->'modules') m WHERE x.id=app AND m->>'key'=target->>'screenId' AND m->'enabled'='true') THEN RAISE EXCEPTION 'Supported original screen required';END IF;
  stored:=target->'source';
  IF stored->>'targetKind'='filed_enquiry' AND stored-ARRAY['targetKind','customerId','enquiryId']='{}' THEN
   current_snapshot:=busy_work_private.lock_enquiry_preparation(b,stored->>'customerId',stored->>'enquiryId',a);
   w:=public.busy_work_enquiry_preparation_v1(b,stored->>'customerId',stored->>'enquiryId',a,'read',current_snapshot,NULL,context,NULL,NULL,NULL,NULL);
   IF w->'existingQuotePlan'='true' OR w->'needsSourceReview'='true' OR w->'plan'='null' OR w->>'preparationId' IS DISTINCT FROM target->>'preparationId' THEN RAISE EXCEPTION 'Eligible exact enquiry plan required';END IF;
  ELSIF stored->>'targetKind'='prepared_quote' AND stored-ARRAY['targetKind','customerId','engagementId','quoteRevision']='{}' THEN
   current_snapshot:=busy_work_private.lock_enquiry_preparation(b,stored->>'customerId',context->>'enquiryId',a);
   w:=public.busy_work_preparation_read_v1(b,stored->>'customerId',(stored->>'engagementId')::uuid,a,(stored->>'quoteRevision')::bigint,current_snapshot);
   IF context->>'businessId' IS DISTINCT FROM b::text OR context->>'ownerId' IS DISTINCT FROM a::text OR context->>'customerId' IS DISTINCT FROM stored->>'customerId' OR context->'snapshotRevision' IS DISTINCT FROM to_jsonb(current_snapshot) OR NOT EXISTS(SELECT 1 FROM public.business_work_engagements q WHERE q.id=(stored->>'engagementId')::uuid AND q.enquiry_id=context->>'enquiryId' AND q.source_hash=context->>'sourceHash' AND q.customer_hash=context->>'customerHash') OR w->'plan'='null' OR w->'needsReview'='true' OR target->>'preparationId' IS DISTINCT FROM stored->>'engagementId' THEN RAISE EXCEPTION 'Eligible exact quote plan required';END IF;
   IF EXISTS(SELECT 1 FROM busy_work_private.enquiry_preparations WHERE business_id=b AND owner_id=a AND customer_id=stored->>'customerId' AND enquiry_id=context->>'enquiryId' AND plan IS NOT NULL) THEN RAISE EXCEPTION 'Use the original enquiry progress';END IF;
  ELSE RAISE EXCEPTION 'Unknown private Work source';END IF;
  IF mode='save' AND (w->'revision' IS DISTINCT FROM target->'reviewedRevision' OR to_jsonb(current_snapshot) IS DISTINCT FROM target->'snapshotRevision') THEN RAISE EXCEPTION 'Work changed since review';END IF;
  IF mode='check' AND (context->>'sourceHash' IS DISTINCT FROM target->>'sourceHash' OR context->>'customerHash' IS DISTINCT FROM target->>'customerHash') THEN RAISE EXCEPTION 'Source changed; review placement again';END IF;
  target:=target||jsonb_build_object('sourceHash',context->>'sourceHash','customerHash',context->>'customerHash');
 END IF;
 IF mode='check' THEN RETURN jsonb_build_object('checked',true,'workRevision',w->'revision','snapshotRevision',current_snapshot,'revision',h.revision);END IF;
 IF request IS NULL OR coalesce(h.revision,0)>=32 OR EXISTS(SELECT 1 FROM busy_app_function_private.operational_versions WHERE app_id=app AND request_key=request) THEN RAISE EXCEPTION 'Inspect rather than replay; placement history limit retained';END IF;
 IF h.app_id IS NULL THEN INSERT INTO busy_app_function_private.operational_heads VALUES(app,b,a,1) RETURNING * INTO h;ELSE UPDATE busy_app_function_private.operational_heads SET revision=revision+1 WHERE app_id=app RETURNING * INTO h;END IF;
 INSERT INTO busy_app_function_private.operational_versions(app_id,revision,app_revision,binding,approved_by,request_key) VALUES(app,h.revision,app_rev,CASE WHEN mode='remove' THEN NULL ELSE target END,a,request);
 RETURN jsonb_build_object('businessId',b,'ownerId',a,'appId',app,'appRevision',app_rev,'revision',h.revision,'requestKey',request,'ownOperationReceipt',true,'privateOnly',true);
END $$;
-- Bounded identity-only collection. Every displayed row is separately re-read by
-- original authenticated source review and existing finite Work authority.
CREATE FUNCTION public.busy_work_preparation_candidates_v1(b uuid,a uuid,after_key text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE snap bigint;rows jsonb;
BEGIN
 IF (SELECT closed FROM busy_app_function_private.operational_settings WHERE id FOR SHARE) IS DISTINCT FROM false OR (SELECT closed FROM busy_work_private.preparation_settings WHERE id FOR SHARE) IS DISTINCT FROM false OR (SELECT closed FROM busy_work_private.enquiry_preparation_settings WHERE id FOR SHARE) IS DISTINCT FROM false THEN RAISE EXCEPTION 'Preparation closed';END IF;
 IF a IS NULL OR NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=b AND user_id=a AND role='owner' FOR SHARE) THEN RAISE EXCEPTION 'Current owner required';END IF;
 SELECT revision INTO snap FROM public.busy_business_snapshots WHERE business_id=b FOR SHARE;IF snap IS NULL OR length(coalesce(after_key,''))>500 THEN RAISE EXCEPTION 'Current bounded source required';END IF;
 SELECT coalesce(jsonb_agg(x ORDER BY x->>'key'),'[]') INTO rows FROM (
 SELECT x FROM (
 SELECT jsonb_build_object('key','e:'||id,'targetKind','filed_enquiry','customerId',customer_id,'enquiryId',enquiry_id) x FROM busy_work_private.enquiry_preparations WHERE business_id=b AND owner_id=a AND plan IS NOT NULL
 UNION ALL
 SELECT jsonb_build_object('key','q:'||q.id,'targetKind','prepared_quote','customerId',q.customer_id,'engagementId',q.id,'quoteRevision',q.revision) FROM public.business_work_engagements q WHERE q.business_id=b AND q.created_by=a AND q.kind='quote' AND q.status='Prepared' AND q.preparation_plan IS NOT NULL AND NOT EXISTS(SELECT 1 FROM busy_work_private.enquiry_preparations e WHERE e.business_id=b AND e.owner_id=a AND e.customer_id=q.customer_id AND e.enquiry_id=q.enquiry_id AND e.plan IS NOT NULL)
 ) all_rows WHERE x->>'key'>coalesce(after_key,'') ORDER BY x->>'key' LIMIT 20) limited;
 RETURN jsonb_build_object('snapshotRevision',snap,'candidates',rows);
END $$;
REVOKE ALL ON FUNCTION public.busy_private_operational_v1(uuid,uuid,uuid,text,bigint,integer,uuid,jsonb,jsonb),public.busy_work_preparation_candidates_v1(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_private_operational_v1(uuid,uuid,uuid,text,bigint,integer,uuid,jsonb,jsonb),public.busy_work_preparation_candidates_v1(uuid,uuid,text) TO service_role;
ALTER FUNCTION public.busy_private_operational_v1(uuid,uuid,uuid,text,bigint,integer,uuid,jsonb,jsonb) OWNER TO postgres;
ALTER FUNCTION public.busy_work_preparation_candidates_v1(uuid,uuid,text) OWNER TO postgres;
ALTER TABLE busy_app_function_private.operational_settings OWNER TO postgres;
ALTER TABLE busy_app_function_private.operational_heads OWNER TO postgres;
ALTER TABLE busy_app_function_private.operational_versions OWNER TO postgres;
COMMIT;
