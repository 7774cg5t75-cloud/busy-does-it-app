import assert from 'node:assert/strict';
import {websiteCreativeDocumentSection,resolveWebsiteCreativeSource} from '../../supabase/functions/busy-website-worker/websiteCreativeDocument.mjs';
import {websiteOwnerTextPresentation} from '../../supabase/functions/busy-website-worker/websiteTextTypography.mjs';
import {WEBSITE_CREATIVE_FONT_PROVENANCE} from '../../supabase/functions/busy-website-worker/websiteCreativeDocumentRendering.mjs';

// Expected design comes from the reviewed document and ORIGINAL owner-format
// authority. Actual CSS and actual paragraph descendants are measured later in
// Chromium, so a legacy selector overriding these choices cannot pass silently.
export function mission19TypographyExpectations(draft,page){
 const brand=draft.creativeDocumentPageModel?.brand;if(!brand)return [];
 const candidates=[];
 for(const sectionId of page.sectionIds){
  const section=draft.sections.find(section=>section.id===sectionId);if(section?.type!=='creative-document')continue;
  const document=websiteCreativeDocumentSection(draft,section);assert.ok(document);
  const walk=nodes=>{for(const node of nodes){if(node.type==='heading'||node.type==='text')candidates.push({section,node});if(node.children)walk(node.children);}};walk(document.nodes);
 }
 const heading=candidates.find(({node})=>node.type==='heading'&&node.level===1),body=candidates.find(({node})=>node.type==='text'&&node.size>=20)||candidates.find(({node})=>node.type==='text');assert.ok(heading&&body,'Review one real H1 and meaningful body copy on every designed page');
 return [heading,body].map(({section,node})=>{
  const role=node.type==='heading'?'heading':'body',source=node.copy.sourceRefs.map(ref=>resolveWebsiteCreativeSource(draft,ref)).find(source=>source?.section||source?.item),row=section.items.find(item=>item.id===node.copyId);
  const appearance={...(source?.section?.appearance||{}),...(source?.item?.appearance||{}),...(section.appearance||{}),...(row?.appearance||{})};
  const owner=websiteOwnerTextPresentation({appearance},role==='heading'?'title':'body',node.level||2),token=role==='heading'?brand.headingFont:brand.bodyFont,registry=WEBSITE_CREATIVE_FONT_PROVENANCE[token];assert.ok(registry);
  return {elementId:section.id+'--'+node.id,sectionId:section.id,copyId:node.copyId,role,copyText:node.copy.text,reviewedFontToken:token,expectedFontFamily:owner.base.fontFamily||registry.stack,expectedDesktopSize:owner.desktop.fontSize||owner.base.fontSize||node.size+'px',expectedMobileSize:owner.mobile.fontSize||owner.base.fontSize||(role==='heading'?node.mobileSize:Math.min(node.size,20))+'px',ownerFormatting:Object.keys(appearance).length>0,fontAvailability:registry.availability,sizeAuthority:role==='heading'?'Reviewed desktop/mobile heading sizes, superseded only by original owner formatting.':'Reviewed body size with the original compact20px mobile cap, superseded only by original owner formatting.'};
 });
}
