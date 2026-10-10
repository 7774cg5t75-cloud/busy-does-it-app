/**
 * V3.103 trusted screenshot-visual-review adapter.
 * Server-side only. Production needs authenticated screenshot acquisition
 * and atomic credit reservations before customer launch.
 */
import {readFile} from "node:fs/promises";
import {normalizeVisualCritique} from "../../supabase/functions/busy-website-worker/visualCriticContract.mjs";
const PNG=Buffer.from([137,80,78,71,13,10,26,10]);
const MAX_BYTES=2250000;
function validateScreenshot(buffer,label){
 if(!Buffer.isBuffer(buffer)||buffer.length<24||buffer.length>MAX_BYTES)
   throw Error(label+" screenshot has an invalid image size");
 if(!buffer.subarray(0,8).equals(PNG)||buffer.toString("ascii",12,16)!=="IHDR")
   throw Error(label+" screenshot must be a real PNG image");
 const width=buffer.readUInt32BE(16),height=buffer.readUInt32BE(20);
 if(width<320||width>2000||height<320||height>9500)
   throw Error(label+" screenshot dimensions are outside the allowed range");
 return {width,height,bytes:buffer.length};
}
function extractText(body){
 const content=Array.isArray(body?.output)?body.output:[];
 const txt=content.flatMap(x=>Array.isArray(x.content)?x.content:[])
   .filter(x=>x.type==="output_text"&&typeof x.text==="string").map(x=>x.text).join("\n");
 if(!txt)throw Error("Vision model did not return usable text");
 let parsed;
 try{parsed=JSON.parse(txt);}catch{throw Error("Vision model returned invalid review JSON");}
 if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))
   throw Error("Vision model returned invalid structured review");
 return parsed;
}
const prompt=[
"You are BUSY DOES IT's website visual design critic.",
"Examine TWO actual screenshots of the same private webpage: MOBILE then DESKTOP.",
"Look for clipping, tiny text, poor spacing, low contrast, overcrowding, navigation and CTA issues.",
"Do not infer business achievements, reviews, contacts or photographic permissions.",
"Do not propose edits to business wording, services, photos, prices, customer information, hosting or publishing.",
"Suggest at most three safe theme-token changes using only: theme.heroLayout, theme.cardLayout,",
"theme.navStyle, theme.ornament, theme.typography, theme.paletteVariant, theme.heroSize, theme.spacing.",
"If the site looks good, use an empty proposals array.",
"Return ONLY JSON with exactly these keys: summary (short string) and proposals",
"(array of objects with path, value and reason strings). Do not claim any change has been applied."
].join("\n");
async function reviewScreenshots({
 mobile,desktop,approvedPhotos=0,enabled=false,ownerApproved=false,
 apiKey="",model="",fetchImpl=fetch,abortMs=25000
}={}){
 if(!enabled||!ownerApproved)
   return {status:"disabled",providerCalls:0,reason:"Visual AI is opt-in and requires owner approval"};
 if(!apiKey||!model||!/^gpt-[a-z0-9.-]+$/i.test(model))
   return {status:"needs-configuration",providerCalls:0,reason:"Server API key and vision model are required"};
 const mobileInfo=validateScreenshot(mobile,"Mobile"),desktopInfo=validateScreenshot(desktop,"Desktop");
 if(abortMs>35000||abortMs<3000)throw Error("Vision request needs a bounded timeout");
 const requestBody={
  model,store:false,max_output_tokens:650,
  input:[{role:"user",content:[
   {type:"input_text",text:prompt},
   {type:"input_image",image_url:"data:image/png;base64,"+mobile.toString("base64"),detail:"low"},
   {type:"input_image",image_url:"data:image/png;base64,"+desktop.toString("base64"),detail:"low"}
  ]}]
 };
 // Exactly one request. No automatic retries or iterative model spending.
 const response=await fetchImpl("https://api.openai.com/v1/responses",{
  method:"POST",signal:AbortSignal.timeout(abortMs),
  headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},
  body:JSON.stringify(requestBody)
 });
 if(!response.ok)throw Error("Vision provider rejected the request ("+response.status+").");
 const body=await response.json(),raw=extractText(body);
 // Stamp evidence ONLY after obtaining a successful provider response.
 const normalized=normalizeVisualCritique({...raw,reviewedScreenshots:true},{approvedPhotos});
 if(!normalized.valid)throw Error("Vision proposals did not pass the safety checks");
 return {
  status:"completed",providerCalls:1,source:"screenshot-ai",model,
  reviewed:{mobile:mobileInfo,desktop:desktopInfo},report:normalized,
  usage:{inputTokens:Number(body.usage?.input_tokens)||0,
         outputTokens:Number(body.usage?.output_tokens)||0},
  note:"No changes applied. Customer approval is required; nothing has been published."
 };
}
async function reviewScreenshotFiles({mobilePath,desktopPath,...args}={}){
 if(!args.enabled||!args.ownerApproved)
   return {status:"disabled",providerCalls:0,reason:"Visual AI requires explicit approval"};
 if(!mobilePath||!desktopPath)throw Error("Both local screenshot files are required");
 // No arbitrary public URLs, website scraping, or remote screenshot capture.
 return reviewScreenshots({...args,
   mobile:await readFile(mobilePath),desktop:await readFile(desktopPath)});
}
export {validateScreenshot,reviewScreenshots,reviewScreenshotFiles};
