// Standard hybrid encryption for a PRIVATE one-request result. No key
// generation, file IO, provider or credential port exists in this module.
import {createPublicKey,createPrivateKey,publicEncrypt,privateDecrypt,randomBytes,createCipheriv,createDecipheriv,createHash,constants} from 'node:crypto';
import {stableJson} from '../../src/core/stableJson.mjs';

export const SOL_PRIVATE_RESULT_VERSION='busy.sol-private-result.v1';
const need=x=>{if(!x)throw Error('private_result_refused');};
const hash=x=>createHash('sha256').update(x).digest('hex');
const b64=x=>Buffer.from(x).toString('base64');
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
function bindingJson(binding){
 need(binding&&Object.getPrototypeOf(binding)===Object.prototype&&Object.keys(binding).sort().join(',')===['version','projectId','runId','attempt','eventSha','operationDigest','requestDigest','manifestDigest','functionId','functionVersion'].sort().join(','));
 need(Object.getOwnPropertySymbols(binding).length===0&&Object.values(Object.getOwnPropertyDescriptors(binding)).every(x=>Object.hasOwn(x,'value')));
 need(binding.version==='busy.sol-private-result-binding.v1'&&binding.projectId==='sbvkrvksnruiclcvclbd'&&typeof binding.runId==='string'&&/^[1-9][0-9]{0,19}$/.test(binding.runId)&&binding.attempt===1&&typeof binding.eventSha==='string'&&/^[a-f0-9]{40}$/.test(binding.eventSha)&&['operationDigest','requestDigest','manifestDigest'].every(k=>sha(binding[k]))&&typeof binding.functionId==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(binding.functionId)&&Number.isSafeInteger(binding.functionVersion)&&binding.functionVersion>=2);
 return stableJson(binding);
}
function recipient(pem){
 need(typeof pem==='string'&&pem.length<=8192&&/^-----BEGIN PUBLIC KEY-----\n[\s\S]+\n-----END PUBLIC KEY-----\n?$/.test(pem));
 const key=createPublicKey(pem);need(key.asymmetricKeyType==='rsa'&&key.asymmetricKeyDetails?.modulusLength>=3072&&key.asymmetricKeyDetails.modulusLength<=4096);
 return {key,digest:hash(key.export({type:'spki',format:'der'}))};
}
export function verifySolResultRecipient(publicPem,binding){
 try{const r=recipient(publicPem);return {recipientSha256:r.digest,bindingDigest:hash(bindingJson(binding))};}catch{throw Error('private_result_refused');}
}
export function sealSolPrivateResult(bytes,binding,publicPem){
 try{
  need(bytes instanceof Uint8Array&&bytes.byteLength<=3000000);const r=recipient(publicPem),aad=Buffer.from(bindingJson(binding)),label=Buffer.from(hash(aad),'hex'),key=randomBytes(32),iv=randomBytes(12);
  try{
   const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);
   const ciphertext=Buffer.concat([cipher.update(bytes),cipher.final()]);
   const wrapped=publicEncrypt({key:r.key,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256',oaepLabel:label},key);
   return {version:SOL_PRIVATE_RESULT_VERSION,algorithm:'RSA-OAEP-SHA256+A256GCM',binding:JSON.parse(aad),recipientSha256:r.digest,iv:b64(iv),wrappedKey:b64(wrapped),ciphertext:b64(ciphertext),tag:b64(cipher.getAuthTag())};
  }finally{key.fill(0);}
 }catch{throw Error('private_result_refused');}
}
export function openSolPrivateResult(envelope,binding,privatePem){
 try{
  need(envelope&&Object.getPrototypeOf(envelope)===Object.prototype&&Object.keys(envelope).sort().join(',')===['version','algorithm','binding','recipientSha256','iv','wrappedKey','ciphertext','tag'].sort().join(','));
  need(Object.getOwnPropertySymbols(envelope).length===0&&Object.values(Object.getOwnPropertyDescriptors(envelope)).every(x=>Object.hasOwn(x,'value'))&&envelope.version===SOL_PRIVATE_RESULT_VERSION&&envelope.algorithm==='RSA-OAEP-SHA256+A256GCM'&&stableJson(envelope.binding)===bindingJson(binding));
  const key=createPrivateKey(privatePem);need(key.asymmetricKeyType==='rsa'&&key.asymmetricKeyDetails?.modulusLength>=3072&&key.asymmetricKeyDetails.modulusLength<=4096&&hash(createPublicKey(key).export({type:'spki',format:'der'}))===envelope.recipientSha256);
  const decode=(text,max)=>{need(typeof text==='string'&&text.length<=max&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text));const b=Buffer.from(text,'base64');need(b.toString('base64')===text);return b;};
  const iv=decode(envelope.iv,24),tag=decode(envelope.tag,32),wrapped=decode(envelope.wrappedKey,1024),ciphertext=decode(envelope.ciphertext,4000000);need(iv.length===12&&tag.length===16&&ciphertext.length<=3000000);
  const aad=Buffer.from(bindingJson(binding)),secret=privateDecrypt({key,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256',oaepLabel:Buffer.from(hash(aad),'hex')},wrapped);
  try{need(secret.length===32);const decipher=createDecipheriv('aes-256-gcm',secret,iv);decipher.setAAD(aad);decipher.setAuthTag(tag);return Buffer.concat([decipher.update(ciphertext),decipher.final()]);}finally{secret.fill(0);}
 }catch{throw Error('private_result_refused');}
}
