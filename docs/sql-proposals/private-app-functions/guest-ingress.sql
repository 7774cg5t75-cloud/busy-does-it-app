-- REVIEW ONLY. Original publication, private disclosure and atomic guest authority.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'FORM INGRESS REVIEW FUSE: separate hosted approval required';END $$;
SET LOCAL lock_timeout='5s';
ALTER TABLE busy_app_function_private.settings ADD COLUMN publications_closed boolean NOT NULL DEFAULT true;
CREATE TABLE busy_app_function_private.publication_approvals(disclosure_id uuid PRIMARY KEY REFERENCES busy_app_function_private.disclosures(id),business_id uuid NOT NULL REFERENCES public.busy_businesses(id),app_id uuid NOT NULL REFERENCES public.busy_mini_apps(id),owner_id uuid NOT NULL REFERENCES auth.users(id),app_version_id uuid NOT NULL REFERENCES public.busy_mini_app_versions(id),allow_submission boolean NOT NULL,request_key uuid NOT NULL UNIQUE,approved_at timestamptz NOT NULL DEFAULT clock_timestamp());
ALTER TABLE busy_app_function_private.publication_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON busy_app_function_private.publication_approvals FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER publication_approval_immutable BEFORE UPDATE OR DELETE ON busy_app_function_private.publication_approvals FOR EACH ROW EXECUTE FUNCTION busy_app_function_private.immutable();
CREATE FUNCTION busy_app_function_private.publication_permission(d busy_app_function_private.disclosures) RETURNS busy_app_function_private.publication_approvals LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE p busy_app_function_private.publication_approvals%ROWTYPE;
BEGIN
 IF (SELECT publications_closed FROM busy_app_function_private.settings WHERE settings.id FOR SHARE) IS DISTINCT FROM false THEN RAISE EXCEPTION 'Form publication is closed';END IF;
 SELECT * INTO p FROM busy_app_function_private.publication_approvals WHERE disclosure_id=d.id AND app_id=d.app_id AND business_id=d.business_id AND owner_id=d.owner_id AND app_version_id=d.published_version_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Separate exact form publication approval required';END IF;RETURN p;
END $$;
CREATE FUNCTION public.busy_private_form_publication_approve_v1(b uuid,actor uuid,a uuid,id uuid,key uuid,allow_submission boolean,approved boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE own jsonb;d busy_app_function_private.disclosures%ROWTYPE;
BEGIN
 own:=public.busy_private_form_disclosure_v1(b,actor,a,'read',jsonb_build_object('id',id));
 SELECT * INTO d FROM busy_app_function_private.disclosures WHERE disclosures.id=busy_private_form_publication_approve_v1.id;PERFORM busy_app_function_private.disclosure_source(d);
 IF approved IS DISTINCT FROM true OR key IS NULL OR allow_submission IS NULL OR allow_submission AND NOT d.allow_enquiries THEN RAISE EXCEPTION 'Review the exact separate publication and enquiry permission';END IF;
 INSERT INTO busy_app_function_private.publication_approvals VALUES(id,b,a,actor,d.published_version_id,allow_submission,key,clock_timestamp());
 RETURN jsonb_build_object('disclosureId',id,'requestKey',key,'appId',a,'appVersionId',d.published_version_id,'publicationPermissionReviewed',true,'allowSubmission',allow_submission,'activationPerformed',false);
END $$;
ALTER TABLE public.busy_mini_app_guest_challenges ADD COLUMN form_review_count integer NOT NULL DEFAULT 0 CHECK(form_review_count BETWEEN 0 AND 8);
CREATE INDEX busy_form_guest_open_quota ON public.busy_mini_app_guest_challenges(form_disclosure_id,created_at) WHERE form_disclosure_id IS NOT NULL;
CREATE FUNCTION public.busy_form_guest_open_v1(id uuid,app uuid,version uuid,h text,f text,seed text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE d busy_app_function_private.disclosures%ROWTYPE;p jsonb;c jsonb;row public.busy_mini_app_guest_challenges%ROWTYPE;
BEGIN
 SELECT * INTO d FROM busy_app_function_private.disclosures WHERE disclosures.id=busy_form_guest_open_v1.id;
 IF NOT FOUND OR d.app_id IS DISTINCT FROM app OR d.published_version_id IS DISTINCT FROM version THEN RAISE EXCEPTION 'Exact published form required';END IF;
 PERFORM busy_guest_admission_private.lock_source(d.business_id,d.app_id,d.published_version_id,'enquiry');
 p:=public.busy_form_disclosure_read_v1(id);PERFORM busy_app_function_private.publication_permission(d);
 IF (SELECT count(*) FROM public.busy_mini_app_guest_challenges WHERE form_disclosure_id=busy_form_guest_open_v1.id AND created_at>clock_timestamp()-interval '1 hour')>=60 THEN RAISE EXCEPTION 'Form opening quota reached';END IF;
 -- Original atomic admission quotas apply to opening as well as later writing.
 c:=public.busy_mini_app_guest_challenge_v1(d.business_id,d.app_id,d.published_version_id,'enquiry',h,f,seed);
 SELECT * INTO row FROM public.busy_mini_app_guest_challenges WHERE busy_mini_app_guest_challenges.id=(c->>'id')::uuid FOR UPDATE;
 IF row.form_disclosure_id IS NOT NULL AND row.form_disclosure_id<>id THEN RAISE EXCEPTION 'Conflicting form opening';END IF;
 UPDATE public.busy_mini_app_guest_challenges SET form_disclosure_id=busy_form_guest_open_v1.id WHERE busy_mini_app_guest_challenges.id=row.id;
 RETURN jsonb_build_object('projection',p,'challenge',jsonb_build_object('challengeId',row.id,'seed',row.pow_seed,'difficulty',row.pow_difficulty,'expiresAt',row.expires_at),'submissionPermitted',d.allow_enquiries AND (SELECT allow_submission FROM busy_app_function_private.publication_approvals WHERE disclosure_id=d.id) AND NOT (SELECT public_form_requests_closed FROM busy_app_function_private.settings WHERE settings.id));
END $$;
CREATE FUNCTION public.busy_form_guest_review_v2(id uuid,challenge uuid,token text,fingerprint text,solution integer,answers jsonb,contact jsonb,interest jsonb,consent boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c public.busy_mini_app_guest_challenges%ROWTYPE;
BEGIN
 SELECT * INTO c FROM public.busy_mini_app_guest_challenges WHERE busy_mini_app_guest_challenges.id=challenge;IF NOT FOUND THEN RAISE EXCEPTION 'Exact challenge required';END IF;PERFORM busy_guest_admission_private.lock_source(c.business_id,c.mini_app_id,c.version_id,'enquiry'); c:=busy_app_function_private.form_guest_proof(challenge,token,fingerprint,solution);
 IF c.form_disclosure_id IS DISTINCT FROM id OR c.state<>'pending' OR c.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Current original form challenge required';END IF;
 PERFORM busy_app_function_private.publication_permission(d) FROM busy_app_function_private.disclosures d WHERE d.id=c.form_disclosure_id;
 IF c.form_review_count>=8 THEN RAISE EXCEPTION 'Form review quota reached';END IF;
 UPDATE public.busy_mini_app_guest_challenges SET form_review_count=form_review_count+1 WHERE busy_mini_app_guest_challenges.id=challenge;
 BEGIN RETURN public.busy_form_disclosure_prepare_v1(id,answers,contact,interest,consent);EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('unavailable',true);END;
END $$;
CREATE FUNCTION public.busy_private_form_publication_review_v1(b uuid,actor uuid,a uuid,id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE own jsonb;d busy_app_function_private.disclosures%ROWTYPE;eligible boolean:=true;number integer;p busy_app_function_private.publication_approvals%ROWTYPE;
BEGIN
 own:=public.busy_private_form_disclosure_v1(b,actor,a,'read',jsonb_build_object('id',id));
 SELECT * INTO d FROM busy_app_function_private.disclosures WHERE disclosures.id=busy_private_form_publication_review_v1.id;
 BEGIN PERFORM busy_app_function_private.disclosure_source(d);EXCEPTION WHEN OTHERS THEN eligible:=false;END;
 SELECT * INTO p FROM busy_app_function_private.publication_approvals WHERE disclosure_id=busy_private_form_publication_review_v1.id AND app_id=a AND business_id=b AND owner_id=actor;
 SELECT version_no INTO number FROM public.busy_mini_app_versions WHERE busy_mini_app_versions.id=d.published_version_id AND mini_app_id=a AND business_id=b;
 RETURN jsonb_build_object('appId',a,'disclosureId',id,'appVersionId',d.published_version_id,'appVersionNumber',number,'screenId',d.basis->'screenId','status',CASE WHEN (own->>'revoked')::boolean THEN 'revoked' WHEN NOT eligible THEN 'source_changed' WHEN p.disclosure_id IS NULL THEN 'needs_separate_approval' ELSE 'separately_reviewed' END,'enquiryPermissionReviewed',d.allow_enquiries,'publicationPermissionReviewed',p.disclosure_id IS NOT NULL,'requestKey',p.request_key,'allowSubmission',p.allow_submission,'serverClosed',(SELECT publications_closed FROM busy_app_function_private.settings WHERE settings.id),'publicationPerformed',false,'activationAuthorised',false);
END $$;
ALTER FUNCTION public.busy_form_guest_submit_v1(uuid,text,text,integer,text,jsonb,jsonb,jsonb,boolean,text) RENAME TO busy_form_guest_submit_original_v1;
REVOKE ALL ON FUNCTION public.busy_form_guest_submit_original_v1(uuid,text,text,integer,text,jsonb,jsonb,jsonb,boolean,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.busy_form_guest_submit_v1(challenge uuid,token text,fingerprint text,solution integer,key text,answers jsonb,contact jsonb,interest jsonb,consent boolean,access_hash text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c public.busy_mini_app_guest_challenges%ROWTYPE;d busy_app_function_private.disclosures%ROWTYPE;p busy_app_function_private.publication_approvals%ROWTYPE;
BEGIN
 SELECT * INTO c FROM public.busy_mini_app_guest_challenges WHERE busy_mini_app_guest_challenges.id=challenge;IF NOT FOUND THEN RAISE EXCEPTION 'Exact challenge required';END IF;PERFORM busy_guest_admission_private.lock_source(c.business_id,c.mini_app_id,c.version_id,'enquiry'); c:=busy_app_function_private.form_guest_proof(challenge,token,fingerprint,solution);SELECT * INTO d FROM busy_app_function_private.disclosures WHERE id=c.form_disclosure_id;p:=busy_app_function_private.publication_permission(d);IF NOT p.allow_submission THEN RAISE EXCEPTION 'Display approval does not allow enquiries';END IF;
 RETURN public.busy_form_guest_submit_original_v1(challenge,token,fingerprint,solution,key,answers,contact,interest,consent,access_hash);
END $$;
REVOKE ALL ON FUNCTION public.busy_form_guest_submit_v1(uuid,text,text,integer,text,jsonb,jsonb,jsonb,boolean,text),public.busy_private_form_publication_approve_v1(uuid,uuid,uuid,uuid,uuid,boolean,boolean),busy_app_function_private.publication_permission(busy_app_function_private.disclosures) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_form_guest_submit_v1(uuid,text,text,integer,text,jsonb,jsonb,jsonb,boolean,text),public.busy_private_form_publication_approve_v1(uuid,uuid,uuid,uuid,uuid,boolean,boolean) TO service_role;
ALTER FUNCTION public.busy_form_guest_submit_v1(uuid,text,text,integer,text,jsonb,jsonb,jsonb,boolean,text) OWNER TO postgres;
ALTER FUNCTION public.busy_private_form_publication_approve_v1(uuid,uuid,uuid,uuid,uuid,boolean,boolean) OWNER TO postgres;
ALTER FUNCTION busy_app_function_private.publication_permission(busy_app_function_private.disclosures) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_form_guest_open_v1(uuid,uuid,uuid,text,text,text),public.busy_form_guest_review_v2(uuid,uuid,text,text,integer,jsonb,jsonb,jsonb,boolean),public.busy_private_form_publication_review_v1(uuid,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_form_guest_open_v1(uuid,uuid,uuid,text,text,text),public.busy_form_guest_review_v2(uuid,uuid,text,text,integer,jsonb,jsonb,jsonb,boolean),public.busy_private_form_publication_review_v1(uuid,uuid,uuid,uuid) TO service_role;
ALTER FUNCTION public.busy_form_guest_open_v1(uuid,uuid,uuid,text,text,text) OWNER TO postgres;
ALTER FUNCTION public.busy_form_guest_review_v2(uuid,uuid,text,text,integer,jsonb,jsonb,jsonb,boolean) OWNER TO postgres;
ALTER FUNCTION public.busy_private_form_publication_review_v1(uuid,uuid,uuid,uuid) OWNER TO postgres;
COMMIT;
