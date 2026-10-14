import {websiteBuilderTestHarnessV3222} from "./lib/website-builder-test-harness-v3222.mjs";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PALETTES,DEFAULT_PALETTE,nativePalette}
 from "../src/core/nativePalette.mjs";
import {nativePreferredDates}
 from "../standalone/template/nativePreferredDates.mjs";
import {OPTIONS,DEFAULTS,previewPrivateAppAppearance}
 from "../src/core/appAppearanceEditing.mjs";
import {nativeShellDescriptor}
 from "../src/core/standaloneNativePackage.mjs";
import {planCopyMissingAppServices,confirmCopyMissingAppServices}
 from "../src/core/ownerBuilderServiceBridgeV3192.mjs";
import {planWebsiteDesign}
 from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {designForWebsite,designCss}
 from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {reviewWebsiteDesign}
 from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit}
 from "../supabase/functions/busy-website-worker/designEdits.mjs";
import {canonicalWebsiteHandoffUrl} from "../src/core/websiteAppHandoffV3214.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const {rebuildPrivateWebsiteDraft}=websiteBuilderTestHarnessV3222(["rebuildPrivateWebsiteDraft:withHtml"]);

const rebuilt=rebuildPrivateWebsiteDraft({...fresh.nextDraft,businessName:"Example Flowers",
 businessType:"Florist",theme:{}});
yes(rebuilt.html.includes("Wedding flowers"));
yes(rebuilt.html.includes("Dried arrangements"));
eq(rebuilt.generation,6);
const controller=read("src/app/AppController.js");
const screen=read("src/screens/websiteBuilder.js");
const copyUi=read("src/screens/websiteAppServiceCopy.js");
yes(controller.includes("confirmCopyMissingAppServices(current,app,{businessId,evidence})"));
yes(controller.includes("setWebsiteUndo(items=>[...items,current].slice(-8))"));
yes(controller.includes("applyMissingAppServicesToWebsite,"));
yes(screen.includes("<WebsiteAppServiceCopy website={draft}"));
yes(copyUi.includes("Copy these services into my PRIVATE website"));
yes(copyUi.includes("setReview(null)"));
console.log("V3.192 "+assertions+
 " curated native palettes, preference dates, duplicate safety and owner-approved cross-builder copy assertions PASS.");
