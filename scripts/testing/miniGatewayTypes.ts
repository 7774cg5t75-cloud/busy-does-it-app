// Real compiler contract probe. No runtime execution, fake SDK, ignored errors,
// broad casts or credentials. Compile with the same reviewed gateway config.
import {classifyMessageReceipt} from '../../supabase/functions/busy-mini-apps/messageReceiptV3205.mjs';
import {verifyOwnerRequestFreshnessV3231} from '../../supabase/functions/busy-mini-apps/ownerRequestFreshnessV3231.mjs';
import {proposeCoordinatedAppChanges} from '../../supabase/functions/busy-mini-apps/appCoordinatedStudio.mjs';
import {createClient} from '../../supabase/functions/_shared/supabaseClient.ts';
import {readCurrentOwnerFollowupV3235} from '../../supabase/functions/busy-mini-apps/ownerFollowupReadbackV3235.mjs';
export function checkedResultShapes(){
 const receipt=classifyMessageReceipt();
 if(!receipt.ok){const reason:string=receipt.reason;return reason;}
 if(receipt.found){const messageId:string=receipt.messageId;return messageId;}
 const fresh=verifyOwnerRequestFreshnessV3231();
 if(!fresh.ok){const reason:string=fresh.reason;return reason;}
 const revision:string=fresh.expectedUpdatedAt;
 const plan=proposeCoordinatedAppChanges({},[]);
 if(!plan.ok){const reason:string=plan.reason;return reason;}
 const changes:unknown[]=plan.changes,undo:unknown[]=plan.undoOperations;
 return {revision,changes,undo,config:plan.nextConfig};
}
export function checkedSdkBoundary(client:ReturnType<typeof createClient>){
 return readCurrentOwnerFollowupV3235({businessId:'',appId:'',requestId:'',nowISO:'',store:client});
}
