import {CanonicalWorkPanel} from './CanonicalWorkPanel';
import React from 'react';
import {Text} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';

// Account observations only. Never a local Customer, Work editor or save receipt.
export function CanonicalAccountWork({s}){
 const [page,setPage]=React.useState(null),[selection,setSelection]=React.useState(null),[notice,setNotice]=React.useState(''),[pending,setPending]=React.useState(false),[privateDraft,setPrivateDraft]=React.useState(null),[editor,setEditor]=React.useState(null);
 const live=React.useRef(s),flight=React.useRef(null),mounted=React.useRef(true);
 live.current=s;React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,view=s.screen,api=s.canonicalWork;
 const current=()=>mounted.current&&live.current.ownerWorkspaceScope===scope&&live.current.ownerSession?.userId===owner&&live.current.cloudWorkspace?.businessId===business&&live.current.cloudWorkspace?.role==='owner'&&live.current.screen===view;
 const authorised=value=>value?.businessId===business&&value.ownerId===owner;
 const bound=value=>({scope,owner,business,value});
 const visible=item=>item?.scope===scope&&item.owner===owner&&item.business===business;
 const selected=visible(selection)?selection.value:null,items=visible(page)?page.value.items:[],busy=visible(pending);const sameFlight=()=>visible(flight.current);
 const inspect=async(kind,row=null)=>{
  if(!current()||!api?.enabled||sameFlight()||visible(editor))return false;const token=bound(kind);flight.current=token;setPending(token);
  try{
   if(kind==='page'){
    const value=await api.discover(row);if(!current())return false;if(!authorised(value))throw Error('Account identity changed');setPage(bound(value));setNotice(value.items.length?'Your account engagement summaries were observed. Choose one to inspect.':'No eligible engagements on this page. This does not prove that no unsupported or other-owner records exist.');
   }else if(kind==='open'){
    const value=await api.compare(row.customerId,row.engagementId);if(!current())return false;if(!authorised(value)||value.customerId!==row.customerId||value.engagementId!==row.engagementId)throw Error('Account target changed');
    setSelection(bound(value));setPrivateDraft(null);setNotice('Read-only account observation. No customer has been restored to this device and no earlier save receipt is inferred.');
   }else if(kind==='edit'){
    if(!selected||selected.sourceState!=='current')return false;
    if(['unknown','pending'].includes(api.status().status)){setNotice('An account operation is unresolved. Inspection cannot recover its acknowledgement or permit a retry.');return false;}
    const value=await api.editContext(selected.customerId,selected.engagementId,selected.revision);if(!current()||!authorised(value)||!api.isEditContext(value))return false;
    if(!s.requestOwnerEditTransition)return false;
    return s.requestOwnerEditTransition(()=>{if(current())setEditor(bound(value));},{isCurrent:current});
   }else{
    if(!selected||selected.sourceState!=='current')return false;
    const fresh=await api.read(selected.customerId,selected.engagementId);
    if(!current()||!authorised(fresh)||fresh.revision!==selected.revision||fresh.recordHash!==selected.recordHash){if(current())setNotice('This engagement changed. Inspect it again before opening private wording.');return false;}
    const value=await api.privateRead(selected.customerId,selected.engagementId,'followup');if(!current())return false;if(!authorised(value)||value.customerId!==selected.customerId||value.engagementId!==selected.engagementId)throw Error('Private account identity changed');setPrivateDraft(bound(value));setNotice(value.revision?'Private account wording observed; this is not an own-save acknowledgement.':'No follow-up exists at this observed target. No missing or inaccessible draft is being reconstructed.');
   }
   return true;
  }catch{if(current())setNotice('Account inspection unavailable. No missing record or successful save is inferred. Current local work is unchanged.');return false;}
  finally{if(flight.current===token){flight.current=null;if(current())setPending(null);}}
 };
 if(!api?.enabled||s.cloudWorkspace?.role!=='owner')return null;
 if(visible(editor))return <Card eyebrow="Current account editing" title={"Engagement "+editor.value.engagementId} body="Server-reviewed current source. Editing this engagement does not restore a customer or change other Work.">
  <Button label="Close account editor" onPress={()=>s.requestOwnerEditTransition?.(()=>{if(current()){setEditor(null);setSelection(null);setPrivateDraft(null);}},{isCurrent:current})}/>
  <CanonicalWorkPanel key={owner+':'+business+':'+editor.value.engagementId} s={s} accountContext={editor.value}/>
 </Card>;
 const original=selected?.originalContext,now=selected?.currentContext;
 return <Card eyebrow="Returning to account work" title="Find my account engagements" body="Inspect your authorised account records even when this device has no customer copy. This route is read-only and never restores whole business data.">
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
  <Button label="Find my account engagements" disabled={busy} onPress={()=>inspect('page')}/>
  {items.map(row=><Button key={row.engagementId} label={'Inspect account engagement '+row.engagementId} disabled={busy} onPress={()=>inspect('open',row)}/>)}
  {visible(page)&&page.value.nextCursor?<Button label="Next account engagement page" disabled={busy} onPress={()=>inspect('page',page.value.nextCursor)}/>:null}
  {selected?<>
   <Text selectable style={styles.cardBody}>{'Customer reference: '+selected.customerId+' · Engagement '+selected.engagementId+' · Revision '+selected.revision+' · '+selected.status}</Text>
   <Text style={styles.workspaceMeta}>{'Current source: '+selected.sourceState+'. Original enquiry '+selected.enquiryId+'. No source reassociation or permission to edit.'}</Text>
   <Text selectable style={styles.cardBody}>{'Retained original context\n'+(original.customerName??'(name unavailable)')+' · '+(original.service??'(service unavailable)')+'\n'+(original.enquiryText??'(source unavailable)')}</Text>
   <Text selectable style={styles.cardBody}>{now?'Current authorised source\n'+now.customerName+' · '+now.service+'\n'+now.enquiryText:'Current source cannot be compared safely. Retained context is historical, not a restored customer.'}</Text>
   {selected.customerEvidenceChanged||selected.enquiryEvidenceChanged?<Text style={styles.cardBody}>Source evidence differs. Even when visible words match, other supported source fields may have changed. New mutations remain unavailable here.</Text>:null}
   <Text selectable style={styles.cardBody}>{'Recorded private Prepared quote · £'+selected.record.details.quoteAmount+' · '+selected.record.details.plannedSentDate+'\n'+selected.record.details.message}</Text>
   <Text style={styles.workspaceMeta}>Account inspection does not create a local customer. A separate fresh server review is required to enter the supported finite editor.</Text>
   <Button label="Review current account editing" disabled={busy||selected.sourceState!=='current'||['unknown','pending'].includes(api.status().status)} onPress={()=>inspect('edit')}/>
   <Button label="Inspect account private follow-up" disabled={busy||selected.sourceState!=='current'} onPress={()=>inspect('private')}/>
   {visible(privateDraft)?<Text selectable style={styles.cardBody}>{privateDraft.value.revision?'Observed private follow-up · Revision '+privateDraft.value.revision+'\n'+privateDraft.value.text:'Observed absence: no private follow-up at this target.'}</Text>:null}
  </>:null}
 </Card>;
}
