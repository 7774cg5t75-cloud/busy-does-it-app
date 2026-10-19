import {textTypographyClasses} from "./websiteTextTypography.mjs";
// Canonical finite appearance classes for native previews, hosted HTML and exports.
function sectionAppearanceClasses(section){
  const fields={serviceLayout:['directory','cards'],ctaSize:['spacious','wide'],bodyScale:['large'],mobileBodyScale:['large'],desktopBodyScale:['large'],headingScale:["compact","large"],textAlign:["center"],
    sectionSpacing:["compact","generous"],mobileSectionSpacing:["compact","generous"],desktopSectionSpacing:["compact","generous"],photoCrop:["top","bottom"],
    photoSide:["right"],desktopPhotoSide:["left","right"],gallerySize:["compact","large"],
    mobileHeadingScale:["compact","large"],desktopHeadingScale:["compact","large"],
    mobileGallerySize:["compact","large"],desktopGallerySize:["compact","large"]};
  const names={serviceLayout:'services',ctaSize:'cta',bodyScale:'body',mobileBodyScale:'mobile-body',desktopBodyScale:'desktop-body',headingScale:"heading",textAlign:"align",
    sectionSpacing:"space",mobileSectionSpacing:"mobile-space",desktopSectionSpacing:"desktop-space",photoCrop:"crop",photoSide:"photo",desktopPhotoSide:"desktop-photo",gallerySize:"gallery",
    mobileHeadingScale:"mobile-heading",desktopHeadingScale:"desktop-heading",
    mobileGallerySize:"mobile-gallery",desktopGallerySize:"desktop-gallery"};
  const appearance=section?.appearance;
  if(!appearance||typeof appearance!=="object"||Array.isArray(appearance))return "";
  const output=[];
  for(const field of Object.keys(fields)){
    if(fields[field].includes(appearance[field]))output.push("owner-"+names[field]+"-"+appearance[field]);
  }
  return [...output,textTypographyClasses(section)].filter(Boolean).join(" ");
}
export {sectionAppearanceClasses};
