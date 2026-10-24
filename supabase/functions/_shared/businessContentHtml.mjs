import {validPublicBusinessContent,contentPrice,contentEventSchedule} from './businessContentRecords.mjs';
// One governed public-content mount for both Website renderer adapters.
const escape=x=>String(x||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mountBusinessContent(id,endpoint,payload,kind,featuredId,eventSchedule){
 const target=document.getElementById(id);if(!target)return;let generation=0;
 const line=(parent,tag,value)=>{const el=document.createElement(tag);el.textContent=String(value||'');parent.appendChild(el);return el;};
 async function refresh(){
  const ticket=++generation;target.replaceChildren();line(target,'p','Checking approved information…');
  try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',cache:'no-store',body:JSON.stringify({action:'public_content',...payload})});const feed=await r.json();if(!r.ok||feed?.ok!==true||feed.version!==1||!Array.isArray(feed.records)||feed.records.length>200)throw Error();if(ticket!==generation)return;
   target.replaceChildren();line(target,'p','Approved information checked '+feed.checkedAt);
   const rows=feed.records.filter(row=>row.kind===kind&&row.data?.status!=='archived'&&(kind!=='event'||Date.parse(row.data.endsAt)>=Date.now())).sort((a,b)=>a.id===featuredId?-1:b.id===featuredId?1:kind==='event'?Date.parse(a.data.startsAt)-Date.parse(b.data.startsAt):String(a.data.name).localeCompare(String(b.data.name)));
   const input=document.createElement('input');input.type='search';input.placeholder='Search names, descriptions or categories';input.setAttribute('aria-label','Search '+(kind==='product'?'products':'events'));input.style.cssText='padding:1rem;min-height:48px;width:100%;grid-column:1/-1;';target.appendChild(input);
   const listing=document.createElement('div');listing.style.cssText='display:contents;';target.appendChild(listing);let pageSize=24;
   function renderRows(){listing.replaceChildren();const query=String(input.value||'').toLocaleLowerCase(),filtered=rows.filter(r=>(r.data.name+' '+r.data.description+' '+r.data.category).toLocaleLowerCase().includes(query));
   for(const row of filtered.slice(0,pageSize)){const d=row.data,article=document.createElement('article');article.style.cssText='padding:1rem;border:1px solid #bbc4d2;border-radius:12px;margin:1rem 0;';line(article,'h3',d.name);line(article,'p',d.category);line(article,'p',d.description);
    if(kind==='product'){const price=new Intl.NumberFormat(undefined,{style:'currency',currency:d.currency});line(article,'p',price.format(d.amountMinor/10**price.resolvedOptions().maximumFractionDigits));line(article,'p','Availability: '+d.availability.replaceAll('_',' ')+'. Stock and checkout are not supported.');}
    else{line(article,'p',d.status==='cancelled'?'Cancelled':eventSchedule(d));line(article,'p',d.location||'Online event');line(article,'p','Listing only; attendance is not confirmed.');if(typeof d.onlineUrl==='string'&&/^https:\/\//.test(d.onlineUrl)){const link=line(article,'a','Open public event information');link.href=d.onlineUrl;link.target='_blank';link.rel='noopener noreferrer';}}
    line(article,'p','Approved listing revision '+row.revision+'. Review current details before enquiring.');
    if(kind==='product'&&Array.isArray(d.variants)&&d.variants.length){
     const details=document.createElement('details');line(details,'summary','Product options');
     const list=document.createElement('ul');
     for(const variant of d.variants){const price=new Intl.NumberFormat(undefined,{style:'currency',currency:d.currency});line(list,'li',variant.label+' • '+price.format(variant.amountMinor/10**price.resolvedOptions().maximumFractionDigits)+(variant.sku?' • '+variant.sku:''));}
     details.appendChild(list);article.appendChild(details);
    }
    if(payload.allowEnquiry===true&&payload.slug&&payload.expectedAppId&&payload.expectedVersionId&&d.status!=='cancelled'){
     const url=new URL(endpoint.replace(/busy-mini-app-guest$/,'busy-mini-app-link'));
     for(const [key,value]of Object.entries({slug:payload.slug,source:'web',intent:'enquiry',appId:payload.expectedAppId,versionId:payload.expectedVersionId,content:row.id,content_revision:String(row.revision)}))url.searchParams.set(key,value);
     const link=line(article,'a','Ask about '+d.name);link.href=url.toString();
     if(kind==='product'&&Array.isArray(d.variants)&&d.variants.length){
      const label=line(article,'label','Choose an option for your enquiry');const select=document.createElement('select');select.id=id+'-'+row.id+'-option';label.setAttribute('for',select.id);select.style.cssText='min-height:48px;max-width:100%;padding:0.5rem';
      const base=line(select,'option','Standard option');base.value='';
      for(const variant of d.variants){const option=line(select,'option',variant.label+' • '+new Intl.NumberFormat(undefined,{style:'currency',currency:d.currency}).format(variant.amountMinor/10**new Intl.NumberFormat(undefined,{style:'currency',currency:d.currency}).resolvedOptions().maximumFractionDigits));option.value=variant.id;}
      select.addEventListener('change',()=>{if(select.value)url.searchParams.set('content_option',select.value);else url.searchParams.delete('content_option');link.href=url.toString();});article.appendChild(select);
     }
    }
    if(d.image?.uri&&/^https:\/\//.test(d.image.uri)){const img=document.createElement('img');img.src=d.image.uri;img.alt=String(d.image.alt||'');img.loading='lazy';img.style.cssText='max-width:100%;max-height:300px;object-fit:cover';article.appendChild(img);}listing.appendChild(article);
   }if(!filtered.length)line(listing,'p','No approved matching records.');if(filtered.length>pageSize){const more=line(listing,'button','Show more');more.type='button';more.onclick=()=>{pageSize+=24;renderRows();};}
   }input.addEventListener('input',()=>{pageSize=24;renderRows();});renderRows();
  }catch{if(ticket===generation){target.replaceChildren();line(target,'p','Current details are unavailable. Refresh before relying on dates or availability.');}}
 }
 refresh();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
}
function businessContentSectionHtml(section,{endpoint='',websiteId='',deploymentId='',appSource=null,sectionClasses=''}={}){
 if(!['products','events'].includes(section?.type)||section.contentSource!=='business_records_v1')return '';
 const id='business-content-'+section.id,kind=section.type==='products'?'product':'event';
 const safeEndpoint=typeof endpoint==='string'&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/functions\/v1\/busy-mini-app-guest$/.test(endpoint);
 const payload=appSource||{expectedDeploymentId:deploymentId};
 const preview=!safeEndpoint&&validPublicBusinessContent(section.previewFeed)?section.previewFeed:null;
 const previewHtml=preview?`<p>Approved record snapshot checked ${escape(preview.checkedAt)}. Current details require the connected public feed.</p>`+preview.records.filter(r=>r.kind===kind).map(r=>`<article><h3>${escape(r.data.name)}</h3><p>${escape(r.data.description)}</p><p>${escape(kind==='product'?contentPrice(r.data.amountMinor,r.data.currency):r.data.status==='cancelled'?'Cancelled':r.data.startsAt+' • '+r.data.timeZone)}</p></article>`).join(''):'';
 const args=[id,endpoint,payload,kind,section.featuredId||''].map(x=>JSON.stringify(x).replace(/</g,'\\u003c')).join(',');
 return `<section id="${escape(section.id)}"${sectionClasses?` class="${escape(sectionClasses)}"`:''}><div class="wrap"><h2>${escape(section.title)}</h2><div id="${escape(id)}" style="display:grid;grid-template-columns:${section.contentLayout==='rows'?'1fr':'repeat(auto-fit,minmax(min(100%,280px),1fr))'};gap:1rem">${previewHtml||`<p>${safeEndpoint?'Current approved information loads here.':'Shared record section prepared. Current published records require the connected live website.'}</p>`}</div>${safeEndpoint?`<script>(${mountBusinessContent.toString()})(${args},${contentEventSchedule.toString()});</script>`:''}</div></section>`;
}
export {businessContentSectionHtml};
