/**
 * V3.105 Cloudflare Browser Rendering service for signed BUSY hosted previews.
 * DEPLOYMENT OPT-IN: requires Browser Rendering binding and separately funded
 * Cloudflare plan. Never deploy without enabling that provider explicitly.
 * This Worker is internal-only: it does not accept arbitrary URLs.
 */
import puppeteer from "@cloudflare/puppeteer";
export default {
 async fetch(request,env){
  if(request.method!=="POST")return new Response("POST required",{status:405});
  const auth=request.headers.get("Authorization")||"";
  if(!env.BUSY_SCREENSHOT_SECRET||auth!=="Bearer "+env.BUSY_SCREENSHOT_SECRET)
    return new Response("Unauthorized",{status:401});
  let data;
  try{data=await request.json();}catch{return new Response("Invalid JSON",{status:400});}
  const urlString=String(data?.url||"");
  const deployment=String(data?.expectedDeployment||"");
  const width=Number(data?.viewport?.width),height=Number(data?.viewport?.height);
  if(!/^[0-9a-f-]{36}$/i.test(deployment)||
     ![[390,844],[1440,900]].some(([w,h])=>width===w&&height===h))
    return new Response("Invalid deployment or viewport",{status:400});
  let parsed;
  try{parsed=new URL(urlString);}catch{return new Response("Invalid URL",{status:400});}
  // Only the BUSY-owned storage origin. A signed link must have immutable
  // deployment scope in the path. Arbitrary server-side URLs are forbidden.
  if(parsed.protocol!=="https:"||
     parsed.hostname!==(env.BUSY_SUPABASE_HOST||"qgkmuiipicazmcxxmoxv.supabase.co")||
     !parsed.pathname.startsWith("/storage/v1/object/sign/busy-website-preview/")||
     !parsed.pathname.includes("/deployments/"+deployment+"/")||
     !parsed.pathname.endsWith(".html")||!parsed.searchParams.has("token")||
     parsed.username||parsed.password)
    return new Response("Only signed BUSY hosted previews may be rendered",{status:403});
  if(!env.BROWSER)return new Response("Browser Rendering not configured",{status:503});
  let browser;
  try{
   browser=await puppeteer.launch(env.BROWSER);
   const page=await browser.newPage();
   await page.setViewport({width,height,deviceScaleFactor:1});
   await page.setRequestInterception(true);
   page.on("request",req=>{
    try{
     const u=new URL(req.url());
     // Block third-party tracking, JS and redirects. BUSY CSS is embedded;
     // approved website assets must resolve from the same Supabase project.
     if(u.protocol==="https:"&&u.hostname===parsed.hostname&&
        u.pathname.startsWith("/storage/v1/object/")&&
        ["document","image","stylesheet","font"].includes(req.resourceType()))
       return req.continue();
     if(req.url().startsWith("data:"))return req.continue();
    }catch{}
    return req.abort();
   });
   await page.setJavaScriptEnabled(false);
   await page.goto(urlString,{waitUntil:"domcontentloaded",timeout:12000});
   const final=new URL(page.url());
   if(final.origin!==parsed.origin||
      !final.pathname.startsWith("/storage/v1/object/sign/busy-website-preview/"))
     return new Response("Redirected away from private preview",{status:403});
   const png=await page.screenshot({type:"png",fullPage:true});
   if(png.byteLength>2100000)return new Response("Screenshot too large",{status:413});
   return new Response(png,{status:200,headers:{
     "Content-Type":"image/png","Cache-Control":"no-store",
     "X-Content-Type-Options":"nosniff"
   }});
  }catch(err){
   return new Response("Private screenshot capture unavailable",{status:503});
  }finally{if(browser)await browser.close();}
 }
};
