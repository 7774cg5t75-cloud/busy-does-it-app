#!/usr/bin/env bash
# Disposable, local PostgreSQL 17 service ONLY. No Supabase API request.
set -euo pipefail
if [[ "${BUSY_EPHEMERAL_RLS_CI:-}" != "ALLOW_DISPOSABLE_TEST_ONLY" ||
      "${PGHOST:-}" != "127.0.0.1" ||
      "${PGPORT:-}" != "5432" ||
      "${PGDATABASE:-}" != "busy_staging_ci" ||
      "${PGUSER:-}" != "postgres" ]]; then
  echo "V3.127 blocked: dedicated ephemeral loopback PostgreSQL not confirmed" >&2
  exit 2
fi
: "${PGPASSWORD:?Ephemeral service-container password required}"
query() { psql -X -A -t -q -v ON_ERROR_STOP=1 -c "$1"; }
expect_value() {
  local expected="$1" sql="$2" label="$3" actual
  actual="$(query "$sql")"
  if [[ "$actual" != "$expected" ]]; then
    echo "FAILED: $label (unexpected query result)" >&2
    exit 1
  fi
  echo "PASS: $label"
}
expect_failure() {
  local label="$1" sql="$2" failure
  if failure="$(query "$sql" 2>&1)"; then
    echo "FAILED: $label (dangerous operation succeeded)" >&2
    exit 1
  fi
  if [[ "$failure" != *"permission denied"* &&
        "$failure" != *"row-level security policy"* ]]; then
    echo "FAILED: $label (not rejected by expected security control)" >&2
    exit 1
  fi
  echo "PASS: $label"
}
expect_value "busy_staging_ci" "select current_database();" "isolated fixture database confirmed"
expect_value "127.0.0.1" "select host(inet_server_addr());" "loopback server connection confirmed"
psql -X -q -v ON_ERROR_STOP=1 -f staging/ci-postgres-bootstrap-v3127.sql > /dev/null
A="91edb6db-3a02-4de4-9ba8-5c93b4e790a1"
B="d8836a0e-fbb0-4cb9-a613-509af50eb114"
ROW_A="20f9279e-0dcf-4b1b-aad0-4952c4aab332"
ROW_B="0aa3150d-8e85-4ca3-bda2-f8f3dd6c9bcf"
as_owner() {
  local owner="$1" sql="$2"
  printf "set role authenticated; set request.jwt.claim.sub = '%s'; %s" "$owner" "$sql"
}
expect_value "1" "$(as_owner "$A" "select count(*) from public.busy_staging_rls_canary where id='$ROW_A';")" "Owner A can read A using actual Postgres RLS"
expect_value "1" "$(as_owner "$B" "select count(*) from public.busy_staging_rls_canary where id='$ROW_B';")" "Owner B can read B using actual Postgres RLS"
expect_value "0" "$(as_owner "$A" "select count(*) from public.busy_staging_rls_canary where id='$ROW_B';")" "Owner A cannot read B"
expect_value "0" "$(as_owner "$B" "select count(*) from public.busy_staging_rls_canary where id='$ROW_A';")" "Owner B cannot read A"
expect_value "0" "set role authenticated; reset request.jwt.claim.sub; select count(*) from public.busy_staging_rls_canary;" "Absent identity exposes no records"
expect_failure "Anonymous database role cannot read" "set role anon; select count(*) from public.busy_staging_rls_canary;"
expect_failure "Client cannot insert into read-only table" "$(as_owner "$A" "insert into public.busy_staging_rls_canary (id,owner_id,marker) values ('11111111-1111-4111-8111-111111111111','$A','should_deny');")"
expect_failure "Client cannot update read-only table" "$(as_owner "$A" "update public.busy_staging_rls_canary set marker='should_deny' where id='$ROW_A';")"
expect_failure "Client cannot delete from read-only table" "$(as_owner "$A" "delete from public.busy_staging_rls_canary where id='$ROW_A';")"
expect_value "1" "$(as_owner "$A" "select count(*) from public.busy_ci_owner_write where id='$ROW_A';")" "Owner A can read own editable record"
expect_value "0" "$(as_owner "$A" "select count(*) from public.busy_ci_owner_write where id='$ROW_B';")" "Owner A cannot read B editable record"
expect_value "0" "$(as_owner "$B" "with changed as (update public.busy_ci_owner_write set note='bad' where id='$ROW_A' returning id) select count(*) from changed;")" "Owner B cannot update A editable record"
expect_value "0" "$(as_owner "$A" "with deleted as (delete from public.busy_ci_owner_write where id='$ROW_B' returning id) select count(*) from deleted;")" "Owner A cannot delete B editable record"
expect_failure "Owner A cannot reassign ownership to B" "$(as_owner "$A" "update public.busy_ci_owner_write set owner_id='$B' where id='$ROW_A';")"
expect_failure "Owner A cannot insert a record owned by B" "$(as_owner "$A" "insert into public.busy_ci_owner_write (id,owner_id,note) values ('11111111-1111-4111-8111-111111111112','$B','bad');")"
expect_value "1" "$(as_owner "$A" "with changed as (update public.busy_ci_owner_write set note='owner_a_changed' where id='$ROW_A' returning id) select count(*) from changed;")" "Owner A can legitimately update own row"
expect_value "1" "$(as_owner "$B" "with created as (insert into public.busy_ci_owner_write (id,owner_id,note) values ('11111111-1111-4111-8111-111111111113','$B','owner_b_added') returning id) select count(*) from created;")" "Owner B can legitimately insert own row"
expect_value "1" "$(as_owner "$B" "with deleted as (delete from public.busy_ci_owner_write where id='11111111-1111-4111-8111-111111111113' returning id) select count(*) from deleted;")" "Owner B can legitimately delete own row"
expect_value "1" "$(as_owner "$A" "select count(*) from public.busy_ci_owner_write where id='$ROW_A' and note='owner_a_changed';")" "Successful update stayed with correct owner"
echo "V3.127 SQL RLS PASS: 20 disposable local PostgreSQL assertions; no live Auth JWT, cloud Supabase project or application-wide tenant security certified."
