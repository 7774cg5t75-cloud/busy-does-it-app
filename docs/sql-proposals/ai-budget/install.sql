-- Review-only extension of original connected staging contracts. NO hosted authority.
DO $$ BEGIN RAISE EXCEPTION 'AI BUDGET REVIEW FUSE: explicit approval required'; END $$;
BEGIN;
DO $$ BEGIN
 IF current_user<>'postgres' OR to_regclass('public.busy_business_snapshots') IS NULL OR to_regclass('public.busy_public_business_profiles') IS NULL OR to_regclass('public.busy_business_memberships') IS NULL OR to_regnamespace('busy_ai_private') IS NOT NULL THEN RAISE EXCEPTION 'Original connected foundation and fresh private namespace required'; END IF;
END $$;
CREATE SCHEMA busy_ai_private;
REVOKE ALL ON SCHEMA busy_ai_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE busy_ai_private.policy(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),enabled boolean NOT NULL DEFAULT false,
 monthly_hard_limit bigint NOT NULL CHECK(monthly_hard_limit BETWEEN 0 AND 1000000000000));
INSERT INTO busy_ai_private.policy VALUES(true,false,0);
-- GBP micro-units. No bill, payment or subscription purchase is created here.
CREATE TABLE busy_ai_private.accounts(
 business_id uuid NOT NULL REFERENCES public.busy_businesses(id),period date NOT NULL,
 verified_entitlement_reference text NOT NULL CHECK(length(verified_entitlement_reference) BETWEEN 1 AND 160),
 entitlement_verified boolean NOT NULL DEFAULT false,active_until timestamptz NOT NULL,
 monthly_limit bigint NOT NULL CHECK(monthly_limit BETWEEN 0 AND 10000000000),
 expensive_limit bigint NOT NULL CHECK(expensive_limit BETWEEN 0 AND monthly_limit),
 feature_limits jsonb NOT NULL CHECK(jsonb_typeof(feature_limits)='object'),
 concurrent_limit integer NOT NULL CHECK(concurrent_limit BETWEEN 1 AND 4),
 reserved bigint NOT NULL DEFAULT 0 CHECK(reserved>=0),spent bigint NOT NULL DEFAULT 0 CHECK(spent>=0),
 expensive_reserved bigint NOT NULL DEFAULT 0 CHECK(expensive_reserved>=0),expensive_spent bigint NOT NULL DEFAULT 0 CHECK(expensive_spent>=0),
 blocked boolean NOT NULL DEFAULT false,PRIMARY KEY(business_id,period),CHECK(period=date_trunc('month',period)::date));
CREATE TABLE busy_ai_private.periods(period date PRIMARY KEY,reserved bigint NOT NULL DEFAULT 0 CHECK(reserved>=0),spent bigint NOT NULL DEFAULT 0 CHECK(spent>=0));
CREATE TABLE busy_ai_private.tariffs(
 model text NOT NULL,revision bigint NOT NULL CHECK(revision>0),feature text NOT NULL CHECK(feature IN('website-design','app-requirements')),
 enabled boolean NOT NULL DEFAULT false,expires_at timestamptz NOT NULL,
 max_input integer NOT NULL CHECK(max_input BETWEEN 1 AND 8000),max_output integer NOT NULL CHECK(max_output BETWEEN 1 AND 4000),
 input_micro_per_1000 bigint NOT NULL CHECK(input_micro_per_1000 BETWEEN 0 AND 100000000),output_micro_per_1000 bigint NOT NULL CHECK(output_micro_per_1000 BETWEEN 0 AND 100000000),
 fx_gbp_ppm bigint NOT NULL CHECK(fx_gbp_ppm BETWEEN 1 AND 10000000),buffer_bps integer NOT NULL CHECK(buffer_bps BETWEEN 0 AND 20000),
 expensive boolean NOT NULL DEFAULT false,currency text NOT NULL CHECK(currency IN('GBP','USD','EUR')),evidence_reference text NOT NULL CHECK(length(evidence_reference) BETWEEN 1 AND 160),PRIMARY KEY(model,revision),CHECK(currency<>'GBP' OR fx_gbp_ppm=1000000));
CREATE FUNCTION busy_ai_private.immutable_tariff() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Retain tariff evidence'; END IF;
 IF (to_jsonb(NEW)-'enabled') IS DISTINCT FROM (to_jsonb(OLD)-'enabled') THEN RAISE EXCEPTION 'Append a new tariff revision; do not alter reserved pricing'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER immutable_ai_tariff BEFORE UPDATE OR DELETE ON busy_ai_private.tariffs FOR EACH ROW EXECUTE FUNCTION busy_ai_private.immutable_tariff();
CREATE TABLE busy_ai_private.operations(
 id uuid PRIMARY KEY,request_nonce uuid NOT NULL,business_id uuid NOT NULL,actor_id uuid NOT NULL REFERENCES auth.users(id),period date NOT NULL,
 feature text NOT NULL,model text NOT NULL,tariff_revision bigint NOT NULL,binding jsonb NOT NULL,goal_hash text NOT NULL CHECK(goal_hash~'^[a-f0-9]{64}$'),
 maximum bigint NOT NULL CHECK(maximum>=0),expensive boolean NOT NULL,pricing jsonb NOT NULL,
 state text NOT NULL CHECK(state IN('reserved','dispatched','unknown','settled','released')),attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 1),
 actual bigint,usage_input integer,usage_output integer,receipt text,created_at timestamptz NOT NULL DEFAULT now(),dispatched_at timestamptz,updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(business_id,period) REFERENCES busy_ai_private.accounts(business_id,period),FOREIGN KEY(model,tariff_revision) REFERENCES busy_ai_private.tariffs(model,revision));
CREATE UNIQUE INDEX ai_operations_provider_receipt ON busy_ai_private.operations(receipt) WHERE receipt IS NOT NULL;
CREATE INDEX ai_operations_account_state ON busy_ai_private.operations(business_id,period,state);
CREATE TABLE busy_ai_private.events(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,operation_id uuid NOT NULL REFERENCES busy_ai_private.operations(id),event text NOT NULL,at timestamptz NOT NULL DEFAULT now());
-- No caller can edit accounting tables or mint entitlement/tariff evidence.
DO $$ DECLARE t record;BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='busy_ai_private' LOOP
 EXECUTE format('ALTER TABLE busy_ai_private.%I ENABLE ROW LEVEL SECURITY',t.tablename);
 EXECUTE format('ALTER TABLE busy_ai_private.%I FORCE ROW LEVEL SECURITY',t.tablename);
 END LOOP;
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA busy_ai_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA busy_ai_private FROM PUBLIC,anon,authenticated,service_role;

-- Exact selected sources, current owner permission and source locks. This is NOT
-- a workspace snapshot endpoint; no customer/inbox records are returned.
CREATE FUNCTION public.busy_ai_context_v1(p_actor uuid,p_business uuid,p_binding jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE s public.busy_business_snapshots;pr public.busy_public_business_profiles;a public.busy_mini_apps;project jsonb;catalog jsonb:='[]';
BEGIN
 IF p_actor IS NULL OR p_business IS NULL OR jsonb_typeof(p_binding)<>'object' OR pg_column_size(p_binding)>4000 OR (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(p_binding) k) IS DISTINCT FROM ARRAY['pageId','profileRevision','projectId','snapshotRevision','sourceRevision','surface'] THEN RAISE EXCEPTION 'Invalid binding'; END IF;
 PERFORM 1 FROM public.busy_business_memberships WHERE user_id=p_actor AND business_id=p_business AND role='owner' FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Owner required'; END IF;
 SELECT * INTO pr FROM public.busy_public_business_profiles WHERE business_id=p_business FOR SHARE;
 IF NOT FOUND OR pr.revision IS DISTINCT FROM (p_binding->>'profileRevision')::bigint THEN RAISE EXCEPTION 'Profile changed'; END IF;
 SELECT * INTO s FROM public.busy_business_snapshots WHERE business_id=p_business FOR SHARE;
 IF NOT FOUND OR s.revision IS DISTINCT FROM (p_binding->>'snapshotRevision')::bigint THEN RAISE EXCEPTION 'Source changed'; END IF;
 IF p_binding->>'surface'='website' THEN
  project:=s.payload->'websiteDraft';
  IF project->>'id' IS DISTINCT FROM p_binding->>'projectId' OR (project->>'generation')::bigint IS DISTINCT FROM (p_binding->>'sourceRevision')::bigint OR project->>'businessId' IS DISTINCT FROM p_business::text OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(project->'pages') x WHERE x->>'id'=p_binding->>'pageId' AND coalesce((x->>'enabled')::boolean,true)) THEN RAISE EXCEPTION 'Website changed'; END IF;
 ELSIF p_binding->>'surface'='app' AND p_binding->'pageId'='null'::jsonb THEN
  SELECT * INTO a FROM public.busy_mini_apps WHERE id=(p_binding->>'projectId')::uuid AND business_id=p_business AND created_by=p_actor FOR SHARE;
  IF NOT FOUND OR a.draft_revision IS DISTINCT FROM (p_binding->>'sourceRevision')::bigint OR a.status NOT IN('draft','preview_ready') THEN RAISE EXCEPTION 'App changed'; END IF;
  project:=jsonb_build_object('id',a.id,'business_id',a.business_id,'draft_revision',a.draft_revision,'draft_config',a.draft_config);
  SELECT coalesce(jsonb_agg(jsonb_build_object('module_key',module_key,'module_version',module_version,'status',status,'title',title,'capabilities',capabilities) ORDER BY module_key),'[]') INTO catalog FROM public.busy_mini_app_module_catalog WHERE status='available';
 ELSE RAISE EXCEPTION 'Unsupported surface'; END IF;
 IF project IS NULL OR pg_column_size(project)>600000 THEN RAISE EXCEPTION 'Unsupported project size'; END IF;
 RETURN jsonb_build_object('ownerId',p_actor,'businessId',p_business,'project',project,'profile',busy_snapshot_private.profile_facts(pr.profile),'catalog',catalog);
END $$;

CREATE FUNCTION busy_ai_private.cost(p jsonb,i integer,o integer) RETURNS bigint LANGUAGE sql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$
 SELECT ceil(((i::numeric*(p->>'input_micro_per_1000')::numeric+o::numeric*(p->>'output_micro_per_1000')::numeric)/1000)*(p->>'fx_gbp_ppm')::numeric/1000000*(10000+(p->>'buffer_bps')::numeric)/10000)::bigint
$$;
CREATE FUNCTION public.busy_ai_reserve_v1(p_actor uuid,p_business uuid,p_operation uuid,p_model text,p_feature text,p_binding jsonb,p_goal_hash text,p_request_nonce uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE policy busy_ai_private.policy;account busy_ai_private.accounts;t busy_ai_private.tariffs;prior busy_ai_private.operations;month date:=date_trunc('month',now() AT TIME ZONE 'UTC')::date;maximum bigint;pricing jsonb;feature_used bigint;
BEGIN
 PERFORM public.busy_ai_context_v1(p_actor,p_business,p_binding);
 IF (p_feature IS DISTINCT FROM (CASE p_binding->>'surface' WHEN 'website' THEN 'website-design' WHEN 'app' THEN 'app-requirements' END)) THEN RAISE EXCEPTION 'Feature binding mismatch'; END IF;
 SELECT * INTO policy FROM busy_ai_private.policy WHERE singleton FOR UPDATE;
 IF NOT FOUND OR policy.enabled IS DISTINCT FROM true OR p_operation IS NULL OR p_request_nonce IS NULL OR p_goal_hash IS NULL OR p_goal_hash!~'^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'AI admission unavailable'; END IF;
 SELECT * INTO account FROM busy_ai_private.accounts WHERE business_id=p_business AND period=month FOR UPDATE;
 IF NOT FOUND OR NOT account.entitlement_verified OR account.active_until<=now() OR account.blocked THEN RAISE EXCEPTION 'Allowance unavailable'; END IF;
 SELECT * INTO prior FROM busy_ai_private.operations WHERE id=p_operation;
 IF FOUND THEN
  IF prior.business_id<>p_business OR prior.actor_id<>p_actor OR prior.model<>p_model OR prior.feature<>p_feature OR prior.binding IS DISTINCT FROM p_binding OR prior.goal_hash<>p_goal_hash THEN RAISE EXCEPTION 'Operation identity conflict'; END IF;
  RETURN jsonb_build_object('operationId',prior.id,'state',prior.state,'fresh',false);
 END IF;
 IF (SELECT count(*) FROM busy_ai_private.operations WHERE business_id=p_business AND created_at>=date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')>=60 THEN RAISE EXCEPTION 'Daily preparation limit reached'; END IF;
 SELECT * INTO t FROM busy_ai_private.tariffs WHERE model=p_model AND feature=p_feature AND enabled AND expires_at>now() ORDER BY revision DESC LIMIT 1 FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Tariff unavailable'; END IF;
 pricing:=to_jsonb(t);maximum:=busy_ai_private.cost(pricing,t.max_input,t.max_output);
 IF (SELECT count(*) FROM busy_ai_private.operations WHERE business_id=p_business AND state IN('reserved','dispatched','unknown'))>=account.concurrent_limit THEN RAISE EXCEPTION 'Another request needs attention'; END IF;
 SELECT coalesce(sum(CASE WHEN entry.state='settled' THEN entry.actual WHEN entry.state IN('reserved','dispatched','unknown') THEN entry.maximum ELSE 0 END),0) INTO feature_used FROM busy_ai_private.operations entry WHERE entry.business_id=p_business AND entry.period=month AND entry.feature=p_feature;
 IF NOT(account.feature_limits?p_feature) OR jsonb_typeof(account.feature_limits->p_feature) IS DISTINCT FROM 'number' OR (account.feature_limits->>p_feature)::bigint<0 OR feature_used+maximum>(account.feature_limits->>p_feature)::bigint OR account.spent+account.reserved+maximum>account.monthly_limit OR t.expensive AND account.expensive_spent+account.expensive_reserved+maximum>account.expensive_limit THEN RAISE EXCEPTION 'Monthly allowance exceeded'; END IF;
 INSERT INTO busy_ai_private.periods(period) VALUES(month) ON CONFLICT DO NOTHING;
 IF (SELECT spent+reserved+maximum FROM busy_ai_private.periods WHERE period=month)>policy.monthly_hard_limit THEN RAISE EXCEPTION 'Platform ceiling reached'; END IF;
 UPDATE busy_ai_private.periods SET reserved=reserved+maximum WHERE period=month;
 UPDATE busy_ai_private.accounts SET reserved=reserved+maximum,expensive_reserved=expensive_reserved+CASE WHEN t.expensive THEN maximum ELSE 0 END WHERE business_id=p_business AND period=month;
 INSERT INTO busy_ai_private.operations(id,request_nonce,business_id,actor_id,period,feature,model,tariff_revision,binding,goal_hash,maximum,expensive,pricing,state) VALUES(p_operation,p_request_nonce,p_business,p_actor,month,p_feature,p_model,t.revision,p_binding,p_goal_hash,maximum,t.expensive,pricing,'reserved');
 INSERT INTO busy_ai_private.events(operation_id,event) VALUES(p_operation,'reserved');
 RETURN jsonb_build_object('operationId',p_operation,'state','reserved','fresh',true,'maxInput',t.max_input,'maxOutput',t.max_output);
END $$;

CREATE FUNCTION public.busy_ai_dispatch_v1(p_actor uuid,p_business uuid,p_operation uuid,p_request_nonce uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE op busy_ai_private.operations;policy busy_ai_private.policy;account busy_ai_private.accounts;feature_used bigint;
BEGIN
 SELECT * INTO op FROM busy_ai_private.operations WHERE id=p_operation AND actor_id=p_actor AND business_id=p_business;
 IF NOT FOUND THEN RAISE EXCEPTION 'Operation not found'; END IF;
 PERFORM public.busy_ai_context_v1(p_actor,p_business,op.binding);
 SELECT * INTO policy FROM busy_ai_private.policy WHERE singleton FOR UPDATE;
 SELECT * INTO account FROM busy_ai_private.accounts WHERE business_id=p_business AND period=op.period AND entitlement_verified AND NOT blocked AND active_until>now() FOR UPDATE;
 IF NOT FOUND OR policy.enabled IS DISTINCT FROM true THEN RAISE EXCEPTION 'Admission revoked'; END IF;
 PERFORM 1 FROM busy_ai_private.tariffs WHERE model=op.model AND revision=op.tariff_revision AND enabled AND expires_at>now() FOR SHARE;
 IF NOT FOUND OR account.spent+account.reserved>account.monthly_limit OR op.expensive AND account.expensive_spent+account.expensive_reserved>account.expensive_limit OR (SELECT spent+reserved FROM busy_ai_private.periods WHERE period=op.period)>policy.monthly_hard_limit THEN RAISE EXCEPTION 'Admission revoked'; END IF;
 SELECT coalesce(sum(CASE WHEN entry.state='settled' THEN entry.actual WHEN entry.state IN('reserved','dispatched','unknown') THEN entry.maximum ELSE 0 END),0) INTO feature_used FROM busy_ai_private.operations entry WHERE entry.business_id=p_business AND entry.period=op.period AND entry.feature=op.feature;
 IF NOT(account.feature_limits?op.feature) OR jsonb_typeof(account.feature_limits->op.feature) IS DISTINCT FROM 'number' OR feature_used>(account.feature_limits->>op.feature)::bigint THEN RAISE EXCEPTION 'Feature allowance revoked'; END IF;
 SELECT * INTO op FROM busy_ai_private.operations WHERE id=p_operation FOR UPDATE;
 IF op.request_nonce IS DISTINCT FROM p_request_nonce OR op.state<>'reserved' OR op.period<>date_trunc('month',now() AT TIME ZONE 'UTC')::date OR op.created_at<now()-interval '30 seconds' THEN RAISE EXCEPTION 'Do not replay or dispatch an expired operation'; END IF;
 UPDATE busy_ai_private.operations SET state='dispatched',attempts=1,dispatched_at=now(),updated_at=now() WHERE id=p_operation;
 INSERT INTO busy_ai_private.events(operation_id,event) VALUES(p_operation,'dispatched');
 RETURN jsonb_build_object('operationId',p_operation,'state','dispatched','maxInput',(op.pricing->>'max_input')::int,'maxOutput',(op.pricing->>'max_output')::int);
END $$;

-- Only trusted provider/reconciliation code may settle. Never client/model usage.
-- Membership may have been revoked: settle outstanding liability without enabling
-- more work. Reserved operations alone can be released without provider evidence.
CREATE FUNCTION public.busy_ai_finish_v1(p_actor uuid,p_business uuid,p_operation uuid,p_outcome text,p_input integer DEFAULT NULL,p_output integer DEFAULT NULL,p_receipt text DEFAULT NULL,p_request_nonce uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE op busy_ai_private.operations;amount bigint:=0;overrun boolean:=false;
BEGIN
 PERFORM 1 FROM busy_ai_private.policy WHERE singleton FOR UPDATE;
 SELECT * INTO op FROM busy_ai_private.operations WHERE id=p_operation AND actor_id=p_actor AND business_id=p_business;
 IF NOT FOUND THEN RAISE EXCEPTION 'Operation not found'; END IF;
 PERFORM 1 FROM busy_ai_private.accounts WHERE business_id=p_business AND period=op.period FOR UPDATE;
 SELECT * INTO op FROM busy_ai_private.operations WHERE id=p_operation FOR UPDATE;
 IF p_request_nonce IS NOT NULL AND p_request_nonce IS DISTINCT FROM op.request_nonce THEN RAISE EXCEPTION 'Another request owns this reservation'; END IF;
 IF p_outcome NOT IN('settled','released','unknown') OR p_outcome IS NULL THEN RAISE EXCEPTION 'Unsupported outcome'; END IF;
 IF p_outcome IN('released','unknown') AND (p_input IS NOT NULL OR p_output IS NOT NULL OR p_receipt IS NOT NULL) THEN RAISE EXCEPTION 'Usage evidence requires settlement, not a non-execution acknowledgement'; END IF;
 IF op.state='settled' THEN
  IF p_outcome<>'settled' OR op.usage_input IS DISTINCT FROM p_input OR op.usage_output IS DISTINCT FROM p_output OR op.receipt IS DISTINCT FROM p_receipt THEN RAISE EXCEPTION 'Conflicting receipt'; END IF;
  RETURN jsonb_build_object('state','settled','replayed',true);
 END IF;
 IF op.state='released' THEN
  IF p_outcome<>'released' THEN RAISE EXCEPTION 'Operation already released'; END IF;
  RETURN jsonb_build_object('state','released','replayed',true);
 END IF;
 IF p_outcome='unknown' THEN
  IF op.state NOT IN('dispatched','unknown') THEN RAISE EXCEPTION 'Not dispatched'; END IF;
  IF op.state='dispatched' THEN INSERT INTO busy_ai_private.events(operation_id,event) VALUES(p_operation,'unknown'); END IF;
  UPDATE busy_ai_private.operations SET state='unknown',updated_at=now() WHERE id=p_operation;
  RETURN jsonb_build_object('state','unknown','mayRetry',false);
 ELSIF p_outcome='released' THEN
  IF op.state<>'reserved' THEN RAISE EXCEPTION 'Execution uncertainty must remain reserved'; END IF;
 ELSE
  IF op.state NOT IN('dispatched','unknown') OR p_input IS NULL OR p_output IS NULL OR p_input<0 OR p_output<0 OR p_input>1000000 OR p_output>1000000 OR p_receipt IS NULL OR p_receipt!~'^[A-Za-z0-9:_-]{8,160}$' THEN RAISE EXCEPTION 'Verified usage evidence required'; END IF;
  amount:=busy_ai_private.cost(op.pricing,p_input,p_output);overrun:=amount>op.maximum OR p_input>(op.pricing->>'max_input')::integer OR p_output>(op.pricing->>'max_output')::integer;
 END IF;
 UPDATE busy_ai_private.accounts SET reserved=reserved-op.maximum,spent=spent+amount,expensive_reserved=expensive_reserved-CASE WHEN op.expensive THEN op.maximum ELSE 0 END,expensive_spent=expensive_spent+CASE WHEN op.expensive THEN amount ELSE 0 END,blocked=blocked OR overrun WHERE business_id=p_business AND period=op.period;
 UPDATE busy_ai_private.periods SET reserved=reserved-op.maximum,spent=spent+amount WHERE period=op.period;
 IF overrun THEN UPDATE busy_ai_private.policy SET enabled=false WHERE singleton; END IF;
 UPDATE busy_ai_private.operations SET state=p_outcome,actual=amount,usage_input=p_input,usage_output=p_output,receipt=p_receipt,updated_at=now() WHERE id=p_operation;
 INSERT INTO busy_ai_private.events(operation_id,event) VALUES(p_operation,p_outcome);
 RETURN jsonb_build_object('state',p_outcome,'overrun',overrun);
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA busy_ai_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.busy_ai_context_v1(uuid,uuid,jsonb),public.busy_ai_reserve_v1(uuid,uuid,uuid,text,text,jsonb,text,uuid),public.busy_ai_dispatch_v1(uuid,uuid,uuid,uuid),public.busy_ai_finish_v1(uuid,uuid,uuid,text,integer,integer,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.busy_ai_context_v1(uuid,uuid,jsonb),public.busy_ai_reserve_v1(uuid,uuid,uuid,text,text,jsonb,text,uuid),public.busy_ai_dispatch_v1(uuid,uuid,uuid,uuid),public.busy_ai_finish_v1(uuid,uuid,uuid,text,integer,integer,text,uuid) TO service_role;
COMMIT;
