import {validatePublicFormProjection} from '../../../src/core/publicFormDisclosure.mjs';
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(x);
export async function privateDisclosureService({client,businessId,actorId,app,body,enabled,projectUrl}){
 if(enabled!=='true'||projectUrl!=='https://pnjdlogwegnqbsfpcofw.supabase.co')throw Error('Disclosure preparation is disabled.');
 if(app?.created_by!==actorId||app.business_id!==businessId||body.appId!==app.id||!['disclosure_approve','disclosure_read','disclosure_revoke'].includes(body.operation)||Object.keys(body).some(k=>!['operation','appId','disclosure','action','businessId','expectedProfileRevision','connectedStaging'].includes(k)))throw Error('Open the exact owned App.');
 const r=await client.rpc('busy_private_form_disclosure_v1',{b:businessId,actor:actorId,a:app.id,action:body.operation.slice(11),data:body.disclosure});if(r.error)throw r.error;if(!validatePublicFormProjection(r.data?.projection).ok)throw Error('Public-safe projection could not be verified.');return {ok:true,...r.data};
}
// Internal adapter only: not wired to the public guest Edge action dispatcher.
export function createFormGuestService({client,disclosureEnabled=false,submitEnabled=false}){
 const shape=(o,keys)=>{if(!o||Array.isArray(o)||Object.keys(o).some(k=>!keys.includes(k)))throw Error('Unsupported form request fields');return o;};
 const rpc=async(name,args)=>{if(disclosureEnabled!==true)throw Error('Customer form disclosure is disabled.');const r=await client.rpc(name,args);if(r.error)throw r.error;return r.data;};
 return {
  async read(id){if(!uuid(id))throw Error('Exact disclosed form required');const p=await rpc('busy_form_disclosure_read_v1',{id});if(!validatePublicFormProjection(p).ok)throw Error('Unsafe public form projection');return p;},
  async review(body){const {id,answers,contact,consent,interest=null}=shape(body,['id','answers','contact','consent','interest']);if(!uuid(id))throw Error('Exact disclosed form required');if(interest!==null&&typeof interest!=='object')throw Error('Typed source interest required');return rpc('busy_form_disclosure_prepare_v1',{id,answers,contact,interest,consent});},
  async challenge(body){const {id,tokenHash,fingerprintHash,seed}=shape(body,['id','tokenHash','fingerprintHash','seed']);if(submitEnabled!==true)throw Error('Public form submission is disabled.');return rpc('busy_form_guest_challenge_v1',{id,h:tokenHash,f:fingerprintHash,seed});},
  async submit(body){const {challengeId,token,fingerprintHash,solution,requestKey,answers,contact,interest=null,consent,accessHash}=shape(body,['challengeId','token','fingerprintHash','solution','requestKey','answers','contact','interest','consent','accessHash']);if(submitEnabled!==true)throw Error('Public form submission is disabled.');return rpc('busy_form_guest_submit_v1',{challenge:challengeId,token,fingerprint:fingerprintHash,solution,key:requestKey,answers,contact,interest,consent,access_hash:accessHash});},
  async receipt(body){const {challengeId,token,fingerprintHash,solution,requestKey}=shape(body,['challengeId','token','fingerprintHash','solution','requestKey','accessHash']);return rpc('busy_form_guest_receipt_v1',{challenge:challengeId,token,fingerprint:fingerprintHash,solution,key:requestKey});}
 };
}
