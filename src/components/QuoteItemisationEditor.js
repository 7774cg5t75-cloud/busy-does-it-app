import React from 'react';
import {Text} from 'react-native';
import {Card,Field,Button} from './ui';
import {styles} from '../theme/styles';
import {amendQuoteItem,inspectQuoteItemisation} from '../core/quoteItemisation.mjs';
export function QuoteItemisationEditor({rows=[],quoteTotal,onChange,disabled=false}){
 const check=inspectQuoteItemisation(rows,quoteTotal);
 return <Card eyebrow="Reviewed quotation items" title="Itemise the existing quote total" body="Enter quantities, unit prices and the VAT amount you have determined. Busy does not choose a VAT treatment. The reviewed items must match this quote's existing total; they do not change its price.">
  <Text style={styles.cardBody}>{'Existing quote total £'+quoteTotal+(rows.length?' · '+(check.ok?'Items match the quote':'Items need review; quote price is unchanged'):' · No itemisation prepared')}</Text>
  {rows.map((r,index)=><Card key={index} title={'Item '+(index+1)}>
   {[['description','description'],['quantity','quantity'],['unitPrice','unit price'],['vatAmount','VAT amount']].map(([key,label])=><Field key={key} label={'Item '+(index+1)+' '+label} value={r[key]} editable={!disabled} onChangeText={value=>{const v=amendQuoteItem(rows,index,key,value);if(v)onChange(v);}}/>)}
   <Text style={styles.cardBody}>{'Reviewed line total £'+(r.lineTotal||'—')}</Text>
   <Button label={'Remove prepared item '+(index+1)} disabled={disabled} onPress={()=>onChange(rows.filter((_,i)=>i!==index))}/>
  </Card>)}
  <Button label="Add quotation item" disabled={disabled||rows.length>=100} onPress={()=>onChange([...rows,{description:'',quantity:'1',unitPrice:'',vatAmount:'',lineTotal:''}])}/>
 </Card>;
}
