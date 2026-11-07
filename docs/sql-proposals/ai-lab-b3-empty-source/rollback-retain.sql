-- REVIEW ONLY: retaining rollback for sbvkrvksnruiclcvclbd only. Separate approval required.
-- Runner owns the transaction/history. No data, Auth, receipt, spending or original-function deletion.
-- Retain P0002/PT409 safety corrections; restoring deliberate40001 errors would restore the known retry defect.
DO $$ BEGIN RAISE EXCEPTION 'AI LAB B3 SOURCE CONTRACT ROLLBACK REVIEW FUSE: separate exact retaining rollback approval required'; END $$;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
DO $rollback_guard$
DECLARE item record; p pg_proc%ROWTYPE;
BEGIN
 IF current_user<>'postgres' OR current_setting('server_version_num')::int NOT BETWEEN 170000 AND 179999 THEN RAISE EXCEPTION 'Reviewed postgres installer and PostgreSQL17 required'; END IF;
 FOR item IN SELECT * FROM (VALUES
 ('public.busy_connected_builder_read_v1(uuid)','538e9d3f088f54f8385ca1c13f34fe75d61eb3c5e54d4ca51ae6f8092285881d'),
 ('public.busy_connected_profile_write_v1(uuid,bigint,jsonb,jsonb,boolean)','33b6b3320a73a59d3ca8747f2d6cd7e2eecfe51b1ac039a2e17191787bccf7a4'),
 ('busy_snapshot_private.website_commit_original(uuid,uuid,bigint,jsonb,jsonb,bigint)','6fcc34afbf762a18279d7582a02550071724ae085bb60d7b77fadcdc9c9d7cc8'),
 ('public.busy_connected_website_transition_v1(uuid,uuid,bigint,jsonb,jsonb,bigint,text)','7c4d0ebade250c5f9cb049898675a9e256fdce695405a42f8266fe026c88530c'),
 ('public.busy_connected_website_history_v1(uuid,bigint,text,text)','ad737c9f8b4c81e65661be067b57df84144ec9ebbaae7de233f2e47029f5981a')
 ) AS expected(signature,new_sha) LOOP
  SELECT * INTO p FROM pg_proc WHERE oid=to_regprocedure(item.signature);
  IF NOT FOUND OR encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') IS DISTINCT FROM item.new_sha THEN RAISE EXCEPTION 'Corrected original authority changed; retaining rollback refused'; END IF;
 END LOOP;
 SELECT * INTO p FROM pg_proc WHERE oid=to_regprocedure('public.busy_connected_builder_source_state_v1(uuid)');
 IF NOT FOUND OR p.proowner<>'postgres'::regrole OR encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') IS DISTINCT FROM '8740beb8e8c8fa858735ab50a3ab6081c56cc8481a996899ecc2058fd11455b9' THEN RAISE EXCEPTION 'Reviewed source projection unavailable'; END IF;
END $rollback_guard$;
REVOKE ALL ON FUNCTION public.busy_connected_builder_source_state_v1(uuid) FROM PUBLIC,anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
