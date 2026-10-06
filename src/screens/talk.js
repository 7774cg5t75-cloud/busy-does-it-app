import React, { useEffect, useRef, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

import { styles } from "../theme/styles";
import { Shell, Card, Button, MetricRow, StatusChip } from "../components/ui";

function TalkToBusy({ s }) {
  const [typedCommand, setTypedCommand] = useState("");
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder, 200);
  const autoStartHandled = useRef(0);

  const startRecording = async () => {
    if (s.busyCommandStatus === "thinking" || recorderState.isRecording) return;
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Microphone permission needed",
          "Allow microphone access to talk to BUSY. You can still type instead."
        );
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      Alert.alert(
        "BUSY could not start listening",
        error?.message || "Try typing your request instead."
      );
    }
  };

  const stopRecording = async () => {
    if (!recorderState.isRecording) return;
    try {
      await audioRecorder.stop();
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      if (!audioRecorder.uri) throw new Error("No voice recording was created.");
      await s.submitBusyCommand({ audioUri: audioRecorder.uri });
    } catch (error) {
      Alert.alert(
        "BUSY could not process that recording",
        error?.message || "Try again or type the request."
      );
    }
  };

  useEffect(() => {
    const nonce = Number(s.busyVoiceStartNonce || 0);
    if (!nonce || nonce === autoStartHandled.current) return;
    autoStartHandled.current = nonce;
    const timer = setTimeout(startRecording, 250);
    return () => clearTimeout(timer);
  }, [s.busyVoiceStartNonce]);

  const submitTyped = async () => {
    const text = typedCommand.trim();
    if (!text) return;
    await s.submitBusyCommand({ text });
    setTypedCommand("");
  };

  const result = s.busyCommandResult;
  const canRun = s.busyCommandHasAction(result);
  const planSteps = Array.isArray(result?.planSteps) ? result.planSteps : [];
  const previewRows = Array.isArray(result?.previewRows) ? result.previewRows : [];
  const recentTurns = Array.isArray(s.busyConversationTurns)
    ? s.busyConversationTurns.slice(-8)
    : [];

  return (
    <Shell
      s={s}
      title="BUSY Operator"
      subtitle="Run more of the day by talking naturally. BUSY keeps the current customer, booking and draft in context, then previews record changes before applying them."
      brandCue="Voice-first, not authority-first. Booking/customer changes still ask for confirmation; messages, publishing and spend keep their separate approval gates."
    >
      {recentTurns.length ? (
        <Card
          eyebrow="Current conversation"
          title="BUSY remembers what you are talking about"
          body="Follow up naturally — for example: “okay, use John”, “make that friendlier”, or “what would you do after that?”"
          footer={`${recentTurns.length} recent turn${recentTurns.length === 1 ? "" : "s"} in context`}
          tone="blue"
        >
          {recentTurns.slice(-4).map((turn) => (
            <View key={turn.id} style={styles.operatorTurn}>
              <Text style={styles.operatorTurnRole}>
                {turn.role === "user" ? "YOU" : "BUSY"}
              </Text>
              <Text style={styles.operatorTurnText}>{turn.content}</Text>
            </View>
          ))}
          <Button label="Start a fresh conversation" onPress={s.startNewBusyConversation} />
        </Card>
      ) : null}

      <Card
        eyebrow="Voice"
        title={recorderState.isRecording ? "BUSY is listening…" : "Talk naturally"}
        body="You can ask a question, give an instruction, answer BUSY’s follow-up, or refine the last draft."
        tone={recorderState.isRecording ? "amber" : "blue"}
      >
        <View style={styles.talkRecordingWrap}>
          <Pressable
            onPress={recorderState.isRecording ? stopRecording : startRecording}
            disabled={s.busyCommandStatus === "thinking"}
            style={({ pressed }) => [
              styles.talkRecordingButton,
              recorderState.isRecording && styles.talkRecordingButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.talkRecordingIcon}>
              {recorderState.isRecording ? "■" : "🎙"}
            </Text>
          </Pressable>
          <Text style={styles.talkRecordingLabel}>
            {recorderState.isRecording
              ? "Tap to stop"
              : s.busyCommandStatus === "thinking"
              ? "BUSY is thinking…"
              : "Tap to talk"}
          </Text>
          {recorderState.isRecording ? (
            <Text style={styles.talkRecordingTime}>
              {Math.max(0, Math.round((recorderState.durationMillis || 0) / 1000))} seconds
            </Text>
          ) : null}
        </View>
      </Card>

      <Card
        eyebrow="Or type"
        title={result?.needsClarification ? "Answer BUSY" : "Tell BUSY what you want"}
        body={
          result?.needsClarification
            ? result.clarificationQuestion || "BUSY needs one more detail."
            : "Try: “move John to Friday at 3”, “cancel Sarah’s booking”, “add a note to Dave”, “show me Tuesday”, or “what should I do now?”"
        }
        tone={result?.needsClarification ? "amber" : "green"}
      >
        <TextInput
          value={typedCommand}
          onChangeText={setTypedCommand}
          placeholder={result?.needsClarification ? "Your answer…" : "What do you want BUSY to do?"}
          placeholderTextColor="#8A94A4"
          multiline
          style={styles.talkInput}
          editable={s.busyCommandStatus !== "thinking"}
        />
        <Button
          label={s.busyCommandStatus === "thinking" ? "BUSY is thinking…" : result?.needsClarification ? "Reply to BUSY" : "Ask BUSY"}
          primary
          disabled={!typedCommand.trim() || s.busyCommandStatus === "thinking"}
          onPress={submitTyped}
        />
      </Card>

      <Card
        eyebrow="Quick asks"
        title="Common daily commands"
        body="These use the same Operator conversation, so you can follow up naturally after BUSY answers."
        tone="blue"
      >
        <Button
          label="What should I do now?"
          disabled={s.busyCommandStatus === "thinking"}
          onPress={() => s.submitBusyCommand({ text: "What should I do now?" })}
        />
        <Button
          label="Show me tomorrow"
          disabled={s.busyCommandStatus === "thinking"}
          onPress={() => s.submitBusyCommand({ text: "Show me tomorrow in the calendar" })}
        />
        <Button
          label="What needs chasing?"
          disabled={s.busyCommandStatus === "thinking"}
          onPress={() => s.submitBusyCommand({ text: "What customer work needs chasing first?" })}
        />
        <Button
          label="Where have I got a gap?"
          disabled={s.busyCommandStatus === "thinking"}
          onPress={() => s.submitBusyCommand({ text: "Where have I got a sensible gap for another job?" })}
        />
      </Card>

      {s.busyCommandError ? (
        <Card
          eyebrow="Could not complete that"
          title="BUSY needs another try"
          body={s.busyCommandError}
          tone="amber"
        />
      ) : null}

      {result ? (
        <Card
          eyebrow={
            result.applied
              ? "Change applied"
              : result.needsClarification
              ? "One detail needed"
              : result.mode === "plan"
              ? "BUSY Operator plan"
              : result.requiresConfirmation
              ? "Preview before changing anything"
              : result.mode === "draft"
              ? "Draft prepared"
              : "BUSY understood"
          }
          title={result.title || "BUSY has a next step"}
          body={
            result.needsClarification
              ? result.clarificationQuestion || result.response
              : result.response || "BUSY understood the request."
          }
          footer={
            result.applied
              ? "Applied to BUSY records • undo is available below"
              : result.needsClarification
              ? "Nothing has changed"
              : result.requiresConfirmation
              ? "Nothing changes until you confirm"
              : result.mode === "plan"
              ? "Each step stays individually controlled"
              : canRun
              ? "Ready for the safe next step"
              : "Answer only • no action required"
          }
          tone={
            result.applied
              ? "green"
              : result.needsClarification || result.requiresConfirmation
              ? "amber"
              : "green"
          }
        >
          <MetricRow left="Confidence" right={result.confidence || "Low"} />
          {result.customerName ? <MetricRow left="Customer" right={result.customerName} /> : null}
          {result.service ? <MetricRow left="Service" right={result.service} /> : null}
          {result.date ? <MetricRow left="Date" right={result.date} /> : null}
          {result.time ? <MetricRow left="Time" right={result.time} /> : null}
          {Number(result.value) > 0 ? <MetricRow left="Value" right={`£${result.value}`} /> : null}

          {previewRows.map((row, index) => (
            <MetricRow
              key={`${row.label || "preview"}-${index}`}
              left={row.label || "Change"}
              right={row.value || "—"}
              strong={index === 0}
            />
          ))}

          {result.draftText ? (
            <View style={styles.operatorDraft}>
              <Text style={styles.operatorDraftLabel}>PREPARED DRAFT</Text>
              <Text style={styles.operatorDraftText}>{result.draftText}</Text>
              <Text style={styles.operatorDraftHint}>
                You can say “shorter”, “friendlier”, “less salesy” or “mention Thursday is free”.
              </Text>
            </View>
          ) : null}

          {planSteps.length ? (
            <View style={styles.operatorPlanWrap}>
              {planSteps.map((step, index) => (
                <View key={step.id || `step-${index}`} style={styles.operatorPlanStep}>
                  <View style={styles.operatorPlanNumber}>
                    <Text style={styles.operatorPlanNumberText}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.operatorPlanTitle}>{step.label}</Text>
                    <Text style={styles.operatorPlanReason}>{step.reason}</Text>
                    {step.requiresConfirmation ? (
                      <Text style={styles.operatorPlanSafety}>Will still require confirmation</Text>
                    ) : null}
                    <Button
                      label={step.actionLabel || "Open step"}
                      onPress={() => s.executeBusyPlanStep(step)}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {!result.needsClarification && result.requiresConfirmation ? (
            <Button
              label={result.actionLabel || "Confirm"}
              primary
              onPress={() => s.executeBusyCommand(result)}
            />
          ) : !result.needsClarification && canRun && !planSteps.length ? (
            <Button
              label={result.actionLabel || "Open"}
              primary
              onPress={() => s.executeBusyCommand(result)}
            />
          ) : null}

          {!result.needsClarification ? (
            <Button label="Clear result" onPress={s.clearBusyCommandResult} />
          ) : null}
        </Card>
      ) : null}

      {s.busyUndoAction ? (
        <Card
          eyebrow="BUSY audit trail"
          title="Last internal record change can be undone"
          body={s.busyUndoAction.label}
          footer="Undo restores the saved customer/action state from immediately before BUSY changed it."
          tone="amber"
        >
          <Button label="Undo last BUSY change" onPress={s.undoLastBusyAction} />
        </Card>
      ) : null}

      <Card
        eyebrow="Operator 2.0 boundary"
        title="More commands, same hard safety line"
        body="BUSY can now create, move and cancel bookings, complete jobs, add customer notes, set safe reminders and open a requested calendar day after the required preview/confirmation. Customer messages, public publishing and paid advertising still require their existing explicit approval."
        tone="blue"
      />

      {s.busyActionAudit?.length ? (
        <Card
          eyebrow="Recent BUSY actions"
          title="A visible internal audit trail"
          body="This records BUSY-triggered internal record changes and undos. It is deliberately separate from public publishing receipts."
          tone="blue"
        >
          {s.busyActionAudit.slice(0, 5).map((item) => (
            <MetricRow
              key={item.id}
              left={item.label}
              right={String(item.createdAt || "").slice(11, 16) || "Now"}
            />
          ))}
        </Card>
      ) : null}

      {s.busyCommandHistory?.length ? (
        <>
          <View style={styles.dashboardHeader}>
            <StatusChip label="Recent conversations with BUSY" tone="blue" />
          </View>
          {s.busyCommandHistory.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.talkHistoryCard}>
              <Text style={styles.talkHistoryPrompt}>{item.transcript}</Text>
              <Text style={styles.talkHistoryReply}>{item.response}</Text>
            </View>
          ))}
        </>
      ) : null}

      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { TalkToBusy };
