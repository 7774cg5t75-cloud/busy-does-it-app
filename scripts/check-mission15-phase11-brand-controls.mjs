import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {nativePalette,PALETTES,contrast} from '../src/core/nativePalette.mjs';
import {auditStandaloneContrast} from '../src/core/appContrastAudit.mjs';
import {proposeCoordinatedAppChanges} from '../src/core/appCoordinatedStudio.mjs';
import {proposeSelectedAppInstruction} from '../src/core/appContextInstruction.mjs';
import {nativePalette as standalonePalette} from '../standalone/template/nativePalette.mjs';
const {createRuntime}=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs');
const rt=createRuntime(),{AppVisualSelection}=rt.load('src/screens/appVisualSelection.js'),{AppSelectedBrandControls}=rt.load('src/screens/appSelectedBrandControls.js'),{MiniAppSurface}=rt.load('src/screens/miniApps.js');
const walk=n=>Array.isArray(n)?n.flatMap(walk):n&&typeof n==='object'?[n,...walk(n.props?.children)]:[];
const find=(t,label)=>walk(t).find(n=>n.props?.label===label||n.props?.accessibilityLabel===label);
// Exhaust a bounded RGB lattice, plus the reported failing seeds. Calculated
// colours only: no claim about photo backgrounds, geometry or screenshots.
const seeds=['#000000','#FFFFFF','#FF0000','#228822','#112233'];
for(let r=0;r<=255;r+=51)for(let g=0;g<=255;g+=51)for(let b=0;b<=255;b+=51)seeds.push('#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join(''));
for(const seed of seeds){const c=nativePalette('custom',seed);assert.ok(contrast(c.accent,c.surface)>=4.5,seed);assert.ok(contrast(c.accent,c.bg)>=4.5,seed);assert.ok(auditStandaloneContrast(c).normalTextAA,seed);assert.deepEqual(standalonePalette('custom',seed),c);}
for(const colors of Object.values(PALETTES))assert.ok(auditStandaloneContrast(colors).normalTextAA);
const config={modules:['business_profile','services','enquiry'].map(key=>({key,enabled:true})),navigation:['business_profile','services','enquiry'],presentation:{brandPalette:'custom',brandAccent:'#228822'},publicProfile:{businessName:'Fictional workshop',services:[{id:'survey',name:'Survey',description:'Owner-written.'}]}};
const original=JSON.stringify(config),proposals=[],props={Surface:MiniAppSurface,config,onPrepare:p=>proposals.push(p)};let panel,controls;
function render(){panel=rt.render(AppVisualSelection,props);const child=walk(panel).find(n=>n.type===AppSelectedBrandControls);controls=child?rt.render(AppSelectedBrandControls,child.props):null;}
render();find(panel,'Select app colours').props.onPress();render();assert.match(JSON.stringify(controls),/App-wide colours/);find(controls,'Preview Natural linen').props.onPress();let p=proposals.at(-1);assert.ok(p);assert.equal(p.nextConfig.presentation.brandPalette,'linen');assert.equal(p.nextConfig.presentation.brandAccent,undefined);assert.deepEqual(JSON.parse(JSON.stringify(p.nextConfig.publicProfile)),config.publicProfile);const undo=proposeCoordinatedAppChanges(p.nextConfig,p.undoOperations);assert.ok(undo.ok);assert.deepEqual(JSON.parse(JSON.stringify(undo.nextConfig)),config);
const reloaded=JSON.parse(JSON.stringify(p.nextConfig)),surface=rt.render(MiniAppSurface,{config:reloaded,interactive:true,onSelectService:()=>{}});assert.ok(walk(surface).some(n=>n.props?.style?.backgroundColor===nativePalette('linen').surface));assert.ok(find(surface,'Ask about Survey'));assert.ok(walk(surface).some(n=>n.props?.style?.color===nativePalette('linen').text));
assert.ok(proposeSelectedAppInstruction(config,{selection:{part:'branding'},text:'use Natural linen'}).ok);assert.equal(proposeSelectedAppInstruction(config,{selection:{part:'branding'},text:'use red and publish'}).ok,false);
const old=find(controls,'Preview Natural linen'),count=proposals.length;props.config={...config,presentation:{...config.presentation,ownerLockedElements:['branding']}};render();old.props.onPress();assert.equal(proposals.length,count);find(panel,'Use current app source').props.onPress();render();assert.equal(find(controls,'Preview Natural linen').props.disabled,true);find(controls,'Preview Natural linen').props.onPress();assert.equal(proposals.length,count);
const spotlight={...config,presentation:{...config.presentation,serviceStyle:'spotlight'}};
const rendered=rt.render(MiniAppSurface,{config:spotlight,interactive:true});
const featured=walk(rendered).find(node=>node.props?.children?.some(value=>typeof value==='string'&&value.trim()==='Featured service'));
assert.ok(featured);const card=walk(rendered).find(node=>Array.isArray(node.props?.children)&&node.props.children.includes(featured));
assert.ok(card?.props.style.backgroundColor);assert.ok(contrast(featured.props.style.color,card.props.style.backgroundColor)>=4.5,'Actual small featured text against actual rendered service-card background');
for(const brandPalette of ['__proto__','constructor','unknown']){
 const bad=rt.render(AppSelectedBrandControls,{config:{...config,presentation:{brandPalette}},onPrepare:()=>{throw Error('Invalid palette cannot prepare');}});
 assert.match(JSON.stringify(bad),/Current app colours need review/);assert.doesNotMatch(JSON.stringify(bad),/Calculated text contrast passes/);
 assert.equal(find(bad,'Preview Natural linen').props.disabled,true);
}
assert.equal(JSON.stringify(config),original);console.log('PASS 221 custom seeds + curated palettes on supported solid backgrounds, real palette/renderer parity, compact scoped controls, selected natural instruction, original Undo, JSON reload, source/branding locks and preserved actions. No screenshot/device certification.');
