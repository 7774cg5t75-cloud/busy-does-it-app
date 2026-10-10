/**
 * V3.116. Trusted renderer proof contract. The HTTP metadata is accepted ONLY
 * from the server-configured authenticated renderer over HTTPS; never from
 * the customer's app or an arbitrary website. PNG bytes are still validated.
 * Metadata attests which requested preview the renderer says it captured;
 * it is not proof of aesthetics or a public website.
 */
const PNG=[137,80,78,71,13,10,26,10];
const id=x=>typeof x==="string"&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(x);
function checkScreenshotProof({bytes,headers,deploymentId,viewport}={}){
 const fail=reason=>({valid:false,reason});
 if(!id(deploymentId)||!Number.isSafeInteger(viewport?.width)||
    !Number.isSafeInteger(viewport?.height)||
    ![[390,844],[1440,900]].some(([w,h])=>w===viewport.width&&h===viewport.height))
  return fail("Invalid trusted screenshot request");
 if(!bytes||typeof bytes.byteLength!=="number"||bytes.byteLength<64||
    bytes.byteLength>2100000||PNG.some((byte,i)=>bytes[i]!==byte)||
    String.fromCharCode(...bytes.subarray(12,16))!=="IHDR")
  return fail("Renderer returned invalid or oversized PNG");
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),
    width=view.getUint32(16),height=view.getUint32(20);
 if(width!==viewport.width||height<viewport.height||height>9500)
  return fail("Renderer returned unexpected screenshot dimensions");
 // These headers must be set by our authenticated Cloudflare renderer.
 if(headers?.get?.("x-busy-deployment")!==deploymentId||
    headers?.get?.("x-busy-viewport")!==viewport.width+"x"+viewport.height)
  return fail("Authenticated screenshot provenance mismatch");
 if(headers?.get?.("content-type")?.split(";")[0]?.trim()?.toLowerCase()!=="image/png")
  return fail("Trusted renderer response was not PNG");
 if(headers?.get?.("cache-control")?.toLowerCase()?.includes("no-store")!==true)
  return fail("Private screenshot was not marked no-store");
 return {valid:true,width,height,deploymentId,viewport:viewport.width+"x"+viewport.height};
}
export {checkScreenshotProof};
