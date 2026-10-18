import {EnquiryTopicShortcuts} from '../../standalone/template/enquiryTopicShortcuts';
import {ENQUIRY_REQUIREMENTS,emptyEnquiryRequirements,applyEnquiryTopicSuggestion} from '../core/customerEnquiryRequirements.mjs';
import React from 'react';
import {View,Text,ScrollView,Alert} from 'react-native';
import {Card,Button,Field} from '../components/ui';
import {styles} from '../theme/styles';
// Presentation only. Parent retains original state, scoped sends and recovery.
function BusinessAppCustomerRequestFields({s,form,onLayout}){
 const {bookingReview,cancelBookingReview,enquiryReview,cancelEnquiryReview,requirements=emptyEnquiryRequirements(),setRequirements,requestKind,setRequestKind,enabled,name,email,phone,service,date,note,message,contentNotice,contentInterest,preferredDates,serviceChoices,bookingReady,enquiryReady,privateRecovery,setName,setEmail,setPhone,setService,setDate,setNote,setMessage,setContentInterest,setContentNotice,submitBooking,submitEnquiry}=form;
 return (
      <View onLayout={onLayout}>
      {typeof setRequestKind==='function'&&enabled.has('enquiry')&&enabled.has('booking_request')?<View>
        <Text style={styles.sectionLabel}>What would you like to do?</Text>
        {['enquiry','booking_request'].map(type=><Button key={type}
          label={(requestKind===type?'✓ ':'')+(type==='enquiry'?'Ask a question':'Request a booking')}
          disabled={!!s.miniAppsAction||!!contentInterest&&type==='booking_request'} onPress={()=>setRequestKind(type)}/>)}
        <Text style={styles.cardBody}>A booking request needs the business to accept it. Sending this form does not reserve a time or confirm availability.</Text>
        {contentInterest?<Text style={styles.cardBody}>Your selected product or event is attached to an enquiry. Remove the selection before changing request type.</Text>:null}
      </View>:null}
      {typeof s.checkBusyAppRequestRecovery==="function"?<Card title="Earlier request interrupted?" body="Check your saved reference without sending another request. Your contact details are not stored in this recovery reference.">
        {['enquiry','booking_request'].filter(type=>enabled.has(type)).map(type=><Button key={type}
          label={type==='enquiry'?'Check earlier enquiry':'Check earlier booking request'} disabled={!!s.miniAppsAction}
          onPress={()=>s.checkBusyAppRequestRecovery(type)}/>)}
      </Card>:null}
      {enabled.has('enquiry')&&(!requestKind||requestKind==='enquiry')?<Card title="Keep a private enquiry draft"
        body="Optional: save your name, contact details, message and selected item in encrypted storage on this device for this account. Restorable for 24 hours; expired drafts are deleted on next access. Nothing is sent or synced. Restore replaces the open enquiry fields; booking fields are not saved.">
        <Button label="Save private enquiry on this device" disabled={privateRecovery.busy||!!s.miniAppsAction} onPress={privateRecovery.save}/>
        <Button label="Restore saved enquiry" disabled={privateRecovery.busy||!!s.miniAppsAction} onPress={()=>Alert.alert('Restore this device draft?','This replaces the current enquiry fields. Nothing will be submitted.',[{text:'Keep current form',style:'cancel'},{text:'Restore draft',onPress:privateRecovery.restore}])}/>
        <Button label="Delete saved device draft" disabled={privateRecovery.busy||!!s.miniAppsAction} onPress={privateRecovery.remove}/>
        {privateRecovery.notice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{privateRecovery.notice}</Text>:null}
      </Card>:null}
      {(enabled.has("booking_request") || enabled.has("enquiry")) ? (
        <>
          <Text style={styles.sectionLabel}>Your contact details</Text>
          <Field
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
          />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            placeholder="you@example.com"
          />
          <Field
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
          />
        </>
      ) : null}

      {typeof setRequirements==='function'?<View>
        <Text style={styles.sectionLabel}>What do you need? (optional)</Text>
        <Text style={styles.cardBody}>These customer-supplied requirements are included in the request for the business to review. No quantity, date, arrangement or price is confirmed.</Text>
        <EnquiryTopicShortcuts requirements={requirements} onChoose={value=>setRequirements(current=>applyEnquiryTopicSuggestion(current,value.topic))} disabled={!!s.miniAppsAction||!!enquiryReview||!!bookingReview}/>
        {ENQUIRY_REQUIREMENTS.map(field=><Field key={field.key} label={field.label} value={requirements[field.key]} maxLength={field.max} onChangeText={value=>setRequirements(current=>({...current,[field.key]:value}))}/>)}
      </View>:null}

      {enabled.has("booking_request")&&(!requestKind||requestKind==='booking_request') ? (
        <>
          <Text style={styles.sectionLabel}>Request a booking</Text>
          <Text style={styles.cardBody}>Choose a listed service or describe what you need. The business will review your request.</Text>
          {serviceChoices.map((item,index)=><Button key={"request-service-"+index} label={"Request "+item.name}
            disabled={!!s.miniAppsAction} onPress={()=>setService(item.name)}/>)}
          <Field label="Service" value={service} onChangeText={setService} placeholder="Service you want" />
          <Text style={styles.cardBody}>Preferred dates only — these are not available appointment slots.</Text>
          <ScrollView horizontal accessibilityLabel="Preferred date suggestions" showsHorizontalScrollIndicator>
            {preferredDates.map(day=><View key={"preferred-"+day.value} style={{marginRight:8}}><Button label={day.label}
              disabled={!!s.miniAppsAction} onPress={()=>setDate(day.value)}/></View>)}
          </ScrollView>
          <Field label="Preferred date" value={date} onChangeText={setDate} placeholder="e.g. Friday afternoon" />
          <Field label="Note" value={note} onChangeText={setNote} placeholder="Anything the business should know" multiline />
          {!bookingReady.ok?<Text style={styles.cardBody}>{bookingReady.reason}</Text>:null}
          {bookingReview?<View accessibilityLiveRegion="polite">
            <Text style={styles.sectionLabel}>Review your booking request</Text>
            {Object.entries(bookingReview.payload).map(([key,value])=><Text key={key} selectable style={styles.cardBody}>{key+': '+(value||'(not supplied)')}</Text>)}
            <Text style={styles.cardBody}>Confirm to share these details with this business. Preferred dates are not available slots. The business must accept your request before an appointment is confirmed. Editing requires a new review.</Text>
            <Button label="Correct my booking request" disabled={!!s.miniAppsAction} onPress={cancelBookingReview}/>
          </View>:null}
          <Button
            label={s.miniAppsAction === "request:booking_request" ? "Sending…" : bookingReview?"Confirm and send booking request":"Review booking request"}
            primary
            disabled={
              !bookingReady.ok ||
              !!s.miniAppsAction
            }
            onPress={submitBooking}
          />
        </>
      ) : null}

      {enabled.has("enquiry")&&(!requestKind||requestKind==='enquiry') ? (
        <>
          <Text style={styles.sectionLabel}>Send an enquiry</Text>
          {contentNotice?<Text accessibilityLiveRegion="polite" style={styles.cardBody}>{contentNotice}</Text>:null}
          {contentInterest?<Button label="Remove selected listing from this enquiry" onPress={()=>{setContentInterest(null);setService('');setMessage('');setContentNotice('Listing removed. Write your enquiry below.');}}/>:null}
          <Text style={styles.cardBody}>Optional details help the business respond. These are your requirements, not confirmed availability, prices, orders or attendance. They are included in the saved enquiry message.</Text>

          <Field label="Message" value={message} onChangeText={setMessage} placeholder="What would you like to ask?" multiline />
          {!enquiryReady.ok?<Text style={styles.cardBody}>{enquiryReady.reason}</Text>:null}
          {enquiryReview?<View accessibilityLiveRegion="polite">
            <Text style={styles.sectionLabel}>Review exactly what will be sent</Text>
            {Object.entries(enquiryReview.payload).map(([key,value])=><Text key={key} selectable style={styles.cardBody}>{key+': '+(value||'(not supplied)')}</Text>)}
            <Text style={styles.cardBody}>Confirm to share these details with this business so it can respond. This is an enquiry, not a booking, order or payment. Editing any field requires a new review.</Text>
            <Button label="Correct my enquiry" disabled={!!s.miniAppsAction} onPress={cancelEnquiryReview}/>
          </View>:null}
          <Button
            label={s.miniAppsAction === "request:enquiry" ? "Sending…" : enquiryReview?"Confirm and send enquiry":"Review enquiry"}
            disabled={
              !enquiryReady.ok ||
              !!s.miniAppsAction
            }
            onPress={submitEnquiry}
          />
        </>
      ) : null}

      </View>
 );
}
export {BusinessAppCustomerRequestFields};
