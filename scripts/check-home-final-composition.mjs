import assert from 'node:assert/strict';import {createRequire} from 'node:module';import fs from 'node:fs';
import {homeHeroGeometry,orbMotion} from '../src/theme/interaction.mjs';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[],flat=x=>Object.assign({},...(Array.isArray(x)?x.flat(Infinity):[x]).filter(Boolean));
for(const width of [240,280,320,350,375,393,430,768,1024,1400]){
 const g=homeHeroGeometry({width});assert.ok(g.orbSize<=g.available);assert.ok(g.heroHeight>g.orbSize*1.035+4,'Full maximum active halo must fit with breathing room');
 if(width>=350)assert.ok(g.orbSize>=196&&g.orbSize<=204,'Do not shrink signature hero');
 for(const fontScale of [1,1.6,2.4]){
  const rt=createRuntime({width,fontScale}),{BusyHomeEntry}=rt.load('src/components/BusyHomeEntry.js'),{BusyOrb}=rt.load('src/components/BusyOrb.js');
  const t=rt.render(BusyHomeEntry,{s:{homeCommandCentre:{greeting:'A long genuine greeting that must wrap naturally'}}}),nodes=walk(t),orb=nodes.find(n=>n.type===BusyOrb),row=nodes.find(n=>n.type==='View'&&n.props.style?.height===g.heroHeight);
  assert.equal(orb.props.size,g.orbSize);assert.ok(row);assert.equal(row.props.style.overflow,undefined);const greeting=nodes.find(n=>n.props?.accessibilityRole==='header');assert.equal(greeting.props.numberOfLines,undefined);assert.equal(greeting.props.allowFontScaling,undefined);
 }
}
for(const mode of ['midnight','daylight']){
 const rt=createRuntime({width:393});await rt.load('src/theme/appearance.mjs').updateAppearance({mode},async()=>{});
 const {Shell,BusyBrandLockup}=rt.load('src/components/ui.js'),{BusyBrandStar,PremiumAtmosphere}=rt.load('src/components/PremiumAtmosphere.js');
 const home=rt.render(Shell,{s:{screen:'home',history:[]}}),scroll=walk(home).find(n=>n.type==='ScrollView');assert.equal(flat(scroll.props.style).backgroundColor,'transparent','Do not obscure atmospheric SVG behind an opaque ScrollView');
 const work=rt.render(Shell,{s:{screen:'workHub',history:[]}});assert.notEqual(flat(walk(work).find(n=>n.type==='ScrollView').props.style).backgroundColor,'transparent','Keep task-heavy screens calm');
 const lock=rt.render(BusyBrandLockup,{});assert.ok(walk(lock).some(n=>n.type===BusyBrandStar));assert.ok(JSON.stringify(lock).includes('Busy Does It'));
 const stars=rt.render(BusyBrandStar,{});assert.equal(stars.props.accessibilityElementsHidden,true);assert.ok(walk(stars).some(n=>n.type==='RadialGradient'));
 const atmosphere=rt.render(PremiumAtmosphere,{screen:'home'}),calm=rt.render(PremiumAtmosphere,{screen:'results'});assert.equal(walk(atmosphere).filter(n=>n.type==='Path').length,2);assert.equal(walk(calm).filter(n=>n.type==='Path').length,0);
 assert.equal(atmosphere.props.pointerEvents,'none');
 const {BusyOrbConstellation}=rt.load('src/components/BusyOrbConstellation.js');const orbit=rt.render(BusyOrbConstellation,{});
 for(const node of walk(orbit).filter(n=>n.type==='Circle')){const {cx,cy,r}=node.props;assert.ok(cx-r>=0&&cx+r<=340&&cy-r>=0&&cy+r<=184,'Every node glow fits orbital viewBox');}
 const ids=[stars,atmosphere,orbit].flatMap(t=>walk(t).filter(n=>n.props?.id).map(n=>n.props.id));assert.equal(new Set(ids).size,ids.length);
 for(const t of [stars,atmosphere,orbit])for(const n of walk(t))for(const v of Object.values(n.props||{}))if(typeof v==='string'&&v.startsWith('url(#'))assert.ok(ids.includes(v.slice(5,-1)),'All paint references resolve');
}
assert.equal(orbMotion('idle',{enabled:false}),null);const atmosphere=fs.readFileSync('src/components/PremiumAtmosphere.js','utf8');assert.ok(!/setInterval|setTimeout|requestAnimationFrame/.test(atmosphere));
console.log('PASS responsive halo containment at 10 widths/3 text scales, original greeting expansion, visible Home background layer, calmer business screens, luminous accessible cyan-star primitive, both palettes, no decorative animation/timers. Not physical-device appearance proof.');
