import {json,ready} from './_shared.js';
export async function onRequestGet({request,env}){
  const host=new URL(request.url).hostname;
  const enabled=ready(env,host);
  return json({enabled,siteKey:enabled?env.TURNSTILE_SITE_KEY:null});
}
