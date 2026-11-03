import React from 'react';
import {Text} from 'react-native';
import {Button,Details} from './ui';
import {styles} from '../theme/styles';
import {privateArtifactCrypto} from '../core/privateArtifactCrypto';
import {createPhotoPurposeAccount,PHOTO_PURPOSES} from '../core/photoPurposeAccount.mjs';
const sessions=new WeakMap();
const labels={website_hero:'Website homepage',website_gallery:'Website gallery',app_presentation:'Private app presentation',creator_draft:'Private content draft',marketing_material:'Marketing material draft'};
export function BusinessPhotoPermissions({s,photo}){
 const photoNow=React.useRef(photo);photoNow.current=photo;
 const live=React.useRef(s),alive=React.useRef(true),flight=React.useRef(false);live.current=s;
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const [base,setBase]=React.useState(null),[choices,setChoices]=React.useState({}),[notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false);
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,runtime=s.connectedRuntime;
 const current=()=>alive.current&&photoNow.current===photo&&live.current.ownerWorkspaceScope===scope&&live.current.ownerSession?.userId===owner&&live.current.cloudWorkspace?.businessId===business&&live.current.connectedRuntime===runtime;
 if(!runtime?.requestPhotoPurpose||!photo?.exportOriginalPath||!s.creatorDraftAccount?.reviewMedia)return null;
 let api=sessions.get(runtime);if(!api){api=createPhotoPurposeAccount({getCurrent:()=>({scope:live.current.ownerWorkspaceScope,ownerId:live.current.ownerSession?.userId,businessId:live.current.cloudWorkspace?.businessId,role:live.current.cloudWorkspace?.role,ready:runtime.active}),request:(...args)=>runtime.requestPhotoPurpose(...args),randomUUID:()=>privateArtifactCrypto.randomUUID()});sessions.set(runtime,api);}
 const work=async fn=>{if(!current()||flight.current)return false;flight.current=true;setBusy(true);try{return await fn();}catch{if(current())setNotice('Private photo permission review is unavailable. Nothing was saved or published.');return false;}finally{flight.current=false;if(current())setBusy(false);}};
 return <Details label="Choose where this original may be used">
  <Text style={styles.cardBody}>Your permission statement is separate from independent copyright verification. Each use needs its own approval; publication stays separate. Withdrawing permission prevents new selections through this authority, not deletion of historical or external copies.</Text>
  <Button label="Inspect current photo permissions" disabled={busy} onPress={()=>work(async()=>{const reviewed=await s.creatorDraftAccount.reviewMedia(photo);if(!current()||reviewed.projection.state!=='eligible')return false;const r=await api.inspect(reviewed.ref);if(!current())return false;setBase(r);setChoices(r.decisions);setNotice('Current private decisions inspected. Choose only the uses you are entitled to approve.');return true;})}/>
  {base?PHOTO_PURPOSES.map(p=><Button key={p} label={labels[p]+(choices[p]==='approved'?' · allowed':' · not allowed')} disabled={busy||api.uncertain} onPress={()=>{if(!current()||flight.current)return false;setChoices(old=>({...old,[p]:old[p]==='approved'?'withdrawn':'approved'}));return true;}}/>):null}
  {base?<Button label="I have permission — approve and save these private uses" disabled={busy||api.uncertain} onPress={()=>work(async()=>{const ticket=api.review(base,choices,current);if(!ticket)return false;const r=await api.commit(ticket);if(!current())return false;if(r.ok){setBase(r.observed);setChoices(r.observed.decisions);}setNotice(r.ok?'Private photo uses saved and independently reopened. No public rights or publication was granted.':'Save outcome is uncertain. Do not repeat it; inspect the original operation.');return r.ok;})}/>:null}
  {api.uncertain?<Button label="Inspect uncertain photo permission save" disabled={busy} onPress={()=>work(async()=>{const r=await api.recover();if(!current())return false;if(r.found){setBase(r.observed);setChoices(r.observed.decisions);}setNotice(r.found?'Original operation independently found. No write was repeated.':'Outcome remains unknown. Your selection is kept; no retry was made.');return r.found;})}/>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
 </Details>;
}
