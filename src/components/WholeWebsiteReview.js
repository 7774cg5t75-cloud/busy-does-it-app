import React from 'react';
import {Text,View} from 'react-native';
import {WebView} from 'react-native-webview';
import {Button,Card,Field} from './ui';
import {styles} from '../theme/styles';
import {websiteDraftHasScope} from '../core/websiteDraftScope.mjs';
import {useOwnerEditNavigation} from '../screens/useOwnerEditNavigation';
import {prepareWholeWebsite,prepareWholeWebsiteRefinement,keepWholeWebsite,isCurrentWholeWebsite} from '../core/wholeWebsitePlan.mjs';
import {wholeWebsitePreviewDocument,wholeWebsitePreviewNavigation} from '../core/wholeWebsitePreview.mjs';
import {withWebsitePreviewViewport} from '../core/websiteResponsivePreview.mjs';
import {wholeSiteDerivedSourcesCurrent} from '../../supabase/functions/busy-website-worker/websiteWholeSite.mjs';
import {applyWebsitePageChange,renderWebsiteHtml} from '../domain/websiteBuilder';
const deps={pageEdit:applyWebsitePageChange,renderPage:renderWebsiteHtml};
// A review surface in the existing Website Builder, never a second save authority.
export function WholeWebsiteReview({s,goal='',disabled=false,onPrepared,isParentCurrent}){
 const [review,setReview]=React.useState(null),[reviewScope,setReviewScope]=React.useState(''),[reviewGoal,setReviewGoal]=React.useState('');
 const [selected,setSelected]=React.useState('home'),[width,setWidth]=React.useState('phone');
 const [change,setChange]=React.useState(''),[notice,setNotice]=React.useState(''),[open,setOpen]=React.useState(false),[openScope,setOpenScope]=React.useState('');
 const [busy,setBusy]=React.useState(false),[fencedScope,setFencedScope]=React.useState('');
 const alive=React.useRef(true),flight=React.useRef(false),epoch=React.useRef(0),live=React.useRef(null),used=React.useRef(new WeakSet()),session=React.useRef({identity:null,workspace:null,version:0}),loaded=React.useRef({html:null,baseUrl:null,done:false});
 React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const context={website:s.websiteDraft,ownerId:s.ownerSession?.userId,businessId:s.cloudWorkspace?.businessId,profileRevision:s.connectedRuntime?.profileRevision,goal};
 const identity=JSON.stringify([context.ownerId,context.businessId,context.website?.id]);
 if(session.current.identity!==identity||session.current.workspace!==s.ownerWorkspaceScope){epoch.current++;session.current={identity,workspace:s.ownerWorkspaceScope,version:session.current.version+1};}
 const scope=identity+':'+session.current.version;
 live.current={s,context,scope,review,reviewScope,epoch:epoch.current};
 const report=useOwnerEditNavigation(s,{source:context.website,projectId:context.website?.id,revision:context.website?.generation},()=>{
  if(flight.current)return false;epoch.current++;setReview(null);setChange('');setOpen(false);return true;
 });
 const capturedEpoch=epoch.current;
 const current=()=>alive.current&&live.current.scope===scope&&epoch.current===capturedEpoch&&isParentCurrent?.()!==false;
 const hasScope=!!context.ownerId&&websiteDraftHasScope(context.website,context.businessId),visible=open&&openScope===scope&&hasScope;
 const scopedReview=reviewScope===scope?review:null,fenced=fencedScope===scope;
 const fresh=scopedReview&&reviewGoal===goal&&isCurrentWholeWebsite(scopedReview,context);
 const serviceSourcesCurrent=wholeSiteDerivedSourcesCurrent(context.website);
 const candidate=scopedReview?.candidate||context.website;
 const pages=Array.isArray(candidate?.pages)?candidate.pages.filter(p=>p.enabled!==false):[];
 const page=pages.find(p=>p.id===selected)||pages.find(p=>p.id==='home')||pages[0];
 let preview=null;
 if(visible&&page&&(!review||scopedReview)){
  try{const document=wholeWebsitePreviewDocument(candidate,page.id);if(document)preview={...document,html:withWebsitePreviewViewport(renderWebsiteHtml(candidate,page.id,{standalone:true,privatePagePreview:true}),width)};}catch{}
 }
 if(preview&&(loaded.current.html!==preview.html||loaded.current.baseUrl!==preview.baseUrl))loaded.current={html:preview.html,baseUrl:preview.baseUrl,done:false};
 const prepare=request=>{
  if(!current()||flight.current||disabled||fenced||scopedReview)return false;
  const proposed=request?prepareWholeWebsiteRefinement(context,request,deps):prepareWholeWebsite(context,deps);
  if(!proposed?.ok){setNotice(proposed?.reason||'Review the approved business details before preparing the website.');return false;}
  epoch.current++;setReview(proposed);setReviewScope(scope);setReviewGoal(goal);setSelected('home');setOpen(true);setOpenScope(scope);setNotice('Prepared for your review. Your current website is unchanged.');
  onPrepared?.();report(true);return true;
 };
 const keep=async()=>{
  if(!current()||flight.current||disabled||fenced||!fresh||used.current.has(scopedReview)||typeof live.current.s.applyReviewedWebsitePageAction!=='function'||live.current.context.goal!==context.goal)return false;
  const captured=scopedReview;used.current.add(captured);flight.current=true;setBusy(true);report(false);
  let result;
  try{result=await keepWholeWebsite(captured,{getContext:()=>live.current.context,apply:operation=>live.current.s.applyReviewedWebsitePageAction?.(operation)});}
  catch{result={ok:false,unknown:true,mayReplay:false,reason:'The save outcome is unknown. Inspect the original Website Studio before any new attempt.'};}
  finally{flight.current=false;if(alive.current)setBusy(false);}
  if(!current()||live.current.review!==captured)return false;
  if(live.current.context.profileRevision!==context.profileRevision){setFencedScope(scope);setNotice('The approved business information changed during this attempt. Inspect the original Studio; nothing will be replayed.');report(true);return false;}
  setNotice(result?.reason||'Save not confirmed. Inspect the original Website Studio.');
  if(result?.ok){epoch.current++;setReview(null);setReviewScope('');setChange('');report(false);}
  else{setFencedScope(scope);report(true);}
  return result?.ok===true;
 };
 const discard=()=>{if(!current()||flight.current)return false;epoch.current++;setReview(null);setReviewScope('');setChange('');setNotice('Preview discarded. Your current website and wording are kept.');report(false);return true;};
 if(!context.website)return null;
 if(!hasScope)return <Text style={styles.cardBody}>Open the current business’s original private website before planning its pages.</Text>;
 return <View>
  <Button primary label="See my complete website" disabled={disabled||busy||fenced||!!scopedReview} onPress={()=>prepare()}/>
  {!visible?<Button label="Explore my current pages" disabled={disabled||busy} onPress={()=>{if(current()&&!flight.current){setOpen(true);setOpenScope(scope);return true;}return false;}}/>:null}
  {visible?<Card title="Your complete website" body="Review the pages as one website. Your business information and words remain the starting point; nothing is published.">
   {!serviceSourcesCurrent?<Text style={styles.cardBody}>One of your services has changed since its page was prepared. Your page wording is kept. Review that service and its page in the original Studio before another complete-site change.</Text>:null}
   {context.profileRevision==null?<Text style={styles.cardBody}>Using this website’s reviewed wording. Shared account facts and an account save have not been independently verified.</Text>:null}
   {scopedReview?<>
    <Text style={styles.cardBody}>{'Proposed outline — '+pages.length+' pages. Each page should help a visitor understand the business or take a useful next step.'}</Text>
    {(scopedReview.pages||[]).map(p=><Text key={p.id} style={styles.cardBody}>{p.title+' — '+p.purpose}</Text>)}
    {!fresh?<Text style={styles.cardBody}>Your request, original website or approved business source changed. Your requested wording is kept; discard this stale preview and prepare a fresh review.</Text>:null}
   </>:null}
   <View style={styles.choiceGrid}>{pages.map(p=><View key={p.id} style={styles.choiceCell}><Button compact label={p.title} selected={p.id===page?.id} disabled={busy} onPress={()=>{if(current()&&!flight.current){epoch.current++;setSelected(p.id);}}}/></View>)}</View>
   <View style={styles.choiceGrid}>{[['phone','Phone'],['tablet','Tablet'],['desktop','Desktop']].map(([mode,label])=><View key={mode} style={styles.choiceCell}><Button compact label={label+' layout'} selected={width===mode} disabled={busy} onPress={()=>{if(current()&&!flight.current){epoch.current++;setWidth(mode);}}}/></View>)}</View>
   {/* Catch every navigation in our strict gate: a narrow native whitelist can open rejected schemes through the OS before this callback. */}
   {preview?<WebView key={scope+':'+page.id+':'+width} source={{html:preview.html,baseUrl:preview.baseUrl}} style={{height:560}} originWhitelist={['*']} javaScriptEnabled={false} domStorageEnabled={false} incognito javaScriptCanOpenWindowsAutomatically={false} allowFileAccess={false} mixedContentMode="never" setSupportMultipleWindows={false} onOpenWindow={()=>{}} onLoadEnd={()=>{if(current()&&loaded.current.html===preview.html&&loaded.current.baseUrl===preview.baseUrl)loaded.current.done=true;}} onShouldStartLoadWithRequest={request=>{
    if(!current()||flight.current||(scopedReview?live.current.review!==scopedReview:live.current.context.website!==candidate))return false;const target=wholeWebsitePreviewNavigation(candidate,page.id,{...request,initialDocument:!loaded.current.done});if(target.pageId&&target.pageId!==page.id){epoch.current++;setSelected(target.pageId);}return target.allow;
   }}/>:<Text style={styles.cardBody}>This page could not be safely previewed. Your existing draft is kept.</Text>}
   <Text style={styles.helper}>Private layout preview. Contact and external actions are blocked here. Width controls simulate layouts; genuine browser measurements remain separate.</Text>
   {scopedReview?<><Button primary label="Keep this complete website" disabled={disabled||busy||fenced||!fresh||typeof s.applyReviewedWebsitePageAction!=='function'} onPress={keep}/><Button label="Discard complete-site preview" disabled={busy} onPress={discard}/></>:<>
    <Field label="What would you change across the website?" value={change} maxLength={400} placeholder="Make the service pages more interesting" onChangeText={value=>{if(!current()||flight.current)return;epoch.current++;setChange(value);report(!!value);}}/>
    <Button label="Review my website change" disabled={disabled||busy||fenced||!change.trim()} onPress={()=>prepare(change)}/>
   </>}
   {fenced?<Text style={styles.cardBody}>This attempt will not be replayed. Inspect the current result in the original Studio before preparing anything else.</Text>:null}
  </Card>:null}
  {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}
 </View>;
}
