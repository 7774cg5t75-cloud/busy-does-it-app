/**
 * Assemble ACTUAL historical Busy mini-app SQL migrations for a disposable
 * PostgreSQL CI transaction. The only transformed statement is the V3.45
 * cron background-job registration, explicitly forbidden in test fixtures.
 * Output is NEVER a deployable migration or a hosted staging installer.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
import {createHash} from "node:crypto";
const root=fileURLToPath(new URL("../",import.meta.url));
const read=p=>readFileSync(join(root,p),"utf8");
const base="staging/ISOLATED_ONLY_business_core_v3180.sql";
const ordered=[
 "20261007082234_v3_39_busy_apps_marketplace_foundation.sql",
 "20261007082328_v3_39_mini_app_version_hashing.sql",
 "20261007082355_v3_39_mini_app_request_idempotency.sql",
 "20261007083706_v3_39_mini_app_security_indexes.sql",
 "20261007101513_v3_40_mini_app_customer_journey_bridge.sql",
 "20261007102458_v3_40_mini_app_bridge_hardening.sql",
 "20261007125000_v3_41_mini_app_request_messaging.sql",
 "20261007125100_v3_41_mini_app_request_messaging_hardening.sql",
 "20261007133000_v3_42_mini_app_notifications.sql",
 "20261007161000_v3_45_guest_mini_app_requests.sql"
];
const sha=content=>createHash("sha256").update(content).digest("hex");
const sourceFiles=ordered.map(name=>({name,path:"supabase/migrations/"+name,
 content:read("supabase/migrations/"+name)}));
const guest=sourceFiles.at(-1);
const cronStart=/\ndo \$\$\ndeclare\n\s+v_job_id bigint;\nbegin\n/;
const boundary=cronStart.exec(guest.content);
if(!boundary||guest.content.split("select cron.schedule(").length!==2||
 !guest.content.includes("create or replace function public.busy_mini_app_create_guest_request(")||
 !guest.content.includes("grant execute on function public.busy_mini_app_create_guest_request(")||
 !guest.content.includes("create or replace function public.busy_prune_mini_app_guest_challenges()"))
 throw Error("The real guest migration changed; a developer must manually review the side-effect cutoff.");
// Keep the REAL SQL for all guest schema, constraints, challenge RPC and
// prune function; omit cron UNSCHEDULE/SCHEDULE and comments after boundary.
const guestContract=guest.content.slice(0,boundary.index);
if(/(?:cron\s*\.\s*(?:schedule|unschedule)|net\s*\.\s*http_)\s*\(/i.test(guestContract))
 throw Error("Background/external SQL unexpectedly appeared before the cutoff.");
const baseSql=read(base);
if(!baseSql.includes("create table if not exists public.busy_business_memberships"))
 throw Error("Missing existing V3.180 business baseline; stop.");
const sql=[
 "-- CI-ONLY GENERATED DISPOSABLE SQL; DO NOT DEPLOY OR APPLY TO SUPABASE",
 "\\set ON_ERROR_STOP on",
 "begin;",
 "create extension if not exists pgcrypto;",
 "create schema auth;",
 "create table auth.users(id uuid primary key);",
 "create role anon nologin;",
 "create role authenticated nologin;",
 "create role service_role nologin bypassrls;",
 "insert into auth.users(id) values",
 "('11111111-1111-4111-8111-111111111111'),",
 "('22222222-2222-4222-8222-222222222222');",
 baseSql,
 ...sourceFiles.map((file,i)=>i===sourceFiles.length-1?
   guestContract:file.content),
 read("staging/CI_ONLY_v3225_assert_guest_rpc.sql")
].join("\n\n");
const target="/tmp/bdi-v3225-disposable-guest";
mkdirSync(target,{recursive:true});
writeFileSync(join(target,"guest-rpc-rollback.sql"),sql);
writeFileSync(join(target,"source-manifest.json"),JSON.stringify({
 kind:"disposable_guest_rpc_v3225",project:"LOCAL_DOCKER_ONLY",
 sourceMigrations:sourceFiles.map(f=>({path:f.path,sha256:sha(f.content)})),
 base:{path:base,sha256:sha(baseSql)},
 guestRpcFromRealMigration:true,
 cronRegistrationOmitted:true,sourceEditedOnlyForDisposableCI:true,
 providerHttpNotExecuted:true,sqlForHostedSupabase:false,
 externallyInstalled:false
},null,2)+"\n");
console.log("V3.225 disposable guest RPC source: "+sourceFiles.length+
 " actual migration bodies, cron registration excluded, /tmp output only.");
