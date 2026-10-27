import {creatorImageDataUri,creatorMediaReference,prepareCreatorLocalOriginals} from './creatorDraftMedia.mjs';
import {stableJson} from './stableJson.mjs';
// Separate from account save/publication. The original gateway remains the only
// byte-ingestion authority. No client action can enable this release gate.
export const CREATOR_MEDIA_ONBOARDING_ENABLED=false;
export function createCreatorMediaOnboarding({enabled=CREATOR_MEDIA_ONBOARDING_ENABLED,getCurrent,inspectLocal,readBytes,upload,reviewMedia,downloadMedia}){
 const origin=getCurrent(),tickets=new WeakMap();let pending=false,blocked=false,last=null,attempt=null;
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
   const ticket={files:value.files.map(f=>({...f,requestKey:'original_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2)})),photos:photos.map(p=>({...p})),privateOnly:true};
   tickets.set(ticket,{stamp:stableJson(ticket),current,originals});return ticket;
  },
  // Independent known-path inspection, never proof of a missing upload receipt.
  // Current words may change; only the deliberately selected original bytes bind
  // this read. The caller separately reviews installing verified references.
  async reconcile(photos,isCurrent=()=>true){
   if(!scoped()||pending||!last||!attempt||!isCurrent())return null;
   pending=true;let observations=0;const selection=stableJson(photos),current=()=>scoped()&&isCurrent()&&stableJson(photos)===selection;
   try{
    for(const row of last.files){
     if(!current())return null;
     if(!row.storagePath)continue;
     const index=attempt.ticket.photos.findIndex(p=>p.id===row.id),old=attempt.ticket.photos[index],matches=photos.filter(p=>p?.id===row.id);
     delete row.ref;row.state='unavailable_or_restricted';
     if(matches.length!==1||['uri','mimeType','fileName','width','height'].some(k=>matches[0][k]!==old[k])){row.state='selection_changed';continue;}
     try{
      const bytes=await readBytes(matches[0]);
      if(!current())return null;
      if(!(bytes instanceof Uint8Array)||bytes.length!==attempt.originals[index].length||bytes.some((b,j)=>b!==attempt.originals[index][j])){row.state='selection_changed';continue;}
      observations++;const reviewed=await reviewMedia({...matches[0],exportOriginalPath:row.storagePath}),actual=await downloadMedia(reviewed.projection,current),again=await reviewMedia({...matches[0],exportOriginalPath:row.storagePath});
      if(!current())return null;
      if(!creatorMediaReference(reviewed.ref)||reviewed.ref.id!==row.id||stableJson(reviewed)!==stableJson(again)||actual.length!==bytes.length||actual.some((b,j)=>b!==bytes[j]))throw Error('Original unavailable');
      if(last.files.some(r=>r!==row&&r.ref?.assetId===reviewed.ref.assetId)){row.state='duplicate_asset';continue;}
      row.ref=reviewed.ref;row.state='verified_private_original';
     }catch{row.state='unavailable_or_restricted';}
    }
    if(!current())return null;
    blocked=last.files.some(r=>['unknown','dispatched','stored_unverified','unavailable_or_restricted','selection_changed'].includes(r.state));
    last.status=last.files.some(r=>r.state==='unknown')?'unknown':last.files.some(r=>!['verified_private_original','rejected'].includes(r.state))?'partial':'reconciled';
    return {...view(),independentObservation:observations>0,uploadReceiptRecovered:false};
   }finally{pending=false;}
  },
  async commit(ticket){
   const t=tickets.get(ticket);
   if(!enabled)return {status:'disabled',mayReplay:false,files:[]};
   if(!t||pending||blocked||!scoped()||!t.current()||t.stamp!==stableJson(ticket))return {status:'not_sent',mayReplay:false,files:[]};
   tickets.delete(ticket);pending=true;attempt={ticket,originals:t.originals};
   last={status:'preparing',files:ticket.photos.map((p,i)=>({id:p.id,requestKey:ticket.files[i].requestKey,state:'not_sent'})),draftSaved:false,publicationAuthorised:false,mayReplay:false};
   try{
    for(let i=0;i<ticket.photos.length;i++){
     const photo=ticket.photos[i],row=last.files[i];
     if(!t.current()){last.status='interrupted';return view();}
     let bytes;
     try{bytes=await readBytes(photo);if(!(bytes instanceof Uint8Array)||bytes.length!==ticket.files[i].bytes||bytes.some((b,j)=>b!==t.originals[i][j]))throw Error('Local bytes changed');}
     catch{row.state='local_unavailable';last.status='rejected';return view();}
     if(!t.current()){last.status='interrupted';return view();}
     let result;
     // Once dispatched, transport loss is unknown. The original gateway has no
     // exact operation reader: never invent a receipt or retry a missing path.
     row.state='dispatched';blocked=true;
     try{result=await upload({photoBase64:creatorImageDataUri(bytes,photo.mimeType).split(',')[1],requestKey:row.requestKey,selectionId:photo.id},t.current);}
     catch{row.state='unknown';last.status='unknown';return view();}
     if(result?.rejected===true){row.state='rejected';last.status='rejected';blocked=last.files.some(r=>['unknown','dispatched','stored_unverified'].includes(r.state));return view();}
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
