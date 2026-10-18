import {editingQualityDecision} from '../_shared/builderQualityPolicy.mjs';
const list=v=>Array.isArray(v)?v:[];
// Deterministic source contracts only. Never accept client geometry as trusted
// publication proof, block on an aesthetic score, or infer customer outcomes.
export function reviewWebsiteEditingQuality(draft){
 const findings=[],add=(id,level,message,sectionId,evidence='finite-contract',repair=null)=>findings.push({id,level,message,sectionId,evidence,repair});
 const sections=list(draft?.sections).filter(s=>s?.enabled!==false),ids=sections.map(s=>s.id);
 if(!sections.length)add('empty-site','critical','Keep visible website content before preparing publication.');
 if(ids.some(id=>typeof id!=='string'||!id)||new Set(ids).size!==ids.length)
  add('section-identity','critical','Sections need unique, stable identities before this design can be used.');
 for(const s of sections){
  if(typeof s.ctaHref==='string'&&s.cta){
   const href=s.ctaHref.trim();
   if(/^(?:javascript|data|vbscript):/i.test(href))add('unsafe-action:'+s.id,'critical','This button has an unsupported destination. Choose a supported link.',s.id);
   if(/^#.+/.test(href)&&href!=='#main'&&!sections.some(x=>x.type!=='hero'&&x.id===href.slice(1)))
    add('missing-action:'+s.id,'critical','This button points to a section that does not exist. Restore a visible destination.',s.id);
  }
  if(s.appearance?.headingScale==='large'&&s.type==='hero')
   add('large-heading:'+s.id,'advisory','This is a bold heading choice. Check wrapping on phones; you can keep it if it suits your business.',s.id,'heuristic',{action:'section-style',sectionId:s.id,field:'headingScale',value:'normal'});
  if(s.appearance?.sectionSpacing==='compact'&&list(s.items).length>=4)
   add('compact-cards:'+s.id,'advisory','These cards may feel crowded. A little more space could help; your current choice remains available.',s.id,'heuristic',{action:'section-style',sectionId:s.id,field:'sectionSpacing',value:'normal'});
  const fonts=new Set([s.appearance?.titleFont,...list(s.items).map(x=>x.appearance?.titleFont)].filter(v=>v&&v!=='brand'));
  if(fonts.size>2)add('mixed-type:'+s.id,'advisory','Several heading fonts are used here. Check that the hierarchy feels consistent.',s.id,'heuristic');
 }
 return editingQualityDecision(findings);
}
export function websiteEditingRegression(before,after){
 const previous=new Set(reviewWebsiteEditingQuality(before).findings.filter(f=>f.level==='critical').map(f=>f.id));
 const review=reviewWebsiteEditingQuality(after),introduced=review.findings.filter(f=>f.level==='critical'&&!previous.has(f.id));
 return {...review,mayCommit:introduced.length===0,introducedCritical:introduced,
  explanation:introduced[0]?.message||review.explanation};
}
