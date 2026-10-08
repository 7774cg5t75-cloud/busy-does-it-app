/**
 * V3.67 - explicit, informational questions about source-verified activity.
 * Prevent guesses and block any implied authority to publish, retry or schedule.
 */
const bounded=t=>String(t||"").trim().slice(0,320);
function isBusinessActivityQuestion(text){
  const t=bounded(text);
  if(!t || !/\b(did|has|have|was|were|is|are|which|what|show|check|tell me|status|confirmed)\b/i.test(t))return false;
  const topical=/\b(publish(?:ed|ing)?|posted|live|launch(?:ed)?|deployed|released|failed|failure|result|went out|go live|went live)\b/i.test(t);
  const context=/\b(website|site|app|social|facebook|instagram|post|marketing|channel|business|service|project|everything|anything|all|deployment|release)\b/i.test(t);
  const question=/^(did|has|have|was|were|is|are|which|what|show|check|tell me|status|can you check)\b/i.test(t);
  // A request to POST, PUBLISH or SCHEDULE is not an informational question.
  if(/\b(publish|post|release|launch|schedule|retry|delete|remove)\b.{0,40}\b(now|please|for me|it|that|this)\b/i.test(t)&&!question)return false;
  return topical&&context&&question;
}
export {isBusinessActivityQuestion};
