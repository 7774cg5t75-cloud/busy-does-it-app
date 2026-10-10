/**
 * V3.130: fixture-only CI checks for the ACTUAL independently provisioned
 * staging project's app configuration and migration provenance.
 *
 * Real database policies/privileges are attested by read-only SQL in
 * staging/ISOLATED_ONLY_verify_live_rls_v3130.sql and are not checked
 * remotely by this script. Do not describe this as genuine Auth E2E.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {busyRuntimeCloudConfig} from "../src/core/stagingRuntimeIsolation.mjs";
const load=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
let n=0;
const ok=(condition,label)=>{assert.ok(condition,label);n++;};
const eq=(a,b,label)=>{assert.equal(a,b,label);n++;};
const project="pnjdlogwegnqbsfpcofw",
  prod="qgkmuiipicazmcxxmoxv",
  slow="rtqqnqbrqpjondvcyann";
const p={
 environment:"isolated-staging",
 productionSupabaseUrl:"https://"+prod+".supabase.co",
 productionPublishableKey:"sb_publishable_fake_production_for_CI",
 productionAiUrl:"https://"+prod+".supabase.co/functions/v1/busy-ai-intake",
 otherProtectedSupabaseRef:slow,
 expectedStagingSupabaseRef:project,
 stagingSupabaseUrl:"https://"+project+".supabase.co",
 stagingPublishableKey:"sb_publishable_synthetic_testing_key_123456789"
};
const actual=busyRuntimeCloudConfig(p);
eq(actual.configured,true,"Verified staging project ref is permitted");
eq(actual.baseUrl,"https://"+project+".supabase.co","Pinned stage origin");
eq(actual.prodFallbackAllowed,false,"No production fallback allowed");
eq(actual.realSupabaseAuthVerified,false,"Config cannot claim genuine Auth");
for(const ref of [prod,slow,"abcdefghijklmnopqrst"]){
 const wrong=busyRuntimeCloudConfig({
  ...p,stagingSupabaseUrl:"https://"+ref+".supabase.co"
 });
 eq(wrong.configured,false,"Unapproved cloud project "+ref+" blocked");
 eq(wrong.publishableKey,"","Unapproved project never receives credentials");
}
eq(busyRuntimeCloudConfig({...p,expectedStagingSupabaseRef:""}).configured,
 true,"General helper remains backwards compatible with V3.128 fixtures");
eq(busyRuntimeCloudConfig({...p,stagingPublishableKey:""}).configured,
 false,"Missing staging key never becomes production connection");
const runtime=load("src/core/runtime.js");
ok(runtime.includes('expectedStagingSupabaseRef:"'+project+'"'),
 "Shared iPhone app runtime requires exactly connected staging project");
ok(runtime.includes("if (IS_STAGING_BUILD && !CLOUD_CONFIG.configured)"),
 "Shared transport fails before fetch on unconfigured staging");
const seed=load("staging/ISOLATED_ONLY_seed_two_real_auth_users_v3130.sql");
ok(seed.includes("from auth.users"),"Test owners must already exist in genuine Supabase Auth");
ok(seed.includes("bdi-stage-owner-a@example.invalid")&&
 seed.includes("bdi-stage-owner-b@example.invalid"),"Two distinct explicitly fictional accounts");
ok(seed.includes("on conflict (id) do nothing"),"Fictional setup idempotent");
ok(seed.includes("owner_id<>a")&&seed.includes("owner_id<>b"),
 "Owner ID conflicts fail rather than overwriting another tenant");
ok(!/\binsert\s+into\s+(?:auth\.)?users\b/i.test(seed),
 "Never directly insert into Supabase protected Auth users table");
ok(!/\bdelete\s+from\s+(?:auth\.)?users\b/i.test(seed),
 "Never delete real Auth users from staging seed");
ok(!/\bgrant\s+all\b/i.test(seed),"No broad grants");
const audit=load("staging/ISOLATED_ONLY_verify_live_rls_v3130.sql");
for(const phrase of ["row_level_security_enforced","anonymous_select_denied",
 "authenticated_select_granted","authenticated_writes_denied",
 "exact_owner_only_read_policy","anon_cannot_execute_rls_helper",
 "authenticated_cannot_execute_rls_helper","automatic_rls_trigger_preserved",
 "real_auth_accounts_total","fictional_owner_test_rows_total"]){
 ok(audit.includes(phrase),"Real cloud read-only audit must include "+phrase);
}
const migrated=load("staging/ISOLATED_ONLY_canary_setup.sql");
ok(migrated.includes("references auth.users(id)"),
 "Actual cloud schema links owner IDs to genuine Auth users");
ok(migrated.includes("enable row level security")&&
 migrated.includes("force row level security"),"Real RLS must be enabled and forced");
ok(migrated.includes("for select to authenticated"),"Exactly authenticated owner read policy");
const restrict=load("staging/ISOLATED_ONLY_lock_down_rls_helper_v3130.sql");
ok(restrict.includes("revoke execute on function public.rls_auto_enable() from public, anon, authenticated"),
 "Helper lockdown must match applied migration");
const workflow=load(".github/workflows/production-check.yml");
ok(workflow.includes("check-staging-live-readiness-v3130.mjs"),
 "Normal CI regression verifies approved staging project ref");
console.log("V3.130 PASS: "+n+" pinned project, protected Auth-user setup, verified RLS source and staging boundary assertions (source only).");
