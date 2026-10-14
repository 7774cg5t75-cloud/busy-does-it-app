-- CI only; runs after real V3.225 guest requests and V3.226
-- notification intents were inserted, and after the real V3.227
-- dispatch lease SQL was applied. No provider request, no cron, ROLLBACK.
\set ON_ERROR_STOP on
do $$
declare
 v_one record;v_two record;v_next record;
 v_count integer;
 v_hash text := repeat('a',64);
 v_c uuid;
begin
 if has_function_privilege('anon','public.busy_guest_alert_claim_one_v3227()','execute') or
    has_function_privilege('authenticated','public.busy_guest_alert_claim_one_v3227()','execute') or
    has_function_privilege('authenticated','public.busy_guest_alert_complete_v3227(uuid,uuid,text,text)','execute') or
    has_function_privilege('anon','public.busy_guest_alert_quarantine_expired_v3227()','execute') or
    not has_function_privilege('service_role','public.busy_guest_alert_claim_one_v3227()','execute')
 then raise exception 'Dispatch RPC privileges not scoped to service';end if;
 -- Claim 2 separate tenant-scoped requests; third claim empty.
 select * into v_one from public.busy_guest_alert_claim_one_v3227();
 select * into v_two from public.busy_guest_alert_claim_one_v3227();
 if v_one.intent_id is null or v_two.intent_id is null
 or v_one.intent_id=v_two.intent_id
 or v_one.business_id=v_two.business_id or
 v_one.lease_token is null or v_two.lease_token is null
 then raise exception 'Guest alert claim reused a tenant/lease';end if;
 select * into v_next from public.busy_guest_alert_claim_one_v3227();
 if v_next.intent_id is not null then raise exception 'Claim stole already claimed work';end if;
 if public.busy_guest_alert_complete_v3227(v_one.intent_id,gen_random_uuid(),
       'provider_accepted',v_hash) then
   raise exception 'Incorrect lease can acknowledge provider';end if;
 if public.busy_guest_alert_complete_v3227(v_one.intent_id,v_one.lease_token,
       'provider_accepted','short') then
   raise exception 'Invalid provider receipt digest accepted';end if;
 if not public.busy_guest_alert_complete_v3227(v_one.intent_id,v_one.lease_token,
       'provider_accepted',v_hash) then
   raise exception 'Valid provider-accepted acknowledgement failed';end if;
 if public.busy_guest_alert_complete_v3227(v_one.intent_id,v_one.lease_token,
       'provider_accepted',v_hash) then
   raise exception 'Same lease could be acknowledged twice';end if;
 if (select state from public.busy_mini_app_guest_notification_intents
     where id=v_one.intent_id)<>'provider_accepted'
 or (select provider_receipt_sha256 from public.busy_mini_app_guest_notification_intents
     where id=v_one.intent_id)<>v_hash then
   raise exception 'Provider accepted evidence was not persisted';end if;

 -- A definite provider rejection may have a bounded delayed retry.
 if not public.busy_guest_alert_complete_v3227(v_two.intent_id,v_two.lease_token,
       'definitively_rejected',null) then
   raise exception 'Definite rejection handling failed';end if;
 if (select state from public.busy_mini_app_guest_notification_intents
      where id=v_two.intent_id)<>'retry_wait' then
   raise exception 'Definite rejection did not enter delayed retry';end if;
 select * into v_next from public.busy_guest_alert_claim_one_v3227();
 if v_next.intent_id is not null then
   raise exception 'Backoff was bypassed with immediate retry';end if;
 update public.busy_mini_app_guest_notification_intents
 set available_at=now()-interval '1 second' where id=v_two.intent_id;
 select * into v_next from public.busy_guest_alert_claim_one_v3227();
 if v_next.intent_id<>v_two.intent_id or v_next.lease_token=v_two.lease_token
 then raise exception 'New retry lease was not isolated';end if;
 -- An UNCERTAIN provider result must quarantine and NEVER auto resend.
 if not public.busy_guest_alert_complete_v3227(v_next.intent_id,v_next.lease_token,
       'uncertain',null) then raise exception 'Uncertain result rejected';end if;
 if (select state from public.busy_mini_app_guest_notification_intents
      where id=v_two.intent_id)<>'manual_review' then
   raise exception 'Uncertain result was made auto-retryable';end if;
 select * into v_next from public.busy_guest_alert_claim_one_v3227();
 if v_next.intent_id is not null then
   raise exception 'Manual-review work was claimed automatically';end if;
 -- Simulated crashed claim: do NOT reclaim; quarantine to human review.
 update public.busy_mini_app_guest_notification_intents
 set state='claimed',lease_token=gen_random_uuid(),
     lease_expires_at=now()-interval '2 seconds' where id=v_two.intent_id;
 if public.busy_guest_alert_quarantine_expired_v3227()<>1 then
   raise exception 'Expired claim not quarantined';end if;
 if (select state from public.busy_mini_app_guest_notification_intents
      where id=v_two.intent_id)<>'manual_review' then
   raise exception 'Expired claim was silently recycled';end if;
 if public.busy_guest_alert_complete_v3227(v_two.intent_id,v_two.lease_token,
       'provider_accepted',v_hash) then
   raise exception 'Stale claimed lease acknowledged late';end if;
 -- Retains original two requests; no new customer record.
 if (select count(*) from public.busy_mini_app_requests)<>2
 or (select count(*) from public.busy_mini_app_guest_notification_intents)<>2 then
   raise exception 'Dispatch mutated original customer records';end if;
end $$;
select 'V3.227_DISPATCH_LEASES_AND_NO_DUPLICATE_SEND_PASS' as dispatch_rehearsal;
