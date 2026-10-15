import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {proposeCoordinatedAppChanges as plan} from '../src/core/appCoordinatedStudio.mjs';
const base={modules:['business_profile','services'].map(key=>({key,enabled:true})),navigation:['business_profile','services']};
for(const config of [base,{...base,presentation:null},{...base,presentation:{}},{...base,presentation:{layoutDensity:'airy',ownerLockedElements:['all']}}]){
 const p=plan(config,[{kind:'owner_locks',value:['copy']}]);assert.equal(p.ok,true);assert.deepEqual(plan(p.nextConfig,p.undoOperations).nextConfig,config);assert.equal(plan(p.nextConfig,[{kind:'text',field:'about',value:'No'}]).ok,false);
}
const legacy={...base,presentation:{ownerLockedElements:['approved-logo']}};const cleared=plan(legacy,[{kind:'owner_locks',value:[]}]);assert.equal(cleared.ok,true);assert.deepEqual(plan(cleared.nextConfig,cleared.undoOperations).nextConfig,legacy);
const locked={...base,presentation:{ownerLockedElements:['all']}};assert.equal(plan(locked,[{kind:'owner_locks',value:[]}]).ok,true);
assert.equal(plan(locked,[{kind:'owner_locks',value:[]},{kind:'text',field:'about',value:'No'}]).ok,false);
assert.equal(plan(base,[{kind:'owner_locks',value:['x'.repeat(81)]}]).ok,false);
assert.equal(plan({...base,presentation:{layoutDensity:'airy'}},[{kind:'owner_locks',value:null,field:'absent'}]).ok,false);
for(const name of ['appOwnerLockEditing','appCoordinatedStudio'])assert.equal(readFileSync(`src/core/${name}.mjs`,'utf8'),readFileSync(`supabase/functions/busy-mini-apps/${name}.mjs`,'utf8'));
parse(readFileSync('src/screens/appOwnerLockControls.js','utf8'),{sourceType:'module',plugins:['jsx']});
console.log('PASS: separate owner-approved lock plans, unlock-all, exact absent/null inverse, no content batching, malformed lock/appearance deletion rejection and Edge parity. Local planner only.');
