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
    else if (entry.isFile() && /\.js$/i.test(entry.name)) files.push(full);
  }
  return files;
}

function prepareSource(source) {
  return source
    .replaceAll(
      'import * as Calendar from "expo-calendar/legacy";',
      'import * as Calendar from "expo-calendar";'
    )
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
const files = {};

for (const sourcePath of sourcePaths) {
  const prepared = prepareSource(fs.readFileSync(sourcePath, "utf8"));
  babelParser.parse(prepared, { sourceType: "module", plugins: ["jsx"] });
  const snackPath =
    sourcePath === "BusyDoesItApp.js"
      ? "App.js"
      : sourcePath.split(path.sep).join("/");
  files[snackPath] = { type: "CODE", contents: prepared };
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const version = pkg.version || "preview";
const branch = process.env.GITHUB_REF_NAME || `v${version}`;

const snack = new Snack({
  name: `Busy Does It v${version.replace(/^0\./, "0.")}`,
  description: `Auto-generated preview from the ${branch} GitHub branch`,
  files,
  dependencies: {
    "@react-native-async-storage/async-storage": { version: "2.2.0" },
    "expo-image-picker": { version: "17.0.11" },
    "expo-audio": { version: "1.1.1" },
    "expo-secure-store": { version: "15.0.8" },
    "expo-notifications": { version: "0.32.17" },
    "expo-calendar": { version: "15.0.8" },
    "expo-constants": { version: "18.0.14" },
  },
});

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
