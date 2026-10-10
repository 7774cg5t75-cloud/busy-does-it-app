import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Static V3.90 regression only. A physical iPhone voice recording is still required.
const read=p=>readFileSync(p,"utf8");
const talk=read("src/screens/talk.js");
const controller=read("src/app/AppController.js");
const server=read("supabase/functions/busy-command/index.ts");
const styles=read("src/theme/styles.js");
const runtime=read("src/core/runtime.js");
const app=JSON.parse(read("app.json")).expo;
const pkg=JSON.parse(read("package.json"));
const checks=[
  ["Version and microphone permission",()=>{
    assert.ok(["3.90.0","3.91.0","3.92.0","3.93.0","3.94.0","3.95.0","3.96.0","3.97.0","3.98.0","3.99.0","3.100.0","3.101.0","3.102.0","3.103.0","3.104.0","3.105.0"].includes(pkg.version));
    assert.equal(app.version,pkg.version);
    assert.equal(app.ios.buildNumber,String(Number(pkg.version.split(".")[1])-80));
    assert.equal(app.ios.bundleIdentifier,"com.busydoesit.app");
    assert.ok(runtime.includes(`const APP_VERSION = "${pkg.version.slice(0,-2)}";`));
    assert.ok(JSON.stringify(app.plugins).includes("microphonePermission"));
  }],
  ["Recorder remains responsive while native state catches up",()=>{
    assert.ok(talk.includes("recordingStartedRef.current = true"));
    assert.ok(talk.includes("recordingStartedRef.current = false"));
    assert.ok(talk.includes("recorderTransitionRef.current"));
    assert.ok(talk.includes("voiceStage === \"recording\""));
    assert.ok(talk.includes("if (!recordingStartedRef.current && !recorderState.isRecording)"));
    assert.ok(!talk.includes("if (!recorderState.isRecording) return;"));
  }],
  ["The microphone always shows user-visible progress or an actionable error",()=>{
    for(const msg of ["Preparing your microphone","Listening. Tap","Sending your recording to BUSY",
      "BUSY couldn't complete that voice request","No recording started",
      "Microphone access is turned off","s.busyCommandError"]) assert.ok(talk.includes(msg),msg);
    assert.ok(styles.includes("talkVoiceNotice:"));
    assert.ok(styles.includes("talkVoiceError:"));
    assert.ok(talk.includes("accessibilityLabel={isListening ?"));
  }],
  ["The actual recorded file is passed to the existing voice command handler",()=>{
    assert.ok(talk.includes("await audioRecorder.stop()"));
    assert.ok(talk.includes("const recordedUri = audioRecorder.uri"));
    assert.ok(talk.includes("await s.submitBusyCommand({ audioUri: recordedUri })"));
    assert.ok(controller.includes("form.append(\"audio\","));
    assert.ok(controller.includes("BUSY_COMMAND_URL"));
    assert.ok(controller.includes("setBusyCommandError(message)"));
    assert.ok(server.includes('if (contentType.includes("multipart/form-data"))'));
    assert.ok(server.includes('transcribeAudio(audio)'));
  }],
  ["No customer changes are automatically authorised by opening the microphone",()=>{
    assert.ok(!talk.includes("s.confirmPublishHostedWebsite("));
    assert.ok(!talk.includes("s.approveSocialDraft("));
    assert.ok(!talk.includes("s.confirmLivePublishingChange("));
  }]
];
for(const [name,run] of checks){run();console.log("PASS",name)}
console.log("V3.90 voice flow checks passed:",checks.length);
