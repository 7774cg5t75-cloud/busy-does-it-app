// Build-local denial only. This is neither authentication nor a transport.
// The staging inspector retains its original, independently scoped requests.
let restricted=false;
export const connectedTransportRestricted=()=>restricted;
export function restrictLegacyTransport(environment){
 if(environment!=='isolated-staging')throw Error('Connected transport requires isolated staging');
 restricted=true;
}
