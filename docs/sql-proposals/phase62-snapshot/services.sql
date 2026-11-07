-- REVIEW CANDIDATE ONLY. Service-only finite projections, not raw snapshot access.
BEGIN;
CREATE FUNCTION public.busy_service_alert_facts_v1(p_business_id uuid,p_recipient_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE body jsonb; c jsonb; action jsonb; customer_rows jsonb:='[]'; actions jsonb:='{}'; cid text; total integer; allowed_details jsonb;
BEGIN
 -- EXECUTE grant is the service capability. No caller-supplied claim grants it.
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=p_recipient_id AND role='owner' FOR SHARE) THEN RAISE EXCEPTION 'Owner recipient required' USING ERRCODE='42501'; END IF;
 SELECT payload INTO body FROM public.busy_business_snapshots WHERE business_id=p_business_id AND schema_version=1 FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unsupported account' USING ERRCODE='40001'; END IF;
 IF jsonb_typeof(body->'customers') IS DISTINCT FROM 'array' OR jsonb_typeof(body->'replyActions') IS DISTINCT FROM 'object' THEN RETURN jsonb_build_object('customers',customer_rows,'replyActions',actions); END IF;
 FOR cid,action IN SELECT key,value FROM jsonb_each(body->'replyActions') LOOP
  IF (action ? 'businessId' AND action->>'businessId' IS DISTINCT FROM p_business_id::text) OR (action ? 'business_id' AND action->>'business_id' IS DISTINCT FROM p_business_id::text) THEN CONTINUE; END IF;
  IF action->'done' IS DISTINCT FROM 'true'::jsonb OR coalesce(action->>'type' IN ('booking','quote'),false)=false THEN CONTINUE; END IF;
  SELECT count(*) INTO total FROM jsonb_array_elements(body->'customers') row WHERE row->>'id'=cid;
  IF total<>1 THEN CONTINUE; END IF;
  SELECT row INTO c FROM jsonb_array_elements(body->'customers') row WHERE row->>'id'=cid;
  IF jsonb_typeof(c->'id') IS DISTINCT FROM 'string' THEN CONTINUE; END IF;
  IF (c ? 'businessId' AND c->>'businessId' IS DISTINCT FROM p_business_id::text) OR (c ? 'business_id' AND c->>'business_id' IS DISTINCT FROM p_business_id::text) THEN CONTINUE; END IF;
  IF action->>'type'='booking' AND action->'details'->>'bookingStatus' IS DISTINCT FROM 'Confirmed' THEN CONTINUE; END IF;
  SELECT coalesce(jsonb_object_agg(key,value),'{}'::jsonb) INTO allowed_details FROM jsonb_each(CASE WHEN jsonb_typeof(action->'details')='object' THEN action->'details' ELSE '{}'::jsonb END) WHERE key IN ('bookingStatus','bookingDate','bookingTime','quoteStatus','followUpOutcome','quoteSentAt') AND jsonb_typeof(value)='string';
  customer_rows:=customer_rows||jsonb_build_array(jsonb_build_object('id',cid,'name',CASE WHEN jsonb_typeof(c->'name')='string' THEN c->'name' ELSE '"Customer"'::jsonb END,'service',CASE WHEN jsonb_typeof(c->'service')='string' THEN c->'service' ELSE '""'::jsonb END));
  actions:=actions||jsonb_build_object(cid,jsonb_build_object('type',action->>'type','done',true,'updatedAt',CASE WHEN jsonb_typeof(action->'updatedAt')='string' THEN action->'updatedAt' ELSE 'null'::jsonb END,'details',allowed_details));
 END LOOP;
 RETURN jsonb_build_object('customers',customer_rows,'replyActions',actions);
END $$;
ALTER FUNCTION public.busy_service_alert_facts_v1(uuid,uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_service_alert_facts_v1(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_service_alert_facts_v1(uuid,uuid) TO service_role;
CREATE FUNCTION public.busy_service_snapshot_count_v1()
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
 SELECT jsonb_build_object('activeWorkspaces7d',count(*)) FROM public.busy_business_snapshots WHERE updated_at>=now()-interval '7 days';
$$;
ALTER FUNCTION public.busy_service_snapshot_count_v1() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_service_snapshot_count_v1() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_service_snapshot_count_v1() TO service_role;
COMMIT;
