// Private WebView navigation only. No URL here grants publication or a live action.
export const WHOLE_WEBSITE_PREVIEW_ORIGIN='https://busy-website-preview.invalid';
const list=v=>Array.isArray(v)?v:[];
const safeOutput=v=>typeof v==='string'&&/^(?:[a-z0-9][a-z0-9-]*\/)*index\.html$/.test(v);
export function wholeWebsitePreviewDocument(website,pageId){
 const pages=list(website?.pages).filter(p=>p?.enabled!==false&&safeOutput(p.outputPath));
 const matches=pages.filter(p=>p.id===pageId);
 if(matches.length!==1)return null;
 const page=matches[0];
 return {page,baseUrl:WHOLE_WEBSITE_PREVIEW_ORIGIN+'/'+page.outputPath};
}
export function wholeWebsitePreviewNavigation(website,pageId,request={}){
 const current=wholeWebsitePreviewDocument(website,pageId);
 if(!current)return {allow:false,pageId:null};
 const value=request.url;
 if(value==='about:blank'||typeof value==='string'&&value.startsWith('about:blank#'))return {allow:true,pageId:null};
 let url;try{url=new URL(value,current.baseUrl);}catch{return {allow:false,pageId:null};}
 if(url.origin!==WHOLE_WEBSITE_PREVIEW_ORIGIN||url.username||url.password||url.search||/%/.test(url.pathname))return {allow:false,pageId:null};
 const pages=list(website.pages).filter(p=>p?.enabled!==false&&safeOutput(p.outputPath));
 const matching=pages.filter(p=>['/'+p.outputPath,p.path,p.path==='/'?'/':p.path+'/'].includes(url.pathname));
 if(matching.length!==1)return {allow:false,pageId:null};
 if(matching[0].id===pageId&&url.hash&&url.pathname===new URL(current.baseUrl).pathname)return {allow:true,pageId:null};
 // The initial inline HTML is allowed; page clicks are rendered locally, never fetched.
 if(matching[0].id===pageId&&url.href===current.baseUrl&&request.navigationType!=='click'&&request.initialDocument!==false)return {allow:true,pageId:null};
 return {allow:false,pageId:matching[0].id};
}
