import React from 'react';
import {Text} from 'react-native';
import {Card,Button} from './ui';
import {styles} from '../theme/styles';
import {buildBusinessBrandDnaSnapshot} from '../core/businessBrandDnaV3195.mjs';
import {prepareSocialBrandHandoff,confirmSocialBrandHandoff} from '../core/socialBrandHandoffV3199.mjs';

// £0-first recommendations from the same Brand DNA. No fetch, save or publishing.
export function GrowthContentIdeas({s}){
 const input={website:s.websiteDraft,app:s.miniAppsStatus?.app,businessId:s.cloudWorkspace?.businessId};
 const ownerId=s.ownerSession?.userId,live=React.useRef(null);live.current={...input,ownerId,s};
 const [idea,setIdea]=React.useState(null);
 const snapshot=buildBusinessBrandDnaSnapshot(input);
 const current=()=>live.current.ownerId===ownerId&&live.current.businessId===input.businessId&&live.current.website===input.website&&live.current.app===input.app;
 const checked=idea&&idea.ownerId===ownerId&&current()?confirmSocialBrandHandoff({...input,evidence:idea}):null;
 if(!snapshot.ok||snapshot.conflicts.length||!snapshot.services.length)return null;
 return <Card eyebrow="Get More Customers · £0-first idea" title="Explain a service you already offer"
  body="A factual service post can help people understand what you do. These ideas use your current website and app branding; they are suggestions, not evidence of reach or new customers."
  footer="Local text preview only. No paid generation, advertising, partner contact or publication." tone="blue">
  {snapshot.services.slice(0,3).map(service=><Button key={service.name} label={'Review a post idea: '+service.name}
   onPress={()=>{if(current())setIdea({...prepareSocialBrandHandoff({...input,serviceName:service.name}),ownerId});}}/>)}
  {checked?.ok?<>
   <Text style={styles.sectionLabel}>{'Private wording idea · '+checked.serviceName}</Text>
   <Text selectable style={styles.cardBody}>{checked.copy}</Text>
   <Text style={styles.cardBody}>{'Open this exact service idea in Content Creator for review. Your existing caption, saved draft and selected media stay unchanged until you deliberately use the new idea.'}</Text>
   <Button label="Open Content Creator for this idea" onPress={()=>{if(!current()||!confirmSocialBrandHandoff({...input,evidence:idea}).ok)return;if(live.current.s.socialContentActions)live.current.s.socialContentActions.prepare(checked.serviceName);else live.current.s.go('socialCreator');}}/>
  </>:idea?<Text style={styles.cardBody}>Your approved source changed. Review a current service idea again.</Text>:null}
 </Card>;
}
