-- REVIEW ONLY: original private website target plus its bounded Undo/Redo stacks.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'WEBSITE HISTORY REVIEW FUSE: separate staging installation approval required'; END $$;
CREATE FUNCTION public.busy_connected_website_transition_v1(p_business_id uuid,p_actor_id uuid,p_expected_revision bigint,p_expected_draft jsonb,p_candidate jsonb,p_profile_revision bigint,p_operation text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE s public.busy_business_snapshots%ROWTYPE;h jsonb;u jsonb;r jsonb;t jsonb;receipt jsonb;updated jsonb;
BEGIN
 IF p_operation IS NULL OR p_operation NOT IN ('edit','undo','redo') OR p_actor_id IS NULL THEN RAISE EXCEPTION 'Finite private transition required' USING ERRCODE='22023';END IF;
 PERFORM 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=p_actor_id AND role='owner' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO s FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR s.revision IS DISTINCT FROM p_expected_revision OR s.schema_version<>1 OR nullif(s.payload->'websiteDraft','null') IS DISTINCT FROM p_expected_draft THEN RAISE EXCEPTION 'Website conflict' USING ERRCODE='40001';END IF;
 h:=s.payload->'websiteHistory';
 IF h IS NULL OR h='null' THEN h:=jsonb_build_object('v',1,'draftId',coalesce(p_expected_draft->>'id',p_candidate->>'id'),'undo','[]'::jsonb,'redo','[]'::jsonb);END IF;
 IF jsonb_typeof(h) IS DISTINCT FROM 'object' OR h->'v' IS DISTINCT FROM '1' OR h->>'draftId' IS DISTINCT FROM coalesce(p_expected_draft->>'id',p_candidate->>'id') OR jsonb_typeof(h->'undo') IS DISTINCT FROM 'array' OR jsonb_typeof(h->'redo') IS DISTINCT FROM 'array' OR jsonb_array_length(h->'undo')>8 OR jsonb_array_length(h->'redo')>8 OR h-ARRAY['v','draftId','undo','redo']<>'{}' THEN RAISE EXCEPTION 'Existing history requires review' USING ERRCODE='22023';END IF;
 u:=h->'undo';r:=h->'redo';
 IF p_operation<>'edit' THEN
  IF p_expected_draft IS NULL THEN RAISE EXCEPTION 'No current website' USING ERRCODE='40001';END IF;
  t:=CASE WHEN p_operation='undo' THEN u->-1 ELSE r->-1 END;
  IF t IS NULL OR t->'draft' IS NULL OR (p_candidate-ARRAY['generation','updatedAt']) IS DISTINCT FROM ((t->'draft')-ARRAY['generation','updatedAt']) THEN RAISE EXCEPTION 'Reviewed history target changed' USING ERRCODE='40001';END IF;
 END IF;
 -- The original finite writer retains all validation, locks, exact CAS and receipts.
 receipt:=busy_snapshot_private.website_commit_original(p_business_id,p_actor_id,p_expected_revision,p_expected_draft,p_candidate,p_profile_revision);
 IF p_expected_draft IS NOT NULL THEN
  t:=jsonb_build_object('draft',p_expected_draft,'revision',p_expected_revision,'at',clock_timestamp());
  IF p_operation='undo' THEN u:=u-(jsonb_array_length(u)-1);r:=r||jsonb_build_array(t);
  ELSIF p_operation='redo' THEN r:=r-(jsonb_array_length(r)-1);u:=u||jsonb_build_array(t);
  ELSE u:=u||jsonb_build_array(t);r:='[]';END IF;
 END IF;
 WHILE jsonb_array_length(u)>8 LOOP u:=u-0;END LOOP;
 WHILE jsonb_array_length(r)>8 LOOP r:=r-0;END LOOP;
 h:=jsonb_build_object('v',1,'draftId',p_candidate->>'id','undo',u,'redo',r);
 WHILE octet_length(h::text)>600000 AND (jsonb_array_length(u)>0 OR jsonb_array_length(r)>0) LOOP
  IF jsonb_array_length(u)>=jsonb_array_length(r) THEN u:=u-0;ELSE r:=r-0;END IF;
  h:=jsonb_build_object('v',1,'draftId',p_candidate->>'id','undo',u,'redo',r);
 END LOOP;
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{websiteHistory}',h,true) WHERE business_id=p_business_id;
 RETURN receipt||jsonb_build_object('operation',p_operation,'undoCount',jsonb_array_length(u),'redoCount',jsonb_array_length(r),'historyHash',encode(sha256(convert_to(h::text,'UTF8')),'hex'));
END $$;
-- Preserve the original externally supported signature; move implementation private.
ALTER FUNCTION public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint) SET SCHEMA busy_snapshot_private;
ALTER FUNCTION busy_snapshot_private.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint) RENAME TO website_commit_original;
CREATE FUNCTION public.busy_connected_website_commit_v1(p_business_id uuid,p_actor_id uuid,p_expected_revision bigint,p_expected_draft jsonb,p_candidate jsonb,p_profile_revision bigint) RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$ SELECT public.busy_connected_website_transition_v1(p_business_id,p_actor_id,p_expected_revision,p_expected_draft,p_candidate,p_profile_revision,'edit') $$;
CREATE FUNCTION public.busy_connected_website_history_v1(p_business_id uuid,p_expected_revision bigint,p_expected_hash text,p_direction text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_snapshot_private.lock_writer(p_business_id);s public.busy_business_snapshots%ROWTYPE;h jsonb;t jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=a AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO s FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR SHARE;
 IF NOT FOUND OR s.revision IS DISTINCT FROM p_expected_revision OR encode(sha256(convert_to((s.payload->'websiteDraft')::text,'UTF8')),'hex') IS DISTINCT FROM p_expected_hash THEN RAISE EXCEPTION 'Website changed' USING ERRCODE='40001';END IF;
 IF p_direction IS NOT NULL AND p_direction NOT IN ('undo','redo') THEN RAISE EXCEPTION 'Finite history direction required' USING ERRCODE='22023';END IF;
 h:=s.payload->'websiteHistory';t:=CASE WHEN p_direction='undo' THEN h->'undo'->-1 WHEN p_direction='redo' THEN h->'redo'->-1 ELSE NULL END;
 RETURN jsonb_build_object('businessId',p_business_id,'actorId',a,'revision',s.revision,'notOwnReceipt',true,'direction',p_direction,'target',t->'draft','entries',coalesce((SELECT jsonb_agg(jsonb_build_object('generation',v#>'{draft,generation}','revision',v->'revision','at',v->'at')) FROM jsonb_array_elements(coalesce(h->'undo','[]'))v),'[]'));
END $$;
REVOKE ALL ON FUNCTION public.busy_connected_website_transition_v1(uuid,uuid,bigint,jsonb,jsonb,bigint,text),public.busy_connected_website_history_v1(uuid,bigint,text,text),public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint),busy_snapshot_private.website_commit_original(uuid,uuid,bigint,jsonb,jsonb,bigint) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_connected_website_transition_v1(uuid,uuid,bigint,jsonb,jsonb,bigint,text),public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.busy_connected_website_history_v1(uuid,bigint,text,text) TO authenticated;
COMMIT;
