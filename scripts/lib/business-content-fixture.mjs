// Deterministic DB boundary for executing the real trusted record adapter.
function businessContentFixture(){
 const rows=[],profiles=[],calls=[],tables={busy_websites:[],busy_website_deployments:[]};let race=false;
 const db={rows,profiles,calls,tables,setRace:v=>race=v,from(table){
  const filters=[];let operation='read',payload=null,columns='*',max=Infinity;
  const run=async(single=false)=>{
   calls.push({table,operation,filters:[...filters]});
   const source=table==='busy_public_business_profiles'?profiles:table==='busy_business_content'?rows:tables[table];if(!source)throw Error('Unsupported fixture table '+table);
   let found=source.filter(r=>filters.every(([k,v])=>r[k]===v));
   if(operation!=='read'&&Object.hasOwn(payload,'can_undo'))throw Error('Cannot write a generated column');
   if(operation==='insert'){
    if(rows.some(r=>r.business_id===payload.business_id&&r.id===payload.id))return {error:{code:'23505'},data:null};rows.push(structuredClone(payload));found=[rows.at(-1)];
   }else if(operation==='update'){
    if(race)found=[];for(const row of found)Object.assign(row,structuredClone(payload));
   }
   const selected=found.slice(0,max).map(original=>{const r={...original,can_undo:Array.isArray(original.history)&&original.history.length>0};return columns==='*'?structuredClone(r):Object.fromEntries(columns.split(',').map(k=>[k,structuredClone(r[k])]));});
   return {data:single?selected[0]||null:selected,error:null};
  };
  const q={select:v=>{columns=v;return q;},eq:(k,v)=>{filters.push([k,v]);return q;},order:()=>q,limit:n=>{max=n;return q;},insert:v=>{operation='insert';payload=v;return q;},update:v=>{operation='update';payload=v;return q;},maybeSingle:()=>run(true),single:()=>run(true),then:(a,b)=>run().then(a,b)};return q;
 }};return db;
}
export {businessContentFixture};
