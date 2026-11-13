// One conservative catalogue check reused by both existing app planners.
// Availability is not an entitlement, enabled module, or live task receipt.
function supportedAppCatalogModule(catalog,key){
 if(!Array.isArray(catalog)||catalog.length>50)return null;
 const rows=catalog.filter(row=>row?.module_key===key);
 if(rows.length!==1||rows[0].status!=='available')return null;
 const row=rows[0];
 if(['enquiry','booking_request'].includes(key)&&(row.capabilities?.customer_action!==true||row.capabilities?.request_type!==undefined&&row.capabilities.request_type!==key))return null;
 if(key==='booking_request'&&row.capabilities?.confirmation_required_by_business!==true)return null;
 return row;
}
export {supportedAppCatalogModule};
