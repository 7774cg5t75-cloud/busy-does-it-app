import {websitePageGuide} from '../../supabase/functions/busy-website-worker/websitePageGuide.mjs';
import {serviceIndexHtml} from '../../supabase/functions/busy-website-worker/websiteServiceIndex.mjs';
import {faqDisclosureItems} from '../../supabase/functions/busy-website-worker/websiteFaqPresentation.mjs';
import {itemTypographyClasses} from "../../supabase/functions/busy-website-worker/websiteTextTypography.mjs";
import {sectionAppearanceClasses} from '../../supabase/functions/busy-website-worker/websiteAppearanceClasses.mjs';
import {businessContentSectionHtml} from '../../src/core/businessContentHtml.mjs';
import {protectWebsiteOwnerLocks} from "../../supabase/functions/busy-website-worker/websiteOwnerLocks.mjs";
/**
 * One Node-only harness for the React Native website domain.
 *
 * Node cannot directly resolve the mobile module's extensionless imports.
 * Historical tests used many ad hoc Function() evaluators that dropped newer
 * imports; this harness validates every exact production import, injects the
 * ACTUAL shared implementations and refuses any unreviewed source import.
 * Only trusted checked-in source is evaluated. Never evaluates visitor data.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {canonicalWebsiteHandoffUrl} from "../../src/core/websiteAppHandoffV3214.mjs";
import {designForWebsite,designCss}
 from "../../supabase/functions/busy-website-worker/designSystem.mjs";
import {planWebsiteDesign}
 from "../../supabase/functions/busy-website-worker/designPlanner.mjs";
import {reviewWebsiteDesign}
 from "../../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit}
 from "../../supabase/functions/busy-website-worker/designEdits.mjs";
import {editWebsiteDraftField}
 from "../../src/core/websiteStructuredEditing.mjs";

const source=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const trailer=/export\s*\{[\s\S]*?\};?\s*$/;
const EXPECTED=Object.freeze([
 "import {websitePageGuide} from '../../supabase/functions/busy-website-worker/websitePageGuide.mjs';",
 "import {serviceIndexHtml} from '../../supabase/functions/busy-website-worker/websiteServiceIndex.mjs';",
 "import {faqDisclosureItems} from '../../supabase/functions/busy-website-worker/websiteFaqPresentation.mjs';",
 'import {itemTypographyClasses} from "../../supabase/functions/busy-website-worker/websiteTextTypography.mjs";',
 "import {sectionAppearanceClasses} from '../../supabase/functions/busy-website-worker/websiteAppearanceClasses.mjs';",
 "import {businessContentSectionHtml} from '../core/businessContentHtml.mjs';",
 'import {protectWebsiteOwnerLocks} from "../../supabase/functions/busy-website-worker/websiteOwnerLocks.mjs";',
 'import { syncWebsitePageModel } from "./websiteManagement";',
 'import {canonicalWebsiteHandoffUrl} from "../core/websiteAppHandoffV3214.mjs";',
 'import { designForWebsite, designCss } from "../../supabase/functions/busy-website-worker/designSystem.mjs";',
 'import { planWebsiteDesign } from "../../supabase/functions/busy-website-worker/designPlanner.mjs";',
 'import { reviewWebsiteDesign } from "../../supabase/functions/busy-website-worker/designReview.mjs";',
 'import { applyWebsiteVisualEdit } from "../../supabase/functions/busy-website-worker/designEdits.mjs";'
]);
const AVAILABLE=new Set([
 "buildWebsiteDraft","applyWebsiteInstruction","applyStructuredWebsiteEdit",
 "applyWebsiteLayoutChange","applyWebsitePageChange","applyCoordinatedWebsiteCopy",
 "renderWebsiteHtml","rebuildPrivateWebsiteDraft"
]);
function stripKnownModule(file){
 const body=source(file);
 assert.ok(trailer.test(body),"Expected an explicit named export trailer in "+file);
 const code=body.replace(trailer,"");
 assert.equal(/^\s*import\b/m.test(code),false,"New import needs reviewed harness: "+file);
 assert.equal(/^\s*export\b/m.test(code),false,"New export needs reviewed harness: "+file);
 return code;
}
const management=Function(stripKnownModule("src/domain/websiteManagement.js")+
 "\nreturn {syncWebsitePageModel};")();
const deps=Object.freeze({
 websitePageGuide,serviceIndexHtml,faqDisclosureItems,itemTypographyClasses,sectionAppearanceClasses,syncWebsitePageModel:management.syncWebsitePageModel,
 canonicalWebsiteHandoffUrl,designForWebsite,designCss,
 planWebsiteDesign,reviewWebsiteDesign,applyWebsiteVisualEdit,
 editWebsiteDraftField,protectWebsiteOwnerLocks,businessContentSectionHtml
});
function websiteBuilderTestHarnessV3222(names=[]){
 assert.ok(Array.isArray(names)&&names.length>0&&names.length<=AVAILABLE.size,
  "Specify the website builder functions needed by this test.");
 assert.ok(names.every(n=>AVAILABLE.has(n)),
  "Unknown website builder function. Deliberate source review required.");
 assert.equal(new Set(names).size,names.length,"Duplicate requested builder exports.");
 let code=source("src/domain/websiteBuilder.js");
 assert.ok(trailer.test(code),"Website builder export list must be reviewed.");
 code=code.replace(trailer,"");
 for(const line of EXPECTED){
  assert.equal(code.split(line).length,2,
   "Actual website builder import changed: "+line);
  code=code.replace(line,"");
 }
 assert.equal(/^\s*import\b/m.test(code),false,
  "New website builder import must be added with its real implementation.");
 assert.equal(/^\s*export\b/m.test(code),false,
  "Unexpected website builder export; update harness deliberately.");
 // Every test uses real imported dependencies, not dummy stubs.
 return Function(...Object.keys(deps),code+
  "\nreturn {"+names.map(n=>n==="rebuildPrivateWebsiteDraft"?"rebuildPrivateWebsiteDraft:withHtml":n).join(",")+"};")(...Object.values(deps));
}
export {websiteBuilderTestHarnessV3222,EXPECTED,AVAILABLE};
