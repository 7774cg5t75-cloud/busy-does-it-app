-- REVIEW CANDIDATE ONLY. Requires original row + Phase58/60 privacy specialists.
BEGIN;
CREATE FUNCTION public.busy_owner_reply_discover_v1(p_business_id uuid,p_after_customer_id text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid; snap public.busy_business_snapshots%ROWTYPE; c jsonb; checked jsonb; rows jsonb:='[]'; cid text; eid text; total integer; more boolean:=false; next_id text;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner access required' USING ERRCODE='42501'; END IF;
 IF p_after_customer_id IS NOT NULL AND length(p_after_customer_id) NOT BETWEEN 1 AND 240 THEN RAISE EXCEPTION 'Invalid cursor' USING ERRCODE='22023'; END IF;
 -- Same exclusive lock order as the original source helper; no SHARE->UPDATE
 -- lock upgrade across two concurrent discovery requests. No row is mutated.
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR snap.schema_version IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Unsupported account' USING ERRCODE='40001'; END IF;
 IF (snap.payload ? 'customers' AND jsonb_typeof(snap.payload->'customers') IS DISTINCT FROM 'array') OR (snap.payload ? 'inboxItems' AND jsonb_typeof(snap.payload->'inboxItems') IS DISTINCT FROM 'array') THEN RAISE EXCEPTION 'Unsupported collection' USING ERRCODE='22023'; END IF;
 IF jsonb_array_length(coalesce(snap.payload->'customers','[]'))>1000 OR jsonb_array_length(coalesce(snap.payload->'inboxItems','[]'))>5000 THEN RAISE EXCEPTION 'Collection requires specialist review' USING ERRCODE='22023'; END IF;
 FOR c IN SELECT value FROM jsonb_array_elements(coalesce(snap.payload->'customers','[]')) WHERE jsonb_typeof(value->'id')='string' ORDER BY value->>'id' LOOP
  cid:=c->>'id'; eid:=c->'privateEnquiryReply'->'reference'->>'inboxId';
  IF length(cid) NOT BETWEEN 1 AND 240 OR p_after_customer_id IS NOT NULL AND cid<=p_after_customer_id OR c->'privateEnquiryReply'->>'ownerId' IS DISTINCT FROM actor::text OR eid IS NULL THEN CONTINUE; END IF;
  SELECT count(*) INTO total FROM jsonb_array_elements(snap.payload->'customers') row WHERE row->>'id'=cid;
  IF total<>1 THEN CONTINUE; END IF;
  BEGIN
   checked:=busy_snapshot_private.owner_reply_context(p_business_id,cid,eid,snap.revision);
  EXCEPTION WHEN SQLSTATE '22023' OR SQLSTATE '42501' OR SQLSTATE '40001' THEN CONTINUE; END;
  IF checked->'eligible' IS DISTINCT FROM 'true'::jsonb THEN CONTINUE; END IF;
  IF jsonb_array_length(rows)=25 THEN more:=true;EXIT; END IF;
  rows:=rows||jsonb_build_array(jsonb_build_object('customerId',cid,'enquiryId',eid,'customerName',CASE WHEN jsonb_typeof(c->'name')='string' THEN left(c->>'name',120) ELSE '' END));next_id:=cid;
 END LOOP;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',actor,'revision',snap.revision,'schemaVersion',1,'items',rows,'hasMore',more,'nextAfter',CASE WHEN more THEN next_id ELSE NULL END);
END $$;
ALTER FUNCTION public.busy_owner_reply_discover_v1(uuid,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_owner_reply_discover_v1(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_owner_reply_discover_v1(uuid,text) TO authenticated;
COMMIT;
