// Pure redacted detector shared by quick and whole-tree audits. No matched bytes are returned.
export function sourceSecretFindings(text){
 const patterns=[['private-key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],['provider-secret',/\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/g],['client-secret-environment',/process\.env\.EXPO_PUBLIC_[A-Z_]*(?:SERVICE_ROLE|SECRET_KEY|PRIVATE_KEY)/g]];
 const findings=[];for(const [kind,re]of patterns)for(const match of text.matchAll(re))findings.push({kind,line:text.slice(0,match.index).split('\n').length});
 for(const match of text.matchAll(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)){try{const claim=JSON.parse(Buffer.from(match[0].split('.')[1],'base64url').toString('utf8'));if(claim.role==='service_role')findings.push({kind:'embedded-service-role',line:text.slice(0,match.index).split('\n').length});}catch{}}
 return findings;
}
