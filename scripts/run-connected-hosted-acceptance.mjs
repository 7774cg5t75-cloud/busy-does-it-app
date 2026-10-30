// Default is a plan only. No users/schema are ever created by this runner.
import {execFileSync} from 'node:child_process';
import {connectedAcceptancePlan,runConnectedAcceptance} from './lib/connected-hosted-acceptance.mjs';
if(!process.argv.includes('--execute')){console.log(JSON.stringify(connectedAcceptancePlan(),null,2));}
else{
 const e=process.env,sourceSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const result=await runConnectedAcceptance({approval:e.BUSY_APPROVED_CONNECTED_ACCEPTANCE,fictionalOnly:e.BUSY_STAGING_FIXTURE_ONLY==='FICTIONAL_ONLY',url:e.BUSY_STAGING_URL,publishableKey:e.BUSY_STAGING_PUBLISHABLE_KEY,owners:['A','B'].map(key=>({businessId:e['BUSY_STAGING_BUSINESS_'+key],password:e['BUSY_STAGING_PASSWORD_'+key],requestId:e['BUSY_STAGING_REQUEST_'+key],quoteDate:e.BUSY_STAGING_QUOTE_DATE}))},{sourceSha});
 console.log(JSON.stringify(result,null,2));if(result.status==='blocked')process.exitCode=2;
}
