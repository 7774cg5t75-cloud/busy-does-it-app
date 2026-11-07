-- Non-deployed, read-only candidate. Original row, no workflow/receipt store.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PHASE66 REVIEW FUSE: interrupted discovery requires separate staging approval'; END $$;
CREATE FUNCTION public.busy_owner_enquiry_discover_v1(p_business_id uuid,p_after_enquiry_id text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid;snap public.busy_business_snapshots%ROWTYPE;e jsonb;c jsonb;checked jsonb;eid text;cid text;kind text;n int;rows jsonb:='[]';more boolean:=false;next_id text;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 IF p_after_enquiry_id IS NOT NULL AND (length(p_after_enquiry_id) NOT BETWEEN 1 AND 240 OR p_after_enquiry_id !~ '^[A-Za-z0-9_-]+$') THEN RAISE EXCEPTION 'Unsupported cursor' USING ERRCODE='22023';END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR snap.schema_version IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Unsupported account' USING ERRCODE='40001';END IF;
 IF jsonb_typeof(snap.payload) IS DISTINCT FROM 'object' OR (snap.payload ? 'inboxItems' AND jsonb_typeof(snap.payload->'inboxItems') IS DISTINCT FROM 'array') OR (snap.payload ? 'customers' AND jsonb_typeof(snap.payload->'customers') IS DISTINCT FROM 'array') THEN RAISE EXCEPTION 'Unsupported collections' USING ERRCODE='22023';END IF;
 IF jsonb_array_length(coalesce(snap.payload->'inboxItems','[]'))>5000 OR jsonb_array_length(coalesce(snap.payload->'customers','[]'))>1000 THEN RAISE EXCEPTION 'Specialist review required' USING ERRCODE='22023';END IF;
 FOR e IN SELECT value FROM jsonb_array_elements(coalesce(snap.payload->'inboxItems','[]')) WHERE jsonb_typeof(value->'id')='string' ORDER BY value->>'id' COLLATE "C" LOOP
  eid:=e->>'id';cid:=NULL;c:=NULL;kind:=NULL;
  IF length(eid) NOT BETWEEN 1 AND 240 OR eid !~ '^[A-Za-z0-9_-]+$' OR p_after_enquiry_id IS NOT NULL AND eid COLLATE "C"<=p_after_enquiry_id COLLATE "C" THEN CONTINUE;END IF;
  SELECT count(*) INTO n FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=eid;
  IF n<>1 OR e ? 'version' OR (e ? 'businessId' AND e->>'businessId' IS DISTINCT FROM p_business_id::text) OR (e ? 'business_id' AND e->>'business_id' IS DISTINCT FROM p_business_id::text) THEN CONTINUE;END IF;
  BEGIN
   IF e->>'status'='Pending' THEN
    -- Unattributed/other-owner Pending sources are not private recovery evidence.
    IF e->>'sourceOrigin' IS DISTINCT FROM 'owner-manual' OR e->>'registeredBy' IS DISTINCT FROM actor::text THEN CONTINUE;END IF;
    checked:=public.busy_owner_pending_review_v1(p_business_id,snap.revision,eid);kind:='Pending';
   ELSIF e->>'status'='Filed' THEN
    cid:=e->>'filedCustomerId';
    IF cid IS NULL OR length(cid) NOT BETWEEN 1 AND 240 THEN CONTINUE;END IF;
    SELECT count(*) INTO n FROM jsonb_array_elements(coalesce(snap.payload->'customers','[]')) x WHERE x->>'id'=cid;
    IF n<>1 THEN CONTINUE;END IF;
    SELECT x INTO c FROM jsonb_array_elements(snap.payload->'customers') x WHERE x->>'id'=cid;
    IF c ? 'privateEnquiryReply' THEN
     IF c->'privateEnquiryReply'->>'ownerId' IS DISTINCT FROM actor::text OR c->'privateEnquiryReply'->'reference'->>'inboxId' IS DISTINCT FROM eid THEN CONTINUE;END IF;
     checked:=busy_snapshot_private.owner_reply_context(p_business_id,cid,eid,snap.revision);
     IF checked->'eligible' IS DISTINCT FROM 'true'::jsonb THEN CONTINUE;END IF;
     kind:='FiledWithReply';
    ELSE
     IF e->>'sourceOrigin' IS DISTINCT FROM 'owner-manual' OR e->>'registeredBy' IS DISTINCT FROM actor::text THEN CONTINUE;END IF;
     checked:=busy_snapshot_private.initial_reply_context(p_business_id,snap.revision,cid,eid);kind:='FiledWithoutReply';
    END IF;
   END IF;
  EXCEPTION WHEN SQLSTATE '22023' OR SQLSTATE '42501' OR SQLSTATE '40001' THEN CONTINUE;END;
  IF kind IS NULL THEN CONTINUE;END IF;
  IF jsonb_array_length(rows)=25 THEN more:=true;EXIT;END IF;
  rows:=rows||jsonb_build_array(jsonb_build_object('enquiryId',eid,'customerId',cid,'customerName',CASE WHEN jsonb_typeof(c->'name')='string' THEN left(c->>'name',120) ELSE '' END,'state',kind));next_id:=eid;
 END LOOP;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',actor,'revision',snap.revision,'schemaVersion',1,'items',rows,'hasMore',more,'nextAfter',CASE WHEN more THEN next_id ELSE NULL END);
END $$;
ALTER FUNCTION public.busy_owner_enquiry_discover_v1(uuid,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_owner_enquiry_discover_v1(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_owner_enquiry_discover_v1(uuid,text) TO authenticated;
COMMIT;
