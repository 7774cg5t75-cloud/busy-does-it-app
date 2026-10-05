import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  StatusBar,
  Switch,
  Image,
  Alert,
  Share,
  Linking,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";

import * as Core from "../core/runtime";
const {
  APP_VERSION,
  PROTOTYPE_BADGE,
  BUSY_AI_URL,
  BUSY_AI_TOKEN,
  BUSY_SOCIAL_URL,
  BUSY_SOCIAL_PUBLISH_URL,
  BUSY_SUPABASE_URL,
  OWNER_SESSION_KEY,
  DEFAULT_OWNER_EMAIL,
  CLOUD_SCHEMA_VERSION,
  busyRequestId,
  fetchWithTimeout,
  busyDataRequest,
  busyAuthRequest,
  ownerSessionFromPayload,
  C,
  VERTICAL_PACKS,
  getVerticalPack,
  servicesSeed,
  planningDurationHours,
  formatDurationHours,
  slotPlanningHours,
  rateEvidence,
  formatPercent,
  chooseRateEvidence,
  busyPhotoToDataUrl,
  socialStoryLabel,
  customerSeed,
  monthsSince,
  repeatMonthsForCustomer,
  isEligibleCustomer,
  nextRepeatDueDate,
  eligibilityRuleText,
  formatMonthsAgo,
  dateFromISO,
  dateToISO,
  formatUKDate,
  daysSinceTimestamp,
  businessBrainFreshness,
  businessBrainRuleScope,
  businessBrainOpportunityFamily,
  businessBrainFamilyLabel,
  businessBrainFeedbackPenalty,
  businessBrainFeedbackEffect,
  manualRuleTargetFamilies,
  enquiryAgeLabel,
  addDaysISO,
  addDaysFromISO,
  nextDateForSlot,
  timeOptionsForSlot,
  defaultTimeForSlot,
  slotWeekdayIndex,
  dateMatchesSlotWeekday,
  timeMatchesSlotPart,
  suggestSpareSlots,
  buildMultiSlotCapacityPlan,
  bookingMatchesWorkGoal,
  normalizePhone,
  normalizeEmail,
  findCustomerMatch,
  extractISODateFromText,
  extractTimeFromText,
  inferCaptureStage,
  inferCaptureService,
  inferCaptureName,
  inferCaptureAddress,
  captureStageStrength,
  customerActionStrength,
  currentJourneyStage,
  assessJourneyReconciliation,
  MAX_CAPTURE_SCREENSHOTS,
  screenshotFileSequence,
  inferCaptureScreenshotOrder,
  normaliseConfidence,
  fieldConfidenceFromParsed,
  criticalIntakeFieldsSafe,
  localIntakeBrainAnalysis,
  normaliseLiveIntakeAnalysis,
  parseQuickCapture,
  triageInboxCandidate,
  captureFingerprint,
  evaluateSafeAutoFile,
  inboxStageTone,
  groupCustomersByService,
  buildSimulatedReply,
  replyActionForStatus,
  customerActionStatus,
  isActiveCustomerAction,
  customerPipelineLabel,
  previousCustomerGroups,
  LEGACY_STORAGE_KEY,
  USER_CACHE_PREFIX,
  storageKeyForUser,
  connectionSeed,
  intakeConnectionKeys,
  connectionRows,
  campaignSteps
} = Core;

import { styles } from "../theme/styles";
import {
  BusyAppMark,
  BusyAssistantMark,
  BusyBrandLockup,
  Shell,
  BottomNav,
  Card,
  Button,
  SmallLink,
  Field,
  DatePickerField,
  Choice,
  ToggleRow,
  MetricRow,
  StatusChip,
  InlineExplanation,
  OpportunityCard,
  ProgressStrip
} from "../components/ui";


function BusinessData({ s }) {
  const reviewReadyCount = s.customers.reduce(
    (total, customer) =>
      total +
      (customer.contactOk === false
        ? 0
        : (Array.isArray(customer.history) ? customer.history : []).filter(
            (job) => job.kind === "job" && !job.reviewRequestSentAt
          ).length),
    0
  );

  return (
    <Shell
      s={s}
      title="Business data"
      subtitle="General business facts stay editable. Opportunity counts now come from individual records wherever BUSY DOES IT has the data."
    >
      <Card
        eyebrow="Calculated from records"
        title="Opportunity counts are no longer typed in"
        body="BUSY DOES IT uses saved customer dates, quote statuses, job history, service timing and permissions to decide what is actually available."
        tone="green"
      >
        <MetricRow left="Saved customer records" right={String(s.customers.length)} />
        <MetricRow left="Quiet enquiries (7+ days)" right={String(s.staleEnquiryEntries.length)} strong={s.staleEnquiryEntries.length > 0} />
        <MetricRow left="Quote follow-ups due (7+ days)" right={String(s.dueQuoteEntries.length)} strong={s.dueQuoteEntries.length > 0} />
        <MetricRow left="Previous customers due" right={String(s.eligibleCustomers.length)} strong={s.eligibleCustomers.length > 0} />
        <MetricRow left="Completed jobs eligible for review request" right={String(reviewReadyCount)} />
      </Card>

      <Field label="Business name" value={s.businessName} onChangeText={s.setBusinessName} />
      <Field label="Trade or service" value={s.trade} onChangeText={s.setTrade} />
      <Field label="Postcode / base area" value={s.postcode} onChangeText={s.setPostcode} />
      <Field label="Service radius" value={s.radius} onChangeText={s.setRadius} keyboardType="number-pad" prefix="Miles" />
      <Field label="Next quiet slot" value={s.quietSlot} onChangeText={s.setQuietSlot} placeholder="e.g. Thursday afternoon" />
      <Button label="Manage customer records" onPress={() => s.go("customerRecords")} />

      <Card
        eyebrow="Prototype-only profile inputs"
        title="Two profile checks still need manual test data"
        body="Until a real Google Business / social connection exists, unanswered-review and recent-photo counts stay clearly labelled as manual test inputs and do not masquerade as live account data."
        tone="blue"
      />
      <Field label="Test: unanswered reviews" value={s.unansweredReviewCount} onChangeText={s.setUnansweredReviewCount} keyboardType="number-pad" />
      <Field label="Test: recent photos wanted" value={s.recentPhotoCountNeeded} onChangeText={s.setRecentPhotoCountNeeded} keyboardType="number-pad" />
      <Button label="Save & refresh Home" primary onPress={() => s.jump("home", "Home")} />
      <Button label="Cancel" onPress={s.back} />
    </Shell>
  );
}
function Settings({ s }) {
  const connectedCount = Object.values(s.connectedAccounts).filter(Boolean).length;
  return (
    <Shell s={s} noBack title="Your controls" subtitle="Set the rules once. BUSY works inside them.">
      <View style={styles.brandShowcase}>
        <BusyBrandLockup size={48} />
        <Text style={styles.brandShowcaseTitle}>Your BUSY DOES IT identity</Text>
        <Text style={styles.brandShowcaseBody}>
          BUSY is the in-app assistant voice. The stacked-card mark is the main brand identity; the B/check mark is the compact app symbol.
        </Text>
        <View style={styles.brandCompactRow}>
          <BusyAppMark size={46} />
          <View style={{ flex: 1 }}>
            <Text style={styles.brandCompactTitle}>Compact app mark</Text>
            <Text style={styles.brandCompactBody}>Used where the full logo would be too heavy — small assistant cues, app-icon contexts and future notifications.</Text>
          </View>
        </View>
      </View>
      <Card
        eyebrow="Spending"
        title={s.alwaysAsk ? "Always ask before spending" : `Automatic paid tests up to £${s.testLimit}`}
        body={
          s.alwaysAsk
            ? "Every paid test still needs your approval."
            : `BUSY DOES IT may run a paid test up to £${s.testLimit} without asking again, but total paid spend must stay within £${s.weeklyLimit} per week.`
        }
        footer="You can change this any time"
        tone={s.alwaysAsk ? "green" : "amber"}
      >
        <MetricRow left="Single test limit" right={`£${s.testLimit}`} />
        <MetricRow left="Weekly limit" right={`£${s.weeklyLimit}`} />
        <MetricRow left="Previous customers" right={s.customerContact ? "Allowed" : "Off"} />
        <MetricRow
          left="Automatic record filing"
          right={s.recordFilingMode === "safe" ? "Safe items only" : "Review everything"}
          strong={s.recordFilingMode === "safe"}
        />
        <MetricRow left="Connected accounts" right={`${connectedCount}/${connectionRows.length}`} />
      </Card>
      <Card
        eyebrow="V3.11 • Secure cloud data"
        title={
          s.ownerSession?.accessToken
            ? s.cloudInitialised
              ? "This business is backed up to its own cloud workspace"
              : "Signed in — cloud workspace is being prepared"
            : "Sign in to protect and restore business data"
        }
        body={
          s.ownerSession?.accessToken
            ? "Customers, work records, services, goals and BUSY learning are mirrored to a protected Supabase workspace. V3.13 now puts Facebook, Instagram, Google connection records and publishing history behind that same business boundary too."
            : "The app can still run locally, but signed-in accounts get a separate protected business workspace that can be restored on another device."
        }
        footer={
          s.cloudSyncError
            ? s.cloudSyncError
            : s.cloudLastSyncedAt
            ? `Last cloud sync: ${new Date(s.cloudLastSyncedAt).toLocaleString("en-GB")}`
            : "No cloud backup yet"
        }
        tone={s.cloudSyncError ? "amber" : s.cloudInitialised ? "green" : "blue"}
      >
        <MetricRow left="Account" right={s.ownerSession?.email || "Signed out"} />
        <MetricRow left="Business workspace" right={s.cloudWorkspace?.name || "Not connected"} />
        <MetricRow left="Cloud status" right={s.cloudSyncStatus} strong={s.cloudInitialised && !s.cloudSyncError} />
        {s.cloudInitialised ? <MetricRow left="Cloud revision" right={String(s.cloudRevision || 1)} /> : null}
        <Button
          label={s.cloudInitialising ? "Connecting…" : s.cloudSyncStatus === "Syncing…" ? "Syncing…" : "Sync now"}
          disabled={s.cloudInitialising || !s.ownerSession?.accessToken}
          onPress={s.syncCloudNow}
        />
        {!s.ownerSession?.accessToken ? (
          <Button label="Open account & connections" onPress={() => s.go("connectedAccounts")} />
        ) : null}
      </Card>
      <Button label="Account, privacy & recovery" primary onPress={() => s.go("accountData")} />
      <Button label="Customer records" onPress={() => s.go("customerRecords")} />
      <Button
        label={s.inboxPendingItems.length ? `BUSY Inbox • ${s.inboxPendingItems.length} waiting` : "BUSY Inbox"}
        onPress={s.openBusyInbox}
      />
      <Button label="Customer pipeline" onPress={() => s.go("workPipeline")} />
      <Button label="Business type & services" onPress={() => s.go("businessType")} />
      {s.completedBookingCount ? <Button label="Bookings" onPress={() => s.go("bookings")} /> : null}
      {Object.keys(s.replyActions || {}).length ? (
        <Button label="Customer activity" onPress={() => s.go("customerActivity")} />
      ) : null}
      <Button label="Business profile & opportunity data" onPress={() => s.go("businessData")} />
      <Button label="Social Control Centre" onPress={s.openSocialCentre} />
      <Button label="Proactive BUSY + diary" primary onPress={() => s.go("proactiveBusyCentre")} />
      <Button label="Controlled Autopilot" primary onPress={() => s.go("autopilotCentre")} />
      <Button label="Business Brain" onPress={() => s.go("businessBrain")} />
      <Button label="Change limits" onPress={() => s.go("settingsLimits")} />
      <Button label="Automatic record filing" onPress={() => s.go("recordFilingSettings")} />
      <Button label="Connected accounts" onPress={() => s.go("connectedAccounts")} />
      <Button label="How BUSY DOES IT works" onPress={() => s.go("howBusyWorks")} />
      <Button label="What makes it different" onPress={() => s.go("whatMakesDifferent")} />
      <Button label="Advanced details" onPress={() => s.go("advanced")} />
    </Shell>
  );
}

function AccountAccess({ s }) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { flexGrow: 1, justifyContent: "center" }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ alignItems: "center", marginBottom: 26 }}>
        <BusyBrandLockup size={58} centered />
        <Text style={[styles.loadingTagline, { marginTop: 12 }]}>More work. Less fuss.</Text>
      </View>

      <Card
        eyebrow="V3.12 • Your BUSY account"
        title="Your business data now belongs to an account"
        body="Sign in to restore this business securely. A new business can create its own account and workspace here."
        footer="Separate account • separate cloud workspace • separate device cache"
        tone="green"
      />

      <Field
        label="Email"
        value={s.ownerEmail}
        onChangeText={s.setOwnerEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="you@yourbusiness.co.uk"
      />
      <Field
        label="Password"
        value={s.ownerPassword}
        onChangeText={s.setOwnerPassword}
        secureTextEntry
        autoCapitalize="none"
        placeholder="Your BUSY password"
      />
      <Button
        label={s.ownerAuthLoading ? "Signing in…" : "Sign in"}
        primary
        disabled={s.ownerAuthLoading}
        onPress={s.signInOwner}
      />
      <Button
        label={s.ownerAuthLoading ? "Please wait…" : "Create a new BUSY account"}
        disabled={s.ownerAuthLoading}
        onPress={s.createOwnerAccount}
      />
      <Button
        label="Forgot password? Send recovery email"
        disabled={s.ownerAuthLoading}
        onPress={s.sendPasswordReset}
      />
      {s.ownerAuthError ? <Text style={styles.customerHistoryPhotoMeta}>{s.ownerAuthError}</Text> : null}
      {s.ownerAuthNotice ? <Text style={styles.cardFooter}>{s.ownerAuthNotice}</Text> : null}

      <Card
        eyebrow="Privacy"
        title="One account cannot browse another business"
        body="The cloud database uses authenticated membership rules. V3.15 adds safer session recovery, server rate limits and network-failure handling on top of the existing per-business data boundary."
        tone="blue"
      />
    </ScrollView>
  );
}

function AccountData({ s }) {
  return (
    <Shell
      s={s}
      title="Account, privacy & recovery"
      subtitle="See where BUSY stores your business data, make a copy and recover safely if another device changes the cloud version."
      brandCue="Your data should be portable, separated and recoverable."
    >
      <Card
        eyebrow="Account"
        title={s.ownerSession?.email || "Signed out"}
        body={
          s.cloudWorkspace?.name
            ? `Connected to ${s.cloudWorkspace.name} as ${s.cloudWorkspace.role || "member"}.`
            : "No cloud business workspace is currently connected."
        }
        footer={s.cloudLastSyncedAt ? `Last sync: ${new Date(s.cloudLastSyncedAt).toLocaleString("en-GB")}` : "No cloud sync recorded"}
        tone={s.cloudInitialised ? "green" : "blue"}
      >
        <MetricRow left="Cloud status" right={s.cloudSyncStatus} strong={s.cloudInitialised && !s.cloudSyncError} />
        <MetricRow left="Cloud revision" right={String(s.cloudRevision || 0)} />
        <MetricRow left="Local cache" right={s.ownerSession?.userId ? "Private to this account" : "Unavailable"} />
      </Card>

      {s.cloudConflict ? (
        <Card
          eyebrow="Recovery protection"
          title="BUSY found a newer cloud copy"
          body="This device was stopped from overwriting newer business data. Export this device copy if you need it, then restore the newest cloud version."
          footer={
            s.cloudConflict.remoteUpdatedAt
              ? `Cloud revision ${s.cloudConflict.remoteRevision || "?"} • ${new Date(s.cloudConflict.remoteUpdatedAt).toLocaleString("en-GB")}`
              : "Cloud copy changed elsewhere"
          }
          tone="amber"
        />
      ) : null}

      <Text style={styles.sectionLabel}>Recovery</Text>
      <Button
        label={s.cloudInitialising ? "Restoring…" : "Restore latest cloud copy"}
        primary={!!s.cloudConflict}
        disabled={s.cloudInitialising || !s.ownerSession?.accessToken}
        onPress={s.confirmRestoreLatestCloudCopy}
      />
      <Button
        label={s.cloudSyncStatus === "Syncing…" ? "Syncing…" : "Sync this device now"}
        disabled={s.cloudInitialising || !s.ownerSession?.accessToken || !!s.cloudConflict}
        onPress={s.syncCloudNow}
      />

      <Text style={styles.sectionLabel}>Your data</Text>
      <Button label="Export a copy of my BUSY data" onPress={s.exportBusinessData} />
      <Card
        eyebrow="What is stored"
        title="Core business data is cloud-backed; provider secrets stay server-side"
        body="The account snapshot contains the business records BUSY needs to restore the app. Facebook, Instagram and Google connection records now belong to the same business tenant, while provider tokens remain server-side and are never included in the export or local cache."
        footer="Selected phone photos still follow the app's existing explicit-permission rules"
        tone="blue"
      />

      <Text style={styles.sectionLabel}>Production safety</Text>
      <Card
        eyebrow="V3.15 • Reliability"
        title="BUSY now fails safely instead of guessing"
        body="Server requests time out with a clear retry message, temporary network failures no longer erase a valid saved session, stale cloud devices are blocked from overwriting newer data, and live publishing actions are never automatically repeated after an uncertain network result."
        footer="Sensitive publishing and account actions are also rate-limited on the server"
        tone="green"
      >
        <MetricRow left="Cloud overwrite guard" right="Active" strong />
        <MetricRow left="Private social-media bucket" right="Active" strong />
        <MetricRow left="Provider tokens on phone" right="Never stored" strong />
        <MetricRow left="Sensitive-action rate limits" right="Active" strong />
      </Card>

      <Text style={styles.sectionLabel}>Account safety</Text>
      <Button label="Sign out on this device" onPress={s.signOutOwner} />
      <Card
        eyebrow="Permanent account removal"
        title="Remove this BUSY account and its business data"
        body="This is different from signing out. It removes the BUSY account, business workspace, core records, learning data, connected-provider credentials, publishing history and BUSY-stored social media."
        footer="Export first if you may need a copy later"
        tone="amber"
      >
        <Button label="Review account removal" danger onPress={() => s.go("accountRemoval")} />
      </Card>
      <Button label="Done" onPress={s.back} />
    </Shell>
  );
}

function AccountRemoval({ s }) {
  const signedInEmail = normalizeEmail(s.ownerSession?.email || s.ownerEmail || "");
  const ready =
    s.accountClosurePhrase.trim() === "DELETE" &&
    normalizeEmail(s.accountClosureEmail) === signedInEmail;

  return (
    <Shell
      s={s}
      title="Remove BUSY account"
      subtitle="This is permanent. BUSY requires both the command and the signed-in email before the final confirmation appears."
      brandCue="Export first. Remove only when you are certain."
    >
      <Card
        eyebrow="Keep a copy"
        title="Export your BUSY data first"
        body="The export contains the current business snapshot and workspace metadata. Provider credentials and access tokens are never included."
        tone="blue"
      >
        <Button label="Export my BUSY data" primary onPress={s.exportBusinessData} />
      </Card>

      <Card
        eyebrow="What BUSY removes"
        title="The account and its BUSY business workspace"
        body="Customer and job records, enquiries, quotes, bookings, services, goals, BUSY Inbox, Business Brain learning, social drafts/history, connected-provider credentials and BUSY-stored social images are removed."
        footer="Posts already published on Facebook or Instagram are not removed from those platforms"
        tone="amber"
      />

      <Text style={styles.sectionLabel}>Permanent confirmation</Text>
      <Field
        label="Type DELETE"
        value={s.accountClosurePhrase}
        onChangeText={s.setAccountClosurePhrase}
        autoCapitalize="characters"
        placeholder="DELETE"
      />
      <Field
        label="Type the signed-in email"
        value={s.accountClosureEmail}
        onChangeText={s.setAccountClosureEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder={signedInEmail}
      />
      <Text style={styles.helper}>Signed in as {signedInEmail}</Text>

      {s.accountClosureError ? (
        <Card
          eyebrow="Account removal blocked"
          title="Nothing has been removed"
          body={s.accountClosureError}
          tone="amber"
        />
      ) : null}

      <Button
        label={s.accountClosureBusy ? "Removing account…" : "Remove my BUSY account permanently"}
        danger
        disabled={!ready || s.accountClosureBusy}
        onPress={s.confirmAccountClosure}
      />
      <Button label="Cancel" disabled={s.accountClosureBusy} onPress={s.back} />
    </Shell>
  );
}

function HowBusyWorks({ s }) {
  return (
    <Shell s={s} title="How BUSY DOES IT works" subtitle="Simple on the surface. Serious business logic underneath.">
      <Card eyebrow="1" title="Incoming information gets sorted first" body="Messages, notes and future connected-app events should land in BUSY Inbox. BUSY extracts what it can, checks for duplicates and flags anything uncertain before it changes the records." />
      <Card eyebrow="2" title="Obvious record admin can disappear" body="With Safe Autopilot enabled, only strict high-confidence updates to an exact existing customer can be filed without another tap. Anything uncertain stays in BUSY Inbox." />
      <Card eyebrow="3" title="BUSY ranks the best next move" body="Live customer commitments, £0 opportunities and prepared actions compete underneath Home so the owner normally sees one clear priority." />
      <Card eyebrow="4" title="You control important actions" body="Customer messages, public posts and paid spend still require the appropriate approval. BUSY prepares underneath without pretending approval happened." />
      <Card eyebrow="5" title="Outcomes improve later recommendations" body="Results focus on enquiries, quotes, bookings, completed work and recorded value. Outcomes feed gently back into future ranking rather than rewarding vanity activity." />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function WhatMakesDifferent({ s }) {
  return (
    <Shell s={s} title="What makes BUSY DOES IT different" subtitle="Concrete design choices — not hype.">
      <Card eyebrow="Triage first" title="Incoming information becomes organised work" body="BUSY Inbox is designed to receive candidate information from messages, notes and future connections, match it to the right customer and only interrupt the owner when review is useful." />
      <Card eyebrow="Goal first" title="You tell us the problem, not the channel" body="The app chooses or recommends the marketing method underneath instead of forcing you to decide between ads, email, social or audiences." />
      <Card eyebrow="Cost first" title="Free and low-cost opportunities come before paid reach" body="The app can recommend spending nothing when that is the more sensible first move." />
      <Card eyebrow="Control" title="Automation is split by risk" body="Low-risk record filing can use a strict Safe Autopilot rule. Customer messages, public posting and paid spend keep their own stronger controls." />
      <Card eyebrow="Proof layer" title="Every important recommendation should be justifiable" body="Average users see a simple answer. Experts can inspect the data, assumptions, alternatives, confidence and technical performance behind it." />
      <Card eyebrow="Outcome" title="Jobs and pounds before marketing jargon" body="The default result is what happened to the business, not a dashboard full of clicks and acronyms." />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function BusinessTypeSettings({ s }) {
  const packs = Object.values(VERTICAL_PACKS);
  return (
    <Shell
      s={s}
      title="Business type & services"
      subtitle="The business type changes the suggested services and repeat-timing rules underneath. It does not change the core app."
      brandCue="One BUSY DOES IT. Different service-business rules where they genuinely matter."
    >
      <Card
        eyebrow="Current setup"
        title={s.verticalPack.label}
        body={s.verticalPack.description}
        footer={s.eligibilityRule}
        tone="green"
      />

      <Text style={styles.sectionLabel}>Business type</Text>
      {packs.map((pack) => (
        <Choice
          key={pack.id}
          label={pack.label}
          sub={pack.description}
          selected={s.verticalId === pack.id}
          onPress={() => s.applyVerticalPack(pack.id)}
        />
      ))}

      <Card
        eyebrow="Important"
        title="Existing customer records stay yours"
        body="Changing business type replaces the suggested service list and timing rules, but it does not delete customer records or job history. You can still add any service manually."
        tone="blue"
      />
      <Button label="+ Add a service" onPress={() => s.go("addService")} />
      <Button label="Typical job lengths & capacity" onPress={() => s.go("capacitySettings")} />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function CapacitySettings({ s }) {
  return (
    <Shell
      s={s}
      title="Typical job lengths"
      subtitle="BUSY uses these only to estimate capacity. Change them whenever the real business says otherwise."
      brandCue="Editable planning assumptions. No false precision."
    >
      <Card
        eyebrow="How this is used"
        title="Can the requested work actually fit?"
        body="For a selected morning or afternoon, BUSY compares the saved typical job length with a simple four-hour planning window. Travel, job complexity and customer circumstances can still change the real duration."
        tone="blue"
      />
      {s.services.map((service) => (
        <Card
          key={service.id}
          eyebrow={service.wanted ? "Priority service" : "Service"}
          title={service.name}
          body={`Current planning length: about ${formatDurationHours(service.durationHours)} per job.`}
          footer="Adjust in 30-minute steps"
          tone={service.id === s.selectedServiceId ? "green" : "blue"}
        >
          <Button
            label="30 minutes shorter"
            disabled={planningDurationHours(service) <= 0.5}
            onPress={() => s.adjustServiceDuration(service.id, -0.5)}
          />
          <Button
            label="30 minutes longer"
            disabled={planningDurationHours(service) >= 8}
            onPress={() => s.adjustServiceDuration(service.id, 0.5)}
          />
        </Card>
      ))}
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function SettingsLimits({ s }) {
  return (
    <Shell s={s} title="Change limits" subtitle="These rules apply to future paid actions.">
      <ToggleRow
        title="Always ask before spending"
        body={s.alwaysAsk ? "Every paid test needs approval." : `Off: tests up to £${s.testLimit} may run automatically, within the weekly limit.`}
        value={s.alwaysAsk}
        onValueChange={s.setAlwaysAsk}
      />
      <ToggleRow title="Contact previous customers" body="Allow eligible previous customers to be suggested before paid advertising." value={s.customerContact} onValueChange={s.setCustomerContact} />
      <Field label="Maximum single test" value={s.testLimit} onChangeText={s.setTestLimit} keyboardType="number-pad" prefix="£" />
      <Field label="Weekly paid-spend limit" value={s.weeklyLimit} onChangeText={s.setWeeklyLimit} keyboardType="number-pad" prefix="£" />
      {!s.alwaysAsk ? <Text style={styles.warningText}>Automatic mode is explicit: no single test may exceed £{s.testLimit}, and total paid spend may not exceed £{s.weeklyLimit} per week.</Text> : null}
      <Button label="Save" primary onPress={s.back} />
    </Shell>
  );
}

function RecordFilingSettings({ s }) {
  return (
    <Shell
      s={s}
      title="Automatic record filing"
      subtitle="Choose how much routine Inbox filing BUSY may do without interrupting you."
      brandCue="Automation gets permission by rule — never by assumption."
    >
      <Choice
        label="Review everything"
        sub="BUSY triages and prepares incoming information, but every customer/work record change waits for you."
        selected={s.recordFilingMode === "review"}
        onPress={() => s.setRecordFilingMode("review")}
      />
      <Choice
        label="Safe items only"
        sub="Recommended prototype setting. BUSY may file only into an existing customer when every strict trust rule passes."
        selected={s.recordFilingMode === "safe"}
        onPress={() => s.setRecordFilingMode("safe")}
      />

      <Card
        eyebrow="Safe means all of these"
        title="A deliberately narrow permission"
        body="Safe Autopilot is not general AI permission. It is a checklist. If any check fails, the item stays in BUSY Inbox for you."
        tone="green"
      >
        <MetricRow left="Customer match" right="Exact phone / email" />
        <MetricRow left="Extraction" right="High confidence" />
        <MetricRow left="Service" right="Explicitly detected" />
        <MetricRow left="Lifecycle progression" right="Forward only" />
        <MetricRow left="Duplicate source" right="None" />
        <MetricRow left="Quote" right="Explicit date + value" />
        <MetricRow left="Booking" right="Explicit future date + time" />
        <MetricRow left="Completed job" right="Explicit non-future date" />
      </Card>

      <Card
        eyebrow="Still never automatic here"
        title="Record filing is not customer-facing authority"
        body="Safe Autopilot does not send a customer message, publish a post, approve advertising spend or invent missing information."
        footer="Those controls remain separate"
        tone="blue"
      />

      <Card
        eyebrow="Still deliberately restricted"
        title="Connected sources do not get extra authority"
        body="Even in V3, creating brand-new customers automatically, trusting name-only matches or filing through conflicts stays outside Safe Autopilot until we have stronger evidence and recovery controls."
        tone="amber"
      />

      <Button label="Save & open BUSY Inbox" primary onPress={s.openBusyInbox} />
      <Button label="Done" onPress={s.back} />
    </Shell>
  );
}

function ConnectedAccounts({ s }) {
  useEffect(() => {
    if (s.ownerSession?.accessToken) {
      s.refreshSocialPublishingStatus({ quiet: true });
    }
  }, [s.ownerSession?.accessToken]);

  const intakeRows = connectionRows.filter(([key]) => intakeConnectionKeys.includes(key));
  const prototypeActionRows = connectionRows.filter(
    ([key]) => !intakeConnectionKeys.includes(key) && !["meta", "googleBusiness"].includes(key)
  );
  const publish = s.socialPublishingStatus || {};
  const credentials = publish.credentials || {};
  const meta = publish.connections?.meta || { status: "not_connected", assets: [] };
  const google = publish.connections?.google_business || { status: "not_connected", assets: [] };
  const busy = !!s.socialPublishingLoading;
  const hasLiveProvider =
    meta.status === "connected" || google.status === "connected";

  const renderPrototypeConnection = ([key, label, body]) => {
    const connected = !!s.connectedAccounts[key];
    return (
      <View key={key} style={styles.connectRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.connectTitle}>{label}</Text>
          <Text style={styles.connectBody}>{body}</Text>
          <Text style={styles.customerHistoryPhotoMeta}>
            {connected ? "Prototype source selected" : "Not selected"}
          </Text>
        </View>
        <Pressable
          onPress={() => s.toggleConnection(key)}
          style={[styles.connectButton, connected && styles.connectButtonOn]}
        >
          <Text style={[styles.connectButtonText, connected && { color: C.green }]}>
            {connected ? "Disconnect" : "Connect"}
          </Text>
        </Pressable>
      </View>
    );
  };

  const renderProvider = ({
    provider,
    label,
    connection,
    configured,
  }) => {
    const connected = connection.status === "connected";
    const needsSelection = connection.status === "needs_selection";
    const needsAttention = connection.status === "needs_attention";
    const checking = connection.status === "checking";
    const providerBusy = busy && s.socialPublishingAction === provider;
    const ownerSignedIn = !!s.ownerSession?.accessToken;
    const accountLabel =
      connection.pageName ||
      connection.googleLocationTitle ||
      connection.providerAccountName ||
      "";

    return (
      <Card
        key={provider}
        eyebrow={label}
        title={
          connected
            ? accountLabel || "Connected"
            : checking
            ? "Checking provider access"
            : needsSelection
            ? "Choose which business account BUSY should use"
            : needsAttention
            ? provider === "google_business"
              ? "Google authorization saved — publishing access needs attention"
              : "Connection needs attention"
            : configured
            ? "Ready to connect"
            : "Developer credentials still needed"
        }
        body={
          connected
            ? provider === "google_business"
              ? "BUSY has verified this selected Business Profile location against Google's Local Posts API. Owner approval is still required for every public post."
              : "BUSY has provider authorization for approved publishing actions. Creating content still does not grant permission to publish it."
            : checking
            ? "BUSY is checking whether the selected provider can actually be used for publishing."
            : needsAttention && provider === "google_business"
            ? "Google OAuth may already be saved. BUSY keeps that authorization so you can fix API approval or enablement and re-check without starting over."
            : configured
            ? "The server has the provider app credentials. Start OAuth here, complete the provider consent screen, then return to BUSY and refresh."
            : provider === "meta"
            ? "The V3.8 Meta OAuth and publishing code is deployed, but META_APP_ID and META_APP_SECRET have not been added to Supabase yet."
            : "The V3.8 Google OAuth and publishing code is deployed, but GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET have not been added to Supabase yet."
        }
        footer={
          connected
            ? "Connection is server-side • provider tokens are not stored in the phone app"
            : "Nothing public can be posted from this connection yet"
        }
        tone={connected ? "green" : needsAttention ? "amber" : "blue"}
      >
        <MetricRow left="Provider status" right={connection.status || "not_connected"} strong={connected} />
        <MetricRow left="Developer credentials" right={configured ? "Configured" : "Not configured"} />
        {provider === "meta" && connected ? (
          <>
            <MetricRow left="Facebook Page" right={connection.pageName || "Connected"} />
            <MetricRow
              left="Instagram"
              right={connection.instagramUsername ? `@${connection.instagramUsername}` : "No professional account on selected Page"}
            />
          </>
        ) : null}
        {provider === "google_business" && (connected || needsAttention || checking) ? (
          <>
            <MetricRow
              left="Google location"
              right={connection.googleLocationTitle || (needsSelection ? "Choose a location" : "Not verified yet")}
            />
            <MetricRow
              left="Local Posts API"
              right={connection.publishingVerified ? "Verified" : checking ? "Checking…" : "Not verified"}
              strong={!!connection.publishingVerified}
            />
          </>
        ) : null}
        {connection.lastError ? (
          <Text style={styles.customerHistoryPhotoMeta}>{connection.lastError}</Text>
        ) : null}

        {needsSelection && (connection.assets || []).length ? (
          <>
            <Text style={styles.sectionLabel}>Choose account</Text>
            {(connection.assets || []).map((asset) => (
              <Button
                key={asset.id}
                label={
                  provider === "meta"
                    ? `${asset.name || "Facebook Page"}${asset.instagramUsername ? ` • @${asset.instagramUsername}` : ""}`
                    : asset.name || "Google Business location"
                }
                disabled={busy}
                onPress={() => s.selectSocialProviderAsset(provider, asset.id)}
              />
            ))}
          </>
        ) : null}

        {provider === "google_business" &&
        configured &&
        !needsSelection &&
        (connected || needsAttention || checking) ? (
          <Button
            label={
              providerBusy
                ? "Checking Google…"
                : connected
                ? "Re-check Google publishing access"
                : "Re-check Google access"
            }
            primary={!connected}
            disabled={busy || !ownerSignedIn}
            onPress={() => s.verifySocialProvider("google_business")}
          />
        ) : null}

        {connected ? (
          <Button
            label={providerBusy ? "Disconnecting…" : "Disconnect provider"}
            disabled={busy || !ownerSignedIn}
            onPress={() => s.disconnectSocialProvider(provider)}
          />
        ) : configured && !needsSelection && !checking ? (
          <Button
            label={providerBusy ? "Opening provider…" : `Connect ${label}`}
            primary
            disabled={busy || !ownerSignedIn}
            onPress={() => s.beginSocialProviderConnect(provider)}
          />
        ) : null}
      </Card>
    );
  };

  return (
    <Shell
      s={s}
      title="Connected accounts"
      subtitle="V3.13 makes every Facebook, Instagram and future Google publishing record belong to the signed-in business rather than one shared prototype workspace."
      brandCue="BUSY can prepare automatically. Public publishing still requires an authenticated owner and an approved post."
    >
      <Card
        eyebrow="V3.15 • Production-safe account controls"
        title={s.ownerSession?.accessToken ? "Account verified" : "BUSY account sign-in"}
        body={
          s.ownerSession?.accessToken
            ? "This device has an authenticated Supabase session. The publishing server now resolves the business from that session and only returns that business's provider connections, drafts and publishing history."
            : "Sign in to connect this device to a protected BUSY business workspace. Provider access alone is never enough to publish."
        }
        footer={s.ownerSession?.accessToken ? "Session + business membership are verified server-side" : "Each signed-in business gets its own protected data workspace"}
        tone={s.ownerSession?.accessToken ? "green" : "amber"}
      >
        <View style={styles.ownerIdentityBlock}>
          <Text style={styles.ownerIdentityLabel}>Account email</Text>
          <Text style={styles.ownerIdentityValue}>{s.ownerSession?.email || s.ownerEmail}</Text>
        </View>
        <MetricRow left="Account status" right={s.ownerSession?.accessToken ? "Verified" : "Signed out"} strong={!!s.ownerSession?.accessToken} />
        {s.ownerSession?.accessToken ? (
          <>
            <MetricRow left="Cloud data" right={s.cloudInitialised ? s.cloudSyncStatus : "Preparing…"} strong={s.cloudInitialised && !s.cloudSyncError} />
            <MetricRow
              left="Publishing tenant"
              right={
                s.socialPublishingStatus?.owner?.businessId
                  ? s.socialPublishingStatus.owner.businessId === s.cloudWorkspace?.businessId
                    ? "Matches this business"
                    : "Blocked mismatch"
                  : "Verified when publishing loads"
              }
              strong={
                !!s.socialPublishingStatus?.owner?.businessId &&
                s.socialPublishingStatus.owner.businessId === s.cloudWorkspace?.businessId
              }
            />
            <MetricRow left="Sensitive action protection" right="Server rate limits active" strong />
          </>
        ) : null}
        {!s.ownerSession?.accessToken ? (
          <>
            <Field
              label="Email"
              value={s.ownerEmail}
              onChangeText={s.setOwnerEmail}
              placeholder="you@yourbusiness.co.uk"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="Password"
              value={s.ownerPassword}
              onChangeText={s.setOwnerPassword}
              placeholder="Enter or choose a password"
              secureTextEntry
              autoCapitalize="none"
            />
            <Button
              label={s.ownerAuthLoading ? "Signing in…" : "Sign in"}
              primary
              disabled={s.ownerAuthLoading}
              onPress={s.signInOwner}
            />
            <Button
              label={s.ownerAuthLoading ? "Please wait…" : "Create BUSY account"}
              disabled={s.ownerAuthLoading}
              onPress={s.createOwnerAccount}
            />
            <Button
              label="Forgot password? Send recovery email"
              disabled={s.ownerAuthLoading}
              onPress={s.sendPasswordReset}
            />
          </>
        ) : (
          <Button label="Sign out" disabled={s.ownerAuthLoading} onPress={s.signOutOwner} />
        )}
        {s.ownerAuthError ? <Text style={styles.customerHistoryPhotoMeta}>{s.ownerAuthError}</Text> : null}
        {s.ownerAuthNotice ? <Text style={styles.cardFooter}>{s.ownerAuthNotice}</Text> : null}
      </Card>

      <Card
        eyebrow="V3.13 • Tenant-scoped connection health"
        title={
          credentials.livePublishingEnabled
            ? "Live provider publishing is enabled"
            : "Publishing backend is ready; live posting remains safely disabled"
        }
        body={
          credentials.livePublishingEnabled
            ? "Approved posts can be sent to connected providers and scheduled posts can be processed by the server."
            : "OAuth, private media storage and the publishing queue are deployed. Live posting stays off until the signed-in owner explicitly enables the controlled test."
        }
        footer="Scheduled worker checks due posts once per minute"
        tone={credentials.livePublishingEnabled ? "green" : "amber"}
      >
        <MetricRow left="Meta credentials" right={credentials.meta?.configured ? "Configured" : "Needed"} />
        <MetricRow left="Google credentials" right={credentials.google_business?.configured ? "Configured" : "Needed"} />
        <MetricRow
          left="Live publishing switch"
          right={credentials.livePublishingEnabled ? "ON" : "OFF"}
          strong={credentials.livePublishingEnabled}
        />
        <Button
          label={busy ? "Refreshing…" : "Refresh connection health"}
          disabled={busy || !s.ownerSession?.accessToken}
          onPress={s.refreshSocialPublishingStatus}
        />
        {s.ownerSession?.accessToken && hasLiveProvider ? (
          credentials.livePublishingEnabled ? (
            <Button
              label={busy && s.socialPublishingAction === "live-switch" ? "Turning off…" : "Turn live publishing OFF"}
              danger
              disabled={busy}
              onPress={() => s.confirmLivePublishingChange(false)}
            />
          ) : (
            <Button
              label={busy && s.socialPublishingAction === "live-switch" ? "Enabling…" : "Enable controlled live test"}
              primary
              disabled={busy}
              onPress={() => s.confirmLivePublishingChange(true)}
            />
          )
        ) : null}
      </Card>

      {s.socialPublishingError ? (
        <Card
          eyebrow="Connection error"
          title="BUSY could not complete the latest provider action"
          body={s.socialPublishingError}
          tone="amber"
        />
      ) : null}

      {s.ownerSession?.accessToken && hasLiveProvider ? (
        <Card
          eyebrow="Live publishing protection"
          title={
            credentials.livePublishingEnabled
              ? "Owner-approved live publishing is enabled"
              : "Live publishing is currently off"
          }
          body={
            credentials.livePublishingEnabled
              ? "Connected providers are available only for owner-approved post records. Meta remains locked to the approved BUSY Page and Instagram account, and Google publishes only to the selected Business Profile location."
              : "Connected provider authorization remains stored server-side, but nothing will publish until the owner turns live publishing back on."
          }
          tone={credentials.livePublishingEnabled ? "green" : "blue"}
        >
          {meta.status === "connected" ? (
            <>
              <MetricRow left="Facebook lock" right={meta.pageName || "Busy Does It"} strong />
              <MetricRow left="Instagram lock" right={meta.instagramUsername ? `@${meta.instagramUsername}` : "Not connected"} strong={!!meta.instagramUsername} />
            </>
          ) : null}
          {google.status === "connected" ? (
            <MetricRow left="Google Business location" right={google.googleLocationTitle || "Connected"} strong />
          ) : null}
          {credentials.livePublishingEnabled ? (
            <Button label="Open Social Control Centre" primary onPress={() => s.go("socialMedia")} />
          ) : null}
        </Card>
      ) : null}

      {!credentials.google_business?.configured ? (
        <>
          <Card
            eyebrow="V3.10 • Google Business"
            title="Google publishing code is ready for developer setup"
            body="BUSY already has the OAuth, Business Profile location selection, token refresh and Google post-publishing flow. The remaining step is to create the Google OAuth web client and add its client ID and secret to the server."
            footer={`OAuth redirect: ${BUSY_SOCIAL_PUBLISH_URL}/callback/google_business`}
            tone="blue"
          />
          <Card
            eyebrow="Google setup checklist"
            title="One developer setup unlocks the connection button"
            body="Google requires the Cloud project itself to be approved for Business Profile APIs. After approval, enable the Business Profile API suite in Google Cloud. BUSY directly uses Google My Business API, My Business Account Management API and My Business Business Information API, then verifies Local Posts before going live."
            footer="BUSY now preserves OAuth and can re-check API access without forcing a fresh connection"
            tone="blue"
          />
          <Card
            eyebrow="Google API approval"
            title="Approval and OAuth are separate steps"
            body="If the Business Profile API quota is still 0, the Cloud project has not been approved yet. Once Google grants GBP API access and the required APIs are enabled, BUSY can verify the selected location without changing the rest of the app."
            footer="A connected Google account is not treated as publish-ready until the Local Posts API check succeeds"
            tone="amber"
          />
        </>
      ) : google.status !== "connected" ? (
        <Card
          eyebrow="V3.10 • Google Business"
          title={
            google.status === "needs_attention"
              ? "Google is authorized — finish the API access check"
              : "Google credentials are ready — connect a Business Profile"
          }
          body={
            google.status === "needs_attention"
              ? "BUSY has kept the Google authorization. Fix the Google Cloud approval/API issue shown below, then tap Re-check Google access."
              : "Use the Google Business connection below. BUSY will list the locations the signed-in Google account manages, ask you to choose one if needed, then verify the Local Posts API before calling the connection live."
          }
          tone="green"
        />
      ) : (
        <Card
          eyebrow="V3.10 • Google Business"
          title={google.googleLocationTitle || "Google Business connected"}
          body="This location has passed BUSY's Google Local Posts API check and can be selected alongside Facebook and Instagram when an owner approves a post."
          footer="Retries are destination-specific, so a successful Facebook or Instagram post will not be duplicated if Google alone fails."
          tone="green"
        />
      )}

      <Text style={styles.sectionLabel}>Live social publishing</Text>
      {renderProvider({
        provider: "meta",
        label: "Facebook / Instagram",
        connection: meta,
        configured: !!credentials.meta?.configured,
      })}
      {renderProvider({
        provider: "google_business",
        label: "Google Business",
        connection: google,
        configured: !!credentials.google_business?.configured,
      })}

      <Card
        eyebrow="OAuth return"
        title="After approving a provider, come back to BUSY and tap Refresh"
        body="The provider sends its authorization response directly to the BUSY Supabase Edge Function. BUSY stores the token server-side, then this screen can show the Page, Instagram account or Google location that was authorized."
        tone="blue"
      />

      <Text style={styles.sectionLabel}>Incoming business sources</Text>
      {intakeRows.map(renderPrototypeConnection)}

      {s.connectedIntakeKeys.length ? (
        <>
          <Button label="Run prototype connected sync" onPress={s.runConnectedSourceDemoSync} />
          <Button label="Test one journey across 4 sources" onPress={s.queueCrossSourceJourneyDemo} />
        </>
      ) : null}

      <Text style={styles.sectionLabel}>Other prototype marketing systems</Text>
      {prototypeActionRows.map(renderPrototypeConnection)}

      <Card
        eyebrow="Authority boundary"
        title="A connection never grants blanket permission"
        body="Reading data, creating a draft, storing media, scheduling a post and publishing publicly are separate steps. V3.8 only allows server publishing from an owner-approved post record."
        footer="Paid advertising remains separately controlled"
        tone="green"
      />

      <Button label="Social Control Centre" onPress={() => s.go("socialMedia")} />
      <Button label="Open BUSY Inbox" onPress={s.openBusyInbox} />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function Advanced({ s }) {
  return (
    <Shell s={s} title="Advanced details" subtitle="Optional. You never need this to use the normal app.">
      <ToggleRow
        title="Show advanced marketing details"
        body="Reveal channel, targeting and technical performance metrics."
        value={s.advanced}
        onValueChange={s.setAdvanced}
      />
      {s.advanced ? (
        <>
          <Card eyebrow="Advanced example" title="Local paid test">
            <MetricRow left="Channel" right="Meta" />
            <MetricRow left="CTR" right="2.8%" />
            <MetricRow left="CPC" right="£1.72" />
            <MetricRow left="Recommendation confidence" right="Medium" />
          </Card>
          <Card
            eyebrow="Proof layer"
            title="Recommendations can be inspected"
            body="Expert screens can show the source data, selection criteria, alternatives considered, assumptions, confidence and performance history behind a recommendation."
            footer="Easy enough for anybody. Deep enough for an expert."
            tone="green"
          />
        </>
      ) : (
        <Card
          eyebrow="Hidden by default"
          title="No marketing lesson required"
          body="The normal app stays focused on jobs, money, spare time and simple decisions."
        />
      )}
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}


export {
  BusinessData,
  Settings,
  AccountAccess,
  AccountData,
  AccountRemoval,
  HowBusyWorks,
  WhatMakesDifferent,
  BusinessTypeSettings,
  CapacitySettings,
  SettingsLimits,
  RecordFilingSettings,
  ConnectedAccounts,
  Advanced
};
