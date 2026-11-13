import assert from 'node:assert/strict';
import {savedAnnouncementEligible,savedAnnouncementStamp,savedAnnouncementOwnerFacts} from '../src/core/savedAnnouncementSource.mjs';
import {prepareOwnerAnnouncementHandoff} from '../src/core/socialBrandHandoffV3199.mjs';
const businessId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',original='Blue mugs £8 until Friday. Collection only.';
const initial=prepareOwnerAnnouncementHandoff({businessId,ownerFacts:original,channel:'poster',treatment:'detailed'});
assert.equal(initial.ok,true);
const record={id:'one',status:'Draft',text:initial.copy,contentEvidence:initial,businessId},records=[record],stamp=savedAnnouncementStamp(record);
assert.equal(savedAnnouncementEligible(record,businessId,records),true);
assert.equal(savedAnnouncementOwnerFacts(record,businessId),original);
for(const channel of ['poster','social','advert']){
 const next=prepareOwnerAnnouncementHandoff({businessId,ownerFacts:savedAnnouncementOwnerFacts(record,businessId),channel,treatment:'detailed'});
 assert.equal(next.ok,true);
 assert.equal(next.ownerFacts,original);
 assert.equal(next.copy.includes('BUSINESS UPDATE'),channel==='poster');
 if(channel==='poster')assert.equal(next.copy,record.text);
}
const edited={...record,text:record.text+'\n\nOwner added: ask for terms.'};
assert.equal(savedAnnouncementOwnerFacts(edited,businessId),edited.text);
assert.notEqual(savedAnnouncementStamp(edited),stamp);
assert.equal(savedAnnouncementOwnerFacts({...record,contentEvidence:{...initial,copy:'different preparation'}},businessId),record.text);
assert.equal(savedAnnouncementOwnerFacts(record,'other-business'),record.text);
assert.equal(savedAnnouncementOwnerFacts({...record,contentEvidence:{businessId,purpose:'owner-announcement',ownerSuppliedNotIndependentlyVerified:true}},businessId),record.text);
assert.equal(savedAnnouncementEligible(record,businessId,[record,{...record}]),false);
assert.equal(savedAnnouncementEligible({...record},businessId,records),false);
assert.equal(savedAnnouncementStamp(record),stamp);
console.log('PASS exact original prepared owner facts; no duplicate poster scaffolding; edited/legacy/foreign sources remain verbatim; exact selected instance and saved identity unchanged. No publication.');
