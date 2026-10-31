import {readFileSync,realpathSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,relative,extname} from 'node:path';
import {root,requireTools} from './testing/tooling.mjs';
const paths=process.argv.slice(2),babel=requireTools('@babel/core');if(!paths.length)throw Error('No source selection supplied.');
const results=[];
for(const file of paths){
 try{const target=realpathSync(resolve(root,file)),rel=relative(root,target),ext=extname(target);if(rel.startsWith('..')||!['.js','.mjs','.cjs','.jsx','.ts','.tsx'].includes(ext))throw Error('Unsupported source');babel.parseSync(readFileSync(target,'utf8'),{filename:target,configFile:false,babelrc:false,sourceType:'unambiguous',parserOpts:{plugins:ext==='.ts'?['typescript']:ext==='.tsx'?['typescript','jsx']:['jsx']}});results.push({path:file,passed:true});}
 catch(error){results.push({path:file,passed:false,errorType:error.name,line:error.loc?.line??null,column:error.loc?.column??null});}
}
const summary={passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length};mkdirSync('.test-artifacts/historical-audit',{recursive:true});writeFileSync('.test-artifacts/historical-audit/syntax-all.json',JSON.stringify({summary,results,evidence:'Parsing only; no code evaluation, hosted security or native acceptance.'},null,2));console.log(JSON.stringify(summary));process.exitCode=summary.failed?1:0;
