import {validateCalculation,calculatePrivateRules} from './privateCalculation.mjs';
import {stableJson} from './stableJson.mjs';
import {proposeLocalAppGoal} from './appGoalComposition.mjs';
import {validateBuilderProposal} from './governedBuilderProposal.mjs';
const fail=reason=>({ok:false,reason,mayExecute:false});
export const calculationScope=context=>Object.fromEntries(['ownerId','businessId','projectId','sourceRevision'].map(k=>[k,context?.scope?.[k]]));
// Local review context, not proof of real Auth or current server membership.
export function createPrivateCalculationPilot({getCurrent,isCurrent}){
 const tickets=new WeakMap(),snapshot=()=>{try{if(typeof isCurrent!=='function'||!isCurrent())return null;const context=getCurrent();return context?.ok===true?{scope:calculationScope(context),stamp:stableJson(context)}:null;}catch{return null;}};
 const current=record=>record.stamp===snapshot()?.stamp;
 const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
 return {
  review(spec){try{const source=snapshot();if(!source)return fail('Open the current owner account and private app.');const valid=validateCalculation(spec);if(!valid.ok)return valid;if(stableJson(spec.scope)!==stableJson(source.scope))return fail('This calculation belongs to another app or an earlier revision.');const checked=[];for(const sample of valid.spec.cases){const result=calculatePrivateRules(valid.spec,sample.inputs);if(!result.ok||stableJson(result.outputs)!==stableJson(sample.expected))return fail('An example does not match its expected result. Review the rules.');checked.push({label:sample.label,inputs:sample.inputs,expected:sample.expected,actual:result.outputs});}if(source.stamp!==snapshot()?.stamp)return fail('The account changed during review.');const ticket={};tickets.set(ticket,{spec:freeze(valid.spec),fingerprint:stableJson(valid.spec),stamp:source.stamp,state:'review'});return {ok:true,ticket,spec:JSON.parse(stableJson(valid.spec)),examples:JSON.parse(stableJson(checked)),mayExecute:false,privateOnly:true};}catch{return fail('The calculation could not be reviewed. Nothing was accepted.');}},
  accept(ticket,{ownerApproved=false,spec}={}){const r=tickets.get(ticket);if(!r||r.state!=='review'||!current(r)||ownerApproved!==true)return fail('Review this exact current calculation before accepting.');const valid=validateCalculation(spec);if(!valid.ok||stableJson(valid.spec)!==r.fingerprint)return fail('The rules changed. Prepare another review.');if(!current(r))return fail('The account changed during approval.');r.state='accepted';return {ok:true,privateOnly:true,durable:false,published:false};},
  run(ticket,values){const r=tickets.get(ticket);if(!r||r.state!=='accepted'||!current(r))return fail('Accept a current reviewed private calculation first.');const result=calculatePrivateRules(r.spec,values);return current(r)?result:fail('The account changed during calculation. No result is confirmed.');},
  discard(ticket){const r=tickets.get(ticket);if(r)r.state='discarded';return {ok:true,durable:false};},
  uncertain(ticket){const r=tickets.get(ticket);if(r)r.state='uncertain';return fail('Confirmation is uncertain. Start a new deliberate review; nothing retries.');}
 };
}
const ref=id=>({op:'input',id}),lit=value=>({op:'literal',value}),op=(name,...args)=>({op:name,args}),ceil=a=>op('ceil',a);
const number=(id,label,unit,min,max,value)=>({id,label,unit,type:'number',min,max,default:value});
export function proposePrivateCalculation(context,goal,options={}){
 if(!options||Object.getPrototypeOf(options)!==Object.prototype||Object.keys(options).some(k=>!['sparePercent','servingsPerGuest','rollShare','includeAllowance'].includes(k)))return fail('Use supported private calculation choices.');
 const {sparePercent=0,servingsPerGuest=1,rollShare=0.6,includeAllowance=true}=options;if(typeof includeAllowance!=='boolean')return fail('Choose whether to include an allowance.');
 if(!context?.ok||typeof goal!=='string'||!goal.trim()||goal.length>240||/[<>\u0000-\u001f]/.test(goal))return fail('Describe one private planning calculation.');
 if(/\b(?:staff|tracking|notifications?|inventory|payments?|bookings?|charges?|orders?|messages?|emails?|send|publish|execute|javascript|database|secrets?|filesystem|process|network|tools?|imports?)\b/i.test(goal))return fail('That needs a separate workflow and permission design. This experiment only calculates or checks values.');
 const catering=/\b(?:portion\w*|catering|servings?|rolls?|bowls?)\b/i.test(goal),garden=/\b(?:materials?|coverage|gardening|area)\b/i.test(goal);if(catering===garden)return fail('Would you like to plan food portions or material quantities? Other calculations need a reviewed specification.');
 let inputs,outputs,cases,title;if(catering){
  inputs=[number('guests','Expected guests','guests',1,10000,100),number('servings','Servings per guest','portions per guest',0.1,10,servingsPerGuest),number('roll_share','Share served as rolls','fraction',0,1,rollShare)];const total=()=>ceil(op('mul',ref('guests'),ref('servings'))),rolls=()=>ceil(op('mul',total(),ref('roll_share')));
  outputs=[{id:'total',label:'Indicative total portions',type:'number',unit:'portions',decimals:0,expression:total()},{id:'rolls',label:'Roll portions',type:'number',unit:'portions',decimals:0,expression:rolls()},{id:'bowls',label:'Bowl portions',type:'number',unit:'portions',decimals:0,expression:op('sub',total(),rolls())}];cases=[{label:'Fictional 100-guest check',inputs:{guests:100,servings:1,roll_share:0.6},expected:{total:100,rolls:60,bowls:40}},{label:'Fictional rounding check',inputs:{guests:31,servings:1.5,roll_share:0.5},expected:{total:47,rolls:24,bowls:23}}];title='Private portions planner';
 }else{
  inputs=[number('length','Area length','m',0.1,1000,10),number('width','Area width','m',0.1,1000,4),number('coverage','Coverage per unit','m² per unit',0.01,1000,2.5),number('spare','Extra material allowance','%',0,50,sparePercent)];const area=()=>op('mul',ref('length'),ref('width'));
  outputs=[{id:'area',label:'Indicative area',type:'number',unit:'m²',decimals:3,expression:area()},{id:'quantity',label:'Indicative material units',type:'number',unit:'units',decimals:0,expression:ceil(op('mul',op('div',area(),ref('coverage')),op('add',lit(1),op('div',ref('spare'),lit(100)))))}];cases=[{label:'Fictional 40-square-metre check',inputs:{length:10,width:4,coverage:2.5,spare:0},expected:{area:40,quantity:16}},{label:'Fictional allowance and rounding check',inputs:{length:7.5,width:3.2,coverage:2.5,spare:10},expected:{area:24,quantity:11}}];if(!includeAllowance){inputs=inputs.filter(f=>f.id!=='spare');outputs[1].expression=ceil(op('div',area(),ref('coverage')));cases=cases.map(c=>({label:c.label,inputs:Object.fromEntries(Object.entries(c.inputs).filter(([k])=>k!=='spare')),expected:{area:c.expected.area,quantity:c.expected.area===40?16:10}}));}title='Private materials planner';
 }
 const spec={version:1,kind:'private-calculation',title,purpose:goal.trim(),scope:calculationScope(context),inputs,outputs,cases};return validateCalculation(spec);
}
// Retain only plain owner intent in the ORIGINAL governed private specification.
// Executable rules, tickets and example data never enter its durable contract.
export function retainCalculationRequirement({context,proposal,goal}){
 if(typeof goal!=='string'||!goal.trim()||goal.length>240)return fail('Describe the requirement first.');
 const base=proposal?validateBuilderProposal(proposal,context):proposeLocalAppGoal(context,'Show business information and contact details');if(!base.ok)return base;
 const next=JSON.parse(stableJson(base.proposal));if(!next.app.screens.some(s=>s.id==='private_calculation'))next.app.screens.push({id:'private_calculation',title:'Private planning calculation — experimental',module:null,next:[]});if(!next.app.workflows.includes(goal.trim()))next.app.workflows.push(goal.trim());if(!next.app.unsupported.includes('Private calculation rules are session-only; no public calculator or executable artifact is saved.'))next.app.unsupported.push('Private calculation rules are session-only; no public calculator or executable artifact is saved.');if(!proposal)next.app.purpose=goal.trim();return validateBuilderProposal(next,context);
}
