import {validatePrivateAppServices} from './appServiceCollection.mjs';
const PROFILE_TEXT_LIMITS=Object.freeze({tagline:180,about:1200,description:1000});
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
function captureField(object,field){
 if(object!==undefined&&object!==null&&(typeof object!=='object'||Array.isArray(object)))return null;
 return {parent:object===undefined?'absent':object===null?'null':'object',present:!!object&&own(object,field),
  ...object&&own(object,field)?{value:clone(object[field])}:{}};
}
function validField(snapshot,field){
 if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot)||
  Object.keys(snapshot).some(k=>!['parent','present','value'].includes(k))||
  !['object','null','absent'].includes(snapshot.parent)||typeof snapshot.present!=='boolean'||
  snapshot.present&&snapshot.parent!=='object'||snapshot.present!==own(snapshot,'value'))return false;
 if(!snapshot.present||snapshot.value===null)return true;
 return field==='services'?validatePrivateAppServices(snapshot.value).ok:
  own(PROFILE_TEXT_LIMITS,field)&&typeof snapshot.value==='string'&&snapshot.value.length<=PROFILE_TEXT_LIMITS[field]&&!/[<>\u0000-\u001f]/.test(snapshot.value);
}
function captureAppProfileField(config,field){
 if(!own(PROFILE_TEXT_LIMITS,field)&&field!=='services')return null;
 const profile=captureField(config.publicProfile,field),display=field==='tagline'?captureField(config.display,'tagline'):null;
 if(!validField(profile,field)||field==='tagline'&&!validField(display,'tagline'))return null;
 return {...profile,...display?{display}:{}};
}
function restoreField(object,field,snapshot){
 const next={...object};if(snapshot.present)next[field]=clone(snapshot.value);else delete next[field];
 if(snapshot.parent!=='object'&&Object.keys(next).length)throw Error('Unrelated fields cannot be removed.');
 return snapshot.parent==='absent'?undefined:snapshot.parent==='null'?null:next;
}
function restoreAppProfileField(config,{field,value}={}){
 const fail=()=>({ok:false,reason:'Only a validated exact public text/service field snapshot can be restored.'});
 if(!value||typeof value!=='object'||Array.isArray(value)||
  Object.keys(value).some(k=>!['parent','present','value','display'].includes(k)))return fail();
 const {display,...profile}=value;
 if(!validField(profile,field)||(!own(PROFILE_TEXT_LIMITS,field)&&field!=='services')||
  (field==='tagline'?!validField(display,'tagline'):display!==undefined))return fail();
 const previous=captureAppProfileField(config,field);if(!previous||JSON.stringify(previous)===JSON.stringify(value))return fail();
 try{
  const nextConfig={...config},next=restoreField(config.publicProfile,field,profile);
  if(next===undefined)delete nextConfig.publicProfile;else nextConfig.publicProfile=next;
  if(field==='tagline'){
   const d=restoreField(config.display,'tagline',display);
   if(d===undefined)delete nextConfig.display;else nextConfig.display=d;
  }
  return {ok:true,nextConfig,previous};
 }catch{return fail();}
}
export {PROFILE_TEXT_LIMITS,captureAppProfileField,restoreAppProfileField};
