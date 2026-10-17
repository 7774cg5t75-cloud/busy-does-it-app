/**
 * V3.191 standalone native public interactions. Uses ONLY an already validated
 * server-approved public projection. Never sends a booking, opens URLs or reads
 * the owner's private draft. Consumers call Linking.openURL after a user tap.
 */
function nativeContactAction(contact,key){
 if(!contact||typeof contact!=="object"||!["phone","email"].includes(key))
  return {ok:false,reason:"Choose a supported public contact method."};
 const value=contact[key];
 if(typeof value!=="string"||value.length>254||/[<>\u0000-\u001f\u007f]/.test(value))
  return {ok:false,reason:"This contact detail needs business review."};
 const raw=value.trim();
 if(key==="phone"){
  if(!/^\+?[0-9() .-]{5,45}$/.test(raw))return {ok:false,reason:"No safe phone number is available."};
  const digits=raw.replace(/[^0-9]/g,"");
  if(digits.length<5||digits.length>18)return {ok:false,reason:"No safe phone number is available."};
  return {ok:true,label:"Call the business",url:"tel:"+(raw.startsWith("+")?"+":"")+digits};
 }
 if(!/^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,180}\.[A-Za-z]{2,24}$/.test(raw))
  return {ok:false,reason:"No safe email address is available."};
 return {ok:true,label:"Email the business",url:"mailto:"+raw};
}
function searchPublicNativeServices(services,query=""){
 if(!Array.isArray(services)||services.length>40||
    typeof query!=="string"||query.length>80)return [];
 const q=query.trim().toLocaleLowerCase("en");
 return services.filter(item=>item&&typeof item.name==="string"&&
   (!q||(item.name+" "+(typeof item.description==="string"?item.description:"")+" "+(typeof item.category==='string'?item.category:''))
     .toLocaleLowerCase("en").includes(q)));
}
const clean=(v,max)=>typeof v==="string"?v.trim().slice(0,max):"";
function validateNativeGuestRequest(type,payload){
 if(!["enquiry","booking_request"].includes(type))
  return {ok:false,reason:"Choose an enquiry or booking request."};
 const limits={name:160,email:240,phone:80,service:240,preferredDate:240,message:5000,note:3000};
 for(const [key,max]of Object.entries(limits)){
  if(type==='booking_request'&&key==='message'||type==='enquiry'&&['preferredDate','note'].includes(key))continue;
  const value=payload?.[key];
  if(value!==undefined&&(typeof value!=='string'||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)))
   return {ok:false,reason:'Review the '+key+' field before sending. Details must fit the supported limit.'};
 }
 const p={
  name:clean(payload?.name,160),email:clean(payload?.email,240),
  phone:clean(payload?.phone,80),service:clean(payload?.service,240),
  preferredDate:clean(payload?.preferredDate,240),message:clean(payload?.message,5000),
  note:clean(payload?.note,3000)
 };
 if(!p.name||(!p.email&&!p.phone))return {ok:false,reason:"Enter your name and email or phone."};
 if(p.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))
  return {ok:false,reason:"Enter a valid email address."};
 if(p.phone&&p.phone.replace(/\D/g,"").length<7)
  return {ok:false,reason:"Enter a phone number with at least seven digits."};
 if(type==="booking_request"&&!p.service)return {ok:false,reason:"Enter the service you want to request."};
 if(type==="enquiry"&&!p.message)return {ok:false,reason:"Write your enquiry before sending."};
 return {ok:true,payload:p};
}
export {nativeContactAction,searchPublicNativeServices,validateNativeGuestRequest};

// One bounded browse policy for menu sections, service types or other owner
// categories. No template-specific business or transaction assumptions.
function browsePublicNativeServices(services,query='',category=''){
 if(!Array.isArray(services)||services.length>50||typeof category!=='string'||category.length>80)return {rows:[],categories:[],selectedCategory:''};
 const all=[...searchPublicNativeServices(services.slice(0,40)),...searchPublicNativeServices(services.slice(40))];
 const categories=[...new Set(all.map(row=>row.category).filter(value=>typeof value==='string'&&value.trim()&&value.length<=80))];
 const found=[...searchPublicNativeServices(services.slice(0,40),query),...searchPublicNativeServices(services.slice(40),query)];
 const selectedCategory=categories.includes(category)?category:'';
 return {rows:found.filter(row=>!selectedCategory||row.category===selectedCategory),categories,selectedCategory};
}
export {browsePublicNativeServices};
