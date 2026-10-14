-- V3.229 ephemeral Postgres ONLY, after actual guest RPC/outbox/leases
-- and V3.229 schema. Never deploy this fixture.
\set ON_ERROR_STOP on
do $$
declare
 v_id uuid;
 v_other uuid;
 v_claim record;
 v_bogus jsonb;
 v_mixed jsonb;
 v_all_ok jsonb;
 v_a text:=repeat('a',64);
 v_b text:=repeat('b',64);
 v_c text:=repeat('c',64);
begin
 if has_table_privilege('anon',
   'public.busy_mini_app_guest_alert_device_attempts_v3229','select') or
    has_table_privilege('authenticated',
   'public.busy_mini_app_guest_alert_device_attempts_v3229','select') or
    not has_table_privilege('service_role',
   'public.busy_mini_app_guest_alert_device_attempts_v3229','insert') or
    has_function_privilege('authenticated',
   'public.busy_guest_alert_finalize_attempt_v3229(uuid,uuid,text,text,jsonb)','execute') or
    not has_function_privilege('service_role',
   'public.busy_guest_alert_finalize_attempt_v3229(uuid,uuid,text,text,jsonb)','execute')
 then raise exception 'Device evidence privileges are not private';end if;

 select id into v_id from public.busy_mini_app_guest_notification_intents
 where state='manual_review' order by id limit 1;
 select id into v_other from public.busy_mini_app_guest_notification_intents
 where state='provider_accepted' order by id limit 1;
 if v_id is null or v_other is null or v_id=v_other
 then raise exception 'Expected V3.227 guest alert fixtures missing';end if;

 -- CI-only reset creates a fresh claim. Production has no reset/retry RPC.
 update public.busy_mini_app_guest_notification_intents
 set state='pending',attempt_count=0,available_at=pg_catalog.now()-interval '1 second',
     lease_token=null,lease_expires_at=null,
     provider_accepted_at=null,provider_receipt_sha256=null
 where id=v_id;
 select * into v_claim from public.busy_guest_alert_claim_one_v3227();
 if v_claim.intent_id<>v_id then
  raise exception 'Wrong original intent claimed for partial device send';end if;
 v_mixed:=pg_catalog.jsonb_build_array(
   pg_catalog.jsonb_build_object('slot',0,'device_hash',v_b,
     'state','accepted','ticket_id','ticket-fixture-1001'),
   pg_catalog.jsonb_build_object('slot',1,'device_hash',v_c,
     'state','rejected','ticket_id',null));
 if public.busy_guest_alert_finalize_attempt_v3229(v_claim.intent_id,
      gen_random_uuid(),'uncertain',null,v_mixed)
 then raise exception 'Wrong lease finalised ticket details';end if;
 if not public.busy_guest_alert_finalize_attempt_v3229(v_claim.intent_id,
      v_claim.lease_token,'uncertain',null,v_mixed)
 then raise exception 'Mixed-device evidence not committed with original intent';end if;
 if (select state from public.busy_mini_app_guest_notification_intents
     where id=v_id)<>'manual_review'
 or (select count(*) from public.busy_mini_app_guest_alert_device_attempts_v3229
     where intent_id=v_id)<>2
 or (select count(*) from public.busy_mini_app_guest_alert_device_attempts_v3229
     where intent_id=v_id and gateway_state='accepted')<>1
 then raise exception 'Mixed success was lost, duplicated or made retryable';end if;
 if public.busy_guest_alert_finalize_attempt_v3229(v_claim.intent_id,
      v_claim.lease_token,'uncertain',null,v_mixed)
 then raise exception 'Leased attempt was finalised twice';end if;

 update public.busy_mini_app_guest_notification_intents
 set state='pending',attempt_count=0,available_at=pg_catalog.now()-interval '1 second',
     lease_token=null,lease_expires_at=null,
     provider_accepted_at=null,provider_receipt_sha256=null
 where id=v_other;
 select * into v_claim from public.busy_guest_alert_claim_one_v3227();
 if v_claim.intent_id<>v_other then raise exception 'Second tenant claim mismatch';end if;
 v_all_ok:=pg_catalog.jsonb_build_array(
   pg_catalog.jsonb_build_object('slot',0,'device_hash',v_b,
     'state','accepted','ticket_id','ticket-fixture-2001'),
   pg_catalog.jsonb_build_object('slot',1,'device_hash',v_c,
     'state','accepted','ticket_id','ticket-fixture-2002'));
 if not public.busy_guest_alert_finalize_attempt_v3229(v_claim.intent_id,
      v_claim.lease_token,'provider_accepted',v_a,v_all_ok)
 then raise exception 'All gateway-accepted evidence failed';end if;
 if (select state from public.busy_mini_app_guest_notification_intents
       where id=v_other)<>'provider_accepted' or
    (select count(*) from public.busy_mini_app_guest_alert_device_attempts_v3229
       where intent_id=v_other and receipt_state='not_checked')<>2
 then raise exception 'Acceptance conflated with device receipt or was not saved';end if;
 if (select count(*) from public.busy_mini_app_requests)<>2
 then raise exception 'Device evidence modified original customer requests';end if;
end $$;
select 'V3.229_PER_DEVICE_EVIDENCE_TRANSACTION_PASS' as verdict;
