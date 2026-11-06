import {websiteCreativeSourcesCurrent} from './websiteCreativeSpecification.mjs';
import {websiteOwnerLocks,protectWebsiteOwnerLocks} from './websiteOwnerLocks.mjs';
import {websitePresentationPhoto} from './websiteContentPhotos.mjs';
import {websiteCreativeCopyCatalog,validateWebsiteCreativeCopy,websiteCreativeCopyProvenanceCurrent,validateWebsiteCreativeCopyCoverage} from './websiteCreativeCopy.mjs';

export const WEBSITE_CREATIVE_DOCUMENT_VERSION='busy.website-creative-document.v2';
export const WEBSITE_CREATIVE_INTENT_VERSION='busy.website-creative-intent.v1';
export const WEBSITE_CREATIVE_FONTS=Object.freeze(['system-sans','georgia','trebuchet','verdana']);
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const list=value=>Array.isArray(value)?value:[];
const exact=(value,keys)=>object(value)&&Object.keys(value).sort().join(',')===[...keys].sort().join(',');
const plain=(value,max,required=true)=>typeof value==='string'&&value.length<=max&&!/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)&&(!required||!!value.trim());
const id=value=>typeof value==='string'&&/^[a-z][a-z0-9_-]{1,99}$/.test(value);
const number=(value,min,max)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;
const hex=value=>typeof value==='string'&&/^#[a-fA-F0-9]{6}$/.test(value);
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const clone=value=>JSON.parse(JSON.stringify(value));
const canonical=value=>Array.isArray(value)?value.map(canonical):object(value)?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const fail=reason=>({ok:false,applied:false,reason});
const backgrounds=['paper','ink','accent','gradient'];
const purposes=['home','about','services','service-detail','menu','contact','information'];
const sourceScope=draft=>({businessId:draft.businessId,websiteId:draft.id});
const ownedSection=section=>section?.type==='creative-document'&&section.creativeGenerated===true;
const editedSection=section=>list(section?.ownerEditedFields).length||section?.ownerEditedItems===true||ownedSection(section)&&Object.keys(section?.appearance||{}).length||list(section?.items).some(item=>list(item.ownerEditedFields).length||ownedSection(section)&&Object.keys(item.appearance||{}).length);
function presentationIdentity(draft){
 const model=draft.creativeDocumentPageModel;if(!model)return null;
 return {pages:list(model.pages).map(page=>{const {copyMetadata,...rest}=page;return rest;}).sort((a,b)=>a.id.localeCompare(b.id)),navigation:model.navigation,brand:model.brand,navigationPresentation:model.navigationPresentation,imageBriefs:list(model.imageBriefs).map(brief=>({id:brief.id,role:brief.role,description:brief.description.text})),sections:list(draft.sections).filter(ownedSection).map(section=>({id:section.id,layout:section.creativeDocument?.layout,nodes:section.creativeDocument?.nodes,items:list(section.items).map(item=>({id:item.id,body:item.body})).sort((a,b)=>a.id.localeCompare(b.id))})).sort((a,b)=>a.id.localeCompare(b.id)),customPages:draft.customPages};
}

export function validateWebsiteCreativeIntent(draft,intent){
 if(!exact(intent,['version','allowCopySuggestions','allowBrandChange','allowNewPages','allowRetireAiPages','ownerRewriteSourceIds'])||intent.version!==WEBSITE_CREATIVE_INTENT_VERSION||['allowCopySuggestions','allowBrandChange','allowNewPages','allowRetireAiPages'].some(key=>typeof intent[key]!=='boolean')||!Array.isArray(intent.ownerRewriteSourceIds)||intent.ownerRewriteSourceIds.length>100||new Set(intent.ownerRewriteSourceIds).size!==intent.ownerRewriteSourceIds.length)return fail('Review the owner’s exact creative permissions separately from the proposed design.');
 const catalog=websiteCreativeCopyCatalog(draft);if(!catalog?.ok)return fail(catalog?.reason||'Review the original approved copy sources first.');
 if(intent.ownerRewriteSourceIds.some(value=>typeof value!=='string'||!catalog.sources.some(source=>source.id===value)))return fail('A wording permission does not identify a current original source.');
 return {ok:true,approvedIntent:clone(intent)};
}

function luminance(colour){const components=[1,3,5].map(index=>parseInt(colour.slice(index,index+2),16)/255).map(value=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4);return components[0]*0.2126+components[1]*0.7152+components[2]*0.0722;}
export function creativeDocumentContrast(a,b){if(!hex(a)||!hex(b))return 0;const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (values[0]+0.05)/(values[1]+0.05);}
function gradientForeground(brand){
 // Explicit sRGB interpolation keeps each channel inside its endpoint range.
 // Luminance is monotone in each channel, so these conservative componentwise
 // bounds cover the COMPLETE gradient rather than a handful of sampled stops.
 const bound=operation=>'#'+[1,3,5].map(index=>operation(parseInt(brand.gradient.from.slice(index,index+2),16),parseInt(brand.gradient.to.slice(index,index+2),16)).toString(16).padStart(2,'0')).join('');
 const darkest=bound(Math.min),lightest=bound(Math.max),min=luminance(darkest),max=luminance(lightest);
 return [brand.palette.ink,brand.palette.paper].find(colour=>{const value=luminance(colour);return value<=min&&creativeDocumentContrast(colour,darkest)>=4.5||value>=max&&creativeDocumentContrast(colour,lightest)>=4.5;})||null;
}
function validateBrand(brand){
 if(!exact(brand,['headingFont','bodyFont','palette','gradient'])||!WEBSITE_CREATIVE_FONTS.includes(brand.headingFont)||!WEBSITE_CREATIVE_FONTS.includes(brand.bodyFont)||!exact(brand.palette,['ink','paper','accent','muted'])||Object.values(brand.palette).some(colour=>!hex(colour))||creativeDocumentContrast(brand.palette.ink,brand.palette.paper)<4.5||creativeDocumentContrast(brand.palette.muted,brand.palette.paper)<4.5||Math.max(creativeDocumentContrast(brand.palette.ink,brand.palette.accent),creativeDocumentContrast(brand.palette.paper,brand.palette.accent))<4.5)return false;
 if(brand.gradient!==null&&(!exact(brand.gradient,['from','to','angle'])||!hex(brand.gradient.from)||!hex(brand.gradient.to)||!number(brand.gradient.angle,0,360)||!gradientForeground(brand)))return false;
 return true;
}
export function creativeDocumentColours(brand,background){
 if(brand===null){if(!['paper','ink'].includes(background))return null;return background==='paper'?{background:'var(--paper)',color:'var(--ink)',muted:'var(--ink)'}:{background:'var(--ink)',color:'var(--paper)',muted:'var(--paper)'};}
 if(!validateBrand(brand)||!backgrounds.includes(background))return null;
 const palette=brand.palette;
 if(background==='gradient'){if(!brand.gradient)return null;const color=gradientForeground(brand);return {background:'linear-gradient('+brand.gradient.angle+'deg in srgb,'+brand.gradient.from+','+brand.gradient.to+')',color,muted:color};}
 const fill=palette[background],color=background==='paper'?palette.ink:background==='ink'?palette.paper:[palette.ink,palette.paper].sort((a,b)=>creativeDocumentContrast(b,fill)-creativeDocumentContrast(a,fill))[0];
 return {background:fill,color,muted:background==='paper'?palette.muted:color};
}
function effectiveBrand(draft,requested){
 if(requested)return requested;
 const previous=draft.creativeDocumentPageModel?.brand;if(validateBrand(previous))return previous;
 // No requested brand change means inherit the original renderer's reviewed
 // typography and palette, rather than inventing replacement default fonts.
 return null;
}

export function websiteCreativeDocumentAsset(draft,ref){
 if(!exact(ref,['storagePath','revision','sha256'])||typeof ref.storagePath!=='string'||!Number.isSafeInteger(ref.revision)||ref.revision<1||!hash(ref.sha256))return null;
 return websitePresentationPhoto(draft,{storagePath:ref.storagePath,assetRevision:ref.revision,sha256:ref.sha256});
}
export function resolveWebsiteCreativeSource(draft,ref){
 if(!ref||typeof ref.id!=='string')return null;
 const catalog=websiteCreativeCopyCatalog(draft),source=catalog?.sources?.find(source=>source.id===ref.id&&(source.revision===ref.revision||!['record','photo'].includes(source.kind)));
 if(!source)return null;
 const target=source.target,section=target?.sectionId?list(draft.sections).find(section=>section.id===target.sectionId):null,item=target?.itemId?list(section?.items).find(item=>item.id===target.itemId):null;
 return {...source,section,item};
}

function copyFields(node){return node.type==='heading'||node.type==='text'||node.type==='link'?[['copy',node.copy]]:node.type==='image'?[['alt',node.alt]]:node.type==='list'?list(node.items).map((copy,index)=>['item-'+index,copy]):[];}
function walk(nodes,callback,depth=1){for(const node of nodes){callback(node,depth);if(depth<5&&Array.isArray(node?.children))walk(node.children,callback,depth+1);}}
const pagePath=pageId=>pageId==='home'?{path:'/',outputPath:'index.html'}:pageId.startsWith('page-')?{path:'/pages/'+pageId.slice(5),outputPath:'pages/'+pageId.slice(5)+'/index.html'}:{path:'/'+pageId,outputPath:pageId+'/index.html'};
function documentSchema(){
 const string={type:'string',minLength:1,maxLength:2500},identifier={type:'string',minLength:2,maxLength:100},numeric=(min,max)=>({type:'number',minimum:min,maximum:max});
 const shape=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false}),array=(items,max,min=0)=>({type:'array',items,minItems:min,maxItems:max});
 const copyDefinition=shape({text:string,classification:{enum:['verbatim','derived']},sourceRefs:array(shape({id:string,revision:{type:'integer',minimum:1}}),16,1)}),copy={$ref:'#/$defs/copy'},children=array({$ref:'#/$defs/node'},12,1),base={id:identifier};
 const brand=shape({headingFont:{enum:WEBSITE_CREATIVE_FONTS},bodyFont:{enum:WEBSITE_CREATIVE_FONTS},palette:shape({ink:string,paper:string,accent:string,muted:string}),gradient:{anyOf:[{type:'null'},shape({from:string,to:string,angle:numeric(0,360)})]}});
 const schema=shape({version:{const:WEBSITE_CREATIVE_DOCUMENT_VERSION},brand:{anyOf:[{type:'null'},brand]},pages:array(shape({pageId:identifier,title:copy,purpose:{enum:purposes},description:copy,sections:array({anyOf:[shape({sourceSectionId:identifier}),shape({id:identifier,layout:shape({maxWidth:numeric(640,1440),paddingX:numeric(16,96),paddingY:numeric(16,128),mobilePaddingX:numeric(16,32),mobilePaddingY:numeric(16,64),gap:numeric(8,64),background:{enum:backgrounds}}),nodes:children})]},12,1)}),10,1),navigation:shape({placement:{enum:['top','rail','split']},primaryPageId:{anyOf:[{type:'null'},identifier]},items:array(identifier,10,1)}),removePageIds:array(identifier,10),imageBriefs:array(shape({id:identifier,role:{enum:['opening','service','story','atmosphere']},description:copy}),4)});
 schema.$defs={copy:copyDefinition,node:{anyOf:[shape({...base,type:{const:'heading'},copy,level:{enum:[1,2,3]},size:numeric(24,112),mobileSize:numeric(24,56),align:{enum:['start','center']}}),shape({...base,type:{const:'text'},copy,size:numeric(16,24),measure:numeric(24,75)}),shape({...base,type:{const:'image'},asset:shape({storagePath:string,revision:{type:'integer',minimum:1},sha256:string}),alt:copy,ratio:numeric(0.5,2.5),fit:{enum:['cover','contain']},focal:shape({x:numeric(0,100),y:numeric(0,100)})}),shape({...base,type:{const:'link'},copy,target:shape({pageId:{anyOf:[{type:'null'},identifier]},sectionId:{anyOf:[{type:'null'},identifier]},contactField:{anyOf:[{type:'null'},{enum:['email','phone']}]}}),presentation:{enum:['text','button']}}),shape({...base,id:{...identifier,maxLength:90},type:{const:'list'},items:array(copy,12,1),ordered:{type:'boolean'}}),shape({...base,type:{const:'stack'},gap:numeric(8,64),children}),shape({...base,type:{const:'grid'},columns:array(numeric(1,12),3,2),gap:numeric(8,64),mobileColumns:{enum:[1,2]},mobileGap:numeric(8,32),align:{enum:['start','center','end']},children:array({$ref:'#/$defs/node'},6,2)}),shape({...base,type:{const:'group'},padding:numeric(12,64),background:{enum:backgrounds},children}),shape({...base,type:{const:'divider'},weight:{enum:[1,2,3]}})]}};
 return schema;
}
export function websiteCreativeDocumentSchema(){return documentSchema();}

export function validateWebsiteCreativeDocument(draft,document,{approvedIntent,forEdit=true}={}){
 const permission=validateWebsiteCreativeIntent(draft,approvedIntent);if(!permission.ok)return permission;
 if(!websiteCreativeSourcesCurrent(draft)||!draft.id||!Number.isSafeInteger(draft.generation)||!exact(document,['version','brand','pages','navigation','removePageIds','imageBriefs'])||document.version!==WEBSITE_CREATIVE_DOCUMENT_VERSION||!Array.isArray(document.pages)||!document.pages.length||document.pages.length>10||!Array.isArray(document.removePageIds)||document.removePageIds.length>10||new Set(document.removePageIds).size!==document.removePageIds.length||!Array.isArray(document.imageBriefs)||document.imageBriefs.length>4)return fail('Review a current, source-bound expressive website document.');
 let serial;try{serial=JSON.stringify(document);}catch{return fail('The creative document must be plain bounded JSON.');}if(serial.length>100000)return fail('This creative document exceeds the reviewed size limit.');
 const locks=websiteOwnerLocks(draft);if(!locks.ok||locks.locks.includes('all'))return fail('Review the owner’s website locks before changing the creative direction.');
 if(document.brand!==null&&(!approvedIntent.allowBrandChange||!validateBrand(document.brand)||locks.locks.length))return fail('The proposed brand needs explicit owner permission, accessible colours and unlocked sections.');
 const brand=effectiveBrand(draft,document.brand),catalog=websiteCreativeCopyCatalog(draft),currentPages=list(draft.pages).filter(page=>page.enabled!==false),allSections=list(draft.sections),pageIds=new Set(),sectionIds=new Set(),nodeIds=new Set(),usedImages=new Set(),copies=[],provenance=[];
 const rewriteTargets=approvedIntent.ownerRewriteSourceIds.map(value=>catalog.sources.find(source=>source.id===value)?.target).filter(Boolean),visibleCopies=[],preservedSourceIds=new Set();
 let count=0,error='',wordCharacters=0;
 const checkCopy=(copy,target=null,role='visible-text')=>{
  if(error)return;
  if(!exact(copy,['text','classification','sourceRefs'])||!plain(copy.text,2500)||!['verbatim','derived'].includes(copy.classification)||copy.classification==='derived'&&!approvedIntent.allowCopySuggestions){error='Review exact source-grounded wording and its owner permission.';return;}
  const checked=validateWebsiteCreativeCopy(draft,copy,{target,rewriteTargets,forEdit});if(!checked?.ok){error=checked?.reason||'A proposed phrase is not grounded in the current approved sources.';return;}
  copies.push(copy);visibleCopies.push({copy,role});provenance.push(checked.provenance);wordCharacters+=copy.text.length;
 };
 for(const page of document.pages){
  if(!exact(page,['pageId','title','purpose','description','sections'])||!id(page.pageId)||pageIds.has(page.pageId)||!purposes.includes(page.purpose)||!Array.isArray(page.sections)||!page.sections.length||page.sections.length>12)return fail('Each purposeful page needs one unambiguous supported identity and composition.');
  pageIds.add(page.pageId);const existing=currentPages.find(current=>current.id===page.pageId),custom=list(draft.customPages).find(current=>current.id===page.pageId);
  if(!existing&&(!approvedIntent.allowNewPages||!/^page-creative-[a-z0-9][a-z0-9-]{1,54}$/.test(page.pageId)))return fail('New pages need explicit owner permission and a safe original custom-page identity.');
  if(custom&&!custom.sourceServiceId&&custom.creativeGenerated!==true)return fail('An unrelated owner-authored page is preserved. Choose another page for this creative direction.');
  if(existing&&list(existing.sectionIds).some(value=>locks.locks.includes(value)))return fail('The proposed page would hide or replace an owner-locked section.');
  if(existing&&list(existing.sectionIds).some(value=>{const section=allSections.find(section=>section.id===value);return ownedSection(section)&&editedSection(section);}))return fail('Keep the original owner-edited or owner-styled composition visible. A new creative proposal cannot silently replace it.');
  checkCopy(page.title,null,'metadata');checkCopy(page.description,null,'metadata');if(page.title?.text?.length>80||page.description?.text?.length>160)return fail('Use reviewed page labels up to 80 characters and accurate descriptions up to 160 characters.');
  let h1=0,bodyCharacters=0;const pageSectionIds=new Set();
  for(const section of page.sections){
   if(exact(section,['sourceSectionId'])){
    const original=allSections.find(current=>current.id===section.sourceSectionId&&current.enabled!==false);
    if(!original||ownedSection(original)||original.type==='hero'||pageSectionIds.has(original.id))return fail('Retain exact current original source sections, without duplicate anchors or a second opening.');
    pageSectionIds.add(original.id);for(const source of catalog.sources.filter(source=>source.target?.sectionId===original.id))preservedSourceIds.add(source.id);bodyCharacters+=original.body?.length||list(original.items).reduce((total,item)=>total+(item.body?.length||0),0);continue;
   }
   if(!exact(section,['id','layout','nodes'])||!/^custom-creative-[a-z0-9_-]{2,80}$/.test(section.id)||sectionIds.has(section.id)||pageSectionIds.has(section.id)||!safeCompiledLayout(section.layout,brand)||!Array.isArray(section.nodes)||!section.nodes.length||section.nodes.length>24)return fail('Use bounded responsive original sections, never generated CSS or executable markup.');
   pageSectionIds.add(section.id);
   sectionIds.add(section.id);const previous=allSections.find(current=>current.id===section.id);
   if(previous&&(!ownedSection(previous)||editedSection(previous)||locks.locks.includes(section.id)))return fail('The proposed section would overwrite existing owner work. Use a new reviewed section identity.');
   walk(section.nodes,(node,depth)=>{
    if(error)return;count++;if(!object(node)||!id(node.id)||nodeIds.has(node.id)||depth>4||count>180){error='Keep the reviewed composition within distinct node identities, four levels and 180 elements.';return;}nodeIds.add(node.id);
    const base=['id','type'];let keys;
    if(node.type==='heading'){keys=[...base,'copy','level','size','mobileSize','align'];if(![1,2,3].includes(node.level)||!number(node.size,24,112)||!number(node.mobileSize,24,56)||!['start','center'].includes(node.align))error='Use accessible heading levels and bounded type sizes.';if(node.level===1)h1++;}
    else if(node.type==='text'){keys=[...base,'copy','size','measure'];if(!number(node.size,16,24)||!number(node.measure,24,75))error='Keep body text at least 16 pixels with a readable measure.';bodyCharacters+=node.copy?.text?.length||0;}
    else if(node.type==='image'){
     keys=[...base,'asset','alt','ratio','fit','focal'];const asset=websiteCreativeDocumentAsset(draft,node.asset);
     if(!asset||usedImages.has(asset.sha256)||!number(node.ratio,0.5,2.5)||!['cover','contain'].includes(node.fit)||!exact(node.focal,['x','y'])||!number(node.focal.x,0,100)||!number(node.focal.y,0,100))error='Review distinct current approved photographs and safe crops; no duplicates or substituted assets.';
     if(asset){usedImages.add(asset.sha256);if(node.alt?.text!==asset.alt)error='Preserve the original approved photographic description; a design role cannot establish a new subject claim.';}
    }
    else if(node.type==='link'){
     keys=[...base,'copy','target','presentation'];const target=node.target;
     if(!exact(target,['pageId','sectionId','contactField'])||!['text','button'].includes(node.presentation)||target.contactField!==null&&!['email','phone'].includes(target.contactField)){error='Use only source-supported internal or original contact actions.';}
     else if(target.contactField){const contact=allSections.find(section=>section.id==='contact'&&section.enabled!==false),value=contact?.[target.contactField];if(target.pageId!==null||target.sectionId!==null||typeof value!=='string'||!(target.contactField==='email'?/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value):/^[+()\d .-]{5,40}$/.test(value)))error='That original contact destination is unavailable.';}
     else if(typeof target.pageId!=='string'||target.sectionId!==null&&typeof target.sectionId!=='string')error='Choose an exact original page destination.';
     if(!error)for(const ref of list(node.copy?.sourceRefs)){
      const source=catalog.sources.find(source=>source.id===ref.id);
      if(source?.ownerProtected&&source.target?.field==='cta'&&!approvedIntent.ownerRewriteSourceIds.includes(source.id)){
       const original=allSections.find(section=>section.id===source.target.sectionId),anchor=original?.ctaHref?.slice(1);
       if(!anchor||target.contactField||target.pageId!==anchor&&target.sectionId!==anchor)error='Preserve the owner-approved customer destination along with its protected action wording.';
      }
     }
    }
    else if(node.type==='list'){keys=[...base,'items','ordered'];if(node.id.length>90||!Array.isArray(node.items)||!node.items.length||node.items.length>12||typeof node.ordered!=='boolean')error='Use a bounded source-grounded list with a safe editable-row identity.';}
    else if(node.type==='stack'){keys=[...base,'gap','children'];if(!number(node.gap,8,64)||!Array.isArray(node.children)||!node.children.length||node.children.length>12)error='Use bounded responsive stack spacing.';}
    else if(node.type==='grid'){keys=[...base,'columns','gap','mobileColumns','mobileGap','align','children'];if(!Array.isArray(node.columns)||node.columns.length<2||node.columns.length>3||node.columns.some(value=>!number(value,1,12))||!number(node.gap,8,64)||![1,2].includes(node.mobileColumns)||!number(node.mobileGap,8,32)||!['start','center','end'].includes(node.align)||!Array.isArray(node.children)||node.children.length<2||node.children.length>6)error='Use bounded desktop grid weights and deliberately reviewed mobile columns and spacing.';}
    else if(node.type==='group'){keys=[...base,'padding','background','children'];if(!number(node.padding,12,64)||!backgrounds.includes(node.background)||!creativeDocumentColours(brand,node.background)||!Array.isArray(node.children)||!node.children.length||node.children.length>12)error='Use a finite, accessible grouped composition.';}
    else if(node.type==='divider'){keys=[...base,'weight'];if(![1,2,3].includes(node.weight))error='Use a supported editorial rule.';}
    else {error='This document contains an unsupported executable or unreviewed node.';return;}
    if(!exact(node,keys))error='The creative document contains unsupported node properties.';
    for(const [field,copy] of copyFields(node))checkCopy(copy,null,field==='alt'?'image-alt':'visible-text');
   });
  }
  if(error)return fail(error);if(h1!==1||bodyCharacters<40)return fail('Every designed page needs one clear H1 and useful source-grounded information, not an empty page.');
 }
 if(wordCharacters>35000)return fail('Prepare a smaller whole-site wording review.');
 for(const pageId of document.removePageIds){
  const page=currentPages.find(page=>page.id===pageId),custom=list(draft.customPages).find(page=>page.id===pageId);
  if(!approvedIntent.allowRetireAiPages||!page||pageId==='home'||pageIds.has(pageId)||custom&&!custom.sourceServiceId&&custom.creativeGenerated!==true||list(page.sectionIds).some(value=>{const section=allSections.find(section=>section.id===value);return locks.locks.includes(value)||editedSection(section);}))return fail('Only unedited engine-generated pages may be retired with explicit owner permission. Existing owner pages and history remain protected.');
 }
 const remaining=currentPages.filter(page=>!document.removePageIds.includes(page.id)&&!pageIds.has(page.id)),resultPageIds=[...remaining.map(page=>page.id),...pageIds];
 if(resultPageIds.length>10||new Set(resultPageIds).size!==resultPageIds.length||!resultPageIds.includes('home')||!exact(document.navigation,['placement','primaryPageId','items'])||!['top','rail','split'].includes(document.navigation.placement)||!Array.isArray(document.navigation.items)||document.navigation.items.length!==resultPageIds.length||new Set(document.navigation.items).size!==resultPageIds.length||document.navigation.items.some(value=>!resultPageIds.includes(value))||document.navigation.primaryPageId!==null&&!resultPageIds.includes(document.navigation.primaryPageId))return fail('Review one coherent original website with up to ten pages and complete safe navigation.');
 for(const page of document.pages)for(const section of page.sections)if(section.nodes)walk(section.nodes,node=>{if(node.type==='link'&&!node.target.contactField){if(!resultPageIds.includes(node.target.pageId))error='An internal link targets a removed or unavailable page.';if(node.target.sectionId){const destination=document.pages.find(page=>page.pageId===node.target.pageId),ids=destination?destination.sections.map(section=>section.id||section.sourceSectionId):list(currentPages.find(page=>page.id===node.target.pageId)?.sectionIds);if(!ids.includes(node.target.sectionId))error='An internal link targets a missing section.';}}});
 if(error)return fail(error);
 for(const brief of document.imageBriefs){if(!exact(brief,['id','role','description'])||!id(brief.id)||!['opening','service','story','atmosphere'].includes(brief.role))return fail('Image suggestions must remain finite, source-grounded and non-executing.');checkCopy(brief.description,null,'metadata');}
 if(error)return fail(error);
 // Hiding the original section does not grant permission to discard its
 // owner-approved wording. Keep it visible verbatim or obtain an exact grant.
 const visibleOriginalIds=new Set(remaining.flatMap(page=>page.sectionIds));
 for(const source of catalog.sources){
  const required=source.ownerProtected===true||!approvedIntent.allowCopySuggestions&&['title','body','cta'].includes(source.field);
  if(source.target?.sectionId&&visibleOriginalIds.has(source.target.sectionId))preservedSourceIds.add(source.id);
  if(!required||approvedIntent.ownerRewriteSourceIds.includes(source.id)||preservedSourceIds.has(source.id))continue;
  if(!copies.some(copy=>copy.classification==='verbatim'&&copy.sourceRefs.some(ref=>ref.id===source.id)&&copy.text.includes(source.text)))return fail('Preserve the owner’s approved wording visibly, or review explicit permission for that exact source before replacing it.');
 }
 const coverage=validateWebsiteCreativeCopyCoverage(draft,visibleCopies,{ownerRewriteSourceIds:approvedIntent.ownerRewriteSourceIds,preservedSourceIds:[...preservedSourceIds]});if(!coverage.ok)return fail(coverage.reason);
 for(const source of catalog.sources.filter(source=>source.ownerProtected&&source.target?.field==='cta'&&!approvedIntent.ownerRewriteSourceIds.includes(source.id)&&!preservedSourceIds.has(source.id))){
  let linked=false;for(const page of document.pages)for(const section of page.sections)if(section.nodes)walk(section.nodes,node=>{if(node.type==='link'&&node.copy?.text===source.text&&list(node.copy.sourceRefs).some(ref=>ref.id===source.id))linked=true;});
  if(!linked)return fail('Keep the owner-approved customer action clickable at its original supported destination, or review permission for that exact action.');
 }
 return {ok:true,document,summary:{pages:resultPageIds.length,designedPages:document.pages.length,newPages:document.pages.filter(page=>!currentPages.some(current=>current.id===page.pageId)).length,nodes:count,copyCharacters:wordCharacters,imageBriefs:document.imageBriefs.length,providerCalls:0},internal:{brand,catalog,provenance,remaining,resultPageIds}};
}

export function compileWebsiteCreativeDocument(draft,document,options={}){
 const checked=validateWebsiteCreativeDocument(draft,document,options);if(!checked.ok)return {...checked,draft};
 const previous=list(draft.sections),existing=list(draft.pages),changedIds=new Set(document.pages.map(page=>page.pageId)),retiredIds=new Set(document.removePageIds),newSections=[],pageRows=[];
 const compileNode=(node,items)=>{
  const result=clone(node);for(const [field,copy] of copyFields(node)){
   const rowId=node.id+(field.startsWith('item-')?'-'+field:'');const validated=validateWebsiteCreativeCopy(draft,copy,{rewriteTargets:options.approvedIntent.ownerRewriteSourceIds.map(id=>checked.internal.catalog.sources.find(source=>source.id===id)?.target).filter(Boolean),forEdit:true});
   items.push({id:rowId,body:copy.text,creativeCopy:{classification:copy.classification,sourceRefs:clone(copy.sourceRefs),provenance:clone(validated.provenance),sourceText:copy.text}});
   if(field==='copy'){delete result.copy;result.copyId=rowId;}else if(field==='alt'){delete result.alt;result.altCopyId=rowId;}
  }
  if(node.type==='list'){delete result.items;result.itemCopyIds=node.items.map((_copy,index)=>node.id+'-item-'+index);}
  if(node.children)result.children=node.children.map(child=>compileNode(child,items));return result;
 };
 for(const page of document.pages){
  const ids=[];for(const section of page.sections){if(section.sourceSectionId){ids.push(section.sourceSectionId);continue;}const items=[],nodes=section.nodes.map(node=>compileNode(node,items));ids.push(section.id);newSections.push({id:section.id,type:'creative-document',enabled:true,pageOnly:true,creativeGenerated:true,title:'Reviewed composition',body:'',items,creativeDocument:{version:WEBSITE_CREATIVE_DOCUMENT_VERSION,scope:sourceScope(draft),layout:clone(section.layout),nodes}});}
  const titleCopy=validateWebsiteCreativeCopy(draft,page.title,{forEdit:true}),descriptionCopy=validateWebsiteCreativeCopy(draft,page.description,{forEdit:true});
  const original=existing.find(current=>current.id===page.pageId),serviceSource=original?.sourceServiceId?{sourceServiceId:original.sourceServiceId,sourceServiceSnapshot:clone(original.sourceServiceSnapshot)}:{};
  pageRows.push({id:page.pageId,title:page.title.text,purpose:page.purpose,description:page.description.text,enabled:true,...pagePath(page.pageId),sectionIds:ids,creativeGenerated:true,...serviceSource,copyMetadata:{title:clone(page.title),description:clone(page.description),titleProvenance:clone(titleCopy.provenance),descriptionProvenance:clone(descriptionCopy.provenance)}});
 }
 const reusedIds=new Set(newSections.map(section=>section.id));
 // Unedited engine-owned sections orphaned by THIS approved replacement can
 // be removed; original fact sections and unrelated owner content stay intact.
 const replacedOldIds=new Set(existing.filter(page=>changedIds.has(page.id)||retiredIds.has(page.id)).flatMap(page=>page.sectionIds));
 const retained=previous.filter(section=>!reusedIds.has(section.id)&&!(ownedSection(section)&&!editedSection(section)&&replacedOldIds.has(section.id)&&!checked.internal.remaining.some(page=>page.sectionIds.includes(section.id))));
 const sections=[...retained,...newSections];if(sections.length>30)return {...fail('This reviewed composition exceeds the original thirty-section capacity. Retire fewer pages or prepare a smaller change.'),draft};
 const customPages=list(draft.customPages).filter(page=>!retiredIds.has(page.id)&&!changedIds.has(page.id));
 for(const page of pageRows.filter(page=>page.id.startsWith('page-')))customPages.push({id:page.id,slug:page.id.slice(5),title:page.title,sectionIds:[...page.sectionIds],creativeGenerated:true,...page.sourceServiceId?{sourceServiceId:page.sourceServiceId,sourceServiceSnapshot:clone(page.sourceServiceSnapshot)}:{}});
 if(customPages.length>8)return {...fail('The original custom-page limit is eight. Existing owner pages were preserved.'),draft};
 const pages=[...checked.internal.remaining.map(clone),...pageRows],navigation=document.navigation.items.map(pageId=>{const page=pages.find(page=>page.id===pageId);return {id:pageId,label:page.title,href:page.path};});
 const metadata={version:WEBSITE_CREATIVE_DOCUMENT_VERSION,scope:sourceScope(draft),pages,navigation,brand:clone(checked.internal.brand),navigationPresentation:{placement:document.navigation.placement,primaryPageId:document.navigation.primaryPageId},imageBriefs:clone(document.imageBriefs),approvedIntent:clone(options.approvedIntent)};
 const next={...draft,siteComposition:'connected-pages-v1',sections,customPages,creativeDocumentPageModel:metadata};
 // A new expressive page supersedes only its own legacy geometric measure.
 // Unrelated approved v1 pages remain byte-for-byte intact and renderable.
 if(draft.creativeSpecification){const kept=list(draft.creativeSpecification.pages).filter(page=>!changedIds.has(page.pageId)&&!retiredIds.has(page.pageId));if(kept.length)next.creativeSpecification={...draft.creativeSpecification,pages:kept};else delete next.creativeSpecification;}
 if(draft.creativeSpecificationSourceOrder){const kept=list(draft.creativeSpecificationSourceOrder).filter(page=>!changedIds.has(page.pageId)&&!retiredIds.has(page.pageId));if(kept.length)next.creativeSpecificationSourceOrder=kept;else delete next.creativeSpecificationSourceOrder;}
 const protectedResult=protectWebsiteOwnerLocks(draft,{applied:true,draft:next});if(!protectedResult.applied)return {...fail(protectedResult.reason),draft};
 if(websiteCreativeDocumentPageModel(draft)&&same(presentationIdentity(draft),presentationIdentity(next)))return {...fail('This proposal leaves the reviewed website unchanged. No new design or save was prepared.'),draft};
 if(same(draft.creativeDocumentPageModel,metadata)&&same(draft.sections,sections)&&same(draft.customPages,customPages))return {...fail('This exact creative document is already present. Nothing changed.'),draft};
 return {ok:true,applied:true,draft:next,summary:checked.summary,reason:'Prepared an expressive, source-grounded website in the original Studio. New words are reviewable presentation copy, never verified business facts.'};
}

function currentCompiledCopy(draft,copy,provenance){
 if(!exact(copy,['text','classification','sourceRefs'])||!websiteCreativeCopyProvenanceCurrent(draft,provenance)||copy.classification!==provenance.classification||!Array.isArray(copy.sourceRefs)||copy.sourceRefs.length!==provenance.sources.length||copy.sourceRefs.some(ref=>!exact(ref,['id','revision'])))return false;
 const refs=copy.sourceRefs.map(ref=>({id:ref?.id,revision:ref?.revision})),original=provenance.sources.map(source=>({id:source.id,revision:source.revision}));
 if(!same(refs,original))return false;
 // Historical generation is accepted only AFTER every original scope/value
 // and exact record/photo revision above has independently remained current.
 const catalog=websiteCreativeCopyCatalog(draft);if(!catalog.ok)return false;
 const normalized={text:copy.text,classification:copy.classification,sourceRefs:refs.map(ref=>{const source=catalog.sources.find(source=>source.id===ref.id);return {id:ref.id,revision:source?.revision};})};
 return validateWebsiteCreativeCopy(draft,normalized,{forEdit:false}).ok===true;
}
function resolveCompiledNode(draft,section,node){
 const result=clone(node),rowFor=rowId=>list(section.items).find(row=>row.id===rowId);
 const resolve=rowId=>{const row=rowFor(rowId);if(!row||!object(row.creativeCopy))return null;const owner=row.creativeCopy.classification==='owner-authored'&&list(row.ownerEditedFields).includes('body');if(owner?(typeof row.body!=='string'||!row.body.trim()||row.body.length>2500||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(row.body)):!plain(row.body,2500))return null;const copy={text:row.body,classification:row.creativeCopy.classification,sourceRefs:row.creativeCopy.sourceRefs};if(!owner&&(row.body!==row.creativeCopy.sourceText||!currentCompiledCopy(draft,copy,row.creativeCopy.provenance)))return null;return {text:row.body,classification:owner?'owner-authored':row.creativeCopy.classification,sourceRefs:clone(row.creativeCopy.sourceRefs)};};
 if(node.copyId){result.copy=resolve(node.copyId);if(!result.copy)return null;}
 if(node.altCopyId){result.alt=resolve(node.altCopyId);if(!result.alt)return null;}
 if(node.itemCopyIds){result.items=node.itemCopyIds.map(resolve);if(result.items.some(copy=>!copy))return null;}
 if(node.type==='image'&&!websiteCreativeDocumentAsset(draft,node.asset))return null;
 if(node.children){result.children=node.children.map(child=>resolveCompiledNode(draft,section,child));if(result.children.some(child=>!child))return null;}
 return result;
}
export function websiteCreativeDocumentSection(draft,section){
 const document=section?.creativeDocument,metadata=draft?.creativeDocumentPageModel;
 if(!ownedSection(section)||!document||document.version!==WEBSITE_CREATIVE_DOCUMENT_VERSION||!same(document.scope,sourceScope(draft))||!metadata||metadata.version!==WEBSITE_CREATIVE_DOCUMENT_VERSION||!same(metadata.scope,sourceScope(draft))||metadata.brand!==null&&!validateBrand(metadata.brand)||!websiteCreativeSourcesCurrent(draft)||!Array.isArray(document.nodes)||!document.nodes.length)return null;
 if(!safeCompiledLayout(document.layout,metadata.brand)||document.nodes.length>24)return null;
 let invalid=false,count=0;const ids=new Set();walk(document.nodes,(node,depth)=>{count++;if(depth>4||count>180||!safeCompiledNode(node,metadata.brand)||ids.has(node?.id))invalid=true;ids.add(node?.id);});if(invalid)return null;
 const nodes=document.nodes.map(node=>resolveCompiledNode(draft,section,node));if(nodes.some(node=>!node))return null;
 return {layout:clone(document.layout),nodes,brand:clone(metadata.brand)};
}
export function websiteCreativeDocumentCopyRole(draft,section,itemId){
 const document=websiteCreativeDocumentSection(draft,section);if(!document||!id(itemId))return null;
 let role=null;walk(document.nodes,node=>{if(node.copyId===itemId)role=['heading','text','link'].includes(node.type)?node.type:null;if(node.altCopyId===itemId)role='image-alt';if(list(node.itemCopyIds).includes(itemId))role='list-item';});return role;
}
// Called only AFTER an original validated owner layout operation. A stored
// creative brand cannot silently overrule a later authorised owner action.
export function reconcileWebsiteCreativeBrand(draft,result,operation){
 if(!result?.applied||!draft.creativeDocumentPageModel?.brand)return result;
 const colourChange=operation?.action==='brand-colour',fontChange=operation?.action==='style'&&operation.field==='typography';
 if(!colourChange&&!fontChange)return result;
 if(!websiteCreativeDocumentPageModel(draft))return {applied:false,draft,reason:'Review the current creative website sources before changing its active brand.'};
 const brand=clone(draft.creativeDocumentPageModel.brand);
 if(colourChange)brand.palette.accent=result.draft.theme.primary;
 if(fontChange){
  if(['refined','editorial'].includes(operation.value))brand.headingFont='georgia';
  else if(['confident','friendly'].includes(operation.value))brand.headingFont='system-sans';
  else return {applied:false,draft,reason:'Use the original section heading-size controls for this expressive website. Its reviewed typography was kept.'};
 }
 if(!validateBrand(brand))return {applied:false,draft,reason:'This owner-selected brand combination needs a readable foreground and background. Review accessible colours before applying it.'};
 return {...result,draft:{...result.draft,creativeDocumentPageModel:{...result.draft.creativeDocumentPageModel,brand}}};
}
function safeCompiledLayout(layout,brand){return exact(layout,['maxWidth','paddingX','paddingY','mobilePaddingX','mobilePaddingY','gap','background'])&&number(layout.maxWidth,640,1440)&&number(layout.paddingX,16,96)&&number(layout.paddingY,16,128)&&number(layout.mobilePaddingX,16,32)&&number(layout.mobilePaddingY,16,64)&&number(layout.gap,8,64)&&!!creativeDocumentColours(brand,layout.background);}
function safeCompiledNode(node,brand){
 if(!object(node)||!id(node.id))return false;const base=['id','type'];
 if(node.type==='heading')return exact(node,[...base,'copyId','level','size','mobileSize','align'])&&id(node.copyId)&&[1,2,3].includes(node.level)&&number(node.size,24,112)&&number(node.mobileSize,24,56)&&['start','center'].includes(node.align);
 if(node.type==='text')return exact(node,[...base,'copyId','size','measure'])&&id(node.copyId)&&number(node.size,16,24)&&number(node.measure,24,75);
 if(node.type==='image')return exact(node,[...base,'asset','altCopyId','ratio','fit','focal'])&&id(node.altCopyId)&&number(node.ratio,0.5,2.5)&&['cover','contain'].includes(node.fit)&&exact(node.focal,['x','y'])&&number(node.focal.x,0,100)&&number(node.focal.y,0,100);
 if(node.type==='link')return exact(node,[...base,'copyId','target','presentation'])&&id(node.copyId)&&exact(node.target,['pageId','sectionId','contactField'])&&(node.target.pageId===null||id(node.target.pageId))&&(node.target.sectionId===null||id(node.target.sectionId))&&[null,'email','phone'].includes(node.target.contactField)&&['text','button'].includes(node.presentation);
 if(node.type==='list')return exact(node,[...base,'itemCopyIds','ordered'])&&Array.isArray(node.itemCopyIds)&&node.itemCopyIds.length>0&&node.itemCopyIds.length<=12&&new Set(node.itemCopyIds).size===node.itemCopyIds.length&&node.itemCopyIds.every(id)&&typeof node.ordered==='boolean';
 if(node.type==='divider')return exact(node,[...base,'weight'])&&[1,2,3].includes(node.weight);
 if(!Array.isArray(node.children)||!node.children.length||node.children.length>12)return false;
 if(node.type==='stack')return exact(node,[...base,'gap','children'])&&number(node.gap,8,64);
 if(node.type==='group')return exact(node,[...base,'padding','background','children'])&&number(node.padding,12,64)&&!!creativeDocumentColours(brand,node.background);
 return node.type==='grid'&&exact(node,[...base,'columns','gap','mobileColumns','mobileGap','align','children'])&&Array.isArray(node.columns)&&node.columns.length>=2&&node.columns.length<=3&&node.columns.every(value=>number(value,1,12))&&number(node.gap,8,64)&&[1,2].includes(node.mobileColumns)&&number(node.mobileGap,8,32)&&['start','center','end'].includes(node.align)&&node.children.length>=2&&node.children.length<=6;
}
export function websiteCreativeDocumentPageModel(draft){
 const metadata=draft?.creativeDocumentPageModel;if(!metadata||metadata.version!==WEBSITE_CREATIVE_DOCUMENT_VERSION||!same(metadata.scope,sourceScope(draft))||!Array.isArray(metadata.pages)||!metadata.pages.length||metadata.pages.length>10||metadata.brand!==null&&!validateBrand(metadata.brand)||!websiteCreativeSourcesCurrent(draft))return null;
 const sections=list(draft.sections),seen=new Set(),pages=[];
 for(const stored of metadata.pages){
  if(!id(stored.id)||seen.has(stored.id)||!plain(stored.title,80)||!Array.isArray(stored.sectionIds)||!stored.sectionIds.length||!same(pagePath(stored.id),{path:stored.path,outputPath:stored.outputPath}))return null;seen.add(stored.id);
  const custom=list(draft.customPages).find(page=>page.id===stored.id),sectionIds=custom?.sectionIds||stored.sectionIds;
  if(stored.creativeGenerated){
   const metadata=stored.copyMetadata,ownerSeo=draft.seo?.ownerPages?.[stored.id];
   const originalTitleInUse=!custom||custom.title===stored.title,originalDescriptionInUse=!ownerSeo?.description||ownerSeo.description===stored.description;
   if(!metadata||originalTitleInUse&&(!currentCompiledCopy(draft,metadata.title,metadata.titleProvenance)||metadata.title?.text!==stored.title)||originalDescriptionInUse&&(!currentCompiledCopy(draft,metadata.description,metadata.descriptionProvenance)||metadata.description?.text!==stored.description))return null;
  }
  if(new Set(sectionIds).size!==sectionIds.length||sectionIds.some(id=>!sections.some(section=>section.id===id&&section.enabled!==false)))return null;
  if(sectionIds.some(id=>{const section=sections.find(section=>section.id===id);return ownedSection(section)&&!websiteCreativeDocumentSection(draft,section);}))return null;
  pages.push({...clone(stored),...(custom?{title:custom.title,sectionIds:[...sectionIds]}:{})});
 }
 if(!seen.has('home')||!Array.isArray(metadata.navigation)||metadata.navigation.length!==pages.length||new Set(metadata.navigation.map(item=>item.id)).size!==pages.length||metadata.navigation.some(item=>!seen.has(item.id))||!exact(metadata.navigationPresentation,['placement','primaryPageId'])||!['top','rail','split'].includes(metadata.navigationPresentation.placement)||metadata.navigationPresentation.primaryPageId!==null&&!seen.has(metadata.navigationPresentation.primaryPageId))return null;
 const navigation=metadata.navigation.map(item=>{const page=pages.find(page=>page.id===item.id);return {id:page.id,label:page.title,href:page.path};});
 const ownerPages={...draft.seo?.ownerPages};for(const page of pages)if(page.creativeGenerated&&!ownerPages[page.id])ownerPages[page.id]={title:(page.title+' | '+draft.businessName).slice(0,70),description:page.description};
 return {version:WEBSITE_CREATIVE_DOCUMENT_VERSION,pages,navigation,brand:clone(metadata.brand),navigationPresentation:clone(metadata.navigationPresentation),seo:{...draft.seo,ownerPages}};
}
