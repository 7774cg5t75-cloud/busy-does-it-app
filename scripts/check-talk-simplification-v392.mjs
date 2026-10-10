import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// V3.92: verify presentation only; iPhone acceptance still required.
const read=(path)=>readFileSync(path,"utf8");
const talk=read("src/screens/talk.js");
const styles=read("src/theme/styles.js");
const controller=read("src/app/AppController.js");
const server=read("supabase/functions/busy-command/index.ts");
const pkg=JSON.parse(read("package.json"));
const expo=JSON.parse(read("app.json")).expo;
const runtime=read("src/core/runtime.js");
const ui=talk.slice(talk.indexOf("  return (\n    <Shell\n      s={s}"));
const checks=[
["v3.92 package and runtime",()=>{
  assert.ok(["3.92.0","3.93.0","3.94.0","3.95.0","3.96.0","3.97.0","3.98.0","3.99.0","3.100.0","3.101.0"].includes(pkg.version));
  assert.equal(expo.version,pkg.version);
  assert.equal(expo.ios.buildNumber,String(Number(pkg.version.split(".")[1])-80));
  assert.ok(runtime.includes('const APP_VERSION = "'+pkg.version.slice(0,-2)+'";'));
}],
["Microphone first, latest reply before typing and secondary tools",()=>{
  const loc=(s)=>{const i=ui.indexOf(s);assert.ok(i>=0,s);return i;};
  const mic=loc('eyebrow="Voice"'),answer=loc('{result ? (');
  const type=loc('eyebrow="Or type"'),quick=loc('showQuickAsks ? (');
  const history=loc('showConversation ? ('),audit=loc('showAdvanced ? (');
  assert.ok(mic<answer && answer<type && type<quick && quick<history && history<audit);
  assert.ok(ui.includes('"Talk to BUSY • Build my business"'));
  assert.ok(!ui.includes('eyebrow="Operator 2.0 boundary"') || ui.indexOf('eyebrow="Operator 2.0 boundary"')>audit);
}],
["Historical and advanced details start collapsed and can be expanded",()=>{
  for(const [state,set] of [
    ["showQuickAsks","setShowQuickAsks"],["showConversation","setShowConversation"],["showAdvanced","setShowAdvanced"]]){
    assert.ok(talk.includes('const ['+state+', '+set+'] = useState(false)'));
    assert.ok(ui.includes('accessibilityState={{ expanded: '+state+' }}'));
    assert.ok(ui.includes('onPress={() => '+set+'((value) => !value)}'));
  }
  for(const key of ["talkSectionToggle:","talkSectionToggleText:","talkSafetyText:","talkLastReply:"]) assert.ok(styles.includes(key),key);
}],
["Voice reliability and server route preserved",()=>{
  for(const text of ["await audioRecorder.stop()","recordingStartedRef.current",
    "await s.submitBusyCommand({ audioUri: recordedUri })","voiceStage === \"sending\"","s.busyCommandError"]) assert.ok(talk.includes(text),text);
  assert.ok(controller.includes('import { fetch as expoFetch } from "expo/fetch";'));
  assert.ok(controller.includes('form.append("audio", audioFile,'));
  assert.ok(server.includes("transcript = await transcribeAudio(audio)"));
}],
["Real commands, preview approval, undo and history retained",()=>{
  for(const t of ["s.submitBusyCommand({ text })","s.executeBusyCommand(result)",
    "s.executeBusyPlanStep(step)","s.clearBusyCommandResult",
    "s.undoLastBusyAction","s.busyActionAudit","s.busyCommandHistory",
    "s.startNewBusyConversation","s.setBusinessCreationConversationActive(false)",
    "s.go(\"businessCreationJourney\")"]) assert.ok(talk.includes(t),t);
  assert.ok(ui.includes("result.requiresConfirmation"));
  assert.ok(ui.includes("previewRows.map"));
  assert.ok(!talk.includes('s.approveSocialDraft('));
  assert.ok(!talk.includes('s.confirmPublishHostedWebsite('));
}]
];
for(const [label,test] of checks){test();console.log("PASS",label)}
console.log("V3.92 streamlined Talk checks:",checks.length);
