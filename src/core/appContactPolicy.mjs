const CONTACT_LIMITS=Object.freeze({phone:80,email:240,openingHours:500});
const text=(x,max)=>typeof x==='string'&&x.length<=max&&!/[<>\u0000-\u001f\u007f]/.test(x);
// Historical contact snapshots preserve safe sparse/null fields exactly.
function validAppContactSnapshot(value){
 if(value===null)return true;
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['phone','email','openingHours','social'].includes(k)))return false;
 for(const [key,max]of Object.entries(CONTACT_LIMITS))if(Object.hasOwn(value,key)&&value[key]!==null&&!text(value[key],max))return false;
 const social=value.social;if(social!==undefined&&social!==null&&(!social||typeof social!=='object'||Array.isArray(social)||Object.keys(social).some(k=>!['facebook','instagram'].includes(k)||!text(social[k],500))))return false;
 return true;
}
function validAppContactEdit(field,value){
 if(!Object.hasOwn(CONTACT_LIMITS,field)||!text(value,CONTACT_LIMITS[field]))return false;
 if(!value.trim())return true;
 if(field==='email')return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
 if(field==='phone')return /^\+?[0-9() .-]+$/.test(value.trim())&&value.replace(/\D/g,'').length>=7;
 return true;
}
export {CONTACT_LIMITS,validAppContactSnapshot,validAppContactEdit};
