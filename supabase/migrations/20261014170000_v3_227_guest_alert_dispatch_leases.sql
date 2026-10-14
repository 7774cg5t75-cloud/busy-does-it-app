-- V3.227 — SAFE-SOURCE dispatch state machine. NOT installed or active.
-- Depends on V3.226's request-linked outbox. No cron, no provider calls,
-- no automatic retries of uncertain provider results and no customer PII.
--
-- All RPC functions are SECURITY INVOKER; service_role alone can execute
-- against a private outbox. They do NOT run with definer/owner privileges.

alter table public.busy_mini_app_guest_notification_intents
  add column if not exists lease_token uuid,
  add column if not exists provider_receipt_sha256 text;

alter table public.busy_mini_app_guest_notification_intents
  add constraint busy_guest_alert_receipt_sha_v3227
    check (provider_receipt_sha256 is null or
           provider_receipt_sha256 ~ '^[0-9a-f]{64}$'),
  add constraint busy_guest_alert_lease_shape_v3227
    check (
      (state = 'claimed' and lease_token is not null
        and lease_expires_at is not null)
      or (state <> 'claimed' and lease_token is null)
    );

-- Claims ONE eligible intent under a row lock. Skip locked ensures that
-- competing workers cannot take the same request simultaneously.
-- An expired claim is NEVER eligible for automatic reclaim: the provider
-- may have accepted it before acknowledgement failed.
create or replace function public.busy_guest_alert_claim_one_v3227()
returns table (
 intent_id uuid, request_id uuid, business_id uuid,
 mini_app_id uuid, lease_token uuid, attempt_no integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
 v_id uuid;
 v_token uuid;
begin
 select i.id into v_id
 from public.busy_mini_app_guest_notification_intents i
 where i.state in ('pending','retry_wait')
   and i.available_at <= pg_catalog.now()
   and i.attempt_count < 3
 order by i.available_at,i.created_at,i.id
 for update of i skip locked
 limit 1;
 if v_id is null then return; end if;
 v_token := gen_random_uuid();
 return query
  update public.busy_mini_app_guest_notification_intents i
  set state='claimed', lease_token=v_token,
      lease_expires_at=pg_catalog.now()+interval '90 seconds',
      attempt_count=i.attempt_count+1,
      last_attempt_at=pg_catalog.now(),updated_at=pg_catalog.now()
  where i.id=v_id and i.state in ('pending','retry_wait')
  returning i.id,i.request_id,i.business_id,i.mini_app_id,
            i.lease_token,i.attempt_count;
end;
$$;

-- Caller must independently verify the provider result before claiming
-- acceptance. A receipt SHA is evidence of source data, not device delivery.
-- "uncertain" ALWAYS goes to manual_review: NEVER blind retry.
-- A definitely rejected delivery is retryable only twice with backoff.
create or replace function public.busy_guest_alert_complete_v3227(
 p_intent_id uuid,p_lease_token uuid,p_outcome text,
 p_receipt_sha256 text default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
 v_count integer;
begin
 if p_intent_id is null or p_lease_token is null
    or p_outcome not in ('provider_accepted','definitively_rejected','uncertain')
    or (p_outcome='provider_accepted' and
        (p_receipt_sha256 is null or
         p_receipt_sha256 !~ '^[0-9a-f]{64}$'))
    or (p_outcome<>'provider_accepted' and p_receipt_sha256 is not null)
 then return false; end if;
 update public.busy_mini_app_guest_notification_intents i
 set state=case
    when p_outcome='provider_accepted' then 'provider_accepted'
    when p_outcome='uncertain' or i.attempt_count>=3 then 'manual_review'
    else 'retry_wait' end,
   available_at=case when p_outcome='definitively_rejected'
       then pg_catalog.now()+interval '10 minutes'
       else i.available_at end,
   provider_accepted_at=case when p_outcome='provider_accepted'
       then pg_catalog.now() else null end,
   provider_receipt_sha256=case when p_outcome='provider_accepted'
       then p_receipt_sha256 else null end,
   lease_token=null,lease_expires_at=null,
   updated_at=pg_catalog.now()
 where i.id=p_intent_id and i.lease_token=p_lease_token
   and i.state='claimed' and i.lease_expires_at>pg_catalog.now();
 get diagnostics v_count=row_count;
 return v_count=1;
end;
$$;

-- If the process crashed after a provider request, do not resend an
-- expired lease automatically. An operator must review the original request,
-- provider ticket and real send status before manual recovery.
create or replace function public.busy_guest_alert_quarantine_expired_v3227()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare v_count integer;
begin
 update public.busy_mini_app_guest_notification_intents i
 set state='manual_review',lease_token=null,lease_expires_at=null,
     updated_at=pg_catalog.now()
 where i.state='claimed' and i.lease_expires_at<=pg_catalog.now();
 get diagnostics v_count=row_count;
 return v_count;
end;
$$;

revoke all on function public.busy_guest_alert_claim_one_v3227()
 from public,anon,authenticated;
revoke all on function public.busy_guest_alert_complete_v3227(uuid,uuid,text,text)
 from public,anon,authenticated;
revoke all on function public.busy_guest_alert_quarantine_expired_v3227()
 from public,anon,authenticated;
grant execute on function public.busy_guest_alert_claim_one_v3227()
 to service_role;
grant execute on function public.busy_guest_alert_complete_v3227(uuid,uuid,text,text)
 to service_role;
grant execute on function public.busy_guest_alert_quarantine_expired_v3227()
 to service_role;

comment on function public.busy_guest_alert_claim_one_v3227() is
 'Service-only atomic claim for a guest-request notification intent. Does not contact providers.';
