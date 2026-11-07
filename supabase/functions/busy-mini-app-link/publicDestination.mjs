// A stored string is not permission to redirect a customer to another host.
export function publicMiniAppDestination(app,projectUrl){
 const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(x);
 if(!app||![app.id,app.business_id,app.current_live_version_id].every(uuid)||!['live','update_pending'].includes(app.status)||app.public_web_status!=='ready'||app.public_web_version_id!==app.current_live_version_id||typeof app.public_web_url!=='string')return null;
 try{const project=new URL(projectUrl),url=new URL(app.public_web_url);if(project.protocol!=='https:'||project.username||project.password||project.port||project.pathname!=='/'||project.search||project.hash||url.origin!==project.origin||url.username||url.password||url.port||url.search||url.hash||url.pathname!==`/storage/v1/object/public/busy-mini-app-public/${app.business_id}/${app.id}/live/index.html`)return null;return url.toString();}catch{return null;}
}
