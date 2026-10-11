/**
 * Produce a minimal safe diagnostic for an existing, failed EAS build.
 * Input: EAS CLI build:view --json saved to a temporary runner file.
 * Do not dump build metadata or signed URLs to GitHub logs.
 */
import {readFileSync} from "node:fs";
const file=process.argv[2];
if(!file)throw Error("Pass local EAS build:view --json path.");
const build=JSON.parse(readFileSync(file,"utf8"));
const red=(s)=>String(s)
 .replace(/(https?:\/\/)[^\s"']+/g,"$1[redacted]")
 .replace(/sb_(?:secret|publishable)_[\w-]+/g,"[redacted]")
 .replace(/(?:eyJ[\w-]+\.){2}[\w-]+/g,"[redacted]")
 .slice(0,850);
const status={id:build.id,status:build.status,platform:build.platform,
 distribution:build.distribution,buildProfile:build.buildProfile,
 error:build.error?red(JSON.stringify(build.error)):"not in build:view data",
 metadataKeys:Object.keys(build)};
console.log("EAS build:view metadata:",JSON.stringify(status));
const discovered=[];
function walk(x,path,depth=0){
 if(depth>9||x===null)return;
 if(Array.isArray(x)){for(let i=0;i<x.length;i++)walk(x[i],path+"["+i+"]",depth+1);return;}
 if(typeof x!=="object")return;
 for(const [key,val] of Object.entries(x)){
  const p=path+"."+key;
  if(typeof val==="string"&&/^https:\/\//.test(val)&&/log|file|url/i.test(key+" "+p)){
   // Do not log the URL itself; it might have a signed query.
   discovered.push({path:p,url:val});
  }
  else if(typeof val==="object")walk(val,p,depth+1);
 }
}
walk(build,"build");
console.log("EAS metadata URL field paths:",discovered.map(d=>d.path).slice(0,20).join(", ")||"none");
for(const item of discovered.slice(0,15)){
 let url;
 try{url=new URL(item.url);}catch{continue;}
 // EAS build logs are usually signed S3/CDN URLs. Only retrieve HTTPS.
 if(url.protocol!=="https:"||/(expo\.dev|amazonaws\.com|cloudfront\.net|expo\.io|googleapis\.com|s3\.)$/i.test(url.hostname)===false)continue;
 try{
  const r=await fetch(url.href,{signal:AbortSignal.timeout(15000),redirect:"follow"});
  if(!r.ok){console.log(item.path+": log download HTTP "+r.status);continue;}
  const t=(await r.text()).slice(-250000);
  const lines=t.split(/\r?\n/);
  const hits=lines.filter(s=>/(error|failed|exception|not found|cannot|missing|unsupported|invalid|ENOENT|EACCES|ELIFECYCLE|npm ERR|❌)/i.test(s));
  console.log(item.path+" relevant lines ("+hits.length+"): "+hits.slice(-12).map(red).join("\n").slice(0,5000));
 }catch(e){console.log(item.path+" log probe unavailable: "+red(e.message));}
}
