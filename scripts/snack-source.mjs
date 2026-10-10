/**
 * Assemble the self-contained Expo Snack source tree.
 * Expo Snack resolves *.js; internal Node ESM *.mjs files must be included
 * and their relative import specifiers converted to *.js as well.
 *
 * A successful snack.saveAsync does not imply Metro resolved any imports.
 */
import fs from "node:fs";
import path from "node:path";

function collectJsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectJsFiles(full));
    else if (entry.isFile() && /\.(?:js|mjs)$/i.test(entry.name)) files.push(full);
  }
  return files.sort();
}
function toSnackPath(sourcePath) {
  return (sourcePath === "BusyDoesItApp.js"
    ? "App.js"
    : sourcePath.split(path.sep).join("/").replace(/\.mjs$/i, ".js"));
}
function prepareSource(source, {aiUrl=process.env.EXPO_PUBLIC_BUSY_AI_URL||"",
  aiToken=process.env.EXPO_PUBLIC_BUSY_AI_TOKEN||""}={}) {
  return source
    .replaceAll(
      'import * as Calendar from "expo-calendar/legacy";',
      'import * as Calendar from "expo-calendar";'
    )
    // Expo Go Snack SDK54 may not have react-native-svg's native module.
    // The actual native app source is untouched; only previews get a safe link.
    .replaceAll(
      'import QRCode from "react-native-qrcode-svg";',
      'import QRCode from "../components/snackQrFallback";'
    )
    .replaceAll("process.env.EXPO_PUBLIC_BUSY_AI_URL", JSON.stringify(aiUrl))
    .replaceAll("process.env.EXPO_PUBLIC_BUSY_AI_TOKEN", JSON.stringify(aiToken))
    // Snack maps every internal *.mjs file to *.js. Rewrite imports as well.
    // Restrict to quoted relative paths, not arbitrary prose/module names.
    .replace(/(["'])(\.{1,2}\/[^\x22\x27\x60\s]+)\.mjs\1/g, (_m,quote,rel) =>
      quote + rel + ".js" + quote);
}
function snackSourceFiles() {
  const files = {};
  // Share the same design logic in native builds and the optional Snack fallback.
  const sourcePaths = ["BusyDoesItApp.js", ...collectJsFiles("src"),
    "supabase/functions/busy-website-worker/designSystem.mjs"];
  for(const sourcePath of sourcePaths) {
    const snackPath = toSnackPath(sourcePath);
    if(Object.prototype.hasOwnProperty.call(files,snackPath))
      throw Error("Snack module collision: "+snackPath);
    files[snackPath] = {
      type: "CODE",
      contents: prepareSource(fs.readFileSync(sourcePath,"utf8")),
    };
  }
  return files;
}
function validateSnackImports(files) {
  const issues=[];
  const virtualPaths=new Set(Object.keys(files));
  for(const [file,record] of Object.entries(files)){
    const contents=String(record?.contents||"");
    // Match static from imports, side-effect imports and dynamic import().
    // Babel verifies full JS syntax during publishing.
    const re=/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)(["'])([^\x22\x27\x60]+)\1/g;
    for(const m of contents.matchAll(re)){
      const spec=m[2];
      if(!spec.startsWith("./")&&!spec.startsWith("../"))continue;
      const normalized=path.posix.normalize(path.posix.join(path.posix.dirname(file),spec));
      const possibilities=/\.[cm]?js$/i.test(normalized)
        ?[normalized]:[normalized+".js",normalized+"/index.js"];
      if(!possibilities.some(p=>virtualPaths.has(p)))
        issues.push(file+" imports missing "+spec+" (searched "+possibilities.join(", ")+")");
    }
  }
  return issues;
}
/**
 * Expo Snack does not infer npm packages from the repository's package.json.
 * Every bare package import in uploaded source requires an explicit Snack
 * dependency, except the Expo built-in runtime packages.
 */
function validateSnackPackages(files, declaredDependencies={}) {
  const core=new Set(["react","react-native","expo"]);
  const declared=new Set(Object.keys(declaredDependencies));
  const issues=[];
  const known=new Set();
  for(const [file,record] of Object.entries(files)) {
    const source=String(record?.contents||"");
    const re=/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*)(["'])([^\x22\x27\x60]+)\1/g;
    for(const found of source.matchAll(re)){
      const spec=found[2];
      if(spec.startsWith(".")||spec.startsWith("/")||spec.startsWith("node:"))continue;
      // Ignore quoted prose caught by loose import scanning. A real npm
      // module specifier cannot contain spaces or punctuation like commas.
      if(!/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9._/-]+)*$/i.test(spec))continue;
      const bits=spec.split("/");
      const pkg=spec.startsWith("@")?bits.slice(0,2).join("/"):bits[0];
      if(core.has(pkg)||declared.has(pkg))continue;
      const key=file+" => "+pkg;
      if(!known.has(key)){issues.push(key+" missing from Expo Snack dependencies");known.add(key);}
    }
  }
  return issues;
}

export {collectJsFiles,toSnackPath,prepareSource,snackSourceFiles,validateSnackImports,validateSnackPackages};
