import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {stableJson} from '../src/core/stableJson.mjs';
import {validateCreativeComparisonAdmission,CREATIVE_COMPARISON_APPROVAL_VERSION,CREATIVE_COMPARISON_PROFILE} from '../supabase/functions/busy-builder-proposals/creativeComparisonAdmission.mjs';

// Synthetic approval/receipt engineering evidence only. No network, provider,
// credentials, database, native identity, central entitlement or spending.
const sha=async value=>createHash('sha256').update(value).digest('hex');
const clone=value=>structuredClone(value),now=Date.parse('2026-11-07T17:00:00Z');
const ids=Array.from({length:7},(_,i)=>'11111111-1111-4111-8111-'+String(i+1).padStart(12,'0'));
let passed=0;
const test=async(name,run)=>{await run();passed++;console.log('PASS '+name);};
async function fixture(model='gpt-6-astra'){
 const current={ownerId:ids[0],businessId:ids[1],website:{id:'fictional-private-draft',generation:4},profileRevision:1};
 const prepared={sourceStamp:stableJson({syntheticOnly:true,approvedWords:'Keep these words',generation:4}),inputDigest:'1'.repeat(64)};
 const binding={surface:'website',pageId:'home',projectId:current.website.id,sourceRevision:4,profileRevision:1,snapshotRevision:5};
 const projectionFor=(model,ceiling)=>({ok:true,model,budgetProfile:CREATIVE_COMPARISON_PROFILE,inputDigest:prepared.inputDigest,schemaDigest:'2'.repeat(64),sourceStamp:prepared.sourceStamp,envelopeDigest:(model==='gpt-6.1-sol'?'3':'4').repeat(64),requestDigest:(model==='gpt-6.1-sol'?'5':'6').repeat(64),limits:{inputTokens:8000,outputTokens:12000,maximumGBP:ceiling,requests:1,retries:0}});
 const solProjection=projectionFor('gpt-6.1-sol',.25),projection=model==='gpt-6.1-sol'?clone(solProjection):projectionFor('gpt-6-astra',1);
 const comparison={version:CREATIVE_COMPARISON_APPROVAL_VERSION,comparisonId:ids[2],ownerId:ids[0],businessId:ids[1],sourceStampDigest:await sha(prepared.sourceStamp),sourceInputDigest:prepared.inputDigest,schemaDigest:projection.schemaDigest,rendererDigest:'7'.repeat(64),source:{websiteId:current.website.id,generation:4,profileRevision:1,snapshotRevision:5},period:'2026-11-01',expiresAt:now+600000,maximumGBP:3,sol:{model:'gpt-6.1-sol',operationId:ids[3],requestNonce:ids[4]},astra:{model:'gpt-6-astra',operationId:ids[5],requestNonce:ids[6]}};
 const arm=model==='gpt-6.1-sol'?'sol':'astra';let reads=0;
 const receipt={operationId:ids[3],state:'settled',attempts:1,model:'gpt-6.1-sol',tariffRevision:1,goalHash:await sha(stableJson({inputDigest:solProjection.envelopeDigest,requestDigest:solProjection.requestDigest})),binding:clone(binding),maximumMicroGBP:200000,actualMicroGBP:100000,inputTokens:4000,outputTokens:10000,providerReceipt:'resp_synthetic_sol',pricing:{max_input:8000,max_output:12000},createdAt:new Date(now-60000).toISOString()};
 const options={comparison,current,prepared,projection,solProjection,operationId:comparison[arm].operationId,requestNonce:comparison[arm].requestNonce,binding,expectedRendererDigest:comparison.rendererDigest,now,estimatedGBP:arm==='sol'?.2:.8,readReceipt:async arg=>{reads++;assert.deepEqual(arg,{operationId:comparison.sol.operationId,requestNonce:comparison.sol.requestNonce});return receipt;},digestBytes:sha};
 return {options,receipt,get reads(){return reads;}};
}
await test('first Sol approval binds the closed exact source/renderer and reads no historical receipt',async()=>{const f=await fixture('gpt-6.1-sol'),result=await validateCreativeComparisonAdmission(f.options);assert.equal(result.ok,true);assert.equal(result.arm,'sol');assert.equal(result.maximumCurrentMicroGBP,250000);assert.equal(result.centralAdmissionRequired,true);assert.equal(f.reads,0);assert.equal(result.providerCalls,0);});
await test('later Astra requires one independently settled original Sol receipt and includes its actual cost',async()=>{const f=await fixture(),result=await validateCreativeComparisonAdmission(f.options);assert.equal(result.ok,true);assert.equal(result.arm,'astra');assert.equal(f.reads,1);assert.equal(result.priorCostMicroGBP,100000);assert.equal(result.maximumComparisonLiabilityMicroGBP,1100000);assert.equal(result.aggregateCeilingMicroGBP,3000000);});
const reject=async(name,change,model='gpt-6-astra')=>test(name,async()=>{const f=await fixture(model);change(f);const r=await validateCreativeComparisonAdmission(f.options);assert.equal(r.ok,false);assert.equal(r.providerCalls,0);assert.equal(r.sourceWrites,0);assert.ok(f.reads<=1);});
for(const [name,change]of [
 ['missing comparison cannot acquire an execution identity',f=>f.options.comparison=null],
 ['unreviewed comparison fields cannot broaden scope',f=>f.options.comparison.publish=true],
 ['unreviewed arm fields are refused',f=>f.options.comparison.sol.extra=true],
 ['unreviewed source fields are refused',f=>f.options.comparison.source.extra=true],
 ['legacy approval versions do not carry over',f=>f.options.comparison.version='busy.old-comparison.v1'],
 ['a comparison cannot exceed its original three-pound envelope',f=>f.options.comparison.maximumGBP=4],
 ['duplicate Sol/Astra operation identities are refused',f=>f.options.comparison.astra.operationId=f.options.comparison.sol.operationId],
 ['duplicate request nonces are refused',f=>f.options.comparison.astra.requestNonce=f.options.comparison.sol.requestNonce],
 ['an operation cannot masquerade as its own nonce',f=>f.options.comparison.sol.requestNonce=f.options.comparison.sol.operationId],
 ['foreign current owner is refused',f=>f.options.current.ownerId=ids[2]],
 ['foreign current business is refused',f=>f.options.current.businessId=ids[2]],
 ['changed source generation is refused',f=>f.options.current.website.generation++],
 ['changed profile revision is refused',f=>f.options.current.profileRevision++],
 ['changed snapshot binding is refused',f=>f.options.binding.snapshotRevision++],
 ['changed protected source words invalidate the comparison stamp',f=>f.options.prepared.sourceStamp+=' changed'],
 ['changed complete input hash is refused',f=>f.options.prepared.inputDigest='a'.repeat(64)],
 ['changed strict schema hash is refused',f=>f.options.projection.schemaDigest='a'.repeat(64)],
 ['a different renderer cannot borrow the comparison',f=>f.options.expectedRendererDigest='a'.repeat(64)],
 ['unproved renderer identity is refused',f=>delete f.options.expectedRendererDigest],
 ['unknown model cannot select another arm',f=>f.options.projection.model='unknown-model'],
 ['wrong operation cannot reuse the arm approval',f=>f.options.operationId=ids[0]],
 ['wrong request nonce is refused',f=>f.options.requestNonce=ids[0]],
 ['legacy four-thousand-output projection is refused',f=>f.options.projection.limits.outputTokens=4000],
 ['unreviewed input increase is refused',f=>f.options.projection.limits.inputTokens=8001],
 ['a retry-enabled projection is refused',f=>f.options.projection.limits.retries=1],
 ['legacy financial profile cannot use the new comparison',f=>f.options.projection.budgetProfile=null],
 ['unbounded Astra maximum is refused',f=>f.options.estimatedGBP=1.000001],
 ['unbounded or invalid calculated exposure is refused',f=>f.options.estimatedGBP=NaN],
 ['expired comparison approval is refused',f=>f.options.comparison.expiresAt=now],
 ['long-lived comparison approval is refused',f=>f.options.comparison.expiresAt=now+3600001],
 ['new accounting month cannot replenish comparison allowance',f=>f.options.comparison.period='2026-12-01'],
 ['approval cannot span a ledger-period boundary',f=>{f.options.now=Date.parse('2026-11-30T23:55:00Z');f.options.comparison.expiresAt=Date.parse('2026-12-01T00:01:00Z');}],
 ['missing independent receipt port prevents Astra',f=>delete f.options.readReceipt],
 ['a failed receipt read is inspect-only without retry',f=>f.options.readReceipt=async()=>{throw Error('Synthetic lost acknowledgement');}],
 ['foreign Sol receipt operation is refused',f=>f.receipt.operationId=ids[2]],
 ['a different model receipt cannot stand in for Sol',f=>f.receipt.model='gpt-6-astra'],
 ['forged Sol source or wire goal hash is refused',f=>f.receipt.goalHash='a'.repeat(64)],
 ['foreign original receipt binding is refused',f=>f.receipt.binding.projectId='foreign-draft'],
 ['wrong original tariff output coverage is refused',f=>f.receipt.pricing.max_output=4000],
 ['missing immutable tariff revision is refused',f=>delete f.receipt.tariffRevision],
 ['unexpected original receipt properties are refused',f=>f.receipt.extraAuthority=true],
 ['receipt from a previous ledger month is refused',f=>f.receipt.createdAt='2026-10-31T23:59:00Z'],
 ['receipt with future creation is refused',f=>f.receipt.createdAt=new Date(now+1).toISOString()],
 ['duplicate original Sol dispatch attempts are refused',f=>f.receipt.attempts=2],
 ['missing genuine provider-receipt identity is refused',f=>f.receipt.providerReceipt=null],
 ['Sol actual-cost overrun is retained and blocks Astra',f=>f.receipt.actualMicroGBP=200001],
 ['Sol financial ceiling above its reviewed maximum blocks Astra',f=>{f.receipt.maximumMicroGBP=250001;f.receipt.actualMicroGBP=200000;}],
 ['incomplete accounting usage blocks Astra',f=>f.receipt.outputTokens=null],
 ['Sol output usage over the admitted cap blocks Astra',f=>f.receipt.outputTokens=12001],
 ['Sol input usage over the admitted cap blocks Astra',f=>f.receipt.inputTokens=8001]
])await reject(name,change);
for(const state of ['reserved','dispatched','unknown','released'])await reject('unsettled original Sol state '+state+' blocks Astra without replay',f=>f.receipt.state=state);
await reject('the smaller first Sol ceiling is enforced before any receipt IO',f=>f.options.estimatedGBP=.250001,'gpt-6.1-sol');
await test('comparison getters are denied without running supplied code',async()=>{const f=await fixture();let invoked=false;Object.defineProperty(f.options.comparison,'maximumGBP',{get(){invoked=true;return 3;},enumerable:true});assert.equal((await validateCreativeComparisonAdmission(f.options)).ok,false);assert.equal(invoked,false);assert.equal(f.reads,0);});
await test('nested approval getters are denied without running supplied code',async()=>{const f=await fixture();let invoked=false;Object.defineProperty(f.options.comparison.sol,'operationId',{get(){invoked=true;return ids[3];},enumerable:true});assert.equal((await validateCreativeComparisonAdmission(f.options)).ok,false);assert.equal(invoked,false);assert.equal(f.reads,0);});
await test('malformed nested source data is denied before cloning any getter',async()=>{const f=await fixture();let invoked=false;f.options.comparison.sourceStampDigest={get hidden(){invoked=true;return 'secret';}};assert.equal((await validateCreativeComparisonAdmission(f.options)).ok,false);assert.equal(invoked,false);assert.equal(f.reads,0);});
await test('original receipt pricing getters are denied without running supplied code',async()=>{const f=await fixture();let invoked=false;Object.defineProperty(f.receipt.pricing,'max_output',{get(){invoked=true;return 12000;},enumerable:true});assert.equal((await validateCreativeComparisonAdmission(f.options)).ok,false);assert.equal(invoked,false);assert.equal(f.reads,1);});
await test('cyclic comparison structures are refused without recursion or receipt IO',async()=>{const f=await fixture();f.options.comparison.sourceStampDigest=f.options.comparison;assert.equal((await validateCreativeComparisonAdmission(f.options)).ok,false);assert.equal(f.reads,0);});
await test('caller comparison, source and original receipt remain unchanged',async()=>{const f=await fixture(),before=stableJson({comparison:f.options.comparison,current:f.options.current,binding:f.options.binding,receipt:f.receipt});assert.equal((await validateCreativeComparisonAdmission(f.options)).ok,true);assert.equal(stableJson({comparison:f.options.comparison,current:f.options.current,binding:f.options.binding,receipt:f.receipt}),before);});
console.log(JSON.stringify({passed,failed:0,syntheticApprovalAndReceiptOnly:true,providerCalls:0,hostedWrites:0,credentialReads:0,centralBudgetAuthorityReplaced:false,spendingGBP:0}));
