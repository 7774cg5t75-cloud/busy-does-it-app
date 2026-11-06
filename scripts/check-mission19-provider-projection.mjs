import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {mission16Fixture} from './lib/mission16-site-fixtures.mjs';
import {mission19MinimalCreativeDocument} from './lib/mission19-document-fixture.mjs';
import {prepareWebsiteCreativeDocument} from '../src/core/websiteCreativeDocumentReview.mjs';
import {creativeProviderSchema} from '../supabase/functions/busy-builder-proposals/liveCreativeAdapter.mjs';
import {creativeDocumentProviderSchema,projectWebsiteCreativeDocumentProviderRequest,parseWebsiteCreativeDocumentProviderResponse,WEBSITE_CREATIVE_DOCUMENT_PROPOSED_LIMITS} from '../supabase/functions/busy-builder-proposals/websiteIntelligenceProviderProjection.mjs';

const digestBytes=async value=>createHash('sha256').update(value).digest('hex'),model='synthetic-model-not-a-real-provider';
const clone=value=>JSON.parse(JSON.stringify(value));
const context=mission16Fixture(2),fixture=mission19MinimalCreativeDocument(context);
const prepared=await prepareWebsiteCreativeDocument(context,{goal:'Prepare a distinctive website using approved business information',approvedIntent:fixture.approvedIntent,digestBytes});
assert.equal(prepared.ok,true,prepared.reason);
const projection=await projectWebsiteCreativeDocumentProviderRequest(prepared,context,{model,digestBytes});assert.equal(projection.ok,true,projection.reason);
const proposal={version:prepared.version,scope:prepared.scope,explanation:'Synthetic transport fixture over exact approved sources; not a real model output.',document:fixture.document};
const response={id:'resp_synthetic_creative_document',model,status:'completed',usage:{input_tokens:3500,output_tokens:2200},output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(proposal)}]}]};
const parse=(value=response,p=projection,c=context)=>parseWebsiteCreativeDocumentProviderResponse(typeof value==='string'?value:JSON.stringify(value),p,prepared,c,{digestBytes});
let passed=0;
async function test(name,run){await run();passed++;console.log('PASS '+name);}

await test('v2 expression is a newly approved-input projection, never live limit activation',()=>{
 assert.equal(projection.version,'busy.website-design-intelligence-provider.v2');assert.deepEqual(projection.limits,WEBSITE_CREATIVE_DOCUMENT_PROPOSED_LIMITS);assert.equal(projection.wire.max_output_tokens,4000);assert.equal(projection.wire.service_tier,'default');assert.equal(projection.wire.store,false);assert.equal(projection.wire.tool_choice,'none');assert.deepEqual(projection.wire.tools,[]);assert.equal(projection.dispatchAllowed,false);assert.equal(projection.providerCalls,0);assert.equal(projection.tokenCount,null);assert.equal(projection.estimatedGBP,null);assert.equal(projection.livePolicyChanged,false);assert.equal(projection.separateRevisedOwnerApprovalRequired,true);
 const live=readFileSync('supabase/functions/busy-builder-proposals/liveCreativeAdapter.mjs','utf8'),ledger=readFileSync('supabase/functions/busy-builder-proposals/creativeLedger.mjs','utf8'),sql=readFileSync('docs/sql-proposals/ai-lab-foundation/install.sql','utf8');assert.match(live,/max_output_tokens:1000/);assert.match(ledger,/max_output!==1000/);assert.match(sql,/max_output BETWEEN 1 AND 4000/);
});
await test('new closed recursive provider schema keeps numeric bounds and only local refs',()=>{
 const schema=projection.wire.text.format.schema;assert.equal(schema.type,'object');assert.equal(schema.additionalProperties,false);assert.ok(schema.$defs.node);assert.equal(schema.$defs.node.anyOf.length,9);assert.ok(JSON.stringify(schema).includes('"$ref":"#/$defs/node"'));assert.ok(JSON.stringify(schema).includes('"minimum":'));assert.ok(JSON.stringify(schema).includes('"maximum":'));assert.throws(()=>creativeProviderSchema(prepared.schema),'Old v1 converter must not silently gain reference support');
});
await test('valid v2 response has source-linked copy but remains unverified and unsavable',async()=>{
 const result=await parse();assert.equal(result.ok,true,result.reason);assert.equal(result.origin,'unverified-provider-response');assert.equal(result.mayReview,false);assert.equal(result.maySave,false);assert.equal(result.mayPublish,false);assert.equal(result.providerCalls,0);assert.match(result.receiptStatus,/service-only/);assert.equal(result.accounting.outputTokens,2200);assert.deepEqual(result.proposal.document,fixture.document);assert.equal(result.separateRevisedOwnerApprovalRequired,true);
});
await test('model-supplied origin, cost and save labels cannot establish real receipt authority',async()=>{
 const result=await parse({...response,origin:'real-model',actualGBP:0,maySave:true,mayPublish:true});assert.equal(result.ok,true);assert.equal(result.origin,'unverified-provider-response');assert.equal(result.maySave,false);assert.equal(result.mayPublish,false);assert.equal(result.accounting.actualGBP,undefined);
});

for(const [name,value] of [['malformed','{bad'],['oversized','x'.repeat(98305)],['incorrect-model',{...response,model:'foreign-model'}],['missing-receipt',{...response,id:null}],['forged-receipt',{...response,id:'not a provider receipt'}],['incomplete',{...response,status:'incomplete'}],['tool-output',{...response,output:[{type:'function_call',name:'publish'}]}],['duplicate-message',{...response,output:[response.output[0],response.output[0]]}],['bad-usage',{...response,usage:{input_tokens:3.4,output_tokens:-1}}]])await test(name+' denied without a new dispatch',async()=>{const result=await parse(value);assert.equal(result.ok,false);assert.equal(result.providerCalls,0);assert.equal(result.maySave,false);});
for(const field of ['input_tokens','output_tokens'])await test(field+' overrun retains actual accounting without review authority',async()=>{const result=await parse({...response,usage:{...response.usage,[field]:4001}});assert.equal(result.ok,false);assert.equal(result.accounting[field==='input_tokens'?'inputTokens':'outputTokens'],4001);assert.equal(result.mayReview,false);});
for(const [name,change] of [['current-generation',c=>c.website.generation++],['owner',c=>c.ownerId='foreign-owner'],['business',c=>c.businessId='foreign-business'],['profile-revision',c=>c.profileRevision++],['unsaved-profile',c=>c.profile.description='New owner words at the same revision'],['unsaved-website',c=>c.website.sections[0].title='New exact owner heading']])await test('stale '+name+' denied',async()=>{const c=clone(context);change(c);assert.equal((await projectWebsiteCreativeDocumentProviderRequest(prepared,c,{model,digestBytes})).ok,false);assert.equal((await parse(response,projection,c)).ok,false);});
await test('copied or modified owner-intent preparation cannot mint original authority',async()=>{const p=clone(prepared);p.approvedIntent.allowBrandChange=true;assert.equal((await projectWebsiteCreativeDocumentProviderRequest(p,context,{model,digestBytes})).ok,false);assert.equal((await projectWebsiteCreativeDocumentProviderRequest(clone(prepared),context,{model,digestBytes})).ok,false);});
for(const option of [{maxOutputTokens:6000},{maximumGBP:1},{tariff:{verified:true}},{transport:'https://untrusted.invalid'},{provider:'untrusted-provider'},{tools:[{type:'web_search'}]}])await test('unsupported cost or execution option '+Object.keys(option)[0]+' denied',async()=>assert.equal((await projectWebsiteCreativeDocumentProviderRequest(prepared,context,{model,digestBytes,...option})).ok,false));
for(const [name,change] of [['output-cap',p=>p.wire.max_output_tokens=6000],['tools',p=>p.wire.tools=[{type:'web_search'}]],['admitted-cost',p=>p.estimatedGBP=.01],['ceiling',p=>p.limits.maximumGBP=1],['envelope',p=>p.envelopeDigest='a'.repeat(64)],['schema',p=>p.wire.text.format.schema.additionalProperties=true]])await test('altered '+name+' projection denied',async()=>{const p=clone(projection);change(p);assert.equal((await parse(response,p)).ok,false);});

function alteredProposal(change){const p=clone(proposal);change(p);return {...response,output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(p)}]}]};}
for(const [name,change] of [
 ['raw-html',p=>p.document.html='<script>publish()</script>'],
 ['css-property',p=>p.document.pages[0].sections[0].nodes[0].style={position:'fixed'}],
 ['malicious-copy',p=>p.document.pages[0].sections[0].nodes[0].copy.text='<script>publish()</script>'],
 ['foreign-source',p=>p.document.pages[0].sections[0].nodes[0].copy.sourceRefs[0].id='business:foreign-owner'],
 ['stale-source-revision',p=>p.document.pages[0].sections[0].nodes[0].copy.sourceRefs[0].revision++],
 ['invented-claim',p=>{p.document.pages[0].sections[0].nodes[1].copy.classification='derived';p.document.pages[0].sections[0].nodes[1].copy.text='Award-winning experts with guaranteed results.';}],
 ['provider-cost',p=>p.cost={GBP:0,approved:true}],
 ['model-owned-permission',p=>p.approvedIntent={allowBrandChange:true}],
 ['external-font',p=>p.document.brand={headingFont:'https://untrusted.invalid/font.woff2',bodyFont:'system-sans',palette:{ink:'#102D28',paper:'#F8F5ED',accent:'#E9BA73',muted:'#455850'},gradient:null}],
 ['foreign-image',p=>p.document.pages[0].sections[0].nodes.push({id:'foreign-photo',type:'image',asset:{storagePath:'foreign/image.jpg',revision:1,sha256:'a'.repeat(64)},alt:fixture.copy('business:name'),ratio:1,fit:'cover',focal:{x:50,y:50}})],
 ['external-customer-action',p=>p.document.pages[0].sections[0].nodes.at(-1).target={url:'https://untrusted.invalid'}],
 ['duplicate-node',p=>p.document.pages[0].sections[0].nodes.push(clone(p.document.pages[0].sections[0].nodes[0]))],
 ['unbounded-grid',p=>p.document.pages[0].sections[0].nodes.push({id:'bad-grid',type:'grid',columns:[1,1000],gap:16,align:'start',children:[{id:'grid-rule-a',type:'divider',weight:1},{id:'grid-rule-b',type:'divider',weight:1}]})]
])await test(name+' document denied by original compiler/source checks',async()=>{const result=await parse(alteredProposal(change));assert.equal(result.ok,false,result.reason);assert.equal(result.mayReview,false);assert.equal(result.accounting.providerReceipt,response.id);});

await test('valid source-backed image brief is descriptive only and does not generate an asset',async()=>{
 const result=await parse(alteredProposal(p=>p.document.imageBriefs=[{id:'future-atmosphere',role:'atmosphere',description:fixture.copy('business:description')} ]));assert.equal(result.ok,true,result.reason);assert.equal(result.providerCalls,0);assert.equal(result.maySave,false);assert.equal(result.proposal.document.imageBriefs.length,1);
});
await test('numeric/null enums remain typed without granting executable values',()=>{
 const schema=creativeDocumentProviderSchema({type:'object',properties:{scale:{enum:[.75,1,1.25]},choice:{const:null}},required:['scale','choice'],additionalProperties:false});assert.equal(schema.properties.scale.type,'number');assert.equal(schema.properties.choice.type,'null');
});
const closed=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const recursive=()=>({...closed({tree:{$ref:'#/$defs/node'}}),$defs:{node:{anyOf:[closed({value:{type:'string'}}),closed({children:{type:'array',items:{$ref:'#/$defs/node'},minItems:1,maxItems:4}})]}}});
await test('bounded local recursive definitions are preserved, not expanded or fetched',()=>{const schema=creativeDocumentProviderSchema(recursive());assert.equal(schema.properties.tree.$ref,'#/$defs/node');assert.equal(schema.$defs.node.anyOf[1].properties.children.items.$ref,'#/$defs/node');});
for(const [name,change] of [['external-ref',s=>s.properties.tree.$ref='https://untrusted.invalid/schema'],['unresolved-ref',s=>s.properties.tree.$ref='#/$defs/missing'],['root-ref',s=>s.properties.tree.$ref='#'],['open-properties',s=>s.$defs.node.anyOf[0].additionalProperties=true],['optional-field',s=>s.$defs.node.anyOf[0].required=[]],['schema-code',s=>s.$defs.node.anyOf[0].execute='publish'],['remote-definitions',s=>s.$id='https://untrusted.invalid/schema'],['invalid-range',s=>s.properties.extra={type:'number',minimum:100,maximum:2}]])await test(name+' schema denied before wire preparation',()=>{const s=recursive();change(s);assert.throws(()=>creativeDocumentProviderSchema(s));});
await test('invalid integrity output denies v2 projection',async()=>assert.equal((await projectWebsiteCreativeDocumentProviderRequest(prepared,context,{model,digestBytes:async()=>'-'})).ok,false));
await test('source changed while hashing is denied before returning a projection',async()=>{
 const c=mission16Fixture(2),f=mission19MinimalCreativeDocument(c),p=await prepareWebsiteCreativeDocument(c,{approvedIntent:f.approvedIntent,digestBytes});let counts=0;const result=await projectWebsiteCreativeDocumentProviderRequest(p,c,{model,digestBytes:async b=>{if(++counts===3)c.profile.description='Changed during request hashing';return digestBytes(b);}});assert.equal(result.ok,false);
});
await test('provider module still has no network, credential or spending-controller port',()=>{const source=readFileSync('supabase/functions/busy-builder-proposals/websiteIntelligenceProviderProjection.mjs','utf8');assert.doesNotMatch(source,/\b(?:fetch|transport|readCredential|reserve|dispatch|finish)\s*\(|Deno\.env|process\.env|BUSY_OPENAI_CREATIVE_PILOT_KEY/);assert.ok(!readFileSync('supabase/functions/busy-creative-pilot/index.ts','utf8').includes('websiteCreativeDocument'));});
console.log(JSON.stringify({suite:'mission19-provider-projection',passed,failed:0,providerCalls:0,requestBytes:projection.requestBytes,responseBytes:new TextEncoder().encode(JSON.stringify(response)).byteLength,projectedSchemaBytes:new TextEncoder().encode(JSON.stringify(projection.wire.text.format.schema)).byteLength,tokenCount:null,estimatedGBP:null,livePolicyChanged:false,modelQualityProven:false}));
