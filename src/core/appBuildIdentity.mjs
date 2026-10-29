// A finite diagnostic projection. No network, credentials, device identifiers or
// authority inferred from the source hash. Native version/build never use config fallbacks.
const text=v=>typeof v==='string'&&v.length>0&&v.length<=80&&!/[\r\n\x00-\x1f]/.test(v)?v:null;
export function appBuildIdentity({nativeVersion,nativeBuild,config={}}={}){
 const raw=config?.extra?.busyBuildIdentity,b=raw?.schema===1?raw:null;
 const source=b&&['recorded','local-changes'].includes(b.sourceStatus)&&typeof b.sourceCommit==='string'&&/^[a-f0-9]{40}$/i.test(b.sourceCommit)?b.sourceCommit.toLowerCase():null;
 const environments=['owner-preview','isolated-staging','production','development'],environment=environments.includes(b?.environment)?b.environment:environments.includes(config?.extra?.busyEnvironment)?config.extra.busyEnvironment:null;
 return {version:text(nativeVersion)||'Not available',build:text(nativeBuild)||'Not available',source:source||'Not recorded',sourceStatus:['recorded','local-changes','mismatch','unavailable'].includes(b?.sourceStatus)?b.sourceStatus:'unavailable',environment:environment==='owner-preview'?'Owner Preview · offline fictional data':environment==='isolated-staging'?'Isolated staging':environment==='production'?'Production':environment==='development'?'Development':'Not recorded'};
}
