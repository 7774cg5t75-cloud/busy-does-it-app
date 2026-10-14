-- V3.229 SOURCE ONLY: private per-device gateway evidence for existing guest alert
-- intents. NOT installed in hosted staging/production. No cron/provider calls.
-- Depends on V3.226 guest intents and V3.227 service-only lease RPCs.
-- Contains NO customer contact, Expo device token, or client-readable rows.
create table public.busy_mini_app_guest_alert_device_attempts_v3229 (
 intent_id uuid not null references public.busy_mini_app_guest_notification_intents(id)
   on delete cascade,
 attempt_no integer not null check (attempt_no between 1 and 3),
 recipient_slot integer not null check (recipient_slot between 0 and 19),
 device_hmac_sha256 text not null check (device_hmac_sha256 ~ '^[0-9a-f]{64}$'),
 gateway_state text not null check (gateway_state in ('accepted','rejected','unknown')),
 ticket_id text,
 ticket_expires_at timestamptz,
 receipt_state text not null default 'not_checked'
   check (receipt_state in ('not_checked','provider_delivered','provider_error','uncertain')),
 created_at timestamptz not null default pg_catalog.now(),
 primary key (intent_id,attempt_no,recipient_slot),
 constraint busy_guest_alert_ticket_shape_v3229 check (
  (gateway_state='accepted' and ticket_id is not null and
    ticket_id ~ '^[A-Za-z0-9_-]{5,120}$' and ticket_expires_at is not null)
  or (gateway_state<>'accepted' and ticket_id is null and ticket_expires_at is null)
 )
);
create unique index busy_guest_alert_ticket_once_v3229
 on public.busy_mini_app_guest_alert_device_attempts_v3229(intent_id,attempt_no,ticket_id)
 where ticket_id is not null;
create index busy_guest_alert_device_review_v3229
 on public.busy_mini_app_guest_alert_device_attempts_v3229
 (intent_id,attempt_no,gateway_state);

alter table public.busy_mini_app_guest_alert_device_attempts_v3229
 enable row level security;
alter table public.busy_mini_app_guest_alert_device_attempts_v3229
 force row level security;
revoke all on table public.busy_mini_app_guest_alert_device_attempts_v3229
 from public,anon,authenticated;
grant select,insert on table public.busy_mini_app_guest_alert_device_attempts_v3229
 to service_role;
-- Service_role deliberately cannot UPDATE receipt_state here. A future
-- reviewed, receipt-verified RPC will be necessary before delivery claims.
-- This migration itself does not contact Expo or check delivery receipts.

-- Persist all device attempts and update the original leased intent in ONE
-- Postgres transaction. If ANY device row or lease acknowledgement fails,
-- the whole transaction rolls back and the expired lease is quarantined.
-- There is no second request/outbox and no automatic retry for unknown sends.
create function public.busy_guest_alert_finalize_attempt_v3229(
 p_intent_id uuid,p_lease_token uuid,p_outcome text,
 p_receipt_sha256 text,p_device_results jsonb
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
 v_attempt integer;
 v_row jsonb;
 v_slot integer;
 v_state text;
 v_device_hash text;
 v_ticket text;
 v_count integer:=0;
 v_accepted integer:=0;
 v_rejected integer:=0;
 v_unknown integer:=0;
begin
 if p_intent_id is null or p_lease_token is null
    or p_outcome not in ('provider_accepted','definitively_rejected','uncertain')
    or p_device_results is null or pg_catalog.jsonb_typeof(p_device_results)<>'array'
    or pg_catalog.jsonb_array_length(p_device_results)>20
 then return false; end if;

 select i.attempt_count into v_attempt
 from public.busy_mini_app_guest_notification_intents i
 where i.id=p_intent_id and i.lease_token=p_lease_token
   and i.state='claimed' and i.lease_expires_at>pg_catalog.now()
 for update;
 if v_attempt is null or v_attempt<1 or v_attempt>3 then return false; end if;

 for v_row in select value from pg_catalog.jsonb_array_elements(p_device_results) loop
  if pg_catalog.jsonb_typeof(v_row)<>'object' or
     (select pg_catalog.count(*) from pg_catalog.jsonb_object_keys(v_row) as keys(k))<>4 or
     not (v_row ?& array['slot','device_hash','state','ticket_id'])
  then raise exception 'Invalid device evidence shape'; end if;
  if (v_row->>'slot') !~ '^(0|[1-9]|1[0-9])$'
  then raise exception 'Invalid device slot'; end if;
  v_slot:=(v_row->>'slot')::integer;
  v_device_hash:=v_row->>'device_hash';
  v_state:=v_row->>'state';
  v_ticket:=v_row->>'ticket_id';
  if v_device_hash is null or v_device_hash !~ '^[0-9a-f]{64}$'
      or v_state not in ('accepted','rejected','unknown')
      or (v_state='accepted' and
          (v_ticket is null or v_ticket !~ '^[A-Za-z0-9_-]{5,120}$'))
      or (v_state<>'accepted' and v_ticket is not null)
  then raise exception 'Invalid device evidence value'; end if;
  insert into public.busy_mini_app_guest_alert_device_attempts_v3229
   (intent_id,attempt_no,recipient_slot,device_hmac_sha256,
     gateway_state,ticket_id,ticket_expires_at)
   values (p_intent_id,v_attempt,v_slot,v_device_hash,v_state,v_ticket,
    case when v_state='accepted' then pg_catalog.now()+interval '24 hours'
         else null end);
  v_count:=v_count+1;
  if v_state='accepted' then v_accepted:=v_accepted+1;end if;
  if v_state='rejected' then v_rejected:=v_rejected+1;end if;
  if v_state='unknown' then v_unknown:=v_unknown+1;end if;
 end loop;
 if (p_outcome='provider_accepted' and
       (v_count=0 or v_accepted<>v_count or v_unknown>0 or v_rejected>0))
    or (p_outcome='definitively_rejected' and
       (v_count=0 or v_rejected<>v_count))
    or (p_outcome='uncertain' and v_count>0 and
       (v_accepted=v_count or v_rejected=v_count))
 then raise exception 'Device ticket counts do not match claimed result';end if;

 if not public.busy_guest_alert_complete_v3227(
    p_intent_id,p_lease_token,p_outcome,p_receipt_sha256)
 then raise exception 'Original dispatch lease could not be acknowledged';end if;
 return true;
end;
$$;
revoke all on function public.busy_guest_alert_finalize_attempt_v3229(uuid,uuid,text,text,jsonb)
 from public,anon,authenticated;
grant execute on function public.busy_guest_alert_finalize_attempt_v3229(uuid,uuid,text,text,jsonb)
 to service_role;
comment on table public.busy_mini_app_guest_alert_device_attempts_v3229 is
 'Private service-only gateway tickets by original notification intent; receipt_state not_checked is NOT delivered.';
