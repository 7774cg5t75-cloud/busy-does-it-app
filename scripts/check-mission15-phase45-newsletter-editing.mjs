import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {readNewsletterWording,editNewsletterWording} from '../src/core/brandedContentDraftV3198.mjs';
const f=createRequire(import.meta.url)('./lib/content-preparation-fixture.cjs')({approvedProfile:{businessId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',fingerprint:'approved',businessName:'Elm',description:'Studio.'}});
f.render();f.actions.prepare('','','','owner-announcement','Blue mugs £8 until Friday. Collection only.','welcoming',false,'newsletter');f.render();let pending=f.data.sourceContext.pendingContentIdea;f.actions.accept(pending,f.actions.capture());f.render();
const {SocialDraftReview}=f.rt.load('src/screens/social.js');const tree=()=>f.rt.render(SocialDraftReview,{s:{...f.state(),socialPublishingStatus:{}}});
let panel=tree();const subject=f.find(panel,'Email subject'),body=f.find(panel,'Newsletter body'),original=readNewsletterWording(f.data.text);
assert.ok(subject&&body);subject.props.onChangeText('Handmade mugs — your questions answered');assert.equal(readNewsletterWording(f.data.text).body,original.body);
// Independent body editing merges the latest subject, including before a render.
body.props.onChangeText('Blue mugs £8 until Friday.\nCollection only.\nOwner-edited exact terms.');assert.equal(readNewsletterWording(f.data.text).subject,'Handmade mugs — your questions answered');f.render();
const exact=f.data.text;assert.equal(f.actions.editNewsletterPart('subject','Header\nBcc: somebody@example.org'),false);assert.equal(f.data.text,exact);
const stale=f.actions.editNewsletterPart;f.actions.prepare('','','','owner-announcement','Different update.','standard',false,'newsletter');f.render();pending=f.data.sourceContext.pendingContentIdea;f.actions.accept(pending,f.actions.capture());f.render();assert.equal(stale('subject','Old subject'),false);assert.ok(!f.data.text.includes('Old subject'));
assert.equal(editNewsletterWording('Owner copy without an email header','subject','New subject'),null);assert.equal(readNewsletterWording('Subject: a\nBody').body,'Body');assert.equal(editNewsletterWording('Subject: a\nBody','subject','b'),'Subject: b\nBody');
f.actions.editText('Owner copy without an email header');f.render();assert.ok(f.find(tree(),'Subject and newsletter wording'));assert.equal(f.data.text,'Owner copy without an email header');
console.log('PASS original private newsletter review edits subject/body independently in one original text record, preserves exact terms and separators, rejects stale targets/header controls, and keeps arbitrary owner wording editable without forced reformatting.');
