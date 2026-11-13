// Shared finite typography for selected section headings and primary paragraphs.
// No downloadable fonts, arbitrary CSS, inline styles or business-record edits.
const textTypes={title:['hero','services','about','text','photo-feature','gallery','faq','testimonials','contact','creative-document'],
 body:['hero','about','text','photo-feature','creative-document']};
const choices={Font:['brand','sans','serif','mono'],Weight:['brand','regular','medium','bold','heavy'],
 Leading:['brand','standard','relaxed'],Align:['brand','left','center','right'],Colour:['brand','ink','accent']};
const textTypographyFields={},textTypographySupports={};
for(const target of Object.keys(textTypes))for(const suffix of Object.keys(choices)){
 textTypographyFields[target+suffix]=choices[suffix];textTypographySupports[target+suffix]=textTypes[target];
}
const bodySizes=['brand','normal','large','extra-large'];
for(const field of ['bodySize','mobileBodySize','desktopBodySize']){textTypographyFields[field]=bodySizes;textTypographySupports[field]=textTypes.body;}
function textTypographyClasses(section){
 return Object.keys(textTypographyFields).filter(field=>textTypographySupports[field].includes(section?.type)&&
  textTypographyFields[field].includes(section?.appearance?.[field])&&section.appearance[field]!=='brand')
  .map(field=>'owner-text-'+field+'-'+section.appearance[field]).join(' ');
}
const fonts={sans:'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
 serif:'Georgia,"Times New Roman",serif',mono:'ui-monospace,SFMono-Regular,Consolas,monospace'};
const weights={regular:400,medium:500,bold:700,heavy:800};
let textTypographyCss='';
for(const target of Object.keys(textTypes))for(const suffix of Object.keys(choices))for(const value of choices[suffix]){
 if(value==='brand')continue;
 const selector=target==='title'?':is(h1,h2)':':is(.hero-content > .lead,.wrap > p,.photo-feature-grid > div > p,.story-copy > p,.crafted-contact-heading > p)';
 const declaration=suffix==='Font'?'font-family:'+fonts[value]:suffix==='Weight'?'font-weight:'+weights[value]:
  suffix==='Align'?'text-align:'+value:suffix==='Colour'?'color:var(--owner-text-'+value+')':'line-height:'+(target==='title'?(value==='relaxed'?1.4:1.15):(value==='relaxed'?1.85:1.6));
 // Heading/primary-paragraph scope excludes card text, navigation and facts.
 textTypographyCss+='section.owner-text-'+target+suffix+'-'+value+' '+selector+'{'+declaration+'}\n';
 textTypographyCss+='article.owner-text-'+target+suffix+'-'+value+' > '+(target==='title'?'h3':'p')+'{'+declaration+'}\n';
}
// Disclosure wrappers preserve existing individual question/answer styles.
textTypographyCss+=textTypographyCss.replaceAll(' > h3',' > details > summary > h3').replaceAll(' > p',' > details > p');
// These are relative, wrapping presets for the selected primary/card text.
// Explicit phone/desktop choices take precedence over the all-width preset.
for(const [field,media]of [['bodySize',''],['mobileBodySize','(max-width:600px)'],['desktopBodySize','(min-width:1000px)']]){
 let rules='';
 for(const [value,size]of [['normal','1rem'],['large','1.125rem'],['extra-large','1.25rem']])
  rules+='section.owner-text-'+field+'-'+value+' :is(.hero-content > .lead,.wrap > p,.photo-feature-grid > div > p,.story-copy > p,.crafted-contact-heading > p),article.owner-text-'+field+'-'+value+' :is(p,details > p){font-size:'+size+';overflow-wrap:anywhere}\n';
 textTypographyCss+=media?'@media'+media+'{'+rules+'}':rules;
}
function itemTypographyClasses(item){return textTypographyClasses({type:'text',appearance:item?.appearance});}
// Trusted projection for the original declarative composition section. It
// reuses the SAME finite owner typography choices; model styles cannot replace
// an owner's explicit font, weight, leading, alignment or responsive size.
function websiteOwnerTextPresentation(section,target='body',level=2){
 const a=section?.appearance||{},base=/** @type {Record<string,any>} */({}),mobile=/** @type {Record<string,any>} */({}),desktop=/** @type {Record<string,any>} */({});
 if(!['title','body'].includes(target))return {base,mobile,desktop};
 const font=a[target+'Font'],weight=a[target+'Weight'],align=a[target+'Align'],leading=a[target+'Leading'],colour=a[target+'Colour'];
 if(fonts[font])base.fontFamily=fonts[font];if(weights[weight])base.fontWeight=weights[weight];
 if(['left','center','right'].includes(align))base.textAlign=align;
 else if(a.textAlign==='center')base.textAlign='center';
 if(['standard','relaxed'].includes(leading))base.lineHeight=target==='title'?(leading==='relaxed'?1.4:1.15):(leading==='relaxed'?1.85:1.6);
 if(['ink','accent'].includes(colour))base.colourRole=colour;
 const bodySizes={normal:'1rem',large:'1.125rem','extra-large':'1.25rem'};
 if(target==='body'){
  if(a.bodyScale==='large')base.fontSize='1.125rem';if(a.mobileBodyScale==='large')mobile.fontSize='1.125rem';if(a.desktopBodyScale==='large')desktop.fontSize='1.125rem';
  if(bodySizes[a.bodySize])base.fontSize=bodySizes[a.bodySize];if(bodySizes[a.mobileBodySize])mobile.fontSize=bodySizes[a.mobileBodySize];if(bodySizes[a.desktopBodySize])desktop.fontSize=bodySizes[a.desktopBodySize];
 }else{
  if(a.headingScale==='compact')base.fontSize='clamp(1.6rem,3vw,2.8rem)';
  if(a.headingScale==='large')base.fontSize=level===1?'clamp(3.35rem,9.5vw,7.5rem)':'clamp(2.4rem,5vw,4rem)';
  if(a.mobileHeadingScale==='compact')mobile.fontSize=level===1?'clamp(2.05rem,8vw,3rem)':'clamp(1.7rem,6vw,2.4rem)';
  if(a.mobileHeadingScale==='large')mobile.fontSize=level===1?'clamp(3.3rem,12vw,5rem)':'clamp(2.5rem,9vw,3.6rem)';
  if(a.desktopHeadingScale==='compact')desktop.fontSize=level===1?'clamp(2.6rem,5vw,4.1rem)':'clamp(1.9rem,3vw,2.8rem)';
  if(a.desktopHeadingScale==='large')desktop.fontSize=level===1?'clamp(4.5rem,8vw,8rem)':'clamp(3rem,5vw,4.4rem)';
 }
 return {base,mobile,desktop};
}
// The original non-hero section-spacing presets, projected for a declarative
// original section instead of overriding an owner's choice with model padding.
function websiteOwnerSectionSpacing(section){
 const a=section?.appearance||{},base={compact:'clamp(28px,4vw,58px)',generous:'clamp(94px,11vw,154px)'},mobile={compact:'28px',generous:'72px'},desktop={compact:'48px',generous:'128px'};
 return {base:base[a.sectionSpacing]||null,mobile:mobile[a.mobileSectionSpacing]||null,desktop:desktop[a.desktopSectionSpacing]||null};
}
export {itemTypographyClasses,textTypes,textTypographyFields,textTypographySupports,textTypographyClasses,textTypographyCss,websiteOwnerTextPresentation,websiteOwnerSectionSpacing};
