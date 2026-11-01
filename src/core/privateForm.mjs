import {assertFiniteData,validPrivateNumber,validateCalculation,calculatePrivateRules} from './privateCalculation.mjs';
import {stableJson} from './stableJson.mjs';
const bad=message=>{throw Error(message);},plain=x=>x&&typeof x==='object'&&!Array.isArray(x),text=(x,max)=>typeof x==='string'&&x.trim().length>0&&x.length<=max&&!/[<>\u0000-\u001f\u007f]/.test(x);
const keys=(x,allowed,required=allowed)=>{if(!plain(x)||Object.keys(x).some(k=>!allowed.includes(k))||required.some(k=>!Object.hasOwn(x,k)))bad('Unexpected or missing private form fields.');};
const id=x=>typeof x==='string'&&/^[a-z][a-z0-9_]{0,31}$/.test(x)&&!['constructor','prototype'].includes(x);
export const formRelevant=(field,values)=>!field.when||values[field.when.field]===field.when.equals;
function checked(spec){
 assertFiniteData(spec);keys(spec,['version','kind','title','purpose','scope','fields','calculation','cases']);if(spec.version!==1||spec.kind!=='private-form'||!text(spec.title,80)||!text(spec.purpose,240)||!Array.isArray(spec.fields)||spec.fields.length<1||spec.fields.length>8||!Array.isArray(spec.cases)||spec.cases.length<1||spec.cases.length>4)bad('Use the supported bounded private form format.');
 // The original calculation validator owns the shared exact scope contract.
 const scopeCheck={version:1,kind:'private-calculation',title:'Scope check',purpose:'Validate current private scope',scope:spec.scope,inputs:[{id:'n',label:'Number',type:'number',unit:'units',min:0,max:1,default:0}],outputs:[{id:'n',label:'Number',type:'number',unit:'units',decimals:0,expression:{op:'input',id:'n'}}],cases:[{label:'Scope example',inputs:{n:0},expected:{n:0}}]};if(!validateCalculation(scopeCheck).ok)bad('Open the exact current private App.');
 const fields=new Map();for(const f of spec.fields){const base=['id','label','type','required','default'],extra=f?.type==='number'?['unit','min','max']:f?.type==='text'?['maxLength']:f?.type==='choice'?['options']:[];keys(f,[...base,...extra,'when'],[...base,...extra]);if(!id(f.id)||fields.has(f.id)||!text(f.label,80)||typeof f.required!=='boolean'||!['number','text','choice','boolean'].includes(f.type))bad('Review distinct supported form fields.');
  if(Object.hasOwn(f,'when')){keys(f.when,['field','equals']);const parent=fields.get(f.when.field);if(!parent||!['boolean','choice'].includes(parent.type)||parent.when||parent.type==='boolean'&&typeof f.when.equals!=='boolean'||parent.type==='choice'&&!parent.options.some(o=>o.value===f.when.equals))bad('Conditional fields must use an earlier unconditional reviewed choice.');}
  if(f.type==='number'){if(!text(f.unit,32)||!validPrivateNumber(f.min)||!validPrivateNumber(f.max)||f.min>f.max||f.default!==null&&(!validPrivateNumber(f.default)||f.default<f.min||f.default>f.max))bad('Review numeric units, limits and starting values.');}
  if(f.type==='text'&&(!Number.isInteger(f.maxLength)||f.maxLength<1||f.maxLength>240||typeof f.default!=='string'||f.default.length>f.maxLength))bad('Review a bounded text field.');
  if(f.type==='choice'){if(!Array.isArray(f.options)||f.options.length<1||f.options.length>8||new Set(f.options.map(o=>o.value)).size!==f.options.length)bad('Review distinct fixed options.');for(const o of f.options){keys(o,['value','label']);if(!id(o.value)||!text(o.label,80))bad('Review fixed option identities and labels.');}if(f.default!==''&&!f.options.some(o=>o.value===f.default))bad('Choose a reviewed initial option.');}
  if(f.type==='boolean'&&typeof f.default!=='boolean')bad('Use a yes/no starting value.');fields.set(f.id,f);
 }
 if(spec.calculation!==null){const c=validateCalculation(spec.calculation);if(!c.ok||stableJson(c.spec.scope)!==stableJson(spec.scope))bad('Review the original scoped finite calculation separately.');for(const input of c.spec.inputs){const f=fields.get(input.id);if(!f||f.required!==true||f.when||f.type!==input.type||f.type==='number'&&(f.min!==input.min||f.max!==input.max||f.unit!==input.unit))bad('Calculated inputs must match unconditional reviewed numeric or yes/no fields.');}for(const example of c.spec.cases){const r=calculatePrivateRules(c.spec,example.inputs);if(!r.ok||stableJson(r.outputs)!==stableJson(example.expected))bad('Calculation acceptance example mismatch.');}}
 for(const c of spec.cases){keys(c,['label','values','valid','outputs']);if(!text(c.label,80)||typeof c.valid!=='boolean')bad('Review typed form examples.');const r=evaluate(spec,c.values);if(r.valid!==c.valid||stableJson(r.outputs)!==stableJson(c.outputs))bad('Form acceptance example mismatch.');}
 return JSON.parse(stableJson(spec));
}
function evaluate(spec,values){assertFiniteData(values);keys(values,spec.fields.map(f=>f.id),[]);const errors={},active=[];for(const f of spec.fields){if(!formRelevant(f,values))continue;active.push(f.id);const v=values[f.id],missing=v===null||v===undefined||typeof v==='string'&&!v.trim();if(missing){if(f.required||spec.calculation?.inputs.some(i=>i.id===f.id))errors[f.id]='Please enter '+f.label.toLowerCase()+'.';continue;}
 if(f.type==='number'&&(!validPrivateNumber(v)||v<f.min||v>f.max))errors[f.id]='Use a number from '+f.min+' to '+f.max+' '+f.unit+'.';
 if(f.type==='text'&&(typeof v!=='string'||v.length>f.maxLength||/[<>\u0000-\u001f\u007f]/.test(v)))errors[f.id]='Use plain text up to '+f.maxLength+' characters.';
 if(f.type==='choice'&&!f.options.some(o=>o.value===v))errors[f.id]='Choose one of the reviewed options.';
 if(f.type==='boolean'&&typeof v!=='boolean')errors[f.id]='Choose Yes or No.';
 }
 let outputs=null;if(!Object.keys(errors).length&&spec.calculation){const input=Object.fromEntries(spec.calculation.inputs.map(i=>[i.id,values[i.id]])),r=calculatePrivateRules(spec.calculation,input);if(!r.ok)errors.calculation=r.reason;else outputs=r.outputs;}
 return {ok:true,valid:!Object.keys(errors).length,errors,active,outputs,privateOnly:true,submitted:false};
}
export function validatePrivateForm(spec){try{return {ok:true,spec:checked(spec)};}catch(e){return {ok:false,reason:e.message};}}
export function evaluatePrivateForm(spec,values){try{return evaluate(checked(spec),values);}catch(e){return {ok:false,reason:e.message,outputs:null};}}
export const privateFormDefaults=spec=>Object.fromEntries(spec.fields.map(f=>[f.id,f.default]));
