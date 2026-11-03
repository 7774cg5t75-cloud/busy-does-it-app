import {inspectPremiumWebsiteOutput} from './premiumWebsiteQuality.mjs';
import {craftedPage} from '../../supabase/functions/busy-website-worker/websiteCraftedPage.mjs';
// Objective gates and professional judgements deliberately remain separate.
// No numerical beauty score, deployment permission or model self-approval.
export function inspectWebsiteExcellence({draft,html,measurements=[],verifiedAssetUris=[]}={}){
 const source=inspectPremiumWebsiteOutput({draft,html,verifiedAssetUris}),content=[],judgements=[];
 const services=(draft?.sections||[]).find(s=>s.type==='services'&&s.enabled!==false);
 if(services?.items?.some(i=>!String(i.body||'').trim()))content.push('Some approved services need descriptions; do not invent them.');
 if(!draft?.sections?.some(s=>s.type==='contact'&&s.enabled!==false&&(s.email||s.phone)))content.push('No supported contact destination supplied.');
 const hero=draft?.sections?.find(s=>s.type==='hero');if(/^(?:welcome|your trusted|quality services)/i.test(hero?.title||''))judgements.push('Generic opening: review the owner’s intended wording; never replace it silently.');
 const failures=[...source.errors];for(const m of measurements){if(m.overflow?.length||m.clipped?.length||m.broken?.length||m.unreadable?.length||m.contrastFailures?.length)failures.push('Measured layout, image, typography or contrast failure at '+m.viewport);}
 const missing=[320,390,1440].filter(w=>!measurements.some(m=>m.viewport===w));
 return {technical:{passed:failures.length===0,evidenceComplete:missing.length===0,status:failures.length?'failed':missing.length?'awaiting-browser-measurements':'measured-checks-passed',failures:[...new Set(failures)],missingViewportEvidence:missing},content:{issues:content,sourceGrounding:'Original approved records and owner wording required; this check cannot verify external claims'},visual:{treatment:craftedPage(draft)?'reviewed-complete-page':'legacy',requiresActualRenderedReview:true,judgements:[...judgements,'Assess whole-page coherence, photographic suitability, distinctive hierarchy and customer journey. No automatic aesthetic acceptance.']},customerReady:false,publicationAuthorised:false,freePaidQuality:'shared-original-renderer',noDesignScore:true};
}
