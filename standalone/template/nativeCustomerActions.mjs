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
   (!q||(item.name+" "+(typeof item.description==="string"?item.description:""))
     .toLocaleLowerCase("en").includes(q)));
}
export {nativeContactAction,searchPublicNativeServices};
