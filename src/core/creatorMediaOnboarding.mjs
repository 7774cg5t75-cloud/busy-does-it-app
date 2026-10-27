import {creatorImageDataUri,creatorMediaReference,prepareCreatorLocalOriginals} from './creatorDraftMedia.mjs';
import {stableJson} from './stableJson.mjs';
// Separate from account save/publication. The original gateway remains the only
// byte-ingestion authority. No client action can enable this release gate.
export const CREATOR_MEDIA_ONBOARDING_ENABLED=false;
export function createCreatorMediaOnboarding({enabled=CREATOR_MEDIA_ONBOARDING_ENABLED,getCurrent,inspectLocal,readBytes,upload,reviewMedia,downloadMedia}){
 const origin=getCurrent(),tickets=new WeakMap();let pending=false,blocked=false,last=null;
 const scoped=()=>{const c=getCurrent();return !!origin.scope&&c.scope===origin.scope&&c.ownerId===origin.ownerId&&c.businessId===origin.businessId&&c.role==='owner'&&c.ready===true;};
 const view=()=>scoped()&&last?JSON.parse(stableJson(last)):null;
 return {enabled:enabled===true,
  inspect:view,
  async review(photos,isCurrent=()=>true){
   if(!scoped()||pending||blocked||!isCurrent())return null;
   const selected=stableJson(photos),current=()=>scoped()&&isCurrent()&&stableJson(photos)===selected;
   const value=await prepareCreatorLocalOriginals({businessId:origin.businessId,ownerId:origin.ownerId,photos,inspectLocal,isCurrent:current});
   if(!current())return null;
   const originals=[];for(let i=0;i<photos.length;i++){const bytes=await readBytes(photos[i]);if(!current()||!(bytes instanceof Uint8Array)||bytes.length!==value.files[i].bytes)throw Error('Local original changed during review');originals.push(new Uint8Array(bytes));}
   const ticket={files:value.files,photos:photos.map(p=>({...p})),privateOnly:true};
   tickets.set(ticket,{stamp:stableJson(ticket),current,originals});return ticket;
  },
  async commit(ticket){
   const t=tickets.get(ticket);
   if(!enabled)return {status:'disabled',mayReplay:false,files:[]};
   if(!t||pending||blocked||!scoped()||!t.current()||t.stamp!==stableJson(ticket))return {status:'not_sent',mayReplay:false,files:[]};
   tickets.delete(ticket);pending=true;
   last={status:'preparing',files:[],draftSaved:false,publicationAuthorised:false,mayReplay:false};
   try{
    for(let i=0;i<ticket.photos.length;i++){
     const photo=ticket.photos[i],row={id:photo.id,state:'not_sent'};last.files.push(row);
     if(!t.current()){last.status='interrupted';return view();}
     let bytes;
     try{bytes=await readBytes(photo);if(!(bytes instanceof Uint8Array)||bytes.length!==ticket.files[i].bytes||bytes.some((b,j)=>b!==t.originals[i][j]))throw Error('Local bytes changed');}
     catch{row.state='local_unavailable';last.status='rejected';return view();}
     if(!t.current()){last.status='interrupted';return view();}
     let result;
     // Once dispatched, transport loss is unknown. The original gateway has no
     // exact operation reader: never invent a receipt or retry a missing path.
     row.state='dispatched';blocked=true;
     try{result=await upload({photoBase64:creatorImageDataUri(bytes,photo.mimeType).split(',')[1]},t.current);}
     catch{row.state='unknown';last.status='unknown';return view();}
     if(result?.rejected===true){row.state='rejected';last.status='rejected';return view();}
     if(!result?.ok||typeof result.storagePath!=='string'||result.bytes!==bytes.length||result.contentType!==photo.mimeType){row.state='unknown';last.status='unknown';return view();}
     row.storagePath=result.storagePath;row.reused=result.reused===true;row.state='stored_unverified';
     if(!t.current()){last.status='interrupted';return view();}
     try{
      const reviewed=await reviewMedia({...photo,exportOriginalPath:row.storagePath});
      const actual=await downloadMedia(reviewed.projection,t.current);
      if(!t.current())throw Error('Selection changed');
      const again=await reviewMedia({...photo,exportOriginalPath:row.storagePath});
      if(!creatorMediaReference(reviewed.ref)||reviewed.ref.id!==photo.id||stableJson(again)!==stableJson(reviewed)||actual.length!==bytes.length||actual.some((b,j)=>b!==bytes[j]))throw Error('Original differs');
      if(last.files.some(r=>r!==row&&r.ref?.assetId===reviewed.ref.assetId)){row.state='duplicate_asset';last.status='rejected';return view();}
      row.ref=reviewed.ref;row.state='verified_private_original';
     }catch{row.state='stored_unverified';last.status='verification_unavailable';return view();}
    }
    if(!t.current()){last.status='interrupted';return view();}
    last.status='verified';blocked=false;return view();
   }finally{pending=false;}
  }
 };
}
// Exact original endpoint, current bearer token, no client owner UUID authority.
export async function uploadCreatorOriginal({baseUrl,apiKey,ownerAccessToken,fetchOriginal,businessId,isCurrent},body){
 if(!isCurrent())throw Error('Selection changed');const token=await ownerAccessToken();if(!token||!isCurrent())throw Error('Account changed');
 const r=await fetchOriginal(baseUrl+'/functions/v1/busy-website-original-media',{method:'POST',headers:{apikey:apiKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({action:'upload',businessId,photoBase64:body.photoBase64})},60000);
 // Only a definite pre-ingestion gateway validation/authority denial is a known rejection.
 if([400,403,405,413].includes(r.status))return {rejected:true};
 const value=await r.json();if(!r.ok)throw Error('Original outcome unavailable');return value;
}
