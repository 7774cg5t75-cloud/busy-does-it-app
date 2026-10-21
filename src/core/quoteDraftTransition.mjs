// Deliberate transitions over the original transient quote wording, not persistence.
export function protectQuoteDraftTransition({workspace,workspaceRef,draftRef,epochRef,renderEpoch,sourceCurrent,confirm,apply,promptTitle="Keep your current follow-up?",promptBody="Opening this quote will replace unfinished private wording. Nothing will be sent."}){
 if(workspaceRef.current!==workspace||epochRef.current!==renderEpoch||!sourceCurrent())return false;
 const draft=draftRef.current,epoch=epochRef.current;
 const current=()=>workspaceRef.current===workspace&&draftRef.current===draft&&epochRef.current===epoch&&sourceCurrent();
 let resolved=false;
 const run=()=>{if(resolved)return false;resolved=true;if(!current())return false;apply();return true;};
 if(draft?.workspace===workspace&&draft.words?.trim()){
  confirm(promptTitle,promptBody,[
   {text:'Keep editing',style:'cancel',onPress:()=>{resolved=true;}},
   {text:'Discard changes',style:'destructive',onPress:run},
  ]);return false;
 }
 return run();
}

export function isQuoteDraftSourceCurrent(draft,workspace,customerId,action,customer){
 return !!draft&&draft.workspace===workspace&&draft.customerId===customerId&&draft.action===action&&!!action&&(!draft.customer||draft.customer===customer);
}
