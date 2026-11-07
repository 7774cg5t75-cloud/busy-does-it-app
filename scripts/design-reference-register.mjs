import {readFile} from 'node:fs/promises';
import {retainPrivateDesignCandidate} from './lib/private-design-register.mjs';
const [manifest,directory]=process.argv.slice(2);
if(!manifest||!directory)throw Error('Usage: node scripts/design-reference-register.mjs <reviewed-evidence.json> <private-directory-outside-repository>');
const result=await retainPrivateDesignCandidate({directory,evidence:JSON.parse(await readFile(manifest,'utf8')),now:Date.now()});
console.log(JSON.stringify(result));if(!result.ok)process.exitCode=1;
