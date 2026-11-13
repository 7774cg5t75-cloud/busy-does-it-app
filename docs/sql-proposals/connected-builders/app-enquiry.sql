-- REVIEW ONLY. Requires original Phase64/65 first-enquiry contracts and Mini App tables.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'APP ENQUIRY REVIEW FUSE: separate staging approval required'; END $$;
CREATE FUNCTION public.busy_connected_app_enquiry_review_v1(p_business_id uuid,p_request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid;r public.busy_mini_app_requests%ROWTYPE;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.busy_mini_app_requests WHERE business_id=p_business_id AND id=p_request_id FOR SHARE;
 IF NOT FOUND OR r.request_type<>'enquiry' OR r.module_key<>'enquiry' OR r.status NOT IN ('received','reviewing') OR NOT EXISTS(SELECT 1 FROM public.busy_mini_apps WHERE id=r.mini_app_id AND business_id=p_business_id) THEN RAISE EXCEPTION 'Current business enquiry required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(r.payload->'message') IS DISTINCT FROM 'string' OR btrim(r.payload->>'message')='' OR octet_length(r.payload->>'message')>5000 THEN RAISE EXCEPTION 'Supported text enquiry required' USING ERRCODE='22023'; END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',actor,'requestId',r.id,'appId',r.mini_app_id,
 'requestHash',encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex'),'message',r.payload->>'message',
 'name',coalesce(r.contact_name,''),'email',coalesce(r.contact_email,''),'phone',coalesce(r.contact_phone,''),'service',coalesce(r.service_name,''),
 'identityAssurance',coalesce(r.identity_assurance,'unverified'),'noCustomerIdentityInference',true);
END $$;
CREATE FUNCTION public.busy_connected_app_enquiry_import_v1(p_business_id uuid,p_request_id uuid,p_request_hash text,p_expected_revision bigint) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE observed jsonb;snap public.busy_business_snapshots%ROWTYPE;eid text:='app_'||replace(p_request_id::text,'-','_');item jsonb;receipt jsonb;
BEGIN
 observed:=public.busy_connected_app_enquiry_review_v1(p_business_id,p_request_id);
 IF observed->>'requestHash' IS DISTINCT FROM p_request_hash THEN RAISE EXCEPTION 'Enquiry changed' USING ERRCODE='40001'; END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 SELECT value INTO item FROM jsonb_array_elements(coalesce(snap.payload->'inboxItems','[]')) WHERE value->>'id'=eid;
 IF item IS NOT NULL THEN
  IF item->>'registeredBy' IS DISTINCT FROM auth.uid()::text OR item#>>'{miniAppOrigin,requestId}' IS DISTINCT FROM p_request_id::text THEN RAISE EXCEPTION 'Conflicting enquiry identity' USING ERRCODE='42501';END IF;
  RETURN jsonb_build_object('businessId',p_business_id,'ownerId',auth.uid(),'revision',snap.revision,'enquiryId',eid,'observedOnly',true,'notOwnReceipt',true);
 END IF;
 receipt:=public.busy_owner_manual_source_v1(p_business_id,p_expected_revision,eid,observed->>'message');
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{inboxItems,0}',(payload->'inboxItems'->0)||jsonb_build_object('source','Business App enquiry','sourceOrigin','mini-app-enquiry','miniAppOrigin',jsonb_build_object('requestId',p_request_id,'appId',observed->>'appId','requestHash',p_request_hash)),false) WHERE business_id=p_business_id;
 RETURN receipt||jsonb_build_object('requestId',p_request_id,'privateOnly',true);
END $$;
CREATE FUNCTION public.busy_connected_app_enquiry_file_v1(p_business_id uuid,p_expected_revision bigint,p_capture jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE snap public.busy_business_snapshots%ROWTYPE;item jsonb;observed jsonb;
BEGIN
 PERFORM busy_snapshot_private.lock_writer(p_business_id);
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 SELECT value INTO item FROM jsonb_array_elements(coalesce(snap.payload->'inboxItems','[]')) WHERE value->>'id'=p_capture->>'enquiryId';
 IF item#>>'{miniAppOrigin,requestId}' IS NULL THEN RAISE EXCEPTION 'Original App enquiry required' USING ERRCODE='42501';END IF;
 observed:=public.busy_connected_app_enquiry_review_v1(p_business_id,(item#>>'{miniAppOrigin,requestId}')::uuid);
 IF observed->>'requestHash' IS DISTINCT FROM item#>>'{miniAppOrigin,requestHash}' THEN RAISE EXCEPTION 'Enquiry changed before filing' USING ERRCODE='40001';END IF;
 RETURN public.busy_owner_first_enquiry_v1(p_business_id,p_expected_revision,p_capture);
END $$;
CREATE FUNCTION public.busy_connected_app_enquiry_state_v1(p_business_id uuid,p_request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid;snap public.busy_business_snapshots%ROWTYPE;item jsonb;eid text:='app_'||replace(p_request_id::text,'-','_');record jsonb;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR SHARE;
 SELECT value INTO item FROM jsonb_array_elements(coalesce(snap.payload->'inboxItems','[]')) WHERE value->>'id'=eid;
 IF item IS NULL THEN RETURN jsonb_build_object('state','Missing','businessId',p_business_id,'ownerId',actor);END IF;
 IF item->>'registeredBy' IS DISTINCT FROM actor::text OR item#>>'{miniAppOrigin,requestId}' IS DISTINCT FROM p_request_id::text THEN RAISE EXCEPTION 'Source unavailable' USING ERRCODE='42501';END IF;
 IF item->>'status'='Filed' THEN record:=public.busy_owner_first_reply_review_v1(p_business_id,snap.revision,item->>'filedCustomerId',eid);
 ELSE record:=public.busy_owner_pending_review_v1(p_business_id,snap.revision,eid);END IF;
 RETURN jsonb_build_object('state',item->>'status','businessId',p_business_id,'ownerId',actor,'record',record);
END $$;
ALTER FUNCTION public.busy_connected_app_enquiry_state_v1(uuid,uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_connected_app_enquiry_state_v1(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_connected_app_enquiry_state_v1(uuid,uuid) TO authenticated;
ALTER FUNCTION public.busy_connected_app_enquiry_review_v1(uuid,uuid) OWNER TO postgres;
ALTER FUNCTION public.busy_connected_app_enquiry_import_v1(uuid,uuid,text,bigint) OWNER TO postgres;
ALTER FUNCTION public.busy_connected_app_enquiry_file_v1(uuid,bigint,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_connected_app_enquiry_review_v1(uuid,uuid),public.busy_connected_app_enquiry_import_v1(uuid,uuid,text,bigint),public.busy_connected_app_enquiry_file_v1(uuid,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_connected_app_enquiry_review_v1(uuid,uuid),public.busy_connected_app_enquiry_import_v1(uuid,uuid,text,bigint),public.busy_connected_app_enquiry_file_v1(uuid,bigint,jsonb) TO authenticated;
COMMIT;
