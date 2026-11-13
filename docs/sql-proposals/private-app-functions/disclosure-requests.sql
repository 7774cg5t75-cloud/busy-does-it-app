-- REVIEW ONLY. Reuses original atomic guest challenge/request writer; no customer route.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'FORM REQUEST REVIEW FUSE: separate staging approval required';END $$;
ALTER TABLE public.busy_mini_app_guest_challenges ADD COLUMN form_disclosure_id uuid REFERENCES busy_app_function_private.disclosures(id);
CREATE UNIQUE INDEX busy_form_request_idempotency ON public.busy_mini_app_requests(mini_app_id,idempotency_key) WHERE payload ? 'formDisclosure';
CREATE FUNCTION busy_app_function_private.disclosed_payload(id uuid,answers jsonb,contact jsonb,interest jsonb,consent boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE d busy_app_function_private.disclosures%ROWTYPE;r jsonb;a public.busy_mini_apps%ROWTYPE;c public.busy_business_content%ROWTYPE;option jsonb;service text:='General enquiry';message text;listing jsonb;source jsonb:=NULL;counted int;
BEGIN
 r:=public.busy_form_disclosure_review_v1(id,answers,contact,consent);IF r->'valid' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Correct the form before review';END IF;
 SELECT * INTO d FROM busy_app_function_private.disclosures WHERE disclosures.id=disclosed_payload.id;SELECT * INTO a FROM public.busy_mini_apps WHERE busy_mini_apps.id=d.app_id;
 message:=btrim(contact->>'message');IF position('Service reference:' IN message)>0 OR position('Listing reference:' IN message)>0 THEN RAISE EXCEPTION 'Source markers are reserved; keep customer wording separate';END IF;
 IF interest IS NOT NULL AND interest<>'null' THEN
  IF jsonb_typeof(interest) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Typed interest required';END IF;
  IF interest->>'kind'='service' THEN
   IF interest-ARRAY['kind','serviceId']<>'{}' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(a.draft_config->'modules')m WHERE m->>'key'='services' AND m->'enabled'='true') THEN RAISE EXCEPTION 'Supported service source required';END IF;
   SELECT count(*),min(x->>'name') INTO counted,service FROM jsonb_array_elements(a.draft_config#>'{publicProfile,services}')x WHERE x->>'id'=interest->>'serviceId';IF counted<>1 OR service IS NULL THEN RAISE EXCEPTION 'Exact current service required';END IF;
   message:='Service reference: '||(interest->>'serviceId')||' / app draft revision '||a.draft_revision||'.'||E'\n\n'||message;source:=jsonb_build_object('kind','service','id',interest->>'serviceId','revision',a.draft_revision,'name',service);
  ELSIF interest->>'kind'='listing' THEN
   IF interest-ARRAY['kind','recordId','revision','variantId']<>'{}' OR jsonb_typeof(interest->'revision') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Typed listing selection required';END IF;
   SELECT * INTO c FROM public.busy_business_content WHERE business_id=d.business_id AND busy_business_content.id=interest->>'recordId' FOR SHARE;
   IF NOT FOUND OR c.kind NOT IN ('product','event') OR to_jsonb(c.published_revision) IS DISTINCT FROM interest->'revision' OR c.published->>'status' IS DISTINCT FROM (CASE c.kind WHEN 'product' THEN 'active' ELSE 'scheduled' END) THEN RAISE EXCEPTION 'Approved original listing changed';END IF;
   IF c.kind='event' AND ((c.published->>'endsAt')::timestamptz<=clock_timestamp() OR interest->>'variantId' IS NOT NULL) THEN RAISE EXCEPTION 'Current event required';END IF;
   IF interest->>'variantId' IS NOT NULL THEN SELECT x INTO option FROM jsonb_array_elements(c.published->'variants')x WHERE x->>'id'=interest->>'variantId';IF option IS NULL THEN RAISE EXCEPTION 'Original option changed';END IF;END IF;
   IF length(c.published->>'name') NOT BETWEEN 1 AND 160 OR c.published->>'name'~'[<>[:cntrl:]]' OR octet_length(c.published::text)>10000 OR option IS NOT NULL AND (length(option->>'label') NOT BETWEEN 1 AND 120 OR option->>'label'~'[<>[:cntrl:]]') THEN RAISE EXCEPTION 'Bounded approved listing facts required';END IF;
   service:=(CASE c.kind WHEN 'product' THEN 'Product: ' ELSE 'Event: ' END)||(c.published->>'name')||CASE WHEN option IS NULL THEN '' ELSE ' — '||(option->>'label') END;
   listing:=jsonb_build_object('version',1,'kind',c.kind,'recordId',c.id,'revision',c.published_revision,'variantId',interest->'variantId');
   source:=jsonb_build_object('kind',c.kind,'id',c.id,'revision',c.published_revision,'name',c.published->'name','optionId',option->'id','optionLabel',option->'label','amountMinor',CASE WHEN option IS NOT NULL THEN option->'amountMinor' ELSE c.published->'amountMinor' END,'currency',c.published->'currency','startsAt',c.published->'startsAt','endsAt',c.published->'endsAt','timeZone',c.published->'timeZone','location',c.published->'location');
   message:=service||E'\nListing reference: '||c.id||' / approved revision '||c.published_revision||CASE WHEN option IS NULL THEN '' ELSE ' / option '||(option->>'id') END||E'.\nThis is an enquiry, not an order, reservation or confirmed attendance.\n\n'||message;
  ELSE RAISE EXCEPTION 'Unsupported source operation';END IF;
 END IF;
 IF length(service)>240 OR length(message)>3000 THEN RAISE EXCEPTION 'Original enquiry length exceeded';END IF;
 RETURN jsonb_build_object('name',btrim(contact->>'name'),'email',lower(btrim(contact->>'email')),'phone',btrim(contact->>'phone'),'service',service,'message',message,'privateForm',d.basis||jsonb_build_object('answers',answers),'formDisclosure',jsonb_build_object('version',1,'id',d.id,'revision',1,'privacy',d.projection->'privacy','consent',true,'sourceAtSubmission',source,'review',r||jsonb_build_object('source',source)))||CASE WHEN listing IS NULL THEN '{}' ELSE jsonb_build_object('listingContext',listing) END;
END $$;
CREATE FUNCTION public.busy_form_disclosure_prepare_v1(id uuid,answers jsonb,contact jsonb,interest jsonb,consent boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE p jsonb:=busy_app_function_private.disclosed_payload(id,answers,contact,interest,consent);
BEGIN RETURN p#>'{formDisclosure,review}';END $$;
CREATE FUNCTION busy_app_function_private.guard_form_submission() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
BEGIN IF NEW.payload ? 'formDisclosure' AND (current_user<>pg_get_userbyid((SELECT relowner FROM pg_class WHERE oid=TG_RELID)) OR current_setting('busy.form_submission',true) IS DISTINCT FROM 'finite') THEN RAISE EXCEPTION 'Use the reviewed finite original form request authority';END IF;RETURN NEW;END $$;
CREATE TRIGGER busy_original_form_submission BEFORE INSERT ON public.busy_mini_app_requests FOR EACH ROW EXECUTE FUNCTION busy_app_function_private.guard_form_submission();
CREATE FUNCTION public.busy_form_guest_challenge_v1(id uuid,h text,f text,seed text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE d busy_app_function_private.disclosures%ROWTYPE;c jsonb;old_id uuid;
BEGIN
 SELECT * INTO d FROM busy_app_function_private.disclosures WHERE disclosures.id=busy_form_guest_challenge_v1.id;IF NOT FOUND THEN RAISE EXCEPTION 'Reviewed disclosure required';END IF;
 PERFORM busy_guest_admission_private.lock_source(d.business_id,d.app_id,d.published_version_id,'enquiry');
 PERFORM public.busy_form_disclosure_read_v1(id);
 IF NOT d.allow_enquiries OR (SELECT public_form_requests_closed FROM busy_app_function_private.settings WHERE settings.id) IS DISTINCT FROM false THEN RAISE EXCEPTION 'Public form requests disabled';END IF;
 c:=public.busy_mini_app_guest_challenge_v1(d.business_id,d.app_id,d.published_version_id,'enquiry',h,f,seed);
 SELECT form_disclosure_id INTO old_id FROM public.busy_mini_app_guest_challenges WHERE busy_mini_app_guest_challenges.id=(c->>'id')::uuid;
 IF old_id IS NOT NULL AND old_id<>d.id THEN RAISE EXCEPTION 'Conflicting form challenge';END IF;
 UPDATE public.busy_mini_app_guest_challenges SET form_disclosure_id=d.id WHERE busy_mini_app_guest_challenges.id=(c->>'id')::uuid;RETURN c;
END $$;
CREATE FUNCTION busy_app_function_private.form_guest_proof(challenge uuid,token text,fingerprint text,solution integer) RETURNS public.busy_mini_app_guest_challenges LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c public.busy_mini_app_guest_challenges%ROWTYPE;
BEGIN
 SELECT * INTO c FROM public.busy_mini_app_guest_challenges WHERE busy_mini_app_guest_challenges.id=challenge FOR UPDATE;
 IF NOT FOUND OR c.request_type<>'enquiry' OR c.form_disclosure_id IS NULL OR length(token) NOT BETWEEN 20 AND 100 OR token!~'^[A-Za-z0-9_-]+$' OR c.token_hash IS DISTINCT FROM encode(sha256(convert_to(token,'UTF8')),'hex') OR c.fingerprint_hash IS DISTINCT FROM fingerprint OR solution IS NULL OR solution NOT BETWEEN 0 AND 2000000 OR left(encode(sha256(convert_to(c.pow_seed||':'||token||':'||solution,'UTF8')),'hex'),c.pow_difficulty)<>repeat('0',c.pow_difficulty) THEN RAISE EXCEPTION 'Original guest proof required' USING ERRCODE='42501';END IF;RETURN c;
END $$;
CREATE FUNCTION public.busy_form_guest_submit_v1(challenge uuid,token text,fingerprint text,solution integer,key text,answers jsonb,contact jsonb,interest jsonb,consent boolean,access_hash text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c public.busy_mini_app_guest_challenges%ROWTYPE;d busy_app_function_private.disclosures%ROWTYPE;p jsonb;rid uuid;row public.busy_mini_app_requests%ROWTYPE;
BEGIN
 IF (SELECT public_form_requests_closed FROM busy_app_function_private.settings WHERE settings.id) IS DISTINCT FROM false THEN RAISE EXCEPTION 'Public form requests disabled';END IF;
 SELECT * INTO c FROM public.busy_mini_app_guest_challenges WHERE busy_mini_app_guest_challenges.id=challenge;
 IF NOT FOUND THEN RAISE EXCEPTION 'Exact guest challenge required';END IF;
 PERFORM busy_guest_admission_private.lock_source(c.business_id,c.mini_app_id,c.version_id,'enquiry');c:=busy_app_function_private.form_guest_proof(challenge,token,fingerprint,solution);
 IF c.state<>'pending' THEN RAISE EXCEPTION 'Inspect the exact receipt; do not replay';END IF;
 IF key IS NULL OR key!~'^[A-Za-z0-9_-]{12,120}$' OR access_hash IS NULL OR access_hash!~'^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Exact request/access identity required';END IF;
 SELECT * INTO d FROM busy_app_function_private.disclosures WHERE disclosures.id=c.form_disclosure_id;p:=busy_app_function_private.disclosed_payload(d.id,answers,contact,interest,consent);
 IF NOT d.allow_enquiries OR d.app_id<>c.mini_app_id OR d.business_id<>c.business_id OR d.published_version_id<>c.version_id OR EXISTS(SELECT 1 FROM public.busy_mini_app_requests WHERE mini_app_id=d.app_id AND idempotency_key=key AND payload ? 'formDisclosure') THEN RAISE EXCEPTION 'Stale or duplicate form request';END IF;
 PERFORM set_config('busy.form_submission','finite',true);
 rid:=public.busy_mini_app_create_guest_request(challenge,fingerprint,encode(sha256(convert_to(d.business_id::text||':'||lower(p->>'email')||':'||regexp_replace(p->>'phone','[^0-9]','','g'),'UTF8')),'hex'),access_hash,key,p,p->>'name',p->>'email',p->>'phone',p->>'service',NULL);
 SELECT * INTO row FROM public.busy_mini_app_requests WHERE busy_mini_app_requests.id=rid AND guest_challenge_id=challenge;
 IF NOT FOUND OR row.payload IS DISTINCT FROM p OR row.idempotency_key IS DISTINCT FROM key THEN RAISE EXCEPTION 'Exact original write receipt unavailable';END IF;
 RETURN jsonb_build_object('requestId',rid,'formId',d.id,'revision',1,'appId',d.app_id,'appVersionId',d.published_version_id,'requestKey',key,'received',true,'identityAssurance','guest_browser_challenge','booked',false,'paid',false,'review',row.payload#>'{formDisclosure,review}');
END $$;
CREATE FUNCTION public.busy_form_guest_receipt_v1(challenge uuid,token text,fingerprint text,solution integer,key text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c public.busy_mini_app_guest_challenges%ROWTYPE;r public.busy_mini_app_requests%ROWTYPE;
BEGIN
 c:=busy_app_function_private.form_guest_proof(challenge,token,fingerprint,solution);
 SELECT * INTO r FROM public.busy_mini_app_requests WHERE guest_challenge_id=challenge AND idempotency_key=key AND mini_app_id=c.mini_app_id AND business_id=c.business_id AND payload#>>'{formDisclosure,id}'=c.form_disclosure_id::text;
 IF NOT FOUND OR c.state<>'consumed' THEN RAISE EXCEPTION 'Exact receipt not independently found';END IF;
 IF (r.payload#>'{formDisclosure,privacy,retentionDays}' IN ('14','30','90')) IS NOT TRUE OR r.created_at+make_interval(days=>(r.payload#>>'{formDisclosure,privacy,retentionDays}')::int)<=clock_timestamp() THEN RAISE EXCEPTION 'Customer receipt access has expired';END IF;
 RETURN jsonb_build_object('requestId',r.id,'formId',c.form_disclosure_id,'revision',1,'appId',r.mini_app_id,'appVersionId',r.version_id,'requestKey',key,'received',true,'identityAssurance','guest_browser_challenge','booked',false,'paid',false,'observedOnly',true,'review',r.payload#>'{formDisclosure,review}');
END $$;
REVOKE ALL ON FUNCTION busy_app_function_private.disclosed_payload(uuid,jsonb,jsonb,jsonb,boolean),busy_app_function_private.form_guest_proof(uuid,text,text,integer),public.busy_form_guest_challenge_v1(uuid,text,text,text),public.busy_form_guest_submit_v1(uuid,text,text,integer,text,jsonb,jsonb,jsonb,boolean,text),public.busy_form_guest_receipt_v1(uuid,text,text,integer,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_form_guest_challenge_v1(uuid,text,text,text),public.busy_form_guest_submit_v1(uuid,text,text,integer,text,jsonb,jsonb,jsonb,boolean,text),public.busy_form_guest_receipt_v1(uuid,text,text,integer,text) TO service_role;
REVOKE ALL ON FUNCTION public.busy_form_disclosure_prepare_v1(uuid,jsonb,jsonb,jsonb,boolean),busy_app_function_private.guard_form_submission() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_form_disclosure_prepare_v1(uuid,jsonb,jsonb,jsonb,boolean) TO service_role;
ALTER FUNCTION public.busy_form_disclosure_prepare_v1(uuid,jsonb,jsonb,jsonb,boolean) OWNER TO postgres;
ALTER FUNCTION public.busy_form_guest_challenge_v1(uuid,text,text,text) OWNER TO postgres;
ALTER FUNCTION public.busy_form_guest_submit_v1(uuid,text,text,integer,text,jsonb,jsonb,jsonb,boolean,text) OWNER TO postgres;
ALTER FUNCTION public.busy_form_guest_receipt_v1(uuid,text,text,integer,text) OWNER TO postgres;
ALTER FUNCTION busy_app_function_private.disclosed_payload(uuid,jsonb,jsonb,jsonb,boolean) OWNER TO postgres;
ALTER FUNCTION busy_app_function_private.form_guest_proof(uuid,text,text,integer) OWNER TO postgres;
COMMIT;
