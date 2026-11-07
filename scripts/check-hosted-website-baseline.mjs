// Actual-export acceptance, plus negative source-integrity controls. The
// caller supplies the private read-only hosted export; no fixture substitutes
// for its positive baseline. This command never contacts a hosted service.
import assert from 'node:assert/strict';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {resolve} from 'node:path';
import {validateHostedBaselineSource,renderHostedBaseline,baselineHash} from './lib/hosted-website-baseline.mjs';
const args=process.argv.slice(2);assert.ok(args.length===1&&args[0].startsWith('--input='),'Use --input=/private/verified-hosted-source-envelope.json');
const file=resolve(args[0].slice(8));assert.equal(realpathSync(file),file);assert.equal(lstatSync(file).mode&0o077,0);assert.ok(lstatSync(file).size<2000000);
const bytes=readFileSync(file),source=JSON.parse(bytes),clone=x=>JSON.parse(JSON.stringify(x));let passed=0;
const test=(name,run)=>{run();passed++;console.log('PASS '+name);};
test('actual PostgreSQL text hashes and exact original B3 scope are current',()=>{const result=validateHostedBaselineSource(source);assert.equal(result.source.profileRevision,1);assert.equal(result.source.snapshotRevision,5);assert.equal(result.source.websiteGeneration,4);assert.equal(result.source.privateDraft,true);});
test('original renderer produces exact three private routes without changing source',()=>{const before=baselineHash(source),rendered=renderHostedBaseline(source);assert.deepEqual(rendered.pages.map(x=>x.id),['home','services','contact']);for(const page of rendered.pages){assert.ok(page.html.startsWith('<!doctype html>'));assert.equal((page.html.match(/<h1\b/g)||[]).length,1);assert.ok(!/<img\b|<iframe\b|<script\b/i.test(page.html));assert.equal(baselineHash(page.html),page.htmlSha256);}assert.equal(baselineHash(source),before);assert.equal(baselineHash(readFileSync(file)),baselineHash(bytes));});
const reject=(name,mutate)=>test(name,()=>{const changed=clone(source);mutate(changed);assert.throws(()=>validateHostedBaselineSource(changed));});
reject('offline fixture cannot be labelled hosted evidence',x=>{x.origin='deterministic-offline-fixture';});
reject('foreign Lab project is refused',x=>{x.target.projectId='pnjdlogwegnqbsfpcofw';});
reject('foreign original owner binding is refused',x=>{x.approvedBinding.ownerId='11111111-1111-4111-8111-111111111111';});
reject('foreign original business binding is refused',x=>{x.approvedBinding.businessId='11111111-1111-4111-8111-111111111111';});
reject('unreviewed binding fields cannot broaden the private source contract',x=>{x.approvedBinding.extraAuthority=true;});
reject('a source exported without read-only transaction evidence is refused',x=>{x.readback.readOnly='off';});
reject('original installation evidence cannot be substituted',x=>{x.evidenceSha256='0'.repeat(64);});
reject('unverified source hash is refused',x=>{x.sourceHashes.websiteDraftHash='0'.repeat(64);});
reject('changed parsed design cannot retain the PostgreSQL text proof',x=>{x.readback.packet.websiteDraft.theme.primary='#ffffff';});
reject('changed raw PostgreSQL text cannot retain its original hash',x=>{x.readback.postgresJsonb.websiteDraft+=' ';});
reject('rewritten PostgreSQL text and matching new hash cannot replace the approved B3 receipt',x=>{const draft=clone(x.readback.packet.websiteDraft);draft.theme.primary='#ffffff';const text=JSON.stringify(draft),hash=baselineHash(text);x.readback.packet.websiteDraft=draft;x.readback.postgresJsonb.websiteDraft=text;x.readback.packet.websiteDraftHash=hash;x.sourceHashes.websiteDraftHash=hash;});
reject('changed approved services are refused',x=>{x.readback.packet.profile.services[0].description='Unsupported replacement';});
reject('changed complete owner story is refused',x=>{x.readback.packet.websiteDraft.sections.find(s=>s.type==='text').body='Unsupported story';});
reject('changed protected owner action is refused',x=>{x.readback.packet.websiteDraft.sections.find(s=>s.id==='hero').cta='Different action';});
reject('changed page count is refused',x=>{x.readback.packet.websiteDraft.pages.pop();});
reject('unsupported route output cannot escape the private output directory',x=>{x.readback.packet.websiteDraft.pages[1].outputPath='../index.html';});
reject('lost Undo history is refused',x=>{x.readback.history.undo.pop();});
reject('publication and live profile state are refused',x=>{x.readback.profileMetadata.status='live';});
reject('a new public Website record is outside this baseline authority',x=>{x.readback.publicWebsiteCount=1;});
reject('a deployment record is outside this baseline authority',x=>{x.readback.deploymentCount=1;});
reject('native source observation time must match the envelope',x=>{x.observedAt='2026-01-01T00:00:00Z';});
assert.equal(baselineHash(readFileSync(file)),baselineHash(bytes));
console.log(JSON.stringify({passed,failed:0,positiveSource:'actual authorised private read-only Lab export',negativeCases:'modified in-memory copies only',hostedWrites:0,nativeSignIns:0,providerCalls:0,publication:false}));
