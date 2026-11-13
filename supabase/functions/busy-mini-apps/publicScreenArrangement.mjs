import {validScreenComposition,appScreenSections} from '../../../src/core/appScreenComposition.mjs';
import {orderedAppModules} from '../../../src/core/appSectionOrder.mjs';
// Display-only ordering of already sanitised ORIGINAL public blocks.
// No private placement, artifact reader or executable component is accepted.
export function publicScreenArrangement(config,blocks){
 if(config.screenComposition===undefined)return null; // Exact legacy render path remains.
 if(!validScreenComposition(config.screenComposition,config))throw Error('Unsupported public screen composition.');
 const allowed=new Set(['introduction','products','events','faqs','testimonials','services','gallery','contact','offers','loyalty']),seen=new Set(),result=[];
 const add=key=>{if(allowed.has(key)&&!seen.has(key)){seen.add(key);if(typeof blocks[key]==='string')result.push(blocks[key]);}};
 for(const module of orderedAppModules(config)){
  if(['business_profile','services'].includes(module.key)){for(const key of appScreenSections(config,module.key)||[])add(key);}
  else add(module.key);
 }
 return result.join('\n');
}
