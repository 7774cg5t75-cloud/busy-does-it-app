-- V3.231 EPHEMERAL PostgreSQL ONLY. This simulates the exact SQL
-- compare-and-swap used by the authorised Edge request-status path.
-- Unlike a real Supabase Auth/JWT integration test, these are fixture rows
-- and raw SQL; never describe this as real signed-in tenant validation.
\set ON_ERROR_STOP on
do $$
declare
 v_first public.busy_mini_app_requests%rowtype;
 v_other public.busy_mini_app_requests%rowtype;
 v_status text;
 v_count integer;
 v_new timestamptz;
begin
 select * into v_first from public.busy_mini_app_requests
 order by id limit 1;
 select * into v_other from public.busy_mini_app_requests
 where business_id<>v_first.business_id order by id limit 1;
 if v_first.id is null or v_other.id is null or
    v_first.business_id=v_other.business_id
 then raise exception 'Two distinct test business tenants are required';end if;
 -- Missing/incorrect tenant identity: zero writes.
 update public.busy_mini_app_requests
 set updated_at=pg_catalog.now()
 where id=v_first.id and business_id=v_other.business_id
   and status=v_first.status and updated_at=v_first.updated_at;
 get diagnostics v_count=row_count;
 if v_count<>0 then raise exception 'Cross-business request updated';end if;
 -- Outdated screen timestamp: zero writes, even when state agrees.
 update public.busy_mini_app_requests
 set updated_at=pg_catalog.now()
 where id=v_first.id and business_id=v_first.business_id
   and status=v_first.status and
   updated_at=v_first.updated_at-interval '1 second';
 get diagnostics v_count=row_count;
 if v_count<>0 then raise exception 'Stale owner revision updated';end if;
 -- Changed state: zero writes, even when timestamp agrees.
 v_status=case when v_first.status='received' then 'reviewing' else 'received' end;
 update public.busy_mini_app_requests
 set updated_at=pg_catalog.now()
 where id=v_first.id and business_id=v_first.business_id
   and status=v_status and updated_at=v_first.updated_at;
 get diagnostics v_count=row_count;
 if v_count<>0 then raise exception 'Unexpected previous status updated';end if;
 -- Exactly one current scoped snapshot can commit.
 v_new=pg_catalog.now()+interval '2 seconds';
 update public.busy_mini_app_requests
 set status=v_status,updated_at=v_new
 where id=v_first.id and business_id=v_first.business_id
   and status=v_first.status and updated_at=v_first.updated_at;
 get diagnostics v_count=row_count;
 if v_count<>1 then raise exception 'Fresh owner snapshot was not applied';end if;
 -- The same click cannot update twice.
 update public.busy_mini_app_requests
 set status=v_status,updated_at=v_new
 where id=v_first.id and business_id=v_first.business_id
   and status=v_first.status and updated_at=v_first.updated_at;
 get diagnostics v_count=row_count;
 if v_count<>0 then raise exception 'Duplicate owner click changed request twice';end if;
 if (select status from public.busy_mini_app_requests where id=v_other.id)
    is distinct from v_other.status
 then raise exception 'Second business request mutated';end if;
 -- Original request rows, not a new shadow CRM.
 if (select count(*) from public.busy_mini_app_requests)<>2
 then raise exception 'Unexpected request creation/deletion in freshness fixture';end if;
end $$;
select 'V3.231_EPHEMERAL_OWNER_CAS_AND_TENANT_SCOPE_PASS' as verdict;
