// No execution authority; canonical launcher uses this before loading Expo.
export function reviewExpoArguments(input){
 const args=[...input];if(!['start','export','config'].includes(args[0]))throw Error('Only local start, export and config are allowed by this launcher');
 if(args[0]==='start'){
  if(args.some(x=>['--lan','--tunnel','--host'].some(flag=>x===flag||x.startsWith(flag+'='))||x.startsWith('--localhost=')))throw Error('Development tools must stay on localhost');
  if(!args.includes('--localhost'))args.push('--localhost');
 }
 return args;
}
