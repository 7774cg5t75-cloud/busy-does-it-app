import fs from "node:fs";
import { Snack } from "snack-sdk";

const source = fs.readFileSync("BusyDoesItApp.js", "utf8");
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
    "@react-native-community/datetimepicker": {
      version: "8.4.4",
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
