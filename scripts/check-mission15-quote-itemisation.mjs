import assert from 'node:assert/strict';import{createRequire}from'node:module';
import {quoteItemTotal,amendQuoteItem,inspectQuoteItemisation,quoteItemisationReview} from '../src/core/quoteItemisation.mjs';
const rt=createRequire(import.meta.url)('./lib/offline-component-runtime.cjs').createRuntime(),{QuoteItemisationEditor:Panel}=rt.load('src/components/QuoteItemisationEditor.js');
assert.equal(quoteItemTotal({quantity:'1.005',unitPrice:'1.00',vatAmount:'0'}),'1.01');assert.equal(quoteItemTotal({quantity:'2',unitPrice:'0.10',vatAmount:'0.04'}),'0.24');for(const v of ['','-1','1e3','Infinity','0'])assert.equal(quoteItemTotal({quantity:v,unitPrice:'1',vatAmount:'0'}),null);
assert.equal(inspectQuoteItemisation([{description:'Large',quantity:'999999999',unitPrice:'999999999',vatAmount:'0',lineTotal:quoteItemTotal({quantity:'999999999',unitPrice:'999999999',vatAmount:'0'})}],'0').ok,false);
let rows=[];const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[x,...walk(x.props?.children)]:[],find=(t,l)=>walk(t).find(x=>x.props?.label===l),render=()=>rt.render(Panel,{rows,quoteTotal:'0.24',onChange:v=>rows=v});
find(render(),'Add quotation item').props.onPress();assert.equal(rows[0].vatAmount,'');for(const [k,v] of [['description','  Exact service\nkept  '],['quantity','2'],['unit price','0.10'],['VAT amount','0.04']])find(render(),'Item 1 '+k).props.onChangeText(v);
assert.equal(rows[0].lineTotal,'0.24');assert.equal(inspectQuoteItemisation(rows,'0.24').ok,true);assert.equal(inspectQuoteItemisation(rows,'0.25').ok,false);assert.equal(inspectQuoteItemisation(rows,'0.24').vatTreatmentVerified,false);const original=JSON.stringify(rows);assert.equal(amendQuoteItem(rows,3,'quantity','4'),null);assert.equal(JSON.stringify(rows),original);assert.equal(amendQuoteItem(rows,0,'supplierCost','secret'),null);find(render(),'Remove prepared item 1').props.onPress();assert.equal(rows.length,0);
console.log('PASS owner quote item editor: exact decimal rounding, explicit VAT/no tax inference, quantity/price validation, preserved wording, original total comparison and deliberate removal.');

const diagnostic=[{description:'Exact work',quantity:'2',unitPrice:'10',vatAmount:'0',lineTotal:'20.00'}];
assert.match(quoteItemisationReview(diagnostic,'25').message,/total £20.00.*total £25/);
assert.match(quoteItemisationReview([{...diagnostic[0],vatAmount:''}],'25').message,/Item 1.*VAT/);
assert.match(quoteItemisationReview([{...diagnostic[0],quantity:'0'}],'25').message,/positive quantity/);
assert.match(quoteItemisationReview(diagnostic,'20').message,/match.*VAT treatment/);
assert.equal(diagnostic[0].lineTotal,'20.00');
