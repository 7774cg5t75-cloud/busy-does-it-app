import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {publicBusinessContent,prepareBusinessContentEnquiry} from '../src/core/businessContentRecords.mjs';
const make=createRequire(import.meta.url)('./lib/quote-preparation-fixture.cjs');
const product={name:'Autumn bowl',description:'Hand-thrown stoneware.',category:'Home',status:'active',image:null,amountMinor:2400,currency:'GBP',availability:'not_tracked',variants:[{id:'option_blue_glaze',label:'Blue glaze',sku:'',amountMinor:3900}]};
const event={name:'Studio evening',description:'Meet the makers.',category:'Community',status:'scheduled',image:null,startsAt:'2099-10-25T17:00:00.000Z',endsAt:'2099-10-25T19:00:00.000Z',timeZone:'Europe/London',location:'Elm Studio',onlineUrl:'https://example.org/event-info'};
function setup(kind='product'){
 const f=make(),row={id:kind==='product'?'product_autumn_bowl':'event_studio_evening',business_id:f.data.business,kind,revision:2,published_revision:2,published:kind==='product'?product:event};let rows=[row],reads=0;
 const selected=prepareBusinessContentEnquiry(publicBusinessContent(rows,f.data.business),f.data.business,{recordId:row.id,revision:2,...kind==='product'?{variantId:'option_blue_glaze'}:{}});
 assert.equal(selected.ok,true);f.item.rawText=selected.message+'\n\n'+f.item.rawText;f.origin.current.stamp=JSON.stringify(f.item);f.data.businessContentRequest=async()=>{reads++;return {ok:true,businessId:f.data.business,records:rows};};f.render();
 return {f,row,get reads(){return reads;},set rows(value){rows=value;}};
}
for(const kind of ['product','event']){
 const g=setup(kind),{f}=g;const button=f.find(f.context(),'Use current approved item information');assert.ok(button);assert.equal(await button.props.onPress(),true);assert.equal(f.data.message,'Existing owner wording');assert.ok(f.prompt.body.includes(kind==='product'?'£39.00':'Elm Studio'));assert.ok(f.prompt.body.includes('25 people'));assert.equal(await f.prompt.buttons.find(b=>b.text==='Use this item information').onPress(),true);assert.equal(g.reads,2);assert.ok(f.data.message.includes(kind==='product'?'Blue glaze':'2099-10-25'));assert.equal(f.data.amount,'80');assert.equal(f.data.date,'2099-01-01');assert.equal(f.data.writes,0);
}
for(const change of ['typing','source','role','customer','foreign','changed','removed','duplicate','cancelled']){
 const g=setup(change==='cancelled'?'event':'product'),{f}=g;await f.find(f.context(),'Use current approved item information').props.onPress();const use=f.prompt.buttons.find(b=>b.text==='Use this item information').onPress;
 if(change==='typing')f.walk(f.tree).find(n=>n.type==='TextInput'&&n.props.value===f.data.message).props.onChangeText('Newest owner words');
 if(change==='source')f.item.rawText+=' Changed';if(change==='role')f.data.role='viewer';if(change==='customer')f.data.customers=[];if(change==='foreign')g.rows=[{...g.row,business_id:'foreign'}];if(change==='changed')g.rows=[{...g.row,revision:3,published_revision:3}];if(change==='removed')g.rows=[];if(change==='duplicate')g.rows=[g.row,g.row];if(change==='cancelled')g.rows=[{...g.row,published:{...event,status:'cancelled'}}];f.render();assert.equal(await use(),false,change);assert.equal(f.data.message,change==='typing'?'Newest owner words':'Existing owner wording');assert.equal(f.data.writes,0);
}
const malformed=setup();malformed.f.item.rawText+='\nListing reference: product_other_bowl / approved revision 2.';malformed.f.render();assert.equal(malformed.f.find(malformed.f.context(),'Use current approved item information'),undefined);
console.log('PASS actual Work/source card/hook resolves exact current approved product/event/option twice around owner acceptance; listed price/date and supplied requirements reused without changing owner amount/date. Changed/deleted/duplicate/foreign/cancelled/ambiguous source, newer typing, customer and role deny stale use; no writes or send.');
