// Existing published gallery contract, shared by marketplace and guest/native
// projection. Pure presentation projection, never authentication or media approval.
const PUBLIC_GALLERY_LIMIT=15;
const description=(value,max)=>typeof value==='string'&&value.length<=max&&!/[<>\u0000-\u001f\u007f]/.test(value)?value.trim():'';
function publicAppGallery(rows){
 return Array.isArray(rows)?rows.filter(row=>row?.approved===true||row?.marketingOk===true)
  .map(row=>({uri:typeof row?.uri==='string'&&row.uri.length<=1800&&/^https:\/\//i.test(row.uri)?row.uri:'',alt:description(row?.alt,160),caption:description(row?.caption,240)}))
  .filter(row=>row.uri).slice(0,PUBLIC_GALLERY_LIMIT):[];
}
export {PUBLIC_GALLERY_LIMIT,publicAppGallery};
