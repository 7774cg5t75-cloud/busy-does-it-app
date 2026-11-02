import React from 'react';
import {Text} from 'react-native';
import {Card,Button,Field} from './ui';
import {styles} from '../theme/styles';
import {operationalOverviewIntent} from '../core/operationalScreen.mjs';
import {CanonicalWorkPanel} from './CanonicalWorkPanel';
// Source-grounded finite page; this is not a collection of jobs or a write authority.
export function WorkPreparationOverview({s,onChoose=null,loadPage=null}){
 const [page,setPage]=React.useState(null),[notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false),[words,setWords]=React.useState(''),[filter,setFilter]=React.useState(null),[selected,setSelected]=React.useState(null);
 const bound=React.useRef({workspace:s.ownerWorkspaceScope,owner:s.ownerSession?.userId,business:s.cloudWorkspace?.businessId}),live=React.useRef(s),mounted=React.useRef(true),epoch=React.useRef(0);live.current=s;React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;epoch.current++;};},[]);
 const current=()=>mounted.current&&live.current.ownerWorkspaceScope===bound.current.workspace&&live.current.ownerSession?.userId===bound.current.owner&&live.current.cloudWorkspace?.businessId===bound.current.business&&live.current.cloudWorkspace?.role==='owner';
 if(!current()||!s.canonicalWork?.enabled||!s.workPreparationRequest)return null;
 const inspect=async(after=null)=>{if(!current()||busy)return false;const token=++epoch.current;setBusy(true);try{const r=loadPage?await loadPage(after):await s.workPreparationRequest({action:'private_work_preparation',targetKind:'preparation_overview',operation:'read',...(after?{after}:{})});if(!current()||epoch.current!==token)return false;if(!r?.ok||!r.privateOnly||r.ownerId!==bound.current.owner||r.businessId!==bound.current.business||!Array.isArray(r.rows))throw Error();setPage(r);setFilter(null);setNotice('Current private preparations. No job, booking or customer acceptance is inferred.');return true;}catch{if(current())setNotice('Preparations are unavailable or have changed. Your unfinished words were kept.');return false;}finally{if(current())setBusy(false);}};
 const choose=async row=>{const token=++epoch.current,customer=(s.customers||[]).filter(c=>c.id===row.source.customerId);if(!current()||customer.length!==1)return false;const isCurrent=()=>current()&&epoch.current===token&&live.current.customers?.includes(customer[0]);const apply=async()=>{if(!isCurrent())return false;if(onChoose)return onChoose(row);try{let context=null;if(row.source.targetKind==='prepared_quote'){context=await s.canonicalWork.read(row.source.customerId,row.source.engagementId);if(!isCurrent()||context.revision!==row.source.quoteRevision)return false;}setSelected({row,customer:customer[0],context});return true;}catch{setNotice('This original Work record changed. Refresh before opening it.');return false;}};return s.requestOwnerEditTransition?s.requestOwnerEditTransition(apply,{isCurrent}):apply();};
 const shown=filter?.rows||page?.rows||[];
 return <Card title="Here’s what needs doing" body="Your private preparations from original enquiries and Prepared quotes. These are not confirmed jobs.">
 <Button label="Show preparations I’ve started" disabled={busy} onPress={()=>inspect()}/>
 {page?<><Field label="Ask about these preparations" value={words} onChangeText={setWords}/><Button label="Find outstanding tasks" onPress={()=>{const r=operationalOverviewIntent(words,page.rows);if(r.ok)setFilter(r);else setNotice(r.reason);}}/>
 {shown.map(row=><Card key={row.key} title={row.title} body={row.status==='current'?row.customerName+' · '+row.stage+' · '+row.remainingCount+' outstanding · '+row.completedCount+' checked':row.status==='needs_review'?'This enquiry has changed since you last reviewed it.':'This original source is unavailable.'}>
 {filter?.taskFilter?row.remaining?.filter(i=>(i.text+' '+i.stage).toLowerCase().includes(filter.taskFilter)).map(i=><Text key={i.id} style={styles.cardBody}>{i.text}</Text>):null}
 <Button label={onChoose?'Choose this preparation':'Open original preparation'} disabled={busy||row.status==='unavailable'} onPress={()=>choose(row)}/>
 <Text style={styles.workspaceMeta}>Owner planning only. Customer acceptance, actual job status and completion are not established here.</Text>
 </Card>)}
 {!shown.length?<Text style={styles.cardBody}>No preparations on this page. Open an original filed enquiry to start one.</Text>:null}
 {page.nextCursor?<Button label="Next preparations" disabled={busy} onPress={()=>inspect(page.nextCursor)}/>:null}</>:null}
 {selected&&s.customers?.includes(selected.customer)?<><Button label="Return to preparation overview" onPress={()=>s.requestOwnerEditTransition?s.requestOwnerEditTransition(()=>setSelected(null),{isCurrent:current}):false}/><CanonicalWorkPanel key={selected.row.key} s={s} customer={selected.customer} accountContext={selected.context} sourceEnquiryId={selected.row.source.targetKind==='filed_enquiry'?selected.row.source.enquiryId:null}/></>:null}
 {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
 </Card>;
}
