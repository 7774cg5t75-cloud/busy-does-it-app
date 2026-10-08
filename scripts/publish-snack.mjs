import fs from "node:fs";
import path from "node:path";
import { Snack } from "snack-sdk";
import * as babelParser from "@babel/parser";

function collectJsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectJsFiles(full));
    else if (entry.isFile() && /\.(?:js|mjs)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

function prepareSource(source) {
  return source
    // Snack bundles .js files; convert relative .mjs imports only in the preview.
    .replace(/(\.{1,2}\/[^"\'\s]+)\.mjs(?=["\'])/g, "$1.js")
    // Expo Go preview: do not bundle device-calendar native integration.
    // The real application still uses expo-calendar/legacy in development builds.
    .replaceAll(
      'import * as Calendar from "expo-calendar/legacy";',
      'import * as Calendar from "../preview/calendarUnavailable";'
    )
    .replaceAll('from "expo-audio"', 'from "../preview/audioUnavailable"')
    .replaceAll(
      "process.env.EXPO_PUBLIC_BUSY_AI_URL",
      JSON.stringify(process.env.EXPO_PUBLIC_BUSY_AI_URL || "")
    )
    .replaceAll(
      "process.env.EXPO_PUBLIC_BUSY_AI_TOKEN",
      JSON.stringify(process.env.EXPO_PUBLIC_BUSY_AI_TOKEN || "")
    );
}

const sourcePaths = ["BusyDoesItApp.js", ...collectJsFiles("src")];
const calendarPreviewShim = `// Expo Go-only: device calendar integration requires the native development build.
export const EntityTypes = { EVENT: "event" };
export const isAvailableAsync = async () => false;
const unavailable = async () => { throw new Error("Device calendar sync requires a BUSY DOES IT development build."); };
export const requestCalendarPermissionsAsync = unavailable;
export const getCalendarsAsync = unavailable;
export const getEventAsync = unavailable;
export const updateEventAsync = unavailable;
export const createEventAsync = unavailable;
export const deleteEventAsync = unavailable;
export const getEventsAsync = unavailable;
`;

const audioPreviewShim = `import React from "react";
// Voice recording is not available in this Expo Go-only preview.
export const RecordingPresets = { HIGH_QUALITY: {} };
export const AudioModule = { requestRecordingPermissionsAsync: async () => ({ granted: false }) };
export const setAudioModeAsync = async () => {};
export const useAudioRecorder = () => React.useMemo(() => ({
  uri: null,
  prepareToRecordAsync: async () => { throw new Error("Voice recording requires a BUSY DOES IT development build."); },
  record: () => {},
  stop: async () => {},
}), []);
export const useAudioRecorderState = () => ({ isRecording: false, durationMillis: 0 });
`;

const files = {};
files["src/preview/audioUnavailable.js"] = { type: "CODE", contents: audioPreviewShim };
files["src/preview/calendarUnavailable.js"] = { type: "CODE", contents: calendarPreviewShim };

for (const sourcePath of sourcePaths) {
  const prepared = prepareSource(fs.readFileSync(sourcePath, "utf8"));
  babelParser.parse(prepared, { sourceType: "module", plugins: ["jsx"] });
  const snackPath =
    sourcePath === "BusyDoesItApp.js"
      ? "App.js"
      : sourcePath.split(path.sep).join("/").replace(/\.mjs$/i, ".js");
  files[snackPath] = { type: "CODE", contents: prepared };
}

// Catch unpublished source files before claiming the Snack is ready.
for (const path of sourcePaths.filter(path => path.endsWith(".mjs"))) {
  const expected = path.replace(/\.mjs$/, ".js");
  if (!files[expected]) throw new Error(`Snack missing converted module: ${path}`);
}
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const version = pkg.version || "preview";
const branch = process.env.GITHUB_REF_NAME || `v${version}`;

const snack = new Snack({
  sdkVersion: "54.0.0",
  name: `Busy Does It v${version.replace(/^0\./, "0.")}`,
  description: `Auto-generated preview from the ${branch} GitHub branch`,
  files,
  dependencies: {
    "@react-native-async-storage/async-storage": { version: "2.2.0" },
    "expo-image-picker": { version: "17.0.11" },
    // Voice recording uses the Expo Go preview adapter, not expo-audio.
    "expo-secure-store": { version: "15.0.8" },
    "expo-notifications": { version: "0.32.17" },
    // expo-calendar is deliberately absent: it is unavailable in this Snack preview.
    "expo-constants": { version: "18.0.14" },
  },
});

if (!files["src/screens/talk.js"]?.contents.includes("../preview/audioUnavailable")) {
  throw new Error("Preview voice adapter is not connected.");
}
if (Object.values(files).some(file => /from\s*["\']expo-audio["\']/.test(file.contents))) {
  throw new Error("Native audio import unexpectedly included in Snack.");
}
if (!files["src/app/AppController.js"]?.contents.includes("../preview/calendarUnavailable")) {
  throw new Error("Preview calendar adapter is not connected.");
}
if (Object.values(files).some(file => /from\s*["']expo-calendar(?:\/legacy)?["']/.test(file.contents))) {
  throw new Error("Native calendar import unexpectedly included in Snack.");
}
const result = await snack.saveAsync({ ignoreUser: true });

const payload = {
  generatedAt: new Date().toISOString(),
  id: result.id,
  webUrl: `https://snack.expo.dev/${result.id}`,
  expoUrl: result.url,
  sourceBranch: branch,
  sourceCommit: process.env.GITHUB_SHA || null,
  appVersion: version,
};

fs.writeFileSync("SNACK_PREVIEW.json", JSON.stringify(payload, null, 2) + "\n");
console.log(JSON.stringify(payload));
