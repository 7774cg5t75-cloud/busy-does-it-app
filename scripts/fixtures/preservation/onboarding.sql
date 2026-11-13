-- Disposable PostgreSQL fixture only. No hosted data or genuine credentials.
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
GRANT USAGE ON SCHEMA auth TO authenticated;
CREATE SCHEMA extensions;
CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA public TO postgres,anon,authenticated,service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC,anon,authenticated,service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC,anon,authenticated,service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC,anon,authenticated,service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON TABLES TO anon,authenticated,service_role;
CREATE TABLE public.busy_marketing_waitlist(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 email text NOT NULL UNIQUE CHECK(length(email)<=254 AND email=lower(email) AND POSITION('@' IN email)>1),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','confirmed','unsubscribed')),
 consent_version text NOT NULL,consent_at timestamptz NOT NULL DEFAULT now(),confirmed_at timestamptz,
 token_hash text UNIQUE CHECK(token_hash IS NULL OR token_hash~'^[0-9a-f]{64}$'),token_expires_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX busy_marketing_waitlist_pending_expiry_idx ON public.busy_marketing_waitlist(token_expires_at) WHERE status='pending';
ALTER TABLE public.busy_marketing_waitlist ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.busy_marketing_waitlist FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT,UPDATE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON public.busy_marketing_waitlist TO service_role;
REVOKE ALL ON SEQUENCE public.busy_marketing_waitlist_id_seq FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,USAGE ON SEQUENCE public.busy_marketing_waitlist_id_seq TO service_role;
CREATE TABLE public.busy_staging_rls_canary(id uuid PRIMARY KEY,owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,marker text NOT NULL CHECK(length(marker)>=8 AND length(marker)<=80));
ALTER TABLE public.busy_staging_rls_canary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.busy_staging_rls_canary FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.busy_staging_rls_canary FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.busy_staging_rls_canary TO authenticated;
GRANT TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON public.busy_staging_rls_canary TO service_role;
CREATE POLICY busy_staging_canary_owner_read ON public.busy_staging_rls_canary FOR SELECT TO authenticated USING ((SELECT auth.uid())=owner_id);
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
  tbl name;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        SELECT c.relname INTO tbl FROM pg_catalog.pg_class c WHERE c.oid = cmd.objid;
        EXECUTE format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC,anon,authenticated,service_role;
CREATE EVENT TRIGGER ensure_rls ON ddl_command_end WHEN TAG IN ('CREATE TABLE','CREATE TABLE AS','SELECT INTO') EXECUTE FUNCTION public.rls_auto_enable();
