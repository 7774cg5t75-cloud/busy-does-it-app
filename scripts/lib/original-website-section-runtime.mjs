import {itemTypographyClasses} from "../../supabase/functions/busy-website-worker/websiteTextTypography.mjs";
// Execute actual checked-in section renderer; signed asset URL resolution is
// an inert map boundary. No Deno entrypoint, HTTP, provider or hosted execution.
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import assert from 'node:assert/strict';
import {sectionAppearanceClasses} from '../../supabase/functions/busy-website-worker/websiteAppearanceClasses.mjs';
export function originalWebsiteSectionRuntime(){
 const source=readFileSync(new URL('../../supabase/functions/busy-website-worker/index.ts',import.meta.url),'utf8');
 const boundaries=[['clean','safeArray'],['safeArray','escapeHtml'],['escapeHtml','contentTypeFor'],['renderSectionHtml','relativePageHref']];
 const code=boundaries.map(([name,next])=>{
  const marker='function '+name+'(',endMarker='function '+next+'(';
  assert.equal(source.split(marker).length,2,name);assert.equal(source.split(endMarker).length,2,next);
  const start=source.indexOf(marker),end=source.indexOf(endMarker,start);assert.ok(end>start);
  const body=source.slice(start,end).trim();assert.ok(body.endsWith('}'),'Reviewed function boundary changed');
  return body;
 }).join('\n');
 const js=stripTypeScriptTypes(code);
 return Function('sectionAppearanceClasses','itemTypographyClasses','urlForAsset',js+'\nreturn renderSectionHtml;')(sectionAppearanceClasses,itemTypographyClasses,(asset,urls)=>asset?.approved===false?'':urls[asset?.storagePath]||'');
}
