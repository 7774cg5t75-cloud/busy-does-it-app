/**
 * Selected-website voice safety policy (V3.142).
 * Silence is NEVER an end-of-speech signal. Duration is a disclosed
 * safety cap, not voice-activity detection or background transmission.
 * At the cap the recording is retained locally for explicit owner review.
 */
const MAX_WEBSITE_VOICE_MS=5*60*1000;
const VOICE_WARNING_MS=4*60*1000;
const MAX_WEBSITE_VOICE_BYTES=9_000_000;
const MIN_WEBSITE_VOICE_BYTES=100;
const VALID_VOICE_TYPES=["audio/mp4","audio/m4a","audio/x-m4a","audio/aac","application/octet-stream",""];
function voiceTime(milliseconds){
 const seconds=Math.max(0,Math.floor(Number(milliseconds)||0)/1000);
 return String(Math.floor(seconds/60)).padStart(2,"0")+":"+
  String(seconds%60).padStart(2,"0");
}
function voiceDurationState(milliseconds){
 const value=Math.max(0,Number(milliseconds)||0);
 return {elapsed:voiceTime(value),
  warning:value>=VOICE_WARNING_MS&&value<MAX_WEBSITE_VOICE_MS,
  atLimit:value>=MAX_WEBSITE_VOICE_MS,
  remaining:voiceTime(Math.max(0,MAX_WEBSITE_VOICE_MS-value))};
}
function voiceUploadEligible(bytes,contentType=""){
 return Number.isFinite(bytes)&&bytes>=MIN_WEBSITE_VOICE_BYTES&&
   bytes<=MAX_WEBSITE_VOICE_BYTES&&
   VALID_VOICE_TYPES.includes(contentType);
}
export {MAX_WEBSITE_VOICE_MS,VOICE_WARNING_MS,MAX_WEBSITE_VOICE_BYTES,
 MIN_WEBSITE_VOICE_BYTES,VALID_VOICE_TYPES,voiceTime,voiceDurationState,voiceUploadEligible};
