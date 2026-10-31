import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[];
for(const mode of ['midnight','daylight']){
 const rt=createRuntime({width:393}),theme=rt.load('src/theme/appearance.mjs');await theme.updateAppearance({mode},async()=>{});
 const {BusyHomeEntry}=rt.load('src/components/BusyHomeEntry.js'),{BusyOrb}=rt.load('src/components/BusyOrb.js'),{BusyOrbConstellation}=rt.load('src/components/BusyOrbConstellation.js');
 const events=[],s={homeCommandCentre:{greeting:'Good evening'},busyEntryText:'Owner words\n',openTalkToBusy:v=>events.push(['voice',v]),sendBusyEntry:v=>events.push(['send',v]),setBusyEntryText:v=>events.push(['type',v])};
 const entry=rt.render(BusyHomeEntry,{s}),nodes=walk(entry),orb=nodes.find(n=>n.type===BusyOrb),greeting=nodes.find(n=>n.type==='Text'&&JSON.stringify(n.props?.children)==='["Good evening"]'),input=nodes.find(n=>n.type==='TextInput');
 assert.ok(nodes.indexOf(orb)<nodes.indexOf(greeting)&&nodes.indexOf(greeting)<nodes.indexOf(input));assert.equal(orb.props.luminous,true);assert.equal(input.props.value,'Owner words\n');
 input.props.onChangeText('Edited\n');assert.deepEqual(events.at(-1),['type','Edited\n']);orb.props.onPress();assert.deepEqual(events.at(-1),['voice',true]);
 const Hero=()=>BusyOrb({size:196,luminous:true}),Mini=()=>BusyOrb({size:48});const hero=rt.render(Hero,{}),mini=rt.render(Mini,{}),constellation=rt.render(BusyOrbConstellation,{});
 assert.ok(walk(hero).some(n=>n.type==='Path'&&n.props.stroke==='#26E7FF'));assert.ok(!walk(mini).some(n=>n.type==='Path'&&n.props.stroke==='#26E7FF'),'Home-only light must not overbrighten the dock/mini');
 assert.ok(walk(constellation).filter(n=>n.type==='Path').length>=2);assert.ok(walk(constellation).filter(n=>n.type==='Circle').length>=21);
 const ids=[hero,mini,constellation].flatMap(t=>walk(t).filter(n=>n.props?.id).map(n=>n.props.id));assert.equal(new Set(ids).size,ids.length);
 assert.equal(constellation.props.pointerEvents,'none');assert.equal(constellation.props.accessibilityElementsHidden,true);
}
const home=fs.readFileSync('src/screens/home.js','utf8');assert.ok(!home.includes('title={s.homeCommandCentre?.greeting'));assert.ok(home.indexOf('<HomeCoreAreas')<home.indexOf('Your day at a glance'));assert.match(home,/s.jump\("results", "Results"\)/);
const orbital=fs.readFileSync('src/components/BusyOrbConstellation.js','utf8');assert.ok(!/setInterval|setTimeout|Math.random|requestAnimationFrame/.test(orbital));
console.log('PASS actual Home orb-before-greeting-before-composer, exact owner wording/actions, Home-only electric layers, connected tracks and 7 luminous nodes, unique SVG references, both palettes, static accessible decoration and genuine results route. Source/component proof only; no physical visual acceptance.');
