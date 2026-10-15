import assert from 'node:assert/strict';
import {proposeCoordinatedAppChanges as plan} from '../src/core/appCoordinatedStudio.mjs';
const base={modules:[{key:'business_profile',enabled:true},{key:'services',enabled:true}],navigation:['business_profile','services']};
for(const config of [base,{...base,publicProfile:null},{...base,publicProfile:{}},{...base,publicProfile:{services:[{name:'Original'}]}},{...base,display:{},publicProfile:{tagline:'Original'}}]){
 for(const op of [{kind:'text',field:'tagline',value:'Changed'},{kind:'text',field:'about',value:'Changed'},{kind:'services',value:[{name:'Changed',description:'Owner wording'}]}]){
  const forward=plan(config,[op]);assert.equal(forward.ok,true);const reverse=plan(forward.nextConfig,forward.undoOperations);assert.equal(reverse.ok,true);assert.deepEqual(reverse.nextConfig,config);
 }
}
console.log('PASS: exact text/service undo for absent/null/sparse profiles and tagline display; actual original planner.');
const current=plan(base,[{kind:'text',field:'about',value:'Reviewed'}]).nextConfig;
for(const value of [{parent:'object',present:true,value:'Safe',secret:'bad'},{parent:'object',present:true,value:{token:'bad'}},{parent:'absent',present:false,display:{parent:'absent',present:false}}])assert.equal(plan(current,[{kind:'restore_public_field',field:'about',value}]).ok,false);
assert.equal(plan({...current,presentation:{ownerLockedElements:['copy']}},[{kind:'restore_public_field',field:'about',value:{parent:'absent',present:false}}]).ok,false);
assert.equal(plan(current,[{kind:'restore_public_field',field:'password',value:{parent:'absent',present:false}}]).ok,false);
