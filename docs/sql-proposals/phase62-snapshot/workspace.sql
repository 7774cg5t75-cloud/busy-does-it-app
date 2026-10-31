-- REVIEW CANDIDATE ONLY; no hosted installation authorised.
BEGIN;
CREATE FUNCTION public.busy_workspace_status_v1(p_business_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); member_role text; workspace_name text; snap public.busy_business_snapshots%ROWTYPE; state text; account_revision bigint; account_schema integer;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT role INTO member_role FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor FOR SHARE;
 IF member_role IS NULL OR member_role NOT IN ('owner','admin','member') THEN RAISE EXCEPTION 'Not authorised' USING ERRCODE='42501'; END IF;
 SELECT name INTO workspace_name FROM public.busy_businesses WHERE id=p_business_id FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Workspace unavailable' USING ERRCODE='40001'; END IF;
 state:='restricted';
 IF member_role='owner' THEN
  SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR SHARE;
  IF NOT FOUND THEN state:='missing';
  ELSE
   account_revision:=snap.revision;account_schema:=snap.schema_version;
   state:=CASE WHEN snap.schema_version<>1 OR snap.revision<1 THEN 'incompatible' WHEN snap.payload='{}'::jsonb THEN 'empty' ELSE 'present' END;
  END IF;
 END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'actorId',actor,'businessName',workspace_name,'memberRole',member_role,'snapshotStatus',state,'revision',account_revision,'schemaVersion',account_schema);
END $$;
ALTER FUNCTION public.busy_workspace_status_v1(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_workspace_status_v1(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_workspace_status_v1(uuid) TO authenticated;
COMMIT;
