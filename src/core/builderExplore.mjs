import {beginWebsiteConversation,addWebsiteConversationTurn} from './websiteDesignConversation.mjs';
import {planUniversalBuilderRequest} from './universalBuilderPlanV3210.mjs';
import {planAppVoiceInstructions} from './appCoordinatedStudio.mjs';
import {planWebsitePageInstructions} from './websitePageInstructions.mjs';
import {explainBuilderExplore} from './builderExploreAnswers.mjs';
import {canonicalJsonValue} from './stableJson.mjs';
import {applyWebsiteVisualEdit} from '../../supabase/functions/busy-website-worker/designEdits.mjs';
import {prepareSelectedWebsiteTransaction} from './websiteContextPlan.mjs';
function websiteIdea(project,instruction){
 const plan=planWebsitePageInstructions(project,{draftId:project.id,generation:project.generation,pageId:'home',instruction});
 if(!plan.ok)return plan;
 const dry=prepareSelectedWebsiteTransaction(project,plan,{layoutEdit:(draft,change)=>{const result=applyWebsiteVisualEdit(draft,{...change,kind:'layout'});return result.applied?{...result,draft:{...result.draft,generation:draft.generation+1}}:result;},fieldEdit:()=>({applied:false})});
 return dry.applied?plan:{ok:false,reason:dry.reason};
}
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
function builderExploreSource({kind,ownerId,businessId,project,catalog=[]}={}){
 if(!['app','website'].includes(kind)||!uuid.test(ownerId||'')||!uuid.test(businessId||'')||!project?.id)return null;
 if(kind==='app'?project.business_id!==businessId:project.businessId&&project.businessId!==businessId||project.business_id&&project.business_id!==businessId)return null;
 const revision=kind==='app'?project.draft_revision:project.generation;
 if(!Number.isSafeInteger(revision)||revision<1)return null;
 if(!Array.isArray(catalog)||catalog.length>50)return null;
 let stamp,catalogStamp;try{stamp=JSON.stringify(canonicalJsonValue(project));catalogStamp=JSON.stringify(canonicalJsonValue(catalog));}catch{return null;}
 if(catalogStamp.length>60000)return null;
 if(stamp.length>600000)return null;
 return {kind,ownerId,businessId,projectId:project.id,revision,stamp,catalogStamp};
}
function currentBuilderExplore(session,context){return !!session?.ok&&JSON.stringify(session.source)===JSON.stringify(builderExploreSource(context));}
function beginBuilderExplore(context){
 const source=builderExploreSource(context);if(!source)return {ok:false,reason:'Open a current authorised private project first.'};
 const conversation=beginWebsiteConversation({draftId:source.projectId,pageId:source.kind,generation:source.revision,workspaceId:source.ownerId+':'+source.businessId});
 return {ok:true,source,conversation,idea:null,audit:[],localOnly:true,noProviderCalls:true};
}
// A closed, deterministic execution boundary: no injected tools, transport,
// editor callbacks, saved notes, provider, microphone upload or AI executor.
function runBuilderExplore(session,context,request){
 const deny=reason=>({ok:false,reason,session:{...session,audit:[...(session?.audit||[]),{decision:'denied',code:'EXPLORE_READ_ONLY'}].slice(-8)}});
 if(!currentBuilderExplore(session,context))return deny('The owner, business or source changed. Exit and reopen Talk & Explore.');
 if(!request||Object.keys(request).some(key=>!['type','text'].includes(key))||request.type!=='discuss'||typeof request.text!=='string'||!request.text.trim()||request.text.length>400)return deny('Talk & Explore accepts discussion only. Nothing was changed or sent.');
 const text=request.text.trim(),project=JSON.parse(session.source.stamp);
 const plan=planUniversalBuilderRequest({businessId:session.source.businessId,request:text,catalog:JSON.parse(session.source.catalogStamp),...session.source.kind==='app'?{app:project}:{website:project}});
 const hypothetical=/^what would happen if I moved (?:the )?([a-z][a-z -]{0,50}?) (above|below) (?:the )?([a-z][a-z -]{0,50}?)\??$/i.exec(text);
 const instruction=hypothetical?'move '+hypothetical[1].replace(/ section$/i,'')+(session.source.kind==='website'?' section':'')+' '+hypothetical[2]+' '+hypothetical[3].replace(/ section$/i,''):text;
 const edit=session.source.kind==='app'?planAppVoiceInstructions(project.draft_config,instruction):websiteIdea(project,instruction);
 const explanation=explainBuilderExplore({kind:session.source.kind,project,catalog:JSON.parse(session.source.catalogStamp),plan,text});
 const answer=edit.ok?'We can prepare this idea for you to review. '+(edit.changes||edit.steps.map(step=>step.description)).join(' '):explanation.answer;
 let conversation=addWebsiteConversationTurn(session.conversation,session.conversation.scope,{role:'owner',text});
 conversation=addWebsiteConversationTurn(conversation,conversation.scope,{role:'busy',text:answer});
 return {ok:true,answer,session:{...session,conversation,alternatives:edit.ok?[]:explanation.alternatives.filter(idea=>(session.source.kind==='app'?planAppVoiceInstructions(project.draft_config,idea.instruction):websiteIdea(project,idea.instruction)).ok),idea:edit.ok?{instruction,summary:edit.changes||edit.steps.map(step=>step.description)}:null},noChangesPerformed:true,noChargeMade:true};
}
function prepareBuilderExploreHandoff(session,context,{ownerConfirmed=false}={}){
 if(ownerConfirmed!==true||!currentBuilderExplore(session,context)||!session.idea)return {ok:false,reason:'Explicitly review a supported idea against the current project before leaving Explore.'};
 // Re-plan original source. Neither a conversational yes nor caller-supplied
 // nextConfig/operations is authority. This function cannot save/apply/publish.
 const p=context.project,instruction=session.idea.instruction;
 const proposal=session.source.kind==='app'?planAppVoiceInstructions(p.draft_config,instruction):websiteIdea(p,instruction);
 return proposal.ok?{ok:true,source:{...session.source},instruction,summary:session.idea.summary,proposal,cost:'Local preparation: £0. No provider or publication action.',privateOnly:true,requiresSeparateEditorApproval:true}:proposal;
}
export {builderExploreSource,currentBuilderExplore,beginBuilderExplore,runBuilderExplore,prepareBuilderExploreHandoff};
