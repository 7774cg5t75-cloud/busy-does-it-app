/**
 * READ-ONLY local repository inventory. Never connects to or modifies Supabase.
 * Usage: node scripts/prepare-staging-install-v3179.mjs
 */
import {readdirSync,readFileSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {analyseStagingMigrations} from "../src/core/stagingMigrationPlan.mjs";
if(process.argv.length!==2)throw Error("This command accepts no flags: no --apply or --deploy.");
const dir=fileURLToPath(new URL("../supabase/migrations/",import.meta.url));
const migrations=readdirSync(dir).filter(n=>n.endsWith(".sql"))
 .map(name=>({name,sql:readFileSync(join(dir,name),"utf8")}));
const report=analyseStagingMigrations(migrations);
if(!report.ok)throw Error(report.reason);
console.log(JSON.stringify({
 kind:report.kind,migrationCount:report.migrationCount,
 missingBaseline:report.missingBaseline,
 orderingIssues:report.orderingIssues,
 prerequisiteCount:report.violations.length,
 firstMigration:report.firstMigration,lastMigration:report.lastMigration,
 status:"BLOCKED_UNTIL_REVIEWED",
 noDatabaseConnection:true,noMigrationsApplied:true,noEdgeFunctionsDeployed:true,
 next:"Review initial application schema, migration ordering, privileges and a separately approved isolated-staging installation."
},null,2));
