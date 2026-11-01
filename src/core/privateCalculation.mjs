// Pure finite interpreter. No eval, imports chosen by data, IO or tool bridge.
export const CALC_LIMITS=Object.freeze({inputs:8,outputs:8,cases:4,depth:12,nodes:256,dataNodes:2048,bytes:16384,magnitude:1_000_000_000,precision:6});
const SCALE=1000000n,MAX=1000000000000000n,ID=/^[a-z][a-z0-9_]{0,31}$/;
const bad=message=>{throw Error(message);};
const plain=o=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.getPrototypeOf(o)===Object.prototype;
const text=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.length<=max&&!/[<>\u0000-\u001f\u007f]/.test(s);
const id=s=>typeof s==='string'&&ID.test(s)&&!['constructor','prototype'].includes(s);
function dataTree(value){
 const stack=[[value,0]],seen=new WeakSet();let nodes=0,bytes=0;
 while(stack.length){const [v,d]=stack.pop();if(++nodes>2048||d>20)bad('This calculation is too large or deeply nested.');
  if(v===null||typeof v==='boolean'){bytes+=5;if(bytes>16384)bad('Calculation too large.');continue;}
  if(typeof v==='number'){if(!Number.isFinite(v))bad('Use finite numbers.');bytes+=32;if(bytes>16384)bad('Calculation too large.');continue;}
  if(typeof v==='string'){if(v.length>300)bad('Calculation text is too long.');bytes+=v.length*3+2;}
  else{if(Array.isArray(v)&&(v.length>2048||Object.keys(v).length!==v.length||Array.isArray(v)&&Object.keys(v).some((k,i)=>k!==String(i))))bad('Use bounded, dense JSON arrays.');if(!Array.isArray(v)&&!plain(v)||seen.has(v))bad('Use a plain, acyclic calculation description.');seen.add(v);
   const ownKeys=Reflect.ownKeys(v);if(ownKeys.length>64&&!Array.isArray(v))bad('Too many calculation fields.');if(ownKeys.some(k=>typeof k!=='string'))bad('Unexpected calculation fields.');const descriptors=Object.getOwnPropertyDescriptors(v);
   for(const [k,p]of Object.entries(descriptors)){if(Array.isArray(v)&&k==='length')continue;if(!Object.hasOwn(p,'value')||['__proto__','constructor','prototype'].includes(k)||k.length>80)bad('Executable or unsafe fields are not permitted.');bytes+=k.length*3+4;stack.push([p.value,d+1]);}
  }if(bytes>16384)bad('This calculation description exceeds its size limit.');
 }return true;
}
const keys=(o,allowed,required=allowed)=>{if(!plain(o)||Object.keys(o).some(k=>!allowed.includes(k))||required.some(k=>!Object.hasOwn(o,k)))bad('Unexpected or missing calculation fields.');};
function fixed(n){
 if(typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>1e9)bad('Number exceeds the permitted range.');
 const s=String(n);if(!/^-?\d+(?:\.\d{1,6})?$/.test(s))bad('Use no more than six decimal places.');const sign=s.startsWith('-')?-1n:1n,[whole,fraction='']=s.replace('-','').split('.');return sign*(BigInt(whole)*SCALE+BigInt(fraction.padEnd(6,'0')));
}
const bounded=n=>{if(n>MAX||n< -MAX)bad('The result exceeds the permitted calculation range.');return n;};
const divide=(a,b)=>{if(b===0n)bad('Cannot divide by zero.');const negative=(a<0n)!==(b<0n);let x=a<0n?-a:a,y=b<0n?-b:b;return (negative?-1n:1n)*(x/y+(x%y*2n>=y?1n:0n));};
const numeric=new Set(['add','sub','mul','div','min','max']),comparison=new Set(['lt','lte','eq','gte','gt']);
function checked(spec){
 dataTree(spec);keys(spec,['version','kind','title','purpose','scope','inputs','outputs','cases']);if(spec.version!==1||spec.kind!=='private-calculation'||!text(spec.title,80)||!text(spec.purpose,240))bad('Use the supported private calculation format.');
 keys(spec.scope,['ownerId','businessId','projectId','sourceRevision']);for(const k of ['ownerId','businessId','projectId'])if(typeof spec.scope[k]!=='string'||!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(spec.scope[k]))bad('Open the exact current private app.');if(!Number.isSafeInteger(spec.scope.sourceRevision)||spec.scope.sourceRevision<1)bad('Open a current app revision.');
 if(!Array.isArray(spec.inputs)||!spec.inputs.length||spec.inputs.length>8||!Array.isArray(spec.outputs)||!spec.outputs.length||spec.outputs.length>8||!Array.isArray(spec.cases)||!spec.cases.length||spec.cases.length>4)bad('Keep this experiment within its input, output and example limits.');
 const types=new Map();for(const field of spec.inputs){keys(field,field?.type==='boolean'?['id','label','type','default']:['id','label','type','unit','min','max','default']);if(!id(field.id)||types.has(field.id)||!text(field.label,80)||!['number','boolean'].includes(field.type))bad('Review distinct typed input fields.');types.set(field.id,field.type);if(field.type==='number'){if(!text(field.unit,32))bad('State each numeric input unit.');const lo=fixed(field.min),hi=fixed(field.max),value=fixed(field.default);if(lo>hi||value<lo||value>hi)bad('Review the input range and default.');}else if(typeof field.default!=='boolean')bad('Use a boolean default.');}
 let nodes=0;function type(expr,depth){if(++nodes>256||depth>12)bad('This calculation exceeds its expression work limit.');if(!plain(expr)||typeof expr.op!=='string')bad('Use a supported expression.');
  if(expr.op==='literal'){keys(expr,['op','value']);if(typeof expr.value==='boolean')return 'boolean';fixed(expr.value);return 'number';}
  if(expr.op==='input'){keys(expr,['op','id']);if(!types.has(expr.id))bad('A rule references an unknown input.');return types.get(expr.id);}
  keys(expr,['op','args']);const arity=expr.op==='if'?3:['ceil','abs','not'].includes(expr.op)?1:2;if(!Array.isArray(expr.args)||expr.args.length!==arity)bad('Review expression arguments.');
  if(!numeric.has(expr.op)&&!comparison.has(expr.op)&&!['ceil','abs','not','and','or','if'].includes(expr.op))bad('This operation is not permitted.');const t=expr.args.map(e=>type(e,depth+1));
  if(expr.op==='if'){if(t[0]!=='boolean'||t[1]!==t[2])bad('Conditional branches must have the same type.');return t[1];}
  if(['and','or','not'].includes(expr.op)){if(t.some(v=>v!=='boolean'))bad('Use boolean conditions.');return 'boolean';}
  if(t.some(v=>v!=='number'))bad('Arithmetic and comparisons require numeric inputs.');return comparison.has(expr.op)?'boolean':'number';
 }
 const outputIds=new Set();for(const out of spec.outputs){keys(out,out?.type==='boolean'?['id','label','type','expression']:['id','label','type','unit','decimals','expression']);if(!id(out.id)||outputIds.has(out.id)||!text(out.label,80)||!['number','boolean'].includes(out.type))bad('Review distinct typed outputs.');outputIds.add(out.id);if(out.type==='number'&&(!text(out.unit,32)||!Number.isInteger(out.decimals)||out.decimals<0||out.decimals>6))bad('Review output units and precision.');if(type(out.expression,0)!==out.type)bad('The output type does not match its rule.');if(explainCalculation(out.expression,spec.inputs).length>2048)bad('Simplify this rule so it can be reviewed clearly.');}
 for(const example of spec.cases){keys(example,['label','inputs','expected']);if(!text(example.label,80))bad('Name each expected example.');validateValues(spec,example.inputs);keys(example.expected,spec.outputs.map(o=>o.id));for(const o of spec.outputs)if(o.type==='number')fixed(example.expected[o.id]);else if(typeof example.expected[o.id]!=='boolean')bad('Example output type mismatch.');}
 return {spec:JSON.parse(JSON.stringify(spec)),nodes};
}
function validateValues(spec,values){keys(values,spec.inputs.map(f=>f.id));const map=new Map();for(const f of spec.inputs){const value=values[f.id];if(f.type==='boolean'){if(typeof value!=='boolean')bad('Use a boolean value for '+f.label);map.set(f.id,value);}else{const v=fixed(value);if(v<fixed(f.min)||v>fixed(f.max))bad(f.label+' is outside its reviewed range.');map.set(f.id,v);}}return map;}
export function validateCalculation(spec){try{const v=checked(spec);return {ok:true,...v,restrictions:'Finite interpreter only; no OS sandbox or external capabilities.'};}catch(e){return {ok:false,reason:e.message};}}
export function calculatePrivateRules(spec,values){try{const valid=checked(spec);dataTree(values);const vars=validateValues(spec,values);let fuel=256;
 function run(e){if(--fuel<0)bad('Calculation work limit reached.');if(e.op==='input')return vars.get(e.id);if(e.op==='literal')return typeof e.value==='boolean'?e.value:fixed(e.value);
  if(e.op==='if')return run(e.args[0])?run(e.args[1]):run(e.args[2]);const a=run(e.args[0]);if(e.op==='not')return !a;if(e.op==='ceil')return bounded((a>0n?(a+SCALE-1n)/SCALE:a/SCALE)*SCALE);if(e.op==='abs')return a<0n?-a:a;const b=run(e.args[1]);
  switch(e.op){case 'add':return bounded(a+b);case 'sub':return bounded(a-b);case 'mul':return bounded(divide(a*b,SCALE));case 'div':return bounded(divide(a*SCALE,b));case 'min':return a<b?a:b;case 'max':return a>b?a:b;case 'lt':return a<b;case 'lte':return a<=b;case 'eq':return a===b;case 'gte':return a>=b;case 'gt':return a>b;case 'and':return a&&b;case 'or':return a||b;default:bad('Unsupported operation.');}}
 const outputs=Object.fromEntries(valid.spec.outputs.map(o=>{const raw=run(o.expression);if(o.type==='boolean')return [o.id,raw];const step=10n**BigInt(6-o.decimals),rounded=bounded(divide(raw,step)*step);return [o.id,Number(rounded)/1e6];}));if(JSON.stringify(outputs).length>2048)bad('Output limit exceeded.');return {ok:true,outputs,work:256-fuel,precision:'Fixed six-decimal arithmetic; half-away-from-zero rounding. Units are reviewed labels, not dimensional or professional assurance.',privateOnly:true};
 }catch(e){return {ok:false,reason:e.message,outputs:null};}}
export function explainCalculation(expr,inputs){const names=new Map(inputs.map(f=>[f.id,f.label]));if(expr.op==='input')return names.get(expr.id);if(expr.op==='literal')return String(expr.value);const a=expr.args.map(e=>explainCalculation(e,inputs));if(expr.op==='if')return 'If '+a[0]+', use '+a[1]+', otherwise '+a[2];if(expr.op==='ceil')return 'Round up ('+a[0]+')';if(expr.op==='abs')return 'Absolute amount ('+a[0]+')';if(expr.op==='not')return 'Not ('+a[0]+')';return '('+a.join(' '+({add:'+',sub:'−',mul:'×',div:'÷',min:'minimum',max:'maximum',lt:'<',lte:'≤',eq:'=',gte:'≥',gt:'>',and:'and',or:'or'}[expr.op])+' ')+')';}

// Future untrusted provider output must enter through a size-bound JSON parse.
export function parsePrivateCalculationJSON(text){if(typeof text!=='string'||text.length>16384)return {ok:false,reason:'Calculation JSON exceeds its input limit.'};try{return validateCalculation(JSON.parse(text));}catch{return {ok:false,reason:'Use a valid bounded JSON calculation proposal.'};}}

export function assertFiniteData(value){dataTree(value);return value;}
export function validPrivateNumber(value){try{fixed(value);return true;}catch{return false;}}
