import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';import {reviewedFiledEnquiry} from '../src/core/quoteEnquiryReference.mjs';
const {parse}=createRequire(import.meta.url)('@babel/parser'),source=fs.readFileSync('src/app/AppController.js','utf8'),projections={};
function visit(n){if(!n||typeof n!=='object')return;if(n.type==='ObjectProperty'&&['customerEnquiryOriginItem','quoteEnquiryOriginItem'].includes(n.key?.name))projections[n.key.name]=source.slice(n.value.start,n.value.end);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v);}}
visit(parse(source,{sourceType:'module',plugins:['jsx']}));
const workspace={},item={id:'filed',status:'Filed',filedCustomerId:'a',rawText:'Unconfirmed preferences'},origin={workspace,customerId:'a',item,stamp:JSON.stringify(item)};
for(const name of Object.keys(projections)){
 const env={reviewedFiledEnquiry,replyActionOrigin:{current:origin},businessWorkspaceScopeRef:{current:workspace},selectedCustomerId:'a',selectedReplyActionId:'a',cloudWorkspace:{role:'owner'},inboxItems:[item]},read=()=>Function(...Object.keys(env),'return '+projections[name])(...Object.values(env));assert.equal(read(),item);
 env.cloudWorkspace.role='viewer';assert.equal(read(),null);env.cloudWorkspace.role='owner';env.inboxItems=[item,{...item}];assert.equal(read(),null);env.inboxItems=[];assert.equal(read(),null);env.inboxItems=[item];env.businessWorkspaceScopeRef.current={};assert.equal(read(),null);env.businessWorkspaceScopeRef.current=workspace;item.rawText='Changed source';assert.equal(read(),null);item.rawText='Unconfirmed preferences';assert.equal(read(),item);
}
assert.equal(reviewedFiledEnquiry({origin,workspace,customerId:'other',inboxItems:[item]}),null);assert.equal(reviewedFiledEnquiry({origin,workspace,customerId:'a',inboxItems:null}),null);
console.log('PASS actual customer and quote parent projections reuse one pure specialist rule; controller role check retained, scope/customer/deleted/replaced/duplicate/changed input fails. No state, hook, save, navigation or trusted authority moved.');
