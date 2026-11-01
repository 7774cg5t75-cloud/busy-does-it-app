import {stableJson} from './stableJson.mjs';
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const keys=(x,k)=>plain(x)&&Object.keys(x).sort().join(',')===k.slice().sort().join(',');
const text=(s,n)=>typeof s==='string'&&s.trim().length>0&&s.length<=n&&!/[\u0000-\u001f]/.test(s);
const id=s=>typeof s==='string'&&/^[a-z][a-z0-9_-]{0,31}$/.test(s);
export function validWorkPreparation(p){
 if(!keys(p,['version','title','stages'])||p.version!==1||!text(p.title,100)||!Array.isArray(p.stages)||!p.stages.length||p.stages.length>8||JSON.stringify(p).length>12000)return false;
 const seen=new Set();let current=0;
 return p.stages.every(s=>keys(s,['id','title','status','items'])&&id(s.id)&&!seen.has(s.id)&&!!seen.add(s.id)&&text(s.title,80)&&['todo','current','done'].includes(s.status)&&(s.status!=='current'||++current<=1)&&Array.isArray(s.items)&&s.items.length>0&&s.items.length<=12&&s.items.every(i=>keys(i,['id','text','done'])&&id(i.id)&&!seen.has(i.id)&&!!seen.add(i.id)&&text(i.text,240)&&typeof i.done==='boolean')&&(s.status!=='done'||s.items.every(i=>i.done)));
}
export function workPreparationSummary(p){if(!validWorkPreparation(p))return null;return {stage:p.stages.find(s=>s.status==='current')?.title||'Choose your next preparation step',remaining:p.stages.flatMap(s=>s.items.filter(i=>!i.done).map(i=>({stage:s.title,...i}))),completed:p.stages.flatMap(s=>s.items.filter(i=>i.done)),businessCompleted:false};}
// Finite owner intent only. Customer prose never selects a business action.
export function proposeWorkPreparation(words){
 if(!text(words,1200)||/\b(send|email|notify|notifications|pay|purchase|book|booking|assign|staff|inventory|stock|invoice|publish|automatically)\b/i.test(words))return {ok:false,reason:'This can organise private preparation only. Sending, booking and other business actions are unavailable.'};
 let title,groups;
 if(/cater|festival|food|serving/i.test(words)){title='Catering preparation';groups=[['Review enquiry',['Review the original customer requirements','Check the event information with the owner']],['Plan catering',['Review food choices and indicative quantities']],['Prepare equipment',['Check the serving equipment']],['Ready for owner review',['Review what still needs agreement with the customer']]];}
 else if(/garden|materials|trades|landscap/i.test(words)){title='Garden work preparation';groups=[['Review request',['Review the exact service enquiry']],['Assess work',['Note what needs assessing before agreeing work']],['Plan materials',['Review indicative material needs']],['Prepare next steps',['Check equipment and prepare questions for the customer']]];}
 else if(/website|creative|design|project brief/i.test(words)){title='Creative project preparation';groups=[['Review requirements',['Read the original project brief']],['Review supplied content',['Check which approved content is available']],['Plan design review',['Prepare the private design review']],['Prepare approval questions',['List what the owner still needs to agree']]];}
 else return {ok:false,reason:'Describe the private preparation, or add your own stages. I cannot safely infer this workflow yet.'};
 return {ok:true,plan:{version:1,title,stages:groups.map(([title,items],n)=>({id:'stage_'+n,title,status:n===0?'current':'todo',items:items.map((text,i)=>({id:'task_'+n+'_'+i,text,done:false}))}))},notice:'Suggested owner planning notes only; no customer commitment or verified business fact is created.'};
}
export function correctWorkPreparation(plan,words){
 if(!validWorkPreparation(plan)||!text(words,500))return {ok:false,reason:'A current supported preparation is required.'};
 const p=JSON.parse(stableJson(plan)),find=s=>p.stages.filter(x=>x.title.toLowerCase().includes(s.toLowerCase().replace(/ preparation$/,''))||x.title.toLowerCase().includes(s.toLowerCase()));let m;
 if(/^show me what.s left( to do)?[.!]?$/i.test(words))return {ok:true,plan:p,summary:workPreparationSummary(p)};
 if((m=/^move (.+?) earlier[.!]?$/i.exec(words))){const matches=find(m[1]);if(matches.length!==1)return {ok:false,reason:'Choose one stage to move.'};const n=p.stages.indexOf(matches[0]);if(n>0)[p.stages[n-1],p.stages[n]]=[p.stages[n],p.stages[n-1]];}
 else if((m=/^remove (?:the )?(.+?)(?: stage)?[.!]?$/i.exec(words))){const matches=find(m[1]);if(matches.length!==1||p.stages.length===1)return {ok:false,reason:'Choose one stage; keep at least one.'};p.stages=p.stages.filter(s=>s!==matches[0]);}
 else if((m=/^add (?:a reminder to |a task to )?(.+?) to (.+?)[.!]?$/i.exec(words))){const matches=find(m[2]);if(matches.length!==1)return {ok:false,reason:'Choose the stage for this task.'};let n=0;while(p.stages.some(s=>s.items.some(i=>i.id==='added_'+n)))n++;matches[0].items.push({id:'added_'+n,text:m[1],done:false});}
 else if((m=/^mark (.+?) (done|not done)[.!]?$/i.exec(words))){const matches=p.stages.flatMap(s=>s.items).filter(i=>i.text.toLowerCase()===m[1].toLowerCase());if(matches.length!==1)return {ok:false,reason:'Choose the exact preparation task.'};matches[0].done=m[2].toLowerCase()==='done';}
 else return {ok:false,reason:'Choose a stage or task below. That change is not yet understood safely.'};
 return validWorkPreparation(p)?{ok:true,plan:p}:{ok:false,reason:'The change exceeds a supported preparation limit or conflicts with a completed stage.'};
}
