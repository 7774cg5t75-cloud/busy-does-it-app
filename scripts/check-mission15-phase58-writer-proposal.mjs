import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {preparePrivateEnquiryReply,enquiryReplyCustomerSource} from '../src/core/privateEnquiryReply.mjs';
const read=p=>readFileSync(p,'utf8'),base='docs/sql-proposals/phase58-snapshot/',writer=read(base+'writer.sql'),fence=read(base+'fence.sql'),rollback=read(base+'rollback-readonly.sql');
// Intent/source checks only. This is NOT a SQL parser, database execution or security proof.
for(const sql of [writer,fence,rollback]){assert.equal(sql.match(/\bBEGIN;/g)?.length,1);assert.equal(sql.match(/\bCOMMIT;/g)?.length,1);assert.equal((sql.match(/\$\$/g)||[]).length%2,0);assert.ok(!/https?:\/\/|service_role_key|SUPABASE_ACCESS_TOKEN/.test(sql));}
assert.ok(writer.indexOf('lock_writer(p_business_id)')<writer.indexOf('SELECT * INTO snap'));
assert.ok(writer.includes("member_role NOT IN ('owner','admin')"));assert.ok(!writer.includes("'staff','viewer'"));
assert.equal((writer.match(/SECURITY DEFINER SET search_path = pg_catalog, pg_temp/g)||[]).length,2);
assert.ok(writer.includes('WHERE m.business_id=p_business_id AND m.user_id=actor FOR UPDATE'));
assert.ok(writer.includes('snap.revision IS DISTINCT FROM p_expected_revision'));assert.ok(writer.includes('snap.schema_version IS DISTINCT FROM p_expected_schema'));
assert.ok(writer.includes("p_operation NOT IN ('private_reply_edit_text','private_reply_remove','newsletter_remove')"));
assert.ok(!/p_(path|payload|capability|role)\b/.test(writer));assert.ok(!/SET payload\s*=\s*p_/.test(writer));
assert.ok(writer.includes("jsonb_set(saved,'{text}',to_jsonb(p_new_text),false)"));assert.ok(writer.includes("target-'privateEnquiryReply'"));assert.ok(writer.includes('rows-idx'));
assert.ok(writer.includes('saved IS DISTINCT FROM p_expected_record'));assert.ok(writer.includes('target IS DISTINCT FROM p_expected_record'));assert.ok(writer.includes('source->1 IS DISTINCT FROM enquiry'));
assert.ok(writer.includes("LIKE '%Listing reference:%'"));assert.ok(writer.includes("saved->'provenance'"));
assert.ok(writer.includes('REVOKE ALL ON FUNCTION'));assert.ok(writer.includes('FROM PUBLIC,anon,authenticated,service_role'));assert.ok(writer.includes('TO authenticated;'));
assert.ok(fence.includes('PHASE58 REVIEW FUSE'));assert.ok(fence.includes('REVOKE ALL ON TABLE public.busy_business_snapshots FROM PUBLIC,anon,authenticated,service_role'));
assert.ok(fence.includes('GRANT INSERT (business_id)'));assert.ok(!/GRANT\s+(UPDATE|DELETE|TRUNCATE|ALL)/.test(fence));assert.ok(fence.includes('has_any_column_privilege'));assert.ok(fence.includes('has_column_privilege'));
assert.ok(!/GRANT\s+(UPDATE|DELETE|INSERT|ALL)/.test(rollback));assert.ok(!/DROP\s+(TABLE|SCHEMA)/.test(rollback));assert.ok(rollback.includes('REVOKE EXECUTE'));
// Match the current original reply source projection; no invented source fields.
const businessId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',ownerId='cccccccc-cccc-4ccc-8ccc-cccccccccccc',customer={id:'alex',name:'Alex',service:'Catering',contactOk:true,futureCustomerField:'keep'},item={id:'filed',filedCustomerId:'alex',status:'Filed',reviewedAt:'2026-10-22T12:00:00.000Z',rawText:'Customer request'};
const record=preparePrivateEnquiryReply({businessId,ownerId,customer,item,revision:1,text:'Owner words',purpose:'acknowledge'});assert.equal(record.version,2);assert.deepEqual(JSON.parse(record.sourceStamp),[enquiryReplyCustomerSource(customer),item]);
const sourceKeys=[...writer.matchAll(/a\.key IN \(([^)]+)\)/g)][0][1].match(/'[^']+'/g).map(x=>x.slice(1,-1));for(const key of Object.keys(enquiryReplyCustomerSource(customer)))assert.ok(sourceKeys.includes(key));assert.ok(!sourceKeys.includes('futureCustomerField'));
assert.equal(createHash('sha256').update(readFileSync('scripts/check-mission15-phase52-retention-contract.mjs')).digest('hex'),'1480655ab323ce18b6fcfc99e635f4abc77692e18c3d419b7debf201598b95c7');
for(const p of ['staging/phase58-snapshot/fixture.sql','staging/phase58-snapshot/assertions.sql'])assert.ok(read(p).includes("current_database()<>'busy_phase58_disposable'"));
console.log('PASS SQL proposal intent/source checks, actual original private-record shape, finite operations, membership/snapshot lock ordering, explicit preservation/removal expressions, legacy fence/rollback safeguards and unchanged loss counterexample. NOT PostgreSQL syntax/execution, real JWT, hosted RLS or retention enforcement. Prepared SQL assertions remain UNEXECUTED.');
