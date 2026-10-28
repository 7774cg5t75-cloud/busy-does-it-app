// Use genuine RN UI. Block native escape hatches, not original screen logic.
const React=require('react');
const RN=require('react-native');
const {blocked,localUri}=require('./policy.cjs');
const Image=React.forwardRef((props,ref)=>{const s=props.source;const safe=typeof s==='number'||!s||(!Array.isArray(s)&&localUri(s.uri));return React.createElement(RN.Image,{...props,ref,source:safe?s:undefined});});
Image.resolveAssetSource=RN.Image.resolveAssetSource;
Image.prefetch=blocked;Image.getSize=blocked;
const ImageBackground=React.forwardRef((props,ref)=>React.createElement(RN.ImageBackground,{...props,ref,source:typeof props.source==='number'||localUri(props.source?.uri)?props.source:undefined}));
module.exports={...RN,Image,ImageBackground,Linking:{...RN.Linking,openURL:blocked,canOpenURL:async()=>false,getInitialURL:async()=>null,addEventListener:()=>({remove(){}})},Share:{...RN.Share,share:blocked}};
