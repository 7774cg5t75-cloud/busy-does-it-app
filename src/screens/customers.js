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


function NewEnquiry({ s }) {
  const effectiveService = s.newEnquiryCustomService.trim() || s.newEnquiryService.trim();
  const canSave = !!s.newEnquiryName.trim() && !!s.newEnquiryPhone.trim() && !!effectiveService;
  return (
    <Shell
      s={s}
      title="New enquiry"
      subtitle="Add somebody who phoned, messaged or asked for work. Record when the enquiry actually arrived so BUSY DOES IT can judge its age."
      brandCue="Capture the customer once. Turn the enquiry into the next sensible action."
    >
      <Field label="Customer name" value={s.newEnquiryName} onChangeText={s.setNewEnquiryName} placeholder="e.g. Jane Smith" />
      <Field label="Phone" value={s.newEnquiryPhone} onChangeText={s.setNewEnquiryPhone} placeholder="e.g. 07700 900000" keyboardType="phone-pad" />
      <Field
        label="Job address / postcode (optional)"
        value={s.newEnquiryAddress}
        onChangeText={s.setNewEnquiryAddress}
        placeholder="Where is the work?"
      />

      <Text style={styles.fieldLabel}>What do they need?</Text>
      {s.services.map((service) => (
        <Choice
          key={service.id}
          label={service.name}
          selected={!s.newEnquiryCustomService.trim() && s.newEnquiryService === service.name}
          onPress={() => {
            s.setNewEnquiryService(service.name);
            s.setNewEnquiryCustomService("");
          }}
        />
      ))}
      <Field
        label="Or type another service"
        value={s.newEnquiryCustomService}
        onChangeText={s.setNewEnquiryCustomService}
        placeholder="e.g. Conservatory cleaning"
      />
      <Text style={styles.helper}>
        {s.newEnquiryCustomService.trim()
          ? `Using custom service: ${s.newEnquiryCustomService.trim()}`
          : `Selected service: ${s.newEnquiryService}`}
      </Text>

      <DatePickerField
        label="Enquiry received"
        value={s.newEnquiryDate}
        onChange={s.setNewEnquiryDate}
      />
      <Card
        eyebrow="Automatic admin"
        title={`BUSY will check this again on ${formatUKDate(addDaysFromISO(s.newEnquiryDate || dateToISO(new Date()), 7))}`}
        body="If no quote, booking or follow-up has been recorded by then, the enquiry can become a quiet-enquiry opportunity automatically."
        tone="blue"
      />

      <Text style={styles.fieldLabel}>Note (optional)</Text>
      <TextInput
        multiline
        value={s.newEnquiryNote}
        onChangeText={s.setNewEnquiryNote}
        placeholder="What did they ask for?"
        placeholderTextColor="#9AA3B2"
        style={styles.messageInput}
      />

      <Button label="Save enquiry" primary disabled={!canSave} onPress={s.saveNewEnquiry} />
      <Button label="Cancel" onPress={s.back} />
    </Shell>
  );
}

function CustomerRecords({ s }) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const visibleCustomers = s.customers.filter((customer) =>
    !query ||
    [customer.name, customer.phone, customer.email, customer.address, customer.service]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  );

  return (
    <Shell
      s={s}
      title="Customer records"
      subtitle="One customer list for enquiries, previous customers and completed work."
      brandCue={`${s.verticalPack.label} rules are loaded underneath — the customer system itself stays generic.`}
    >
      <Card
        eyebrow="V3.31 • Customer journeys"
        title={`${s.customers.length} customer${s.customers.length === 1 ? "" : "s"} • one joined lifecycle each`}
        body={
          s.customerContact
            ? "BUSY now joins enquiry, quote, booking, completed jobs, follow-ups and repeat timing around the customer instead of treating each step as a separate record."
            : "Previous-customer contact is switched off in Settings. Journey history still remains visible, but BUSY will not recommend outbound reactivation."
        }
        footer="Open a customer to see the full timeline, recorded communication and the single recommended next step."
        tone={(s.customerJourneyWarningCount || 0) > 0 ? "amber" : "green"}
      >
        <MetricRow
          left="Journeys needing review"
          right={String(s.customerJourneyWarningCount || 0)}
          strong={(s.customerJourneyWarningCount || 0) > 0}
        />
        <MetricRow
          left="Customers with a next action"
          right={String(s.customerJourneyNextActionCount || 0)}
        />
        <MetricRow
          left="Repeat customers due"
          right={String(s.eligibleCustomers.length || 0)}
        />
      </Card>
      <Field
        label="Find a customer"
        value={search}
        onChangeText={setSearch}
        placeholder="Name, phone, email, address or service"
      />
      {query ? (
        <Text style={styles.helper}>
          {visibleCustomers.length
            ? `Showing ${visibleCustomers.length} matching customer${visibleCustomers.length === 1 ? "" : "s"}.`
            : "No customer records match that search."}
        </Text>
      ) : null}
      {visibleCustomers.map((customer) => {
        const eligible = s.customerContact && isEligibleCustomer(customer, s.services, s.verticalId);
        const action = s.replyActions?.[customer.id] || null;
        const journey = (s.customerJourneys || []).find(
          (item) => item.customerId === customer.id
        ) || null;
        const pipelineLabel = customerPipelineLabel(customer, action);
        const activeAction = isActiveCustomerAction(action);
        const hasOpenEnquiry = !!(customer.currentEnquiryAt || (!customer.lastServiceDate && customer.createdAt));
        const enquiryTimestamp = customer.currentEnquiryAt || customer.createdAt;
        const enquiryAge = hasOpenEnquiry ? daysSinceTimestamp(enquiryTimestamp) : null;
        const statusLabel =
          pipelineLabel ||
          (hasOpenEnquiry
            ? customer.enquiryFollowUpOutcomeRecordedAt
              ? customer.enquiryFollowUpOutcome || "Follow-up recorded"
              : customer.enquiryFollowUpSentAt
              ? "Follow-up sent"
              : enquiryAge !== null && enquiryAge >= 7
              ? `Quiet ${enquiryAge}d`
              : "New enquiry"
            : eligible
            ? "Eligible now"
            : customer.contactOk
            ? (s.customerContact ? "Not due" : "Contact off")
            : "Do not contact");
        return (
          <View key={customer.id} style={styles.customerRecord}>
            <View style={styles.customerRecordTop}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerMeta}>{customer.phone || customer.email || "No contact detail"}</Text>
                {customer.phone && customer.email ? <Text style={styles.customerMeta}>{customer.email}</Text> : null}
              </View>
              <StatusChip
                label={
                  (journey?.stalledSignals?.length || 0) > 0
                    ? `${statusLabel} • review`
                    : statusLabel
                }
                tone={
                  (journey?.stalledSignals?.length || 0) > 0
                    ? "amber"
                    : activeAction || eligible || hasOpenEnquiry
                    ? "green"
                    : "blue"
                }
              />
            </View>
            <Text style={styles.customerService}>{customer.service}</Text>
            <Text style={styles.customerMeta}>
              {customer.lastServiceDate
                ? `Last job: ${formatUKDate(customer.lastServiceDate)} • ${formatMonthsAgo(customer.lastServiceDate)}`
                : enquiryTimestamp
                ? `Enquiry: ${formatUKDate(String(enquiryTimestamp).slice(0, 10))} • ${enquiryAgeLabel(enquiryTimestamp)}`
                : "No completed job recorded yet"}
              {Number(customer.lastJobValue) > 0 ? ` • £${customer.lastJobValue}` : ""}
            </Text>
            {journey?.nextAction?.title ? (
              <Text style={styles.customerMeta}>
                Next: {journey.nextAction.title}
              </Text>
            ) : null}
            <View style={styles.customerActionsRow}>
              <Pressable onPress={() => s.openCustomer(customer.id)} style={styles.customerOpenWrap}>
                <Text style={styles.customerOpenText}>Open customer</Text>
              </Pressable>
              <Pressable onPress={() => s.startEditCustomer(customer)} style={styles.customerEditWrap}>
                <Text style={styles.customerEditText}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => s.requestRemoveCustomer(customer.id)} style={styles.removeCustomerWrap}>
                <Text style={styles.removeCustomerText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
      <Button label="Quick capture" primary onPress={s.startQuickCapture} />
      <Button label="+ New enquiry manually" onPress={s.startNewEnquiry} />
      <Button label="Open customer pipeline" onPress={() => s.go("workPipeline")} />
      <Button label="+ Add previous customer" onPress={s.startNewCustomer} />
      {s.eligibleCustomers.length ? <Button label="Review customers worth contacting" onPress={() => s.go("eligibleCustomers")} /> : null}
      <Button label="Done" onPress={s.back} />
    </Shell>
  );
}

function CustomerDetail({ s }) {
  const customer = s.selectedCustomer;
  if (!customer) {
    return (
      <Shell s={s} title="Customer unavailable" subtitle="That customer record could not be found.">
        <Button label="Back" primary onPress={s.back} />
      </Shell>
    );
  }

  const action = s.replyActions?.[customer.id] || null;
  const journey = s.selectedCustomerJourney || null;
  const history = Array.isArray(customer.history) ? [...customer.history] : [];
  const activity = Array.isArray(customer.activity)
    ? [...customer.activity].sort((a, b) => String(b.createdAt || b.date || "").localeCompare(String(a.createdAt || a.date || "")))
    : [];
  const baselineExists = history.some(
    (item) => item.date === customer.lastServiceDate && item.service === customer.service
  );
  const timeline = [
    ...history,
    ...(!baselineExists && customer.lastServiceDate
      ? [{
          id: `baseline-${customer.id}`,
          kind: "job",
          date: customer.lastServiceDate,
          service: customer.service,
          value: customer.lastJobValue,
          note: "Previously recorded job",
        }]
      : []),
  ].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const repeatDueDate = nextRepeatDueDate(customer, s.services, s.verticalId);
  const actionStatus = action
    ? !action.done
      ? "In progress"
      : action.type === "quote"
      ? action.details?.quoteStatus || "Prepared"
      : action.type === "booking"
      ? action.details?.bookingStatus || "Confirmed"
      : action.details?.reminderStatus || "Scheduled"
    : null;
  const actionIsFinished =
    !action ||
    (action.type === "quote" && ["Declined"].includes(actionStatus)) ||
    (action.type === "booking" && ["Completed", "Cancelled"].includes(actionStatus)) ||
    (action.type === "reminder" && actionStatus === "Completed");

  return (
    <Shell
      s={s}
      title={customer.name}
      subtitle="Contact details, live work and history in one place."
      brandCue="One customer. One clear history."
    >
      <Card
        eyebrow={customer.lastServiceDate ? "Customer" : "New enquiry"}
        title={customer.service}
        body={
          [
            customer.phone || null,
            customer.email || null,
            customer.address || null,
          ].filter(Boolean).join("\n") || "No contact details saved"
        }
        footer={customer.contactOk ? "Contact allowed" : "Do not contact"}
        tone="green"
      >
        <MetricRow
          left="Stage"
          right={
            customerPipelineLabel(customer, action) ||
            customer.lifecycleStatus ||
            (customer.lastServiceDate ? "Previous customer" : "New enquiry")
          }
        />
        <MetricRow left="Last job" right={customer.lastServiceDate ? formatUKDate(customer.lastServiceDate) : "No completed job yet"} />
        {(customer.currentEnquiryAt || (!customer.lastServiceDate && customer.createdAt)) ? (
          <MetricRow
            left="Current enquiry received"
            right={formatUKDate(String(customer.currentEnquiryAt || customer.createdAt).slice(0, 10))}
            strong={daysSinceTimestamp(customer.currentEnquiryAt || customer.createdAt) >= 7}
          />
        ) : null}
        <MetricRow left="Last value" right={Number(customer.lastJobValue) > 0 ? `£${customer.lastJobValue}` : "Not recorded"} />
        {repeatDueDate ? (
          <MetricRow
            left="Repeat timing"
            right={repeatDueDate <= dateToISO(new Date()) ? "Due now" : formatUKDate(repeatDueDate)}
            strong={repeatDueDate <= dateToISO(new Date())}
          />
        ) : null}
        {customer.lastActivityAt ? (
          <MetricRow
            left="Last record update"
            right={formatUKDate(String(customer.lastActivityAt).slice(0, 10))}
          />
        ) : null}
        {Array.isArray(customer.sourceRecords) && customer.sourceRecords.length ? (
          <MetricRow
            left="Captured source items"
            right={String(customer.sourceRecords.length)}
          />
        ) : null}
        {Array.isArray(customer.sourceRecords) && customer.sourceRecords.some((record) => record.reconciled) ? (
          <MetricRow
            left="Reconciled lifecycle stages"
            right={String(customer.sourceRecords.filter((record) => record.reconciled).length)}
            strong
          />
        ) : null}
      </Card>

      {journey ? (
        <Card
          eyebrow="V3.31 • Customer Command Centre"
          title={journey.nextAction?.title || "Customer journey is up to date"}
          body={
            journey.nextAction?.body ||
            "BUSY has combined this customer's enquiry, live work, completed jobs, follow-ups and recorded communication into one journey."
          }
          footer={
            journey.nextAction?.why ||
            "One relationship • one timeline • no duplicate customer chasing"
          }
          tone={(journey.stalledSignals?.length || 0) ? "amber" : "green"}
        >
          <MetricRow
            left="Journey stage"
            right={journey.lifecycleStatus || "Customer"}
            strong
          />
          <MetricRow
            left="Completed jobs"
            right={String(journey.relationship?.completedJobs || 0)}
          />
          <MetricRow
            left="Recorded completed value"
            right={`£${Math.round(Number(journey.relationship?.completedValue || 0))}`}
            strong={Number(journey.relationship?.completedValue || 0) > 0}
          />
          <MetricRow
            left="Recorded communications"
            right={String(journey.relationship?.communicationCount || 0)}
          />
          <MetricRow
            left="Journey warnings"
            right={String(journey.stalledSignals?.length || 0)}
            strong={(journey.stalledSignals?.length || 0) > 0}
          />
          {journey.nextAction?.actionLabel ? (
            <Button
              label={journey.nextAction.actionLabel}
              primary
              onPress={() => s.openCustomerJourneyNext(journey.nextAction)}
            />
          ) : null}
          <Button
            label={`Ask BUSY about ${String(customer.name || "this customer").split(" ")[0]}`}
            onPress={() => s.askBusyAboutCustomer(customer.id)}
          />
        </Card>
      ) : null}

      {journey?.stalledSignals?.length ? (
        <>
          <Text style={styles.sectionLabel}>Needs attention</Text>
          {journey.stalledSignals.map((signal) => (
            <Card
              key={signal.id}
              eyebrow={signal.level === "High" ? "Stalled journey" : "Worth reviewing"}
              title={signal.title}
              body={signal.body}
              tone={signal.level === "High" ? "amber" : "blue"}
            />
          ))}
        </>
      ) : null}

      {journey?.timeline?.length ? (
        <>
          <Text style={styles.sectionLabel}>Full customer journey</Text>
          {journey.timeline.slice(0, 12).map((item) => (
            <View key={item.id} style={styles.customerTimelineCard}>
              <View style={styles.activityTopRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.customerTimelineLabel}>
                    {String(item.kind || "activity").replace(/-/g, " ").toUpperCase()}
                  </Text>
                  <Text style={styles.activityName}>{item.title || "Customer update"}</Text>
                </View>
                {item.status ? (
                  <StatusChip
                    label={item.status}
                    tone={["Cancelled", "Declined"].includes(item.status) ? "blue" : "green"}
                  />
                ) : null}
              </View>
              <Text style={styles.activitySummary}>
                {item.date ? formatUKDate(item.date) : "Date not recorded"}
                {Number(item.value) > 0 ? ` • £${item.value}` : ""}
              </Text>
              {item.body ? <Text style={styles.customerHistoryNote}>{item.body}</Text> : null}
            </View>
          ))}
        </>
      ) : null}

      {journey?.communicationHistory?.length ? (
        <>
          <Text style={styles.sectionLabel}>Communication history</Text>
          {journey.communicationHistory.slice(0, 8).map((item) => (
            <View key={`communication-${item.id}`} style={styles.customerHistoryRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.customerHistoryTitle}>{item.title}</Text>
                <Text style={styles.customerMeta}>
                  {item.date ? formatUKDate(item.date) : "Date not recorded"}
                  {item.status ? ` • ${item.status}` : ""}
                </Text>
                {item.body ? <Text style={styles.customerHistoryNote}>{item.body}</Text> : null}
              </View>
            </View>
          ))}
        </>
      ) : null}

      {(customer.currentEnquiryAt || (!customer.lastServiceDate && customer.createdAt)) && !action ? (
        customer.enquiryFollowUpSentAt ? (
          <Pressable
            onPress={() =>
              customer.enquiryFollowUpOutcomeRecordedAt
                ? null
                : s.openEnquiryFollowUpOutcome(customer.id)
            }
            style={styles.customerTimelineCard}
          >
            <View style={styles.activityTopRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.customerTimelineLabel}>QUIET ENQUIRY FOLLOW-UP</Text>
                <Text style={styles.activityName}>
                  {customer.enquiryFollowUpOutcomeRecordedAt ? customer.enquiryFollowUpOutcome : "Awaiting outcome"}
                </Text>
              </View>
              <StatusChip
                label={customer.enquiryFollowUpOutcomeRecordedAt ? "Recorded" : "Learn"}
                tone={customer.enquiryFollowUpOutcomeRecordedAt ? "green" : "blue"}
              />
            </View>
            <Text style={styles.activitySummary}>{customer.enquiryFollowUpDraft || "Prepared follow-up"}</Text>
            {!customer.enquiryFollowUpOutcomeRecordedAt ? (
              <Text style={styles.activityOpen}>Record what happened →</Text>
            ) : null}
          </Pressable>
        ) : daysSinceTimestamp(customer.currentEnquiryAt || customer.createdAt) >= 7 && customer.contactOk !== false ? (
          <Pressable onPress={() => s.prepareEnquiryFollowUp(customer.id)} style={styles.customerTimelineCard}>
            <View style={styles.activityTopRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.customerTimelineLabel}>QUIET ENQUIRY</Text>
                <Text style={styles.activityName}>No next action for {daysSinceTimestamp(customer.currentEnquiryAt || customer.createdAt)} days</Text>
              </View>
              <StatusChip label="£0 opportunity" tone="green" />
            </View>
            <Text style={styles.activitySummary}>BUSY DOES IT can prepare a low-pressure check-in from this record.</Text>
            <Text style={styles.activityOpen}>Prepare follow-up →</Text>
          </Pressable>
        ) : null
      ) : null}

      {action ? (
        <Pressable onPress={() => s.openSavedReplyAction(customer.id)} style={styles.customerTimelineCard}>
          <View style={styles.activityTopRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.customerTimelineLabel}>CURRENT CUSTOMER ACTION</Text>
              <Text style={styles.activityName}>
                {action.type === "quote" ? "Quote" : action.type === "booking" ? "Booking" : "Follow-up"}
              </Text>
            </View>
            <StatusChip label={actionStatus} tone={["Cancelled", "Declined"].includes(actionStatus) ? "blue" : "green"} />
          </View>
          <Text style={styles.activitySummary}>{action.details?.summary || action.task || "Open action"}</Text>
          <Text style={styles.activityOpen}>Open / edit →</Text>
        </Pressable>
      ) : null}

      {actionIsFinished ? (
        <>
          <Card
            eyebrow={action ? "Next customer action" : customer.lastServiceDate ? "What next?" : "Enquiry captured"}
            title={
              action
                ? "Start something new for this customer"
                : customer.lastServiceDate
                ? "Turn this customer into work"
                : "Choose the real next step"
            }
            body={
              customer.lastServiceDate
                ? "Start the action that matches what is happening in the real conversation. You do not need a simulated reply first."
                : "The enquiry is saved. Prepare a quote, book agreed work or set a follow-up without re-entering the customer."
            }
            tone={customer.lastServiceDate ? "blue" : "green"}
          />
          <Button label="Create quote" primary onPress={() => s.startDirectCustomerAction(customer.id, "quote")} />
          <Button label="Book a job" onPress={() => s.startDirectCustomerAction(customer.id, "booking")} />
          <Button label="Set a follow-up" onPress={() => s.startDirectCustomerAction(customer.id, "reminder")} />
        </>
      ) : null}

      <Text style={styles.sectionLabel}>Notes & activity</Text>
      <TextInput
        multiline
        value={s.customerNoteText}
        onChangeText={s.setCustomerNoteText}
        placeholder="Add a quick note about this customer"
        placeholderTextColor="#9AA3B2"
        style={styles.messageInput}
      />
      <Button label="Add note" disabled={!s.customerNoteText.trim()} onPress={() => s.addCustomerNote(customer.id)} />

      {activity.length ? activity.slice(0, 12).map((item) => (
        <View key={item.id} style={styles.customerHistoryRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerHistoryTitle}>{item.title || "Customer update"}</Text>
            <Text style={styles.customerMeta}>{item.date ? formatUKDate(item.date) : "Date not recorded"}</Text>
            {item.note ? <Text style={styles.customerHistoryNote}>{item.note}</Text> : null}
          </View>
          {Number(item.value) > 0 ? <Text style={styles.customerHistoryValue}>£{item.value}</Text> : null}
        </View>
      )) : (
        <Text style={styles.helper}>No notes or activity saved yet.</Text>
      )}

      <Text style={styles.sectionLabel}>Completed job history</Text>
      {timeline.length ? timeline.map((item) => (
        <View key={item.id || `${item.date}-${item.service}`} style={styles.customerHistoryRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.customerHistoryTitle}>{item.service || customer.service}</Text>
            <Text style={styles.customerMeta}>{item.date ? formatUKDate(item.date) : "Date not recorded"}</Text>
            {item.note ? <Text style={styles.customerHistoryNote}>{item.note}</Text> : null}
            {Array.isArray(item.photos) && item.photos.length ? (
              <>
                <Text style={styles.customerHistoryPhotoMeta}>
                  {item.photos.length} job photo{item.photos.length === 1 ? "" : "s"}
                  {item.postDraft
                    ? item.postDraftStatus === "Simulated published"
                      ? " • post approved"
                      : " • post draft ready"
                    : ""}
                  {item.postOutcomeRecordedAt ? ` • ${item.postOutcome}` : ""}
                </Text>
                <Pressable onPress={() => s.openJobAssets(customer.id, item.id)} style={styles.customerHistoryPhotoLink}>
                  <Text style={styles.customerHistoryPhotoLinkText}>Open photos / draft →</Text>
                </Pressable>
              </>
            ) : null}
            {item.kind === "job" &&
            !String(item.id || "").startsWith("baseline-") &&
            Array.isArray(item.photos) &&
            item.photos.some((photo) => photo.marketingOk) &&
            (customer.nextRepeatDueDate || item.repeatDueDate) ? (
              <Pressable
                onPress={() => s.openPostJobBundle(customer.id, item.id)}
                style={styles.customerHistoryPhotoLink}
              >
                <Text style={styles.customerHistoryPhotoLinkText}>Use this job for the next best actions →</Text>
              </Pressable>
            ) : null}
            {item.kind === "job" && !String(item.id || "").startsWith("baseline-") && customer.contactOk !== false ? (
              item.reviewRequestSentAt ? (
                item.reviewRequestOutcomeRecordedAt ? (
                  <Text style={styles.customerHistoryPhotoMeta}>
                    Review request • {item.reviewRequestOutcome}
                  </Text>
                ) : (
                  <Pressable
                    onPress={() => s.openReviewRequestOutcome(customer.id, item.id)}
                    style={styles.customerHistoryPhotoLink}
                  >
                    <Text style={styles.customerHistoryPhotoLinkText}>Record review outcome →</Text>
                  </Pressable>
                )
              ) : (
                <Pressable
                  onPress={() => s.prepareReviewRequest(customer.id, item.id)}
                  style={styles.customerHistoryPhotoLink}
                >
                  <Text style={styles.customerHistoryPhotoLinkText}>Prepare review request →</Text>
                </Pressable>
              )
            ) : null}
          </View>
          <Text style={styles.customerHistoryValue}>{Number(item.value) > 0 ? `£${item.value}` : "—"}</Text>
        </View>
      )) : (
        <Card eyebrow="History" title="No completed jobs saved yet" body="Completed bookings will build this customer’s job history automatically." />
      )}

      <Button label="Edit customer record" onPress={() => s.startEditCustomer(customer)} />
      <Button label="Back to customers" primary onPress={s.back} />
    </Shell>
  );
}

function JobCompletePhotos({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  if (!customer || !job) {
    return (
      <Shell s={s} title="Job saved" subtitle="The completed job is saved, but the photo step could not be opened.">
        <Button label="Back" primary onPress={s.back} />
      </Shell>
    );
  }
  return (
    <Shell s={s} title="Job complete" subtitle={`${customer.name} • ${job.service || customer.service}`} brandCue="Save the useful proof once. Reuse it only with permission.">
      <Card eyebrow="Completed work" title={job.service || customer.service} body={`${job.date ? formatUKDate(job.date) : "Date saved"}${Number(job.value) > 0 ? ` • £${job.value}` : ""}`} footer="Saved to this customer’s job history" tone="green" />
      <Card
        eyebrow="BUSY already handled"
        title="The follow-on admin is prepared"
        body={
          `${job.reviewRequestDraft ? "Review request drafted. " : ""}${
            job.repeatDueDate
              ? `Repeat timing saved for ${formatUKDate(job.repeatDueDate)}. `
              : "No repeat reminder was invented for this service. "
          }Nothing has been sent.`
        }
        footer="You stay in control"
        tone="blue"
      />
      <Card eyebrow="Optional next step" title="Got any photos from this job?" body="Choose only the photos you want attached to this job. BUSY DOES IT does not browse the rest of your camera roll, and nothing is posted automatically." tone="blue" />
      <Button label="Add job photos" primary onPress={() => s.go("jobPhotos")} />
      <Button label="Review all follow-on actions" onPress={() => s.openPostJobBundle(customer.id, job.id)} />
      <Button label="Skip for now" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function JobPhotos({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  if (!customer || !job) {
    return <Shell s={s} title="Job photos" subtitle="The selected job could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell s={s} title="Job photos" subtitle={`${customer.name} • ${job.service || customer.service}`} brandCue="You choose the exact images. BUSY DOES IT only sees what you select.">
      <Card eyebrow="Privacy first" title={s.pendingJobPhotos.length ? `${s.pendingJobPhotos.length} photo${s.pendingJobPhotos.length === 1 ? "" : "s"} selected` : "No photos selected yet"} body="A photo can stay attached privately to the job. Allowing future marketing suggestions still does not publish it — you approve public use separately." tone="green" />
      <Button label={s.pendingJobPhotos.length ? "Choose more / different photos" : "Choose photos"} primary={!s.pendingJobPhotos.length} onPress={s.chooseJobPhotos} />
      {s.pendingJobPhotos.length ? (
        <View style={styles.photoGrid}>
          {s.pendingJobPhotos.map((photo) => (
            <View key={photo.id || photo.uri} style={styles.photoTile}>
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              <Pressable onPress={() => s.removePendingJobPhoto(photo.id)} style={styles.photoRemove}><Text style={styles.photoRemoveText}>Remove</Text></Pressable>
            </View>
          ))}
        </View>
      ) : null}
      {s.pendingJobPhotos.length ? (
        <ToggleRow title="Let BUSY DOES IT suggest these later" body="Makes these selected photos available for future post/profile/ad suggestions. Nothing is posted without another approval." value={s.jobPhotosMarketingOk} onValueChange={s.setJobPhotosMarketingOk} />
      ) : null}
      {job.postDraft ? (
        <Card eyebrow="Saved draft" title="A finished-job post draft is ready" body="It is stored locally and has not been posted anywhere." tone="blue">
          <Button label="Open saved post draft" onPress={s.openJobPostDraft} />
        </Card>
      ) : null}
      <Button label={s.pendingJobPhotos.length ? "Save job photos" : "Save without photos"} primary={!!s.pendingJobPhotos.length} onPress={s.saveJobPhotos} />
      <Button label="Back to customer" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function JobPhotoOpportunity({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  const allowedPhotos = (job?.photos || []).filter((photo) => photo.marketingOk);
  if (!customer || !job) {
    return <Shell s={s} title="Free next move" subtitle="The completed job could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell s={s} title="Free next move" subtitle="Use work you already completed before buying more attention." brandCue="Existing proof first. Paid reach later.">
      <Card eyebrow="Finished-job content" title={`Turn ${allowedPhotos.length} job photo${allowedPhotos.length === 1 ? "" : "s"} into a post?`} body={`${customer.name}’s ${(job.service || customer.service).toLowerCase()} job is already saved. BUSY DOES IT can prepare a simple post draft using only the photos you approved for suggestions.`} footer="Cost: £0 • nothing posts without approval" tone="green" />
      <Button label="Prepare a post" primary disabled={!allowedPhotos.length} onPress={s.prepareJobPost} />
      <Button label="Not now" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function PostJobBundle({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  if (!customer || !job) {
    return (
      <Shell
        s={s}
        title="Use this completed job"
        subtitle="The completed job could not be found."
      >
        <Button label="Back" primary onPress={s.back} />
      </Shell>
    );
  }

  const approvedPhotos = (Array.isArray(job.photos) ? job.photos : []).filter(
    (photo) => photo.marketingOk
  );
  const reviewReady =
    customer.contactOk !== false &&
    !job.reviewRequestSentAt;
  const postReady =
    approvedPhotos.length > 0 &&
    !["Published", "Simulated published"].includes(job.postDraftStatus);
  const repeatDue =
    customer.nextRepeatDueDate ||
    job.repeatDueDate ||
    "";
  const reviewPrepared = !!job.reviewRequestDraft;
  const postPrepared = !!job.postDraft;

  return (
    <Shell
      s={s}
      title="Use this completed job"
      subtitle="One saved job can create several useful follow-on actions without typing the same information three times."
      brandCue="Prepare underneath. Keep customer contact and public posting under your control."
    >
      <Card
        eyebrow="V3.16 • Completed-job bundle"
        title={`${customer.name} • ${job.service || customer.service}`}
        body="BUSY has linked the sensible follow-ons around this real completed job: review, social proof and repeat-service timing."
        footer={job.value ? `Recorded job value: £${job.value}` : "Recorded job value not set"}
        tone="green"
      >
        <MetricRow left="Review request" right={job.reviewRequestSentAt ? "Already sent" : reviewPrepared ? "Prepared" : reviewReady ? "Can prepare" : "Not available"} strong={reviewPrepared && !job.reviewRequestSentAt} />
        <MetricRow left="Finished-job post" right={["Published", "Simulated published"].includes(job.postDraftStatus) ? "Already published" : postPrepared ? "Prepared" : postReady ? "Can prepare" : approvedPhotos.length ? "Needs review" : "No approved photos"} strong={postPrepared && !["Published", "Simulated published"].includes(job.postDraftStatus)} />
        <MetricRow left="Repeat timing" right={repeatDue ? formatUKDate(repeatDue) : "No repeat date available"} strong={!!repeatDue} />
      </Card>

      <Button
        label="Prepare all safe next steps"
        primary
        onPress={s.preparePostJobBundle}
      />
      <Text style={styles.helper}>
        This button only prepares internal drafts/timing. It does not message the customer, publish anything or spend money.
      </Text>

      <Text style={styles.sectionLabel}>1. Review request</Text>
      <Card
        eyebrow="Customer follow-up"
        title={
          job.reviewRequestSentAt
            ? "Review request already handled"
            : customer.contactOk === false
            ? "Customer contact is not allowed"
            : reviewPrepared
            ? "Review wording is ready"
            : "BUSY can prepare the wording"
        }
        body={
          job.reviewRequestDraft ||
          "BUSY will use the saved customer name and completed service to prepare a short, low-pressure review request."
        }
        tone={job.reviewRequestSentAt ? "blue" : reviewReady ? "green" : "amber"}
      >
        {reviewReady ? (
          <Button
            label={reviewPrepared ? "Review request" : "Prepare review request"}
            onPress={() => s.prepareReviewRequest(customer.id, job.id)}
          />
        ) : null}
      </Card>

      <Text style={styles.sectionLabel}>2. Finished-job post</Text>
      <Card
        eyebrow="Social proof"
        title={
          ["Published", "Simulated published"].includes(job.postDraftStatus)
            ? "Finished-job post already handled"
            : postPrepared
            ? "Post wording is ready"
            : approvedPhotos.length
            ? `${approvedPhotos.length} approved photo${approvedPhotos.length === 1 ? "" : "s"} can be used`
            : "Add/approve job photos first"
        }
        body={
          job.postDraft ||
          "BUSY can prepare a simple post from approved completed-job photos without adding the customer's private details."
        }
        tone={postReady ? "green" : "blue"}
      >
        {!["Published", "Simulated published"].includes(job.postDraftStatus) ? (
          <Button
            label={postPrepared ? "Review post approval" : approvedPhotos.length ? "Prepare finished-job post" : "Open job photos"}
            onPress={() =>
              postPrepared
                ? s.openJobPostApproval(customer.id, job.id)
                : approvedPhotos.length
                ? s.openJobPhotoOpportunity(customer.id, job.id)
                : s.openJobAssets(customer.id, job.id)
            }
          />
        ) : null}
      </Card>

      <Text style={styles.sectionLabel}>3. Repeat timing</Text>
      <Card
        eyebrow="Future work"
        title={repeatDue ? `Next timing: ${formatUKDate(repeatDue)}` : "No repeat timing set yet"}
        body="BUSY keeps the repeat-service timing on the customer record so it can surface the opportunity when the real date approaches rather than nagging early."
        tone={repeatDue ? "green" : "blue"}
      >
        <Button label="Open customer timeline" onPress={() => s.openCustomer(customer.id)} />
      </Card>

      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function JobPostDraft({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  const allowedPhotos = (job?.photos || []).filter((photo) => photo.marketingOk);
  if (!customer || !job) {
    return <Shell s={s} title="Post draft" subtitle="The completed job could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell s={s} title="Finished-job post" subtitle="BUSY DOES IT has prepared the action. You can change the words before approval." brandCue="Prepare underneath. Owner decides what goes public.">
      <Card eyebrow="Prepared for you" title={`${allowedPhotos.length} approved job photo${allowedPhotos.length === 1 ? "" : "s"} + editable wording`} body="The source is a completed job already saved in BUSY DOES IT. No address or private customer detail is added automatically." tone="green" />
      <Text style={styles.fieldLabel}>Post draft</Text>
      <TextInput multiline value={s.jobPostDraft} onChangeText={s.setJobPostDraft} placeholder="Write the finished-job post" placeholderTextColor="#9AA3B2" style={styles.messageInput} />
      <Text style={styles.helper}>Saving moves this prepared action to the approval screen. It still does not publish anything.</Text>
      <Button label="Save & review approval" primary disabled={!s.jobPostDraft.trim()} onPress={s.saveJobPostDraft} />
      <Button label="Back to photos" onPress={() => s.go("jobPhotos")} />
    </Shell>
  );
}

function JobPostApproval({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  const allowedPhotos = (job?.photos || []).filter((photo) => photo.marketingOk);
  if (!customer || !job?.postDraft) {
    return <Shell s={s} title="Approve post" subtitle="There is no prepared post to approve."><Button label="Back" primary onPress={s.back} /></Shell>;
  }

  const selectedCount =
    Number(!!s.connectedAccounts.meta && !!s.jobPostChannels.facebook) +
    Number(!!s.connectedAccounts.meta && !!s.jobPostChannels.instagram) +
    Number(!!s.connectedAccounts.googleBusiness && !!s.jobPostChannels.googleBusiness);
  const hasSocialConnection = !!s.connectedAccounts.meta;
  const hasGoogleConnection = !!s.connectedAccounts.googleBusiness;

  return (
    <Shell
      s={s}
      title="Approve prepared post"
      subtitle="Exactly what would be used, where it would go and what it costs — before anything happens."
      brandCue="Prepared by BUSY DOES IT. Approved by you."
    >
      <Card eyebrow="Prepared action" title={job.service || customer.service} body={job.postDraft} footer="Cost: £0" tone="green">
        <MetricRow left="Approved photos" right={String(allowedPhotos.length)} />
        <MetricRow left="Customer details included" right="No" />
        <MetricRow left="Real publishing in prototype" right="No" />
      </Card>

      {allowedPhotos.length ? (
        <View style={styles.photoGrid}>
          {allowedPhotos.slice(0, 5).map((photo) => (
            <View key={photo.id || photo.uri} style={styles.photoTile}>
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Where should it go?</Text>
      {hasSocialConnection ? (
        <>
          <ToggleRow
            title="Facebook"
            body="Uses the Facebook / Instagram prototype connection."
            value={!!s.jobPostChannels.facebook}
            onValueChange={() => s.toggleJobPostChannel("facebook")}
          />
          <ToggleRow
            title="Instagram"
            body="Uses the Facebook / Instagram prototype connection."
            value={!!s.jobPostChannels.instagram}
            onValueChange={() => s.toggleJobPostChannel("instagram")}
          />
        </>
      ) : null}
      {hasGoogleConnection ? (
        <ToggleRow
          title="Google Business"
          body="Prototype business-profile destination."
          value={!!s.jobPostChannels.googleBusiness}
          onValueChange={() => s.toggleJobPostChannel("googleBusiness")}
        />
      ) : null}

      {!hasSocialConnection && !hasGoogleConnection ? (
        <Card
          eyebrow="No publishing connection selected"
          title="Connect a profile before approval"
          body="The prototype will still never post for real, but this lets us test the correct approval flow against a destination the owner deliberately connected."
          tone="amber"
        />
      ) : null}

      <Button label="Edit wording" onPress={() => s.go("jobPostDraft")} />
      <Button
        label={selectedCount ? `Approve simulated publish • ${selectedCount}` : "Choose a connected profile first"}
        primary
        disabled={!selectedCount}
        onPress={s.simulateJobPostPublish}
      />
      <Button label="Connected accounts" onPress={() => s.go("connectedAccounts")} />
      {s.intakeLog.length ? <Button label={`Intake history • ${s.intakeLog.length}`} onPress={() => s.go("intakeHistory")} /> : null}
      <Button label="Not now" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function JobPostPublished({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  if (!customer || !job) {
    return <Shell s={s} title="Prepared action saved" subtitle="The job could not be found."><Button label="Home" primary onPress={() => s.jump("home", "Home")} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="Approved"
      subtitle="Prototype only — nothing was actually published."
      brandCue="Action prepared. Owner approved. Outcome can now be learned."
    >
      <Card
        eyebrow="Simulated publish"
        title={(job.postChannels || []).join(" • ") || "Selected profile"}
        body={job.postDraft}
        footer="Actual spend: £0"
        tone="green"
      />
      <Card
        eyebrow="Next learning step"
        title="What happened after the post?"
        body="You can record the outcome now or later. BUSY DOES IT should learn from enquiries, quotes and bookings — not just likes."
        tone="blue"
      />
      <Button label="Record what happened" primary onPress={() => s.openJobPostOutcome(customer.id, job.id)} />
      <Button label="Do this later" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function JobPostOutcome({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  const options = ["No enquiry yet", "Enquiry", "Quote", "Booking"];
  if (!customer || !job) {
    return <Shell s={s} title="Post outcome" subtitle="The selected job could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="What happened?"
      subtitle="One simple outcome helps BUSY DOES IT learn which free actions are genuinely useful."
      brandCue="Learn from business outcomes, not vanity metrics."
    >
      <Card
        eyebrow="Post being measured"
        title={job.service || customer.service}
        body={`${job.postDraftStatus === "Published" ? "Published" : "Recorded"} on ${(job.postChannels || []).join(", ") || "a selected profile"}.`}
        footer="Owner-recorded attribution • no causal claim is assumed"
        tone="blue"
      />
      {options.map((option) => (
        <Choice
          key={option}
          label={option}
          selected={s.jobPostOutcome === option}
          onPress={() => s.setJobPostOutcome(option)}
        />
      ))}
      {s.jobPostOutcome === "Booking" ? (
        <Field
          label="Booked value (optional)"
          value={s.jobPostOutcomeValue}
          onChangeText={s.setJobPostOutcomeValue}
          keyboardType="number-pad"
          prefix="£"
          placeholder="Only if you know it"
        />
      ) : null}
      <Card
        eyebrow="Attribution rule"
        title="Record what you know — do not pretend"
        body="A saved outcome means the owner associated it with this post. BUSY DOES IT should label that clearly rather than claiming the post definitely caused the work."
        tone="green"
      />
      <Button label="Save outcome" primary onPress={s.saveJobPostOutcome} />
      <Button label="Cancel" onPress={s.back} />
    </Shell>
  );
}

function StaleEnquiries({ s }) {
  const entries = s.staleEnquiryEntries || [];
  return (
    <Shell
      s={s}
      title="Quiet enquiries"
      subtitle="These come from actual customer records that have had no next action for at least 7 days."
      brandCue="Real records. Real dates. No typed-in opportunity count."
    >
      <Card
        eyebrow="Detected from customer records"
        title={`${entries.length} quiet enquir${entries.length === 1 ? "y" : "ies"} worth reviewing`}
        body="BUSY DOES IT only includes enquiry records with contact allowed, no current quote/booking/reminder, and no previous follow-up already sent."
        footer="Advertising spend: £0"
        tone="green"
      />
      {entries.map(({ customer, age }) => (
        <Pressable
          key={customer.id}
          onPress={() => s.prepareEnquiryFollowUp(customer.id)}
          style={styles.activityCard}
        >
          <View style={styles.activityTopRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.activityName}>{customer.name}</Text>
              <Text style={styles.activityService}>{customer.service}</Text>
            </View>
            <StatusChip label={`${age}d quiet`} tone="amber" />
          </View>
          <Text style={styles.activitySummary}>Added {enquiryAgeLabel(customer.createdAt)} • no active customer action</Text>
          <Text style={styles.activityOpen}>Prepare follow-up →</Text>
        </Pressable>
      ))}
      {!entries.length ? (
        <Card
          eyebrow="Nothing due"
          title="No quiet enquiries detected"
          body="New enquiries stay in the normal pipeline. Once an unresolved enquiry reaches 7 days, it can appear here automatically."
          tone="blue"
        />
      ) : null}
      <Button label="+ Add an enquiry" onPress={s.startNewEnquiry} />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function StaleQuotes({ s }) {
  const entries = s.dueQuoteEntries || [];
  return (
    <Shell
      s={s}
      title="Quote follow-ups due"
      subtitle="These are real sent quotes whose saved sent date is at least 7 days old."
      brandCue="Quote data creates the opportunity automatically."
    >
      <Card
        eyebrow="Detected from live quote records"
        title={`${entries.length} quote${entries.length === 1 ? "" : "s"} worth following up`}
        body="A quote drops out of this list once its prepared follow-up is approved or its quote status changes."
        footer="Advertising spend: £0"
        tone="green"
      />
      {entries.map(({ id, action, customer, age }) => (
        <Pressable
          key={id}
          onPress={() => s.prepareQuoteFollowUp(id)}
          style={styles.activityCard}
        >
          <View style={styles.activityTopRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.activityName}>{customer.name}</Text>
              <Text style={styles.activityService}>{customer.service}</Text>
            </View>
            <StatusChip label={`${age}d`} tone="amber" />
          </View>
          <Text style={styles.activitySummary}>
            Quote {action.details?.quoteAmount ? `£${action.details.quoteAmount}` : "value not recorded"} • sent {action.details?.quoteSentAt ? formatUKDate(String(action.details.quoteSentAt).slice(0, 10)) : "date unknown"}
          </Text>
          <Text style={styles.activityOpen}>Review prepared follow-up →</Text>
        </Pressable>
      ))}
      {!entries.length ? (
        <Card
          eyebrow="Nothing due"
          title="No sent quote has reached 7 days yet"
          body="BUSY DOES IT now calculates this from each quote’s real status and sent date instead of a manually entered old-quote count."
          tone="blue"
        />
      ) : null}
      <Button label="Open customer activity" onPress={() => s.go("customerActivity")} />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function EnquiryFollowUp({ s }) {
  const customer = s.selectedCustomer;
  const age = daysSinceTimestamp(customer?.createdAt);
  if (!customer || customer.lastServiceDate) {
    return <Shell s={s} title="Enquiry follow-up" subtitle="The enquiry could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="Prepared enquiry follow-up"
      subtitle="BUSY DOES IT has prepared a low-pressure check-in from the actual enquiry record."
      brandCue="Existing interest first. Nothing sends without approval."
    >
      <Card
        eyebrow="Quiet enquiry"
        title={customer.name}
        body={`${customer.service}${age !== null ? ` • ${age} days since enquiry` : ""}`}
        footer="Advertising spend: £0"
        tone="green"
      />
      <Text style={styles.fieldLabel}>Prepared follow-up</Text>
      <TextInput
        multiline
        value={s.enquiryFollowUpDraft}
        onChangeText={s.setEnquiryFollowUpDraft}
        style={styles.messageInput}
        placeholder="Follow-up message"
        placeholderTextColor="#9AA3B2"
      />
      <Card
        eyebrow="Approval"
        title="You decide whether this goes"
        body="The prototype records the approval and later outcome. It does not actually message the customer."
        tone="blue"
      />
      <Button
        label="Approve simulated send"
        primary
        disabled={!s.enquiryFollowUpDraft.trim()}
        onPress={s.simulateEnquiryFollowUpSend}
      />
      <Button label="Open customer" onPress={() => s.openCustomer(customer.id)} />
      <Button label="Not now" onPress={s.back} />
    </Shell>
  );
}

function EnquiryFollowUpSent({ s }) {
  const customer = s.selectedCustomer;
  if (!customer?.enquiryFollowUpSentAt) {
    return <Shell s={s} title="Follow-up saved" subtitle="The enquiry follow-up could not be found."><Button label="Home" primary onPress={() => s.jump("home", "Home")} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="Enquiry follow-up approved"
      subtitle="Prototype only — no real message was sent."
      brandCue="Action approved. Outcome can now improve future ranking."
    >
      <Card
        eyebrow="Simulated send"
        title={customer.name}
        body={customer.enquiryFollowUpDraft}
        footer="Cost: £0"
        tone="green"
      />
      <Button label="Record what happened" primary onPress={() => s.openEnquiryFollowUpOutcome(customer.id)} />
      <Button label="Do this later" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function EnquiryFollowUpOutcome({ s }) {
  const customer = s.selectedCustomer;
  const options = ["No reply yet", "Still interested", "Not interested"];
  if (!customer?.enquiryFollowUpSentAt) {
    return <Shell s={s} title="Enquiry outcome" subtitle="The enquiry follow-up could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="What happened?"
      subtitle="This turns an old enquiry into evidence the Opportunity Engine can use next time."
      brandCue="Learn from customer outcomes, not message counts."
    >
      <Card
        eyebrow="Enquiry being measured"
        title={customer.name}
        body={customer.service}
        footer="User-recorded outcome"
        tone="blue"
      />
      {options.map((option) => (
        <Choice
          key={option}
          label={option}
          selected={s.enquiryFollowUpOutcome === option}
          onPress={() => s.setEnquiryFollowUpOutcome(option)}
        />
      ))}
      {s.enquiryFollowUpOutcome === "Still interested" ? (
        <Card
          eyebrow="Likely next step"
          title="Open the customer and prepare the real quote or booking"
          body="BUSY DOES IT records the interest but does not invent a price or booking agreement."
          tone="green"
        />
      ) : null}
      <Button label="Save outcome" primary onPress={s.saveEnquiryFollowUpOutcome} />
      <Button label="Cancel" onPress={s.back} />
    </Shell>
  );
}

function QuoteFollowUp({ s }) {
  const customer = s.selectedReplyCustomer;
  const action = customer ? s.replyActions?.[customer.id] : null;
  const age = daysSinceTimestamp(action?.details?.quoteSentAt || action?.completedAt);
  if (!customer || action?.type !== "quote") {
    return <Shell s={s} title="Quote follow-up" subtitle="The quote could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="Prepared quote follow-up"
      subtitle="BUSY DOES IT has drafted the next action from the saved quote. You can change every word."
      brandCue="Prepared underneath. Nothing sends without approval."
    >
      <Card
        eyebrow="Existing customer intent"
        title={customer.name}
        body={`${customer.service} • quote ${action.details?.quoteAmount ? `£${action.details.quoteAmount}` : "value not recorded"}${age !== null ? ` • quiet for ${age} days` : ""}`}
        footer="Advertising spend: £0"
        tone="green"
      />
      <Text style={styles.fieldLabel}>Prepared follow-up</Text>
      <TextInput
        multiline
        value={s.quoteFollowUpDraft}
        onChangeText={s.setQuoteFollowUpDraft}
        style={styles.messageInput}
        placeholder="Follow-up message"
        placeholderTextColor="#9AA3B2"
      />
      <Card
        eyebrow="Approval"
        title="You decide whether this goes"
        body="The prototype records the approval and outcome, but it does not actually message the customer."
        tone="blue"
      />
      <Button label="Approve simulated send" primary disabled={!s.quoteFollowUpDraft.trim()} onPress={s.simulateQuoteFollowUpSend} />
      <Button label="Open original quote" onPress={() => s.openSavedReplyAction(customer.id)} />
      <Button label="Not now" onPress={s.back} />
    </Shell>
  );
}

function QuoteFollowUpSent({ s }) {
  const customer = s.selectedReplyCustomer;
  const action = customer ? s.replyActions?.[customer.id] : null;
  if (!customer || !action?.details?.followUpSentAt) {
    return <Shell s={s} title="Follow-up saved" subtitle="The follow-up could not be found."><Button label="Home" primary onPress={() => s.jump("home", "Home")} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="Follow-up approved"
      subtitle="Prototype only — no real message was sent."
      brandCue="Action approved. Now BUSY DOES IT can learn the outcome."
    >
      <Card
        eyebrow="Simulated send"
        title={customer.name}
        body={action.details.followUpMessage}
        footer="Cost: £0"
        tone="green"
      />
      <Button label="Record what happened" primary onPress={() => s.openQuoteFollowUpOutcome(customer.id)} />
      <Button label="Do this later" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function QuoteFollowUpOutcome({ s }) {
  const customer = s.selectedReplyCustomer;
  const action = customer ? s.replyActions?.[customer.id] : null;
  const options = ["No reply yet", "Still considering", "Accepted", "Declined"];
  if (!customer || !action?.details?.followUpSentAt) {
    return <Shell s={s} title="Follow-up outcome" subtitle="The follow-up could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="What happened?"
      subtitle="One quick update turns a follow-up into evidence the Opportunity Engine can use."
      brandCue="Learn from customer outcomes, not message activity."
    >
      <Card
        eyebrow="Quote being measured"
        title={customer.name}
        body={`${customer.service} • £${action.details?.quoteAmount || "—"}`}
        footer="User-recorded outcome"
        tone="blue"
      />
      {options.map((option) => (
        <Choice
          key={option}
          label={option}
          selected={s.quoteFollowUpOutcome === option}
          onPress={() => s.setQuoteFollowUpOutcome(option)}
        />
      ))}
      {s.quoteFollowUpOutcome === "Accepted" ? (
        <Card
          eyebrow="Next step"
          title="Accepted quotes become bookings"
          body="Saving this marks the quote accepted. Open the customer afterwards to turn it into a booking when the date is agreed."
          tone="green"
        />
      ) : null}
      <Button label="Save outcome" primary onPress={s.saveQuoteFollowUpOutcome} />
      <Button label="Cancel" onPress={s.back} />
    </Shell>
  );
}

function ReviewRequest({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  if (!customer || !job) {
    return <Shell s={s} title="Review request" subtitle="The completed job could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="Prepared review request"
      subtitle="A completed job can create another £0 opportunity without becoming pushy."
      brandCue="Prepared for you. Sent only with approval."
    >
      <Card
        eyebrow="Completed customer job"
        title={customer.name}
        body={`${job.service || customer.service}${Number(job.value) > 0 ? ` • £${job.value}` : ""}`}
        footer="Advertising spend: £0"
        tone="green"
      />
      <Text style={styles.fieldLabel}>Prepared request</Text>
      <TextInput
        multiline
        value={s.reviewRequestDraft}
        onChangeText={s.setReviewRequestDraft}
        style={styles.messageInput}
        placeholder="Review request"
        placeholderTextColor="#9AA3B2"
      />
      <Card
        eyebrow="Trust rule"
        title="Low pressure and truthful"
        body="BUSY DOES IT should ask for an honest review, not a positive review, and the owner can edit or skip the request."
        tone="blue"
      />
      <Button label="Approve simulated send" primary disabled={!s.reviewRequestDraft.trim()} onPress={s.simulateReviewRequestSend} />
      <Button label="Not now" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function ReviewRequestSent({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  if (!customer || !job?.reviewRequestSentAt) {
    return <Shell s={s} title="Review request saved" subtitle="The request could not be found."><Button label="Home" primary onPress={() => s.jump("home", "Home")} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="Review request approved"
      subtitle="Prototype only — no real message was sent."
      brandCue="Action approved. Outcome can be learned later."
    >
      <Card
        eyebrow="Simulated send"
        title={customer.name}
        body={job.reviewRequestDraft}
        footer="Cost: £0"
        tone="green"
      />
      <Button label="Record what happened" primary onPress={() => s.openReviewRequestOutcome(customer.id, job.id)} />
      <Button label="Do this later" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function ReviewRequestOutcome({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  const options = ["No response yet", "Review left"];
  if (!customer || !job?.reviewRequestSentAt) {
    return <Shell s={s} title="Review request outcome" subtitle="The request could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell
      s={s}
      title="Did they leave a review?"
      subtitle="This is enough for the engine to learn whether asking after completed work is useful."
      brandCue="Simple outcome. Better future ranking."
    >
      <Card
        eyebrow="Completed job"
        title={customer.name}
        body={job.service || customer.service}
        footer="No rating or review text is invented"
        tone="blue"
      />
      {options.map((option) => (
        <Choice
          key={option}
          label={option}
          selected={s.reviewRequestOutcome === option}
          onPress={() => s.setReviewRequestOutcome(option)}
        />
      ))}
      <Button label="Save outcome" primary onPress={s.saveReviewRequestOutcome} />
      <Button label="Cancel" onPress={s.back} />
    </Shell>
  );
}

function AddCustomerRecord({ s }) {
  const validDate = !s.newCustomerHasPreviousJob || !Number.isNaN(new Date(s.newCustomerDate).getTime());
  const canSave = !!s.newCustomerName.trim() && !!s.newCustomerPhone.trim() && validDate;
  const editing = !!s.editingCustomerId;

  return (
    <Shell
      s={s}
      title={editing ? "Edit customer" : "Add previous customer"}
      subtitle={editing ? "Update the customer without inventing a job that did not happen." : "Use this when the business has worked for this customer before."}
    >
      <Field label="Customer name" value={s.newCustomerName} onChangeText={s.setNewCustomerName} placeholder="e.g. Jane Smith" />
      <Field label="Phone" value={s.newCustomerPhone} onChangeText={s.setNewCustomerPhone} placeholder="e.g. 07700 900000" keyboardType="phone-pad" />
      <Field
        label="Job address / postcode (optional)"
        value={s.newCustomerAddress}
        onChangeText={s.setNewCustomerAddress}
        placeholder="Where is the work?"
      />
      <Field label="Service" value={s.newCustomerService} onChangeText={s.setNewCustomerService} placeholder="What work do they need or had before?" />
      <ToggleRow
        title="Has a previous completed job"
        body="Turn this off for an enquiry or contact with no completed job yet."
        value={s.newCustomerHasPreviousJob}
        onValueChange={s.setNewCustomerHasPreviousJob}
      />
      {s.newCustomerHasPreviousJob ? (
        <>
          <DatePickerField label="Last job date" value={s.newCustomerDate} onChange={s.setNewCustomerDate} />
          <Field label="Last job value" value={s.newCustomerValue} onChangeText={s.setNewCustomerValue} keyboardType="number-pad" prefix="£" placeholder="Optional" />
        </>
      ) : null}
      <ToggleRow
        title="Okay to contact"
        body="Only customers with this switched on can be considered for future reactivation."
        value={s.newCustomerContactOk}
        onValueChange={s.setNewCustomerContactOk}
      />
      <Button
        label={editing ? "Save changes" : "Save customer"}
        primary
        disabled={!canSave}
        onPress={() => {
          if (s.saveCustomerRecord()) s.back();
        }}
      />
      <Button
        label="Cancel"
        onPress={() => {
          s.clearCustomerForm();
          s.back();
        }}
      />
    </Shell>
  );
}

function ConfirmRemoveCustomer({ s }) {
  const customer = s.customers.find((item) => item.id === s.pendingRemoveCustomerId);
  return (
    <Shell
      s={s}
      title="Remove customer?"
      subtitle="This is deliberately a two-step action so a customer record cannot disappear by accident."
    >
      {customer ? (
        <Card
          eyebrow="Customer record"
          title={customer.name}
          body={customer.lastServiceDate ? `${customer.service} • Last job ${formatUKDate(customer.lastServiceDate)}` : `${customer.service} • No completed job recorded`}
          footer="This also removes any saved follow-up action for this customer."
          tone="amber"
        />
      ) : null}
      <Button label="Yes, remove record" danger onPress={s.confirmRemoveCustomer} />
      <Button
        label="Keep customer"
        primary
        onPress={() => {
          s.setPendingRemoveCustomerId(null);
          s.back();
        }}
      />
    </Shell>
  );
}

function EligibleCustomers({ s }) {
  const eligible = s.eligibleCustomers;
  const groups = groupCustomersByService(eligible);
  const groupCount = Object.keys(groups).length;

  return (
    <Shell
      s={s}
      title="Customers to try first"
      subtitle="These are the actual saved records that meet the current rule."
    >
      <Card
        eyebrow="Selection rule"
        title={`${eligible.length} customer${eligible.length === 1 ? "" : "s"} selected`}
        body={
          eligible.length
            ? `They will be split into ${groupCount} service-specific message group${groupCount === 1 ? "" : "s"} before sending. ${s.eligibilityRule}`
            : `No saved customer currently meets the rule: ${s.eligibilityRule}`
        }
        footer="Advertising spend: £0"
        tone="green"
      />
      {eligible.length ? (
        eligible.map((customer) => (
          <View key={customer.id} style={styles.customerRecord}>
            <View style={styles.customerRecordTop}>
              <Text style={styles.customerName}>{customer.name}</Text>
              <StatusChip label="Eligible now" tone="green" />
            </View>
            <Text style={styles.customerService}>{customer.service}</Text>
            <Text style={styles.customerMeta}>
              {customer.phone} • Last job {formatMonthsAgo(customer.lastServiceDate)}
              {Number(customer.lastJobValue) > 0 ? ` • £${customer.lastJobValue}` : ""}
            </Text>
          </View>
        ))
      ) : (
        <Card eyebrow="No matches" title="Nobody is due under the current rule" body="Add customer records or update their dates and contact permission." />
      )}
      <Button
        label={
          eligible.length
            ? `Prepare ${groupCount} message${groupCount === 1 ? "" : "s"} for ${eligible.length}`
            : "Manage customer records"
        }
        primary
        onPress={() => (eligible.length ? s.startCampaign(0) : s.go("customerRecords"))}
      />
      {eligible.length ? <Button label="Manage records" onPress={() => s.go("customerRecords")} /> : null}
    </Shell>
  );
}

function CustomerGroups({ s }) {
  const eligible = s.eligibleCustomers;
  const highValue = s.customers.filter((customer) => customer.contactOk && Number(customer.lastJobValue) >= 250);
  return (
    <Shell s={s} title="Customers worth trying" subtitle="Groups now come from the customer records stored on this phone.">
      <Card
        eyebrow="Due now"
        title={`${eligible.length} eligible customer${eligible.length === 1 ? "" : "s"}`}
        body={s.eligibilityRule}
        footer="Recommended first"
        tone="green"
      />
      <Card
        eyebrow="Higher-value history"
        title={`${highValue.length} customer${highValue.length === 1 ? "" : "s"} with £250+ previous jobs`}
        body="Useful context, but recency and contact permission still matter before sending anything."
      />
      <Button label="Review eligible customers" primary onPress={() => s.go("eligibleCustomers")} />
      <Button label="Manage customer records" onPress={() => s.go("customerRecords")} />
    </Shell>
  );
}

function BringBack({ s }) {
  return (
    <Shell s={s} title="Bring them back" subtitle="Approve the actual message — not an abstract campaign.">
      <Card eyebrow={s.selectedCustomerGroup.title} title="Message preview" footer="No predicted revenue — just a clear goal">
        <TextInput multiline value={s.bringBackMessage} onChangeText={s.setBringBackMessage} style={styles.messageInput} />
      </Card>
      <Button label="Simulate send" primary onPress={() => s.go("progress")} />
      <Button
        label="Reset draft"
        onPress={() =>
          s.setBringBackMessage(
            "Hi, it’s been a while since we last helped. We’ve got a couple of spaces next week if you need anything from us. Reply here if you’d like us to take a look."
          )
        }
      />
      <Button label="Skip" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function OfferGoal({ s }) {
  const goals = ["Fill a quiet day", "Get more bookings", "Promote a service", "Bring customers back", "Seasonal offer"];
  return (
    <Shell s={s} title="What is the offer for?" subtitle="The reason changes the offer we build." brandCue="Goal first, channel second.">
      {goals.map((g) => (
        <Choice key={g} label={g} selected={s.offerGoal === g} onPress={() => s.setOfferGoal(g)} />
      ))}
      {s.offerGoal === "Promote a service" ? (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.fieldLabel}>Service to promote</Text>
          {s.services.map((service) => (
            <Choice key={service.id} label={service.name} selected={s.selectedServiceId === service.id} onPress={() => s.setSelectedServiceId(service.id)} />
          ))}
        </View>
      ) : null}
      <Button label="Build the offer" primary onPress={s.prepareOfferFromGoal} />
    </Shell>
  );
}

function OfferBuild({ s }) {
  const guidance = {
    "Fill a quiet day": "Keep it limited to quieter days and a small booking cap so you protect margin.",
    "Get more bookings": "A modest incentive and a clear booking window is usually better than an unlimited discount.",
    "Promote a service": "You may not need a discount at all. Clear positioning and the right audience can be enough.",
    "Bring customers back": "Existing customers already know you, so avoid giving away more margin than necessary.",
    "Seasonal offer": "Make the reason and time window clear so it feels genuine rather than permanently discounted.",
  }[s.offerGoal];

  return (
    <Shell s={s} title="Build the offer" subtitle={`Goal: ${s.offerGoal}. Change anything before we recommend a plan.`}>
      <Field label="Service" value={s.offerService} onChangeText={s.setOfferService} />
      <Field label="Normal price" value={s.normalPrice} onChangeText={s.setNormalPrice} keyboardType="number-pad" prefix="£" />
      <Field label="Offer price" value={s.offerPrice} onChangeText={s.setOfferPrice} keyboardType="number-pad" prefix="£" />
      <Field label="Dates" value={s.offerDates} onChangeText={s.setOfferDates} />
      <Field label="Maximum bookings" value={s.offerMax} onChangeText={s.setOfferMax} keyboardType="number-pad" />
      {s.activeWorkGoal && s.offerGoal === "Fill a quiet day" ? (
        <Card
          eyebrow="Built from your work goal"
          title={s.activeWorkGoal.label}
          body={`BUSY started this offer with a cap of ${s.workGoalTargetJobs} booking and the normal saved service price. Lower the price only if you decide an incentive is actually worth the margin.`}
          footer="Special offer does not automatically mean discount"
          tone="blue"
        />
      ) : null}
      <Card eyebrow="Margin check" title="Don’t discount more than the goal requires" body={guidance} tone="green" />
      <Button label="Improve it for me" primary onPress={() => s.go("offerPlan")} />
      <Button label="Use my offer" onPress={() => s.go("offerPlan")} />
    </Shell>
  );
}

function OfferPlan({ s }) {
  const audience =
    s.offerGoal === "Bring customers back"
      ? "Start with previous customers who have not booked recently."
      : s.offerGoal === "Promote a service"
      ? `Start with previous customers most likely to need ${s.offerService.toLowerCase()}.`
      : "Start with previous customers before buying new attention.";
  const priceChanged = String(s.offerPrice) !== String(s.normalPrice);
  const title = priceChanged ? `${s.offerService} — £${s.offerPrice}` : `${s.offerService} — no price cut`;

  return (
    <Shell s={s} title="This is what we recommend" subtitle="Use it as-is or change anything.">
      <OpportunityCard
        eyebrow="Recommended offer"
        title={title}
        body={`Normal price about £${s.normalPrice}. ${s.offerDates}. Maximum ${s.offerMax} bookings. ${audience}`}
        footer="Paid ads only if spaces remain"
        status={s.offerGoal}
        tone="green"
        actionLabel="Use this plan"
        onAction={() => {
          s.recordWorkGoalAttempt({
            key: "offer",
            type: "offer",
            label: `Limited offer • ${s.offerService}`,
            service: s.offerService,
            cost: 0,
          });
          s.go("offerRunning");
        }}
        why="The plan is limited by date and booking capacity, starts with people who already know the business, and only adds paid reach if the target still has spaces."
        evidence={[["Offer goal", s.offerGoal], ["Booking cap", s.offerMax], ["Normal price", `£${s.normalPrice}`], ["Offer price", `£${s.offerPrice}`], ["Paid reach first?", "No"]]}
      />
      <Button label="Edit offer" onPress={s.back} />
      <Button label="Cancel" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function WhyOfferPlan({ s }) {
  return (
    <Shell s={s} title="Why this plan?" subtitle="The simple reason first.">
      <Card
        eyebrow="Offer logic"
        title="Fill quiet capacity without over-discounting"
        body="The offer is limited to quieter days and a maximum number of bookings. We start with previous customers because that is cheaper than buying new attention, then only use paid advertising if spaces remain."
        footer="Protect margin before chasing volume"
        tone="green"
      />
      <Button label="Show expert details" onPress={() => s.go("expertOfferPlan")} />
      <Button label="Got it" primary onPress={s.back} />
    </Shell>
  );
}

function ExpertOfferPlan({ s }) {
  return (
    <Shell s={s} title="Expert offer details" subtitle="The underlying reasoning and assumptions.">
      <Card eyebrow="Capacity" title={`${s.offerMax} booking cap`} body={`The offer is restricted to ${s.offerDates}, which is the capacity we are trying to fill.`} />
      <Card eyebrow="Pricing" title={`£${s.offerPrice} vs about £${s.normalPrice}`} body="The live product should compare the offer against known margin and past booking behaviour before recommending a discount." />
      <Card eyebrow="Audience sequence" title="Past customers before paid reach" body="Existing relationships normally have lower acquisition cost than cold advertising, so they are tested first when appropriate." footer="Paid promotion remains optional" />
      <Card eyebrow="Data quality" title="Prototype assumption" body="The current figures are dummy data. A live recommendation must expose the real evidence and lower confidence when margin, demand or attribution data is incomplete." tone="amber" />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function OfferRunning({ s }) {
  const tiedToGoal = !!s.activeWorkGoal && s.offerGoal === "Fill a quiet day";
  const target = tiedToGoal ? s.workGoalTargetJobs : Math.max(1, Number(s.offerMax) || 1);
  const booked = tiedToGoal ? s.workGoalBookedCount : 0;
  const reached = tiedToGoal && s.workGoalFilled;

  return (
    <Shell
      s={s}
      title={reached ? "Offer target reached" : "Offer plan ready"}
      subtitle={
        reached
          ? "The saved bookings already cover the work goal, so BUSY should stop escalating this offer."
          : "Prototype plan only — no customer message, public post or advert has actually been sent."
      }
    >
      <Card
        eyebrow={reached ? "Stop condition reached" : "Controlled offer"}
        title={tiedToGoal ? `${booked} of ${target} target booking${target === 1 ? "" : "s"} recorded` : `Maximum ${target} booking${target === 1 ? "" : "s"}`}
        body={
          reached
            ? `${s.activeWorkGoal.label} is covered. More promotion for the same gap is unnecessary.`
            : `${s.offerService} • ${s.offerDates}. BUSY has prepared the plan, but the prototype is not pretending it has contacted customers or generated bookings that are not in the saved records.`
        }
        footer={
          reached
            ? "Recommended additional spend: £0"
            : String(s.offerPrice) === String(s.normalPrice)
            ? `Starts at normal price: £${s.normalPrice}`
            : `Offer price: £${s.offerPrice} • normal about £${s.normalPrice}`
        }
        tone={reached ? "green" : "blue"}
      />
      {tiedToGoal ? (
        <>
          <MetricRow left="Work goal" right={s.activeWorkGoal.label} />
          <MetricRow left="Target bookings" right={String(target)} />
          <MetricRow left="Matching confirmed bookings" right={String(booked)} />
          <MetricRow left="Recorded booked value" right={s.workGoalBookedValue ? `£${s.workGoalBookedValue}` : "£0"} strong={reached} />
        </>
      ) : null}
      {reached ? (
        <Button label="Close work goal" primary onPress={s.clearWorkGoal} />
      ) : (
        <Button label="Back to ranked routes" primary onPress={() => s.go("bestMove")} />
      )}
      <Button label="View work diary" onPress={() => s.jump("workHub", "Work")} />
    </Shell>
  );
}



export {
  NewEnquiry,
  CustomerRecords,
  CustomerDetail,
  JobCompletePhotos,
  JobPhotos,
  JobPhotoOpportunity,
  PostJobBundle,
  JobPostDraft,
  JobPostApproval,
  JobPostPublished,
  JobPostOutcome,
  StaleEnquiries,
  StaleQuotes,
  EnquiryFollowUp,
  EnquiryFollowUpSent,
  EnquiryFollowUpOutcome,
  QuoteFollowUp,
  QuoteFollowUpSent,
  QuoteFollowUpOutcome,
  ReviewRequest,
  ReviewRequestSent,
  ReviewRequestOutcome,
  AddCustomerRecord,
  ConfirmRemoveCustomer,
  EligibleCustomers,
  CustomerGroups,
  BringBack,
  OfferGoal,
  OfferBuild,
  OfferPlan,
  WhyOfferPlan,
  ExpertOfferPlan,
  OfferRunning
};
