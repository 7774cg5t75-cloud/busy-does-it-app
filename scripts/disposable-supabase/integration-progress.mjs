// Fixed-label progress only: no tokens, users, URLs, bodies, messages or stacks.
import fs from 'node:fs';
import path from 'node:path';
const OPERATIONS=new Set(["read-local-credentials","validate-local-endpoint","application-module-import","source-guard-extraction","source-guard-type-stripping","source-guard-evaluation","auth-create-a","auth-signin-a","auth-require-user-a","auth-create-b","auth-signin-b","auth-require-user-b","auth-create-staff","auth-signin-staff","auth-require-user-staff","jwt-rejection","business-fixture-insert","membership-fixture-insert","membership-and-role-enforcement","record-store-cas-undo-and-tenant-scope","direct-crud-denial","sql-constraints","same-id-other-tenant","event-cancellation","capacity-seed","capacity-race","membership-revocation","final-report"]);
const CHECKS=new Set(["real-local-Auth-creation-password-signin-and-current-requireUser","missing-malformed-and-tampered-JWT-rejected-by-real-Auth","exact-current-membership-guard-and-role-enforcement-ignore-user-metadata","actual-store-create-private-approval-generated-column-CAS-race-Undo-and-tenant-scope","real-PostgREST-anon-and-authenticated-direct-CRUD-denied","real-generated-column-revision-history-and-public-version-constraints","real-event-approved-cancellation-projection","real-concurrent-insert-cap-serialisation","current-membership-revocation-despite-valid-Auth-token"]);
const CODES=new Set(['ERR_ASSERTION','ERR_MODULE_NOT_FOUND','ERR_MODULE_NOT_EXPORTED','ERR_UNKNOWN_BUILTIN_MODULE','ECONNREFUSED','ECONNRESET','ETIMEDOUT','ENOTFOUND','UND_ERR_CONNECT_TIMEOUT','42501','23505','23503','23514','428C9','42P01','42703','P0001','PGRST116','PGRST204','PGRST205','unexpected_failure','email_exists','user_already_exists','invalid_credentials','email_not_confirmed','email_provider_disabled','signup_disabled','over_request_rate_limit','over_email_send_rate_limit','bad_jwt','validation_failed','weak_password']);
export const safeCode=value=>CODES.has(value)?value:null;
export function safeFailure(error){
 const code=safeCode(error?.code)||safeCode(error?.cause?.code);
 const type=['AssertionError','TypeError','ReferenceError','SyntaxError','Error','TimeoutError','AbortError'].includes(error?.name)?error.name:'unknown';
 const category=code==='ERR_ASSERTION'?'assertion':
  ['ERR_MODULE_NOT_FOUND','ERR_MODULE_NOT_EXPORTED','ERR_UNKNOWN_BUILTIN_MODULE'].includes(code)?'module-initialisation':
  ['TimeoutError','AbortError'].includes(type)||['ETIMEDOUT','UND_ERR_CONNECT_TIMEOUT'].includes(code)?'request-timeout':
  ['ECONNREFUSED','ECONNRESET','ENOTFOUND'].includes(code)?'local-connection':
  ['23505','23503','23514','42501','428C9','42P01','42703','P0001','PGRST116','PGRST204','PGRST205'].includes(code)?'database-rejection':
  type==='SyntaxError'?'script-or-source-syntax':type==='ReferenceError'?'source-evaluation':'unclassified';
 const line=/integration\.mjs:(\d+):(\d+)/.exec(typeof error?.stack==='string'?error.stack:'');
 return {category,type,code,sourceLine:line?Number(line[1]):null};
}
export function requestCategory(url){
 const pathname=url.pathname;
 if(pathname==='/auth/v1/admin/users')return 'auth-admin-users';
 if(pathname==='/auth/v1/token')return 'auth-password-token';
 if(pathname==='/auth/v1/user')return 'auth-current-user';
 const tables={'/rest/v1/busy_businesses':'businesses','/rest/v1/busy_business_memberships':'memberships','/rest/v1/busy_business_content':'records','/rest/v1/busy_public_business_profiles':'public-profile'};
 return tables[pathname]||'other-local-api';
}
export function createProgress(statusFile){
 const file=path.join(path.dirname(path.resolve(statusFile)),'integration-progress-public.json');
 const state={result:'running',currentOperation:null,completedOperations:[],completedChecks:[],lastRequest:null};
 let sequence=0;
 const save=()=>fs.writeFileSync(file,JSON.stringify(state),{mode:0o600});
 const complete=()=>{if(state.currentOperation&&!state.completedOperations.includes(state.currentOperation))state.completedOperations.push(state.currentOperation);save();};
 save();
 return {state,
  begin(operation){if(!OPERATIONS.has(operation))throw Error('Unreviewed progress label');state.currentOperation=operation;state.lastRequest=null;save();},
  complete,
  pass(name){if(!CHECKS.has(name))throw Error('Unreviewed check label');complete();state.completedChecks.push({name,result:'passed'});save();},
  request(url,method){state.lastRequest={sequence:++sequence,category:requestCategory(url),method:['GET','POST','PATCH','DELETE','HEAD'].includes(method)?method:'OTHER',status:null,errorCode:null};save();return sequence;},
  response(sequence,status,body){if(state.result==='running'&&state.lastRequest?.sequence===sequence){state.lastRequest.status=Number.isInteger(status)&&status>=100&&status<=599?status:null;state.lastRequest.errorCode=safeCode(body?.error_code)||safeCode(body?.code);save();}},
  fail(error){state.result='failed';state.failure=safeFailure(error);save();},
  success(){complete();state.result='passed';save();}
 };
}
