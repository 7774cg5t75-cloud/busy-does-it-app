// Bound clause splitting without treating quoted owner copy as commands.
// No code evaluation, language model, action execution or permission grant.
function splitBuilderInstructionClauses(text,{website=false,max=8}={}){
 if(typeof text!=='string'||!text.trim()||text.length>400)return null;
 const value=text.trim(),parts=[];let start=0,quote='';
 for(let i=0;i<value.length;i++){
  const ch=value[i],previous=value[i-1]||'',next=value[i+1]||'';
  if(quote){
   if(ch===quote&&!((ch==="'"||ch==='’')&&/[a-z0-9]/i.test(previous)&&/[a-z0-9]/i.test(next)))quote='';
   continue;
  }
  if(ch==='"'||ch==='“'||ch==='‘'||ch==="'"&&(!previous||/[\s:(]/.test(previous))){quote=ch==='“'?'”':ch==='‘'?'’':ch;continue;}
  const separator=(website?/^(?:\s*;\s*|\s+and then\s+|,\s*then\s+|\s+and\s+(?=(?:make|set|centre|center|align|give|move|put|focus|crop|show|fill)\b))/i:/^(?:\s*,\s*|\s*;\s*|\s+and(?: then)?\s+)/i).exec(value.slice(i));
  if(separator){parts.push(value.slice(start,i).trim());i+=separator[0].length-1;start=i+1;}
 }
 if(quote)return null;parts.push(value.slice(start).trim());
 return parts.length<=max&&parts.every(Boolean)?parts:null;
}
export {splitBuilderInstructionClauses};
