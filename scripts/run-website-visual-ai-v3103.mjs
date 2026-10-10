/**
 * Manual one-shot founder screenshot review. NEVER part of normal push/build.
 * Only photographs of intentionally fictional offline test websites until
 * production tenant verification, billing and screenshot provenance exist.
 */
import {writeFile} from "node:fs/promises";
import {reviewScreenshotFiles} from "./lib/websiteVisionReview-v3103.mjs";
const [mobilePath,desktopPath,outputPath]=process.argv.slice(2);
const enabled=process.env.BUSY_RUN_VISUAL_AI==="true";
const consent=process.env.BUSY_VISUAL_AI_OWNER_APPROVED==="true";
if(!enabled||!consent){
 console.log("No vision API called. A one-shot, explicit opt-in is required.");
 process.exit(0);
}
if(!mobilePath||!desktopPath||!outputPath)
 throw Error("Provide local mobile and desktop screenshot paths and result path");
const result=await reviewScreenshotFiles({
 mobilePath,desktopPath,enabled,ownerApproved:consent,
 apiKey:process.env.OPENAI_API_KEY||"",
 model:process.env.BUSY_VISION_MODEL||"",
 approvedPhotos:0
});
if(result.status!=="completed")throw Error(result.reason||"Review unavailable");
await writeFile(outputPath,JSON.stringify(result,null,2)+"\n",{mode:0o600});
console.log("Vision reviewed two fictional website screenshots with one provider call.");
console.log("Input tokens:",result.usage.inputTokens,"Output tokens:",result.usage.outputTokens);
console.log("Design-only suggestions:",result.report.proposals.length,"(NOT APPLIED)");
console.log("Never publish a website or change customer facts from an AI review.");
