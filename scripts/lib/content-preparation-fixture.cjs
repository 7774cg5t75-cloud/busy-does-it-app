const {createRuntime}=require('./offline-component-runtime.cjs');
// Shared inert harness: original hook, Creator and Growth consume the same live owner state.
module.exports=function contentPreparationFixture(extra={}){
 const rt=createRuntime(),{useSocialContentHandoff}=rt.load('src/screens/useSocialContentHandoff.js');
 const data={workspaceScope:{},ownerId:'owner',businessId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',role:'owner',text:'Current owner words',photos:[{id:'chosen',uri:'fixture://chosen'}],brief:'Owner brief',channels:{facebook:true},records:[],selectedDraftId:'old',sourceContext:{},...extra};
 let actions,prompt,route='';rt.native.Alert.alert=(title,body,buttons)=>prompt=buttons;
 function Owner(){return useSocialContentHandoff({...data,setSourceContext:v=>data.sourceContext=v,setText:v=>data.text=v,setSelectedDraftId:v=>data.selectedDraftId=v,setAiResult:()=>{},setAiStatus:()=>{},setCaptionId:()=>{},go:v=>route=v});}
 const render=()=>actions=rt.render(Owner,{});
 const state=()=>({ownerWorkspaceScope:data.workspaceScope,ownerSession:{userId:data.ownerId},cloudWorkspace:{businessId:data.businessId,role:data.role},businessCreationIntelligence:{sharedProfile:data.approvedProfile},socialContentActions:actions,socialSourceContext:data.sourceContext,socialDraftText:data.text,socialCreatePhotos:data.photos,socialDraftChannels:data.channels,selectedSocialDraftId:data.selectedDraftId,socialAiStatus:'idle',socialBrief:data.brief,socialDrafts:data.records});
 const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[];
 return {rt,data,render,state,walk,find:(tree,label)=>walk(tree).find(n=>n.props?.label===label),get actions(){return actions;},get prompt(){return prompt;},get route(){return route;}};
};
