// Syntax only, using isolated pinned Babel. Never evaluates application code.
import {readFileSync,realpathSync} from 'node:fs';
import {resolve,relative,extname} from 'node:path';
import {root,requireTools} from './tooling.mjs';
const paths=process.argv.slice(2);if(!paths.length)throw Error('Provide local .js/.mjs/.ts/.tsx source paths; no checks ran.');
const babel=requireTools('@babel/core');let passed=0;
for(const path of paths){
 const target=realpathSync(resolve(root,path)),rel=relative(root,target),extension=extname(target);
 if(rel.startsWith('..')||!['.js','.mjs','.ts','.tsx'].includes(extension))throw Error('Choose a supported repository source file.');
 babel.parseSync(readFileSync(target,'utf8'),{filename:target,configFile:false,babelrc:false,sourceType:'unambiguous',parserOpts:{plugins:extension==='.ts'?['typescript']:extension==='.tsx'?['typescript','jsx']:['jsx']}});passed++;
}
console.log('PASS '+passed+' source files parse; syntax only, not native/Expo or Deno semantic checks.');
