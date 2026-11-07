import {mkdirSync,writeFileSync} from 'node:fs';
import {buildCreativeDocumentDeploymentPacket,creativeDeploymentDigest} from './lib/creative-document-deployment-packet.mjs';

if(process.argv.slice(2).length)throw Error('No deployment, target, credential or activation arguments are accepted');
const packet=buildCreativeDocumentDeploymentPacket(process.cwd());
const directory='.test-artifacts/ai-lab-creative-deployment';mkdirSync(directory,{recursive:true});
writeFileSync(directory+'/review-only-packet.json',JSON.stringify(packet,null,2)+'\n');
console.log(JSON.stringify({status:packet.status,source:packet.source,fileCount:Object.keys(packet.inventory.files).length,filesDigest:packet.inventory.filesDigest,packetDigest:creativeDeploymentDigest(packet),deployment:false,providerCalls:0,spendingGBP:0}));
