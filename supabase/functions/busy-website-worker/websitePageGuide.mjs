// Static navigation derived from actual rendered section anchors, never URLs
// supplied by an instruction. No new content, assets, destinations or scripts.
export function websitePageGuide(draft,sections,html,escapeHtml){
 if(draft?.theme?.pageGuide!=='sections'||typeof html!=='string'||typeof escapeHtml!=='function')return '';
 const entries=websitePageGuideEntries(sections,html,escapeHtml);
 if(entries.length<3)return '';
 return `<nav class="page-section-guide" aria-label="On this page"><div class="wrap"><p>On this page</p><ul>${entries.map(entry=>`<li><a href="#${escapeHtml(entry.id)}">${escapeHtml(entry.title)}</a></li>`).join('')}</ul></div></nav>`;
}

// Shared destination eligibility for canonical output and current-preview suggestions.
export function websitePageGuideEntries(sections,html,escapeHtml){
 if(typeof html!=='string'||typeof escapeHtml!=='function')return [];
 const anchors=new Set([...html.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map(match=>match[1])),seen=new Set();
 const entries=(sections||[]).flatMap(section=>{
  if(!section||section.enabled===false||section.type==='hero'||typeof section.title!=='string'||!section.title.trim())return [];
  const id=anchors.has(escapeHtml(section.id))?section.id:['services','contact','gallery'].includes(section.type)&&anchors.has(section.type)?section.type:null;
  if(!id||!/^[a-z0-9][a-z0-9-]{0,79}$/i.test(id)||seen.has(id))return [];seen.add(id);return [{id,title:section.title}];
 });
 entries.sort((a,b)=>[...anchors].indexOf(a.id)-[...anchors].indexOf(b.id));
 return entries;
}

// Apply only to HTML produced by the finite section renderer. Empty/omitted
// sections must not consume the page's primary heading. Keep editor attributes
// and exact escaped wording; this is shared by private previews and deployment.
export function websitePageHeadingHierarchy(sectionHtml){
 let assigned=false;const hasPrimary=/<h1\b/.test(sectionHtml);
 return sectionHtml.replace(/<(h[12])(\b[^>]*)>([\s\S]*?)<\/\1>/g,(_all,_tag,attributes,body)=>{
  const primary=!assigned&&(!hasPrimary||_tag==='h1'),tag=primary?'h1':'h2';if(primary)assigned=true;return '<'+tag+attributes+'>'+body+'</'+tag+'>';
 });
}
