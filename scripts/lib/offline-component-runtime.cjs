// Evaluate actual local JS modules and component bodies with deterministic
// React hooks/native boundaries. No effects, timers, native rendering or IO.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),babel=require('@babel/core');
function createRuntime({width=390,states=new Map()}={}){
 const root=path.resolve(__dirname,'../..'),cache=new Map(),effects=[];let index=0,slots=[],captured=null;const componentSlots=new Map();
 const React={createElement:(type,props,...children)=>({type,props:{...props,children}}),Fragment:'Fragment',
  useState(value){const i=index++,ownedSlots=slots;if(!(i in ownedSlots))ownedSlots[i]=states.has(i)?states.get(i):typeof value==='function'?value():value;return [ownedSlots[i],next=>ownedSlots[i]=typeof next==='function'?next(ownedSlots[i]):next];},
  useRef(value){const i=index++;return slots[i]||(slots[i]={current:value});},useEffect(fn){index++;effects.push(fn);},useLayoutEffect(fn){index++;effects.push(fn);},useMemo(fn){index++;return fn();},useCallback(fn){index++;return fn;}};
 const native={Platform:{OS:'ios',select:x=>x.ios??x.default},StyleSheet:{create:x=>x,hairlineWidth:1,absoluteFillObject:{}},Dimensions:{get:()=>({width,height:844})},useWindowDimensions:()=>({width,height:844,fontScale:1,scale:1}),PixelRatio:{get:()=>1},Alert:{alert:()=>{}},AppState:{currentState:'active'}};
 for(const name of ['SafeAreaView','ScrollView','View','Text','Pressable','TextInput','StatusBar','Switch','Image','KeyboardAvoidingView','ActivityIndicator','Modal','FlatList','TouchableOpacity','Animated','RefreshControl'])native[name]=name;
 const noIO=()=>{throw Error('External/native IO is forbidden in offline render');};
 const external={react:React,'react-native':native,'@react-native-async-storage/async-storage':{getItem:noIO,setItem:noIO,removeItem:noIO},'expo-secure-store':{getItemAsync:noIO,setItemAsync:noIO,deleteItemAsync:noIO},'expo-notifications':{setNotificationHandler:()=>{}},'expo-constants':{expoConfig:{extra:{}}},'expo-file-system':{File:class{},Paths:{cache:'fixture://cache/',document:'fixture://document/'}},'expo-audio':{useAudioRecorder:()=>({}),useAudioRecorderState:()=>({}),RecordingPresets:{HIGH_QUALITY:{}}},'expo/fetch':{fetch:noIO},'react-native-view-shot':{captureRef:noIO},'react-native-qrcode-svg':'QRCode','react-native-webview':{WebView:'WebView'},'react-native-svg':{default:'Svg',Svg:'Svg',Path:'Path',Rect:'Rect',Circle:'Circle'},'expo-image-picker':{},'expo-calendar/legacy':{},'expo-sharing':{}};
 function load(file){
  const resolved=fs.existsSync(file)&&fs.statSync(file).isFile()?file:['.js','.mjs','.json','/index.js','/index.mjs'].map(ext=>file+ext).find(f=>fs.existsSync(f));
  if(!resolved)throw Error('Missing local module '+file);if(cache.has(resolved))return cache.get(resolved).exports;
  if(resolved.endsWith('.json'))return JSON.parse(fs.readFileSync(resolved,'utf8'));
  const module={exports:{}};cache.set(resolved,module);
  let source=fs.readFileSync(resolved,'utf8');if(resolved.endsWith('/src/app/AppController.js')){const marker='  if (!hydrated || !ownerAuthReady) {';if(!source.includes(marker))throw Error('Missing context capture boundary');source=source.replace(marker,'  __captureContext(appState);\n'+marker);}const code=babel.transformSync(source,{filename:resolved,babelrc:false,configFile:false,compact:true,plugins:[require('@babel/plugin-transform-modules-commonjs'),[require('@babel/plugin-transform-react-jsx'),{runtime:'classic'}]]}).code;
  const requireLocal=id=>{if(id.startsWith('.'))return load(path.resolve(path.dirname(resolved),id));if(Object.hasOwn(external,id))return external[id];throw Error('Unmodelled external boundary '+id+' in '+resolved);};
  const context={__captureContext:value=>captured=value,module,exports:module.exports,require:requireLocal,console,URL,URLSearchParams,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,Date,Math,JSON,Promise,Set,Map,WeakMap,WeakSet,process:{env:{EXPO_PUBLIC_BUSY_ENVIRONMENT:'isolated-staging'}},fetch:noIO,setTimeout:noIO,clearTimeout:()=>{},setInterval:noIO,clearInterval:()=>{},__DEV__:true};
  vm.runInNewContext(code,context,{filename:resolved,timeout:10000});return module.exports;
 }
 return {native,load:relative=>load(path.resolve(root,relative)),render(Component,props){index=0;if(!componentSlots.has(Component))componentSlots.set(Component,[]);slots=componentSlots.get(Component);return Component(props);},get appState(){return captured;},effects,get modules(){return cache.size;}};
}
module.exports={createRuntime};
