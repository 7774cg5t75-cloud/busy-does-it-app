-- V3.199: FIRST private app creation, serialized and completed in one DB transaction.
-- Do NOT apply to production without migration audit, staging auth and race tests.
-- This complements the existing UNIQUE (business_id,app_key) from V3.39.
-- Only the authenticated service-role Edge endpoint may call this function.
create or replace function public.busy_create_first_mini_app_draft_v3199(
  p_business_id uuid,
  p_actor_user_id uuid,
  p_public_slug text,
  p_display_name text,
  p_category text,
  p_tagline text,
  p_profile_revision bigint,
  p_draft_config jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_app public.busy_mini_apps%rowtype;
begin
  if p_business_id is null or p_actor_user_id is null
    or not exists (
      select 1 from public.busy_business_memberships m
      where m.business_id=p_business_id and m.user_id=p_actor_user_id
        and m.role in ('owner','admin')
    ) then
    raise exception 'Owner/admin membership required for the private app';
  end if;
  if p_public_slug is null or
       p_public_slug !~ '^[a-z0-9][a-z0-9-]{0,79}$'
    or p_display_name is null or length(btrim(p_display_name))=0
    or length(p_display_name)>240
    or p_category is null or length(p_category)>240
    or p_tagline is null or length(p_tagline)>400
    or p_profile_revision is null or p_profile_revision<0
    or p_draft_config is null or jsonb_typeof(p_draft_config)<>'object'
    or jsonb_typeof(p_draft_config->'modules')<>'array'
    or jsonb_typeof(p_draft_config->'navigation')<>'array'
    or p_draft_config->>'surface' is distinct from 'busy_mini_app'
    or p_draft_config#>>'{display,name}' is distinct from p_display_name
    or pg_column_size(p_draft_config)>131072 then
    raise exception 'Invalid reviewed first-app draft';
  end if;

  -- Serialize simultaneous FIRST-app requests by locking the owner's
  -- business row. Every write either commits together or not at all.
  perform 1 from public.busy_businesses where id=p_business_id for update;
  if not found then raise exception 'Business workspace unavailable'; end if;

  select * into v_app from public.busy_mini_apps
   where business_id=p_business_id and app_key='main' for update;
  if found then
    -- Returning 'exists' is NOT permission to update someone else's draft.
    return jsonb_build_object('created',false,'existingAppId',v_app.id,
      'ownerReviewRequired',true);
  end if;

  insert into public.busy_mini_apps
    (business_id,app_key,public_slug,display_name,category,tagline,
      created_by,status,discoverable,draft_revision,draft_profile_revision,
      draft_config,last_error,updated_at)
  values
    (p_business_id,'main',p_public_slug,p_display_name,p_category,p_tagline,
      p_actor_user_id,'draft',false,2,p_profile_revision,
      p_draft_config,null,now())
  returning * into v_app;

  return jsonb_build_object('created',true,'app',to_jsonb(v_app),
    'privateOnly',true,'neverPublishes',true,'chargesCreated',false);
end
$$;

revoke all on function public.busy_create_first_mini_app_draft_v3199(
  uuid,uuid,text,text,text,text,bigint,jsonb
) from public,anon,authenticated;
grant execute on function public.busy_create_first_mini_app_draft_v3199(
  uuid,uuid,text,text,text,text,bigint,jsonb
) to service_role;
