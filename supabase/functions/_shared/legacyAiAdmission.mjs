// Historical model routes are not integrated with the central monetary ledger.
// An API key, daily counter, prototype publishable key or owner-consent Boolean
// is not a cost reservation. No environment/client switch can open this fence.
// Replace each call site only with a reviewed authenticated/reserved adapter;
// never turn this helper into a global "allow legacy" flag.
export function legacyAiAdmissionStatus(){return Object.freeze({allowed:false,code:'central_ai_admission_required',providerCalls:0});}
export function requireCentralAiAdmission(){
 const error=new Error('AI preparation is unavailable until secure cost admission is connected. Supported manual preparation remains available.');
 error.name='CentralAiAdmissionRequired';throw error;
}
