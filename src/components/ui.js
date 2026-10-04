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

function BusyAppMark({ size = 30 }) {
  const radius = Math.round(size * 0.28);
  return (
    <View
      style={[
        styles.busyAppMark,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      <Text
        style={[
          styles.busyAppMarkLetter,
          { fontSize: Math.round(size * 0.62), lineHeight: Math.round(size * 0.7) },
        ]}
      >
        B
      </Text>
      <View
        style={[
          styles.busyAppMarkCheckWrap,
          {
            width: Math.max(11, Math.round(size * 0.34)),
            height: Math.max(11, Math.round(size * 0.34)),
            borderRadius: Math.max(6, Math.round(size * 0.17)),
            left: Math.round(size * 0.17),
            bottom: Math.round(size * 0.14),
          },
        ]}
      >
        <Text
          style={[
            styles.busyAppMarkCheck,
            { fontSize: Math.max(8, Math.round(size * 0.23)) },
          ]}
        >
          ✓
        </Text>
      </View>
    </View>
  );
}

function BusyAssistantMark({ size = 38 }) {
  const cardWidth = Math.round(size * 0.5);
  const cardHeight = Math.round(size * 0.6);
  return (
    <View style={{ width: size * 1.14, height: size, position: "relative" }}>
      <View
        style={[
          styles.busyAssistantBase,
          { width: size, height: size, borderRadius: Math.round(size * 0.28) },
        ]}
      >
        <View
          style={[
            styles.busyAssistantBackCard,
            {
              width: cardWidth,
              height: cardHeight,
              left: Math.round(size * 0.18),
              top: Math.round(size * 0.2),
              borderRadius: Math.round(size * 0.1),
            },
          ]}
        />
        <View
          style={[
            styles.busyAssistantFrontCard,
            {
              width: cardWidth,
              height: cardHeight,
              left: Math.round(size * 0.3),
              top: Math.round(size * 0.17),
              borderRadius: Math.round(size * 0.1),
            },
          ]}
        >
          <Text
            style={[
              styles.busyAssistantCheck,
              { fontSize: Math.round(size * 0.25), lineHeight: Math.round(size * 0.27) },
            ]}
          >
            ✓
          </Text>
          <View
            style={[
              styles.busyAssistantLine,
              { width: Math.round(size * 0.24), height: Math.max(2, Math.round(size * 0.055)) },
            ]}
          />
        </View>
      </View>
      <View
        style={[
          styles.busySpark,
          {
            width: Math.max(3, Math.round(size * 0.08)),
            height: Math.round(size * 0.22),
            right: Math.round(size * 0.06),
            top: Math.round(size * 0.02),
            transform: [{ rotate: "20deg" }],
          },
        ]}
      />
      <View
        style={[
          styles.busySpark,
          {
            width: Math.round(size * 0.2),
            height: Math.max(3, Math.round(size * 0.08)),
            right: 0,
            top: Math.round(size * 0.27),
            transform: [{ rotate: "12deg" }],
          },
        ]}
      />
    </View>
  );
}

function BusyBrandLockup({ size = 38, centered = false }) {
  return (
    <View style={[styles.busyBrandLockup, centered && styles.busyBrandLockupCentered]}>
      <BusyAssistantMark size={size} />
      <View style={styles.busyWordmarkWrap}>
        <Text style={[styles.busyWordmarkBusy, { fontSize: Math.max(17, Math.round(size * 0.48)) }]}>BUSY</Text>
        <Text style={[styles.busyWordmarkDoes, { fontSize: Math.max(13, Math.round(size * 0.34)) }]}>DOES IT</Text>
      </View>
    </View>
  );
}

function Shell({ s, children, title, subtitle, brandCue, noNav = false, noBack = false }) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <View style={styles.shell}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            keyboardVisible && styles.scrollContentKeyboard,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
        <View style={styles.topRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <BusyBrandLockup size={36} />
            <Text style={styles.tagline}>More work. Less fuss.</Text>
            <Text style={styles.prototypeBadge}>{PROTOTYPE_BADGE}</Text>
          </View>
          {!noBack && s.history?.length > 0 ? (
            <Pressable onPress={s.back} style={styles.backPill}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ) : null}
        </View>

        {brandCue ? <Text style={styles.brandCue}>{brandCue}</Text> : null}
        {title ? <Text style={styles.h1}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        {children}
        </ScrollView>
      </KeyboardAvoidingView>
      {!noNav && !keyboardVisible ? <BottomNav s={s} /> : null}
    </View>
  );
}

function BottomNav({ s }) {
  const items = [
    ["Home", "home"],
    ["Work", "workHub"],
    ["Results", "results"],
    ["Settings", "settings"],
  ];
  return (
    <View style={styles.nav}>
      {items.map(([label, target]) => {
        const active = s.tab === label;
        return (
          <Pressable
            key={label}
            style={styles.navItem}
            onPress={() => {
              s.setTab(label);
              s.jump(target, label);
            }}
          >
            <View style={[styles.navDot, active && styles.navDotActive]} />
            <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Card({ eyebrow, title, body, footer, tone = "blue", children }) {
  const toneStyle =
    tone === "green"
      ? styles.cardGreen
      : tone === "amber"
      ? styles.cardAmber
      : styles.cardBlue;
  const eyebrowText = eyebrow ? String(eyebrow).toUpperCase() : "";
  const showBusyMark = eyebrowText.startsWith("BUSY");
  return (
    <View style={[styles.card, toneStyle]}>
      {eyebrow ? (
        showBusyMark ? (
          <View style={styles.busyEyebrowRow}>
            <BusyAppMark size={21} />
            <Text style={[styles.eyebrow, styles.busyEyebrowText]}>{eyebrowText}</Text>
          </View>
        ) : (
          <Text style={styles.eyebrow}>{eyebrowText}</Text>
        )
      ) : null}
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {body ? <Text style={styles.cardBody}>{body}</Text> : null}
      {children}
      {footer ? <Text style={styles.cardFooter}>{footer}</Text> : null}
    </View>
  );
}

function Button({ label, onPress, primary = false, danger = false, disabled = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        primary && styles.buttonPrimary,
        danger && styles.buttonDanger,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          primary && styles.buttonTextPrimary,
          danger && styles.buttonTextPrimary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SmallLink({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.smallLinkWrap}>
      <Text style={styles.smallLink}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", prefix, secureTextEntry = false, autoCapitalize = "sentences" }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldBox}>
        {prefix ? <Text style={styles.fieldPrefix}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          style={styles.fieldInput}
          placeholderTextColor="#9AA3B2"
        />
      </View>
    </View>
  );
}


function DatePickerField({ label, value, onChange, allowFuture = false, minimumDate = null, maximumDate = null }) {
  const [open, setOpen] = useState(false);
  const selected = dateFromISO(value);
  const [viewMonth, setViewMonth] = useState(
    new Date(selected.getFullYear(), selected.getMonth(), 1, 12, 0, 0)
  );

  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
  const minLimit = minimumDate ? dateFromISO(minimumDate) : null;
  const maxLimit = maximumDate ? dateFromISO(maximumDate) : allowFuture ? null : todayOnly;

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekdayMondayFirst = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = viewMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const previousMonth = new Date(year, month - 1, 1, 12, 0, 0);
  const nextMonth = new Date(year, month + 1, 1, 12, 0, 0);
  const minMonth = minLimit ? new Date(minLimit.getFullYear(), minLimit.getMonth(), 1, 12, 0, 0) : null;
  const maxMonth = maxLimit ? new Date(maxLimit.getFullYear(), maxLimit.getMonth(), 1, 12, 0, 0) : null;
  const canGoBack = !minMonth || previousMonth >= minMonth;
  const canGoForward = !maxMonth || nextMonth <= maxMonth;

  const chooseDate = (day) => {
    const candidate = new Date(year, month, day, 12, 0, 0);
    if (minLimit && candidate < minLimit) return;
    if (maxLimit && candidate > maxLimit) return;
    onChange(dateToISO(candidate));
    setOpen(false);
  };

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={() => {
          const current = dateFromISO(value);
          setViewMonth(new Date(current.getFullYear(), current.getMonth(), 1, 12, 0, 0));
          setOpen((currentOpen) => !currentOpen);
        }}
        style={[styles.fieldBox, styles.dateFieldBox]}
      >
        <Text style={styles.dateFieldText}>{formatUKDate(value)}</Text>
        <Text style={styles.dateFieldHint}>{open ? "Close" : "Choose date"}</Text>
      </Pressable>

      {open ? (
        <View style={styles.datePickerPanel}>
          <View style={styles.calendarHeader}>
            <Pressable
              disabled={!canGoBack}
              style={[styles.calendarNav, !canGoBack && styles.calendarNavDisabled]}
              onPress={() => setViewMonth(previousMonth)}
            >
              <Text style={[styles.calendarNavText, !canGoBack && styles.calendarNavTextDisabled]}>‹</Text>
            </Pressable>
            <Text style={styles.calendarMonth}>{monthLabel}</Text>
            <Pressable
              disabled={!canGoForward}
              style={[styles.calendarNav, !canGoForward && styles.calendarNavDisabled]}
              onPress={() => setViewMonth(nextMonth)}
            >
              <Text style={[styles.calendarNavText, !canGoForward && styles.calendarNavTextDisabled]}>›</Text>
            </Pressable>
          </View>

          <View style={styles.calendarGrid}>
            {["M", "T", "W", "T", "F", "S", "S"].map((dayName, index) => (
              <View key={`head-${index}`} style={styles.calendarCell}>
                <Text style={styles.calendarWeekday}>{dayName}</Text>
              </View>
            ))}
            {Array.from({ length: firstWeekdayMondayFirst }).map((_, index) => (
              <View key={`blank-${index}`} style={styles.calendarCell} />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
              const candidate = new Date(year, month, day, 12, 0, 0);
              const disabled =
                (!!minLimit && candidate < minLimit) ||
                (!!maxLimit && candidate > maxLimit);
              const isSelected =
                selected.getFullYear() === year &&
                selected.getMonth() === month &&
                selected.getDate() === day;
              return (
                <View key={day} style={styles.calendarCell}>
                  <Pressable
                    disabled={disabled}
                    onPress={() => chooseDate(day)}
                    style={[
                      styles.calendarDay,
                      isSelected && styles.calendarDaySelected,
                      disabled && styles.calendarDayDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextSelected,
                        disabled && styles.calendarDayTextDisabled,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
          <Text style={styles.calendarHelp}>Dates use UK day–month–year formatting.</Text>
        </View>
      ) : null}
    </View>
  );
}

function Choice({ label, selected, onPress, sub }) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioCore} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
        {sub ? <Text style={styles.choiceSub}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

function ToggleRow({ title, body, value, onValueChange, disabled = false }) {
  return (
    <View style={[styles.toggleRow, disabled && { opacity: 0.55 }]}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {body ? <Text style={styles.toggleBody}>{body}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: "#C8CFD9", true: "#9FC0FF" }}
        thumbColor={value ? C.blue : "#FFFFFF"}
      />
    </View>
  );
}

function MetricRow({ left, right, strong = false, onPress = null }) {
  const content = (
    <>
      <Text style={[styles.metricLeft, strong && styles.metricStrong, onPress && styles.metricClickable]}>{left}</Text>
      <View style={styles.metricRightWrap}>
        <Text style={[styles.metricRight, strong && styles.metricStrong, onPress && styles.metricClickable]}>{right}</Text>
        {onPress ? <Text style={styles.metricChevron}>›</Text> : null}
      </View>
    </>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.metricRow, styles.metricRowClickable, pressed && styles.metricRowPressed]}>
      {content}
    </Pressable>
  ) : (
    <View style={styles.metricRow}>{content}</View>
  );
}


function StatusChip({ label, tone = "blue" }) {
  const style = tone === "green" ? styles.chipGreen : tone === "amber" ? styles.chipAmber : styles.chipBlue;
  return (
    <View style={[styles.chip, style]}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function InlineExplanation({ why, evidence = [] }) {
  const [showWhy, setShowWhy] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  return (
    <View style={styles.explainWrap}>
      <Pressable onPress={() => setShowWhy((v) => !v)} style={styles.inlineLinkWrap}>
        <Text style={styles.inlineLink}>{showWhy ? "Hide why" : "Why this?"}</Text>
      </Pressable>
      {showWhy ? (
        <View style={styles.inlinePanel}>
          <Text style={styles.inlineWhy}>{why}</Text>
          {evidence.length ? (
            <>
              <Pressable onPress={() => setShowEvidence((v) => !v)} style={styles.inlineLinkWrapLeft}>
                <Text style={styles.inlineLink}>{showEvidence ? "Hide expert details" : "Expert details"}</Text>
              </Pressable>
              {showEvidence ? (
                <View style={styles.evidenceBox}>
                  {evidence.map(([left, right]) => (
                    <MetricRow key={left} left={left} right={right} />
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function OpportunityCard({
  eyebrow,
  title,
  body,
  footer,
  status,
  tone = "blue",
  actionLabel = "Do it",
  onAction,
  onIgnore,
  why,
  evidence,
  rank,
  estimatedValue,
  decisionConfidence,
}) {
  const toneStyle = tone === "green" ? styles.opportunityGreen : tone === "amber" ? styles.opportunityAmber : styles.opportunityBlue;
  return (
    <View style={[styles.opportunityCard, toneStyle]}>
      <View style={styles.opportunityTop}>
        <Text style={[styles.eyebrow, styles.opportunityEyebrow]}>{eyebrow.toUpperCase()}</Text>
        {status ? <StatusChip label={status} tone={tone} /> : null}
      </View>
      <Text style={styles.opportunityTitle}>{title}</Text>
      <Text style={styles.opportunityBody}>{body}</Text>
      {rank || estimatedValue || decisionConfidence ? (
        <View style={styles.evidenceBox}>
          {rank ? <MetricRow left="Priority" right={`#${rank}`} strong={rank === 1} /> : null}
          {estimatedValue ? <MetricRow left="Business value" right={estimatedValue} /> : null}
          {decisionConfidence ? <MetricRow left="Decision confidence" right={decisionConfidence} /> : null}
        </View>
      ) : null}
      {footer ? <Text style={styles.opportunityFooter}>{footer}</Text> : null}
      {why ? <InlineExplanation why={why} evidence={evidence} /> : null}
      <View style={styles.actionRow}>
        <Pressable onPress={onAction} style={styles.miniPrimary}>
          <Text style={styles.miniPrimaryText}>{actionLabel}</Text>
        </Pressable>
        {onIgnore ? (
          <Pressable onPress={onIgnore} style={styles.miniSecondary}>
            <Text style={styles.miniSecondaryText}>Not useful</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ProgressStrip({ current, total }) {
  const pct = Math.max(0, Math.min(1, current / total));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
    </View>
  );
}


export {
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
};
