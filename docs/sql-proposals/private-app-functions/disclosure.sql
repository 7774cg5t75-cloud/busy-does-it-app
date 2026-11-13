-- REVIEW ONLY. Service-only original App/guest authorities. No Edge route activation.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'FORM DISCLOSURE REVIEW FUSE: separate staging approval required';END $$;
SET LOCAL lock_timeout='5s';
ALTER TABLE busy_app_function_private.settings ADD COLUMN disclosures_closed boolean NOT NULL DEFAULT true,ADD COLUMN public_form_requests_closed boolean NOT NULL DEFAULT true;
CREATE TABLE busy_app_function_private.disclosures(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),business_id uuid NOT NULL REFERENCES public.busy_businesses(id),app_id uuid NOT NULL REFERENCES public.busy_mini_apps(id),owner_id uuid NOT NULL REFERENCES auth.users(id),published_version_id uuid NOT NULL REFERENCES public.busy_mini_app_versions(id),basis jsonb NOT NULL,projection jsonb NOT NULL,allow_enquiries boolean NOT NULL,approved_at timestamptz NOT NULL DEFAULT clock_timestamp(),request_key uuid NOT NULL,UNIQUE(app_id,request_key));
CREATE INDEX ON busy_app_function_private.disclosures(app_id,approved_at);
CREATE TABLE busy_app_function_private.disclosure_revocations(id uuid PRIMARY KEY REFERENCES busy_app_function_private.disclosures(id),revoked_by uuid NOT NULL REFERENCES auth.users(id),revoked_at timestamptz NOT NULL DEFAULT clock_timestamp());
ALTER TABLE busy_app_function_private.disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE busy_app_function_private.disclosure_revocations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON busy_app_function_private.disclosures,busy_app_function_private.disclosure_revocations FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER disclosure_immutable BEFORE UPDATE OR DELETE ON busy_app_function_private.disclosures FOR EACH ROW EXECUTE FUNCTION busy_app_function_private.immutable();
CREATE TRIGGER disclosure_revocation_immutable BEFORE UPDATE OR DELETE ON busy_app_function_private.disclosure_revocations FOR EACH ROW EXECUTE FUNCTION busy_app_function_private.immutable();
CREATE FUNCTION busy_app_function_private.disclosure_source(d busy_app_function_private.disclosures) RETURNS busy_app_function_private.versions LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a public.busy_mini_apps%ROWTYPE;v public.busy_mini_app_versions%ROWTYPE;s jsonb;f busy_app_function_private.versions%ROWTYPE;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=d.business_id AND user_id=d.owner_id AND role='owner' FOR SHARE) THEN RAISE EXCEPTION 'Disclosure is unavailable' USING ERRCODE='42501';END IF;
 SELECT * INTO a FROM public.busy_mini_apps WHERE id=d.app_id AND business_id=d.business_id AND created_by=d.owner_id FOR UPDATE;
 IF NOT FOUND OR a.status NOT IN ('live','update_pending') OR a.current_live_version_id IS DISTINCT FROM d.published_version_id THEN RAISE EXCEPTION 'Current published App required' USING ERRCODE='40001';END IF;
 IF EXISTS(SELECT 1 FROM busy_app_function_private.disclosure_revocations WHERE id=d.id) THEN RAISE EXCEPTION 'Disclosure revoked' USING ERRCODE='42501';END IF;
 SELECT * INTO v FROM public.busy_mini_app_versions WHERE id=d.published_version_id AND mini_app_id=a.id AND business_id=d.business_id AND state='live' FOR SHARE;
 IF NOT FOUND OR v.source_draft_revision<>a.draft_revision OR v.config IS DISTINCT FROM a.draft_config OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(v.config->'modules')m WHERE m->>'key'='enquiry' AND m->'enabled'='true') THEN RAISE EXCEPTION 'Published source changed' USING ERRCODE='40001';END IF;
 s:=public.busy_private_screen_v1(d.business_id,d.owner_id,a.id,'read',NULL,NULL,NULL,NULL,NULL);
 IF s->>'status'<>'accepted_private' OR s->'currentRevision' IS DISTINCT FROM d.basis->'placementRevision' OR s#>>'{record,digest}' IS DISTINCT FROM d.basis->>'placementHash' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(s#>'{record,bindings}')x WHERE x->>'screenId'=d.basis->>'screenId' AND x->>'functionId'=d.basis->>'functionId' AND x->'version'=d.basis->'artifactVersion' AND x->>'hash'=d.basis->>'artifactHash' AND x->'stateRevision'=d.basis->'artifactStateRevision') THEN RAISE EXCEPTION 'Exact private placement changed' USING ERRCODE='40001';END IF;
 SELECT * INTO f FROM busy_app_function_private.versions WHERE function_id=(d.basis->>'functionId')::uuid AND version=(d.basis->>'artifactVersion')::int AND app_id=a.id AND business_id=d.business_id AND owner_id=d.owner_id;
 IF NOT FOUND OR f.spec_hash IS DISTINCT FROM d.basis->>'artifactHash' OR f.spec_hash<>encode(sha256(convert_to(f.canonical_text,'UTF8')),'hex') OR f.spec->>'kind'<>'private-form' OR busy_app_function_private.validate_form(f.spec) IS NOT TRUE THEN RAISE EXCEPTION 'Eligible reviewed form required';END IF;RETURN f;
END $$;
CREATE FUNCTION public.busy_private_form_disclosure_v1(b uuid,actor uuid,a uuid,action text,data jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE app public.busy_mini_apps%ROWTYPE;d busy_app_function_private.disclosures%ROWTYPE;f busy_app_function_private.versions%ROWTYPE;s jsonb;binding jsonb;field jsonb;fields jsonb:='[]';outputs jsonb:='[]';o jsonb;k text;rid uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=b AND user_id=actor AND role='owner' FOR SHARE) THEN RAISE EXCEPTION 'Current owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO app FROM public.busy_mini_apps WHERE id=a AND business_id=b AND created_by=actor FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Exact owned App required';END IF;
 IF jsonb_typeof(data) IS DISTINCT FROM 'object' OR octet_length(data::text)>4000 THEN RAISE EXCEPTION 'Bounded disclosure review required';END IF;
 IF action='approve' THEN
  IF data-ARRAY['screenId','expectedPlacement','expectedApp','title','explanation','privacyNotice','consentText','retentionDays','allowEnquiries','requestKey','ownerApproved']<>'{}' OR data->'ownerApproved' IS DISTINCT FROM 'true' OR data->'expectedApp' IS DISTINCT FROM to_jsonb(app.draft_revision) OR jsonb_typeof(data->'allowEnquiries') IS DISTINCT FROM 'boolean' OR (data->'retentionDays' IN ('14','30','90')) IS NOT TRUE THEN RAISE EXCEPTION 'Review exact disclosure and separate enquiry permission';END IF;
  FOREACH k IN ARRAY ARRAY['title','explanation','privacyNotice','consentText'] LOOP IF jsonb_typeof(data->k) IS DISTINCT FROM 'string' OR length(btrim(data->>k))<1 OR length(data->>k)>(CASE k WHEN 'title' THEN 80 WHEN 'explanation' THEN 240 ELSE 600 END) OR data->>k~'[<>[:cntrl:]]' THEN RAISE EXCEPTION 'Review public wording and privacy notice';END IF;END LOOP;
  IF (SELECT count(*) FROM busy_app_function_private.disclosures WHERE app_id=a)>=32 THEN RAISE EXCEPTION 'Disclosure history limit';END IF;
  s:=public.busy_private_screen_v1(b,actor,a,'read',NULL,NULL,NULL,NULL,NULL);
  IF s->>'status'<>'accepted_private' OR s->'currentRevision' IS DISTINCT FROM data->'expectedPlacement' THEN RAISE EXCEPTION 'Current private placement required';END IF;
  SELECT x INTO binding FROM jsonb_array_elements(s#>'{record,bindings}')x WHERE x->>'screenId'=data->>'screenId';IF binding IS NULL THEN RAISE EXCEPTION 'Choose an exact placed form';END IF;
  d.id:=gen_random_uuid();d.business_id:=b;d.app_id:=a;d.owner_id:=actor;d.published_version_id:=app.current_live_version_id;d.basis:=jsonb_build_object('version',1,'appRevision',app.draft_revision,'placementRevision',s->'currentRevision','placementHash',s#>'{record,digest}','screenId',binding->'screenId','functionId',binding->'functionId','artifactVersion',binding->'version','artifactHash',binding->'hash','artifactStateRevision',binding->'stateRevision');d.allow_enquiries:=(data->>'allowEnquiries')::boolean;d.request_key:=(data->>'requestKey')::uuid;
  f:=busy_app_function_private.disclosure_source(d);
  FOR field IN SELECT value FROM jsonb_array_elements(f.spec->'fields') LOOP fields:=fields||jsonb_build_array(field-'default');END LOOP;
  FOR o IN SELECT value FROM jsonb_array_elements(coalesce(f.spec#>'{calculation,outputs}','[]')) LOOP outputs:=outputs||jsonb_build_array(o-'expression');END LOOP;
  d.projection:=jsonb_build_object('version',1,'id',d.id,'revision',1,'appId',a,'appVersionId',d.published_version_id,'screenId',binding->'screenId','title',data->'title','explanation',data->'explanation','fields',fields,'outputs',outputs,'privacy',jsonb_build_object('notice',data->'privacyNotice','consentText',data->'consentText','retentionDays',data->'retentionDays'),'stage','review_only');
  INSERT INTO busy_app_function_private.disclosures(id,business_id,app_id,owner_id,published_version_id,basis,projection,allow_enquiries,request_key)VALUES(d.id,b,a,actor,d.published_version_id,d.basis,d.projection,d.allow_enquiries,d.request_key) RETURNING * INTO d;
 ELSE
  IF data-ARRAY['id','requestKey']<>'{}' OR (data ? 'id')=(data ? 'requestKey') THEN RAISE EXCEPTION 'Exact disclosure identity required';END IF;
  SELECT * INTO d FROM busy_app_function_private.disclosures WHERE ((data ? 'id' AND id=(data->>'id')::uuid) OR (data ? 'requestKey' AND request_key=(data->>'requestKey')::uuid)) AND business_id=b AND app_id=a AND owner_id=actor FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'Owned disclosure unavailable';END IF;
  IF action='revoke' THEN INSERT INTO busy_app_function_private.disclosure_revocations(id,revoked_by)VALUES(d.id,actor) ON CONFLICT DO NOTHING;
  ELSIF action<>'read' THEN RAISE EXCEPTION 'Unsupported disclosure action';END IF;
 END IF;
 RETURN jsonb_build_object('id',d.id,'projection',d.projection,'requestKey',d.request_key,'ownerId',actor,'businessId',b,'appId',a,'revoked',EXISTS(SELECT 1 FROM busy_app_function_private.disclosure_revocations WHERE id=d.id),'preparedOnly',true,'publicActivated',false,'allowEnquiriesReviewed',d.allow_enquiries);
END $$;
CREATE FUNCTION public.busy_form_disclosure_read_v1(id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE d busy_app_function_private.disclosures%ROWTYPE;f busy_app_function_private.versions%ROWTYPE;
BEGIN
 IF (SELECT disclosures_closed FROM busy_app_function_private.settings WHERE settings.id) IS DISTINCT FROM false THEN RAISE EXCEPTION 'Customer form disclosure is disabled';END IF;
 SELECT * INTO d FROM busy_app_function_private.disclosures WHERE disclosures.id=busy_form_disclosure_read_v1.id FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'Reviewed disclosure unavailable';END IF;f:=busy_app_function_private.disclosure_source(d);RETURN d.projection;
END $$;
CREATE FUNCTION public.busy_form_disclosure_review_v1(id uuid,answers jsonb,contact jsonb,consent boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE d busy_app_function_private.disclosures%ROWTYPE;f busy_app_function_private.versions%ROWTYPE;p jsonb;r jsonb;field jsonb;
BEGIN
 p:=public.busy_form_disclosure_read_v1(id);SELECT * INTO d FROM busy_app_function_private.disclosures WHERE disclosures.id=busy_form_disclosure_review_v1.id;f:=busy_app_function_private.disclosure_source(d);
 IF consent IS DISTINCT FROM true OR jsonb_typeof(contact) IS DISTINCT FROM 'object' OR contact-ARRAY['name','email','phone','message']<>'{}' OR octet_length(contact::text)>3500 THEN RAISE EXCEPTION 'Review the privacy notice and original contact fields';END IF;
 IF jsonb_typeof(contact->'name') IS DISTINCT FROM 'string' OR length(btrim(contact->>'name')) NOT BETWEEN 1 AND 160 OR jsonb_typeof(contact->'email') IS DISTINCT FROM 'string' OR length(contact->>'email')>240 OR jsonb_typeof(contact->'phone') IS DISTINCT FROM 'string' OR length(contact->>'phone')>80 OR jsonb_typeof(contact->'message') IS DISTINCT FROM 'string' OR length(btrim(contact->>'message')) NOT BETWEEN 1 AND 1000 OR contact::text~'[<>]' OR ((contact->>'email')='' AND (contact->>'phone')='') OR ((contact->>'email')<>'' AND (contact->>'email')!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') OR ((contact->>'phone')<>'' AND (contact->>'phone'!~'^[+() .0-9-]+$' OR regexp_replace(contact->>'phone','[^0-9]','','g')!~'^[0-9]{7,18}$')) THEN RAISE EXCEPTION 'Review bounded contact information';END IF;
 IF jsonb_typeof(answers) IS DISTINCT FROM 'object' OR octet_length(answers::text)>5000 THEN RAISE EXCEPTION 'Bounded form answers required';END IF;
 FOR field IN SELECT value FROM jsonb_array_elements(f.spec->'fields') LOOP IF field ? 'when' AND answers->(field->'when'->>'field') IS DISTINCT FROM field->'when'->'equals' AND answers ? (field->>'id') THEN RAISE EXCEPTION 'Hidden field injection refused';END IF;END LOOP;
 r:=busy_app_function_private.form_result(f.spec,answers);
 RETURN jsonb_build_object('id',id,'revision',1,'appId',d.app_id,'appVersionId',d.published_version_id,'valid',r->'valid','answers',answers,'outputs',r->'outputs','contact',contact,'consent',true,'stage','review_prepared','submitted',false);
END $$;
REVOKE ALL ON FUNCTION busy_app_function_private.disclosure_source(busy_app_function_private.disclosures),public.busy_private_form_disclosure_v1(uuid,uuid,uuid,text,jsonb),public.busy_form_disclosure_read_v1(uuid),public.busy_form_disclosure_review_v1(uuid,jsonb,jsonb,boolean) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_private_form_disclosure_v1(uuid,uuid,uuid,text,jsonb),public.busy_form_disclosure_read_v1(uuid),public.busy_form_disclosure_review_v1(uuid,jsonb,jsonb,boolean) TO service_role;
ALTER FUNCTION busy_app_function_private.disclosure_source(busy_app_function_private.disclosures) OWNER TO postgres;
ALTER FUNCTION public.busy_private_form_disclosure_v1(uuid,uuid,uuid,text,jsonb) OWNER TO postgres;
ALTER FUNCTION public.busy_form_disclosure_read_v1(uuid) OWNER TO postgres;
ALTER FUNCTION public.busy_form_disclosure_review_v1(uuid,jsonb,jsonb,boolean) OWNER TO postgres;
COMMIT;
