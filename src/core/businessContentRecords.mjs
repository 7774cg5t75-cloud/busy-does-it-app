// Shared product/event public-data contract. No stock, checkout or attendance authority.
const RECORD_ID=/^[a-zA-Z0-9_-]{12,80}$/;
const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const text=(x,max,required=false)=>typeof x==='string'&&x.length<=max&&!/[<>\u0000-\u001f\u007f]/.test(x)&&(!required||!!x.trim());
const https=x=>{try{const u=new URL(x);return typeof x==='string'&&x.length<=1800&&u.protocol==='https:'&&!u.username&&!u.password&&!/[\s<>]/.test(x);}catch{return false;}};
const instant=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
const zone=x=>{try{return typeof x==='string'&&x.length<100&&!!new Intl.DateTimeFormat('en',{timeZone:x});}catch{return false;}};
function validateBusinessContent(kind,data){
 if(!['product','event'].includes(kind)||!plain(data))return {ok:false,reason:'Choose a supported product or event.'};
 const extra=kind==='product'?['amountMinor','currency','availability','variants']:['startsAt','endsAt','timeZone','location','onlineUrl'];
 if(Object.keys(data).some(k=>!['name','description','category','image','status',...extra].includes(k))||!text(data.name,160,true)||!text(data.description,1800)||!text(data.category,80))return {ok:false,reason:'Use a name, description and category with safe public wording.'};
 if(data.image!==null&&data.image!==undefined&&(!plain(data.image)||Object.keys(data.image).some(k=>!['uri','alt'].includes(k))||!https(data.image.uri)||!text(data.image.alt,160,true)))return {ok:false,reason:'Choose an approved business photograph and its description.'};
 if(kind==='product'){
  if(!['active','archived'].includes(data.status)||!Number.isSafeInteger(data.amountMinor)||data.amountMinor<0||data.amountMinor>1000000000||!text(data.currency,3,true)||!/^[A-Z]{3}$/.test(data.currency)||!['not_tracked','owner_available','owner_unavailable'].includes(data.availability))return {ok:false,reason:'Review the product price, currency and owner-reported availability. Stock is not tracked.'};
  if(data.variants!==undefined){const ids=new Set();if(!Array.isArray(data.variants)||data.variants.length>12||data.variants.some(v=>!plain(v)||Object.keys(v).some(k=>!['id','label','sku','amountMinor'].includes(k))||!RECORD_ID.test(v.id||'')||ids.has(v.id)||!ids.add(v.id)||!text(v.label,120,true)||!text(v.sku,80)||!Number.isSafeInteger(v.amountMinor)||v.amountMinor<0||v.amountMinor>1000000000))return {ok:false,reason:'Use up to 12 uniquely identified product options with prices.'};}
 }else if(!['scheduled','cancelled','archived'].includes(data.status)||!instant(data.startsAt)||!instant(data.endsAt)||Date.parse(data.endsAt)<=Date.parse(data.startsAt)||!zone(data.timeZone)||!text(data.location,300)||typeof data.onlineUrl!=='string'||data.onlineUrl&&!https(data.onlineUrl)||!data.location.trim()&&!data.onlineUrl)return {ok:false,reason:'Review the event date, end time, time zone and venue or approved online link.'};
 return {ok:true,data:JSON.parse(JSON.stringify(data))};
}
function publicBusinessContent(rows,businessId,{now=new Date().toISOString()}={}){
 if(!Array.isArray(rows)||rows.length>200)return {ok:false,reason:'The current catalogue needs review.'};
 const records=[];
 for(const row of rows){
  if(row?.business_id!==businessId||!RECORD_ID.test(row.id||''))return {ok:false,reason:'The catalogue business does not match.'};
  if(row.published===null||row.published===undefined)continue;
  const checked=validateBusinessContent(row.kind,row.published);
  if(!checked.ok||!Number.isSafeInteger(row.published_revision)||row.published_revision<1||row.published_revision>row.revision)return {ok:false,reason:'A published record needs review.'};
  if(checked.data.status==='archived')continue;
  records.push({id:row.id,kind:row.kind,revision:row.published_revision,data:checked.data});
 }
 return {ok:true,version:1,businessId,checkedAt:now,records,stockTracked:false,checkoutEnabled:false,attendanceConfirmed:false};
}
function selectBusinessContent(feed,{kind,query='',category='',includePast=false,now=Date.now()}={}){
 if(!feed?.ok||feed.version!==1||!Array.isArray(feed.records)||feed.records.length>200||typeof query!=='string'||query.length>100)return [];
 const q=query.trim().toLocaleLowerCase('en');
 return feed.records.filter(r=>r.kind===kind&&validateBusinessContent(r.kind,r.data).ok&&(!category||r.data.category===category)&&(!q||(r.data.name+' '+r.data.description+' '+r.data.category).toLocaleLowerCase('en').includes(q))&&(kind!=='event'||includePast||Date.parse(r.data.endsAt)>=now)).sort((a,b)=>kind==='event'?Date.parse(a.data.startsAt)-Date.parse(b.data.startsAt):a.data.name.localeCompare(b.data.name));
}
function contentPrice(amountMinor,currency,locale='en'){
 try{const f=new Intl.NumberFormat(locale,{style:'currency',currency});return f.format(amountMinor/10**f.resolvedOptions().maximumFractionDigits);}catch{return String(amountMinor)+' minor units '+currency;}
}
function localEventInstant(date,time,timeZone){
 if(!/^\d{4}-\d\d-\d\d$/.test(date)||!/^\d\d:\d\d$/.test(time)||!zone(timeZone))return {ok:false,reason:'Enter a date, time and valid time zone.'};
 const base=Date.parse(date+'T'+time+':00.000Z'),matches=[];
 if(!Number.isFinite(base)||new Date(base).toISOString().slice(0,16)!==date+'T'+time)return {ok:false,reason:'That calendar date or time is invalid.'};
 const f=new Intl.DateTimeFormat('en-CA',{timeZone,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
 for(let offset=-840;offset<=840;offset+=15){const value=base+offset*60000,p=Object.fromEntries(f.formatToParts(value).map(x=>[x.type,x.value]));if(p.year+'-'+p.month+'-'+p.day===date&&p.hour+':'+p.minute===time)matches.push(new Date(value).toISOString());}
 return matches.length===1?{ok:true,value:matches[0]}:{ok:false,reason:matches.length?'That time occurs twice during the clock change. Choose an unambiguous time.':'That local time does not exist. Check the clock change and date.'};
}
function parseContentPrice(value,currency){
 if(typeof value!=='string'||value.length>30||!/^[A-Z]{3}$/.test(currency))return {ok:false,reason:'Enter a price and three-letter currency code.'};
 const digits=new Intl.NumberFormat('en',{style:'currency',currency}).resolvedOptions().maximumFractionDigits;
 const match=/^(\d+)(?:\.(\d*))?$/.exec(value.trim());
 if(!match||(match[2]||'').length>digits)return {ok:false,reason:'Use a valid price with the currency decimal places.'};
 const amountMinor=Number(match[1])*10**digits+Number((match[2]||'').padEnd(digits,'0'));
 return Number.isSafeInteger(amountMinor)&&amountMinor<=1000000000?{ok:true,amountMinor}:{ok:false,reason:'The price is outside the supported range.'};
}
function eventLocalFields(data){
 if(!instant(data?.startsAt)||!instant(data?.endsAt)||!zone(data.timeZone))return {};
 const f=new Intl.DateTimeFormat('en-CA',{timeZone:data.timeZone,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
 const part=value=>{const p=Object.fromEntries(f.formatToParts(new Date(value)).map(x=>[x.type,x.value]));return {date:p.year+'-'+p.month+'-'+p.day,time:p.hour+':'+p.minute};};
 const a=part(data.startsAt),b=part(data.endsAt);return {localDate:a.date,localStart:a.time,localEndDate:b.date,localEnd:b.time};
}
function validContentLayout(value){
 const seen=new Set();return Array.isArray(value)&&value.length<=2&&value.every(block=>plain(block)&&Object.keys(block).every(k=>['kind','layout','title','featuredId'].includes(k))&&['product','event'].includes(block.kind)&&!seen.has(block.kind)&&!!seen.add(block.kind)&&['cards','rows'].includes(block.layout)&&text(block.title,80,true)&&(block.featuredId===undefined||block.featuredId===''||RECORD_ID.test(block.featuredId)));
}
function validPublicBusinessContent(feed){
 return !!feed&&feed.ok===true&&feed.version===1&&typeof feed.businessId==='string'&&instant(feed.checkedAt)&&feed.stockTracked===false&&feed.checkoutEnabled===false&&feed.attendanceConfirmed===false&&Array.isArray(feed.records)&&feed.records.length<=200&&feed.records.every(r=>plain(r)&&Object.keys(r).every(k=>['id','kind','revision','data'].includes(k))&&RECORD_ID.test(r.id||'')&&Number.isSafeInteger(r.revision)&&r.revision>0&&validateBusinessContent(r.kind,r.data).ok);
}
export {RECORD_ID,validateBusinessContent,publicBusinessContent,selectBusinessContent,contentPrice,localEventInstant,parseContentPrice,eventLocalFields,validContentLayout,validPublicBusinessContent};

// Public selection only: re-resolve names/prices from the current approved feed.
// The returned wording is an enquiry context, never a transaction receipt.
function parseBusinessContentInterest(query={}){
 const recordId=query.content,revision=Number(query.content_revision),variantId=query.content_option||'';
 if(typeof recordId!=='string'||!RECORD_ID.test(recordId)||typeof query.content_revision!=='string'||!/^\d{1,10}$/.test(query.content_revision)||!Number.isSafeInteger(revision)||revision<1||typeof variantId!=='string'||variantId&&!RECORD_ID.test(variantId))return null;
 return {recordId,revision,...variantId?{variantId}:{}};
}
function prepareBusinessContentEnquiry(feed,businessId,selection,{now=Date.now()}={}){
 const fail=reason=>({ok:false,reason});
 if(!businessId||!validPublicBusinessContent(feed)||feed.businessId!==businessId||!selection||!RECORD_ID.test(selection.recordId||'')||!Number.isSafeInteger(selection.revision))return fail('Refresh the approved catalogue before choosing an item.');
 const matches=feed.records.filter(r=>r.id===selection.recordId);
 if(matches.length!==1||matches[0].revision!==selection.revision)return fail('This item has changed. Review its current details before enquiring.');
 const row=matches[0],d=row.data;
 if(d.status==='archived'||d.status==='cancelled'||row.kind==='event'&&Date.parse(d.endsAt)<now)return fail('This listing is no longer accepting new interest.');
 const variant=selection.variantId?(d.variants||[]).find(v=>v.id===selection.variantId):null;
 if(selection.variantId&&!variant)return fail('This option has changed. Choose a current option.');
 const subject=(row.kind==='product'?'Product: ':'Event: ')+d.name+(variant?' — '+variant.label:'');
 const details=row.kind==='product'?
  'Displayed price: '+contentPrice(variant?variant.amountMinor:d.amountMinor,d.currency)+'. Availability: '+d.availability.replaceAll('_',' ')+'.':
  'Listed dates: '+d.startsAt+' to '+d.endsAt+' ('+d.timeZone+'). '+(d.location||'Online event')+'.';
 const reference='Listing reference: '+row.id+' / approved revision '+row.revision+(variant?' / option '+variant.id:'')+'.';
 return {ok:true,selection:{recordId:row.id,revision:row.revision,...variant?{variantId:variant.id}:{}},
  service:subject.slice(0,240),message:subject+'\n'+details+'\n'+reference+'\nThis is an enquiry, not an order, reservation or confirmed attendance.\nPlease tell me more.',
  businessId,transactionConfirmed:false};
}
export {parseBusinessContentInterest,prepareBusinessContentEnquiry};
