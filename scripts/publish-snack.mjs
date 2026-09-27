import fs from "node:fs";
import { Snack } from "snack-sdk";
import * as babelParser from "@babel/parser";

const source = fs.readFileSync("BusyDoesItApp.js", "utf8");

// Fail the preview build before publishing if the React Native source has invalid JS/JSX syntax.
babelParser.parse(source, { sourceType: "module", plugins: ["jsx"] });
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const version = pkg.version || "preview";
const branch = process.env.GITHUB_REF_NAME || `v${version}`;

const snack = new Snack({
  name: `Busy Does It v${version.replace(/^0\./, "0.")}`,
  description: `Auto-generated preview from the ${branch} GitHub branch`,
  files: {
    "App.js": {
      type: "CODE",
      contents: source,
    },
  },
  dependencies: {
    "@react-native-async-storage/async-storage": {
      version: "2.2.0",
    },
    "expo-image-picker": {
      version: "17.0.11",
    },
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
