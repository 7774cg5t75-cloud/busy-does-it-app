import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),parser=require('@babel/parser'),traverse=require('@babel/traverse').default;
const source=readFileSync(process.argv[2]||new URL('../src/app/AppController.js',import.meta.url),'utf8');
const ast=parser.parse(source,{sourceType:'module',plugins:['jsx']});let app,early=[];
traverse(ast,{FunctionDeclaration(path){if(path.node.id?.name!=='App')return;app=path;
 for(const [name,binding]of Object.entries(path.scope.bindings)){
  if(!['const','let'].includes(binding.kind))continue;
  for(const ref of binding.referencePaths)if(ref.node.start<binding.identifier.start&&ref.getFunctionParent()===path)
   early.push({name,line:ref.node.loc.start.line});
 }
}});
assert.deepEqual(early,[],'Render-time lexical state must be initialised before use. Deferred callbacks are intentionally excluded.');
const names=new Set(['ownerSession','cloudWorkspace','liveOwnerFollowupScopeRef']);
const statements=app.node.body.body.filter(n=>n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.type==='Identifier'?names.has(d.id.name):d.id.type==='ArrayPattern'&&d.id.elements.some(e=>names.has(e?.name)))||n.type==='ExpressionStatement'&&n.expression.type==='AssignmentExpression'&&n.expression.left.object?.name==='liveOwnerFollowupScopeRef');
assert.equal(statements.length,4);
const execute=new Function('useState','useRef','selectedMiniAppRequestRole','selectedMiniAppRequestDetail',statements.map(n=>source.slice(n.start,n.end)).join('\n')+'\nreturn liveOwnerFollowupScopeRef.current;');
assert.equal(execute(v=>[v,()=>{}],v=>({current:v}),'',null),'::::');
console.log('PASS: controller immediate lexical references are initialised; actual owner/business scope initialisation executes without a temporal-dead-zone error. Not a complete native render.');
