import React from 'react';
import {Text} from 'react-native';
import {Button,Details} from './ui';
import {styles} from '../theme/styles';
import {prepareConnectedBusinessWork} from '../core/connectedBusinessPreparation.mjs';
export function ConnectedBusinessPreparation({s}){
 const [value,setValue]=React.useState(null),[notice,setNotice]=React.useState(''),[busy,setBusy]=React.useState(false),alive=React.useRef(true),live=React.useRef(null),flight=React.useRef(false);
 React.useEffect(()=>()=>{alive.current=false;},[]);const owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId,website=s.websiteDraft;live.current={owner:s.ownerSession?.userId,business:s.cloudWorkspace?.businessId,website:s.websiteDraft};
 const current=()=>alive.current&&live.current.owner===owner&&live.current.business===business&&live.current.website===website;
 if(!s.connectedReadProfile)return null;
 return <><Button label="Use my approved business information elsewhere" disabled={busy} onPress={async()=>{if(flight.current||!current())return false;flight.current=true;setBusy(true);try{const basis=await s.connectedReadProfile();if(!current())return false;const review=prepareConnectedBusinessWork({basis,ownerId:owner,businessId:business,website,app:s.miniAppsStatus?.app||null,catalog:s.miniAppsStatus?.catalog||[]});if(!review.ok){setNotice(review.reason);return false;}setValue({review,website});setNotice('Three private starting points prepared from current approved facts. Nothing was installed, saved, sent or published. Each area still needs its own review.');return true;}catch{if(current())setNotice('Approved account information is unavailable. No other draft was changed.');return false;}finally{flight.current=false;if(current())setBusy(false);}}}/>
 {value?.website===website&&value.review.ownerId===owner&&value.review.businessId===business&&(!s.connectedRuntime||s.connectedRuntime.active&&s.connectedRuntime.profileRevision===value.review.source.profileRevision)?<Details label="What Busy can prepare from the same introduction"><Text style={styles.cardBody}>{'App starting point: '+value.review.app.businessName+'\n'+value.review.app.description+'\n'+value.review.app.services.map(x=>x.name).join(' · ')+'\nSupported capabilities need original App Studio review; no app has been created.'}</Text><Text selectable style={styles.cardBody}>{'Content Creator wording for review:\n'+value.review.content.copy}</Text><Text style={styles.cardBody}>{'Get More Customers: '+value.review.growth.steps.join(' ')+'\n'+(value.review.growth.question||'Review the existing service and choose your next step.')}</Text></Details>:null}
 {notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{notice}</Text>:null}</>;
}
