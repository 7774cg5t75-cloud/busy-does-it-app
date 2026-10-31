// Shared BUSY chrome only. Customer website/App design systems are independent.
export function interiorMood(screen=''){
 if(/website/i.test(screen))return {accent:'cyan',icon:'website'};
 if(/miniApp|appBuilder|businessCreation/i.test(screen))return {accent:'violet',icon:'app'};
 if(/social|content|newsletter/i.test(screen))return {accent:'rose',icon:'content'};
 if(/growth|marketing/i.test(screen))return {accent:'rose',icon:'growth'};
 if(/paid|quote|invoice|payment/i.test(screen))return {accent:'green',icon:'paid'};
 if(/customer|work|inbox|conversation/i.test(screen))return {accent:'violet',icon:'work'};
 return {accent:'blueText',icon:'settings'};
}
export function segmentWidths(labels,width,fontScale=1){
 const available=Math.max(0,width-48),gap=4;
 return labels.map(label=>Math.max(88,Math.floor((available-gap*(labels.length-1))/labels.length),Math.ceil(String(label).length*13*.68*Math.max(1,fontScale)+28)));
}
export const interiorType=Object.freeze({title:22,titleLine:29,body:14,bodyLine:21,cardTitle:16,cardTitleLine:23,touch:48});
// Status uses text and icons as well as colour; financial surfaces stay quiet.
export function interiorStatus(tone='info'){
 return ({info:{accent:'blueText',icon:'spark'},review:{accent:'violet',icon:'work'},warning:{accent:'amber',icon:'work'},error:{accent:'red',icon:'work'}})[tone]||{accent:'blueText',icon:'spark'};
}
