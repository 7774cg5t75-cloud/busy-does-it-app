import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let n=0;
const ok=(x,m)=>{assert.ok(x,m);n++};
const script=read("scripts/prepare-staging-gates-v3227.mjs");
const sql=read("supabase/migrations/20261014170000_v3_227_guest_alert_dispatch_leases.sql");
for(const x of ["sourceInventory","sha256","ownerApprovalRecorded:false",
 "canExecute:false","actualStagingMigrationApplied:false",
 "dispatcherEnabled:false","customerRowsRead:false","66 migration SHA gates",
 "realTenantJwtTested:false","backupRestoreVerified:false",
 "staging/recorded-readonly-observation-v3220.json"])ok(script.includes(x),x);
for(const x of ["busy_guest_alert_claim_one_v3227","busy_guest_alert_complete_v3227",
 "busy_guest_alert_quarantine_expired_v3227"])ok(sql.includes(x),x);
ok(!/tools\.mcp__Supabase__/.test(script));
ok(!/\bexecSync\b|\bspawnSync\b|\bfetch\(/.test(script));
console.log("V3.227 staging approval packet/source gate: "+n+
 " checks passed; no hosted state changed.");
