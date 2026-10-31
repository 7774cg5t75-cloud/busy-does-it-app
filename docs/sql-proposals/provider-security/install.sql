-- REVIEW ONLY. Existing social records extended; no calendar schema invented.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PROVIDER SECURITY REVIEW FUSE: separate exact staging installation approval required'; END $$;
SET LOCAL lock_timeout='5s';
DO $$ BEGIN
 IF to_regclass('public.busy_social_connections') IS NULL OR to_regclass('public.busy_social_oauth_states') IS NULL OR to_regclass('public.busy_business_memberships') IS NULL THEN RAISE EXCEPTION 'Original provider/business contracts required';END IF;
 IF EXISTS(SELECT 1 FROM pg_class WHERE oid IN ('public.busy_social_connections'::regclass,'public.busy_social_oauth_states'::regclass) AND relowner<>(SELECT oid FROM pg_roles WHERE rolname=current_user)) THEN RAISE EXCEPTION 'Install as reviewed original table owner';END IF;
END $$;
ALTER TABLE public.busy_social_connections
 ADD COLUMN business_id uuid REFERENCES public.busy_businesses(id),
 ADD COLUMN owner_user_id uuid REFERENCES auth.users(id),
 ADD COLUMN provider_subject_id text,
 ADD COLUMN security_revision bigint NOT NULL DEFAULT 0 CHECK(security_revision>=0);
CREATE UNIQUE INDEX busy_social_business_provider_security ON public.busy_social_connections(business_id,provider) WHERE business_id IS NOT NULL;
ALTER TABLE public.busy_social_oauth_states
 ADD COLUMN business_id uuid REFERENCES public.busy_businesses(id),
 ADD COLUMN owner_user_id uuid REFERENCES auth.users(id),
 ADD COLUMN callback_uri text,
 ADD COLUMN expected_connection_revision bigint,
 ADD COLUMN claim_nonce uuid,
 ADD COLUMN security_state text CHECK(security_state IN ('pending','claimed','committed','cancelled')),
 ADD COLUMN result_connection_id uuid,
 ADD COLUMN result_revision bigint,
 ADD COLUMN result_subject text,
 ADD COLUMN result_digest text;
CREATE INDEX busy_social_security_states_scope ON public.busy_social_oauth_states(business_id,owner_user_id,provider,expires_at) WHERE business_id IS NOT NULL;
ALTER TABLE public.busy_social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.busy_social_oauth_states ENABLE ROW LEVEL SECURITY;
-- Revoke direct role and column grants, including service role. Tokens are not a Data API reader.
DO $$ DECLARE t text;c record;BEGIN
 FOREACH t IN ARRAY ARRAY['busy_social_connections','busy_social_oauth_states'] LOOP
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated,service_role',t);
  FOR c IN SELECT attname FROM pg_attribute WHERE attrelid=('public.'||t)::regclass AND attnum>0 AND NOT attisdropped LOOP
   EXECUTE format('REVOKE SELECT (%I),INSERT (%I),UPDATE (%I),REFERENCES (%I) ON public.%I FROM PUBLIC,anon,authenticated,service_role',c.attname,c.attname,c.attname,c.attname,t);
  END LOOP;
 END LOOP;
END $$;
CREATE SCHEMA busy_provider_private;
REVOKE ALL ON SCHEMA busy_provider_private FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION busy_provider_private.lock_owner(a uuid,b uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF a IS NULL OR b IS NULL THEN RAISE EXCEPTION 'Invalid provider scope';END IF;
 PERFORM 1 FROM public.busy_business_memberships WHERE user_id=a AND business_id=b AND role='owner' FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Current owner authority required';END IF;
 -- Serialises absent-row creation, callbacks, replacement and disconnect for one business.
 PERFORM 1 FROM public.busy_businesses WHERE id=b FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Business unavailable';END IF;
END $$;
CREATE FUNCTION busy_provider_private.guard_bound_row() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF (CASE WHEN TG_OP='INSERT' THEN NEW.business_id IS NOT NULL WHEN TG_OP='DELETE' THEN OLD.business_id IS NOT NULL ELSE OLD.business_id IS NOT NULL OR NEW.business_id IS NOT NULL END) THEN
  IF current_user<>pg_get_userbyid((SELECT relowner FROM pg_class WHERE oid=TG_RELID)) OR current_setting('busy.provider_finite_write',true) IS DISTINCT FROM 'on' THEN RAISE EXCEPTION 'Use finite provider authority';END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD;END IF;RETURN NEW;
END $$;
CREATE TRIGGER busy_social_connection_security_guard BEFORE INSERT OR UPDATE OR DELETE ON public.busy_social_connections FOR EACH ROW EXECUTE FUNCTION busy_provider_private.guard_bound_row();
CREATE TRIGGER busy_social_state_security_guard BEFORE INSERT OR UPDATE OR DELETE ON public.busy_social_oauth_states FOR EACH ROW EXECUTE FUNCTION busy_provider_private.guard_bound_row();
CREATE FUNCTION public.busy_provider_begin_v1(a uuid,b uuid,p text,h text,r bigint,u text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.busy_social_connections;old public.busy_social_oauth_states;
BEGIN
 PERFORM busy_provider_private.lock_owner(a,b);
 IF p IS NULL OR p NOT IN ('meta','google_business') OR h IS NULL OR h!~'^[0-9a-f]{64}$' OR r IS NULL OR r<0 OR u IS DISTINCT FROM 'https://pnjdlogwegnqbsfpcofw.supabase.co/functions/v1/busy-social-publish/callback/'||p THEN RAISE EXCEPTION 'Invalid provider start';END IF;
 SELECT * INTO c FROM public.busy_social_connections WHERE business_id=b AND provider=p;
 IF coalesce(c.security_revision,0)<>r OR (c.id IS NOT NULL AND c.owner_user_id IS DISTINCT FROM a) THEN RAISE EXCEPTION 'Connection changed';END IF;
 SELECT * INTO old FROM public.busy_social_oauth_states WHERE state=h;
 IF FOUND THEN
  IF old.business_id=b AND old.owner_user_id=a AND old.provider=p AND old.expected_connection_revision=r AND old.callback_uri=u AND old.security_state='pending' AND old.expires_at>clock_timestamp() THEN RETURN jsonb_build_object('state','pending','repeated',true);END IF;
  RAISE EXCEPTION 'State conflict';
 END IF;
 IF (SELECT count(*) FROM public.busy_social_oauth_states WHERE business_id=b AND owner_user_id=a AND created_at>clock_timestamp()-interval '1 hour')>=10 THEN RAISE EXCEPTION 'Connection attempts limited';END IF;
 PERFORM set_config('busy.provider_finite_write','on',true);
 INSERT INTO public.busy_social_oauth_states(state,workspace_key,provider,expires_at,business_id,owner_user_id,callback_uri,expected_connection_revision,security_state)
 VALUES(h,'business:'||b,p,clock_timestamp()+interval '10 minutes',b,a,u,r,'pending');
 RETURN jsonb_build_object('state','pending','repeated',false);
END $$;
CREATE FUNCTION public.busy_provider_claim_v1(a uuid,b uuid,p text,h text,u text,n uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE s public.busy_social_oauth_states;c public.busy_social_connections;
BEGIN
 PERFORM busy_provider_private.lock_owner(a,b);
 SELECT * INTO s FROM public.busy_social_oauth_states WHERE state=h FOR UPDATE;
 IF NOT FOUND OR s.business_id IS DISTINCT FROM b OR s.owner_user_id IS DISTINCT FROM a OR s.provider IS DISTINCT FROM p OR s.callback_uri IS DISTINCT FROM u OR s.expires_at<=clock_timestamp() OR s.security_state IS DISTINCT FROM 'pending' OR n IS NULL THEN RAISE EXCEPTION 'State unavailable; do not exchange again';END IF;
 SELECT * INTO c FROM public.busy_social_connections WHERE business_id=b AND provider=p;
 IF coalesce(c.security_revision,0)<>s.expected_connection_revision OR (c.id IS NOT NULL AND c.owner_user_id IS DISTINCT FROM a) THEN RAISE EXCEPTION 'Connection changed';END IF;
 PERFORM set_config('busy.provider_finite_write','on',true);
 UPDATE public.busy_social_oauth_states SET security_state='claimed',claim_nonce=n WHERE state=h;
 RETURN jsonb_build_object('state','claimed','expectedRevision',s.expected_connection_revision);
END $$;
CREATE FUNCTION public.busy_provider_complete_v1(a uuid,b uuid,p text,h text,n uuid,subject text,access_value text,refresh_value text,expiry timestamptz,digest text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE s public.busy_social_oauth_states;c public.busy_social_connections;ident uuid;rev bigint;
BEGIN
 PERFORM busy_provider_private.lock_owner(a,b);
 SELECT * INTO s FROM public.busy_social_oauth_states WHERE state=h FOR UPDATE;
 IF NOT FOUND OR s.business_id IS DISTINCT FROM b OR s.owner_user_id IS DISTINCT FROM a OR s.provider IS DISTINCT FROM p OR s.claim_nonce IS DISTINCT FROM n OR n IS NULL OR s.security_state NOT IN ('claimed','committed') THEN RAISE EXCEPTION 'Claim unavailable';END IF;
 IF subject IS NULL OR length(subject) NOT BETWEEN 1 AND 200 OR access_value IS NULL OR length(access_value) NOT BETWEEN 1 AND 16384 OR (refresh_value IS NOT NULL AND length(refresh_value) NOT BETWEEN 1 AND 16384) OR expiry IS NULL OR expiry<=clock_timestamp() OR expiry>clock_timestamp()+interval '90 days' OR digest IS NULL OR digest!~'^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Invalid verified provider result';END IF;
 IF s.security_state='committed' THEN
  IF s.result_digest IS DISTINCT FROM digest OR s.result_subject IS DISTINCT FROM subject THEN RAISE EXCEPTION 'Different completed result';END IF;
  RETURN jsonb_build_object('state','committed','id',s.result_connection_id,'revision',s.result_revision,'subject',s.result_subject,'repeated',true);
 END IF;
 IF s.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Claim expired; reconcile externally without replay';END IF;
 SELECT * INTO c FROM public.busy_social_connections WHERE business_id=b AND provider=p FOR UPDATE;
 IF coalesce(c.security_revision,0)<>s.expected_connection_revision OR (c.id IS NOT NULL AND c.owner_user_id IS DISTINCT FROM a) THEN RAISE EXCEPTION 'Connection changed';END IF;
 rev:=coalesce(c.security_revision,0)+1;ident:=coalesce(c.id,gen_random_uuid());
 PERFORM set_config('busy.provider_finite_write','on',true);
 INSERT INTO public.busy_social_connections(id,workspace_key,provider,business_id,owner_user_id,provider_subject_id,provider_account_id,security_revision,status,access_token,refresh_token,token_expires_at,connected_at,updated_at)
 VALUES(ident,'business:'||b,p,b,a,subject,subject,rev,'connected',access_value,refresh_value,expiry,clock_timestamp(),clock_timestamp())
 ON CONFLICT(id) DO UPDATE SET provider_subject_id=excluded.provider_subject_id,provider_account_id=excluded.provider_account_id,security_revision=excluded.security_revision,status=excluded.status,access_token=excluded.access_token,refresh_token=excluded.refresh_token,token_expires_at=excluded.token_expires_at,connected_at=excluded.connected_at,updated_at=excluded.updated_at,
 -- Account changes must also remove stale assets, scopes and provider-specific destinations.
 provider_account_name=NULL,last_error=NULL,assets='[]'::jsonb,scopes='{}',page_id=NULL,page_name=NULL,instagram_user_id=NULL,instagram_username=NULL,google_account_name=NULL,google_location_name=NULL,google_location_title=NULL;
 UPDATE public.busy_social_oauth_states SET security_state='committed',result_connection_id=ident,result_revision=rev,result_subject=subject,result_digest=digest WHERE state=h;
 RETURN jsonb_build_object('state','committed','id',ident,'revision',rev,'subject',subject,'repeated',false);
END $$;
CREATE FUNCTION public.busy_provider_status_v1(a uuid,b uuid,p text,h text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE s public.busy_social_oauth_states;c public.busy_social_connections;
BEGIN
 PERFORM busy_provider_private.lock_owner(a,b);
 IF p IS NULL OR p NOT IN ('meta','google_business') THEN RAISE EXCEPTION 'Provider unavailable';END IF;
 SELECT * INTO c FROM public.busy_social_connections WHERE business_id=b AND provider=p AND owner_user_id=a;
 IF h IS NULL THEN RETURN jsonb_build_object('id',c.id,'revision',coalesce(c.security_revision,0),'subject',c.provider_subject_id,'state',coalesce(c.status,'not_connected'));END IF;
 SELECT * INTO s FROM public.busy_social_oauth_states WHERE state=h AND business_id=b AND owner_user_id=a AND provider=p;
 IF NOT FOUND THEN RAISE EXCEPTION 'State unavailable';END IF;
 RETURN jsonb_build_object('state',s.security_state,'id',s.result_connection_id,'revision',s.result_revision,'subject',s.result_subject,'current',c.id=s.result_connection_id AND c.security_revision=s.result_revision);
END $$;
CREATE FUNCTION public.busy_provider_disconnect_v1(a uuid,b uuid,p text,i uuid,r bigint,subject text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.busy_social_connections;
BEGIN
 PERFORM busy_provider_private.lock_owner(a,b);
 SELECT * INTO c FROM public.busy_social_connections WHERE business_id=b AND provider=p FOR UPDATE;
 IF FOUND AND c.id=i AND c.owner_user_id=a AND c.security_revision=r+1 AND c.provider_subject_id=subject AND c.status='disconnected' THEN RETURN jsonb_build_object('id',i,'revision',r+1,'state','disconnected','providerRevoked',false,'repeated',true);END IF;
 IF NOT FOUND OR c.id IS DISTINCT FROM i OR c.owner_user_id IS DISTINCT FROM a OR c.security_revision IS DISTINCT FROM r OR c.provider_subject_id IS DISTINCT FROM subject OR subject IS NULL THEN RAISE EXCEPTION 'Exact current connection required';END IF;
 PERFORM set_config('busy.provider_finite_write','on',true);
 UPDATE public.busy_social_connections SET status='disconnected',security_revision=r+1,access_token=NULL,refresh_token=NULL,token_expires_at=NULL,assets='[]',scopes='{}',page_id=NULL,page_name=NULL,instagram_user_id=NULL,instagram_username=NULL,google_account_name=NULL,google_location_name=NULL,google_location_title=NULL,updated_at=clock_timestamp() WHERE id=i;
 -- Invalidate all earlier reviewed intents; never reuse them after disconnect.
 UPDATE public.busy_social_oauth_states SET security_state='cancelled' WHERE business_id=b AND provider=p AND security_state IN ('pending','claimed');
 RETURN jsonb_build_object('id',i,'revision',r+1,'state','disconnected','providerRevoked',false);
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA busy_provider_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.busy_provider_begin_v1(uuid,uuid,text,text,bigint,text),public.busy_provider_claim_v1(uuid,uuid,text,text,text,uuid),public.busy_provider_complete_v1(uuid,uuid,text,text,uuid,text,text,text,timestamptz,text),public.busy_provider_status_v1(uuid,uuid,text,text),public.busy_provider_disconnect_v1(uuid,uuid,text,uuid,bigint,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_provider_begin_v1(uuid,uuid,text,text,bigint,text),public.busy_provider_claim_v1(uuid,uuid,text,text,text,uuid),public.busy_provider_complete_v1(uuid,uuid,text,text,uuid,text,text,text,timestamptz,text),public.busy_provider_status_v1(uuid,uuid,text,text),public.busy_provider_disconnect_v1(uuid,uuid,text,uuid,bigint,text) TO service_role;
COMMIT;
