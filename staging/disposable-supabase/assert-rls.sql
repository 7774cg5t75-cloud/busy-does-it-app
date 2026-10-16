-- Real PostgreSQL RLS, distinct from JWT verification in integration.mjs.
begin;
do $$begin
 if not (select relrowsecurity from pg_class where oid='public.busy_business_content'::regclass)
 then raise exception 'RLS is disabled'; end if;
 if has_table_privilege('anon','public.busy_business_content','select')
 or has_table_privilege('authenticated','public.busy_business_content','select')
 or has_function_privilege('anon','public.busy_content_bound_insert()','execute')
 or has_function_privilege('authenticated','public.busy_content_bound_insert()','execute')
 then raise exception 'Client privilege leak'; end if;
 if (select prosecdef from pg_proc where oid='public.busy_content_bound_insert()'::regprocedure)
 then raise exception 'Unexpected privilege elevation'; end if;
end$$;
-- Temporary transaction-only SELECT grants prove RLS independently of ACL denial.
-- They roll back; no deployed privilege or policy is changed.
grant select on public.busy_business_content to anon,authenticated;
set local role authenticated;
do $$begin
 if (select count(*) from public.busy_business_content)<>0
 then raise exception 'Authenticated RLS exposed private rows'; end if;
end$$;
reset role;
set local role anon;
do $$begin
 if (select count(*) from public.busy_business_content)<>0
 then raise exception 'Anonymous RLS exposed private rows'; end if;
end$$;
reset role;
rollback;
