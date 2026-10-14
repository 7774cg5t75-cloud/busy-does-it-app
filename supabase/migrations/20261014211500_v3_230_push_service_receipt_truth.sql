-- V3.230 source only. NOT deployed. No cron, provider call or device claim.
-- Expands V3.229's ORIGINAL private attempt ledger with EXPO RECEIPT
-- outcome, meaning hand-off to Apple/Google push service at most.
-- Expo receipt 'ok' is NOT proof of phone delivery, display or owner read.
-- No raw Expo tokens, customer contacts or provider payloads are stored.
alter table public.busy_mini_app_guest_alert_device_attempts_v3229
 add column push_service_state text not null default 'not_checked'
  check (push_service_state in
   ('not_checked','push_service_accepted','push_service_rejected','expired_unverified')),
 add column push_service_checked_at timestamptz,
 add column push_service_error_code text
  check (push_service_error_code is null or push_service_error_code in
   ('DeviceNotRegistered','MessageTooBig','MessageRateExceeded',
    'MismatchSenderId','InvalidCredentials','OtherProviderError')),
 add constraint busy_guest_receipt_evidence_shape_v3230 check (
  (push_service_state='not_checked' and push_service_checked_at is null
   and push_service_error_code is null)
  or (push_service_state='push_service_accepted'
   and push_service_checked_at is not null and push_service_error_code is null)
  or (push_service_state='push_service_rejected'
   and push_service_checked_at is not null and push_service_error_code is not null)
  or (push_service_state='expired_unverified'
   and push_service_checked_at is not null and push_service_error_code is null)
 );

create index busy_guest_receipt_pending_v3230
 on public.busy_mini_app_guest_alert_device_attempts_v3229
  (ticket_expires_at,intent_id,attempt_no,recipient_slot)
 where gateway_state='accepted' and push_service_state='not_checked';

-- Monotone compare-and-swap on one ALREADY recorded, accepted gateway ticket.
-- This service-only routine does not fetch or independently verify Expo;
-- only the separately disabled provider worker may supply actual results.
-- No alternative write privilege for authenticated/anon callers.
grant update (push_service_state,push_service_checked_at,push_service_error_code)
 on public.busy_mini_app_guest_alert_device_attempts_v3229 to service_role;

create function public.busy_guest_alert_record_push_service_receipt_v3230(
 p_intent_id uuid,p_attempt_no integer,p_recipient_slot integer,
 p_ticket_id text,p_result text,p_error_code text default null
)
returns boolean
language plpgsql
security invoker
set search_path=''
as $$
declare
 v_updated integer;
 v_error text;
begin
 if p_intent_id is null or p_attempt_no is null or
    p_attempt_no not between 1 and 3 or p_recipient_slot is null or
    p_recipient_slot not between 0 and 19 or
    p_ticket_id is null or
    p_ticket_id !~ '^[A-Za-z0-9_-]{5,120}$' or
    p_result is null or p_result not in
       ('push_service_accepted','push_service_rejected','expired_unverified')
 then return false;end if;
 if p_result='push_service_rejected' then
  if p_error_code is null or p_error_code not in
   ('DeviceNotRegistered','MessageTooBig','MessageRateExceeded',
    'MismatchSenderId','InvalidCredentials','OtherProviderError')
  then return false;end if;
 elsif p_error_code is not null then
  return false;
 end if;
 -- Expiry is controlled by the original immutable ticket deadline.
 -- No receipt should overwrite a terminal decision or resurrect expiry.
 update public.busy_mini_app_guest_alert_device_attempts_v3229 d
 set push_service_state=p_result,
     push_service_checked_at=pg_catalog.now(),
     push_service_error_code=p_error_code
 where d.intent_id=p_intent_id and d.attempt_no=p_attempt_no
   and d.recipient_slot=p_recipient_slot and d.ticket_id=p_ticket_id
   and d.gateway_state='accepted' and d.push_service_state='not_checked'
   and d.ticket_expires_at is not null
   and ((p_result='expired_unverified'
         and d.ticket_expires_at<=pg_catalog.now())
     or (p_result<>'expired_unverified'
         and d.ticket_expires_at>pg_catalog.now()));
 get diagnostics v_updated=row_count;
 return v_updated=1;
end;
$$;
revoke all on function
 public.busy_guest_alert_record_push_service_receipt_v3230(uuid,integer,integer,text,text,text)
 from public,anon,authenticated;
grant execute on function
 public.busy_guest_alert_record_push_service_receipt_v3230(uuid,integer,integer,text,text,text)
 to service_role;
comment on function public.busy_guest_alert_record_push_service_receipt_v3230(uuid,integer,integer,text,text,text) is
 'Service-only, first terminal push-service receipt wins; never proves on-device delivery or owner read.';
