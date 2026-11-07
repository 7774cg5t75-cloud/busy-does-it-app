-- REVIEW-ONLY fail-closed rollback. Does NOT restore unrestricted legacy writes.
-- Apply only under separate database authority, not through this Codex mission.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.busy_snapshot_private_mutation_v1(uuid,bigint,integer,text,text,jsonb,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE INSERT (business_id) ON TABLE public.busy_business_snapshots FROM authenticated;
-- Keep table/column write fence, insert guard, original rows and private fields.
-- Affected clients stay read-only with their unsaved device work retained.
COMMIT;
