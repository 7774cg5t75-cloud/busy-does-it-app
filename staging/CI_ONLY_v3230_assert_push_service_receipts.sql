-- V3.230 disposable PostgreSQL ONLY, following V3.229 original attempt
-- and first-class V3.230 receipt migration. Entire scenario ROLLBACKS.
\set ON_ERROR_STOP on
do $$
declare
 v_accepted uuid;
 v_mixed uuid;
 v_first record;
 v_second record;
 v_expired record;
begin
 if has_function_privilege('anon',
   'public.busy_guest_alert_record_push_service_receipt_v3230(uuid,integer,integer,text,text,text)','execute')
 or has_function_privilege('authenticated',
   'public.busy_guest_alert_record_push_service_receipt_v3230(uuid,integer,integer,text,text,text)','execute')
 or not has_function_privilege('service_role',
   'public.busy_guest_alert_record_push_service_receipt_v3230(uuid,integer,integer,text,text,text)','execute')
 or has_table_privilege('anon',
    'public.busy_mini_app_guest_alert_device_attempts_v3229','update')
 or has_table_privilege('authenticated',
    'public.busy_mini_app_guest_alert_device_attempts_v3229','update')
 then raise exception 'Receipt authorisation was made public';end if;
 select id into v_accepted
 from public.busy_mini_app_guest_notification_intents
 where state='provider_accepted' order by id limit 1;
 select id into v_mixed
 from public.busy_mini_app_guest_notification_intents
 where state='manual_review' order by id limit 1;
 if v_accepted is null or v_mixed is null or v_accepted=v_mixed
 then raise exception 'Original two-tenant notification proof missing';end if;

 select * into v_first
 from public.busy_mini_app_guest_alert_device_attempts_v3229
 where intent_id=v_accepted and ticket_id='ticket-fixture-2001';
 select * into v_second
 from public.busy_mini_app_guest_alert_device_attempts_v3229
 where intent_id=v_accepted and ticket_id='ticket-fixture-2002';
 select * into v_expired
 from public.busy_mini_app_guest_alert_device_attempts_v3229
 where intent_id=v_mixed and ticket_id='ticket-fixture-1001';
 if v_first.ticket_id is null or v_second.ticket_id is null
    or v_expired.ticket_id is null
 then raise exception 'Real gateway tickets not recorded before receipt';end if;
 if not public.busy_guest_alert_record_push_service_receipt_v3230(
  v_first.intent_id,v_first.attempt_no,v_first.recipient_slot,
  v_first.ticket_id,'push_service_accepted',null)
 then raise exception 'Expo accepted push service evidence failed';end if;
 if public.busy_guest_alert_record_push_service_receipt_v3230(
  v_first.intent_id,v_first.attempt_no,v_first.recipient_slot,
  v_first.ticket_id,'push_service_rejected','DeviceNotRegistered')
 then raise exception 'Terminal accepted receipt overwritten by error';end if;
 if public.busy_guest_alert_record_push_service_receipt_v3230(
  v_first.intent_id,v_first.attempt_no,v_first.recipient_slot,
  'ticket-fixture-wrong','push_service_accepted',null)
 then raise exception 'Wrong ticket could reconcile a real device';end if;
 if public.busy_guest_alert_record_push_service_receipt_v3230(
  v_second.intent_id,v_second.attempt_no,v_second.recipient_slot,
  v_second.ticket_id,'push_service_rejected','untrusted-provider-text')
 then raise exception 'Unbounded provider detail persisted';end if;
 if not public.busy_guest_alert_record_push_service_receipt_v3230(
  v_second.intent_id,v_second.attempt_no,v_second.recipient_slot,
  v_second.ticket_id,'push_service_rejected','DeviceNotRegistered')
 then raise exception 'Negative Expo receipt evidence failed';end if;
 if (select count(*) from public.busy_mini_app_guest_alert_device_attempts_v3229
      where intent_id=v_accepted and push_service_state='push_service_accepted')<>1
 or (select count(*) from public.busy_mini_app_guest_alert_device_attempts_v3229
      where intent_id=v_accepted and push_service_state='push_service_rejected')<>1
 then raise exception 'Receipt state counts disagree with original tickets';end if;
 -- This modifies only the ephemeral TEST ticket deadline, never production.
 update public.busy_mini_app_guest_alert_device_attempts_v3229
 set ticket_expires_at=pg_catalog.now()-interval '1 minute'
 where intent_id=v_expired.intent_id and recipient_slot=v_expired.recipient_slot
   and attempt_no=v_expired.attempt_no;
 if public.busy_guest_alert_record_push_service_receipt_v3230(
  v_expired.intent_id,v_expired.attempt_no,v_expired.recipient_slot,
  v_expired.ticket_id,'push_service_accepted',null)
 then raise exception 'Expired ticket was treated as push-service accepted';end if;
 if not public.busy_guest_alert_record_push_service_receipt_v3230(
  v_expired.intent_id,v_expired.attempt_no,v_expired.recipient_slot,
  v_expired.ticket_id,'expired_unverified',null)
 then raise exception 'Expired ticket was not marked unverified';end if;
 if public.busy_guest_alert_record_push_service_receipt_v3230(
  v_expired.intent_id,v_expired.attempt_no,v_expired.recipient_slot,
  v_expired.ticket_id,'expired_unverified',null)
 then raise exception 'Expiry replay mutated an existing result';end if;
 if (select count(*) from public.busy_mini_app_requests)<>2
 or (select count(*) from public.busy_mini_app_guest_notification_intents)<>2
 then raise exception 'Receipt reconciliation altered customer requests';end if;
end $$;
select 'V3.230_PUSH_SERVICE_RECEIPTS_MONOTONE_AND_PRIVATE_PASS' as verdict;
