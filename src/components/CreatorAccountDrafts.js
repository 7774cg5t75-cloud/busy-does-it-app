import React from 'react';
import {Text,Alert} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
import {creatorContentFromEditor,openCreatorAccountRecord} from '../core/creatorDraftAccount.mjs';
export function CreatorAccountDrafts({s,opportunityId=null}){
 const [page,setPage]=React.useState(null),[base,setBase]=React.useState(null),[notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false),[unknown,setUnknown]=React.useState(false);
 const live=React.useRef(s),flight=React.useRef(null),approval=React.useRef(null),alive=React.useRef(true);live.current=s;
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const api=s.creatorDraftAccount,scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 const current=()=>alive.current&&live.current.ownerWorkspaceScope===scope&&live.current.ownerSession?.userId===owner&&live.current.cloudWorkspace?.businessId===business&&live.current.cloudWorkspace?.role==='owner'&&live.current.creatorDraftAccount===api;
 const work=async fn=>{if(!current()||flight.current||!api?.enabled)return false;const token={};flight.current=token;setBusy(true);try{return await fn();}catch{if(current())setNotice('Account inspection unavailable. Your existing work is kept; nothing was replayed.');return false;}finally{if(flight.current===token){flight.current=null;if(current())setBusy(false);}}};
 const load=after=>work(async()=>{const v=await api.list(opportunityId,after);if(!current())return false;setPage({scope,owner,business,value:v});setNotice('Independent account catalogue. These observations are not earlier save receipts.');return true;});
 const open=id=>work(async()=>{const ticket=s.socialContentActions.capture(),v=await api.read(id);if(!current()||!s.socialContentActions.fresh(ticket))return false;setBase({scope,owner,business,value:v});setNotice('Account revision '+v.revision+'; source '+v.sourceState+'. Opening preserves this historical source, not new permission.'+(v.content.brandFingerprint!==String(s.businessCreationIntelligence?.sharedProfile?.fingerprint||'')?' The saved brand reference differs from current business facts; your words are kept.':''));return openCreatorAccountRecord(live.current,v);});
 const selected=base?.scope===scope&&base.owner===owner&&base.business===business?base.value:null;
 const save=()=>{const input=creatorContentFromEditor(s);if(!input||!current()||unknown||flight.current)return false;const editor=s.socialContentActions.capture(),isCurrent=()=>current()&&s.socialContentActions.fresh(editor),baseRecord=selected?.draftId===input.draftId?selected:null;
  const ticket=api.review({...input,base:baseRecord,requestKey:'creator_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2),isCurrent});if(!ticket)return false;let used=false;const token={};approval.current=token;
  Alert.alert('Save this private Creator revision?','Save these exact words, brief, format and channels to the private account record. No media is removed, no content is sent or published. Existing versions remain preserved.',[{text:'Keep editing',style:'cancel',onPress:()=>{used=true;}},{text:'Save private revision',onPress:()=>work(async()=>{if(used||approval.current!==token||!isCurrent())return false;used=true;const result=await api.commit(ticket);if(!current())return false;setUnknown(result.status==='unknown');setNotice(result.ok?'Acknowledged own private save revision '+result.receipt.revision+'. Independently check it before editing again.':result.status==='unknown'?'Save outcome unknown. Do not retry; inspect the exact operation.':'Save was not established; wording and earlier versions are kept.');if(result.ok){const v=await api.read(input.draftId);if(isCurrent())setBase({scope,owner,business,value:v});}return result.ok;})}]);return true;
 };
 const visiblePage=page?.scope===scope&&page.owner===owner&&page.business===business?page.value:null;
 if(!api?.enabled)return <Card title="Private account Creator drafts" body="Account continuation is not activated. Existing device drafts and their media remain unchanged."/>;
 return <Card title="Saved private Creator work" body="Discover exact account drafts, then open through the original Creator Keep/Use controls. Text-only owner-reported preparation is supported by this disabled candidate; media and publication queue records need their original authority.">
  <Button label="Find saved Creator drafts" disabled={busy} onPress={()=>load(null)}/>
  {visiblePage?.items.map((row,i)=><Button key={row.draftId} label={'Open account draft '+(i+1)+' · '+row.format+' · '+(row.briefPreview||'Untitled private draft')+' · revision '+row.revision} disabled={busy} onPress={()=>open(row.draftId)}/>)}
  {visiblePage?.nextAfter?<Button label="Next account draft page" disabled={busy} onPress={()=>load(visiblePage.nextAfter)}/>:null}
  <Button label="Inspect selected Creator account revision" disabled={busy||!s.selectedSocialDraftId} onPress={()=>work(async()=>{const id=s.selectedSocialDraftId,t=s.socialContentActions.capture(),v=await api.read(id);if(!current()||!s.socialContentActions.fresh(t))return false;setBase({scope,owner,business,value:v});setNotice('Independent revision '+v.revision+' observed; not an own-write receipt.');return true;})}/>
  <Button label="Review private account Creator save" disabled={busy||unknown||!creatorContentFromEditor(s)} onPress={save}/>
  {unknown?<Button label="Inspect uncertain Creator operation" disabled={busy} onPress={()=>work(async()=>{const r=await api.recover();if(!current())return false;if(r?.found)setUnknown(false);setNotice(r?.found?'Exact operation observed independently. No earlier own-write receipt recreated.':'Outcome unresolved; do not repeat the write.');return !!r?.found;})}/>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
 </Card>;
}
