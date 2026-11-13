-- REVIEW ONLY: original finite counter authority; no new counter store.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'LEGACY ENTRY REVIEW FUSE: separate installation approval required'; END $$;
create or replace function public.busy_mini_app_record_entry(
  p_business_id uuid,
  p_mini_app_id uuid,
  p_source text,
  p_stage text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  perform 1 from public.busy_mini_apps where id=p_mini_app_id and business_id=p_business_id for share;
  if not found then raise exception 'Entry source does not match the original business app';end if;
  if p_source not in ('qr','share','web','deep_link','marketplace','my_apps','notification','owner_test','unknown') then
    raise exception 'Unsupported Mini App entry source';
  end if;
  if p_stage not in ('landing','web_view','action_intent','app_open') then
    raise exception 'Unsupported Mini App entry stage';
  end if;

  insert into public.busy_mini_app_entry_daily (
    business_id,
    mini_app_id,
    event_date,
    source,
    stage,
    event_count,
    updated_at
  )
  values (
    p_business_id,
    p_mini_app_id,
    current_date,
    p_source,
    p_stage,
    1,
    now()
  )
  on conflict (mini_app_id, event_date, source, stage)
  do update
    set event_count = public.busy_mini_app_entry_daily.event_count + 1,
        updated_at = now()
    where public.busy_mini_app_entry_daily.business_id=p_business_id;
  if not found then raise exception 'Historical entry business changed; review the original record';end if;
end;
$$;

revoke all on function public.busy_mini_app_record_entry(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.busy_mini_app_record_entry(uuid, uuid, text, text)
  to service_role;

REVOKE INSERT,UPDATE,DELETE ON public.busy_mini_app_entry_daily FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE c record;BEGIN
 FOR c IN SELECT attname FROM pg_attribute WHERE attrelid='public.busy_mini_app_entry_daily'::regclass AND attnum>0 AND NOT attisdropped LOOP
  EXECUTE format('REVOKE INSERT (%I),UPDATE (%I) ON public.busy_mini_app_entry_daily FROM PUBLIC,anon,authenticated,service_role',c.attname,c.attname);
 END LOOP;
END $$;
COMMIT;
