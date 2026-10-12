/**
 * Offline architecture census for V3.195. Evidence, not a quality score.
 * Scans repository source only; no services, deployment, network or writes.
 * Respects the project's physical LOC exclusions; reports hotspots, local
 * static import topology and cycles. Dynamic imports/TS resolution are not
 * a complete runtime dependency graph.
 */
import {readdirSync,readFileSync,statSync,existsSync} from "node:fs";
import {resolve,relative,dirname,extname} from "node:path";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("../",import.meta.url));
const good=/\.(?:js|jsx|mjs|cjs|ts|tsx|sql|py|sh|html|css)$/;
const sourceDirs=["src","supabase","cloudflare","scripts","standalone","sites","staging","plugins"];
const excluded=new Set([".git","node_modules",".expo",".tmp","dist","build",".next","coverage"]);
const files=[];
function walk(dir){
 if(!existsSync(dir))return;
 for(const entry of readdirSync(dir,{withFileTypes:true})){
  if(excluded.has(entry.name))continue;
  const file=resolve(dir,entry.name);
  if(entry.isDirectory())walk(file);
  else if(entry.isFile()&&good.test(entry.name)){
   const content=readFileSync(file,"utf8");
   files.push({path:relative(root,file).replaceAll("\\","/"),
    bytes:statSync(file).size,
    lines:content.length?content.split("\n").length-(content.endsWith("\n")?1:0):0,
    content});
  }
 }
}
for(const dir of sourceDirs)walk(resolve(root,dir));
for(const entry of readdirSync(root,{withFileTypes:true}))
 if(entry.isFile()&&good.test(entry.name)){
  const path=resolve(root,entry.name),content=readFileSync(path,"utf8");
  files.push({path:entry.name,bytes:statSync(path).size,
   lines:content.length?content.split("\n").length-(content.endsWith("\n")?1:0):0,content});
 }
const names=new Set(files.map(x=>x.path));
const map=new Map(files.map(x=>[x.path,x]));
const graph=new Map(),incoming=new Map();
for(const file of files){
 const imports=[];
 const pat=/\b(?:import\s+(?:[^'"]*?\s+from\s+)?|export\s+(?:[^'"]*?\s+from\s+))["'](\.[^"']+)["']/g;
 for(const match of file.content.matchAll(pat)){
  let path=relative(root,resolve(root,dirname(file.path),match[1])).replaceAll("\\","/");
  if(!names.has(path)){
   const candidate=[".js",".jsx",".mjs",".ts",".tsx","/index.js","/index.ts"].find(ext=>names.has(path+ext));
   if(candidate)path+=candidate;
   else continue;
  }
  imports.push(path);
  incoming.set(path,(incoming.get(path)||0)+1);
 }
 graph.set(file.path,[...new Set(imports)]);
}
const state=new Map(),active=[],cycles=new Set();
function visit(path){
 const s=state.get(path)||0;if(s===2)return;
 if(s===1){const i=active.indexOf(path);if(i>=0)cycles.add(active.slice(i).join(" -> ")+" -> "+path);return;}
 state.set(path,1);active.push(path);
 for(const next of graph.get(path)||[])if(graph.has(next))visit(next);
 active.pop();state.set(path,2);
}
for(const file of files)if(!state.get(file.path))visit(file.path);
const largest=files.slice().sort((a,b)=>b.lines-a.lines).slice(0,20)
 .map(x=>({file:x.path,lines:x.lines,bytes:x.bytes,incoming:incoming.get(x.path)||0,
  outbound:(graph.get(x.path)||[]).length}));
const highestFanOut=files.slice().sort((a,b)=>
 (graph.get(b.path)||[]).length-(graph.get(a.path)||[]).length).slice(0,10)
 .map(x=>({file:x.path,imports:(graph.get(x.path)||[]).length,lines:x.lines}));
const stats={version:"v3.195",type:"offline-source-architecture-audit",
 sourceFiles:files.length,physicalLines:files.reduce((a,x)=>a+x.lines,0),
 staticRelativeEdges:[...graph.values()].reduce((a,x)=>a+x.length,0),
 distinctStaticCycles:cycles.size,cycleExamples:[...cycles].slice(0,15),
 largest,highestFanOut,limitations:[
 "Static relative imports only; dynamic/aliased imports and runtime flows not included.",
 "Physical code lines include comments and blanks but exclude ignored docs, assets and dependencies.",
 "No claims about live data, auth, provider permissions, signed builds, device UX or real customer completion."
 ]};
const l=map.get("src/app/AppController.js");
if(!l||!map.has("src/core/businessBrandDnaV3195.mjs")||
 !map.has("src/core/ownerBuilderDraftGuardV3195.mjs"))
 throw Error("Major app controller or brand/guard module missing");
if(readFileSync(resolve(root,"src/core/appAppearanceEditing.mjs"),"utf8")!==
 readFileSync(resolve(root,"supabase/functions/busy-mini-apps/appAppearanceEditing.mjs"),"utf8"))
 throw Error("Owner App and trusted Edge appearance validation diverged.");
console.log(JSON.stringify(stats,null,2));
