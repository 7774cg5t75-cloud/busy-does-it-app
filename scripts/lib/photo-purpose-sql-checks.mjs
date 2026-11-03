import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPhotoPurposeAccount} from '../../src/core/photoPurposeAccount.mjs';
export async function checkPhotoPurposeSQL({sql,packet,q,stage,B,O,F,P}){
 const install=readFileSync('docs/sql-proposals/media-use/private-purpose.sql','utf8'),rollback=readFileSync('docs/sql-proposals/media-use/rollback-retaining.sql','utf8');
 const A='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',sha='a'.repeat(64),path=B+'/'+O+'/'+A+'.png';
 const call=(action,actor,asset,digest,revision=null,decisions=null,operation=null,enabled=true,business=B)=>packet("BEGIN;SET LOCAL ROLE service_role;"+(enabled?"SET LOCAL app.busy_private_media_purpose='reviewed-local-only';":'')+'SELECT public.busy_original_media_purpose_v1('+[action,business,actor,asset,digest,revision,decisions,operation].map(q).join(',')+');COMMIT;');
 await stage('media-purpose-original-registry-fuse-and-separate-local-install',()=>{
  // Synthetic Storage metadata only; this is not a hosted object service.
  sql("CREATE SCHEMA IF NOT EXISTS storage;CREATE TABLE IF NOT EXISTS storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);CREATE TABLE IF NOT EXISTS storage.objects(bucket_id text,name text,PRIMARY KEY(bucket_id,name));");
  sql(readFileSync('supabase/migrations/20261011000000_busy_website_original_media.sql','utf8'));
  assert.throws(()=>sql(install));assert.equal(sql("SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='busy_website_original_media' AND column_name='private_use_revision'"),'0');
  sql(install.replace(/^DO \$\$ BEGIN RAISE EXCEPTION 'MEDIA PURPOSE REVIEW FUSE:.*?\n/m,''));assert.throws(()=>sql(install.replace(/^DO \$\$ BEGIN RAISE EXCEPTION 'MEDIA PURPOSE REVIEW FUSE:.*?\n/m,'')));
  sql('INSERT INTO storage.objects(bucket_id,name)VALUES(\'busy-website-originals\','+q(path)+');INSERT INTO public.busy_website_original_media(id,business_id,uploaded_by,storage_path,content_type,byte_length,sha256)VALUES('+[A,B,O,path,'image/png',100,sha].map(q).join(',')+');');
  assert.throws(()=>call('inspect',O,A,sha,null,null,null,false));
 });
 let current,operation=0,saveCalls=0,drop=false,enabled=true;
 const source={assetId:A,sha256:sha},scope={},api=createPhotoPurposeAccount({getCurrent:()=>({scope,ownerId:O,businessId:B,role:'owner',ready:true}),randomUUID:()=>`11111111-1111-4111-8111-${String(++operation).padStart(12,'0')}`,request:async(action,p)=>{const r=call(action.endsWith('save')?'save':'inspect',O,p.assetId,p.sha256,p.expectedRevision,p.decisions,p.operationId,enabled);if(action.endsWith('save')){saveCalls++;if(drop)throw Error('Lost real committed SQL response');}return r;}});
 await stage('media-purpose-real-save-independent-readback-reopen-and-withdrawal',async()=>{
  current=await api.inspect(source);assert.equal(current.revision,0);const decisions={website_hero:'approved',creator_draft:'approved',marketing_material:'withdrawn'},saved=await api.commit(api.review(current,decisions));assert.equal(saved.ok,true);current=await api.inspect(source);assert.deepEqual(current.decisions,decisions);assert.equal(current.publicUseAuthorised,false);
  const op=sql('SELECT private_use_history->0->>\'operationId\' FROM public.busy_website_original_media WHERE id='+q(A));const duplicate=call('save',O,A,sha,0,decisions,op);assert.equal(duplicate.duplicate,true);assert.equal(duplicate.revision,1);assert.throws(()=>call('save',O,A,sha,0,{},op));
  const changed={...decisions,creator_draft:'withdrawn'};const next=await api.commit(api.review(current,changed));assert.equal(next.ok,true);current=next.observed;
  const ref={kind:'website_original',id:'chosen',assetId:A,sha256:sha,fileName:'chosen.png',width:600,height:400,privateUseReviewed:true};
  assert.throws(()=>sql('SELECT busy_creator_private.media_projection('+[B,O,[ref],true].map(q).join(',')+')'));
  assert.equal(JSON.parse(sql('SELECT busy_creator_private.media_projection('+[B,O,[ref],false].map(q).join(',')+')'))[0].state,'eligible','Historical private read remains; withdrawal denies new Creator writes');
 });
 await stage('media-purpose-real-unknown-commit-recovery-never-replays',async()=>{
  drop=true;const result=await api.commit(api.review(current,{website_gallery:'approved'}));assert.equal(result.status,'unknown');assert.equal(api.review(current,{}),null);const count=saveCalls;drop=false;const found=await api.recover();assert.equal(found.found,true);assert.equal(found.ownReceiptRecovered,false);assert.equal(saveCalls,count);current=found.observed;
 });
 await stage('media-purpose-original-owner-cas-malformed-and-direct-access-denials',()=>{
  for(const fn of [()=>call('inspect',P,A,sha),()=>call('inspect',O,A,sha,null,null,null,true,F),()=>call('inspect',O,A,'b'.repeat(64)),()=>call('save',O,A,sha,0,{},'22222222-2222-4222-8222-222222222222'),()=>call('save',O,A,sha,current.revision,{publish:'approved'},'22222222-2222-4222-8222-222222222222'),()=>call('save',O,A,sha,current.revision,{website_hero:true},'22222222-2222-4222-8222-222222222222')])assert.throws(fn);
  for(const role of ['anon','authenticated']){assert.throws(()=>sql('BEGIN;SET LOCAL ROLE '+role+';SELECT * FROM public.busy_website_original_media;COMMIT;'));assert.throws(()=>sql('BEGIN;SET LOCAL ROLE '+role+';SELECT public.busy_original_media_purpose_v1('+['inspect',B,O,A,sha].map(q).join(',')+');COMMIT;'));}
  sql('DELETE FROM public.busy_business_memberships WHERE business_id='+q(B)+' AND user_id='+q(O));assert.throws(()=>call('inspect',O,A,sha));sql('INSERT INTO public.busy_business_memberships(business_id,user_id,role)VALUES('+[B,O,'owner'].map(q).join(',')+')');
  sql("UPDATE storage.buckets SET public=true WHERE id='busy-website-originals'");assert.throws(()=>call('inspect',O,A,sha));sql("UPDATE storage.buckets SET public=false WHERE id='busy-website-originals'");
 });
 await stage('media-purpose-retaining-rollback-preserves-original-history',()=>{
  const before=sql('SELECT private_use_history FROM public.busy_website_original_media WHERE id='+q(A));assert.throws(()=>sql(rollback));sql(rollback.replace(/^DO \$\$ BEGIN RAISE EXCEPTION 'MEDIA PURPOSE ROLLBACK FUSE:.*?\n/m,''));assert.throws(()=>call('inspect',O,A,sha));assert.equal(sql('SELECT private_use_history FROM public.busy_website_original_media WHERE id='+q(A)),before);
 });
}
