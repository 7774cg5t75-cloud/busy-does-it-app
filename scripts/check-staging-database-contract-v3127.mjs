import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {websiteReleaseReadiness} from "../src/core/websiteReleaseReadiness.mjs";
import {websiteStagingReadiness} from "../src/core/websiteStagingReadiness.mjs";
import {selectRecordedWebsiteDeployment} from "../src/core/websiteDeploymentSelection.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const source=read("staging/ci-postgres-bootstrap-v3127.sql");
const canary=read("staging/ISOLATED_ONLY_canary_setup.sql");
const runner=read("staging/check-postgres-rls-v3127.sh");
const workflow=read(".github/workflows/staging-postgres-v3127.yml");
let count=0;
const ok=(v,msg)=>{assert.ok(v,msg);count++};
const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);count++};
ok(source.includes("\\ir ISOLATED_ONLY_canary_setup.sql"),
 "Real SQL test loads the exact existing staging read-only policy file");
ok(canary.includes("alter table public.busy_staging_rls_canary enable row level security"),
 "Existing canary policy enables RLS");
ok(canary.includes("grant select on public.busy_staging_rls_canary to authenticated"),
 "Existing canary permits authenticated reads only");
ok(source.includes("alter table public.busy_ci_owner_write force row level security"),
 "Disposable owner-write table is forced through RLS");
ok(source.includes("for update to authenticated using ((select auth.uid()) = owner_id)"),
 "Update policy requires current ownership");
ok(source.includes("with check ((select auth.uid()) = owner_id)"),
 "Write policy blocks owner reassignment");
ok(source.includes("for delete to authenticated using ((select auth.uid()) = owner_id)"),
 "Delete policy scopes to owner");
ok(runner.includes('BUSY_EPHEMERAL_RLS_CI:-'),
 "Environment guard is required before running any SQL");
ok(runner.includes('PGHOST:-')&&runner.includes('"127.0.0.1"'),
 "Database test runner refuses other hosts");
ok(runner.includes('PGDATABASE:-')&&runner.includes('"busy_staging_ci"'),
 "Database test runner refuses other database names");
ok(runner.includes('expected query result')&&runner.includes('dangerous operation succeeded'),
 "Positive and negative checks actually fail CI");
ok(runner.includes("cannot reassign ownership")&&runner.includes("cannot update A"),
 "Cross-tenant mutation and reassignment cases run");
ok(workflow.includes("postgres:17")&&workflow.includes("busy_staging_ci"),
 "Workflow starts a disposable PostgreSQL 17 test service");
ok(workflow.includes("bash staging/check-postgres-rls-v3127.sh"),
 "Workflow runs the actual SQL test");
ok(!workflow.includes("SUPABASE_ACCESS_TOKEN")&&!workflow.includes("SUPABASE_SERVICE_ROLE_KEY"),
 "No live cloud credentials are consumed in this job");
ok(workflow.includes("permissions:")&&workflow.includes("contents: read"),
 "GitHub workflow limits repository permissions");
ok(!workflow.includes("pull_request_target"),
 "No privileged untrusted PR trigger");
ok(read(".github/workflows/production-check.yml")
 .includes("check-staging-database-contract-v3127.mjs"),
 "Standard source regression includes this SQL guard contract");
eq(websiteReleaseReadiness().status,"blocked",
 "Source and disposable SQL tests do not unblock public release");
eq(websiteStagingReadiness().status,"blocked",
 "No real Supabase staging project has been independently verified");
eq(selectRecordedWebsiteDeployment({
 deployments:[{id:"older",state:"preview_ready"},{id:"current",state:"preview_ready"}],
 website:{current_preview_deployment_id:"current"},kind:"preview"}).id,
 "current","Canonical preview selection remains correct");
console.log("V3.127 PASS: "+count+" guard, source, RLS, test workflow and release classification checks.");
