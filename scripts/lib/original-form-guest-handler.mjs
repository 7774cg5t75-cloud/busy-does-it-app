// Original Deno.serve callback and bounded reader, executed locally with inert host boundaries.
import {readFileSync} from 'node:fs';
import {requireTools} from '../testing/tooling.mjs';
import {createFormGuestDispatcher} from '../../supabase/functions/busy-mini-app-guest/formGuestDispatcher.mjs';
const babel=requireTools('@babel/core'),plugin=requireTools('@babel/plugin-transform-typescript');
const compile=s=>babel.transformSync(s,{filename:'original.ts',babelrc:false,configFile:false,plugins:[plugin]}).code;
const reader=compile(readFileSync('supabase/functions/_shared/boundedRequest.ts','utf8').replaceAll('export ','')),{boundedJson,BoundedRequestError}=Function(reader+';return {boundedJson,BoundedRequestError};')();
export function originalFormGuestHandler({client,flags,randomToken,sha256,hmac}){
 const source=readFileSync('supabase/functions/busy-mini-app-guest/index.ts','utf8'),ast=babel.parseSync(source,{filename:'original.ts',babelrc:false,configFile:false,parserOpts:{plugins:['typescript']}}),functions=ast.program.body.filter(n=>n.type==='FunctionDeclaration'&&['json','clean'].includes(n.id.name)),serve=ast.program.body.find(n=>n.type==='ExpressionStatement'&&n.expression?.callee?.object?.name==='Deno'&&n.expression?.callee?.property?.name==='serve').expression.arguments[0],map={BUSY_FORM_INGRESS_REVIEWED:'ingress',BUSY_FORM_PUBLICATION_AUTHORISED:'publication',BUSY_CUSTOMER_FORMS_ENABLED:'disclosure',BUSY_CUSTOMER_FORM_SUBMISSION_ENABLED:'submission',BUSY_CUSTOMER_FORM_RECEIPTS_ENABLED:'receipts'},deps={boundedJson,BoundedRequestError,createFormGuestDispatcher,supabase:client,randomToken,sha256Text:sha256,hmacText:hmac,Deno:{env:{get:k=>flags[map[k]]===true?'true':undefined}},corsHeaders:{'Access-Control-Allow-Origin':'*'}};
 const code=compile(functions.map(n=>source.slice(n.start,n.end)).join('\n')+'\nconst handler='+source.slice(serve.start,serve.end));return Function(...Object.keys(deps),code+';return handler;')(...Object.values(deps));
}
