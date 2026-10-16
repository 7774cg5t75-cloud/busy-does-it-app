import {readBusinessContent} from './businessContentStore.mjs';
// Public tenancy comes from the exact live deployment and its current website.
async function publicWebsiteBusinessContent(db,{websiteId,expectedDeploymentId}={}){
 const uuid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
 if(!uuid.test(expectedDeploymentId||''))throw Error('Choose an exact published website deployment.');
 const d=await db.from('busy_website_deployments').select('id,website_id,business_id,state').eq('id',expectedDeploymentId).eq('state','live').maybeSingle();if(d.error)throw d.error;
 if(!d.data||d.data.id!==expectedDeploymentId||websiteId!==undefined&&websiteId!==d.data.website_id)throw Error('This deployment is not public.');
 const r=await db.from('busy_websites').select('id,business_id,status,current_live_deployment_id').eq('id',d.data.website_id).maybeSingle();if(r.error)throw r.error;
 const website=r.data;if(!website||website.id!==d.data.website_id||website.business_id!==d.data.business_id||!['live','update_pending'].includes(website.status)||website.current_live_deployment_id!==expectedDeploymentId)throw Error('This website version is not current.');
 return readBusinessContent(db,website.business_id,{publicOnly:true});
}
export {publicWebsiteBusinessContent};
