import {heroFamilies} from '../../supabase/functions/busy-website-worker/websiteHeroFamilies.mjs';
// Finite source-aware suggestions, never an authority or a learned model.
// Existing preferences/current choice survive; rejected directions are session
// feedback only, not copied into canonical business facts.
export function premiumWebsiteDirections(draft,{rejected=[]}={}){
 const visible=(draft?.sections||[]).filter(s=>s.enabled!==false),hero=visible.find(s=>s.type==='hero');
 const assets=[hero?.asset,...visible.filter(s=>s.type==='gallery').flatMap(s=>s.items||[])].filter(a=>a?.approved===true&&typeof a.uri==='string'&&/^https:\/\/[^\s"'<>]+$/.test(a.uri));
 const count=new Set(assets.map(a=>a.storagePath||a.uri)).size;
 const words=[draft?.businessType,hero?.body,draft?.designPlan?.brief?.goal,...visible.filter(s=>s.type==='services').flatMap(s=>(s.items||[]).map(i=>i.title))].join(' ').toLowerCase();
 const products=visible.some(s=>s.type==='products'&&s.contentSource==='business_records_v1');
 return heroFamilies.filter(f=>!rejected.includes(f.id)&&f.id!==draft?.theme?.heroComposition&&f.media<=count&&(f.id!=='product-showcase'||products)).map((f,index)=>({id:f.id,label:f.label,score:(f.id==='typography-first'&&!count?100:0)+(f.id==='editorial-collage'&&count>=3?(/creative|portfolio|habitat/.test(words)?90:40):0)+(f.id==='product-showcase'&&products?60:0)+(f.id==='quiet-portrait'&&/calm|wellness|rest|gentle/.test(words)?70:0)+(f.id==='asymmetric-split'&&/design-led|garden design|landscape/.test(words)?80:0)+(f.id==='service-led'&&/maintenance|clean|repair/.test(words)?60:0)+(f.id==='cinematic-full-bleed'&&/property owners|expansive|immersive/.test(words)?75:0)+(f.id==='story-spread'&&/food|festival|story|catering/.test(words)?85:0),index,reason:f.media?`Uses ${f.media===1?'an approved photograph':'multiple approved photographs'} and keeps your current copy and branding.`:'A confident typographic direction without invented photography.'})).sort((a,b)=>b.score-a.score||a.index-b.index);
}
