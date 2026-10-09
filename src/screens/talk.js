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
  // The native recording state may arrive a fraction of a second after the
  // record() call. Keep local start/stop state so tapping Stop never silently
  // does nothing while the recorder hook catches up.
  const recorderTransitionRef = useRef(false);
  const recordingStartedRef = useRef(false);
  const [voiceStage, setVoiceStage] = useState("idle");
  const [voiceMessage, setVoiceMessage] = useState("");
  const isListening =
    voiceStage === "recording" ||
    (voiceStage === "idle" && recorderState.isRecording);

  const startRecording = async () => {
    if (
      s.busyCommandStatus === "thinking" ||
      recorderTransitionRef.current ||
      recordingStartedRef.current ||
      recorderState.isRecording
    ) return;
    recorderTransitionRef.current = true;
    setVoiceStage("starting");
    setVoiceMessage("Preparing your microphone…");
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        const message = "Microphone access is turned off. Enable it in iPhone Settings for BUSY DOES IT, or type instead.";
        setVoiceStage("error");
        setVoiceMessage(message);
        Alert.alert("Microphone permission needed", message);
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      recordingStartedRef.current = true;
      setVoiceStage("recording");
      setVoiceMessage("Listening. Tap the square button when you finish speaking.");
    } catch (error) {
      const message = error?.message || "BUSY couldn't start the microphone. You can type your request instead.";
      setVoiceStage("error");
      setVoiceMessage(message);
      Alert.alert("BUSY could not start listening", message);
    } finally {
      recorderTransitionRef.current = false;
    }
  };

  const stopRecording = async () => {
    if (recorderTransitionRef.current) return;
    if (!recordingStartedRef.current && !recorderState.isRecording) {
      setVoiceStage("error");
      setVoiceMessage("No recording started. Tap the microphone and wait for 'Listening' before speaking.");
      return;
    }
    recorderTransitionRef.current = true;
    recordingStartedRef.current = false;
    setVoiceStage("sending");
    setVoiceMessage("Sending your recording to BUSY…");
    try {
      await audioRecorder.stop();
      const recordedUri = audioRecorder.uri;
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      if (!recordedUri) throw new Error("No recording file was created. Try again.");
      const response = await s.submitBusyCommand({ audioUri: recordedUri });
      if (response) {
        setVoiceStage("idle");
        setVoiceMessage("BUSY received your voice request. Your reply is shown below.");
      } else {
        setVoiceStage("error");
        setVoiceMessage("BUSY couldn't complete that voice request. See the error below or try typing.");
      }
    } catch (error) {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
      const message = error?.message || "BUSY couldn't process the recording. Try again or type your request.";
      setVoiceStage("error");
      setVoiceMessage(message);
      Alert.alert("BUSY could not process that recording", message);
    } finally {
      recorderTransitionRef.current = false;
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
      title={s.businessCreationConversationActive ? "Talk to BUSY • Build my business" : "BUSY Operator"}
      subtitle={
        s.businessCreationConversationActive
          ? "Talk naturally about the business. BUSY remembers each answer, asks the next useful question and advances the private launch pack."
          : "Run more of the day by talking naturally. BUSY keeps the current customer, booking and draft in context, then previews record changes before applying them."
      }
      brandCue={
        s.businessCreationConversationActive
          ? "V3.59 • conversational business creation • one question at a time • shared memory • nothing published automatically."
          : "Voice-first, not authority-first. Booking/customer changes still ask for confirmation; messages, publishing and spend keep their separate approval gates."
      }
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

      {s.businessCreationConversationActive ? (
        <Card
          eyebrow="Business creation conversation"
          title={s.businessCreationJourney?.nextQuestion?.question || "BUSY has the core facts it needs"}
          body={
            s.businessCreationJourney?.nextQuestion?.helper ||
            "You can keep talking naturally, ask BUSY to prepare the launch pack, or return to the combined review."
          }
          footer="Your answers feed the shared business profile used by the website, Business App and marketing tools."
          tone="green"
        >
          <Button
            label="Return to launch-pack review"
            onPress={() => s.go("businessCreationJourney")}
          />
          <Button
            label="Finish business-creation conversation"
            onPress={() => s.setBusinessCreationConversationActive(false)}
          />
        </Card>
      ) : null}

      <Card
        eyebrow="Voice"
        title={isListening ? "BUSY is listening…" : voiceStage === "sending" ? "BUSY is processing your request…" : "Talk naturally"}
        body="Say what you need, then tap the square to send. BUSY will show a response or an error here."
        tone={isListening ? "amber" : voiceStage === "error" ? "amber" : "blue"}
      >
        <View style={styles.talkRecordingWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isListening ? "Stop recording and send to BUSY" : "Start voice recording"}
            onPress={isListening ? stopRecording : startRecording}
            disabled={s.busyCommandStatus === "thinking" || voiceStage === "starting" || voiceStage === "sending"}
            style={({ pressed }) => [
              styles.talkRecordingButton,
              isListening && styles.talkRecordingButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.talkRecordingIcon}>
              {isListening ? "■" : "🎙"}
            </Text>
          </Pressable>
          <Text style={styles.talkRecordingLabel}>
            {isListening
              ? "Tap to stop and send"
              : voiceStage === "starting"
              ? "Starting microphone…"
              : voiceStage === "sending" || s.busyCommandStatus === "thinking"
              ? "BUSY is working…"
              : "Tap to talk"}
          </Text>
          {isListening ? (
            <Text style={styles.talkRecordingTime}>
              {Math.max(0, Math.round((recorderState.durationMillis || 0) / 1000))} seconds
            </Text>
          ) : null}
        </View>
        {voiceMessage ? (
          <Text style={styles.talkVoiceNotice}>{voiceMessage}</Text>
        ) : null}
        {s.busyCommandError ? (
          <Text style={styles.talkVoiceError}>BUSY says: {s.busyCommandError}</Text>
        ) : null}
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

      {!s.businessCreationConversationActive ? (
      <Card
        eyebrow="Quick asks"
        title="Common daily commands"
        body="These use the same Operator conversation, so you can follow up naturally after BUSY answers."
        tone="blue"
      >
        <Button
          label="Give me my daily briefing"
          disabled={s.busyCommandStatus === "thinking"}
          onPress={() => s.submitBusyCommand({ text: "Give me my daily briefing: what do I need to do now, what can wait until later today, and what should I watch?" })}
        />
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
          label="Who am I waiting to hear back from?"
          disabled={s.busyCommandStatus === "thinking"}
          onPress={() => s.submitBusyCommand({ text: "Who am I waiting to hear back from, and who actually needs a reply from me?" })}
        />
        <Button
          label="Where have I got a gap?"
          disabled={s.busyCommandStatus === "thinking"}
          onPress={() => s.submitBusyCommand({ text: "Where have I got a sensible gap for another job?" })}
        />
      </Card>
      ) : null}

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
