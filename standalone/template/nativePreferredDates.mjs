/**
 * V3.192: local preferred-date shortcuts for REQUESTS, not available
 * appointment slots. Only date labels are generated; never read a provider,
 * claim calendar availability, book an appointment or infer opening hours.
 */
const dayNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const monthNames=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function nativePreferredDates(now=new Date(),count=7){
 if(!(now instanceof Date)||!Number.isFinite(now.getTime())||
    !Number.isInteger(count)||count<1||count>14)return [];
 const result=[];
 for(let i=1;i<=count;i++){
  // Local noon keeps display dates stable across daylight-saving transitions.
  const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i,12);
  const value=[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),
   String(d.getDate()).padStart(2,"0")].join("-");
  result.push({value,label:dayNames[d.getDay()]+" "+d.getDate()+" "+monthNames[d.getMonth()]});
 }
 return result;
}
export {nativePreferredDates};
