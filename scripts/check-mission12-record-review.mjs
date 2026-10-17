import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as records from '../src/core/businessContentRecords.mjs';
import {manageBusinessContent} from '../supabase/functions/_shared/businessContentStore.mjs';
import {businessContentFixture} from './lib/business-content-fixture.mjs';
// Exercise the real editor's pre-render logic with deterministic hook state.
let slots=[],index=0,effects=[];const React={useState(value){const key=index++;if(!(key in slots))slots[key]=typeof value==='function'?value():value;return [slots[key],next=>slots[key]=typeof next==='function'?next(slots[key]):next];},useRef(value){const key=index++;return slots[key]||(slots[key]={current:value});},useEffect(fn){index++;effects.push(fn);}};
const source=fs.readFileSync(new URL('../src/screens/businessContentEditor.js',import.meta.url),'utf8');
const start=source.indexOf('function BusinessContentEditor('),end=source.indexOf(' return <Card',start);assert.ok(start>0&&end>start);
const {localEventInstant,validateBusinessContent,parseContentPrice,eventLocalFields,contentPrice,publicBusinessContent,canApproveSavedBusinessContent}=records;
const Editor=new Function('React','localEventInstant','validateBusinessContent','parseContentPrice','eventLocalFields','contentPrice','publicBusinessContent','canApproveSavedBusinessContent',source.slice(start,end)+';return {fresh,set,select,run,prepare,review,form,current,ready:canApproveSavedBusinessContent(current,form,loadedRecord.current)};}return BusinessContentEditor;')(React,localEventInstant,validateBusinessContent,parseContentPrice,eventLocalFields,contentPrice,publicBusinessContent,canApproveSavedBusinessContent);
const db=businessContentFixture(),scope={businessId:'business-a',actorId:'owner-a',role:'owner'};const props={businessId:scope.businessId,request:(action,body)=>manageBusinessContent(db,scope,{action,...body})};
const render=()=>{index=0;effects=[];const result=Editor(props);effects.forEach(fn=>fn());return result;};
let ui=render();ui.fresh('product');ui=render();for(const [key,value]of Object.entries({name:'Owner bowl',description:'Original wording',category:'Ceramics',priceText:'24.50'})){ui.set(key,value);ui=render();}ui.prepare();ui=render();assert.ok(ui.review);await ui.run('content_save',{...ui.review,ownerApproved:true});ui=render();assert.equal(ui.ready,true);const originalRevision=ui.current.revision;
ui.set('description','Unsaved owner wording');ui=render();assert.equal(ui.ready,false,'unsaved form must not approve the older saved record');assert.equal(db.rows[0].published,null);
ui.prepare();ui=render();await ui.run('content_save',{...ui.review,ownerApproved:true});ui=render();assert.equal(ui.ready,true);assert.equal(ui.current.revision,originalRevision+1);
await ui.run('content_publish',{id:ui.current.id,expectedRevision:ui.current.revision,ownerApproved:true});ui=render();assert.equal(ui.current.published.description,'Unsaved owner wording');assert.equal(ui.ready,true);
// A separate editor changes the saved revision: read-only refresh cannot approve it under an older form stamp.
await manageBusinessContent(db,scope,{action:'content_save',id:ui.current.id,kind:'product',expectedRevision:ui.current.revision,ownerApproved:true,data:{...ui.current.draft,description:'Changed elsewhere'}});
await ui.run('content_list');ui=render();assert.equal(ui.ready,false);assert.equal(ui.form.description,'Unsaved owner wording','refresh preserves typed work rather than silently replacing it');ui.select(ui.current);ui=render();assert.equal(ui.ready,true);assert.equal(ui.form.description,'Changed elsewhere');
console.log('PASS actual record editor logic -> trusted adapter: exact saved-form approval, unsaved and stale-revision blocking, save/publish sequence and non-destructive refresh. Hooks/DB are fixtures; no native render claim.');
