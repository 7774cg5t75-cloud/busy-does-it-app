import {selectBusinessContent} from './businessContentRecords.mjs';
// Ephemeral public browsing state only. No persistence or request authority.
const scope=(feed,kind,contextKey)=>JSON.stringify([feed?.businessId||'',kind,contextKey]);
function catalogueState(value,feed,kind,contextKey=''){
 const key=scope(feed,kind,contextKey);
 return value?.scope===key?value:{scope:key,query:'',category:'',selected:'',detailRevision:null,options:{},optionRevisions:{}};
}
const catalogueSource=(feed,kind,contextKey='')=>JSON.stringify([feed,kind,contextKey]);
function catalogueView(state,feed,kind){
 const records=selectBusinessContent(feed,{kind}),categories=[...new Set(records.map(r=>r.data.category).filter(Boolean))];
 const category=categories.includes(state.category)?state.category:'';
 const rows=selectBusinessContent(feed,{kind,query:state.query,category});
 const detail=records.find(r=>r.id===state.selected),detailChanged=!!detail&&state.detailRevision!==detail.revision;
 return {records,categories,rows,detail,detailChanged,category,related:detail?.data.category?records.filter(r=>r.id!==detail.id&&r.data.category===detail.data.category&&r.data.status!=='cancelled').slice(0,3):[]};
}
function transitionCatalogue(value,event,feed,kind,contextKey=''){
 const state=catalogueState(value,feed,kind,contextKey);
 if(event?.source!==catalogueSource(feed,kind,contextKey))return state;
 const view=catalogueView(state,feed,kind),row=view.records.find(r=>r.id===event.recordId);
 switch(event.type){
  case 'query':return typeof event.value==='string'?{...state,query:event.value.slice(0,100),selected:'',detailRevision:null}:state;
  case 'category':return event.value===''||view.categories.includes(event.value)?{...state,category:event.value,selected:'',detailRevision:null}:state;
  case 'clear':return {...state,query:'',category:'',selected:'',detailRevision:null};
  case 'back':return {...state,selected:'',detailRevision:null};
  case 'open':return row&&row.revision===event.revision?{...state,selected:row.id,detailRevision:row.revision}:state;
  case 'review':return view.detail?{...state,detailRevision:view.detail.revision,options:{...state.options,[view.detail.id]:''},optionRevisions:{...state.optionRevisions,[view.detail.id]:view.detail.revision}}:state;
  case 'option':return kind==='product'&&row&&row.id===state.selected&&!view.detailChanged&&row.revision===event.revision&&(event.value===''||row.data.variants?.some(v=>v.id===event.value))?{...state,options:{...state.options,[row.id]:event.value},optionRevisions:{...state.optionRevisions,[row.id]:row.revision}}:state;
  default:return state;
 }
}
export {catalogueState,catalogueSource,catalogueView,transitionCatalogue};
