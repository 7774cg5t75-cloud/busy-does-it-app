import {selectedWebsiteComparisons} from './websiteSelectedComparisons.mjs';
import {reviewWebsiteEditingQuality} from '../../supabase/functions/busy-website-worker/websiteEditingQuality.mjs';
// Explains existing finite proposals. No independent planner, writes or tools.
export function selectedWebsiteExploreAdvice(project,selection,text=''){
 const section=project?.sections?.find(s=>s.id===selection?.sectionId);
 if(!section)return {answer:'Select a current website section first. Nothing will be changed.',alternatives:[]};
 const reconsider=/previously (?:rejected|declined)|declined ideas|reconsider|rejected idea|show.*again/i.test(text);
 let choices=selectedWebsiteComparisons(project,selection,{includeRejected:reconsider}),facts=[];
 if(reconsider){choices=choices.filter(choice=>choice.ownerPreference==='disliked');facts.push('You explicitly asked to reconsider ideas declined for this exact source and selection. Showing them does not reset your preferences or change the website. Use the selected editor’s Show this idea again control if you want future suggestions to include one.');}
 if(project.theme?.pageGuide==='sections')facts.push('Your website section guide is enabled. It links only to rendered headings on pages with enough eligible sections; it does not create new content or request actions.');
 if(section.type==='services'&&/find|service|browse|discover|scan|read/i.test(text)){
  const items=(section.items||[]).filter(item=>String(item.title||'').trim()),long=items.filter(item=>String(item.body||'').length>=180).length;
  choices=choices.filter(choice=>choice.id.startsWith('selected-service-'));
  const priority=items.length>=6?'selected-service-index':long>=3?'selected-service-directory':'selected-service-cards';
  choices.sort((a,b)=>Number(b.id===priority)-Number(a.id===priority));
  if(section.appearance?.serviceLayout)facts.push('Current service layout: '+section.appearance.serviceLayout+'. This is an approved source setting, not a measured usability result.');
  facts.push('This section contains '+items.length+' named services; '+long+' have longer descriptions. These are current source facts, not customer behaviour measurements.');
  facts.push(items.length>=6?'An index can help visitors jump to a named service; it also repeats the names and takes extra space.':long>=3?'Detail rows give longer explanations room; cards separate shorter summaries.':'Cards separate short summaries; a directory puts more emphasis on reading the detail.');
  facts.push('These changes keep the existing service wording, order and request destinations. They do not add search, availability or confirmed bookings.');
 }else if(/\b(?:picture|photo|image)\b/i.test(text)){
  const side=section.appearance?.desktopPhotoSide||section.appearance?.photoSide||'left',wanted=/\bright\b/i.test(text)?'right':/\bleft\b/i.test(text)?'left':null;
  choices=choices.filter(choice=>choice.id.startsWith('selected-picture-')&&(!wanted||choice.id==='selected-picture-'+wanted));
  facts.push(section.type==='photo-feature'&&section.asset?.approved===true?'The approved picture currently sits on the '+side+' on larger screens. A desktop-only alternative preserves phone reading order.':'This selection does not offer an approved paired-picture placement change. Its existing picture controls remain separate.');
 }else if(/\b(?:space|spacing|breathing)\b/i.test(text)){
  choices=choices.filter(choice=>/selected-section-space|selected-phone-reading/.test(choice.id));
  facts.push('More space separates information but can mean more scrolling. This is advice, not measured usability.');
 }else if(/\b(?:phones?|mobile)\b/i.test(text)&&/read|space|size|typograph/i.test(text)){
  choices=choices.filter(choice=>choice.id==='selected-phone-reading');
  facts.push('You asked about phones. This comparison changes only supported phone text size and section spacing; desktop and tablet appearance stay unchanged. More room can mean more scrolling, not verified usability improvement.');
 }else if(['about','text'].includes(section.type)&&/read|column|article|long.*information/i.test(text)){
  const length=String(section.body||'').length,current=section.appearance?.readingLayout||'brand';
  choices=choices.filter(choice=>choice.id.startsWith('selected-reading-')||choice.id==='selected-phone-reading');
  facts.push('This selected information section contains '+length+' source characters. Current reading layout: '+current+'. No wording or image is replaced by these alternatives.');
  facts.push('A focused column limits line length. An editorial layout puts the heading beside the explanation on larger screens. Two reading columns flow the same text across a wide desktop, while phones and tablets keep one column. Readers must finish the first column before the second.');
  if(length>=1600)choices.sort((a,b)=>Number(b.id==='selected-reading-columns')-Number(a.id==='selected-reading-columns'));
  facts.push('Existing owner rejections and locks still determine which original comparisons are offered. A different reading flow is a design hypothesis, not measured reading speed or screenshot inspection.');
 }else if(/read|typograph|heading|hierarchy|question/i.test(text)){
  choices=choices.filter(choice=>/reading|heading|faq-questions|service-directory/.test(choice.id));
  facts.push(section.type==='faq'?'Expandable answers reduce initial density but need an opening action. Keeping answers expanded avoids that extra step.':'A stronger heading or bounded reading width can separate the information. Existing wording and colours stay authoritative.');
 }
 const findings=reviewWebsiteEditingQuality(project).findings.filter(f=>f.sectionId===section.id).slice(0,2);
 return {answer:['You selected '+(section.title||section.id)+' on '+selection.pageId+'.',...facts,
  ...choices.map(choice=>choice.label+': '+choice.explanation),
  ...findings.map(f=>'Current source check: '+f.message),
  choices.length?'These alternatives affect the selected part only. Preview before choosing whether to keep a change.':'No new supported alternative is offered for this question and current owner choices or locks. Keep the original, or use the selected controls to review another idea.',
  'This is source-based advice, not screenshot inspection or full accessibility acceptance. Nothing will be changed.'].join('\n'),alternatives:choices.map(choice=>({label:(choice.ownerPreference==='disliked'?'Previously declined: ':'')+choice.label,instruction:choice.instruction}))};
}
