import React from 'react';
import {View,Text} from 'react-native';
import {Card,Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
import {planReviewedWebsiteComposition,reviewedWebsiteCompositionCurrent} from '../core/websiteReviewedComposition.mjs';
function WebsiteCompositionReview({website,app,businessId,pageId,canCompare,onCompare}){
 const [goal,setGoal]=React.useState('Show our services and make enquiries easy'),[brandSource,setBrandSource]=React.useState('website');
 const [review,setReview]=React.useState(null);const live=React.useRef(null);live.current={website,app,businessId};
 if(!website?.id||!app?.id)return null;
 const input={website,app,businessId,pageId,request:goal,brandSource};
 const plan=planReviewedWebsiteComposition(input),current=review&&reviewedWebsiteCompositionCurrent(review.evidence,input)&&review.pageId===pageId&&review.request===goal.trim()&&review.brandSource===brandSource;
 return <Card title="Compose the whole website together" eyebrow="Your business, one coherent design" body="Choose the customer goal and branding source. Busy reuses existing sections; no facts or media are invented. Nothing is saved by preparing a comparison.">
  <Field label="What should customers find or do?" value={goal} onChangeText={value=>{setGoal(value);setReview(null);}}/>
  <Button label={(brandSource==='website'?'✓ ':'')+'Keep my website branding'} onPress={()=>{setBrandSource('website');setReview(null);}}/>
  <Button label={(brandSource==='app'?'✓ ':'')+'Review my app branding for this website'} onPress={()=>{setBrandSource('app');setReview(null);}}/>
  <Button label="Review coordinated page changes" onPress={()=>setReview(plan.ok?plan:null)}/>
  {!plan.ok?<Text style={styles.cardBody}>{plan.reason}</Text>:null}
  {review&&!current?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>A source changed. Review the current app, website and goal again.</Text>:null}
  {current?<View>
   <Text style={styles.cardBody}>{review.brandExplanation+' '+review.explanation}</Text>
   {review.conflicts.map((line,i)=><Text key={'conflict-'+i} style={styles.cardBody}>{'Review separately: '+line}</Text>)}
   {review.changes.map((line,i)=><Text key={i} style={styles.cardBody}>{line}</Text>)}
   {review.unimplemented.length?<Text style={styles.cardBody}>{'Not supplied by a layout change: '+review.unimplemented.join(', ')+'. No new transactional feature will be enabled.'}</Text>:null}
   {!review.canPrepare?<Text style={styles.cardBody}>No supported change is needed. Your current design is retained.</Text>:<>
    <Text style={styles.cardBody}>Website-wide order and theme changes may affect other pages. Your wording, images, locks and public version stay protected. This proposal has no new screenshot or measured-quality approval.</Text>
    {!canCompare?<Text style={styles.cardBody}>Choose a phone, tablet or desktop preview width before comparing.</Text>:null}
    <Button label="Compare this reviewed whole-page design" disabled={!canCompare} onPress={()=>{
     if(live.current.website!==website||live.current.app!==app||live.current.businessId!==businessId||!reviewedWebsiteCompositionCurrent(review.evidence,live.current))return;
     onCompare?.({compositionEvidence:review.evidence});
    }}/>
   </>}
  </View>:null}
 </Card>;
}
export {WebsiteCompositionReview};
