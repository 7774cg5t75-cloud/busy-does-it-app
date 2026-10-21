import React from 'react';import {Card,Button} from './ui';import {savedAnnouncementEligible,savedAnnouncementStamp} from '../core/savedAnnouncementSource.mjs';
export function GrowthSavedAnnouncements({s}){
 const live=React.useRef(s);live.current=s;
 const scope=s.ownerWorkspaceScope,owner=s.ownerSession?.userId,business=s.cloudWorkspace?.businessId;
 if(!scope||!owner||!['owner','admin'].includes(s.cloudWorkspace?.role)||!s.socialContentActions?.prepareSavedAnnouncement)return null;
 const records=(s.socialDrafts||[]).filter(row=>savedAnnouncementEligible(row,business,s.socialDrafts));
 if(!records.length)return null;
 return <Card eyebrow="Get More Customers · £0-first" title="Reuse an announcement you already wrote" body="Turn a saved announcement or offer into editable wording. These are owner-supplied details, not independently verified facts. Review dates and terms before using them. Your current draft and photos stay until you deliberately use the idea." footer="Text preparation only. No advertising, publication or measured marketing outcome.">
  {records.map(record=>{const stamp=savedAnnouncementStamp(record);return <Button key={record.id} label={'Use saved announcement: '+record.text.slice(0,65)} onPress={()=>{const now=live.current;if(now.ownerWorkspaceScope!==scope||now.ownerSession?.userId!==owner||now.cloudWorkspace?.businessId!==business||!['owner','admin'].includes(now.cloudWorkspace?.role)||!savedAnnouncementEligible(record,business,now.socialDrafts)||savedAnnouncementStamp(record)!==stamp)return false;return now.socialContentActions.prepareSavedAnnouncement(record);}}/>;})}
 </Card>;
}
