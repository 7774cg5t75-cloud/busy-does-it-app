// Original private App source canonicalisation, shared with snapshot receipts.
function canonicalJsonValue(value){
 if(Array.isArray(value))return value.map(canonicalJsonValue);
 if(value&&typeof value==="object")return Object.fromEntries(
  Object.keys(value).sort().filter(k=>value[k]!==undefined)
   .map(k=>[k,canonicalJsonValue(value[k])]));
 return value;
}
// Preserve normal JSON serialisation (including Date/toJSON and array nulls)
// before ignoring object-key ordering.
const stableJson=value=>JSON.stringify(canonicalJsonValue(JSON.parse(JSON.stringify(value))));
export {canonicalJsonValue,stableJson};
