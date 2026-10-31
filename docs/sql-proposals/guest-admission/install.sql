-- REVIEW ONLY. Original public browser challenges and request writer retained.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'GUEST ADMISSION REVIEW FUSE: exact separate installation approval required'; END $$;
DO $$ BEGIN IF to_regclass('public.busy_mini_app_request_events') IS NULL THEN RAISE EXCEPTION 'Original request event dependency required';END IF; END $$;
ALTER TABLE public.busy_mini_app_guest_challenges ADD COLUMN admission_version smallint NOT NULL DEFAULT 1 CHECK(admission_version IN (1,2));
CREATE INDEX busy_guest_admission_scope ON public.busy_mini_app_guest_challenges(mini_app_id,fingerprint_hash,created_at DESC);
CREATE SCHEMA busy_guest_admission_private;
REVOKE ALL ON SCHEMA busy_guest_admission_private FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION busy_guest_admission_private.lock_source(b uuid,a uuid,v uuid,t text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE cfg jsonb;
BEGIN
 PERFORM 1 FROM public.busy_business_memberships WHERE business_id=b AND role='owner' FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Business is not accepting new requests; inspect any existing receipt before retrying';END IF;
 PERFORM 1 FROM public.busy_businesses WHERE id=b FOR UPDATE;
 PERFORM 1 FROM public.busy_mini_apps WHERE id=a AND business_id=b AND status IN ('live','update_pending') AND current_live_version_id=v FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'The current public app changed';END IF;
 SELECT config INTO cfg FROM public.busy_mini_app_versions WHERE id=v AND mini_app_id=a AND business_id=b AND state='live' FOR SHARE;
 IF NOT FOUND OR jsonb_typeof(cfg->'modules') IS DISTINCT FROM 'array' OR t IS NULL OR t NOT IN ('enquiry','booking_request') THEN RAISE EXCEPTION 'Request source unavailable';END IF;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(cfg->'modules') m WHERE m->>'key'=t AND m->'enabled'='true'::jsonb) THEN RAISE EXCEPTION 'Request module unavailable';END IF;
 IF t='booking_request' AND (jsonb_typeof(cfg->'publicProfile'->'services') IS DISTINCT FROM 'array' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(cfg->'publicProfile'->'services') service WHERE length(btrim(service->>'name'))>0)) THEN RAISE EXCEPTION 'Reviewed services required';END IF;
END $$;
CREATE FUNCTION busy_guest_admission_private.guard_insert() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF current_user<>pg_get_userbyid((SELECT relowner FROM pg_class WHERE oid=TG_RELID)) OR current_setting('busy.guest_admission',true) IS DISTINCT FROM 'finite' THEN RAISE EXCEPTION 'Use atomic guest admission';END IF;RETURN NEW;
END $$;
CREATE TRIGGER busy_guest_atomic_admission BEFORE INSERT ON public.busy_mini_app_guest_challenges FOR EACH ROW EXECUTE FUNCTION busy_guest_admission_private.guard_insert();
CREATE FUNCTION public.busy_mini_app_guest_challenge_v1(b uuid,a uuid,v uuid,t text,h text,f text,s text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.busy_mini_app_guest_challenges;i uuid;x timestamptz;
BEGIN
 PERFORM busy_guest_admission_private.lock_source(b,a,v,t);
 IF h IS NULL OR h!~'^[0-9a-f]{64}$' OR f IS NULL OR f!~'^[0-9a-f]{64}$' OR s IS NULL OR s!~'^[A-Za-z0-9_-]{20,100}$' THEN RAISE EXCEPTION 'Invalid challenge evidence';END IF;
 SELECT * INTO c FROM public.busy_mini_app_guest_challenges WHERE token_hash=h;
 IF FOUND THEN
  IF c.business_id=b AND c.mini_app_id=a AND c.version_id=v AND c.request_type=t AND c.fingerprint_hash=f AND c.pow_seed=s AND c.admission_version=2 AND c.state='pending' AND c.expires_at>clock_timestamp() THEN RETURN jsonb_build_object('id',c.id,'expiresAt',c.expires_at,'repeated',true);END IF;
  RAISE EXCEPTION 'Challenge conflict';
 END IF;
 IF (SELECT count(*) FROM public.busy_mini_app_guest_challenges WHERE business_id=b AND created_at>clock_timestamp()-interval '1 hour')>=2000 OR (SELECT count(*) FROM public.busy_mini_app_guest_challenges WHERE mini_app_id=a AND created_at>clock_timestamp()-interval '1 hour')>=1000 OR (SELECT count(*) FROM public.busy_mini_app_guest_challenges WHERE mini_app_id=a AND fingerprint_hash=f AND created_at>clock_timestamp()-interval '1 hour')>=30 THEN RAISE EXCEPTION 'Public verification quota reached';END IF;
 i:=gen_random_uuid();x:=clock_timestamp()+interval '10 minutes';
 PERFORM set_config('busy.guest_admission','finite',true);
 INSERT INTO public.busy_mini_app_guest_challenges(id,business_id,mini_app_id,version_id,request_type,token_hash,fingerprint_hash,pow_seed,pow_difficulty,expires_at,admission_version) VALUES(i,b,a,v,t,h,f,s,3,x,2);
 RETURN jsonb_build_object('id',i,'expiresAt',x,'repeated',false);
END $$;
REVOKE INSERT,UPDATE,DELETE ON public.busy_mini_app_guest_challenges FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE c record;BEGIN FOR c IN SELECT attname FROM pg_attribute WHERE attrelid='public.busy_mini_app_guest_challenges'::regclass AND attnum>0 AND NOT attisdropped LOOP EXECUTE format('REVOKE INSERT (%I),UPDATE (%I) ON public.busy_mini_app_guest_challenges FROM PUBLIC,anon,authenticated,service_role',c.attname,c.attname);END LOOP;END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA busy_guest_admission_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.busy_mini_app_guest_challenge_v1(uuid,uuid,uuid,text,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_mini_app_guest_challenge_v1(uuid,uuid,uuid,text,text,text,text) TO service_role;

-- Original finite request writer; membership/live-module locks added before the original row lock.
create or replace function public.busy_mini_app_create_guest_request(
  p_challenge_id uuid,
  p_fingerprint_hash text,
  p_contact_hash text,
  p_guest_access_hash text,
  p_idempotency_key text,
  p_payload jsonb,
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_service_name text,
  p_preferred_date_text text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_challenge public.busy_mini_app_guest_challenges%rowtype;
  v_existing_id uuid;
  v_request_id uuid;
  v_recent_fingerprint bigint;
  v_recent_contact bigint;
  scoped_business uuid;scoped_app uuid;scoped_version uuid;scoped_type text;
begin
  select business_id,mini_app_id,version_id,request_type into scoped_business,scoped_app,scoped_version,scoped_type from public.busy_mini_app_guest_challenges where id=p_challenge_id;
  if scoped_business is null then raise exception 'Guest challenge unavailable';end if;
  perform busy_guest_admission_private.lock_source(scoped_business,scoped_app,scoped_version,scoped_type);
  select *
    into v_challenge
  from public.busy_mini_app_guest_challenges
  where id = p_challenge_id
  for update;

  if v_challenge.id is null then
    raise exception 'Guest request challenge not found';
  end if;

  if v_challenge.business_id is distinct from scoped_business or v_challenge.mini_app_id is distinct from scoped_app or v_challenge.version_id is distinct from scoped_version then raise exception 'Guest source changed';end if;
  if v_challenge.state = 'consumed' then
    select id into v_existing_id
    from public.busy_mini_app_requests
    where guest_challenge_id = p_challenge_id
    limit 1;

    if v_existing_id is not null then
      return v_existing_id;
    end if;

    raise exception 'Guest request challenge already used';
  end if;

  if v_challenge.expires_at <= now() then
    raise exception 'Guest request challenge expired';
  end if;

  if v_challenge.fingerprint_hash <> p_fingerprint_hash then
    raise exception 'Guest request challenge does not match this browser';
  end if;

  if not exists (
    select 1
    from public.busy_mini_apps a
    where a.id = v_challenge.mini_app_id
      and a.business_id = v_challenge.business_id
      and a.status in ('live','update_pending')
      and a.current_live_version_id = v_challenge.version_id
  ) then
    raise exception 'The live Mini App changed. Refresh and try again';
  end if;

  select count(*) into v_recent_fingerprint
  from public.busy_mini_app_guest_challenges c
  where c.fingerprint_hash = p_fingerprint_hash
    and c.consumed_at >= now() - interval '1 hour';

  if v_recent_fingerprint >= 5 then
    raise exception 'Too many guest requests from this browser. Try again later';
  end if;

  if nullif(p_contact_hash, '') is not null then
    select count(*) into v_recent_contact
    from public.busy_mini_app_guest_challenges c
    where c.contact_hash = p_contact_hash
      and c.consumed_at >= now() - interval '1 hour';

    if v_recent_contact >= 3 then
      raise exception 'Too many requests for these contact details. Try again later';
    end if;
  end if;

  insert into public.busy_mini_app_requests (
    business_id,
    mini_app_id,
    version_id,
    consumer_user_id,
    module_key,
    request_type,
    status,
    payload,
    contact_name,
    contact_email,
    contact_phone,
    service_name,
    preferred_date_text,
    request_origin,
    identity_assurance,
    guest_challenge_id,
    guest_access_hash,
    guest_proof_verified_at,
    business_unread_count,
    customer_unread_count,
    idempotency_key,
    created_at,
    updated_at
  )
  values (
    v_challenge.business_id,
    v_challenge.mini_app_id,
    v_challenge.version_id,
    null,
    case when v_challenge.request_type = 'booking_request'
      then 'booking_request' else 'enquiry' end,
    v_challenge.request_type,
    'received',
    coalesce(p_payload, '{}'::jsonb),
    nullif(p_contact_name, ''),
    nullif(p_contact_email, ''),
    nullif(p_contact_phone, ''),
    nullif(p_service_name, ''),
    nullif(p_preferred_date_text, ''),
    'guest_web',
    'guest_browser_challenge',
    v_challenge.id,
    p_guest_access_hash,
    now(),
    1,
    0,
    nullif(p_idempotency_key, ''),
    now(),
    now()
  )
  returning id into v_request_id;

  insert into public.busy_mini_app_request_events (
    business_id,
    request_id,
    actor_user_id,
    event_type,
    detail,
    created_at
  )
  values (
    v_challenge.business_id,
    v_request_id,
    null,
    'received',
    jsonb_build_object(
      'requestType', v_challenge.request_type,
      'source', 'public_web_guest',
      'identityAssurance', 'guest_browser_challenge'
    ),
    now()
  );

  update public.busy_mini_app_guest_challenges
  set state = 'consumed',
      contact_hash = nullif(p_contact_hash, ''),
      consumed_at = now()
  where id = v_challenge.id;

  return v_request_id;
end;
$$;

revoke all on function public.busy_mini_app_create_guest_request(
  uuid,text,text,text,text,jsonb,text,text,text,text,text
) from public, anon, authenticated;
grant execute on function public.busy_mini_app_create_guest_request(
  uuid,text,text,text,text,jsonb,text,text,text,text,text
) to service_role;


COMMIT;
