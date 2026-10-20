import React from 'react';
import {Text} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
import {publicBusinessContent,selectBusinessContent} from '../core/businessContentRecords.mjs';

// Original approved-record read and Creator handoff; no separate copy or marketing engine.
export function GrowthCatalogueIdeas({s}){
 const [treatment,setTreatment]=React.useState('standard');
 const [view,setView]=React.useState(null),live=React.useRef({s,view}),alive=React.useRef(true),sequence=React.useRef(0);
 live.current={s,view,treatment};React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 if(!s.socialContentActions||!s.businessContentRequest)return null;
 const ticket=s.socialContentActions.capture(),owner=s.ownerSession?.userId,businessId=s.cloudWorkspace?.businessId;
 const current=()=>alive.current&&live.current.s.ownerSession?.userId===owner&&live.current.s.cloudWorkspace?.businessId===businessId&&live.current.s.socialContentActions.fresh(ticket);
 const stopWhenChanged=id=>{if(alive.current&&id===sequence.current&&live.current.s.socialContentActions.capture().scope===ticket.scope)setView({status:'stale'});return false;};
 const load=async()=>{
  if(!current())return false;
  const id=++sequence.current;setView({status:'loading'});
  try{
   const result=await live.current.s.businessContentRequest('content_list');
   if(id!==sequence.current||!current())return stopWhenChanged(id);
   const feed=result?.ok===true&&result.businessId===businessId?publicBusinessContent(result.records,businessId):null;
   if(!feed?.ok)throw Error('Approved items could not be verified.');
   setView({status:'ready',businessId,owner,ticket,records:[...selectBusinessContent(feed,{kind:'event'}).filter(row=>row.data.status!=='cancelled'),...selectBusinessContent(feed,{kind:'product'})].slice(0,3)});return true;
  }catch{if(id===sequence.current&&current())setView({status:'failed'});return false;}
 };
 const visible=view?.owner===owner&&view?.businessId===businessId&&s.socialContentActions.fresh(view.ticket)?view:null;
 return <Card eyebrow="Get More Customers · £0-first" title="Tell people about an approved item"
  body="Use a current approved product or event as the starting point for a factual post. Busy can prepare private wording; no reach, sales, stock, tickets or booking availability are promised.">
  <Button label={view?.status==='loading'?'Loading approved items…':'Find approved product and event ideas'} onPress={load}/>
  {visible?.records?.length>0?<><Text style={styles.cardBody}>Choose the wording for your next idea. Your current draft stays unchanged until you use it in Content Creator.</Text>{[['standard','Original wording'],['welcoming','Friendly and welcoming'],['concise','Short and clear'],['detailed','More explanatory']].map(([value,label])=><Button key={value} label={(value===treatment?'✓ ':'')+label} onPress={()=>{if(current()&&live.current.view===view){live.current.treatment=value;setTreatment(value);}}}/>)}</>:null}
  {visible?.records?.map(row=><React.Fragment key={row.id}>
   <Text style={styles.cardBody}>{row.data.name+' — '+row.data.description}</Text>
   <Button label={'Prepare a post: '+row.data.name} onPress={()=>{
    if(!current()||live.current.treatment!==treatment||live.current.view!==view||!live.current.s.socialContentActions.fresh(view.ticket))return false;
    return live.current.s.socialContentActions.loadRecords(row.kind,'','',{selection:{recordId:row.id,revision:row.revision},recordStamp:JSON.stringify(row)},treatment);
   }}/>
  </React.Fragment>)}
  {visible?.status==='ready'&&!visible.records.length?<Text style={styles.cardBody}>No eligible approved items were found. You can still introduce your business or explain a current service.</Text>:null}
  {view?.status==='stale'?<Text style={styles.cardBody}>Your draft or source changed during the read. Load fresh ideas when ready; your content is kept.</Text>:null}
  {view?.status==='failed'?<Text style={styles.cardBody}>Could not load current approved items. No content was replaced; try a fresh read when ready.</Text>:null}
 </Card>;
}
