// Direct custom-host resolution is not a DNS-rebinding defence. Until a
// reviewed egress broker exists, probe only platform-owned fixed destinations.
export function approvedHealthProbe(value,{projectUrl,rootDomain,website}){
 try{const u=new URL(value),project=new URL(projectUrl);if(u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||project.protocol!=='https:'||project.username||project.password||project.port)return false;
  const ids=[website?.business_id,website?.id];if(!ids.every(x=>typeof x==='string'&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(x)))return false;
  if(u.origin===project.origin&&u.pathname===`/storage/v1/object/public/busy-website-public/${ids[0]}/${ids[1]}/live/index.html`)return true;
  const root=typeof rootDomain==='string'?rootDomain.toLowerCase():'';return /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(root)&&u.hostname===website.default_hostname&&u.hostname.endsWith('.'+root)&&u.hostname.split('.').length===root.split('.').length+1&&u.pathname==='/';
 }catch{return false;}
}
