import {contrast} from './nativePalette.mjs';
const SERVICE_PRESENTATION_OPTIONS=Object.freeze({spacing:['normal','spacious'],surface:['card','plain'],corners:['rounded','square'],enquirySize:['normal','roomy'],enquiryTone:['outline','solid'],enquiryAlign:['stretch','left'],enquiryCorners:['rounded','square'],bookingSize:['normal','roomy'],bookingTone:['outline','solid'],bookingAlign:['stretch','left'],bookingCorners:['rounded','square']});
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const id=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(x);
const valid=x=>plain(x)&&Object.keys(x).length>0&&Object.keys(x).every(k=>Object.hasOwn(SERVICE_PRESENTATION_OPTIONS,k)&&SERVICE_PRESENTATION_OPTIONS[k].includes(x[k]));
function validServicePresentation(value){return plain(value)&&Object.keys(value).length<=20&&Object.entries(value).every(([key,row])=>id(key)&&valid(row));}
function servicePresentationTarget(config,key){return id(key)&&config?.modules?.some(m=>m.key==='services'&&m.enabled===true)&&Array.isArray(config.publicProfile?.services)&&config.publicProfile.services.filter(row=>row?.id===key).length===1;}
function previewServicePresentation(config,{field,value}={}){
 if(!servicePresentationTarget(config,field)||value!==null&&!valid(value))return {ok:false,reason:'Select one identified service and use its supported card or button controls.'};
 const before=config.presentation?.servicePresentation||{};if(!validServicePresentation(before))return {ok:false,reason:'Review the existing service presentation first.'};
 if(value&&Object.keys(value).some(k=>k.startsWith('enquiry')&&!config.modules.some(m=>m.key==='enquiry'&&m.enabled===true)||k.startsWith('booking')&&!config.modules.some(m=>m.key==='booking_request'&&m.enabled===true)))return {ok:false,reason:'This service action is not enabled. Styling cannot enable it.'};
 const next={...before};if(value===null)delete next[field];else next[field]={...next[field],...value};
 if(!validServicePresentation(next)||JSON.stringify(next)===JSON.stringify(before))return {ok:false,reason:'This style is already selected or exceeds the supported limit.'};
 const presentation={...config.presentation};if(Object.keys(next).length)presentation.servicePresentation=next;else delete presentation.servicePresentation;
 return {ok:true,nextConfig:{...config,presentation},description:'Changed only this service card or request button appearance; facts and actions are unchanged.'};
}
function serviceCardStyle(value,key,colors){
 const row=validServicePresentation(value||{})?value?.[key]:null;if(!row)return {};
 return {...(row.spacing?{padding:row.spacing==='spacious'?22:15}:{}),...(row.surface?{backgroundColor:row.surface==='plain'?colors.bg:colors.surface}:{}),...(row.corners?{borderRadius:row.corners==='square'?2:14}:{})};
}
function serviceButtonStyle(value,key,action,colors){
 const row=validServicePresentation(value||{})?value?.[key]||{}:{},prefix=action==='booking_request'?'booking':'enquiry',solid=row[prefix+'Tone']==='solid',roomy=row[prefix+'Size']==='roomy';
 const backgroundColor=solid?colors.accent:colors.surface,color=solid?(contrast('#14212B',colors.accent)>=4.5?'#14212B':'#FFFFFF'):colors.accent;
 return {container:{backgroundColor,borderColor:colors.accent,borderWidth:1,borderRadius:row[prefix+'Corners']==='square'?3:14,minHeight:48,maxWidth:'100%',alignSelf:row[prefix+'Align']==='left'?'flex-start':'stretch',paddingHorizontal:roomy?18:14,paddingVertical:roomy?16:12,marginTop:10,justifyContent:'center'},text:{color,fontSize:roomy?18:16,fontWeight:solid?'800':'600',textAlign:'center',flexShrink:1}};
}
export {SERVICE_PRESENTATION_OPTIONS,validServicePresentation,servicePresentationTarget,previewServicePresentation,serviceCardStyle,serviceButtonStyle};
