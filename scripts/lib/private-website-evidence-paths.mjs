// Private hosted-source evidence must stay outside the public checkout.
// A filename beginning with two dots is not a parent-directory traversal.
import assert from 'node:assert/strict';
import {isAbsolute,relative,sep} from 'node:path';
export function assertPrivateWebsiteEvidenceOutsideRepository(root,...paths){
 for(const path of paths){
  const rel=relative(root,path);
  assert.ok(isAbsolute(root)&&isAbsolute(path)&&!isAbsolute(rel)&&(rel==='..'||rel.startsWith('..'+sep)),
   'Private hosted source and evidence must remain outside the public repository');
 }
}
