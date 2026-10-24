-- REVIEW CANDIDATE ONLY. Requires Phase58 writer and Phase60 private readers.
-- No raw payload, target identity, timestamp or unknown extension is returned.
BEGIN;
CREATE FUNCTION public.busy_owner_account_revision_v1(p_business_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid; current_revision bigint; snapshot_schema integer;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN
  RAISE EXCEPTION 'Owner access required' USING ERRCODE='42501';
 END IF;
 -- Same membership-before-snapshot lock order as the finite writer. Revocation
 -- cannot commit between checking authority and reading revision metadata.
 SELECT revision,schema_version INTO current_revision,snapshot_schema
 FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Account row unavailable' USING ERRCODE='40001'; END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',actor,'revision',current_revision,'schemaVersion',snapshot_schema);
END $$;
ALTER FUNCTION public.busy_owner_account_revision_v1(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_owner_account_revision_v1(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_owner_account_revision_v1(uuid) TO authenticated;
COMMIT;
