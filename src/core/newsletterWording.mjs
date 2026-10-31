// Pure wording projection over the original single private text record; no brand, state or IO dependencies.
// The original single text record remains authoritative; no parallel email fields/store.
export function readNewsletterWording(text){
 if(typeof text!=='string')return null;
 const match=/^Subject: ([^\r\n]*)(\n\n|\n)([\s\S]*)$/.exec(text);
 return match?{subject:match[1],separator:match[2],body:match[3]}:null;
}
export function editNewsletterWording(text,part,value){
 const fields=readNewsletterWording(text);
 if(!fields||typeof value!=='string'||!['subject','body'].includes(part)||value.length>(part==='subject'?500:10000)||part==='subject'&&/[\u0000-\u001f\u007f]/.test(value))return null;
 return 'Subject: '+(part==='subject'?value:fields.subject)+fields.separator+(part==='body'?value:fields.body);
}
export function newsletterWording({name='',subject='Business update',sections=[],treatment='standard',callToAction=''}){
 const title=treatment==='welcoming'?'Get to know '+subject:treatment==='detailed'?'A closer look at '+subject:subject;
 return ['Subject: '+title+(name?' · '+name:''),treatment==='welcoming'?'Hello,':treatment==='detailed'?'Here are the details for your review.':'',...sections.filter(Boolean),callToAction,name].filter(Boolean).join(treatment==='concise'?'\n':'\n\n');
}
