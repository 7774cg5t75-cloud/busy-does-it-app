import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
// Finite original read-contract closure, not a production migration runner.
// Dollar/string/comment aware boundaries prevent accidentally extracting cron,
// workers or neighbouring privileged functions from a historical migration.
export function sqlStatements(text){
 const out=[];let start=0,quote=null,line=false,block=false;
 for(let i=0;i<text.length;i++){
  if(line){if(text[i]==='\n')line=false;continue;}
  if(block){if(text.slice(i,i+2)==='*/'){block=false;i++;}continue;}
  if(quote){if(quote==="'"){if(text[i]==="'"&&text[i+1]==="'"){i++;continue;}if(text[i]==="'")quote=null;}else if(text.startsWith(quote,i)){i+=quote.length-1;quote=null;}continue;}
  if(text.slice(i,i+2)==='--'){line=true;i++;continue;}if(text.slice(i,i+2)==='/*'){block=true;i++;continue;}
  if(text[i]==="'"){quote="'";continue;}const dollar=/^\$(?:[a-zA-Z_][a-zA-Z_0-9]*)?\$/.exec(text.slice(i));if(dollar){quote=dollar[0];i+=quote.length-1;continue;}
  if(text[i]===';'){out.push(text.slice(start,i+1));start=i+1;}
 }
 if(quote||block)throw Error('Unclosed SQL source');return out;
}
const clean=s=>s.replace(/--[^\n]*/g,'').replace(/\/\*[\s\S]*?\*\//g,'').trim();
export function ownerStatusSchema(root){
 const files=readdirSync(root+'/supabase/migrations').filter(n=>n.endsWith('.sql')).sort().concat(['../schema/v3_25_production_bridge.sql','../schema/business_content_records.sql']),all=files.flatMap(file=>sqlStatements(readFileSync(root+'/supabase/migrations/'+file,'utf8')).map(sql=>({file,sql,text:clean(sql)})));
 const names=new Set(['busy_mini_apps','busy_mini_app_module_catalog','busy_public_business_profiles','busy_mini_app_versions','busy_mini_app_requests','busy_mini_app_request_links','busy_mini_app_entry_events','busy_mini_app_entry_daily','busy_mini_app_work_bookings','busy_mini_app_request_messages','busy_mini_app_message_delivery_outbox','busy_push_deliveries','busy_business_content']);
 const base=new Set(['busy_businesses','busy_business_memberships']);let tables=[];
 const add=name=>{if(base.has(name)||tables.some(x=>x.name===name))return;const found=all.find(x=>new RegExp('^create table(?: if not exists)? public\\.'+name+'\\s*\\(','i').test(x.text));if(!found)throw Error('Original table DDL missing: '+name);tables.push({...found,name});for(const match of found.text.matchAll(/references\s+public\.([a-z_0-9]+)/gi))add(match[1]);};
 for(const name of names)add(name);
 // Topological table order: public references are created first; deferred
 // ALTER constraints remain outside this read-only foundation.
 const sorted=[],seen=new Set(),visiting=new Set();const visit=row=>{if(seen.has(row.name))return;if(visiting.has(row.name))throw Error('Deferred FK requires explicit review: '+row.name);visiting.add(row.name);for(const m of row.text.matchAll(/references\s+public\.([a-z_0-9]+)/gi)){const other=tables.find(t=>t.name===m[1]);if(other)visit(other);}visiting.delete(row.name);seen.add(row.name);sorted.push(row);};tables.forEach(visit);
 const alterations=all.filter(x=>/^alter table public\.([a-z_0-9]+)\s+(?:add column|alter column consumer_user_id drop not null)/i.test(x.text)&&seen.has(/^alter table public\.([a-z_0-9]+)/i.exec(x.text)[1]));
 const summary=all.filter(x=>/^create (?:or replace )?function public\.busy_mini_app_entry_summary\s*\(/i.test(x.text)).at(-1);if(!summary)throw Error('Original entry summary missing');
 const seeds=all.filter(x=>/^insert into public\.busy_mini_app_module_catalog\b/i.test(x.text));
 const selected=[...sorted,...alterations,...seeds,summary];
 if(selected.some(x=>/\bcron\.|\bnet\.http|\bpgmq\.|\bvault\./i.test(x.text)))throw Error('External service statement refused');
 const grants=sorted.map(t=>`ALTER TABLE public.${t.name} ENABLE ROW LEVEL SECURITY;\nREVOKE ALL ON public.${t.name} FROM PUBLIC,anon,authenticated;\nGRANT SELECT,INSERT,UPDATE,DELETE ON public.${t.name} TO service_role;`).join('\n');
 const sql="-- REVIEW ONLY: original owner_status dependency closure; designated staging only.\nBEGIN;\nDO $$ BEGIN RAISE EXCEPTION 'OWNER STATUS REVIEW FUSE: separate staging installation approval required'; END $$;\n"+selected.map(x=>'-- Original '+x.file+'\n'+(x===summary?x.sql.replace(/set search_path = public/i,'set search_path=pg_catalog,pg_temp'):x.sql)).join('\n')+'\n'+grants+"\nREVOKE ALL ON FUNCTION public.busy_mini_app_entry_summary(uuid,uuid,timestamptz) FROM PUBLIC,anon,authenticated;\nGRANT EXECUTE ON FUNCTION public.busy_mini_app_entry_summary(uuid,uuid,timestamptz) TO service_role;\nCOMMIT;\n";
 return {sql,tables:sorted.map(t=>t.name),statements:selected.map(x=>({file:x.file,sha256:createHash('sha256').update(x.sql).digest('hex')}))};
}
