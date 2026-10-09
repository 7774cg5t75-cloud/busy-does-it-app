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


function SocialMediaCentre({ s }) {
  useEffect(() => {
    s.refreshSocialPublishingStatus({ quiet: true });
  }, []);

  const statusPriority = (status) => {
    if (["Failed", "Partial failure", "Ready to publish"].includes(status)) return 0;
    if (["Scheduled", "Held for setup"].includes(status)) return 1;
    if (!status || status === "Draft") return 2;
    if (status === "Published") return 3;
    return 4;
  };
  const drafts = [...(s.socialDrafts || [])].sort((a, b) => {
    const priority = statusPriority(a.status) - statusPriority(b.status);
    if (priority) return priority;
    return String(b.updatedAt || b.createdAt || "").localeCompare(
      String(a.updatedAt || a.createdAt || "")
    );
  });
  const jobs = (s.socialJobOpportunities || [])
    .filter(({ job }) =>
      ![
        "Published",
        "Publishing",
        "Scheduled",
        "Held for setup",
        "Partial failure",
        "Failed",
        "Ready to publish",
      ].includes(job.postDraftStatus || "")
    )
    .slice(0, 6);
  const publish = s.socialPublishingStatus || {};
  const meta = publish.connections?.meta || { status: "not_connected" };
  const google = publish.connections?.google_business || { status: "not_connected" };
  const queue = Array.isArray(publish.queue) ? publish.queue : [];
  const liveEnabled = !!publish.credentials?.livePublishingEnabled;
  const liveConnectedCount =
    Number(meta.status === "connected") + Number(google.status === "connected");
  const cloudPublished = queue.filter((post) => !!post.published_at).length;
  const cloudScheduled = queue.filter((post) => post.status === "Scheduled").length;
  const cloudFailed = queue.filter((post) =>
    ["Failed", "Partial failure"].includes(post.status)
  ).length;
  const upcomingPosts = queue
    .filter(
      (post) =>
        post.scheduled_for &&
        ["Scheduled", "Held for setup"].includes(post.status) &&
        new Date(post.scheduled_for).getTime() >= Date.now() - 60000
    )
    .sort((a, b) =>
      String(a.scheduled_for || "").localeCompare(String(b.scheduled_for || ""))
    )
    .slice(0, 7);

  const attentionDrafts = drafts.filter((draft) =>
    ["Failed", "Partial failure", "Ready to publish"].includes(draft.status)
  );
  const scheduledDrafts = drafts.filter((draft) =>
    ["Scheduled", "Held for setup"].includes(draft.status)
  );
  const workingDrafts = drafts.filter(
    (draft) => !draft.status || draft.status === "Draft"
  );
  const publishedDrafts = drafts
    .filter((draft) => draft.status === "Published")
    .slice(0, 8);
  const outcomeReminders = (s.socialOutcomeReminders || []).slice(0, 5);

  const providerResultLine = (draft) => {
    const results = draft.providerResults || {};
    const channels = Array.isArray(draft.channels) ? draft.channels : [];
    if (!channels.length || !Object.keys(results).length) return "";
    return channels
      .map((channel) => {
        const value = results[channel];
        if (!value) return `${channel}: pending`;
        return value.error ? `${channel}: failed` : `${channel}: published`;
      })
      .join(" • ");
  };

  const renderDraftCard = (draft) => {
    const resultLine = providerResultLine(draft);
    return (
      <Pressable
        key={draft.id}
        onPress={() => s.openSocialDraft(draft.id)}
        style={styles.activityCard}
      >
        <View style={styles.activityTopRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.activityName}>{draft.service || "Social post"}</Text>
            <Text style={styles.activityService}>
              {draft.sourceLabel || "Selected photos"} • {(draft.channels || []).join(", ") || "No destination chosen"}
            </Text>
          </View>
          <StatusChip
            label={draft.status || "Draft"}
            tone={
              draft.status === "Published"
                ? "green"
                : ["Failed", "Partial failure", "Ready to publish"].includes(draft.status)
                ? "amber"
                : "blue"
            }
          />
        </View>
        <Text numberOfLines={3} style={styles.activitySummary}>{draft.text}</Text>
        {resultLine ? (
          <Text style={styles.customerHistoryPhotoMeta}>{resultLine}</Text>
        ) : null}
        {draft.lastPublishError ? (
          <Text style={styles.customerHistoryPhotoMeta}>{draft.lastPublishError}</Text>
        ) : null}
        {draft.status === "Scheduled" && draft.scheduledAt ? (
          <Text style={styles.activityOpen}>
            Scheduled {new Date(draft.scheduledAt).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        ) : draft.publishedAt ? (
          <Text style={styles.activityOpen}>
            {draft.status === "Partial failure" ? "Partly published" : "Published"} {formatUKDate(String(draft.publishedAt).slice(0, 10))} • Open details →
          </Text>
        ) : (
          <Text style={styles.activityOpen}>Open post →</Text>
        )}
      </Pressable>
    );
  };

  const providerLabel = (connection, fallback) => {
    if (connection.status === "connected") {
      return connection.pageName ||
        connection.googleLocationTitle ||
        connection.providerAccountName ||
        fallback;
    }
    if (connection.status === "needs_selection") return "Choose account";
    if (connection.status === "needs_attention") return "Needs attention";
    if (connection.status === "disconnected") return "Disconnected";
    return "Not connected";
  };

  return (
    <Shell
      s={s}
      title="Social Media"
      subtitle="See what is ready to post, what is scheduled, what needs attention and what actually produced business results."
      brandCue="One place for content, publishing status and outcome learning."
    >
      <Card
        eyebrow="Posts and scheduling"
        title="Your posts in one place"
        body="Create posts, review drafts, see what is scheduled and check which posts were published."
        footer={
          liveEnabled
            ? "Live provider publishing safety switch: ON"
            : "Live provider publishing safety switch: OFF until setup is complete"
        }
        tone={liveEnabled ? "green" : "amber"}
      >
        <MetricRow left="Live provider connections" right={String(liveConnectedCount)} />
        <MetricRow left="Cloud scheduled" right={String(cloudScheduled)} />
        <MetricRow left="Cloud published" right={String(cloudPublished)} strong={cloudPublished > 0} />
        <MetricRow left="Needs attention" right={String(cloudFailed)} strong={cloudFailed > 0} />
      </Card>

      <Card
        eyebrow="Connection health"
        title="Check your connected accounts"
        body="BUSY can prepare posts before accounts are connected. Publishing only works after you connect and approve the relevant account."
        tone={liveConnectedCount ? "green" : "blue"}
      >
        <MetricRow
          left="Facebook / Instagram"
          right={providerLabel(meta, "Meta")}
          strong={meta.status === "connected"}
        />
        <MetricRow
          left="Google Business"
          right={providerLabel(google, "Google Business")}
          strong={google.status === "connected"}
        />
        <Button label="Manage publishing connections" onPress={() => s.go("connectedAccounts")} />
        <Button
          label={s.socialPublishingLoading ? "Refreshing…" : "Refresh connection status"}
          disabled={s.socialPublishingLoading}
          onPress={s.refreshSocialPublishingStatus}
        />
      </Card>

      {s.socialPublishingError ? (
        <Card
          eyebrow="Publishing status"
          title="BUSY could not refresh part of the publishing layer"
          body={s.socialPublishingError}
          tone="amber"
        />
      ) : null}

      <Card
        eyebrow="Usual destinations"
        title={
          [
            s.socialPreferredChannels?.facebook ? "Facebook" : null,
            s.socialPreferredChannels?.instagram ? "Instagram" : null,
            s.socialPreferredChannels?.googleBusiness ? "Google Business" : null,
          ].filter(Boolean).join(" + ") || "Choose per post"
        }
        body="BUSY remembers the destinations you most recently approved. You can still change them on every individual post before publishing."
        tone="blue"
      />

      <Button label="Create something from my phone photos" primary onPress={s.startSocialFromPhone} />

      {jobs.length ? (
        <>
          <Text style={styles.sectionLabel}>
            {`Ready to post • ${jobs.length} job${jobs.length === 1 ? "" : "s"}`}
          </Text>
          {jobs.map(({ customer, job }) => {
            const reusable = (job.photos || []).filter((photo) => photo.marketingOk).length;
            return (
              <Pressable
                key={`${customer.id}-${job.id}`}
                onPress={() => s.startSocialFromJob(customer.id, job.id)}
                style={styles.activityCard}
              >
                <View style={styles.activityTopRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.activityName}>{job.service || customer.service}</Text>
                    <Text style={styles.activityService}>
                      {job.date ? formatUKDate(job.date) : "Completed job"} • {reusable} reusable photo{reusable === 1 ? "" : "s"}
                    </Text>
                  </View>
                  <StatusChip
                    label={job.postDraftStatus === "Published" ? "Published" : "Ready"}
                    tone={job.postDraftStatus === "Published" ? "green" : "blue"}
                  />
                </View>
                <Text style={styles.activitySummary}>
                  BUSY can prepare content from these owner-approved job photos without intentionally adding the customer's name or address to the public wording.
                </Text>
                <Text style={styles.activityOpen}>Create content →</Text>
              </Pressable>
            );
          })}
        </>
      ) : (
        <Card
          eyebrow="Completed-job content"
          title="No reusable job photos yet"
          body="Complete a job, attach photos and allow BUSY to suggest those selected photos for marketing. They will then appear here."
          tone="blue"
        />
      )}

      <Text style={styles.sectionLabel}>Publishing calendar</Text>
      {upcomingPosts.length ? (
        <Card
          eyebrow="Next scheduled posts"
          title={`${upcomingPosts.length} upcoming item${upcomingPosts.length === 1 ? "" : "s"}`}
          body="BUSY keeps the next scheduled publishing actions visible in one simple list. Held items remain non-publishable until setup is complete and you approve them again."
          tone="blue"
        >
          {upcomingPosts.map((post) => {
            const when = new Date(post.scheduled_for);
            const date = Number.isNaN(when.getTime())
              ? "Date unavailable"
              : when.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                });
            const time = Number.isNaN(when.getTime())
              ? ""
              : when.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
            return (
              <MetricRow
                key={post.id}
                left={`${date}${time ? ` • ${time}` : ""} • ${(post.channels || []).join(", ") || "No destination"}`}
                right={post.status}
                strong={post.status === "Scheduled"}
              />
            );
          })}
        </Card>
      ) : (
        <Card
          eyebrow="Publishing calendar"
          title="Nothing scheduled yet"
          body="Once an approved post is given a future date and time, it will appear here. While live publishing is disabled, test schedules are held safely for setup rather than becoming publishable later by surprise."
          tone="blue"
        />
      )}

      <Text style={styles.sectionLabel}>Publishing activity</Text>
      <Card
        eyebrow="At a glance"
        title="Your queue is split by what needs your attention"
        body="Problems come first, then scheduled work, drafts and recent publishing history."
        tone={attentionDrafts.length ? "amber" : "blue"}
      >
        <MetricRow left="Needs attention" right={String(attentionDrafts.length)} strong={attentionDrafts.length > 0} />
        <MetricRow left="Scheduled" right={String(scheduledDrafts.length)} />
        <MetricRow left="Drafts" right={String(workingDrafts.length)} />
        <MetricRow left="Recently published" right={String(publishedDrafts.length)} strong={publishedDrafts.length > 0} />
      </Card>

      {attentionDrafts.length ? (
        <>
          <Text style={styles.sectionLabel}>Needs attention</Text>
          {attentionDrafts.map(renderDraftCard)}
        </>
      ) : null}

      {scheduledDrafts.length ? (
        <>
          <Text style={styles.sectionLabel}>Scheduled</Text>
          {scheduledDrafts.map(renderDraftCard)}
        </>
      ) : null}

      {workingDrafts.length ? (
        <>
          <Text style={styles.sectionLabel}>Drafts</Text>
          {workingDrafts.map(renderDraftCard)}
        </>
      ) : null}

      {publishedDrafts.length ? (
        <>
          <Text style={styles.sectionLabel}>Recently published</Text>
          {publishedDrafts.map(renderDraftCard)}
        </>
      ) : null}

      {!drafts.length ? (
        <Card
          eyebrow="No drafts yet"
          title="Your content queue is empty"
          body="Create from phone photos or a completed job. BUSY will keep the wording, media, destinations and provider status together."
          tone="blue"
        />
      ) : null}

      {outcomeReminders.length ? (
        <>
          <Text style={styles.sectionLabel}>Did these posts bring work?</Text>
          <Card
            eyebrow="Business outcome reminders"
            title={`${outcomeReminders.length} published job post${outcomeReminders.length === 1 ? "" : "s"} waiting for an outcome`}
            body="BUSY does not assume a published post worked. Record an enquiry, quote, booking or no enquiry so the Business Brain learns from actual business outcomes."
            tone="green"
          />
          {outcomeReminders.map(({ customer, job }) => (
            <Pressable
              key={`social-outcome-${customer.id}-${job.id}`}
              onPress={() => s.openJobPostOutcome(customer.id, job.id)}
              style={styles.activityCard}
            >
              <View style={styles.activityTopRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.activityName}>{job.service || customer.service || "Published job post"}</Text>
                  <Text style={styles.activityService}>
                    {(job.postChannels || []).join(", ") || "Published social post"}
                  </Text>
                </View>
                <StatusChip label="Outcome?" tone="amber" />
              </View>
              <Text style={styles.activitySummary}>
                Published {job.postPublishedAt ? formatUKDate(String(job.postPublishedAt).slice(0, 10)) : "recently"}.
              </Text>
              <Text style={styles.activityOpen}>Record what happened →</Text>
            </Pressable>
          ))}
        </>
      ) : null}

      <Card
        eyebrow="BUSY Business Brain"
        title={
          (s.postEvidence?.sample || 0) >= 3
            ? "Real publishing outcomes can feed the same evidence loop"
            : "Learning cautiously until your business has enough outcome evidence"
        }
        body="Provider publishing status is not treated as a business result by itself. BUSY still learns from recorded enquiries, quotes and bookings rather than assuming a published post was successful because it got reach or likes."
        footer={
          s.latestPostEvidenceAt
            ? `Latest social outcome evidence: ${formatUKDate(String(s.latestPostEvidenceAt).slice(0, 10))}`
            : "No social outcome evidence recorded yet"
        }
        tone={(s.postEvidence?.sample || 0) >= 3 ? "green" : "blue"}
      >
        <MetricRow left="Finished-job post outcomes" right={String(s.postEvidence?.sample || 0)} />
        <MetricRow left="Outcomes marked booking" right={String(s.postEvidence?.successes || 0)} />
        <MetricRow left="Evidence confidence" right={s.postEvidence?.confidence || "No evidence yet"} />
        <Button label="How BUSY learns" onPress={() => s.go("businessBrain")} />
      </Card>

      <Button label="Back" onPress={s.back} />
    </Shell>
  );
}

function SocialCreator({ s }) {
  const result = s.socialAiResult;
  const photos = s.socialCreatePhotos || [];
  const analysing = s.socialAiStatus === "analysing";
  const ready = s.socialAiStatus === "ready" && !!result;

  return (
    <Shell
      s={s}
      title="Create social content"
      subtitle={s.socialSourceContext?.label || "Selected photos"}
      brandCue="BUSY looks only at the photos you deliberately select."
    >
      <Card
        eyebrow="Source"
        title={s.socialSourceContext?.type === "job" ? "Completed job photos" : "Photos from your phone"}
        body={
          s.socialSourceContext?.type === "job"
            ? "These are photos already attached to a completed job and approved for marketing suggestions. Private customer details are not intentionally added to the caption."
            : "Choose up to six photos. BUSY can look for a before/after pair, a finished result, work-in-progress or another useful story."
        }
        tone="green"
      />

      <Button
        label={photos.length ? `Choose more photos • ${photos.length}/6` : "Choose photos"}
        primary={!photos.length}
        disabled={photos.length >= 6 || analysing}
        onPress={s.chooseSocialPhotos}
      />

      {photos.length ? (
        <View style={styles.photoGrid}>
          {photos.map((photo) => (
            <View key={photo.id || photo.uri} style={styles.photoTile}>
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              <Pressable
                disabled={analysing}
                onPress={() => s.removeSocialPhoto(photo.id)}
                style={styles.photoRemove}
              >
                <Text style={styles.photoRemoveText}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.fieldLabel}>Anything BUSY should know? (optional)</Text>
      <TextInput
        multiline
        value={s.socialBrief}
        onChangeText={s.setSocialBrief}
        placeholder="e.g. This was a heavily stained driveway. Keep the wording simple and local."
        placeholderTextColor="#9AA3B2"
        style={styles.messageInput}
      />

      <Button
        label={analysing ? "BUSY is looking at the photos…" : ready ? "Analyse again" : "Create with BUSY AI"}
        primary
        disabled={!photos.length || analysing}
        onPress={s.runSocialContentAI}
      />

      {s.socialAiStatus === "error" ? (
        <Card
          eyebrow="Social AI"
          title="BUSY could not create the content"
          body={s.socialAiError || "The analysis did not complete."}
          footer="Nothing was saved or published"
          tone="amber"
        />
      ) : null}

      {ready ? (
        <>
          <Card
            eyebrow="BUSY saw"
            title={result.summary || socialStoryLabel(result.story?.type)}
            body={result.story?.reason || "BUSY analysed the selected photos as one content set."}
            footer={`${socialStoryLabel(result.story?.type)} • confidence ${result.story?.confidence || "Low"}`}
            tone={result.privacyWarnings?.length ? "amber" : "green"}
          >
            <MetricRow left="Detected service" right={result.detectedService || "Not certain"} />
            {result.story?.type === "before_after" ? (
              <MetricRow left="Before / after pairing" right="Detected" strong />
            ) : null}
          </Card>

          {result.privacyWarnings?.length ? (
            <Card
              eyebrow="Privacy check"
              title="Check these before anything goes public"
              body={result.privacyWarnings.join(" • ")}
              footer="BUSY has not published anything"
              tone="amber"
            />
          ) : null}

          <Text style={styles.sectionLabel}>Choose the wording</Text>
          {(result.captions || []).map((caption) => (
            <Choice
              key={caption.id}
              label={caption.label}
              sub={`${caption.text}\n\nWhy this option: ${caption.reason}`}
              selected={s.socialCaptionId === caption.id}
              onPress={() => s.applySocialCaption(caption)}
            />
          ))}

          <Text style={styles.fieldLabel}>Your final wording</Text>
          <Text style={styles.cardFooter}>
            Your edits are protected. If you choose another BUSY option after editing this box, BUSY will ask before replacing your wording.
          </Text>
          <TextInput
            multiline
            value={s.socialDraftText}
            onChangeText={s.setSocialDraftText}
            style={styles.messageInput}
            placeholder="Edit the caption before saving"
            placeholderTextColor="#9AA3B2"
            textAlignVertical="top"
          />

          <Button
            label="Save draft & review"
            primary
            disabled={!s.socialDraftText.trim()}
            onPress={s.saveGeneratedSocialDraft}
          />
        </>
      ) : null}

      <Button label="Back to Social Media" onPress={() => s.go("socialMedia")} />
    </Shell>
  );
}

function SocialDraftReview({ s }) {
  useEffect(() => {
    s.refreshSocialPublishingStatus({ quiet: true });
  }, []);

  const photos = s.socialCreatePhotos || [];
  const warnings = s.socialAiResult?.privacyWarnings || [];
  const publish = s.socialPublishingStatus || {};
  const meta = publish.connections?.meta || { status: "not_connected" };
  const google = publish.connections?.google_business || { status: "not_connected" };
  const hasMeta = meta.status === "connected";
  const hasGoogle = google.status === "connected";
  const liveEnabled = !!publish.credentials?.livePublishingEnabled;
  const selectedCount =
    Number(!!s.socialDraftChannels.facebook) +
    Number(!!s.socialDraftChannels.instagram) +
    Number(!!s.socialDraftChannels.googleBusiness);
  const selectedDraft =
    (s.socialDrafts || []).find((draft) => draft.id === s.selectedSocialDraftId) || null;
  const busy = !!s.socialPublishingLoading;
  const draftStatus = selectedDraft?.status || "Draft";
  const isScheduled = ["Scheduled", "Held for setup"].includes(draftStatus);
  const isPublishedOrPublishing = [
    "Published",
    "Publishing",
  ].includes(draftStatus);
  const isRetryable = ["Failed", "Partial failure", "Ready to publish"].includes(draftStatus);
  const hasPublishedHistory = !!selectedDraft?.publishedAt;
  const recordLocked = !!selectedDraft && draftStatus !== "Draft";
  const providerHistoryHasFailure =
    !!selectedDraft?.providerResults &&
    Object.values(selectedDraft.providerResults).some((result) => !!result?.error);
  const canDeleteDraft =
    !!selectedDraft &&
    ["Draft", "Failed", "Ready to publish"].includes(draftStatus) &&
    !hasPublishedHistory;

  return (
    <Shell
      s={s}
      title="Review social post"
      subtitle="Edit the wording, choose real destinations and decide whether to keep it as a draft, schedule it or publish it."
      brandCue="Preparation can be automatic. Public action still needs explicit owner approval."
    >
      <Card
        eyebrow="Prepared content"
        title={s.socialSourceContext?.service || s.socialAiResult?.detectedService || "Social post"}
        body={s.socialAiResult?.story?.reason || "Prepared from selected business photos."}
        footer={s.socialSourceContext?.label || "Selected photos"}
        tone={warnings.length ? "amber" : "green"}
      >
        <MetricRow left="Photos" right={String(photos.length)} />
        <MetricRow left="Content type" right={socialStoryLabel(s.socialAiResult?.story?.type)} />
        <MetricRow left="Privacy warnings" right={String(warnings.length)} strong={warnings.length > 0} />
        <MetricRow
          left="Cloud media"
          right={selectedDraft?.cloudMedia?.length ? "Uploaded" : "Not uploaded yet"}
          strong={!!selectedDraft?.cloudMedia?.length}
        />
      </Card>

      {photos.length ? (
        <View style={styles.photoGrid}>
          {photos.slice(0, 6).map((photo) => (
            <View key={photo.id || photo.uri} style={styles.photoTile}>
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
            </View>
          ))}
        </View>
      ) : null}

      {warnings.length ? (
        <Card
          eyebrow="Check before approval"
          title="The photos may contain private detail"
          body={warnings.join(" • ")}
          footer="BUSY will not remove or hide these details for you automatically"
          tone="amber"
        />
      ) : null}

      <Text style={styles.fieldLabel}>Caption</Text>
      <TextInput
        multiline
        value={s.socialDraftText}
        onChangeText={s.setSocialDraftText}
        editable={!recordLocked}
        style={[styles.messageInput, recordLocked && { opacity: 0.7 }]}
        placeholder="Post wording"
        placeholderTextColor="#9AA3B2"
        textAlignVertical="top"
      />

      <Text style={styles.sectionLabel}>Where should it go?</Text>
      {hasMeta ? (
        <>
          <ToggleRow
            title="Facebook"
            body={meta.pageName ? `Connected Page: ${meta.pageName}` : "Connected through Meta"}
            value={!!s.socialDraftChannels.facebook}
            onValueChange={() => s.toggleSocialDraftChannel("facebook")}
            disabled={recordLocked}
          />
          {meta.instagramUserId ? (
            <ToggleRow
              title="Instagram"
              body={meta.instagramUsername ? `Connected: @${meta.instagramUsername}` : "Connected professional Instagram account"}
              value={!!s.socialDraftChannels.instagram}
              onValueChange={() => s.toggleSocialDraftChannel("instagram")}
              disabled={recordLocked}
            />
          ) : (
            <Card
              eyebrow="Instagram"
              title="No professional Instagram account found on this Meta connection"
              body="Facebook can still be used. Connect/select a Page with an Instagram professional account to publish to Instagram."
              tone="blue"
            />
          )}
        </>
      ) : null}

      {hasGoogle ? (
        <ToggleRow
          title="Google Business"
          body={google.googleLocationTitle ? `Connected location: ${google.googleLocationTitle}` : "Connected Google Business location"}
          value={!!s.socialDraftChannels.googleBusiness}
          onValueChange={() => s.toggleSocialDraftChannel("googleBusiness")}
          disabled={recordLocked}
        />
      ) : null}

      {!hasMeta && !hasGoogle ? (
        <Card
          eyebrow="No live publishing connection"
          title="You can still save this as a cloud-backed draft"
          body="Connect Facebook / Instagram or Google Business before scheduling or publishing to a real provider."
          tone="amber"
        >
          <Button label="Manage publishing connections" onPress={() => s.go("connectedAccounts")} />
        </Card>
      ) : null}

      <Text style={styles.sectionLabel}>Schedule</Text>
      {recordLocked ? (
        <Card
          eyebrow="Publishing record locked"
          title={
            isScheduled
              ? "Cancel this schedule before changing the post"
              : isRetryable
              ? "Use the safe retry action for this record"
              : "Published history is read-only"
          }
          body={
            isScheduled
              ? "BUSY freezes the caption and destinations once a schedule is active, so an edit cannot silently create a second publishing instruction."
              : isRetryable
              ? "This record keeps its original provider receipts and failures. Retrying sends only the destinations that still need attention."
              : "BUSY keeps the original caption, destinations and provider receipts as publishing history instead of turning a live post back into a draft."
          }
          tone={isRetryable ? "amber" : "blue"}
        />
      ) : (
        <>
          <DatePickerField
            label="Post date"
            value={s.socialScheduleDate}
            onChange={s.setSocialScheduleDate}
            allowFuture
            minimumDate={dateToISO(new Date())}
          />
          <Field
            label="Post time"
            value={s.socialScheduleTime}
            onChangeText={s.setSocialScheduleTime}
            placeholder="19:00"
          />
        </>
      )}

      <Card
        eyebrow="Publishing safety"
        title={liveEnabled ? "Live provider publishing is enabled on the server" : "Live provider publishing is still server-disabled"}
        body={
          liveEnabled
            ? "An approved Publish now action can call the selected providers. A scheduled post will be picked up by the server when its time arrives."
            : "The real publishing code and scheduler are in place, but the final server switch remains off until provider credentials and owner authentication are ready. You can still save and test the cloud schedule."
        }
        footer="No post is sent merely because AI created it"
        tone={liveEnabled ? "green" : "amber"}
      />

      {selectedDraft?.lastPublishError ? (
        <Card
          eyebrow="Last publishing result"
          title={selectedDraft.status || "Needs attention"}
          body={selectedDraft.lastPublishError}
          tone="amber"
        />
      ) : null}

      {selectedDraft?.providerResults &&
      Object.keys(selectedDraft.providerResults).length ? (
        <Card
          eyebrow="Per-channel publishing result"
          title={
            providerHistoryHasFailure
              ? "Some destinations still need attention"
              : "Every recorded destination has a provider receipt"
          }
          body="Each destination is tracked separately. If one channel fails, BUSY can retry only that failed destination without reposting the channels that already succeeded."
          tone={providerHistoryHasFailure ? "amber" : "green"}
        >
          {Object.entries(selectedDraft.providerResults).map(([channel, result]) => {
            const value = result || {};
            const failed = !!value.error;
            const providerId =
              value.id ||
              value.postId ||
              value.name ||
              value.resourceName ||
              "";
            return (
              <MetricRow
                key={channel}
                left={channel}
                right={failed ? "Failed" : providerId ? `Published • ${providerId}` : "Published"}
                strong={!failed}
              />
            );
          })}
        </Card>
      ) : null}

      {!recordLocked ? (
        <>
          <Button
            label={busy && s.socialPublishingAction === "save" ? "Saving to cloud…" : "Save cloud-backed draft"}
            disabled={busy || !s.socialDraftText.trim()}
            onPress={s.saveSocialDraftOnly}
          />
          <Button
            label={
              !selectedCount
                ? "Choose a connected destination to schedule"
                : busy && s.socialPublishingAction === "schedule"
                ? "Scheduling…"
                : liveEnabled
                ? "Schedule real post"
                : "Schedule in cloud queue"
            }
            disabled={busy || !selectedCount || !s.socialDraftText.trim()}
            onPress={s.scheduleSocialDraft}
          />
          <Button
            label={
              !selectedCount
                ? "Choose a connected destination to publish"
                : busy && s.socialPublishingAction === "publish"
                ? "Publishing…"
                : liveEnabled
                ? "Approve & publish now"
                : "Live publishing setup not finished"
            }
            primary={liveEnabled && selectedCount > 0}
            disabled={busy || !selectedCount || !s.socialDraftText.trim() || !liveEnabled}
            onPress={s.approveSocialDraft}
          />
        </>
      ) : null}
      <Button label="Refresh provider status" onPress={s.refreshSocialPublishingStatus} disabled={busy} />

      {isRetryable ? (
        <Button
          label={
            busy && s.socialPublishingAction === "retry"
              ? "Retrying post…"
              : "Retry failed destination(s)"
          }
          primary
          disabled={busy || !liveEnabled}
          onPress={s.confirmRetrySocialDraft}
        />
      ) : null}

      {hasPublishedHistory &&
      selectedDraft?.source === "job" &&
      selectedDraft?.sourceCustomerId &&
      selectedDraft?.sourceJobId ? (
        <Button
          label="Record enquiry / booking outcome"
          onPress={() =>
            s.openJobPostOutcome(
              selectedDraft.sourceCustomerId,
              selectedDraft.sourceJobId
            )
          }
        />
      ) : null}

      {isScheduled ? (
        <Button
          label={
            busy && s.socialPublishingAction === "cancel-schedule"
              ? "Cancelling schedule…"
              : "Cancel scheduled post"
          }
          danger
          disabled={busy}
          onPress={s.confirmCancelScheduledSocialDraft}
        />
      ) : null}

      {canDeleteDraft ? (
        <Button
          label={
            busy && s.socialPublishingAction === "delete"
              ? "Deleting draft…"
              : "Delete draft"
          }
          danger
          disabled={busy}
          onPress={s.confirmDeleteSocialDraft}
        />
      ) : null}

      {hasPublishedHistory || isPublishedOrPublishing ? (
        <Card
          eyebrow="Published history"
          title={
            draftStatus === "Partial failure"
              ? "At least one real provider post already exists"
              : "This BUSY record is kept as publishing history"
          }
          body={
            draftStatus === "Partial failure"
              ? "Successful destinations stay locked while BUSY retries only the failed destination(s). This prevents a retry from duplicating the posts that already went live."
              : "Removing or rewriting a BUSY record would not remove the real provider post, so published and publishing items are kept as read-only history."
          }
          footer="Delete a live Facebook, Instagram or Google Business post from that provider itself"
          tone={draftStatus === "Partial failure" ? "amber" : "blue"}
        />
      ) : null}

      <Button label="Back to Social Media" onPress={() => s.go("socialMedia")} />
    </Shell>
  );
}

function OpportunityFeedback({ s }) {
  const opportunity = s.pendingBrainFeedback;
  const reasons = [
    "Just not now",
    "Not suitable for my business",
    "Wrong time of year",
    "Too far away",
    "Not worthwhile financially",
    "Don't suggest this again",
  ];

  if (!opportunity) {
    return (
      <Shell
        s={s}
        title="Recommendation feedback"
        subtitle="There is no recommendation waiting for feedback."
      >
        <Button label="Back to Home" primary onPress={() => s.jump("home", "Home")} />
      </Shell>
    );
  }

  return (
    <Shell
      s={s}
      title="Why wasn't this useful?"
      subtitle="One tap helps BUSY avoid repeating the wrong kind of advice."
      brandCue="Your correction becomes business evidence — not a hidden AI guess."
    >
      <Card
        eyebrow="Recommendation"
        title={opportunity.title}
        body={opportunity.service ? `Service: ${opportunity.service}` : businessBrainFamilyLabel(opportunity.family)}
        footer="The recommendation is hidden from this Home session either way"
        tone="blue"
      />

      {reasons.map((reason) => (
        <Choice
          key={reason}
          label={reason}
          sub={
            reason === "Just not now"
              ? "Hide it for now without changing future ranking."
              : reason === "Don't suggest this again"
              ? opportunity.service
                ? `Creates an owner rule blocking this type of recommendation for ${opportunity.service} until you remove it.`
                : "Creates an owner rule blocking this recommendation type until you remove it."
              : "Counts as business-specific feedback and gently reduces similar future suggestions."
          }
          selected={s.brainFeedbackReason === reason}
          onPress={() => s.setBrainFeedbackReason(reason)}
        />
      ))}

      <Card
        eyebrow="Learning boundary"
        title="BUSY learns narrowly"
        body="When the service is known, feedback is kept service-specific. A driveway-cleaning rejection should not automatically teach BUSY that every social post or every customer follow-up is a bad idea."
        footer="Live customer commitments are never hidden by marketing feedback"
        tone="green"
      />

      <Button
        label="Save feedback"
        primary
        disabled={!s.brainFeedbackReason}
        onPress={s.saveOpportunityFeedback}
      />
      <Button label="Cancel" onPress={s.back} />
    </Shell>
  );
}

function BusinessBrain({ s }) {
  const patterns = s.businessBrainPatterns || [];
  const memoryPatterns = s.businessMemoryPatterns || [];
  const channels = s.socialChannelEvidence || [];
  const feedback = [...(s.businessBrainFeedback || [])].sort((a, b) =>
    String(b.recordedAt || "").localeCompare(String(a.recordedAt || ""))
  );
  const activePatterns = patterns.filter((item) => item.evidence?.evidenceReady).length;
  const stalePatterns = patterns.filter((item) => item.freshness?.stale && item.evidence?.sample).length;
  const blockingRules = (s.businessBrainRules || []).filter(
    (rule) => manualRuleTargetFamilies(rule).length
  ).length;
  const acceptedFeedback = feedback.filter((item) => item.signal === "accepted");
  const dismissedFeedback = feedback.filter((item) => item.signal !== "accepted");
  const learnedChoiceRows = Object.entries(s.businessBrainFeedbackSummary || {})
    .map(([family, summary]) => ({
      family,
      label: businessBrainFamilyLabel(family),
      accepted: Number(summary.accepted || 0),
      dismissed: Number(summary.dismissed || 0),
      rankingEffect: Number(summary.rankingEffect || 0),
    }))
    .sort((a, b) => Math.abs(b.rankingEffect) - Math.abs(a.rankingEffect));
  const strongestEvidencePattern =
    [...memoryPatterns]
      .filter((item) => Number(item.memoryAdjustment || 0) !== 0)
      .sort(
        (a, b) =>
          Math.abs(Number(b.memoryAdjustment || 0)) -
            Math.abs(Number(a.memoryAdjustment || 0)) ||
          Number(b.sample || 0) - Number(a.sample || 0)
      )[0] || null;

  return (
    <Shell
      s={s}
      title="How BUSY learns"
      subtitle="The evidence, outcomes and owner choices BUSY is actually using to tailor this business."
      brandCue="Auditable learning: source, sample, confidence, freshness, choices and owner authority."
    >

      <Card
        eyebrow="V3.21 • Business Memory"
        title="Outcome history now changes BUSY gradually"
        body="BUSY now keeps bounded long-term evidence snapshots, confidence stages and trend direction. Tiny samples remain visible but have no ranking authority; useful and strong evidence can gently change optional recommendations."
        footer="Too early to tell → Early signal → Useful evidence → Strong evidence"
        tone="green"
      >
        <MetricRow
          left="Memory snapshots"
          right={String(s.businessMemoryHistory?.length || 0)}
        />
        <MetricRow
          left="Evidence changes"
          right={String(s.businessMemoryChanges?.length || 0)}
          strong={(s.businessMemoryChanges?.length || 0) > 0}
        />
        <Button label="Open Business Memory" primary onPress={() => s.go("businessMemory")} />
      </Card>

      <Card
        eyebrow="V3.17 • Business Brain + proactive watch"
        title="BUSY now learns, ranks and notices patterns"
        body="The ranking still starts with real business evidence and live customer obligations. V3.17 adds a separate proactive watch layer for useful combinations in the diary, pipeline, repeat timing and completed-job records without letting those nudges override live customer commitments."
        tone="green"
      >
        <MetricRow left="Evidence patterns tracked" right={String(patterns.length)} />
        <MetricRow left="Patterns with usable samples" right={String(activePatterns)} strong={activePatterns > 0} />
        <MetricRow left="Recommendations chosen" right={String(acceptedFeedback.length)} strong={acceptedFeedback.length > 0} />
        <MetricRow left="Recommendations dismissed" right={String(dismissedFeedback.length)} />
        <MetricRow left="Stale patterns down-weighted" right={String(stalePatterns)} />
        <MetricRow left="Owner-set rules" right={String(s.businessBrainRules?.length || 0)} />
        <MetricRow left="Rules that block recommendation types" right={String(blockingRules)} />
        <MetricRow left="Proactive patterns active" right={String(s.proactiveNotices?.length || 0)} strong={(s.proactiveNotices?.length || 0) > 0} />
        <MetricRow left="Proactive patterns hidden" right={String(s.proactiveHiddenNoticeCount || 0)} />
        <Button label="Open BUSY noticed watchlist" onPress={() => s.go("proactiveWatch")} />
      </Card>

      <Card
        eyebrow="What BUSY has learned"
        title={
          strongestEvidencePattern || learnedChoiceRows.length
            ? "The engine can explain what is affecting the ranking"
            : "BUSY is still building business-specific evidence"
        }
        body={
          strongestEvidencePattern
            ? `${strongestEvidencePattern.title} currently has the strongest measured evidence effect at ${Number(strongestEvidencePattern.memoryAdjustment || 0) > 0 ? "+" : ""}${Number(strongestEvidencePattern.memoryAdjustment || 0)} ranking points. Owner choices are applied separately and remain bounded.`
            : "There is not enough recorded outcome evidence for a strong pattern yet. BUSY will stay cautious and learn as real results and owner choices accumulate."
        }
        footer="No hidden personality profile — only saved business evidence, explicit choices and owner rules"
        tone="blue"
      >
        {learnedChoiceRows.slice(0, 4).map((item) => (
          <MetricRow
            key={item.family}
            left={item.label}
            right={`${item.accepted} chosen • ${item.dismissed} dismissed • ${item.rankingEffect > 0 ? "+" : ""}${item.rankingEffect}`}
            strong={item.rankingEffect !== 0}
          />
        ))}
      </Card>

      <Text style={styles.sectionLabel}>Evidence ledger</Text>
      {patterns.map((pattern) => {
        const evidence = pattern.evidence || {};
        const freshness = pattern.freshness || {};
        const hasObservedRate =
          evidence.observedRate !== null && evidence.observedRate !== undefined;
        const memoryPattern =
          memoryPatterns.find((item) => item.key === pattern.key) || null;
        const adjustment = Number(
          memoryPattern?.memoryAdjustment ?? pattern.effectiveAdjustment ?? 0
        );
        return (
          <Card
            key={pattern.key}
            eyebrow={pattern.title}
            title={
              evidence.sample
                ? `${evidence.successes || 0} ${pattern.outcomeLabel.toLowerCase()} from ${evidence.sample} recorded outcome${evidence.sample === 1 ? "" : "s"}`
                : "No recorded outcome evidence yet"
            }
            body={
              evidence.evidenceReady
                ? "This outcome can contribute to recommendations, but V3.21 applies the separate memory-confidence stage and freshness limit before it affects ranking."
                : evidence.sample
                ? "BUSY can see the early evidence but the sample is still too small to drive a strong recommendation."
                : "BUSY falls back to cautious planning assumptions until this business records real outcomes."
            }
            footer={
              pattern.lastUpdated
                ? `Last evidence: ${formatUKDate(String(pattern.lastUpdated).slice(0, 10))} • ${freshness.label}`
                : "No dated evidence yet"
            }
            tone={
              freshness.stale && evidence.sample
                ? "amber"
                : evidence.evidenceReady
                ? "green"
                : "blue"
            }
          >
            <MetricRow left="Sample size" right={String(evidence.sample || 0)} />
            <MetricRow left={pattern.outcomeLabel} right={String(evidence.successes || 0)} />
            <MetricRow
              left="Observed rate"
              right={hasObservedRate ? formatPercent(evidence.observedRate) : "Not enough data"}
            />
            <MetricRow left="Confidence" right={evidence.confidence || "No evidence yet"} />
            <MetricRow left="Memory stage" right={memoryPattern?.stage?.label || "Too early to tell"} />
            <MetricRow left="Freshness" right={freshness.label || "Unknown"} />
            <MetricRow
              left="Current ranking adjustment"
              right={adjustment > 0 ? `+${adjustment}` : String(adjustment)}
              strong={adjustment !== 0}
            />
          </Card>
        );
      })}

      <Card
        eyebrow="Freshness rule"
        title="Old evidence stays visible but loses influence"
        body="BUSY does not forget a real result just because time passed. Instead, the ranking effect is reduced as evidence ages, so an old pattern cannot remain confidently dominant forever."
        footer="Fresh ≤30d • Current ≤90d • Ageing ≤180d • then Stale"
        tone="blue"
      />

      <Text style={styles.sectionLabel}>Social evidence by destination</Text>
      {channels.map((item) => (
        <Card
          key={item.channel}
          eyebrow={item.channel}
          title={
            item.sample
              ? `${item.successes} booking outcome${item.successes === 1 ? "" : "s"} from ${item.sample} recorded result${item.sample === 1 ? "" : "s"}`
              : "No recorded outcome evidence yet"
          }
          body={
            item.sample < 3
              ? "BUSY will not make a strong channel conclusion from this sample."
              : "This can contribute to social recommendations, but it still does not prove the channel caused the booking."
          }
          footer={`Confidence: ${item.confidence}`}
          tone={item.sample >= 3 ? "blue" : "amber"}
        >
          <MetricRow
            left="Observed booking rate"
            right={
              item.observedRate === null || item.observedRate === undefined
                ? "Not enough data"
                : formatPercent(item.observedRate)
            }
          />
        </Card>
      ))}

      <Text style={styles.sectionLabel}>Teach BUSY a hard rule</Text>
      <Card
        eyebrow="Owner authority"
        title="Rules you set outrank learned patterns"
        body="Examples: don't recommend social posts for roof cleaning; don't travel over 20 miles for jobs under £200; never use customer faces in social posts."
        footer="BUSY applies a rule only where the app has the evidence needed to do so safely"
        tone="green"
      />
      <TextInput
        multiline
        value={s.businessBrainRuleDraft}
        onChangeText={s.setBusinessBrainRuleDraft}
        placeholder="Type a rule BUSY should respect…"
        placeholderTextColor="#9AA3B2"
        style={styles.messageInput}
      />
      <Button
        label="Save owner rule"
        primary
        disabled={!s.businessBrainRuleDraft.trim()}
        onPress={s.saveBusinessBrainRule}
      />

      {(s.businessBrainRules || []).map((rule) => {
        const families = manualRuleTargetFamilies(rule);
        const targetText = families.length
          ? families.map(businessBrainFamilyLabel).join(", ")
          : "Used where relevant evidence exists";
        return (
          <View key={rule.id} style={styles.activityCard}>
            <View style={styles.activityTopRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.activityName}>{rule.text}</Text>
                <Text style={styles.activityService}>
                  {rule.scope || businessBrainRuleScope(rule.text)} • {rule.source || "Owner rule"}
                </Text>
              </View>
              <StatusChip label="Owner rule" tone="green" />
            </View>
            <Text style={styles.activitySummary}>
              {rule.targetService ? `${targetText} • ${rule.targetService}` : targetText}
            </Text>
            <Pressable
              onPress={() => s.removeBusinessBrainRule(rule.id)}
              style={styles.removeCustomerWrap}
            >
              <Text style={styles.removeCustomerText}>Remove rule</Text>
            </Pressable>
          </View>
        );
      })}

      <Text style={styles.sectionLabel}>Recent recommendation feedback</Text>
      {feedback.length ? (
        feedback.slice(0, 8).map((item) => (
          <View key={item.id} style={styles.activityCard}>
            <View style={styles.activityTopRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.activityName}>{item.reason}</Text>
                <Text style={styles.activityService}>
                  {businessBrainFamilyLabel(item.family)}
                  {item.service ? ` • ${item.service}` : ""}
                </Text>
              </View>
              <StatusChip
                label={
                  item.signal === "accepted"
                    ? `+${Number(item.boost || 2)} ranking`
                    : item.penalty
                    ? `${item.penalty} ranking`
                    : "No ranking change"
                }
                tone={item.signal === "accepted" ? "green" : item.penalty ? "amber" : "blue"}
              />
            </View>
            <Text style={styles.activitySummary}>{item.title || "Recommendation feedback"}</Text>
            <Text style={styles.activityOpen}>
              {item.recordedAt
                ? `Recorded ${formatUKDate(String(item.recordedAt).slice(0, 10))}`
                : "Recorded feedback"}
            </Text>
          </View>
        ))
      ) : (
        <Card
          eyebrow="No feedback yet"
          title="BUSY has not learned from an optional recommendation choice yet"
          body="Choose or dismiss an optional Home recommendation and BUSY will remember that narrow preference alongside the real outcome evidence."
          tone="blue"
        />
      )}

      <Card
        eyebrow="What BUSY will not do"
        title="Feedback cannot hide real customer obligations"
        body="A marketing preference can reduce or block future opportunities, but it cannot suppress a waiting enquiry, a confirmed booking, a promised follow-up or another live customer commitment."
        tone="green"
      />

      <Button label="Back to Home" primary onPress={() => s.jump("home", "Home")} />
      <Button label="Social Media" onPress={() => s.go("socialMedia")} />
    </Shell>
  );
}


export {
  SocialMediaCentre,
  SocialCreator,
  SocialDraftReview,
  OpportunityFeedback,
  BusinessBrain
};
