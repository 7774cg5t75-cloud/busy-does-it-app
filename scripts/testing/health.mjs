import {health} from './tooling.mjs';
const report=health();console.log(JSON.stringify(report,null,2));process.exitCode=report.ok?0:2;
