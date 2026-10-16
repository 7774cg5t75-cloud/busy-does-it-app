// Informational owner-authored service/menu facts, not prices for checkout,
// availability, a quote, a duration commitment or a stock record.
const SERVICE_DETAIL_LIMITS=Object.freeze({category:80,priceLabel:120,durationLabel:80});
function validServiceDetails(row){
 return !!row&&typeof row==='object'&&Object.entries(SERVICE_DETAIL_LIMITS).every(([key,max])=>
  row[key]===undefined||typeof row[key]==='string'&&row[key].length<=max&&!/[<>\u0000-\u001f\u007f]/.test(row[key]));
}
function publicServiceDetails(row){
 return validServiceDetails(row)?Object.fromEntries(Object.keys(SERVICE_DETAIL_LIMITS).filter(k=>typeof row[k]==='string'&&row[k].trim()).map(k=>[k,row[k].trim()])):{};
}
export {SERVICE_DETAIL_LIMITS,validServiceDetails,publicServiceDetails};
