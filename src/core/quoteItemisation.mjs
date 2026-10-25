// Finite positive-decimal quote arithmetic only. No VAT-rate inference or price mutation.
const scaled=(text,places)=>{if(typeof text!=='string'||!new RegExp('^\\d{1,9}(?:\\.\\d{1,'+places+'})?$').test(text))return null;const[a,b='']=text.split('.');return BigInt(a)*10n**BigInt(places)+BigInt(b.padEnd(places,'0'));};
const money=cents=>(cents/100n).toString()+'.'+(cents%100n).toString().padStart(2,'0');
export function quoteItemTotal(row){const q=scaled(row?.quantity,3),p=scaled(row?.unitPrice,2),v=scaled(row?.vatAmount,2);return q===null||q<=0n||p===null||v===null?null:money((q*p+500n)/1000n+v);}
export function amendQuoteItem(rows,index,key,value){if(!Array.isArray(rows)||rows.length>100||!Number.isSafeInteger(index)||index<0||index>=rows.length||!['description','quantity','unitPrice','vatAmount'].includes(key)||typeof value!=='string')return null;return rows.map((r,i)=>{if(i!==index)return r;const n={...r,[key]:value};return {...n,lineTotal:quoteItemTotal(n)||''};});}
export function inspectQuoteItemisation(rows,total){if(!Array.isArray(rows)||rows.length>100)return {ok:false};let sum=0n;for(const r of rows){const amount=quoteItemTotal(r);if(!amount||typeof r.description!=='string'||!r.description.trim()||r.description.length>2000||r.lineTotal!==amount)return {ok:false};const cents=scaled(amount,2);if(cents===null)return {ok:false};sum+=cents;}const expected=scaled(total,2);return {ok:expected!==null&&expected===sum,total:money(sum),matchesQuote:expected!==null&&expected===sum,vatTreatmentVerified:false};}

// Diagnostic preparation only; the existing finite server review remains authoritative.
export function quoteItemisationReview(rows,total){
 const check=inspectQuoteItemisation(rows,total);
 if(!Array.isArray(rows)||rows.length>100)return {...check,message:'Use at most 100 quotation items.'};
 if(!rows.length)return {...check,message:'No itemisation prepared. The existing quote total is unchanged.'};
 for(let i=0;i<rows.length;i++){
  const r=rows[i],prefix='Item '+(i+1)+': ';
  if(typeof r?.description!=='string'||!r.description.trim()||r.description.length>2000)return {...check,message:prefix+'enter a description up to 2,000 characters.'};
  if(scaled(r.quantity,3)===null||scaled(r.quantity,3)<=0n)return {...check,message:prefix+'enter a positive quantity with up to three decimal places.'};
  if(scaled(r.unitPrice,2)===null)return {...check,message:prefix+'enter a unit price with up to two decimal places.'};
  if(scaled(r.vatAmount,2)===null)return {...check,message:prefix+'enter the VAT amount you determined, including zero where appropriate.'};
  if(!quoteItemTotal(r)||scaled(quoteItemTotal(r),2)===null||r.lineTotal!==quoteItemTotal(r))return {...check,message:prefix+'review the calculated line total; the supported amount limit was exceeded or the total changed.'};
 }
 if(!check.ok)return {...check,message:'Prepared items total £'+check.total+'. Existing quote total £'+total+'. Review the items or deliberately edit the original quote; no price was changed.'};
 return {...check,message:'Prepared items total £'+check.total+' and match the existing quote. VAT treatment still requires your review.'};
}
