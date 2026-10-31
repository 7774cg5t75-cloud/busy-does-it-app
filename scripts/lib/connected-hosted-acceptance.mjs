import {createCreatorDraftAccount} from '../../src/core/creatorDraftAccount.mjs';
import {createGrowthOpportunityAccount} from '../../src/core/growthOpportunityAccount.mjs';
import assert from 'node:assert/strict';
import {createStagingAuthInspector,FIXTURES} from '../../src/staging/stagingAuthInspectorV3131.mjs';
import {createConnectedBuilderSession} from '../../src/staging/connectedBuilderSession.mjs';
import {prepareGoalToPrivateApp,executeGoalToPrivateApp} from '../../src/core/goalToPrivateApp.mjs';
import {createConnectedEnquiryJourney} from '../../src/staging/connectedEnquiryJourney.mjs';
import {createCanonicalWorkSession} from '../../src/core/canonicalWorkSession.mjs';
const target='https://pnjdlogwegnqbsfpcofw.supabase.co',uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export function connectedAcceptancePlan(){return {project:'pnjdlogwegnqbsfpcofw',networkByDefault:false,createsAuthUsers:false,usesServiceKey:false,providersAllowed:false,steps:['Real Auth and original canary isolation','Finite business membership and cross-owner denial','Blank original workspace initialization and approved finite facts with fresh readback','Private website create/wording/design + independent readback','Original reviewed multi-step page save, persistent history and fresh-session Undo/Redo','Fresh sign-in reopening','Stale write denial and intentional lost acknowledgement without replay','Original reviewed App create/configure and fresh reopening','Original private Growth and Creator save/readback/fresh-auth reopening; no providers','Preprovisioned fictional enquiry review/import/separate-contact filing','Canonical private quote review/create/readback/fresh reopening','Sign-out invalidation'],separateChecksRequired:['Real provider expiry and first-release refresh policy: memory-only staging sessions cap at one hour and require fresh sign-in; refresh credentials remain discarded','Controlled membership revocation during live requests','Hosted transaction concurrency and Edge runtime acceptance','Fresh deployment and complete original schema approval']};}
// Never called automatically. Exact source + explicit fictional-mutation consent
// is checked before constructing an Auth client or making the first request.
export async function runConnectedAcceptance(config,{fetchImpl=fetch,sourceSha}={}){
 const blocked={status:'blocked',networkAttempted:false,hostedAcceptance:false};
 if(!/^[a-f0-9]{40}$/.test(sourceSha||'')||config?.approval!=='MUTATE_FICTIONAL_STAGING:'+sourceSha||config?.fictionalOnly!==true)return blocked;
 assert.equal(config.url,target);assert.ok(config.publishableKey);assert.equal(config.owners?.length,2);
 const [A,B]=config.owners;assert.ok(uuid.test(A.businessId)&&uuid.test(B.businessId));assert.notEqual(A.businessId,B.businessId);
 for(const owner of config.owners){assert.ok(owner.password);assert.ok(uuid.test(owner.requestId));assert.match(owner.quoteDate,/^20\d{2}-\d{2}-\d{2}$/);}
 // An anonymous Data API call must be denied before any fictional write.
 const anonymous=await fetchImpl(target+'/rest/v1/rpc/busy_connected_builder_read_v1',{method:'POST',redirect:'error',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({p_business_id:A.businessId})});
 assert.ok([401,403].includes(anonymous.status));
 const observations=[],inspectors=[];
 const login=async(index)=>{const inspector=createStagingAuthInspector({config:{environment:'isolated-staging',baseUrl:target,publishableKey:config.publishableKey},fetchImpl});inspectors.push(inspector);assert.equal(inspector.sessionPolicy.storage,'memory-only');assert.equal(inspector.sessionPolicy.refresh,'fresh-sign-in-required');const who=await inspector.signIn(FIXTURES[index===0?'a':'b'].email,config.owners[index].password);assert.equal(who.status,'genuine-staging-auth-and-rls-verified');return inspector;};
 try{
  for(let index=0;index<2;index++){
   const owner=config.owners[index],other=config.owners[1-index];let auth=await login(index);
   const request=(a,p={})=>auth.requestConnected(a,{...p,businessId:owner.businessId});
   const spaces=await request('workspaces');assert.ok(spaces.items.some(x=>x.businessId===owner.businessId));
   await assert.rejects(()=>auth.requestConnected('builder_read',{businessId:other.businessId}));
   auth=await login(index);await request('initialize');const session=createConnectedBuilderSession({request});let basis=await session.open(owner.businessId);
   const facts=basis.profile||{businessName:'Fictional staging business '+(index+1),businessType:'Gardening',services:[{id:'fictional_lawn',name:'Lawn care',description:'Fictional private test service.'}],contact:{email:'fictional@example.invalid'}};
   const savedFacts=await session.profile({basis,profile:{...facts,description:'Owner-approved fictional staging context. Not a public claim.'},ownerApproved:true});assert.equal(savedFacts.ok,true);basis=savedFacts.observed;
   assert.ok(basis.profile?.businessName&&basis.profile.services?.length);
   if(!basis.websiteDraft){const made=await session.website({basis,action:'create',sourceRevision:basis.profileRevision,ownerApproved:true});assert.equal(made.ok,true);basis=made.observed;}
   const old=basis,wording=await session.website({basis,action:'edit_text',patch:{sectionId:'hero',field:'title',value:'Fictional staging service — private test'},ownerApproved:true});assert.equal(wording.ok,true);basis=wording.observed;
   const design=await session.website({basis,action:'edit_design',patch:{action:'style',field:'spacing',value:'compact'},ownerApproved:true});assert.equal(design.ok,true);basis=design.observed;
   assert.equal(basis.websiteDraftHash,design.receipt.recordHash);
   const batch=await session.website({basis,action:'edit_instruction',patch:{pageId:'home',generation:basis.websiteDraft.generation,instruction:'change the hero heading to "Fictional reviewed page"; make the hero heading smaller on phones'},ownerApproved:true});assert.equal(batch.ok,true);basis=batch.observed;
   const changed=basis.websiteDraft,undo=await session.website({basis,action:'undo',ownerApproved:true});assert.equal(undo.ok,true);auth=await login(index);const redoSession=createConnectedBuilderSession({request}),redoBasis=await redoSession.open(owner.businessId),redo=await redoSession.website({basis:redoBasis,action:'redo',ownerApproved:true});assert.equal(redo.ok,true);assert.deepEqual(redo.observed.websiteDraft.sections,changed.sections);basis=redo.observed;assert.ok((await request('website_history',{p_expected_revision:basis.revision,p_expected_hash:basis.websiteDraftHash,p_direction:null})).entries.length);
   await assert.rejects(()=>request('website_edit_design',{expectedRevision:old.revision,expectedDraft:old.websiteDraft,ownerApproved:true,patch:{action:'style',field:'spacing',value:'comfortable'}}));
   auth=await login(index);let fresh=await createConnectedBuilderSession({request}).open(owner.businessId);assert.deepEqual(fresh.websiteDraft,basis.websiteDraft);
   // Drop only the acknowledgement AFTER the actual finite endpoint replied.
   let writes=0;const uncertain=createConnectedBuilderSession({request:async(a,p)=>{const r=await request(a,p);if(a==='website_edit_text'){writes++;throw Error('Injected acknowledgement loss after endpoint reply');}return r;}});
   const u=await uncertain.open(owner.businessId),lost=await uncertain.website({basis:u,action:'edit_text',patch:{sectionId:'hero',field:'body',value:'Fictional lost-ack verification. Not a public website.'},ownerApproved:true});
   assert.equal(lost.unknown,true);assert.equal(lost.mayReplay,false);assert.equal(writes,1);assert.equal(lost.observed.websiteDraft.sections.find(x=>x.id==='hero').body,'Fictional lost-ack verification. Not a public website.');
   fresh=(await uncertain.reconcile()).observed;
   let status=await request('owner_status');const catalog=status.catalog||status.moduleCatalog;
   if(!status.app){const values={ownerId:fresh.actorId,businessId:owner.businessId,app:null,profile:fresh.profile,catalog};const review=prepareGoalToPrivateApp({...values,goal:'Show my services and let customers send an enquiry',selectedIds:[fresh.profile.services[0].id]});assert.equal(review.ok,true);
    const made=await executeGoalToPrivateApp({review,current:()=>values,isCurrent:()=>auth.signedIn,send:(a,p)=>request(a,{...p,expectedProfileRevision:fresh.profileRevision})});assert.equal(made.ok,true);status=made.status;
   }
   const app=status.app,edited=await request('apply_coordinated_edits',{appId:app.id,expectedRevision:app.draft_revision,expectedProfileRevision:fresh.profileRevision,ownerApproved:true,operations:[{kind:'text',field:'tagline',value:'Fictional private staging App'}]});
   assert.equal(edited.app.draft_revision,app.draft_revision+1);auth=await login(index);assert.deepEqual((await request('owner_status')).app.draft_config,edited.app.draft_config);
   await assert.rejects(()=>request('apply_coordinated_edits',{appId:app.id,expectedRevision:app.draft_revision,expectedProfileRevision:fresh.profileRevision,ownerApproved:true,operations:[{kind:'text',field:'tagline',value:'Must not overwrite newer work'}]}));
   const contentScope={},contentCurrent=()=>({scope:contentScope,ownerId:fresh.actorId,businessId:owner.businessId,role:'owner',ready:auth.signedIn});
   const growth=()=>createGrowthOpportunityAccount({enabled:true,getCurrent:contentCurrent,authenticatedRequest:(name,args)=>request('growth_'+name,args)});
   const creator=()=>createCreatorDraftAccount({enabled:true,getCurrent:contentCurrent,authenticatedRequest:(name,args)=>request('creator_'+name,args)});
   const opportunityApi=growth(),create=opportunityApi.review({action:'create',fields:{title:'Fictional owner supplied notice',description:fresh.profile.description||'Fictional preparation',source:'Fictional staging owner notice',serviceId:fresh.profile.services[0].id,permission:'permitted'},operationId:'staging_growth_'+crypto.randomUUID()});
   const created=await opportunityApi.commit(create);assert.equal(created.ok,true);let opportunity=await opportunityApi.read(created.receipt.opportunityId);
   assert.equal((await opportunityApi.commit(opportunityApi.review({action:'reinspect',base:opportunity,operationId:'staging_review_'+crypto.randomUUID()}))).ok,true);opportunity=await opportunityApi.read(opportunity.opportunityId);
   const reference=opportunityApi.reference(opportunity);assert.ok(reference);const draftId='staging_content_'+crypto.randomUUID(),content={schemaVersion:1,text:'Fictional private content. Not published.',brief:fresh.profile.services[0].description,format:'social',treatment:'standard',channels:[],media:[],brandFingerprint:fresh.profileHash,ownerFacts:fresh.profile.description||'',preparedCopy:'Owner-reviewed fictional wording.'};
   const contentApi=creator(),savedContent=await contentApi.commit(contentApi.review({draftId,content,reference,requestKey:'staging_creator_'+crypto.randomUUID()}));assert.equal(savedContent.ok,true);
   auth=await login(index);assert.deepEqual((await creator().read(draftId)).content,content);assert.equal((await growth().read(opportunity.opportunityId)).contactPermission,'not_established');
   // Existing fictional request must be separately provisioned through its
   // original bounded source. This harness cannot manufacture consumer authority.
   const journey=createConnectedEnquiryJourney({request,businessId:owner.businessId,ownerId:fresh.actorId,isCurrent:()=>auth.signedIn});
   const reviewed=await journey.review(owner.requestId),imported=await journey.importSource(reviewed);assert.equal(imported.ok,true);
   const filed=await journey.file(imported.review,{name:'Fictional staging contact',email:'fictional-contact@example.invalid',phone:'',address:'',service:fresh.profile.services[0].name,eventDate:owner.quoteDate,eventTime:'10:00',note:'Explicit separate-contact test; no inferred person matching',confidence:'Medium'});assert.equal(filed.ok,true);
   const customer=filed.observed.customer.id,enquiry=filed.observed.enquiry.id,scope={},current={scope,ownerId:fresh.actorId,businessId:owner.businessId,role:'owner',ready:true,revision:filed.observed.revision};
   const bind=()=>createCanonicalWorkSession().bind({enabled:true,getCurrent:()=>current,authenticatedRequest:(name,args)=>request('work_'+name,args)});
   const work=bind(),source=await work.source(customer,enquiry,current.revision),editor={customerId:customer,engagementId:null,typingEpoch:1,view:'workHub',sourceStamp:'Exact reviewed staging source',fields:{amount:'95.50',text:'Fictional private quote — not issued or accepted.',date:owner.quoteDate}};
   const ticket=work.review({operation:'create',source,fields:editor.fields,operationId:'staging-quote-'+crypto.randomUUID(),editor});assert.ok(ticket);const quote=await work.commit(ticket,()=>editor);assert.equal(quote.status,'confirmed');
   auth=await login(index);const reopened=await bind().read(customer,quote.receipt.engagementId);assert.equal(reopened.status,'Prepared');assert.equal(reopened.record.details.message,editor.fields.text);
   const reopenedJourneys=await request('journey_list');assert.ok(reopenedJourneys.items.some(x=>x.record?.customer?.id===customer));
   await auth.signOut();assert.equal(auth.signedIn,false);await assert.rejects(()=>request('builder_read'));
   observations.push({owner:index===0?'A':'B',realAuth:true,tenantDenial:true,approvedFactsReadback:true,creatorFreshAuthReadback:true,growthSourceReviewed:true,websiteReadback:true,websiteHistoryReopened:true,atomicPageUndoRedo:true,unknownOutcomeNoReplay:true,appReopened:true,customerProvenance:true,privateQuoteReopened:true,signOutInvalidated:true});
  }
  return {status:'hosted-observations-require-independent-review',hostedObservations:true,hostedAcceptance:false,observations,nativeAcceptance:false,productionReady:false,separateChecksRequired:connectedAcceptancePlan().separateChecksRequired};
 }finally{for(const inspector of inspectors)inspector.clearLocal();}
}
