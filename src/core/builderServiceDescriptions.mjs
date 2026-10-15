const name=x=>typeof x==='string'?x.trim().normalize('NFKC').toLocaleLowerCase('en'):'';
// Only fill genuinely empty descriptions of uniquely matched existing names.
// IDs, names, non-empty descriptions and every other owner field stay exact.
function fillMissingBuilderDescriptions(existing,incoming,{targetName='name',targetBody='description',sourceName='name',sourceBody='description'}={}){
 if(!Array.isArray(existing)||!Array.isArray(incoming)||existing.length>30||incoming.length>30)return {ok:false,reason:'Review the bounded service lists first.'};
 const unique=rows=>{const names=rows.map(x=>name(x));return names.every(Boolean)&&new Set(names).size===names.length;};
 if(!unique(existing.map(x=>x?.[targetName]))||!unique(incoming.map(x=>x?.[sourceName])))return {ok:false,reason:'Service names are ambiguous. Review duplicates before copying descriptions.'};
 const sources=new Map(incoming.map(x=>[name(x[sourceName]),x[sourceBody]])),filled=[];
 const next=existing.map(row=>{
  const previous=row[targetBody],value=sources.get(name(row[targetName]));
  if(previous!==undefined&&previous!==null&&typeof previous!=='string')return row;
  if(typeof previous==='string'&&previous.trim()||typeof value!=='string'||!value.trim()||value.length>600||/[<>\u0000-\u001f\u007f]/.test(value))return row;
  filled.push({name:row[targetName],description:value.trim()});return {...row,[targetBody]:value.trim()};
 });
 return {ok:true,next,filled};
}
export {fillMissingBuilderDescriptions};
