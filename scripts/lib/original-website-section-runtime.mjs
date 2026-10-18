import {itemTypographyClasses} from "../../supabase/functions/busy-website-worker/websiteTextTypography.mjs";
// Execute actual checked-in section renderer; signed asset URL resolution is
// an inert map boundary. No Deno entrypoint, HTTP, provider or hosted execution.
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {sectionAppearanceClasses} from '../../supabase/functions/busy-website-worker/websiteAppearanceClasses.mjs';
const require=createRequire(import.meta.url),babel=require('@babel/core');
export function originalWebsiteSectionRuntime(){
 const source=readFileSync(new URL('../../supabase/functions/busy-website-worker/index.ts',import.meta.url),'utf8');
 const names=['clean','safeArray','escapeHtml','renderSectionHtml'];
 const ast=babel.parseSync(source,{sourceType:'module',configFile:false,babelrc:false,parserOpts:{plugins:['typescript']}});
 const code=names.map(name=>{
  const matches=ast.program.body.filter(n=>n.type==='FunctionDeclaration'&&n.id.name===name);assert.equal(matches.length,1,name);
  return source.slice(matches[0].start,matches[0].end);
 }).join('\n');
 const js=babel.transformSync(code,{filename:'reviewed-worker-functions.ts',configFile:false,babelrc:false,plugins:[require('@babel/plugin-transform-typescript')]}).code;
 return Function('sectionAppearanceClasses','itemTypographyClasses','urlForAsset',js+'\nreturn renderSectionHtml;')(sectionAppearanceClasses,itemTypographyClasses,(asset,urls)=>asset?.approved===false?'':urls[asset?.storagePath]||'');
}
