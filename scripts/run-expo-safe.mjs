// Canonical local Expo entry: verified dependency containment before config IO.
import {applyToolingSecurityPatches} from './apply-tooling-security-patches.mjs';import {createRequire} from 'node:module';import {spawnSync} from 'node:child_process';import {dirname,join} from 'node:path';
import {verifyToolingDependencyPolicy} from './dependency-policy.mjs';
import {reviewExpoArguments} from './lib/expo-safe-arguments.mjs';
const args=reviewExpoArguments(process.argv.slice(2));
verifyToolingDependencyPolicy();applyToolingSecurityPatches();const require=createRequire(import.meta.url),cli=join(dirname(require.resolve('expo/package.json')),'bin/cli');
const result=spawnSync(process.execPath,[cli,...args],{stdio:'inherit',env:{...process.env,EXPO_NO_TELEMETRY:'1',...(args[0]==='export'?{EXPO_OFFLINE:'1'}:{})}});if(result.error)throw result.error;process.exitCode=result.status??1;
