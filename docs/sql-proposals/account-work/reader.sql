-- REVIEW ONLY. Existing original rows; not a migration or deployed permission.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'ACCOUNT WORK REVIEW FUSE: separate isolated staging approval required'; END $$;
CREATE FUNCTION public.busy_owner_booking_work_review_v1(
 p_business_id uuid,p_request_id uuid,p_customer_id text,p_action_id text,
 p_expected_revision bigint,p_request_revision text,p_link_revision text,p_work_revision text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid; snap public.busy_business_snapshots%ROWTYPE;
 req public.busy_mini_app_requests%ROWTYPE; linked public.busy_mini_app_request_links%ROWTYPE;
 work public.busy_mini_app_work_bookings%ROWTYPE; customer jsonb; action jsonb; details jsonb; total integer; agrees boolean;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501'; END IF;
 IF p_request_id IS NULL OR p_customer_id IS NULL OR p_customer_id !~ '^[A-Za-z0-9][A-Za-z0-9:_-]{0,159}$' OR p_action_id IS DISTINCT FROM 'miniapp-booking-'||p_request_id::text OR p_expected_revision IS NULL OR p_expected_revision<1 OR p_request_revision IS NULL OR p_link_revision IS NULL OR p_work_revision IS NULL OR length(p_request_revision)>80 OR length(p_link_revision)>80 OR length(p_work_revision)>80 THEN RAISE EXCEPTION 'Unsupported identity' USING ERRCODE='22023'; END IF;
 -- Same actor membership precedes request/link/Work and original snapshot locks.
 SELECT * INTO req FROM public.busy_mini_app_requests WHERE business_id=p_business_id AND id=p_request_id FOR SHARE;
 IF NOT FOUND OR req.request_type<>'booking_request' THEN RAISE EXCEPTION 'Request unavailable' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.busy_mini_apps WHERE id=req.mini_app_id AND business_id=p_business_id FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Foreign app' USING ERRCODE='42501'; END IF;
 SELECT * INTO linked FROM public.busy_mini_app_request_links WHERE business_id=p_business_id AND request_id=p_request_id FOR SHARE;
 IF NOT FOUND OR linked.linked_by IS DISTINCT FROM actor OR linked.customer_record_id IS DISTINCT FROM p_customer_id OR linked.action_record_id IS DISTINCT FROM p_action_id THEN RAISE EXCEPTION 'Association unavailable' USING ERRCODE='42501'; END IF;
 SELECT * INTO work FROM public.busy_mini_app_work_bookings WHERE business_id=p_business_id AND request_id=p_request_id FOR SHARE;
 IF NOT FOUND OR work.confirmed_by IS DISTINCT FROM actor OR work.mini_app_id IS DISTINCT FROM req.mini_app_id OR work.customer_record_id IS DISTINCT FROM p_customer_id OR work.action_record_id IS DISTINCT FROM p_action_id OR work.source<>'business_app_request_v3181' THEN RAISE EXCEPTION 'Work unavailable' USING ERRCODE='42501'; END IF;
 IF extract(second FROM work.calendar_time)<>0 OR work.calendar_date<DATE '2000-01-01' OR work.calendar_date>DATE '2099-12-31' OR length(work.calendar_timezone)>64 OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name=work.calendar_timezone) THEN RAISE EXCEPTION 'Unsupported diary source' USING ERRCODE='22023'; END IF;
 IF NOT ((req.status='accepted' AND linked.bridge_state='booking_confirmed' AND work.state='confirmed') OR (req.status='closed' AND linked.bridge_state='closed' AND work.state='cancelled')) THEN RAISE EXCEPTION 'Source records disagree' USING ERRCODE='40001'; END IF;
 BEGIN
  IF req.updated_at IS DISTINCT FROM p_request_revision::timestamptz OR linked.updated_at IS DISTINCT FROM p_link_revision::timestamptz OR work.updated_at IS DISTINCT FROM p_work_revision::timestamptz THEN RAISE EXCEPTION 'Source revision conflict' USING ERRCODE='40001'; END IF;
 EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN RAISE EXCEPTION 'Invalid source revision' USING ERRCODE='22023'; END;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR SHARE;
 IF NOT FOUND OR snap.revision IS DISTINCT FROM p_expected_revision OR snap.schema_version IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001'; END IF;
 IF jsonb_typeof(snap.payload->'customers') IS DISTINCT FROM 'array' OR jsonb_array_length(snap.payload->'customers')>3000 OR jsonb_typeof(snap.payload->'replyActions') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Unsupported collections' USING ERRCODE='22023'; END IF;
 SELECT count(*) INTO total FROM jsonb_array_elements(snap.payload->'customers') c WHERE c->>'id'=p_customer_id;
 IF total<>1 THEN RAISE EXCEPTION 'Missing or ambiguous customer' USING ERRCODE='22023'; END IF;
 SELECT c INTO customer FROM jsonb_array_elements(snap.payload->'customers') c WHERE c->>'id'=p_customer_id;
 IF (customer ? 'businessId' AND customer->>'businessId' IS DISTINCT FROM p_business_id::text) OR (customer ? 'business_id' AND customer->>'business_id' IS DISTINCT FROM p_business_id::text) OR (customer ? 'ownerId' AND customer->>'ownerId' IS DISTINCT FROM actor::text) THEN RAISE EXCEPTION 'Customer scope mismatch' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(customer->'name') IS DISTINCT FROM 'string' OR length(customer->>'name') NOT BETWEEN 1 AND 240 OR jsonb_typeof(customer->'service') IS DISTINCT FROM 'string' OR length(customer->>'service') NOT BETWEEN 1 AND 240 THEN RAISE EXCEPTION 'Unsupported customer' USING ERRCODE='22023'; END IF;
 action:=snap.payload->'replyActions'->p_customer_id;details:=action->'details';
 IF action->>'type' IS DISTINCT FROM 'booking' OR jsonb_typeof(details) IS DISTINCT FROM 'object' OR details->>'sourceMiniAppRequestId' IS DISTINCT FROM p_request_id::text THEN RAISE EXCEPTION 'Work action mismatch' USING ERRCODE='42501'; END IF;
 IF details->>'bookingStatus' IS NULL OR details->>'bookingStatus' NOT IN ('Draft','Confirmed','Cancelled') OR jsonb_typeof(details->'bookingDate') IS DISTINCT FROM 'string' OR jsonb_typeof(details->'bookingTime') IS DISTINCT FROM 'string' OR length(details->>'bookingDate')>10 OR length(details->>'bookingTime')>5 THEN RAISE EXCEPTION 'Unsupported booking' USING ERRCODE='22023'; END IF;
 IF (details->>'bookingDate'<>'' AND details->>'bookingDate' !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$') OR (details->>'bookingTime'<>'' AND details->>'bookingTime' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') OR (details->>'bookingStatus'<>'Draft' AND (details->>'bookingDate'='' OR details->>'bookingTime'='')) THEN RAISE EXCEPTION 'Malformed booking slot' USING ERRCODE='22023'; END IF;
 BEGIN IF details->>'bookingDate'<>'' THEN PERFORM (details->>'bookingDate')::date; END IF; EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN RAISE EXCEPTION 'Invalid booking date' USING ERRCODE='22023'; END;
 agrees:=details->>'bookingDate'=work.calendar_date::text AND details->>'bookingTime'=to_char(work.calendar_time,'HH24:MI') AND details->>'bookingStatus'=CASE WHEN work.state='confirmed' THEN 'Confirmed' ELSE 'Cancelled' END;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',actor,'requestId',p_request_id,'appId',req.mini_app_id,'revision',snap.revision,'schemaVersion',snap.schema_version,'requestRevision',p_request_revision,'linkRevision',p_link_revision,'workRevision',p_work_revision,'customer',jsonb_build_object('id',p_customer_id,'name',customer->>'name','service',customer->>'service'),'action',jsonb_build_object('id',p_action_id,'type','booking','status',details->>'bookingStatus','date',details->>'bookingDate','time',details->>'bookingTime'),'ledger',jsonb_build_object('id',work.id,'date',work.calendar_date::text,'time',to_char(work.calendar_time,'HH24:MI'),'timeZone',work.calendar_timezone,'state',work.state),'matchesLedger',agrees,'readOnly',true,'notOwnReceipt',true,'canRestore',false);
END $$;
ALTER FUNCTION public.busy_owner_booking_work_review_v1(uuid,uuid,text,text,bigint,text,text,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_owner_booking_work_review_v1(uuid,uuid,text,text,bigint,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_owner_booking_work_review_v1(uuid,uuid,text,text,bigint,text,text,text) TO authenticated;
COMMIT;
