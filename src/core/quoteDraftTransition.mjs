// Deliberate transitions over the original transient quote wording, not persistence.
export function protectQuoteDraftTransition({workspace,workspaceRef,draftRef,epochRef,renderEpoch,sourceCurrent,confirm,apply}){
 if(workspaceRef.current!==workspace||epochRef.current!==renderEpoch||!sourceCurrent())return false;
 const draft=draftRef.current,epoch=epochRef.current;
 const current=()=>workspaceRef.current===workspace&&draftRef.current===draft&&epochRef.current===epoch&&sourceCurrent();
 const run=()=>{if(!current())return false;apply();return true;};
 if(draft?.workspace===workspace&&draft.words?.trim()){
  confirm('Keep your current follow-up?','Opening this quote will replace unfinished private wording. Nothing will be sent.',[
   {text:'Keep editing',style:'cancel'},
   {text:'Discard changes',style:'destructive',onPress:run},
  ]);return false;
 }
 return run();
}
