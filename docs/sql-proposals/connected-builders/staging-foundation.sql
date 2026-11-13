-- REVIEW ONLY: explicit fresh-staging compatibility contract, NOT a captured production export.
-- Canonical existing names/columns required by the original finite snapshot writers.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'STAGING FOUNDATION REVIEW FUSE: exact staging compatibility approval required'; END $$;
CREATE TABLE public.busy_business_snapshots(
 business_id uuid PRIMARY KEY REFERENCES public.busy_businesses(id) ON DELETE CASCADE,
 payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(payload)='object'),
 schema_version integer NOT NULL DEFAULT 1 CHECK(schema_version=1),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>=1),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.busy_business_snapshots IS 'connected_staging_compatibility_v1: original canonical finite-writer contract; not production DDL capture';
ALTER TABLE public.busy_business_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.busy_business_snapshots FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.busy_business_snapshots FROM PUBLIC,anon,authenticated,service_role;
-- No broad snapshot policies, readers, seed data or client table writes.
COMMIT;
