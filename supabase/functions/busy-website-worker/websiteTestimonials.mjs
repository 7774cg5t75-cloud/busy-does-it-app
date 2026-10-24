export function validTestimonialSpotlight(section){
 const rows=section?.items;
 return section?.type==='testimonials'&&Array.isArray(rows)&&rows.length>=2&&rows.every(row=>row&&['id','title','body'].every(field=>typeof row[field]==='string'&&row[field].trim()))&&new Set(rows.map(row=>row.id)).size===rows.length;
}
// Original owner-supplied quotations only. No ratings, verification claims or new copy.
export function testimonialSpotlightItems(section,{escapeHtml,editAttrs=()=>'',itemHeadingClass=()=>'',itemTypographyClasses=()=>''}){
 const items=section?.items;
 if(!validTestimonialSpotlight(section))return '';
 return `<div class="testimonial-spotlight">${items.map(item=>`<article${itemTypographyClasses(item)?` class="${itemTypographyClasses(item)}"`:''}><h3${itemHeadingClass(item)}${editAttrs(section,'title',String(item.id||''))}>${escapeHtml(item.title)}</h3><p${editAttrs(section,'body',String(item.id||''))}>${escapeHtml(item.body)}</p></article>`).join('')}</div>`;
}
