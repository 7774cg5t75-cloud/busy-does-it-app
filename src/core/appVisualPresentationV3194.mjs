/**
 * V3.194 shared finite presentation rules. The same source is copied to the
 * unsigned native shell and imported by Busy's marketplace preview.
 * No remote fonts, arbitrary CSS/JS, data access or public side effects.
 */
const TYPE_STYLES=Object.freeze(["balanced","editorial","impact","friendly"]);
const SERVICE_STYLES=Object.freeze(["cards","rows","spotlight"]);
const TYPE_LABELS=Object.freeze({
 balanced:"Balanced and clear",editorial:"Editorial and elegant",
 impact:"Bold and confident",friendly:"Friendly and relaxed"
});
const SERVICE_LABELS=Object.freeze({
 cards:"Service cards",rows:"Clean service list",spotlight:"Featured services"
});
const TYPE_RULES=Object.freeze({
 balanced:Object.freeze({titleSize:28,titleWeight:"800",titleSpacing:-.3,
  sectionSize:20,sectionWeight:"700",bodySize:15}),
 editorial:Object.freeze({titleSize:34,titleWeight:"600",titleSpacing:-.9,
  sectionSize:23,sectionWeight:"600",bodySize:16}),
 impact:Object.freeze({titleSize:36,titleWeight:"900",titleSpacing:-.7,
  sectionSize:24,sectionWeight:"800",bodySize:15}),
 friendly:Object.freeze({titleSize:29,titleWeight:"700",titleSpacing:.15,
  sectionSize:21,sectionWeight:"700",bodySize:16})
});
function appVisualPresentation(presentation={}){
 const pick=(arr,v,fallback)=>arr.includes(v)?v:fallback;
 const typeStyle=pick(TYPE_STYLES,presentation?.typeStyle,"balanced");
 const serviceStyle=pick(SERVICE_STYLES,presentation?.serviceStyle,"cards");
 const headerStyle=pick(["quiet","bold","refined"],presentation?.headerStyle,"refined");
 const type=TYPE_RULES[typeStyle];
 return Object.freeze({
  typeStyle,serviceStyle,headerStyle,type,
  headerCentered:headerStyle==="refined",
  headerCompact:headerStyle==="quiet",
  headerEmphasis:headerStyle==="bold",
  serviceColumns:serviceStyle==="rows"?1:null,
  featuredFirst:serviceStyle==="spotlight",
  visualRulesOnly:true,doesNotChangeCustomerData:true,
  requiresOwnerApprovedAppearance:true
 });
}
export {TYPE_STYLES,SERVICE_STYLES,TYPE_LABELS,SERVICE_LABELS,appVisualPresentation};
