// Shared finite typography for selected section headings and primary paragraphs.
// No downloadable fonts, arbitrary CSS, inline styles or business-record edits.
const textTypes={title:['hero','services','about','text','photo-feature','gallery','faq','testimonials','contact'],
 body:['hero','about','text','photo-feature']};
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
 const selector=target==='title'?':is(h1,h2)':':is(.hero-content > .lead,.wrap > p,.photo-feature-grid > div > p)';
 const declaration=suffix==='Font'?'font-family:'+fonts[value]:suffix==='Weight'?'font-weight:'+weights[value]:
  suffix==='Align'?'text-align:'+value:suffix==='Colour'?'color:var(--owner-text-'+value+')':'line-height:'+(target==='title'?(value==='relaxed'?1.4:1.15):(value==='relaxed'?1.85:1.6));
 // Heading/primary-paragraph scope excludes card text, navigation and facts.
 textTypographyCss+='section.owner-text-'+target+suffix+'-'+value+' '+selector+'{'+declaration+'}\n';
 textTypographyCss+='article.owner-text-'+target+suffix+'-'+value+' > '+(target==='title'?'h3':'p')+'{'+declaration+'}\n';
}
// These are relative, wrapping presets for the selected primary/card text.
// Explicit phone/desktop choices take precedence over the all-width preset.
for(const [field,media]of [['bodySize',''],['mobileBodySize','(max-width:600px)'],['desktopBodySize','(min-width:1000px)']]){
 let rules='';
 for(const [value,size]of [['normal','1rem'],['large','1.125rem'],['extra-large','1.25rem']])
  rules+='section.owner-text-'+field+'-'+value+' :is(.hero-content > .lead,.wrap > p,.photo-feature-grid > div > p),article.owner-text-'+field+'-'+value+' > p{font-size:'+size+';overflow-wrap:anywhere}\n';
 textTypographyCss+=media?'@media'+media+'{'+rules+'}':rules;
}
function itemTypographyClasses(item){return textTypographyClasses({type:'text',appearance:item?.appearance});}
export {itemTypographyClasses,textTypes,textTypographyFields,textTypographySupports,textTypographyClasses,textTypographyCss};
