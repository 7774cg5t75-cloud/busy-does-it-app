-- BUSY DOES IT V3.218 — DRAFT POSTGRES REVIEW DOCUMENT ONLY.
-- NEVER place this file under supabase/migrations/ or run on a connected DB.
-- Intentionally aborts before any DDL. This design has NOT been schema-
-- reconciled with a real Supabase project; no approved RLS/RPC is present.
--
-- DESIGN ASSUMPTIONS NEED CONFIRMATION:
--  1. busy_mini_app_requests.id and the existing request_origin constraints.
--  2. Existing business/site/deployment/app table PKs and immutable status.
--  3. Existing provider delivery tables/outbox; avoid a duplicate service.
--  4. Tenant RLS ownership checks and retention/deletion legal requirements.
--  5. Exact concurrency / deadlock / challenge rate limiting in staging.
BEGIN;
DO $v3218$ BEGIN
  RAISE EXCEPTION 'V3.218 REVIEW-ONLY SQL: do not execute; requires schema, RLS, transaction and owner approval';
END $v3218$;

-- The statements below cannot execute after the intentional exception.
-- They are a discussion baseline, NOT an operational migration.
CREATE TABLE busy_website_form_approvals_v1 (
  id uuid PRIMARY KEY,
  business_id uuid NOT NULL,
  website_id uuid NOT NULL,
  deployment_id uuid NOT NULL,
  app_id uuid NOT NULL,
  app_version_id uuid NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('enquiry','booking_request')),
  notice_revision text NOT NULL,
  notice_text text NOT NULL,
  purpose text NOT NULL,
  retention_days integer NOT NULL CHECK (retention_days BETWEEN 1 AND 730),
  allowed_fields jsonb NOT NULL,
  approved_services jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL CHECK (status IN ('approved','revoked')),
  approved_by uuid NOT NULL,
  approved_at timestamptz NOT NULL,
  revoked_at timestamptz,
  UNIQUE (business_id, website_id, deployment_id, request_type, notice_revision),
  CHECK (status <> 'revoked' OR revoked_at IS NOT NULL)
);
CREATE TABLE busy_website_intake_challenges_v1 (
  id uuid PRIMARY KEY,
  business_id uuid NOT NULL,
  website_id uuid NOT NULL,
  deployment_id uuid NOT NULL,
  approval_id uuid NOT NULL REFERENCES busy_website_form_approvals_v1(id),
  request_type text NOT NULL CHECK (request_type IN ('enquiry','booking_request')),
  proof_digest bytea NOT NULL,
  fingerprint_digest bytea NOT NULL,
  key_digest bytea NOT NULL,
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  consumed_at timestamptz,
  abuse_limits_passed boolean NOT NULL DEFAULT false,
  CHECK (expires_at > issued_at)
);
CREATE TABLE busy_website_request_idempotency_v1 (
  id uuid PRIMARY KEY,
  business_id uuid NOT NULL,
  website_id uuid NOT NULL,
  deployment_id uuid NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('enquiry','booking_request')),
  key_digest bytea NOT NULL,
  payload_digest bytea NOT NULL,
  request_id uuid,
  state text NOT NULL CHECK (state IN ('claiming','committed','unknown')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, website_id, deployment_id, request_type, key_digest),
  CHECK (state <> 'committed' OR request_id IS NOT NULL)
);
CREATE TABLE busy_website_request_outbox_v1 (
  id uuid PRIMARY KEY,
  business_id uuid NOT NULL,
  request_id uuid NOT NULL,
  event_type text NOT NULL,
  state text NOT NULL CHECK (state IN ('pending','attempted','accepted_by_provider','failed','delivered')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 100),
  next_attempt_at timestamptz,
  provider_receipt_digest bytea,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, request_id, event_type)
);

-- DENY BY DEFAULT. Real owner reads/writes must be separately designed
-- and independently tenant-authorised. SERVICE ROLE must never be passed
-- to browsers. These RLS declarations alone do NOT make an endpoint safe.
ALTER TABLE busy_website_form_approvals_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE busy_website_intake_challenges_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE busy_website_request_idempotency_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE busy_website_request_outbox_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON busy_website_form_approvals_v1 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON busy_website_intake_challenges_v1 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON busy_website_request_idempotency_v1 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON busy_website_request_outbox_v1 FROM PUBLIC, anon, authenticated;

-- A FUTURE transaction/RPC must:
-- * resolve current live site & exact app from server-owned rows;
-- * verify approved notice, challenge, same source and traffic limits;
-- * claim the UNIQUE composite scope and compare payload digest under lock;
-- * atomically consume the one-time challenge, create shared request and
--   persist idempotency + pending outbox;
-- * for replay, use the EXISTING request and independently read it back;
-- * reject same-key/different-payload attempts without leaking another ID;
-- * avoid assuming a saved enquiry is a confirmed booking or delivered send.
--
-- The actual request-origin extension, business-owned FKs, RPC permissions,
-- outbox worker and deployment order MUST be revised against real schema.
COMMIT;
