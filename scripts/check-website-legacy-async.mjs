import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {createPrivateWebsiteAsyncGate} from '../src/core/privateWebsiteAsyncGate.mjs';
const source=readFileSync('src/app/AppController.js','utf8'),ast=parse(source,{sourceType:'module',plugins:['jsx']}),functions={};
function walk(n){if(!n||typeof n!=='object')return;if(n.type==='VariableDeclarator'&&n.id?.name&&n.init?.type==='ArrowFunctionExpression')functions[n.id.name]=source.slice(n.init.start,n.init.end);for(const[k,v]of Object.entries(n))if(!['loc','start','end'].includes(k)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}
walk(ast);const compile=(name,env)=>Function(...Object.keys(env),'return '+functions[name])(...Object.values(env));
const draft={id:'site',generation:3,pages:[{id:'home'}]},initial={ownerId:'a',businessId:'b',draft,deploymentId:'d',draftChangedSinceHosted:false};
let live=initial,release,fetches=0;const gate=createPrivateWebsiteAsyncGate();
const env={websiteAsyncGateRef:{current:gate},websiteBeginTask:lane=>gate.begin(lane,initial,live),websiteTaskCurrent:t=>gate.current(t,live)};
env.websiteTaskAwait=compile('websiteTaskAwait',env);
const request=compile('websitePublishingRequest',{...env,ownerAccessToken:()=>new Promise(r=>release=r),cloudWorkspace:{businessId:'b'},BUSY_WEBSITE_PUBLISH_URL:'https://fixture.invalid',BUSY_AI_TOKEN:'fixture',busyRequestId:()=> 'fixture',fetchWithTimeout:async(url,args)=>{fetches++;const body=JSON.parse(args.body);assert.equal(body.action,'status');assert.equal(body.businessId,'b');return {ok:true,json:async()=>({ok:true})};}});
let pending=request('status',{action:'publish',businessId:'foreign'});live={...initial,ownerId:'other'};release('token');await assert.rejects(pending,/changed/);assert.equal(fetches,0);
live=initial;pending=request('status',{action:'publish',businessId:'foreign'});await assert.rejects(()=>request('status'),/in progress/);release('token');assert.equal((await pending).ok,true);assert.equal(fetches,1);
const voice=compile('transcribeSelectedWebsiteAudio',{...env,websiteDraftRef:{current:draft},selectedWebsiteVoiceContextIsCurrent:()=>true,ExpoFile:class{exists=true;size=10;},voiceUploadEligible:()=>true,ownerAccessToken:()=>new Promise(r=>release=r),fetchWithTimeout:async()=>{fetches++;throw Error('must not send');}});
pending=voice('file://fixture',{draftId:'site'});assert.equal((await voice('file://fixture',{})).ok,false);live={...initial,businessId:'foreign'};release('token');assert.equal((await pending).ok,false);assert.equal(fetches,1);
// Changing a draft while a private HTML fetch is pending must never open it.
live=initial;let applied=0;const preview=compile('openHostedWebsitePreview',{...env,websitePublishingView:{previewDeployment:{id:'d',manifest:{}}},setWebsitePublishingAction:()=>{},setWebsitePublishingError:()=>{},websitePublishingRequest:async()=>({previewUrl:'fixture'}),signedPreviewPath:()=> 'index.html',previewPagesFromManifest:()=>[],BUSY_SUPABASE_URL:'https://fixture.invalid',readPrivateHostedPreviewHtml:()=>new Promise(r=>release=r),ownerSession:{userId:'a'},cloudWorkspace:{businessId:'b'},websiteDraft:draft,setHostedWebsitePreview:()=>applied++,setWebsitePreviewOpenedId:()=>applied++,go:()=>applied++});
pending=preview('d');await new Promise(r=>setTimeout(r,0));live={...initial,draft:{...draft,generation:4}};release('<html>fixture</html>');assert.equal(await pending,false);assert.equal(applied,0);
console.log('PASS: actual legacy transport/voice/preview handlers reject stale token and HTML completions, duplicate calls and payload overrides. Fake transport; no external calls.');

live=initial;let exports=0;const zip=compile('shareStandaloneWebsiteZip',{...env,websiteDraft:draft,Platform:{OS:'ios'},Sharing:{isAvailableAsync:()=>new Promise(r=>release=r)},setWebsiteBuilderNotice:()=>{},buildStandaloneWebsiteArchive:async()=>{exports++;throw Error('must not prepare');}});
pending=zip();live={...initial,ownerId:'other'};release(true);assert.equal(await pending,false);assert.equal(exports,0);
const approval=gate.begin('hosting',initial,initial);gate.finish(approval);assert.equal(gate.sourceCurrent(approval,initial),true);gate.setContext({...initial,businessId:'other'});gate.setContext(initial);assert.equal(gate.sourceCurrent(approval,initial),false);
