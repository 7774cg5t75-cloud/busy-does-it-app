import React from "react";
import {Text} from "react-native";
import {Shell,Card,Button,Field,MetricRow} from "../components/ui";
import {styles} from "../theme/styles";
import {listGrowthProjects} from "../domain/growthProjectCloud.mjs";
import {buildGrowthCommandCentre,resolveGrowthCommand} from "../domain/growthCommandCentre.mjs";

/**
 * V3.65 read-only growth project command centre.
 * Never update checkpoints and never call any publish endpoint from here.
 * Private cloud checkpoints, not provider-confirmed public state.
 */
function GrowthCommandCentre({s}){
  const userId=s.ownerSession?.userId||"";
  const businessId=s.cloudWorkspace?.businessId||"";
  const scope=userId+"|"+businessId;
  const [result,setResult]=React.useState({scope:"",records:[],error:false});
  const [busy,setBusy]=React.useState(false);
  const [command,setCommand]=React.useState("");
  const [reply,setReply]=React.useState(null);
  const scopeRef=React.useRef(scope);
  const requestId=React.useRef(0);
  const cloudArgsRef=React.useRef(s.growthProjectCloudArgs);
  cloudArgsRef.current=s.growthProjectCloudArgs;
  scopeRef.current=scope;
  const fetchProjects=React.useCallback(async()=>{
    const request=++requestId.current;
    if(!userId||!businessId){
      setResult({scope,records:[],error:false});
      return;
    }
    setBusy(true);
    try{
      const args=await cloudArgsRef.current();
      if(scopeRef.current!==scope || args.userId!==userId || args.businessId!==businessId)return;
      const records=await listGrowthProjects(args);
      if(scopeRef.current!==scope || requestId.current!==request)return;
      setResult({scope,records,error:false});
    }catch(_){
      if(scopeRef.current===scope && requestId.current===request)
        setResult({scope,records:[],error:true});
    }finally{
      if(scopeRef.current===scope && requestId.current===request)setBusy(false);
    }
  },[scope,userId,businessId]);
  React.useEffect(()=>{
    setResult({scope:"",records:[],error:false});
    setReply(null);
    fetchProjects();
    return ()=>{requestId.current+=1;};
  },[fetchProjects]);
  const current=result.scope===scope;
  const centre=buildGrowthCommandCentre({
    records:current?result.records:[],
    approved:s.businessCreationIntelligence?.sharedProfile||{},
    ownerId:userId,businessId,
    readFailed:current && result.error,
  });
  const ask=(text)=>{
    const query=String(text||"").trim();
    setReply(resolveGrowthCommand(query,centre));
  };
  const openProject=(serviceName)=>{
    // No write or publication: select the confirmed service, then user loads
    // its private checkpoint in the existing business creation workspace.
    s.setGrowthProjectFocus(serviceName);
    s.setGrowthProjectTarget("");
    s.openBusinessCreationJourney();
  };
  return (
    <Shell s={s} title="BUSY Growth Command Centre"
      subtitle="Your saved business growth projects, their last private review stage and what needs attention next."
      brandCue="V3.65 • owner-only cloud checkpoints • no automatic publishing">
      <Card eyebrow="Project overview"
        title={busy?"Checking your private projects…":centre.counts.projects+" saved growth project"+(centre.counts.projects===1?"":"s")}
        body={centre.notice}
        footer="Status reflects private drafts only. A handed-off draft is not a published website, app or post."
        tone="blue">
        <MetricRow left="Projects needing attention" right={String(centre.counts.attention)} />
        <MetricRow left="Projects with drafts to review" right={String(centre.counts.awaitingOwnerReview||0)} />
        <Button label={busy?"Refreshing…":"Refresh private project progress"} disabled={busy||!userId||!businessId} onPress={fetchProjects}/>
        <Button label="Start a growth project" onPress={s.openBusinessCreationJourney}/>
      </Card>
      <Card eyebrow="Real publishing results"
        title="Did it actually go live?"
        body="Private growth-project status is not proof of publication. View authenticated website, app and social service records separately. BUSY will not attribute an unrelated result to a service."
        tone="blue">
        <Button label="View verified business activity" onPress={()=>s.go("businessActivityCentre")}/>
      </Card>
      <Card eyebrow="Ask BUSY about your projects"
        title="What should we do next?"
        body="Use a quick question or type your own. BUSY answers from saved project checkpoints only, with no guessed publication status."
        tone="blue">
        <Field label="Project question" value={command} onChangeText={setCommand}
          placeholder="e.g. Where are we with carpet cleaning?" />
        <Button label="Ask about progress" disabled={busy||centre.state!=="ready"} primary onPress={()=>ask(command)}/>
        <Button label="What's left to do?" onPress={()=>ask("What's left to do?")} disabled={busy||centre.state!=="ready"}/>
        <Button label="Which drafts need my review?" onPress={()=>ask("Which drafts need my review?")} disabled={busy||centre.state!=="ready"}/>
        {reply?(
          <>
            <Text style={styles.sectionLabel}>{reply.message}</Text>
            {reply.serviceName ? <Button label={"Open "+reply.serviceName+" workspace"} onPress={()=>openProject(reply.serviceName)}/> : null}
          </>
        ):null}
      </Card>
      {centre.projects.map(project=>(
        <Card key={"growth-command-"+project.serviceKey}
          eyebrow={project.stale?"Review business changes":"Saved private project"}
          title={project.serviceName}
          body={project.next?.description||"No remaining private-draft task is recorded."}
          footer={"Last checkpoint: "+(project.updatedAt?new Date(project.updatedAt).toLocaleString("en-GB"):"Date unavailable")+
            " • Public publication not checked."}
          tone={project.stale || project.next?.status==="blocked"?"amber":"blue"}>
          <MetricRow left="Owner-reviewed drafts" right={project.progress.reviewed+" of "+project.progress.total}/>
          <MetricRow left="Passed to private editors" right={String(project.progress.handedOff)}/>
          {project.tasks.map(task=><MetricRow key={task.target} left={task.label} right={task.status.replace(/_/g," ")} />)}
          <Button label={"Continue "+project.serviceName} primary onPress={()=>openProject(project.serviceName)}/>
        </Card>
      ))}
      <Button label="Back to Home" onPress={()=>s.jump("home","Home")}/>
    </Shell>
  );
}
export {GrowthCommandCentre};
