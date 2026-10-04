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
          "Allow microphone access to talk to BUSY. You can still type a request instead."
        );
        return;
      }
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
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
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
      });
      if (!audioRecorder.uri) {
        throw new Error("No voice recording was created.");
      }
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
    const timer = setTimeout(() => {
      startRecording();
    }, 250);
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

  return (
    <Shell
      s={s}
      title="Talk to BUSY"
      subtitle="Say what you want in normal language. BUSY will answer from the saved business records or take you to the right next step."
      brandCue="BUSY can prepare and navigate. Record changes still ask first; messages, publishing and spend keep their existing approval gates."
    >
      <Card
        eyebrow="Voice command"
        title={recorderState.isRecording ? "BUSY is listening…" : "Tap the microphone and speak"}
        body="Short, natural requests work best. You do not need marketing language or special commands."
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
        eyebrow="Or type it"
        title="Tell BUSY what you want"
        body="Examples: “Book John Parker Friday at 2pm”, “Which quotes need following up?”, “I finished Sarah’s job for £350”, or “Make a social post from Sarah’s latest job.”"
        tone="green"
      >
        <TextInput
          value={typedCommand}
          onChangeText={setTypedCommand}
          placeholder="What do you want BUSY to do?"
          placeholderTextColor="#8A94A4"
          multiline
          style={styles.talkInput}
          editable={s.busyCommandStatus !== "thinking"}
        />
        <Button
          label={s.busyCommandStatus === "thinking" ? "BUSY is thinking…" : "Ask BUSY"}
          primary
          disabled={!typedCommand.trim() || s.busyCommandStatus === "thinking"}
          onPress={submitTyped}
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
          eyebrow={result.requiresConfirmation ? "Check before changing anything" : "BUSY understood"}
          title={result.title || "BUSY has a next step"}
          body={result.response || "BUSY understood the request."}
          footer={
            result.requiresConfirmation
              ? "Nothing has changed yet"
              : canRun
              ? "Ready to open the right part of BUSY"
              : "Answer only • no action required"
          }
          tone={result.requiresConfirmation ? "amber" : "green"}
        >
          <MetricRow left="You said" right={result.transcript || "Voice command"} />
          <MetricRow left="Confidence" right={result.confidence || "Low"} />
          {result.customerName ? <MetricRow left="Customer" right={result.customerName} /> : null}
          {result.service ? <MetricRow left="Service" right={result.service} /> : null}
          {result.date ? <MetricRow left="Date" right={result.date} /> : null}
          {result.time ? <MetricRow left="Time" right={result.time} /> : null}
          {Number(result.value) > 0 ? <MetricRow left="Value" right={`£${result.value}`} /> : null}
          {result.requiresConfirmation ? (
            <Button
              label={result.actionLabel || "Confirm"}
              primary
              onPress={() => s.executeBusyCommand(result)}
            />
          ) : canRun ? (
            <Button
              label={result.actionLabel || "Open"}
              primary
              onPress={() => s.executeBusyCommand(result)}
            />
          ) : null}
          <Button label="Clear" onPress={s.clearBusyCommandResult} />
        </Card>
      ) : null}

      <Card
        eyebrow="Safety boundary"
        title="Talking does not mean blanket permission"
        body="BUSY can answer, find records and prepare drafts. Creating a booking or marking a job complete requires confirmation here. Sending customer messages, publishing publicly and paid advertising keep their existing separate approval steps."
        tone="blue"
      />

      {s.busyCommandHistory?.length ? (
        <>
          <View style={styles.dashboardHeader}>
            <StatusChip label="Recent conversations with BUSY" tone="blue" />
          </View>
          {s.busyCommandHistory.slice(0, 6).map((item) => (
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
