import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const source=readFileSync(new URL("../src/app/AppController.js",import.meta.url),"utf8");
const marker="  const inboxPendingItems = inboxItems\n";
const attention="  const inboxNeedsAttentionItems = inboxPendingItems.filter(";
const beforeAutopilot="  const autopilotRawApprovalItems = [";
const firstUse="inboxNeedsAttentionItems.slice(0, 8)";
const sortedBefore=source.indexOf(marker);
const sortedAfter=source.indexOf(attention);
const initAutopilot=source.indexOf(beforeAutopilot);
const firstCrash=source.indexOf(firstUse);
assert.ok(sortedBefore>=0&&sortedAfter>sortedBefore);
assert.ok(initAutopilot>sortedAfter,"Inbox must be initialised before Autopilot begins");
assert.ok(firstCrash>initAutopilot,"Autopilot must only slice an initialised array");
for(const derived of [
  "const reactivationEligibleCustomers =",
  "const recommendedReactivationBatchSize =",
  "const workGoalFilled =",
]){
  const position=source.indexOf(derived);
  assert.ok(position>0&&position<initAutopilot,
    "Active work goals must be derived before Autopilot uses "+derived);
}
const rawAutopilot=source.indexOf("  const autopilotRawApprovalItems = [");
const reactivationUse=source.indexOf("reactivationEligibleCustomers.length",rawAutopilot);
assert.ok(reactivationUse>initAutopilot,
  "Active work goal must not use reactivation eligibility before initialization");

assert.equal(source.split(marker).length,2,"Exactly one inbox pending derivation");
assert.equal(source.split(attention).length,2,"Exactly one inbox attention derivation");

// Exercise the exact inbox derivation from the real controller in isolation,
// rather than a hand-copied reimplementation. This is the path that crashed.
const block=source.slice(sortedBefore,source.indexOf("\n\n",sortedAfter));
const wrapped="(function(inputs){\n"+
  "const {inboxItems,parseQuickCapture,services,trade,triageInboxCandidate,"+
  "customers,replyActions,evaluateSafeAutoFile}=inputs;\n"+
  block+
  "\nreturn {inboxPendingItems,inboxNeedsAttentionItems};\n})";
const factory=new vm.Script(wrapped,{filename:"first-render-inbox-derivation.js"});
const derive=factory.runInNewContext();
const base={
  inboxItems:[],services:[],trade:"Service",customers:[],replyActions:{},
  parseQuickCapture:text=>({raw:text}),
  triageInboxCandidate:()=>({lane:"Needs attention",priorityScore:100,reason:"Review"}),
  evaluateSafeAutoFile:()=>({safe:false,reason:"Owner review required"}),
};
const empty=derive(base);
assert.equal(empty.inboxPendingItems.length,0);
assert.equal(empty.inboxNeedsAttentionItems.length,0);
assert.equal(empty.inboxNeedsAttentionItems.slice(0,8).length,0);

const one=derive({...base,inboxItems:[{id:"one",status:"Pending",rawText:"Incoming customer"}]});
assert.equal(one.inboxPendingItems.length,1);
assert.equal(one.inboxNeedsAttentionItems.length,1);
assert.equal(one.inboxNeedsAttentionItems[0].id,"one");
assert.equal(one.inboxNeedsAttentionItems.slice(0,8)[0].id,"one");

const other=derive({...base,inboxItems:[
 {id:"filed",status:"Filed",rawText:"Ignore"},
 {id:"ready",status:"Pending",parsed:{name:"Ready"},rawText:""},
],triageInboxCandidate:()=>({lane:"Ready to review",priorityScore:40})});
assert.equal(other.inboxPendingItems.length,1);
assert.equal(other.inboxNeedsAttentionItems.length,0);

console.log("PASS first-render inbox/Autopilot initialization order and exact empty/filled queue execution");
