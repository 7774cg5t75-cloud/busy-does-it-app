import {websiteCreativeCopyCatalog} from '../../supabase/functions/busy-website-worker/websiteCreativeCopy.mjs';
import {validateWebsiteCreativeDocument} from '../../supabase/functions/busy-website-worker/websiteCreativeDocument.mjs';
import {mission19Sites} from './mission19-site-fixtures.mjs';

// Deliberately authored OFFLINE response fixtures, not model output, new
// canonical business facts, a second renderer or production industry templates.
// These exercise the open bounded document grammar with contrasting art direction.
export function mission19CreativeFixture(index,context){
 const site=mission19Sites[index],draft=context.website,catalog=websiteCreativeCopyCatalog(draft);if(!catalog.ok)throw Error(catalog.reason);
 const source=id=>{const value=catalog.sources.find(source=>source.id===id);if(!value)throw Error('Missing current original source '+id);return value;};
 const exact=id=>{const value=source(id);return {text:value.text,classification:'verbatim',sourceRefs:[{id:value.id,revision:value.revision}]};};
 const derived=(text,ids=['business:description'])=>({text,classification:'derived',sourceRefs:ids.map(id=>{const value=source(id);return {id:value.id,revision:value.revision};})});
 const first=id=>derived(source(id).text.split(/\n\s*\n/)[0],[id]),sentence=id=>derived(source(id).text.split(/(?<=[.!?])\s/)[0],[id]);
 let serial=0;const identity=()=>site.id+'-node-'+(++serial);
 const heading=(copy,level=2,size=48,align='start')=>({id:identity(),type:'heading',copy,level,size,mobileSize:Math.min(size,[46,52,56,54][index]),align});
 const text=(copy,size=18,measure=60)=>({id:identity(),type:'text',copy,size,measure});
 const link=(copy,pageId,presentation='text',contactField=null)=>({id:identity(),type:'link',copy,target:{pageId:contactField?null:pageId,sectionId:null,contactField},presentation});
 const stack=(children,gap=24)=>({id:identity(),type:'stack',gap,children});
 const grid=(children,columns=[1,1],gap=40,align='start')=>({id:identity(),type:'grid',columns,gap,mobileColumns:children.every(child=>child.type==='link')?2:1,mobileGap:children.every(child=>child.type==='link')?12:index===2?32:24,align,children});
 const group=(children,background='paper',padding=32)=>({id:identity(),type:'group',padding,background,children});
 const rule=(weight=1)=>({id:identity(),type:'divider',weight});
 const list=(items,ordered=false)=>({id:identity(),type:'list',items,ordered});
 const photo=(which,ratio)=>{const asset=context.sourcePhotos[which],original=draft.sections.flatMap(section=>section.type==='gallery'?section.items||[]:section.asset?[section.asset]:[]).find(value=>value.sha256===asset.sha256);if(!original)throw Error('Missing exact approved original photo');return {id:identity(),type:'image',asset:{storagePath:original.storagePath,revision:original.revision,sha256:original.sha256},alt:exact('photo:'+original.sha256+':alt'),ratio,fit:'cover',focal:{x:50,y:50}};};
 let sectionSerial=0;
 const section=(nodes,background='paper',options={})=>({id:'custom-creative-'+site.id+'-'+(++sectionSerial),layout:{maxWidth:options.maxWidth||1240,paddingX:options.paddingX||40,paddingY:options.paddingY||72,mobilePaddingX:index===2?24:18,mobilePaddingY:options.mobilePaddingY||[40,40,56,32][index],gap:options.gap||32,background},nodes});
 const page=(pageId,title,purpose,description,sections)=>({pageId,title,purpose,description,sections});
 const services=draft.sections.find(section=>section.id==='services').items;
 const service=(n,field)=>exact('service:services:'+services[n].id+':'+field);
 const serviceFirst=n=>first('service:services:'+services[n].id+':body');
 const about=exact('section:about:body'),intro=exact('business:description'),tagline=exact('section:hero:body'),cta=exact('section:hero:cta'),area=exact('business:serviceArea'),email=exact('section:contact:email');
 const pageTitle=word=>derived(word,['business:name']);
 const aboutDescription=derived('Read the ideas and working approach behind '+site.name+'.',['business:name','section:about:body']);
 const contactDescription=derived('Start a conversation with '+site.name+' about your plans and the next practical step.',['business:name','business:description']);
 const serviceDescription=derived('Explore '+site.name+' services and the information useful for a first conversation.',['business:name','business:description']);
 const contactAction=()=>link(cta,'contact','button');
 const emailAction=()=>link(derived('Email '+site.name,['business:name']),null,'button','email');
 const approvedIntent={version:'busy.website-creative-intent.v1',allowCopySuggestions:true,allowBrandChange:true,allowNewPages:true,allowRetireAiPages:true,ownerRewriteSourceIds:[]};
 let brand,pages,navigation;
 if(index===0){
  brand={headingFont:'georgia',bodyFont:'system-sans',palette:{ink:'#153A32',paper:'#F6F5ED',accent:'#2E5F46',muted:'#4D6258'},gradient:{from:'#E3EBD8',to:'#F6F5ED',angle:135}};
  pages=[
   page('home',pageTitle('Home'),'home',intro,[
    section([grid([stack([text(derived('Landscaping in Devon',['business:type','business:serviceArea']),16,36),heading(tagline,1,92),text(intro,20,48),contactAction()],28),stack([photo(0,1.05),text(exact('photo:'+context.sourcePhotos[0].sha256+':alt'),16,54)],16)],[6,5],56,'center')],'gradient',{paddingY:88}),
    section([grid([stack([heading(derived('A garden for everyday life.',['section:about:body']),2,54),text(first('section:about:body'),19,46),link(pageTitle('Our approach'),'about')]),stack([heading(service(0,'title'),3,32),text(serviceFirst(0),18,55),link(service(0,'title'),'page-garden-maintenance'),rule(),heading(service(1,'title'),3,32),text(serviceFirst(1),18,55),link(pageTitle('Explore the services'),'services')])],[5,6],64)],'paper'),
    section([grid([heading(derived('Room to grow starts with a conversation.',['section:hero:body','section:about:body']),2,56),stack([text(derived('Tell us about the space, the priorities and what you would like to change.',['section:about:body','service:services:service-2:body']),20,45),link(cta,'contact','button')])],[6,4],48)],'ink',{paddingY:64})
   ]),
   page('services',pageTitle('Services'),'services',serviceDescription,[
    section([text(area,16,40),heading(derived('Care, planting and a considered plan.',['business:description']),1,84),text(intro,21,58)],'gradient'),
    section([grid(services.slice(0,3).map((item,n)=>stack([heading(service(n,'title'),2,38),text(service(n,'body'),17,55),...(n===0?[link(service(n,'title'),'page-garden-maintenance')]:[])],24)),[1,1,1],40)],'paper',{paddingY:64}),
    section([grid(services.slice(3).map((item,n)=>stack([heading(service(n+3,'title'),2,36),text(service(n+3,'body'),18,58)],24)),[1,1],64),link(cta,'contact','button')],'ink',{paddingY:64})
   ]),
   page('about',pageTitle('Our approach'),'about',aboutDescription,[
    section([heading(derived('Start with the way you live outside.',['section:about:body']),1,88),grid([text(about,22,46),stack([photo(1,1.15),text(exact('photo:'+context.sourcePhotos[1].sha256+':alt'),16,54)],16)],[6,5],64,'center')],'paper',{paddingY:88}),
    section([heading(derived('The space comes first.',['section:about:body']),2,54),text(derived('Listen to the priorities. Look at the conditions. Discuss a practical plan.',['section:about:body']),22,55),link(cta,'contact','button')],'gradient')
   ]),
   page('contact',pageTitle('Discuss your garden'),'contact',contactDescription,[
    section([grid([heading(derived('What would you like your garden to become?',['section:about:body','service:services:service-2:body']),1,88),stack([text(first('service:services:service-4:body'),21,48),text(area,18,42),emailAction(),text(email,17,55)],28)],[6,4],64,'center')],'ink',{paddingY:96})
   ]),
   page('page-garden-maintenance',service(0,'title'),'service-detail',sentence('service:services:service-0:body'),[
    section([text(derived('Care for the garden you have.',['service:services:service-0:body']),18,48),heading(service(0,'title'),1,88),text(service(0,'body'),22,58)],'gradient',{maxWidth:1100,paddingY:88}),
    section([grid([heading(derived('Bring the priorities into focus.',['service:services:service-0:body']),2,52),stack([text(first('section:about:body'),19,52),link(cta,'contact','button'),link(pageTitle('All services'),'services')])],[5,5],64)],'paper')
   ])
  ];navigation={placement:'top',primaryPageId:'contact',items:['home','services','about','page-garden-maintenance','contact']};
 }else if(index===1){
  brand={headingFont:'georgia',bodyFont:'trebuchet',palette:{ink:'#3D211D',paper:'#FFF4E6',accent:'#A93323',muted:'#74534A'},gradient:{from:'#FFE2BB',to:'#FFF4E6',angle:110}};
  pages=[
   page('home',pageTitle('Home'),'home',intro,[
    section([grid([stack([text(exact('business:type'),17,38),heading(tagline,1,96),text(intro,21,48),grid([link(derived('Explore the menu',['section:products:title']),'products','button'),contactAction()],[1,1],24)],28),stack([photo(0,.92),text(exact('photo:'+context.sourcePhotos[0].sha256+':alt'),16,54)],16)],[6,5],48,'center')],'ink',{paddingY:88}),
    section([heading(exact('section:products:title'),2,64),grid([stack([heading(exact('record:products:menu_roast_bowl:name'),3,34),text(exact('record:products:menu_roast_bowl:description'),21,48)]),stack([heading(exact('record:products:menu_sharing_buffet:name'),3,34),text(exact('record:products:menu_sharing_buffet:description'),21,48)])],[1,1],56),link(derived('Explore the menu',['section:products:title']),'products')],'gradient',{paddingY:72}),
    section([grid([heading(derived('The gathering sets the direction.',['section:about:body']),2,64),stack([text(first('section:about:body'),22,48),link(derived('How we shape the food conversation',['section:about:body']),'about'),link(cta,'contact','button')])],[1,1],64)],'paper')
   ]),
   page('products',derived('Menu',['section:products:title']),'menu',derived('Explore festival plates and the sharing-buffet menu from Ember Festival Kitchen.',['section:products:title','business:name','record:products:menu_roast_bowl:category','record:products:menu_sharing_buffet:category']),[
    section([text(tagline,19,52),heading(derived('Food worth gathering around.',['section:products:title','section:about:body']),1,96),text(derived('Bright vegetables, warm bowls and dishes passed around a table.',['section:about:body']),23,56)],'gradient',{paddingY:72}),
    {sourceSectionId:'products'},
    section([grid([heading(derived('Bring the setting, people and food together.',['service:services:service-2:body']),2,58),stack([text(serviceFirst(2),20,52),contactAction()])],[6,5],56)],'ink',{paddingY:64})
   ]),
   page('about',pageTitle('The gathering'),'about',aboutDescription,[
    section([heading(derived('A menu begins with people.',['section:about:body']),1,96),text(about,24,58)],'paper',{maxWidth:1120,paddingY:88}),
    section([grid([photo(1,1.15),stack([heading(service(1,'title'),2,58),text(service(1,'body'),21,48),text(exact('photo:'+context.sourcePhotos[1].sha256+':alt'),16,48),link(cta,'contact','button')])],[6,5],56,'center')],'gradient',{paddingY:72})
   ]),
   page('contact',cta,'contact',contactDescription,[
    section([heading(derived('Tell us about your gathering.',['section:about:body']),1,100),grid([stack([text(serviceFirst(2),23,48),text(area,18,36)]),stack([heading(derived('The useful details',['service:services:service-1:body']),2,36),text(derived('Guest numbers, venue information and food preferences are a useful starting point.',['service:services:service-1:body']),21,48),emailAction(),text(email,17,52)])],[6,5],64)],'ink',{paddingY:88})
   ])
  ];navigation={placement:'split',primaryPageId:'products',items:['home','products','about','contact']};
 }else if(index===2){
  brand={headingFont:'system-sans',bodyFont:'georgia',palette:{ink:'#172B33',paper:'#F6F3E8',accent:'#203C48',muted:'#586268'},gradient:{from:'#E9E1CE',to:'#F6F3E8',angle:125}};
  pages=[
   page('home',pageTitle('Home'),'home',intro,[
    section([text(exact('business:type'),16,48),heading(tagline,1,112),grid([text(intro,24,38),stack([rule(2),text(derived('Conversation. A considered direction. Purposeful refinement.',['section:about:body']),23,40),emailAction()],28)],[7,5],64,'end')],'ink',{paddingY:96}),
    section([grid([stack([text(derived('Work with a clear purpose.',['section:about:body']),18,36),heading(service(0,'title'),2,64),text(serviceFirst(0),20,48),link(service(0,'title'),'page-brand-direction')]),stack([heading(service(1,'title'),2,42),text(serviceFirst(1),19,48),rule(2),heading(service(2,'title'),2,42),text(serviceFirst(2),19,48),link(pageTitle('Explore the services'),'services')])],[6,5],64)],'paper',{paddingY:88}),
    section([heading(derived('Clarity comes before decoration.',['section:about:body']),2,72),grid([text(first('section:about:body'),22,42),stack([text(derived('Your approval remains part of every important decision.',['section:about:body']),21,44),link(pageTitle('Our approach'),'about'),link(cta,'contact','button')])],[6,5],56)],'gradient',{paddingY:80})
   ]),
   page('services',pageTitle('What we can work on'),'services',serviceDescription,[
    section([heading(derived('A considered direction. A clearer story.',['business:description','section:about:body']),1,96),text(intro,24,52)],'paper',{paddingY:88}),
    section([grid([heading(service(0,'title'),2,70),stack([text(service(0,'body'),21,52),link(service(0,'title'),'page-brand-direction')])],[5,6],64)],'ink'),
    section([grid([group([heading(service(1,'title'),2,44),text(service(1,'body'),20,48)],'paper',40),group([heading(service(2,'title'),2,44),text(service(2,'body'),20,48)],'paper',40)],[1,1],32),contactAction()],'gradient',{paddingY:72})
   ]),
   page('about',pageTitle('A clear approach'),'about',aboutDescription,[
    section([text(exact('business:name'),17,36),heading(derived('Understand first. Make with purpose.',['section:about:body']),1,104),grid([text(about,24,48),stack([rule(2),heading(derived('The decisions that matter',['service:services:service-0:body']),2,42),list([derived('Start with what you want people to understand.',['section:about:body']),derived('Work with the material and business facts you supply.',['section:about:body','service:services:service-1:body']),derived('Refine a considered direction purposefully.',['section:about:body'])],true)],32)],[7,4],64)],'gradient',{paddingY:96}),
    section([heading(derived('Bring the questions.',['section:about:body']),2,72),contactAction()],'ink',{paddingY:72})
   ]),
   page('contact',cta,'contact',contactDescription,[
    section([text(area,17,45),heading(derived('A useful conversation is a good beginning.',['section:about:body']),1,104),grid([text(derived('Bring the material you already have and the questions you are trying to answer.',['section:about:body']),24,44),stack([emailAction(),text(email,18,50),text(derived('Your next decisions remain yours.',['section:about:body']),20,44)])],[6,5],64)],'ink',{paddingY:104})
   ]),
   page('page-brand-direction',service(0,'title'),'service-detail',sentence('service:services:service-0:body'),[
    section([text(derived('A starting point for your identity.',['service:services:service-0:body']),18,45),heading(service(0,'title'),1,108),text(service(0,'body'),24,54)],'paper',{paddingY:96}),
    section([grid([heading(derived('Bring what you already have.',['service:services:service-0:body']),2,64),stack([text(derived('Existing material, references you are allowed to share, and the questions that need a decision.',['service:services:service-0:body']),22,48),contactAction(),link(pageTitle('All services'),'services')])],[6,5],64)],'gradient',{paddingY:80})
   ])
  ];navigation={placement:'rail',primaryPageId:'contact',items:['home','services','page-brand-direction','about','contact']};
 }else{
  brand={headingFont:'trebuchet',bodyFont:'verdana',palette:{ink:'#142938',paper:'#F7F6EC',accent:'#DEFF4F',muted:'#4A5C67'},gradient:{from:'#DEFF4F',to:'#F7F6EC',angle:135}};
  pages=[
   page('home',pageTitle('Home'),'home',intro,[
    section([text(derived('Courtyards · containers · Bristol',['business:type','business:serviceArea']),17,56),heading(tagline,1,112),grid([text(intro,24,40),group([heading(derived('Start with what is already there.',['section:about:body']),2,40),text(first('section:about:body'),20,48),contactAction()],'ink',40)],[6,5],48,'center')],'accent',{paddingY:88}),
    section([grid([stack([heading(service(0,'title'),2,60),text(serviceFirst(0),21,44)]),stack([heading(service(1,'title'),2,40),text(serviceFirst(1),19,48),rule(2),heading(service(2,'title'),2,40),text(serviceFirst(2),19,48),link(pageTitle('Find your starting point'),'services')])],[5,6],64)],'paper',{paddingY:80}),
    section([heading(derived('A small space, shaped around everyday life.',['section:about:body']),2,64),text(derived('Light, access, existing plants and the care you want to take on.',['section:about:body']),22,54),link(pageTitle('How we approach it'),'about')],'ink',{paddingY:64})
   ]),
   page('services',pageTitle('Your starting point'),'services',serviceDescription,[
    section([heading(derived('Pots. Planting. Possibility.',['business:description','section:about:body']),1,104),text(intro,24,48)],'accent',{paddingY:80}),
    ...services.map((item,n)=>section([grid([heading(service(n,'title'),2,n===0?64:48),text(service(n,'body'),22,52)],[4,7],64)],n===1?'ink':'paper',{paddingY:n===1?80:56})),
    section([heading(derived('Which part of your space are you thinking about?',['section:about:body']),2,48),contactAction()],'gradient',{paddingY:56})
   ]),
   page('about',pageTitle('Small-space thinking'),'about',aboutDescription,[
    section([heading(derived('Everyday life belongs outside, too.',['section:about:body']),1,100),grid([text(about,24,52),group([heading(derived('The first conversation',['section:about:body']),2,38),list([derived('Light and access.',['section:about:body']),derived('The plants and containers you have.',['section:about:body']),derived('The care you want to take on.',['section:about:body'])],false)],'ink',36)],[7,4],56)],'gradient',{paddingY:88}),
    section([heading(derived('Keep it practical. Make it yours.',['section:about:body']),2,64),link(cta,'contact','button')],'paper',{paddingY:64})
   ]),
   page('contact',cta,'contact',contactDescription,[
    section([heading(derived('Tell us about your corner of outside.',['section:about:body']),1,100),grid([stack([text(first('section:about:body'),23,48),text(area,18,40)]),group([heading(derived('Bring the space into focus.',['section:about:body']),2,42),text(derived('The light, access, plants, pots and the way you would like to use the space.',['section:about:body']),21,48),emailAction(),text(email,17,52)],'paper',40)],[6,5],56,'center')],'ink',{paddingY:88})
   ])
  ];navigation={placement:'split',primaryPageId:'services',items:['home','services','contact','about']};
 }
 const retained=new Set(pages.map(page=>page.pageId)),document={version:'busy.website-creative-document.v2',brand,pages,navigation,removePageIds:draft.pages.filter(page=>page.enabled!==false&&!retained.has(page.id)).map(page=>page.id),imageBriefs:[]};
 const checked=validateWebsiteCreativeDocument(draft,document,{approvedIntent,forEdit:true});if(!checked.ok)throw Error(site.name+': '+checked.reason);
 return {document,approvedIntent,summary:checked.summary,origin:'deterministic-offline-fixture',genuineModelResult:false,copyReview:'Human-authored source-grounded wording and visual document supplied as an explicitly approved fictional offline fixture; references are not independent entailment proof.'};
}
