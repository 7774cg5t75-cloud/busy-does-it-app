import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// V3.87: preserve existing social/publishing routes, permissions and drafts while
// making creation and post management reachable without scrolling through diagnostics.
const read = p => readFileSync(p, "utf8");
const home = read("src/screens/home.js");
const social = read("src/screens/social.js");
const styles = read("src/theme/styles.js");
const runtime = read("src/core/runtime.js");
const pkg = JSON.parse(read("package.json"));
const app = JSON.parse(read("app.json")).expo;
const homeStart=home.indexOf("function HomeScreen({ s }) {");
const homeEnd=home.indexOf("\nfunction ProactiveWatch(",homeStart);
const socialStart=social.indexOf("function SocialMediaCentre({ s }) {");
const socialEnd=social.indexOf("\nfunction SocialCreator({ s })",socialStart);
assert.ok(homeStart>=0&&homeEnd>homeStart);
assert.ok(socialStart>=0&&socialEnd>socialStart);
const h=home.slice(homeStart,homeEnd), p=social.slice(socialStart,socialEnd);
const checks=[
  ["version and Apple bundle ID remain consistent",()=>{
    assert.ok(["3.87.0","3.88.0","3.89.0","3.90.0"].includes(pkg.version));
    assert.equal(app.version,pkg.version);
    assert.equal(app.ios.buildNumber,String(Number(pkg.version.split(".")[1])-80));
    assert.equal(app.ios.bundleIdentifier,"com.busydoesit.app");
    assert.ok(runtime.includes(`const APP_VERSION = "${pkg.version.slice(0,-2)}";`));
  }],
  ["Social Media is one tap from Home above the daily summary",()=>{
    const iVoice=h.indexOf('accessibilityLabel="Talk to BUSY"');
    const iQuick=h.indexOf('<Text style={homeDark.heading}>Quick access</Text>');
    const iSocial=h.indexOf("onPress={s.openSocialCentre}");
    const iDaily=h.indexOf("Your day at a glance");
    assert.ok(iVoice>0&&iQuick>iVoice&&iSocial>iQuick&&iSocial<iDaily);
    assert.ok(h.includes('>Social Media</Text>'));
    assert.ok(h.includes('s.jump("workHub", "Work")'));
    assert.ok(h.includes('["Find more work", () => s.go("workNow")]'));
  }],
  ["New post button appears before reports and connects to existing creation flow",()=>{
    assert.ok(p.includes('label="+ Create a new post" primary onPress={s.startSocialFromPhone}'));
    assert.ok(p.indexOf('label="+ Create a new post"')<p.indexOf('label="Manage accounts"'));
    assert.ok(p.indexOf('label="+ Create a new post"')<p.indexOf('showSocialDetails ? ('));
  }],
  ["Counts and post tabs come from saved social draft statuses",()=>{
    for(const s of ["workingDrafts.length","scheduledDrafts.length","publishedDrafts.length",
      'socialList === group.key','setSocialList(group.key)','showAllPosts ?','visibleSocialPosts.map(renderDraftCard)',
      's.openSocialDraft(draft.id)'])assert.ok(p.includes(s),s);
    assert.ok(p.includes('useState("Drafts")'));
    assert.ok(p.includes("slice(0, 3)"));
  }],
  ["Failed items and failed status refresh are not hidden",()=>{
    for(const s of ["attentionDrafts.length || cloudFailed || s.socialPublishingError",
      'title={attentionDrafts.length || cloudFailed','attentionDrafts.slice(0, 3).map(renderDraftCard)',
      's.refreshSocialPublishingStatus({ quiet: true })'])assert.ok(p.includes(s),s);
  }],
  ["Account status is read from real provider signals",()=>{
    assert.ok(p.includes('publish.connections?.meta'));
    assert.ok(p.includes('publish.connections?.google_business'));
    assert.ok(p.includes('s.go("connectedAccounts")'));
    assert.ok(p.includes('providerLabel(meta, "Facebook / Instagram")'));
    assert.ok(p.includes('providerLabel(google, "Google Business")'));
  }],
  ["Detailed scheduling and evidence remain behind one expandable control",()=>{
    assert.ok(p.includes("useState(false)"));
    assert.ok(p.includes('showSocialDetails ? ('));
    const expanded=p.indexOf("showSocialDetails ? (");
    for(const s of ["upcomingPosts.map(","jobs.map(","outcomeReminders.map(","s.postEvidence?.sample",
      "Manage publishing connections","How BUSY learns"])assert.ok(p.indexOf(s,expanded)>expanded,s);
    assert.ok(p.includes('Hide more social media tools'));
  }],
  ["Publishing permissions and review flow not bypassed",()=>{
    assert.ok(p.includes('livePublishingEnabled'));
    assert.ok(!p.includes('s.approveSocialDraft('));
    assert.ok(!p.includes('s.scheduleSocialDraft('));
    // Actions remain inside SocialDraftReview, not the landing screen.
    const review=social.slice(socialEnd);
    assert.ok(review.includes('onPress={s.approveSocialDraft}'));
    assert.ok(review.includes('onPress={s.scheduleSocialDraft}'));
    assert.ok(review.includes('onPress={s.confirmRetrySocialDraft}'));
  }],
  ["Mobile dark summary styles are defined",()=>{
    for(const st of ["socialSummaryRow","socialSummaryTile","socialSummaryNumber","socialSummaryLabel",
      "socialFilterRow","socialFilterButton","socialFilterSelected","socialEmptyState"])assert.ok(styles.includes(st+":"),st);
  }],
];
for(const[name,run] of checks){run();console.log("PASS",name)}
console.log("V3.87 social landing and Home shortcut checks passed:",checks.length);
