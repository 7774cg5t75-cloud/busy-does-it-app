/**
 * V3.188 offline operator preflight. Uses a previously observed staging
 * snapshot as *dated context*, not live proof or grant to deploy.
 * It cannot access database credentials or execute SQL.
 */
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {verifyStagingPackage} from "./verify-staging-install-v3186.mjs";
import {assessIsolatedStagingSnapshot} from "../src/core/isolatedStagingPreflightV3188.mjs";
const folder="/tmp/bdi-isolated-staging-v3180";
const manifest=verifyStagingPackage(folder);
if(!manifest.ok)throw Error("Offline staging package verification failed. No deployment attempted.");
const review=JSON.parse(readFileSync(folder+"/review-signals.json","utf8"));
const observedAsOf="2026-10-12";
const status=assessIsolatedStagingSnapshot({
 projectRef:"pnjdlogwegnqbsfpcofw",health:"ACTIVE_HEALTHY",
 publicTables:["public.busy_staging_rls_canary"],
 migrationVersions:["20261010224121","20261010224205"],
 edgeFunctionNames:[],
 extensions:{pgcrypto:true,pgmq:false,pg_cron:false,pg_net:false},
 manifestIntegrity:manifest.ok,sqlRiskReview:review
});
console.log(JSON.stringify({
 ...status,observationDate:observedAsOf,
 observationSource:"previous independent read-only Supabase inspection",
 mustRefreshHostedObservationsBeforeAnyInstall:true,
 freshIndependentReadPerformedByThisScript:false
},null,2));
if(!status.ok)process.exitCode=1;
