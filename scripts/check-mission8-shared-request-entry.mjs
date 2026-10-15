import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {validateNativeGuestRequest as validate} from '../standalone/template/nativeCustomerActions.mjs';
import {validateNativeGuestRequest as originalExport} from '../standalone/template/nativeGuestRequests.js';
assert.equal(validate,originalExport,'standalone and marketplace use one validator');
const input={name:'Fixture',email:'fixture@example.test',phone:'',service:'Consultation',message:'Please tell me more'};
assert.equal(validate('booking_request',input).ok,true);assert.equal(validate('enquiry',input).ok,true);
for(const changed of [{...input,email:'broken'},{...input,email:'',phone:'12'},{...input,name:'x'.repeat(161)},{...input,message:'x'.repeat(5001)}])assert.equal(validate('enquiry',changed).ok,false);
assert.equal(validate('booking_request',{...input,service:'x'.repeat(241)}).ok,false);assert.equal(validate('enquiry',{...input,note:'x'.repeat(4000)}).ok,true,'unused booking fields cannot block an enquiry');
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
for(const width of [320,820]){
 const runtime=createRuntime({width});const Detail=runtime.load('src/screens/miniApps.js').BusyAppDetail;
 const sent=[];const state={ownerSession:{userId:'fixture'},selectedBusyAppDetail:{app:{id:'fixture-app'},version:{id:'v1',config:{modules:[{key:'booking_request',enabled:true}],publicProfile:{services:[{name:'Consultation',description:'Approved detail'}]}}}},submitBusyAppRequest:async(...args)=>{sent.push(args);return true;}};
 const Form=runtime.render(Detail,{s:state}).type;let tree=runtime.render(Form,{s:state});
 const walk=n=>Array.isArray(n)?n.flatMap(walk):n&&typeof n==='object'?[n,...walk(n.props?.children)]:[];const field=label=>walk(tree).find(n=>n.props?.label===label);
 field('Request Consultation').props.onPress();field('Name').props.onChangeText('Fixture customer');field('Email').props.onChangeText('fixture@example.test');
 const dateRow=walk(tree).find(n=>n.props?.accessibilityLabel==='Preferred date suggestions');assert.ok(dateRow);const dateButton=walk(dateRow.props.children).find(n=>typeof n.props?.onPress==='function');dateButton.props.onPress();tree=runtime.render(Form,{s:state});
 assert.equal(field('Service').props.value,'Consultation');assert.match(field('Preferred date').props.value,/^\d{4}-\d{2}-\d{2}$/);assert.equal(field('Send booking request').props.disabled,false);await field('Send booking request').props.onPress();assert.equal(sent[0][1].service,'Consultation');assert.equal(sent[0][0],'booking_request');
 const previousNotice={...state,miniAppsNotice:'Saved earlier request',latestCustomerRequestOutcome:{ok:true,businessAppId:'another-app'}};
 const otherTree=runtime.render(Form,{s:previousNotice});assert.equal(walk(otherTree).some(n=>n.props?.title==='Request update'),false,'old app request notice cannot appear for the new app');
 const sameTree=runtime.render(Form,{s:{...previousNotice,latestCustomerRequestOutcome:{ok:true,businessAppId:'fixture-app'}}});assert.equal(walk(sameTree).some(n=>n.props?.title==='Request update'),true);
 assert.ok(walk(tree).some(n=>JSON.stringify(n.props?.children||'').includes('not available appointment slots')));
}
console.log('PASS: shared standalone/marketplace request validator, no silent field truncation, approved service selection and preferred-date submission through actual marketplace form at narrow/tablet logical widths. No native/provider verification.');
