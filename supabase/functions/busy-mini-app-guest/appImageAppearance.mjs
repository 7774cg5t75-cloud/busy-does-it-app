// Finite presentation for a unique, approved existing gallery URI. No media
// replacement, network source, approval, visibility or absolute coordinates.
const IMAGE_OPTIONS=Object.freeze({fit:['cover','contain'],size:['regular','large'],corners:['rounded','square']});
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const safeUri=x=>typeof x==='string'&&x.length<=1800&&/^https:\/\/[^\s<>]+$/i.test(x);
const style=x=>plain(x)&&Object.keys(x).length>0&&Object.keys(x).every(k=>Object.hasOwn(IMAGE_OPTIONS,k)&&IMAGE_OPTIONS[k].includes(x[k]));
function validImageStyles(value){return plain(value)&&Object.keys(value).length<=15&&Object.entries(value).every(([uri,value])=>safeUri(uri)&&style(value));}
function imageStyleTargetExists(config,uri){const rows=config?.publicProfile?.assets?.gallery;return safeUri(uri)&&config?.modules?.some(m=>m.key==='gallery'&&m.enabled===true)&&Array.isArray(rows)&&rows.filter(row=>row?.uri===uri).length===1&&rows.some(row=>row.uri===uri&&(row.approved===true||row.marketingOk===true));}
function previewAppImageAppearance(config,{index,expectedUri,value}={}){
 if(!Number.isInteger(index)||config?.publicProfile?.assets?.gallery?.[index]?.uri!==expectedUri||!imageStyleTargetExists(config,expectedUri)||value!==null&&!style(value))return {ok:false,reason:'Select a unique approved photo and use the supported picture controls.'};
 const before=config.presentation?.imageStyles||{};if(!validImageStyles(before))return {ok:false,reason:'Review the existing picture styles first.'};
 const imageStyles={...before};if(value===null)delete imageStyles[expectedUri];else imageStyles[expectedUri]={...imageStyles[expectedUri],...value};
 if(!validImageStyles(imageStyles)||JSON.stringify(before)===JSON.stringify(imageStyles))return {ok:false,reason:'This picture style is already selected or exceeds the supported limit.'};
 const presentation={...config.presentation};if(Object.keys(imageStyles).length)presentation.imageStyles=imageStyles;else delete presentation.imageStyles;
 return {ok:true,nextConfig:{...config,presentation},description:'Changed only this approved photo’s presentation; its source, wording and actions are unchanged.'};
}
function appImagePresentation(styles,uri,{height=205,corners='rounded'}={}){
 const value=validImageStyles(styles||{})?styles?.[uri]||{}:{};
 return {resizeMode:value.fit||'cover',height:Math.round(height*(value.size==='large'?1.25:1)),borderRadius:(value.corners||corners)==='square'?2:14};
}
export {IMAGE_OPTIONS,validImageStyles,imageStyleTargetExists,previewAppImageAppearance,appImagePresentation};
