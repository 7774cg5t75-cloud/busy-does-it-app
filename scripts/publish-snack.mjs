import fs from "node:fs";
import { Snack } from "snack-sdk";

const source = fs.readFileSync("BusyDoesItApp.js", "utf8");

const snack = new Snack({
  name: "Busy Does It v0.4",
  description: "Auto-generated preview from the v0.4 GitHub branch",
  sdkVersion: "57.0.0",
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
  },
});

const result = await snack.saveAsync({ ignoreUser: true });

const payload = {
  generatedAt: new Date().toISOString(),
  id: result.id,
  webUrl: `https://snack.expo.dev/${result.id}`,
  expoUrl: result.url,
  sourceBranch: process.env.GITHUB_REF_NAME || "v0.4",
  sourceCommit: process.env.GITHUB_SHA || null,
};

fs.writeFileSync("SNACK_PREVIEW.json", JSON.stringify(payload, null, 2) + "\n");
console.log(JSON.stringify(payload));
