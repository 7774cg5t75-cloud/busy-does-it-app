-- DESTRUCTIVE, DISPOSABLE REHEARSAL ONLY. Never a production rollback plan.
do $$begin
 if current_setting('busy.disposable_rehearsal',true) is distinct from 'approved-local-only'
 then raise exception 'Disposable rollback context required'; end if;
end$$;
-- No CASCADE: unexpected dependencies must block, never be silently discarded.
drop table public.busy_business_content;
drop function public.busy_content_bound_insert();
