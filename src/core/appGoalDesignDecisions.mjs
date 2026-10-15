import {evaluateResponsiveApp} from './appResponsiveDesign.mjs';
import {proposeCoordinatedAppChanges} from './appCoordinatedStudio.mjs';
// Task relevance over the original finite responsive choices. No generated
// business facts or media, provider use, style score or new design engine.
function appGoalContentReadiness(config,goal){
 const blockers=[];
 if(goal==='services'){
  const services=config?.publicProfile?.services;
  if(!Array.isArray(services)||!services.length||services.some(x=>typeof x?.name!=='string'||!x.name.trim()))
   blockers.push('Add and review real service names before prioritising the Services design.');
 }
 if(goal==='photos'){
  const photos=config?.publicProfile?.assets?.gallery;
  if(!Array.isArray(photos)||!photos.some(x=>(x?.approved===true||x?.marketingOk===true)&&typeof x.uri==='string'&&/^https:\/\//.test(x.uri)))
   blockers.push('Add suitable owner-approved photos before prioritising the gallery design.');
 }
 return {ready:blockers.length===0,blockers};
}
function selectAppGoalDesignChoices(config,goal,suggestions){
 const baseline=evaluateResponsiveApp(config);
 if(!baseline.ok)return {choices:[],excludedCount:0};
 const relevant=suggestions.filter(choice=>choice.field!=='galleryLayout'||goal==='photos');
 const choices=relevant.map((choice,index)=>({choice,index,priority:
  choice.field==='galleryLayout'&&goal==='photos'?3:
  choice.field==='navigationStyle'&&['book','enquire','offers','rewards'].includes(goal)?3:
  choice.field==='layoutDensity'&&goal==='services'?3:1}))
  .sort((a,b)=>b.priority-a.priority||a.index-b.index).filter(({choice})=>{
   const proposal=proposeCoordinatedAppChanges(config,[{kind:'appearance',field:choice.field,value:choice.value}]);
   const after=proposal.ok?evaluateResponsiveApp(proposal.nextConfig):null;
   return after?.ok&&after.profiles.every((p,index)=>p.warnings.every(w=>
    baseline.profiles[index].warnings.some(old=>old.key===w.key)));
  }).map(({choice})=>({...choice,goalRelevance:choice.field==='galleryLayout'?
   'Help customers inspect approved examples of your work.':choice.field==='navigationStyle'?
   'Help customers find the selected action among existing sections.':
   'Keep existing information separated and readable.'}));
 return {choices,excludedCount:suggestions.length-choices.length};
}
export {appGoalContentReadiness,selectAppGoalDesignChoices};
