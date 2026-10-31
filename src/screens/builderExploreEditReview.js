import {ReviewPanel} from '../components/WorkflowChrome';
import React from 'react';
import {Text} from 'react-native';
import {Button} from '../components/ui';
import {styles} from '../theme/styles';
import {currentBuilderExplore} from '../core/builderExplore.mjs';
export function BuilderExploreEditReview({context,handoff,onApply,onCancel}){
 const alive=React.useRef(true);React.useEffect(()=>()=>{alive.current=false;},[]);
 const live=React.useRef(null);live.current={context,handoff};
 const current=()=>alive.current&&live.current.context===context&&live.current.handoff===handoff&&currentBuilderExplore({ok:true,source:handoff?.source},context);
 const valid=current();
 return <ReviewPanel eyebrow="Explore has ended" title="Review the private website edit" body="This is a structured change summary, not a rendered screenshot. Nothing has been applied. Publication remains a separate approval.">
  <Text style={styles.cardBody}>{handoff.source.projectId+' • original revision '+handoff.source.revision}</Text>
  {handoff.summary.map((line,index)=><Text key={index} style={styles.cardBody}>{line}</Text>)}
  <Text style={styles.cardBody}>{valid?handoff.cost:'Source or account changed. Cancel and explore the current project again.'}</Text>
  <Button label="Approve this private website edit" disabled={!valid||typeof onApply!=='function'} onPress={()=>{if(current()){const result=onApply({pageId:'home',generation:handoff.source.revision,instruction:handoff.instruction});if(result?.applied){alive.current=false;onCancel();}}}}/>
  <Button label="Cancel — keep original website" onPress={()=>{alive.current=false;onCancel();}}/>
 </ReviewPanel>;
}
