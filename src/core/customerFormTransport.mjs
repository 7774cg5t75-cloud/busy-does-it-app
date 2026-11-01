// Original guest endpoint only. No owner bearer, service credential or alternate API.
export async function requestCustomerForm(baseUrl,body,fetcher){
 const url=new URL(baseUrl);if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co')||url.username||url.password||url.pathname!=='/'||url.search||url.hash||!['form_catalog','form_open','form_review','form_submit','form_receipt'].includes(body?.action)||JSON.stringify(body).length>16000)throw Error('Unsupported customer form transport');
 const response=await fetcher(url.origin+'/functions/v1/busy-mini-app-guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)},15000);
 const text=await response.text();if(text.length>32768)throw Error('Customer form response exceeds the reviewed limit');let data;try{data=JSON.parse(text);}catch{throw Error('Customer form response unavailable');}if(!response.ok)throw Error('This customer form action could not be verified');return data;
}
