/**
 * Offline validation of a generated isolated-staging installation package.
 * Reads only local files: NO database connection, SQL, provider access, or
 * deployment. Compare source files, numbered copies and SHA-256 manifest.
 * Green result does NOT authorise installation or establish SQL safety.
 */
import {readFileSync,readdirSync,lstatSync} from "node:fs";
import {join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";

const ROOT=fileURLToPath(new URL("../",import.meta.url));
const TARGET="pnjdlogwegnqbsfpcofw";
const hash=s=>createHash("sha256").update(s).digest("hex");
function verifyStagingPackage(directory="/tmp/bdi-isolated-staging-v3180"){
 const folder=resolve(directory);
 const problems=[];
 const safeFile=(path)=>{
  const f=join(ROOT,path);
  if(!/^(staging\/ISOLATED_ONLY_business_core_v3180\.sql|supabase\/migrations\/20\d{12}_[a-z0-9_]+\.sql)$/.test(path))
   throw Error("Unexpected SQL source path in staging package");
  if(lstatSync(f).isSymbolicLink())throw Error("Source SQL must not be a symlink");
  return readFileSync(f);
 };
 try{
  const mf=join(folder,"manifest.json"), review=join(folder,"review-signals.json");
  if(lstatSync(mf).isSymbolicLink()||lstatSync(review).isSymbolicLink())
   throw Error("Package metadata may not be symlinks");
  const manifest=JSON.parse(readFileSync(mf,"utf8"));
  const signals=JSON.parse(readFileSync(review,"utf8"));
  if(manifest.projectRef!==TARGET||manifest.productionProjectExcluded!==true||
     manifest.installMustBeManuallyApproved!==true||
     manifest.automaticSqlExecution!==false||manifest.edgeDeploymentsIncluded!==false)
   problems.push("Target or approval boundary mismatch");
  if(!Array.isArray(manifest.files)||manifest.files.length<60||
     manifest.migrationCount!==manifest.files.length-1)
   problems.push("Migration count mismatch");
  if(signals.ok!==true||signals.migrationCount!==manifest.migrationCount)
   problems.push("Migration risk review incomplete");
  const seen=new Set();
  const expected=[];
  for(let i=0;i<(manifest.files||[]).length;i++){
   const entry=manifest.files[i],number=String(i+1).padStart(3,"0");
   if(!entry||entry.order!==i+1||typeof entry.path!=="string"||
      seen.has(entry.path)){problems.push("Duplicate or out-of-order SQL");continue;}
   seen.add(entry.path);
   try{
    const src=safeFile(entry.path);
    const staged=join(folder,"sql",number+"_"+entry.path.split("/").at(-1));
    if(lstatSync(staged).isSymbolicLink())throw Error("Staged SQL symlink forbidden");
    const copy=readFileSync(staged);
    if(src.length!==entry.bytes||copy.length!==entry.bytes||
       hash(src)!==entry.sha256||hash(copy)!==entry.sha256)
     problems.push("SQL content checksum mismatch for "+number);
    expected.push(number+"_"+entry.path.split("/").at(-1));
   }catch(e){problems.push("File "+number+" invalid or missing");}
  }
  if(manifest.files?.[0]?.path!=="staging/ISOLATED_ONLY_business_core_v3180.sql")
   problems.push("Isolated business baseline must be first");
  const actual=readdirSync(join(folder,"sql")).sort();
  if(JSON.stringify(actual)!==JSON.stringify(expected.sort()))
   problems.push("Staged SQL file set differs from manifest");
  const sources=readdirSync(join(ROOT,"supabase/migrations"))
    .filter(n=>n.endsWith(".sql")).sort();
  const packaged=(manifest.files||[]).slice(1).map(x=>x.path?.split("/").at(-1));
  if(JSON.stringify(sources)!==JSON.stringify(packaged))
   problems.push("Current repository migration sequence differs from package");
  return {ok:problems.length===0,kind:"offline_staging_manifest_integrity_v3186",
   packageFiles:manifest.files?.length||0,
   migrationCount:manifest.migrationCount||0,problems,
   expectedIsolatedProject:TARGET,
   canProceedToHumanReview:problems.length===0,
   authorisedForInstall:false,installed:false,hostedProjectChecked:false,
   realJWTTenantIsolationTested:false,allSqlSafe:false};
 }catch(e){
  return {ok:false,kind:"offline_staging_manifest_integrity_v3186",
   problems:[String(e?.message||"Package incomplete").slice(0,140)],
   authorisedForInstall:false,installed:false,hostedProjectChecked:false};
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=verifyStagingPackage(process.argv[2]);
 console.log(JSON.stringify(result,null,2));
 if(!result.ok)process.exitCode=1;
}
export {verifyStagingPackage};
