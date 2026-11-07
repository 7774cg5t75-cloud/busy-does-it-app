// PREPARED ACCEPTANCE ONLY. Never creates users, records or hosted schema.
// Tokens/publishable key come from private environment, never CLI args/output.
import assert from 'node:assert/strict';
const designated='https://pnjdlogwegnqbsfpcofw.supabase.co';
if(process.env.BUSY_APPROVED_STAGING_ACCEPTANCE!=='READ_ONLY_TWO_OWNER'){
 console.log('BLOCKED: no authorised hosted read-only acceptance configuration; no network attempted.');process.exit(2);
}
const required=['BUSY_STAGING_URL','BUSY_STAGING_PUBLISHABLE_KEY','BUSY_STAGING_OWNER_A_JWT','BUSY_STAGING_OWNER_B_JWT','BUSY_STAGING_BUSINESS_A','BUSY_STAGING_BUSINESS_B'];
for(const name of required)if(!process.env[name])throw Error('Private acceptance configuration incomplete');
assert.equal(process.env.BUSY_STAGING_URL,designated);
const business=[process.env.BUSY_STAGING_BUSINESS_A,process.env.BUSY_STAGING_BUSINESS_B],tokens=[process.env.BUSY_STAGING_OWNER_A_JWT,process.env.BUSY_STAGING_OWNER_B_JWT];
assert.notEqual(business[0],business[1]);const users=[],safeResults=[];
async function call(path,token,body){const r=await fetch(designated+path,{method:body?'POST':'GET',redirect:'error',headers:{apikey:process.env.BUSY_STAGING_PUBLISHABLE_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,value:await r.json()};}
for(let n=0;n<2;n++){
 const who=await call('/auth/v1/user',tokens[n]);assert.equal(who.status,200);assert.match(who.value.id,/^[a-f0-9-]{36}$/i);users.push(who.value.id);
 const spaces=await call('/rest/v1/rpc/busy_connected_workspaces_v1',tokens[n],{});assert.equal(spaces.status,200);assert.equal(spaces.value.actorId,who.value.id);assert.ok(spaces.value.items.some(x=>x.businessId===business[n]));
 for(const rpc of ['busy_connected_builder_read_v1','busy_connected_journeys_v1']){
  for(let fresh=0;fresh<2;fresh++){const own=await call('/rest/v1/rpc/'+rpc,tokens[n],{p_business_id:business[n]});assert.equal(own.status,200);assert.equal(own.value.businessId,business[n]);assert.equal(own.value.ownerId||own.value.actorId,who.value.id);}
  const foreign=await call('/rest/v1/rpc/'+rpc,tokens[n],{p_business_id:business[1-n]});assert.ok(foreign.status>=400&&foreign.status<500);assert.equal(foreign.value.code,'42501');
 }
 safeResults.push({owner:n===0?'A':'B',freshScopedReads:true,crossTenantDenied:true});
}
assert.notEqual(users[0],users[1]);console.log(JSON.stringify({hosted:true,readOnly:true,results:safeResults,mutationAcceptance:false,nativeAcceptance:false}));
