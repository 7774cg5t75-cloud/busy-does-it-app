import {connectedJourneyRoutes} from './connectedJourneyRoutes.mjs';
import {connectedContentRoutes} from './connectedContentRoutes.mjs';
export const connectedAccountRoutes=Object.freeze({
 app_enquiry_state:['busy_connected_app_enquiry_state_v1',['businessId','requestId']],
 app_enquiry_review:['busy_connected_app_enquiry_review_v1',['businessId','requestId']],
 pending_review:['busy_owner_pending_review_v1',['businessId','expectedRevision','enquiryId']],
 filed_review:['busy_owner_first_reply_review_v1',['businessId','expectedRevision','customerId','enquiryId']],
 ...connectedJourneyRoutes,...connectedContentRoutes
});
