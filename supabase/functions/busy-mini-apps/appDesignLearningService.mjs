/**
 * V3.166: all operations are invoked only after owner/admin membership has
 * been established by busy-mini-apps. Database tables have service-role-only
 * access. Business ID must originate from validated membership, never body.
 */
import {validateDesignFeedback,normalizeDesignHistory} from "./appDesignLearning.mjs";
async function ownerDesignHistory(supabase,appForBusiness,businessId){
 const app=await appForBusiness(businessId);
 if(!app)return {appId:null,records:[],storageReady:true};
 const result=await supabase.from("busy_app_design_feedback")
  .select("app_id,draft_revision,feedback_context,verdict,field,value,evidence_source,baseline_warnings,proposed_warnings")
  .eq("business_id",businessId).eq("app_id",app.id)
  .order("created_at",{ascending:false}).order("id",{ascending:false}).limit(80);
 if(result.error)throw Error("Private design history is not available until the database migration is deployed.");
 const history=normalizeDesignHistory(result.data||[],app.id);
 if(!history.ok)throw Error("Private feedback history could not be validated.");
 return {appId:app.id,records:history.records,storageReady:true,
  limitedTo:80,privateBusinessOnly:true,noCrossBusinessLearning:true,
  noAIModelRetraining:true};
}
async function writeDesignFeedback(supabase,appForBusiness,
 businessId,userId,body,requestKey){
 const validated=validateDesignFeedback(body);
 if(!validated.ok)throw Error(validated.reason);
 if(typeof requestKey!=="string"||
    !/^[a-zA-Z0-9:_-]{8,160}$/.test(requestKey))
  throw Error("A unique owner feedback request key is required.");
 const app=await appForBusiness(businessId);
 if(!app||app.id!==validated.appId||
    Number(app.draft_revision)!==validated.expectedRevision)
  throw Error("Your private app changed. Reopen the current draft before recording feedback.");
 if(validated.context==="saved_revision"&&
    app.draft_config?.presentation?.[validated.field]!==validated.value)
  throw Error("Feedback about an applied design requires that exact saved private appearance.");
 const saved=await supabase.from("busy_app_design_feedback").insert({
  business_id:businessId,app_id:app.id,owner_user_id:userId,
  draft_revision:validated.expectedRevision,
  feedback_context:validated.context,verdict:validated.verdict,
  field:validated.field,value:validated.value,
  evidence_source:validated.source,
  baseline_warnings:validated.baselineWarnings,
  proposed_warnings:validated.proposedWarnings,request_key:requestKey
 }).select("id").single();
 if(saved.error){
  if(saved.error.code==="23505")throw Error("This feedback was already recorded. Refresh the private history.");
  throw Error("Private app design feedback could not be saved.");
 }
 return {feedbackRecorded:true,appId:app.id,
  draftRevision:validated.expectedRevision,
  feedbackContext:validated.context,
  ownerPreferenceOnly:validated.context==="preview",
  confirmedAfterSave:validated.context==="saved_revision",
  noScreenshotStored:true,noCustomerDataStored:true,
  publishedAppUnchanged:true,noAIModelRetraining:true};
}
async function eraseDesignHistory(supabase,appForBusiness,businessId,body){
 if(body?.ownerApproved!==true)throw Error("Owner approval is required to clear design learning.");
 const app=await appForBusiness(businessId);
 if(!app||app.id!==body?.appId)
  throw Error("Open the correct Business App before clearing feedback.");
 const del=await supabase.from("busy_app_design_feedback").delete()
  .eq("business_id",businessId).eq("app_id",app.id).select("id");
 if(del.error)throw Error("Private design history could not be cleared.");
 return {appId:app.id,cleared:true,removedCount:(del.data||[]).length,
  publicAppUnchanged:true,customerDataUnchanged:true};
}
export {ownerDesignHistory,writeDesignFeedback,eraseDesignHistory};
