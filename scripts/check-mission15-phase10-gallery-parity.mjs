import {appImagePresentation} from '../src/core/appImageAppearance.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {nativePalette,PALETTES,contrast} from '../src/core/nativePalette.mjs';
import {appVisualPresentation} from '../src/core/appVisualPresentationV3194.mjs';
import {publicNativeMiniAppProjection} from '../supabase/functions/busy-mini-app-guest/publicNativeProjection.mjs';
const require=createRequire(import.meta.url),{createRuntime}=require('./lib/offline-component-runtime.cjs'),babel=require('@babel/core');
const rt=createRuntime(),{AppGallerySurface}=rt.load('src/screens/appGallerySurface.js'),{MiniAppSurface}=rt.load('src/screens/miniApps.js');
const walk=n=>Array.isArray(n)?n.flatMap(walk):n&&typeof n==='object'?[n,...walk(n.props?.children)]:[];
const config={modules:['business_profile','gallery','enquiry'].map(key=>({key,enabled:true})),navigation:['business_profile','gallery','enquiry'],publicProfile:{businessName:'Fictional gallery',assets:{gallery:[{uri:'https://example.test/a.png',approved:true,caption:'Approved caption',alt:'Accessible owner text'}]}}};
const observed=[];
for(const brandPalette of Object.keys(PALETTES)){
 const c={...config,presentation:{brandPalette,typeStyle:'editorial'}},visual=appVisualPresentation(c.presentation),colors=nativePalette(brandPalette);
 const parent=rt.render(MiniAppSurface,{config:c,interactive:true}),child=walk(parent).find(node=>node.type===AppGallerySurface);assert.ok(child);
 const tree=rt.render(AppGallerySurface,child.props);assert.equal(tree.props.style.backgroundColor,colors.surface);
 const caption=walk(tree).find(node=>node.props?.children?.includes('Approved caption'));assert.ok(caption);assert.equal(caption.props.style.color,colors.muted);assert.equal(caption.props.style.fontSize,visual.type.bodySize);assert.ok(contrast(caption.props.style.color,tree.props.style.backgroundColor)>=4.5,brandPalette);
 assert.equal(walk(tree).some(node=>node.props?.accessibilityLabel==='Select gallery photo 1'),false);
}
const colors=nativePalette('porcelain'),visual=appVisualPresentation({typeStyle:'editorial'}),onObservation=event=>observed.push(event);
const tree=rt.render(AppGallerySurface,{config,responsive:{ok:true,galleryColumns:2,galleryHeight:230,gap:12},colors,visual,ImageComponent:'ImageFixture',onQualityObservation:onObservation});
const image=walk(tree).find(node=>node.type==='ImageFixture');assert.equal(image.props.accessibilityLabel,'Accessible owner text');assert.equal(image.props.style.height,230);assert.equal(image.props.onObservation,onObservation);
const publicApp=publicNativeMiniAppProjection({id:'a',status:'live',public_slug:'fictional',current_live_version_id:'v'},{id:'v',config},{expectedAppId:'a',expectedVersionId:'v'});assert.ok(publicApp.ok);assert.equal(publicApp.gallery[0].caption,'Approved caption');
// Exact original standalone information renderer, inert native element boundary.
const source=readFileSync('standalone/template/App.js','utf8'),ast=babel.parseSync(source,{configFile:false,babelrc:false,sourceType:'module',parserOpts:{plugins:['jsx']}}),nodes=ast.program.body.filter(node=>node.type==='FunctionDeclaration'&&node.id.name==='LiveInfo');assert.equal(nodes.length,1);
const code=babel.transformSync(source.slice(nodes[0].start,nodes[0].end),{configFile:false,babelrc:false,plugins:[[require('@babel/plugin-transform-react-jsx'),{runtime:'classic'}]]}).code;
const React={createElement:(type,props,...children)=>({type,props:{...props,children}})};
const native=Function('appImagePresentation','React','View','Text','Image','box','t','sub','COLORS','VISUAL','LOOK',code+';return LiveInfo;')(appImagePresentation,React,'View','Text','Image',{backgroundColor:colors.surface},{color:colors.text},{color:colors.muted},colors,visual,{});
const result=native({screen:{key:'gallery'},app:publicApp,layout:{ok:true,galleryColumns:1,galleryHeight:230}}),caption=walk(result).find(node=>node.props?.children?.includes('Approved caption'));
assert.equal(caption.props.style.fontSize,visual.type.bodySize);assert.equal(caption.props.style.color,colors.muted);assert.equal(walk(result).find(node=>node.type==='Image').props.accessibilityLabel,'Accessible owner text');
const styled=native({screen:{key:'gallery'},app:{...publicApp,imageStyles:{[publicApp.gallery[0].uri]:{fit:'contain',size:'large',corners:'square'}}},layout:{ok:true,galleryColumns:1,galleryHeight:230}}),styledImage=walk(styled).find(node=>node.type==='Image');assert.equal(styledImage.props.resizeMode,'contain');assert.equal(styledImage.props.style.height,288);assert.equal(styledImage.props.style.borderRadius,2);
const many=Array.from({length:18},(_,i)=>({uri:'https://example.test/'+i+'.png',approved:true,caption:'Photo '+i}));
const parityConfig={...config,publicProfile:{...config.publicProfile,assets:{gallery:[{uri:'https://example.test/unapproved.png',approved:false},...many]}}};
const projected=publicNativeMiniAppProjection({id:'a',status:'live',public_slug:'fictional',current_live_version_id:'v'},{id:'v',config:parityConfig},{expectedAppId:'a',expectedVersionId:'v'});assert.equal(projected.gallery.length,15);
const publicTree=rt.render(AppGallerySurface,{config:parityConfig,responsive:{ok:false},colors,visual,ImageComponent:'ImageFixture',publicMode:true,ownerSelection:{onSelect:()=>{throw Error('Public editor must be absent');}}});
assert.deepEqual(walk(publicTree).filter(node=>node.type==='ImageFixture').map(node=>node.props.source.uri),projected.gallery.map(row=>row.uri));assert.equal(walk(publicTree).some(node=>node.props?.accessibilityLabel?.startsWith('Select gallery photo')),false);
assert.equal(readFileSync('src/core/publicAppGallery.mjs','utf8'),readFileSync('supabase/functions/busy-mini-app-guest/publicAppGallery.mjs','utf8'));
console.log('PASS extracted original marketplace gallery, 20 palette solid-background contrast calculations, responsive/image observations, no public edit controls and exact standalone renderer caption/alt parity. Inert native/IO; not screenshot or accessibility certification.');
