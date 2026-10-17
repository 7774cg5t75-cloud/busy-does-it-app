import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const runtime=createRuntime(),{MiniAppSurface,BusyAppDetail}=runtime.load('src/screens/miniApps.js'),{BusinessAppCustomerRequestFields:Fields}=runtime.load('src/screens/businessAppCustomerRequestFields.js');
const walk=n=>Array.isArray(n)?n.flatMap(walk):n&&typeof n==='object'?[n,...walk(n.props?.children)]:[];
const config={display:{name:'Fictional workshop'},modules:['business_profile','services','enquiry','booking_request'].map(key=>({key,enabled:true})),navigation:['business_profile','services','enquiry','booking_request'],publicProfile:{businessName:'Fictional workshop',services:[{id:'survey',name:'Survey',description:'Discuss requirements first'}]}};
let sent=null,calls=0;const s={ownerSession:{userId:'owner-a'},selectedBusyAppDetail:{app:{id:'app-a',business_id:'business-a'},version:{id:'version-a',config}},submitBusyAppRequest:async(type,payload)=>(sent={type,payload},calls++,true)};
const Form=runtime.render(BusyAppDetail,{s}).type;let form,fields,surface;
const render=()=>{form=runtime.render(Form,{s});fields=runtime.render(Fields,walk(form).find(n=>n.type===Fields).props);surface=runtime.render(MiniAppSurface,walk(form).find(n=>n.type===MiniAppSurface).props);};
const get=(tree,label)=>walk(tree).find(n=>n.props?.label===label);
render();get(surface,'Ask about Survey').props.onPress();render();assert.ok(get(fields,'Send enquiry'));assert.equal(get(fields,'Send booking request'),undefined);assert.equal(get(fields,'Message').props.value,"I'd like to ask about Survey.");assert.equal(calls,0);
get(fields,'Name').props.onChangeText('Fictional visitor');get(fields,'Email').props.onChangeText('visitor@example.test');render();await get(fields,'Send enquiry').props.onPress();assert.equal(sent.type,'enquiry');assert.equal(sent.payload.service,'Survey');assert.equal(calls,1);
render();get(surface,'Request Survey').props.onPress();render();assert.ok(get(fields,'Send booking request'));assert.equal(get(fields,'Send enquiry'),undefined);assert.equal(get(fields,'Service').props.value,'Survey');assert.equal(calls,1,'Selection never submits');
get(fields,'Name').props.onChangeText('Fictional visitor');get(fields,'Email').props.onChangeText('visitor@example.test');get(fields,'Preferred date').props.onChangeText('Next week, if suitable');render();await get(fields,'Send booking request').props.onPress();assert.equal(sent.type,'booking_request');assert.equal(sent.payload.service,'Survey');assert.equal(calls,2);
// No booking action can appear when the public config only supports enquiries.
const noBooking={...config,modules:config.modules.filter(m=>m.key!=='booking_request'),navigation:config.navigation.filter(k=>k!=='booking_request')};
const only=runtime.render(MiniAppSurface,{config:noBooking,interactive:true,onSelectService:()=>{}});assert.ok(get(only,'Ask about Survey'));assert.equal(get(only,'Request Survey'),undefined);
console.log('PASS real marketplace service action -> original parent intent/fields -> original request submit for enquiry and booking request; inert transport, no real customer send.');
