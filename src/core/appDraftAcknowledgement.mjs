import {privateAppEditSource} from './privateAppEditSession.mjs';
// Dirty-metadata acknowledgement only, AFTER the original Studio validates its receipt.
// Never a save, receipt substitute, persistence store or permission boundary.
export function captureAppDraftAcknowledgement(context,part,partEpoch){
 const source=privateAppEditSource(context);
 return source&&context.ownerId&&typeof part==='string'&&Number.isSafeInteger(partEpoch)?{...source,ownerId:context.ownerId,part,partEpoch}:null;
}
export function acknowledgedAppDraftPart(expected,result,context,partEpochs){
 if(!expected||result?.ok!==true||partEpochs?.[expected.part]!==expected.partEpoch||context?.ownerId!==expected.ownerId)return null;
 const current=privateAppEditSource(context),saved=privateAppEditSource({businessId:expected.businessId,app:result?.status?.app});
 if(!current||!saved||current.businessId!==expected.businessId||current.appId!==expected.appId||saved.appId!==expected.appId||saved.revision!==expected.revision+1||result.newRevision!==saved.revision)return null;
 if(!(current.revision===expected.revision&&current.configStamp===expected.configStamp||current.revision===saved.revision&&current.configStamp===saved.configStamp))return null;
 return expected.part;
}
