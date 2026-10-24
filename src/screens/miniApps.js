import {accountBookingContext} from '../core/bookingCancelReadbackV3233.mjs';
import {useServiceBrowseReturn} from '../../standalone/template/useServiceBrowseReturn';
import {captureAppDraftAcknowledgement,acknowledgedAppDraftPart} from '../core/appDraftAcknowledgement.mjs';
import {useOwnerEditNavigation} from './useOwnerEditNavigation';
import {ServiceActionButton} from '../../standalone/template/serviceActionButton';
import {serviceCardStyle} from '../core/appServicePresentation.mjs';
import {AppGallerySurface} from "./appGallerySurface";
import {ServiceDetails} from "../../standalone/template/serviceDetails";
import {AppEntryEditButton} from './appEntryEditButton';
import {AppFaqCard} from '../../standalone/template/appFaqCard';
import {appComponentTextStyle} from '../core/appComponentAppearance.mjs';
import {amendAppQualityProposal} from "../core/appCoordinatedStudio.mjs";
import {AppVisualSelection} from "./appVisualSelection";
import {BuilderTalkExplore} from './builderTalkExplore';
import {currentBuilderExplore} from '../core/builderExplore.mjs';
import {useApprovedBuilderRecords} from './useApprovedBuilderRecords';
import {planApprovedAppRecordSection} from '../core/approvedBuilderRecords.mjs';
import {emptyEnquiryRequirements,prepareCustomerEnquiry,customerEnquiryReview,prepareCustomerBookingNote} from '../core/customerEnquiryRequirements.mjs';
import {AppServiceEditor} from './appServiceEditor';
import {AppGalleryDescriptionEditor} from './appGalleryDescriptionEditor';
import {validContentLayout,prepareBusinessContentEnquiry} from '../core/businessContentRecords.mjs';
import {proposeCoordinatedAppChanges as proposeContentComposition} from '../core/appCoordinatedStudio.mjs';
import {BusinessContentView} from '../components/businessContentView';
import {BusinessContentEditor} from './businessContentEditor';
import {useCustomerEnquiryRecovery} from './useCustomerEnquiryRecovery';
import {AppSectionNavigation} from '../components/appSectionNavigation';
import {AppPublicCollectionEditor} from './appPublicCollectionEditor';
import {publicCollection} from '../core/appPublicCollections.mjs';
import {AppContactEditor} from "./appContactEditor";
import {validateNativeGuestRequest,searchPublicNativeServices,browsePublicNativeServices,prepareServiceQuestion,SERVICE_QUESTION_TOPICS} from "../../standalone/template/nativeCustomerActions.mjs";
import {ServiceCategoryFilter} from '../components/serviceCategoryFilter';
import {BusinessAppCustomerRequestFields} from './businessAppCustomerRequestFields';
import {nativePreferredDates} from "../../standalone/template/nativePreferredDates.mjs";
import {bindAppControlReview,appControlReviewCurrent} from "../core/appControlReview.mjs";
import {AppGoalContentAssistant} from "./appGoalContentAssistant";
import {AppOwnerLockControls} from "./appOwnerLockControls";
import {AppBusinessFactRefresh} from "./appBusinessFactRefresh";
import {useOwnerDesignMemory} from "./useOwnerDesignMemory";
import React from "react";
import { Image, Text, View, Pressable, Dimensions, Platform, Alert, useWindowDimensions, ScrollView, PixelRatio } from "react-native";
import {captureRef} from "react-native-view-shot";
import {File as ExpoFile} from "expo-file-system";
import QRCode from "react-native-qrcode-svg";

import { styles } from "../theme/styles";
import { Shell, Card, Button, Field, MetricRow, StatusChip, Details } from "../components/ui";
import { miniAppModuleLabel } from "../domain/miniApps";
import { businessAppPreviewProof } from "../core/businessAppPreviewProof.mjs";
import { buildAppDistributionPlan,buildStandalonePrivateHandoff } from "../core/appDistributionChoices.mjs";
import { planFunctionalBusinessApp } from "../core/appExperiencePlanner.mjs";
import { previewPrivateAppAppearance,OPTIONS as appAppearanceOptions } from "../core/appAppearanceEditing.mjs";
import {nativePalette,LABELS as nativePaletteLabels} from "../core/nativePalette.mjs";
import {AppStudioComparison} from "./appStudioComparison";
import {BusinessBrandDnaPreview} from "./businessBrandDnaPreview";
import {UniversalBuilderPlanReview} from "./universalBuilderPlanReview";
import {WebsiteToAppDesignTransfer} from "./websiteToAppDesignTransfer";
import {FirstAppFromWebsite} from "./firstAppFromWebsite";
import {IndustryFirstExperienceReview} from "./industryFirstExperienceReview";
import {suggestFirstAppNextStep} from "../core/firstAppNextStepV3199.mjs";
import {appVisualPresentation,TYPE_LABELS,SERVICE_LABELS} from "../core/appVisualPresentationV3194.mjs";
import { interpretSelectedAppAppearance } from "../core/appContextInstruction.mjs";
import {orderedAppModules,proposeAppSectionMove} from "../core/appSectionOrder.mjs";
import {proposeCoordinatedAppChanges,planAppVoiceInstructions} from "../core/appCoordinatedStudio.mjs";
import {appDesignQualityReport} from "../core/appDesignQuality.mjs";
import {usePrivateAppStudio} from "./usePrivateAppStudio";
import {reviewAppGoalDesignV3240} from "../core/appGoalDesignReviewV3240.mjs";
import {auditBusinessAppUsability,compareBusinessAppDesign} from "../core/appUsabilityAudit.mjs";
import {responsiveAppLayout,recommendResponsiveDesign}
  from "../core/appResponsiveDesign.mjs";
import {evaluateAppAcrossScreens}
  from "../core/appResponsiveQuality.mjs";
import {prepareAppDesignIteration,inspectApprovedAppIteration,proposeLowRiskDesignHints}
  from "../core/appDesignIteration.mjs";
import {prepareAppVisualBatch} from "../core/appVisualComparison.mjs";
import {VIEWPORTS,getViewport,validateViewportPair,compareViewportSet,
 coordinateVisualEvidence} from "../core/appVisualMultiViewport.mjs";
import {rankDesignSuggestions} from "../core/appDesignLearning.mjs";
import {buildOwnerDesignPatterns,prepareOwnerAwareDesignExperiments,
 explainOwnerDesignOutcome} from "../core/appDesignPatterns.mjs";
import {INDUSTRY_PROFILES,prepareIndustryAwareAppReview}
  from "../core/appIndustryOrchestrator.mjs";
import {buildCustomerTaskDesignReport,proposeTaskFirstNavigation}
  from "../core/appCustomerTaskDesign.mjs";
import {runCustomerJourneyPractice}
  from "../core/appCustomerJourneyPractice.mjs";
import {reviewCustomerExperience}
  from "../core/appCustomerExperienceReview.mjs";
import {reviewSharedCustomerGoal}
  from "../core/sharedCustomerExperience.mjs";
import {appDesignEvidenceComparison}
  from "../core/crossBuilderEvidence.mjs";
import {stagingJourneyTestPlan}
  from "../core/stagingJourneyContract.mjs";
import {reviewBusinessInformation}
  from "../core/businessInfoClarity.mjs";
import {prepareStagingJourneyRun}
  from "../core/stagingJourneyPreparation.mjs";
import {assessSyntheticStagingAction}
  from "../core/stagingActionGateV3202.mjs";
import {executeOfflineJourneyPreflight}
  from "../core/offlineStagingPreflight.mjs";
import {prepareDeviceReview,summarizeLocalAppCapture}
  from "../core/deviceReviewEvidence.mjs";
import {prepareOwnerImprovementPlan}
  from "../core/ownerImprovementPlan.mjs";
import {prepareBusinessBrainWork}
  from "../core/businessBrainWorkQueue.mjs";
import {prepareCoordinatedBuilderReview}
  from "../core/coordinatedBuilderReviewV3180.mjs";
import {coordinateCustomerJourneyReview} from "../core/connectedCustomerJourneyV3187.mjs";
import {assessBrainOutcomeEvidence}
  from "../core/businessBrainOutcomeEvidence.mjs";
import {evaluateReleaseReadiness}
  from "../core/releaseReadinessIntelligence.mjs";
import {compileStagingRunnerHandoff}
  from "../core/stagingRunnerHandoff.mjs";
import {compareAppGoalCandidate}
  from "../core/designEvidencePriorities.mjs";
import {describeRequestExperience}
  from "../core/appRequestCommunication.mjs";
import {auditStandaloneContrast} from "../core/appContrastAudit.mjs";
import {appRequestJourney} from "../core/appRequestLifecycle.mjs";
import {ownerRequestActionsV3233} from "../core/ownerRequestActionsV3233.mjs";
import {appVisibleCaptureReceipt,currentAppVisibleCapture} from "../core/appRenderedEvidence.mjs";
import {mergeRenderedObservations,evaluateRenderedQuality,
 compareRenderedQuality,compareApprovedRevisionMeasurements,
 suggestMeasuredAppearance} from "../core/appRenderedQuality.mjs";
import {previewAppVisualSuggestion} from "../core/appVisualReviewContract.mjs";
import {WebsiteSelectedVoice} from "./websiteSelectedVoice";

function readableDate(value, fallback = "Not yet") {
  if (!value) return fallback;
  try {
    return new Date(value).toLocaleString("en-GB");
  } catch {
    return fallback;
  }
}

function requestEventLabel(type = "") {
  const labels = {
    received: "Request sent",
    reviewing: "Business is reviewing the request",
    accepted: "Request accepted",
    declined: "Request declined",
    closed: "Request closed",
    linked_customer: "Linked into the BUSY customer journey",
    booking_draft: "Business is arranging the booking",
    booking_confirmed: "Booking confirmed",
  };
  return labels[type] || String(type || "Request updated").replaceAll("_", " ");
}

function RequestTimeline({ messages = [], events = [] }) {
  const timeline = [
    ...(Array.isArray(messages) ? messages : []).map((item) => ({
      ...item,
      timelineKind: "message",
      at: item.created_at,
    })),
    ...(Array.isArray(events) ? events : []).map((item) => ({
      ...item,
      timelineKind: "event",
      at: item.created_at,
    })),
  ].sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));

  if (!timeline.length) {
    return <Text style={{ opacity: 0.7 }}>No conversation activity yet.</Text>;
  }

  return (
    <View style={{ marginTop: 8 }}>
      {timeline.map((item) =>
        item.timelineKind === "message" ? (
          <View key={`message-${item.id}`} style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: "700" }}>
              {item.sender_role === "customer" ? "Customer" : "Business"}
            </Text>
            <Text>{item.body}</Text>
            <Text style={{ opacity: 0.6, fontSize: 12 }}>
              {readableDate(item.created_at)}
            </Text>
          </View>
        ) : (
          <View key={`event-${item.id}`} style={{ marginBottom: 10 }}>
            <Text style={{ fontWeight: "700" }}>BUSY update</Text>
            <Text>{requestEventLabel(item.event_type)}</Text>
            <Text style={{ opacity: 0.6, fontSize: 12 }}>
              {readableDate(item.created_at)}
            </Text>
          </View>
        )
      )}
    </View>
  );
}

function localIsoDate() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function offerActiveToday(offer = {}) {
  const today = localIsoDate();
  const start = String(offer?.startDate || "").trim();
  const end = String(offer?.endDate || "").trim();
  return (!start || today >= start) && (!end || today <= end);
}


/**
 * V3.164 instrumentation is opt-in and stays entirely in this JS session.
 * React Native provides REAL measured layout boxes and, where available,
 * decoded image dimensions; public text and image URIs are NEVER recorded.
 */
function MeasuredPublicImage({source,style,observationKey,observationKind,
 onObservation,accessibilityLabel}){
 const frame=React.useRef(null),loaded=React.useRef(null);
 const emit=()=>{
  if(!onObservation||!frame.current)return;
  onObservation({key:observationKey,kind:observationKind,
    width:frame.current.width,height:frame.current.height,
    ...(loaded.current?{sourceWidth:loaded.current.width,
      sourceHeight:loaded.current.height}:{})});
 };
 return <Image source={source} style={style} resizeMode="cover"
   accessible={true} accessibilityRole="image"
   accessibilityLabel={accessibilityLabel}
   onLayout={event=>{
     const {width,height}=event.nativeEvent.layout;
     frame.current={width,height};emit();
   }}
   onLoad={event=>{
     const src=event.nativeEvent?.source;
     if(src?.width>0&&src?.height>0)
       loaded.current={width:src.width,height:src.height};
     emit();
   }}/>;
}
function MeasuredNavLabel({label,index,isList,onObservation}){
 const frame=React.useRef(null),lines=React.useRef(null);
 const emit=()=>{
   if(!onObservation||!frame.current)return;
   onObservation({key:"nav-"+index,kind:"navigation_label",
     width:frame.current.width,height:frame.current.height,
     ...(lines.current?{lineCount:lines.current}:{})});
 };
 return <View style={{minHeight:48,justifyContent:"center",borderRadius:10,
     borderColor:"#41536E",borderWidth:1,paddingHorizontal:12,paddingVertical:8,
     width:isList?"100%":undefined}}
   onLayout={e=>{
     const {width,height}=e.nativeEvent.layout;
     frame.current={width,height};emit();
   }}>
   <Text style={styles.cardBody}
     onTextLayout={e=>{
       const count=e.nativeEvent?.lines?.length;
       if(Number.isInteger(count)&&count>=1&&count<=20){
         lines.current=count;emit();
       }
     }}>{label}</Text>
 </View>;
}

function MiniAppSurface({
  config,
  interactive = false,
  s = null,
  loyaltyProgress = null,
  onQualityObservation = null,
  onMeasuredWidth = null,
  onSelectService = null,
  onSelectContent = null,
  onRequestNavigation = null,
  businessContent = null,
  ownerEdit = null,
  catalogueContextKey = '',
}) {
  const catalogueCache=React.useRef({scope:catalogueContextKey,states:{}});
  if(catalogueCache.current.scope!==catalogueContextKey)catalogueCache.current={scope:catalogueContextKey,states:{}};
  const ownerSelection=!interactive&&typeof ownerEdit?.onSelect==='function'?ownerEdit:null;
  const Header=ownerSelection?Pressable:View;
  const profile = config?.publicProfile || {};
  const modules = orderedAppModules(config);
  const [serviceQuery,setServiceQuery]=React.useState('');
  const [serviceCategory,setServiceCategory]=React.useState('');
  const [questionService,setQuestionService]=React.useState('');
  const [selectedSection,setSelectedSection]=React.useState('');
  const currentSection=modules.some(m=>m.key===selectedSection)?selectedSection:'';
  const allServices=Array.isArray(profile?.services)?profile.services:[];
  const serviceReturn=useServiceBrowseReturn({services:allServices,contextKey:catalogueContextKey,query:serviceQuery,category:serviceCategory,setQuery:setServiceQuery,setCategory:setServiceCategory});
  // Marketplace has legacy 50-row profiles; retain the native helper's 40-row bound.
  const serviceBrowse=browsePublicNativeServices(allServices,serviceReturn.query,serviceReturn.category),services=serviceBrowse.rows;
  const heroUri = String(profile?.assets?.hero?.uri || "");
  const loyalty = config?.loyalty || {};
  const offers = (Array.isArray(config?.offers) ? config.offers : []).filter(
    offerActiveToday
  );
  const presentation=config?.presentation||{};
  const device=useWindowDimensions();
  const [contentWidth,setContentWidth]=React.useState(0);
  // The rendered customer-facing surface uses the actual measured available
  // layout width. The first render uses the window as a provisional fallback.
  const availableWidth=contentWidth||Math.max(250,Math.floor(device.width-40));
  const responsive=responsiveAppLayout(config,availableWidth);
  const density=presentation.layoutDensity||"comfortable";
  const headerStyle=presentation.headerStyle||"refined";
  const brandColours=nativePalette(presentation.brandPalette,presentation.brandAccent);
  const visual=appVisualPresentation(presentation);
  const componentStyle=(key,baseSize)=>appComponentTextStyle(presentation.componentStyles,key,{colors:brandColours,baseSize});

  return (
    <View style={{width:"100%"}} onLayout={({nativeEvent})=>{
      const width=Math.floor(nativeEvent.layout.width);
      if(width>=250&&width!==contentWidth){
        setContentWidth(width);
        onMeasuredWidth?.(width);
      }
    }}>
      <Header accessibilityRole={ownerSelection?'button':undefined}
        accessibilityLabel={ownerSelection?'Select app header typography':undefined}
        accessibilityState={ownerSelection?{selected:ownerSelection.selection?.part==='header'}:undefined}
        onPress={ownerSelection?()=>ownerSelection.onSelect({part:'header'}):undefined}
        style={{backgroundColor:brandColours.bg,padding:14,
        ...(ownerSelection?{borderWidth:2,borderColor:ownerSelection.selection?.part==='header'?'#4489ed':brandColours.muted}:{}),
        borderRadius:14,marginBottom:10}}>
        <Text style={{color:brandColours.muted,fontSize:12}}>
          {config?.display?.category||profile.businessType||"Business"}
        </Text>
        <Text style={{color:brandColours.text,
          fontSize:visual.headerCompact?visual.type.titleSize-5:
            visual.headerEmphasis?visual.type.titleSize+4:visual.type.titleSize,
          fontWeight:visual.type.titleWeight,
          letterSpacing:visual.type.titleSpacing,
          textAlign:visual.headerCentered?"center":"left",marginTop:5,...componentStyle('header-title',visual.headerCompact?visual.type.titleSize-5:visual.headerEmphasis?visual.type.titleSize+4:visual.type.titleSize)}}>
          {config?.display?.name||profile.businessName||"Business"}
        </Text>
        <Text style={{color:brandColours.muted,marginTop:5,...componentStyle('header-tagline',visual.type.bodySize)}}>
          {config?.display?.tagline||profile.tagline||profile.description||"Your Business App"}
        </Text>
        <View style={{backgroundColor:brandColours.accent,
          height:4,borderRadius:3,marginTop:14}}/>
      </Header>
      <Card
        eyebrow={config?.display?.category || profile.businessType || "Business App"}
        title={config?.display?.name || profile.businessName || "Business"}
        body={
          config?.display?.tagline ||
          profile.tagline ||
          profile.description ||
          "Public business information"
        }
        footer={profile.serviceArea || ""}
        tone={headerStyle==="bold"?"green":headerStyle==="quiet"?"blue":"green"}
      >
        {!interactive?<Text style={styles.cardBody}>{"App layout: "+density+" • Header: "+headerStyle+
          " • Navigation: "+(responsive.ok?responsive.navigation:"list")+
          " ("+(responsive.ok?responsive.tier.replaceAll("_"," "):"not measured")+")"}</Text>:null}
        {!interactive&&responsive.ok?(
          <Text style={styles.cardBody}>
            {"Layout width "+responsive.width+" points • "+
              responsive.galleryColumns+" gallery column(s) • "+
              responsive.serviceColumns+" service column(s)."}
          </Text>
        ):null}
        {interactive?<AppSectionNavigation modules={modules.map(module=>({...module,label:module.label||module.title||miniAppModuleLabel(module.key)}))} selected={currentSection} colors={brandColours}
          onSelect={key=>{setSelectedSection(key);if(['enquiry','booking_request'].includes(key))onRequestNavigation?.(key);}}/>:modules.length?(
          <View style={{flexDirection:responsive.ok&&responsive.navigation==="list"?
            "column":"row",flexWrap:"wrap",gap:8,marginBottom:12}}>
            {modules.map((module,index)=>(
              ownerSelection?<Pressable key={"select-navigation-"+module.key}
                accessibilityRole="button" accessibilityLabel={"Select "+module.key.replaceAll("_"," ")+" navigation"}
                accessibilityState={{selected:ownerSelection.selection?.moduleKey===module.key}}
                onPress={()=>ownerSelection.onSelect({part:'navigation',moduleKey:module.key})}
                style={{minHeight:44,padding:8,borderRadius:8,borderWidth:2,
                  borderColor:ownerSelection.selection?.moduleKey===module.key?'#4489ed':brandColours.muted}}>
                <MeasuredNavLabel label={module.label||module.title||module.key.replaceAll("_"," ")}
                  index={index} isList={responsive.ok&&responsive.navigation==="list"} onObservation={onQualityObservation}/>
              </Pressable>:<MeasuredNavLabel key={"preview-navigation-"+module.key}
                label={module.label||module.title||module.key.replaceAll("_"," ")}
                index={index} isList={responsive.ok&&responsive.navigation==="list"} onObservation={onQualityObservation}/>
            ))}
          </View>
        ):null}
        {!interactive?<Text style={styles.cardBody}>
          Navigation labels are a visual preview; tap behaviour still needs device testing.
        </Text>:null}
        {heroUri.startsWith("https://") ? (
          <MeasuredPublicImage
            source={{ uri: heroUri }}
            observationKey="hero" observationKind="hero_image"
            onObservation={onQualityObservation}
            accessibilityLabel={String(profile.assets?.hero?.alt||
              "Business cover photo").slice(0,140)}
            style={{
              width: "100%",
              height:responsive.ok?responsive.heroHeight:230,
              borderRadius:presentation.imageCorners==="square"?2:18,
              marginBottom: 14,
            }}
          />
        ) : null}
        <MetricRow left="Powered by" right="BUSY DOES IT" strong />
      </Card>

      {modules.filter(module=>!interactive||!currentSection||module.key===currentSection).map((module) => {
        if (module.key === "business_profile") {
          return (
            <View key={module.key}><Card
              eyebrow="About"
              title={profile.businessName || "About this business"}
              body={
                profile.about ||
                profile.description ||
                "No public description recorded yet."
              }
              footer={profile.differentiators || ""}
              tone="blue"
            />
            {ownerSelection?<Button label="Edit this business description" onPress={()=>ownerSelection.onSelect({part:'wording',field:profile.about?'about':'description'})}/>:null}
            {(validContentLayout(config.contentLayout)?config.contentLayout:[]).map(block=><BusinessContentView key={block.kind} contextKey={catalogueContextKey} savedBrowseState={catalogueCache.current.states[block.kind]} onSaveBrowseState={value=>{if(catalogueCache.current.scope===catalogueContextKey)catalogueCache.current.states[block.kind]=value;}} feed={businessContent} colors={brandColours} {...block} onInterest={interactive&&modules.some(m=>m.key==='enquiry')?(onSelectContent||onSelectService):null}/>)}
            {publicCollection('faqs',profile.faqs||[]).map((row,i)=><AppFaqCard key={row.id||i} row={row} colors={brandColours} componentStyles={presentation.componentStyles} bodySize={visual.type.bodySize}>
              {ownerSelection?<AppEntryEditButton label={'Edit answer: '+row.question} colors={brandColours} selected={ownerSelection.selection?.part==='faq'&&ownerSelection.selection.index===i} onPress={()=>ownerSelection.onSelect({part:'faq',index:i,expectedFaq:JSON.stringify(profile.faqs[i])})}/>:null}
             </AppFaqCard>)}
            {['testimonials'].map(field=>publicCollection(field,profile[field]||[]).map((row,i)=><Card key={field+i}
              eyebrow="Customer testimonial"
              title={row.attribution} body={row.text}>

             </Card>))}
            </View>
          );
        }

        if (module.key === "services") {
          return (
            <View key={module.key}>
              {ownerSelection?<Pressable accessibilityRole="button" accessibilityLabel="Select service presentation" accessibilityState={{selected:ownerSelection.selection?.part==='services'}} onPress={()=>ownerSelection.onSelect({part:'services'})} style={{borderWidth:2,borderColor:ownerSelection.selection?.part==='services'?'#4489ed':brandColours.muted,padding:8}}><Text style={styles.sectionLabel}>Services</Text></Pressable>:<Text style={styles.sectionLabel}>Services</Text>}
              {allServices.length>4?<Field label="Find a service" value={serviceReturn.query} onChangeText={serviceReturn.onQuery}/>:null}
              <ServiceCategoryFilter categories={serviceBrowse.categories} selected={serviceBrowse.selectedCategory} onSelect={serviceReturn.onCategory} colors={brandColours} query={serviceReturn.query} resultCount={services.length} onClear={serviceReturn.clear}/>
              {serviceReturn.canReturn?<Button label="Back to my service results" onPress={serviceReturn.back}/>:null}
              {services.length ? (
                <View style={{flexDirection:"row",flexWrap:"wrap",
                  gap:responsive.ok?responsive.gap:12}}>
                  {services.map((service,index) => (
                    <View key={service.id||service.name||"service-"+index}
                      onLayout={event=>{
                        if(!onQualityObservation)return;
                        const {width,height}=event.nativeEvent.layout;
                        onQualityObservation({key:"service-"+index,
                          kind:"service_card",width,height});
                      }}
                      style={{width:visual.serviceColumns===1?"100%":
                        responsive.ok&&responsive.serviceColumns===2?"48%":"100%",
                       padding:visual.serviceStyle==="rows"?4:0}}> 
                      <View style={{backgroundColor:brandColours.surface,
                        borderWidth:visual.serviceStyle==="rows"?0:1,
                        borderBottomWidth:visual.serviceStyle==="rows"?1:undefined,
                        borderColor:index===0&&visual.featuredFirst?
                           brandColours.accent:brandColours.line,
                        borderRadius:visual.serviceStyle==="rows"?0:12,
                        padding:visual.serviceStyle==="rows"?9:15,...serviceCardStyle(presentation.servicePresentation,service.id,brandColours)}}>
                        {index===0&&visual.featuredFirst?<Text style={{
                          color:brandColours.accent,fontSize:12,fontWeight:"700"}}>
                          Featured service
                        </Text>:null}
                        <Text style={{color:brandColours.text,
                          fontSize:visual.type.bodySize+2,
                          fontWeight:visual.type.sectionWeight,...componentStyle('service:'+service.id+':title',visual.type.bodySize+2)}}>
                          {service.name||"Service"}
                        </Text>
                        <ServiceDetails service={service} onRelatedServices={interactive&&!ownerSelection?serviceReturn.related:undefined} colors={brandColours} bodySize={visual.type.bodySize} textStyle={componentStyle('service:'+service.id+':body',visual.type.bodySize)}/>
                        {ownerSelection?<AppEntryEditButton label={'Edit service '+service.name} colors={brandColours}
                          selected={ownerSelection.selection?.part==='service'&&ownerSelection.selection.index===allServices.indexOf(service)}
                          onPress={()=>ownerSelection.onSelect({part:'service',index:allServices.indexOf(service),expectedService:JSON.stringify(service)})}/>:null}
                        {(ownerSelection||interactive&&typeof onSelectService==='function')&&modules.some(m=>m.key==='enquiry')?<ServiceActionButton serviceId={service.id} action="enquiry" presentation={presentation.servicePresentation} colors={brandColours} label={'Ask about '+service.name}
                          onPress={()=>ownerSelection?ownerSelection.onSelect({part:'service-button',action:'enquiry',index:allServices.indexOf(service),expectedService:JSON.stringify(service)}):onSelectService(service.name,'enquiry')}/>:null}
                        {interactive&&typeof onSelectService==='function'&&modules.some(m=>m.key==='enquiry')?<View>
                          <Button label={questionService===service.name?'Hide question ideas':'Help me ask about '+service.name} onPress={()=>setQuestionService(questionService===service.name?'':service.name)}/>
                          {questionService===service.name?SERVICE_QUESTION_TOPICS.map(topic=><Button key={topic.key} label={topic.label} onPress={()=>onSelectService(service.name,'enquiry',topic.key)}/>):null}
                        </View>:null}
                        {(ownerSelection||interactive&&typeof onSelectService==='function')&&modules.some(m=>m.key==='booking_request')?<ServiceActionButton serviceId={service.id} action="booking_request" presentation={presentation.servicePresentation} colors={brandColours} label={'Request '+service.name}
                          onPress={()=>ownerSelection?ownerSelection.onSelect({part:'service-button',action:'booking_request',index:allServices.indexOf(service),expectedService:JSON.stringify(service)}):onSelectService(service.name,'booking_request')}/>:null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Card
                  eyebrow="Services"
                  title={serviceQuery?"No matching services":"Services still need adding"}
                  body={serviceQuery?"Try another word or clear the search. No request has been sent.":"BUSY will not invent services just to fill the Business App."}
                  tone="amber"
                />
              )}
            </View>
          );
        }

        if (module.key === "gallery") {
          return <AppGallerySurface key={module.key} config={config} responsive={responsive} colors={brandColours} visual={visual}
            ImageComponent={MeasuredPublicImage} onQualityObservation={onQualityObservation} ownerSelection={ownerSelection} publicMode={interactive}/>;
        }

        if (module.key === "contact") {
          return (
            <Card
              key={module.key}
              eyebrow="Contact"
              title="Get in touch"
              body="Contact details come from the business information approved for public use."
              tone="blue"
            >
              {profile.contact?.phone ? (
                <MetricRow left="Phone" right={profile.contact.phone} />
              ) : null}
              {profile.contact?.email ? (
                <MetricRow left="Email" right={profile.contact.email} />
              ) : null}
              {profile.contact?.openingHours ? (
                <MetricRow left="Hours" right={profile.contact.openingHours} />
              ) : null}
            </Card>
          );
        }

        if (module.key === "enquiry") {
          return (
            <Card
              key={module.key}
              eyebrow="Enquiries"
              title="Ask this business a question"
              body={
                interactive
                  ? "Use the enquiry form below and BUSY will send it into the business's normal customer workflow."
                  : "Customers can send a genuine enquiry from this Business App."
              }
              footer="A visit or click is never counted as an enquiry."
              tone="green"
            />
          );
        }

        if (module.key === "booking_request") {
          return (
            <Card
              key={module.key}
              eyebrow="Booking request"
              title="Request a service or date"
              body={
                interactive
                  ? "Use the booking request below. The business still has to confirm the real diary booking."
                  : "Customers can request a service/date without silently creating a confirmed booking."
              }
              footer="Request first • business confirmation required."
              tone="green"
            />
          );
        }

        if (module.key === "offers") {
          return (
            <View key={module.key}>
              <Text style={styles.sectionLabel}>Offers</Text>
              {offers.length ? (
                offers.map((offer, index) => (
                  <Card
                    key={`offer-${index}-${offer.title || "offer"}`}
                    eyebrow="Current offer"
                    title={offer.title || "Offer"}
                    body={offer.body || ""}
                    footer={[
                      offer.terms || "",
                      offer.startDate ? `Starts ${offer.startDate}` : "",
                      offer.endDate ? `Ends ${offer.endDate}` : "",
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                    tone="green"
                  />
                ))
              ) : (
                <Card
                  eyebrow="Offers"
                  title="No offer is active today"
                  body="BUSY only shows offers and dates the business owner has explicitly approved."
                  tone="blue"
                />
              )}
            </View>
          );
        }

        if (module.key === "loyalty") {
          const target = Number(loyalty?.targetStamps || 0);
          const stamps = Number(loyaltyProgress?.stamps || 0);
          return (
            <Card
              key={module.key}
              eyebrow="Loyalty"
              title={loyalty?.programName || "Loyalty rewards"}
              body={
                target > 0 && loyalty?.reward
                  ? `Collect ${target} stamps or visits to earn: ${loyalty.reward}`
                  : "The business has not finished configuring its loyalty reward."
              }
              footer={
                loyalty?.terms ||
                "The business records eligible stamps; BUSY does not create automatic points."
              }
              tone={loyaltyProgress?.rewardReached ? "green" : "blue"}
            >
              {loyaltyProgress && target > 0 ? (
                <>
                  <MetricRow
                    left="Your progress"
                    right={`${stamps}/${target} stamps`}
                    strong
                  />
                  <MetricRow
                    left="Reward"
                    right={
                      loyaltyProgress.rewardReached
                        ? "Reached"
                        : `${Math.max(0, target - stamps)} to go`
                    }
                    strong={!!loyaltyProgress.rewardReached}
                  />
                </>
              ) : (
                <MetricRow
                  left="Signed-in progress"
                  right={interactive ? "Open a request/conversation to track" : "Customer-specific"}
                />
              )}
            </Card>
          );
        }

        return null;
      })}
    </View>
  );
}

function BusyAppsMarketplace({ s }) {
  const [savedAppQuery,setSavedAppQuery]=React.useState("");
  const savedApps=Array.isArray(s.myBusyApps)?s.myBusyApps:[];
  const query=savedAppQuery.trim().toLocaleLowerCase("en");
  const visibleSavedApps=savedApps.filter(item=>!query||[item.name,item.tagline,item.category].some(value=>String(value||"").toLocaleLowerCase("en").includes(query)));
  const results = Array.isArray(s.busyAppsResults) ? s.busyAppsResults : [];

  return (
    <Shell
      s={s}
      title="BUSY Apps"
      subtitle="Search customer-facing apps created from BUSY's tested small-business modules."
      brandCue="V3.55 • Business Apps • customer journeys • loyalty • booking bridge • controlled modules."
    >
      <Card
        eyebrow="BUSY Apps marketplace"
        title="One place for small-business apps"
        body="A customer can search a business name inside BUSY, open that business's Business App, browse services and use enabled customer actions such as enquiry or booking request."
        footer="V3.44 connects Business Apps to real BUSY customer journeys while keeping one shared, controlled app platform."
        tone="green"
      >
        <Button
          label={s.miniAppsView?.app ? "Manage my business Business App" : "Build my business Business App"}
          primary
          onPress={s.openMiniAppBuilder}
        />
      </Card>

      {s.miniAppsError ? (
        <Card
          eyebrow="BUSY Apps"
          title="Needs attention"
          body={s.miniAppsError}
          tone="amber"
        />
      ) : null}

      <Card
        eyebrow="Request notifications"
        title={
          Number(s.miniAppsNotificationStatus?.activeDeviceCount || 0) > 0
            ? "Notifications are on"
            : "Get replies without checking BUSY"
        }
        body={
          s.miniAppsNotificationStatus?.message ||
          "BUSY can alert this device when a business replies or a customer updates a Business App request."
        }
        footer="Notification taps open the exact request conversation. Expo Go keeps unread badges working but remote push is tested in the native development build."
        tone={Number(s.miniAppsNotificationStatus?.activeDeviceCount || 0) > 0 ? "green" : "blue"}
      >
        {Number(s.miniAppsNotificationStatus?.activeDeviceCount || 0) > 0 ? (
          <Button
            label={s.miniAppsNotificationAction === "disable" ? "Turning off…" : "Turn off on this device"}
            disabled={!!s.miniAppsNotificationAction}
            onPress={s.disableMiniAppNotifications}
          />
        ) : (
          <Button
            label={s.miniAppsNotificationAction === "enable" ? "Turning on…" : "Turn on request notifications"}
            primary
            disabled={!!s.miniAppsNotificationAction}
            onPress={s.enableMiniAppNotifications}
          />
        )}
      </Card>

      <Text style={styles.sectionLabel}>My BUSY Apps</Text>
      <Field label="Find an app you have used" value={savedAppQuery} onChangeText={setSavedAppQuery} placeholder="Business name, description or category"/>
      {query?<><Text accessibilityLiveRegion="polite" style={styles.helper}>{visibleSavedApps.length+" matching saved apps. Public marketplace results below are separate."}</Text><Button label="Show all my saved apps" onPress={()=>setSavedAppQuery("")}/></>:null}
      {s.myBusyAppsLoading ? (
        <Card
          eyebrow="My BUSY Apps"
          title="Loading…"
          body="BUSY is loading the business apps you have used."
          tone="blue"
        />
      ) : (s.myBusyApps || []).length ? (
        visibleSavedApps.map((item) => (
          <Card
            key={`mine-${item.id}`}
            eyebrow={item.favorite ? "Favourite BUSY App" : item.category || "BUSY App"}
            title={item.name || "Business"}
            body={item.tagline || "Previously used BUSY Business App"}
            footer={[
              item.favorite ? "★ Favourite" : "",
              (s.myBusyAppRequests || []).reduce(
                (total, request) => total + (request.mini_app_id === item.id ? Number(request.customer_unread_count || 0) : 0),
                0
              )
                ? `${(s.myBusyAppRequests || []).reduce((total, request) => total + (request.mini_app_id === item.id ? Number(request.customer_unread_count || 0) : 0), 0)} unread`
                : "",
              item.lastActionAt ? `Last action ${readableDate(item.lastActionAt)}` : `Last opened ${readableDate(item.lastOpenedAt)}`,
            ].filter(Boolean).join(" • ")}
            tone={item.favorite ? "green" : "blue"}
          >
            <Button
              label="Open app"
              primary
              onPress={() => s.openBusyAppDetail(item.slug, "my_apps")}
            />
            <Button
              label={item.favorite ? "Remove favourite" : "Add to favourites"}
              disabled={s.miniAppsAction === `favorite:${item.slug}`}
              onPress={() =>
                s.toggleBusyAppFavorite(item.slug, !item.favorite)
              }
            />
          </Card>
        ))
      ) : (
        <Card
          eyebrow="My BUSY Apps"
          title="No apps used yet"
          body="Apps you open or use will appear here automatically, so customers do not have to search for the same business every time."
          tone="blue"
        />
      )}

      {(s.myBusyAppRequests || []).length ? (
        <>
          <Text style={styles.sectionLabel}>My recent requests</Text>
          {(s.myBusyAppRequests || []).slice(0, 8).map((request) => (
            <Card
              key={`my-request-${request.id}`}
              eyebrow={
                request.request_type === "booking_request"
                  ? "Booking request"
                  : "Enquiry"
              }
              title={request.app?.name || "BUSY business"}
              body={
                request.request_type === "booking_request"
                  ? [
                      request.service_name || "Service request",
                      request.preferred_date_text || "",
                    ].filter(Boolean).join(" • ")
                  : request.payload?.message || "Enquiry sent through BUSY."
              }
              footer={`${String(request.status || "received").replaceAll("_", " ")} • ${readableDate(request.updated_at || request.created_at)}`}
              tone={
                request.status === "accepted"
                  ? "green"
                  : request.status === "declined"
                  ? "amber"
                  : "blue"
              }
            >
              {Number(request.customer_unread_count || 0) > 0 ? (
                <MetricRow
                  left="New activity"
                  right={`${Number(request.customer_unread_count || 0)} unread`}
                  strong
                />
              ) : null}
              <Button
                label={Number(request.customer_unread_count || 0) > 0 ? "Open new reply" : "Open conversation"}
                primary={Number(request.customer_unread_count || 0) > 0}
                onPress={() => s.openCustomerMiniAppRequest(request.id)}
              />
            </Card>
          ))}
        </>
      ) : null}

      <Text style={styles.sectionLabel}>Find an app</Text>
      <Field
        label="Search business or category"
        value={s.busyAppsSearch}
        onChangeText={s.setBusyAppsSearch}
        placeholder="e.g. Jenny hairdresser"
      />
      <Button
        label={s.busyAppsSearching ? "Searching…" : "Search BUSY Apps"}
        disabled={s.busyAppsSearching}
        onPress={() => s.searchBusyApps()}
      />

      {results.length ? (
        results.map((item) => (
          <Card
            key={item.id}
            eyebrow={item.category || "BUSY Business App"}
            title={item.name || "Business"}
            body={item.tagline || "Customer-facing BUSY Business App"}
            footer={
              [
                item.serviceArea || "",
                item.serviceCount
                  ? `${item.serviceCount} service${item.serviceCount === 1 ? "" : "s"}`
                  : "",
              ]
                .filter(Boolean)
                .join(" • ")
            }
            tone="blue"
          >
            <Button
              label="Open app"
              primary
              onPress={() => s.openBusyAppDetail(item.slug)}
            />
          </Card>
        ))
      ) : (
        <Card
          eyebrow="Directory"
          title={s.busyAppsSearching ? "Searching…" : "No listed apps found"}
          body="Only live Business Apps that their business owner has explicitly approved for marketplace discovery appear here."
          tone="blue"
        />
      )}

      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function MiniAppBuilder({ s }) {
  const [explore,setExplore]=React.useState(false);
  const approvedRecords=useApprovedBuilderRecords(s.ownerSession?.userId,s.cloudWorkspace?.businessId);
  const [distributionMode,setDistributionMode]=React.useState("busy_marketplace");
  const [distributionAcks,setDistributionAcks]=React.useState({});
  const [requestedPlatforms,setRequestedPlatforms]=React.useState(["ios","android"]);
  const [standaloneHandoff,setStandaloneHandoff]=React.useState(null);
  const [standaloneHandoffNotice,setStandaloneHandoffNotice]=React.useState("");
  const [standaloneEligibility,setStandaloneEligibility]=React.useState(null);
  const [standaloneEligibilityBusy,setStandaloneEligibilityBusy]=React.useState(false);
  const [pendingAppearance,setPendingAppearance]=React.useState(null);
  const [showAllPalettes,setShowAllPalettes]=React.useState(false);
  const [brandAccentDraft,setBrandAccentDraft]=React.useState("#FF8A56");
  const [appearancePreviewOpen,setAppearancePreviewOpen]=React.useState(false);
  const [selectedAppPart,setSelectedAppPart]=React.useState("header");
  const [appearanceWords,setAppearanceWords]=React.useState("");
  const [appearanceInstructionNotice,setAppearanceInstructionNotice]=React.useState("");
  const [showAppVoice,setShowAppVoice]=React.useState(false);
  const [pendingMove,setPendingMove]=React.useState(null);
  const [studioWords,setStudioWords]=React.useState("");
  const [selectedCustomerTask,setSelectedCustomerTask]=React.useState("book");
  const [showCustomerTaskReview,setShowCustomerTaskReview]=React.useState(false);
  const [showJourneyPractice,setShowJourneyPractice]=React.useState(false);
  const [stagingHandoff,setStagingHandoff]=React.useState(null);
  const [stagingProbe,setStagingProbe]=React.useState(null);
  const [stagingSyntheticResult,setStagingSyntheticResult]=React.useState(null);
  const [stagingSyntheticBusy,setStagingSyntheticBusy]=React.useState(false);
  const [stagingInstallAudit,setStagingInstallAudit]=React.useState(null);
  const [stagingInstallBusy,setStagingInstallBusy]=React.useState(false);
  const [brainOwnerHistory,setBrainOwnerHistory]=React.useState(null);
  const [brainOwnerNotice,setBrainOwnerNotice]=React.useState("");
  const [brainOwnerBusy,setBrainOwnerBusy]=React.useState(false);
  const [showResponsiveDetails,setShowResponsiveDetails]=React.useState(false);
  const [studioCopyField,setStudioCopyField]=React.useState("tagline");
  const [studioCopy,setStudioCopy]=React.useState("");
  const [showFactRefresh,setShowFactRefresh]=React.useState(false);
  const [photoFrom,setPhotoFrom]=React.useState("1");
  const [photoTo,setPhotoTo]=React.useState("2");
  const [studioVoiceOpen,setStudioVoiceOpen]=React.useState(false);
  const view = s.miniAppsView || {};
  const app = view.app;
  const [ownerEditorEpoch,setOwnerEditorEpoch]=React.useState(0);
  const ownerDirtyParts=React.useRef({selected:false,copy:false});
  const ownerDraftEpoch=React.useRef(0),proposalDraft=React.useRef(null),ownerPartEpochs=React.useRef({});
  const [confirmedOwnerParts,setConfirmedOwnerParts]=React.useState({});
  const copyScope=JSON.stringify([s.ownerSession?.userId,s.cloudWorkspace?.businessId,app?.id]);
  const previousCopyScope=React.useRef(copyScope);
  const copyScopeCurrent=previousCopyScope.current===copyScope;
  if(!copyScopeCurrent){ownerDraftEpoch.current++;for(const part of Object.keys(ownerPartEpochs.current))ownerPartEpochs.current[part]=ownerDraftEpoch.current;previousCopyScope.current=copyScope;ownerDirtyParts.current={selected:false,copy:false};setStudioCopy('');}
  const legacyCopyLive=React.useRef(null);legacyCopyLive.current={value:copyScopeCurrent?studioCopy:'',field:studioCopyField,source:view.draftConfig};
  const reportOwnerDraft=useOwnerEditNavigation(s,{source:view.draftConfig,projectId:app?.id,revision:app?.draft_revision},()=>{ownerDraftEpoch.current++;for(const part of Object.keys(ownerPartEpochs.current))ownerPartEpochs.current[part]=ownerDraftEpoch.current;ownerDirtyParts.current={selected:false,copy:false};legacyCopyLive.current.value='';setStudioCopy('');setOwnerEditorEpoch(x=>x+1);});
  const currentOwnerReport=React.useRef(reportOwnerDraft);currentOwnerReport.current=reportOwnerDraft;
  const markOwnerDirty=(part,value)=>{ownerDraftEpoch.current++;ownerPartEpochs.current[part]=ownerDraftEpoch.current;ownerDirtyParts.current={...ownerDirtyParts.current,[part]:!!value};reportOwnerDraft(Object.values(ownerDirtyParts.current).some(Boolean));};
  const controlContext={ownerId:s.ownerSession?.userId||"",businessId:s.cloudWorkspace?.businessId||"",app};
  const liveControlContext=React.useRef(null);liveControlContext.current=controlContext;
  const dispatchDraftEpoch=ownerDraftEpoch.current;
  const studio=usePrivateAppStudio({businessId:s.cloudWorkspace?.businessId||"",
    ownerId:s.ownerSession?.userId||"",app,config:view.draftConfig},s.saveCoordinatedAppChanges,s.readCurrentAppStudioDraft,()=>dispatchDraftEpoch===ownerDraftEpoch.current);
  const studioPreview=studio.preview,studioNotice=studio.notice;
  const setStudioNotice=studio.setNotice;
  const setStudioPreview=(proposal,part=null)=>{
    proposalDraft.current=proposal?{part,epoch:ownerDraftEpoch.current,source:view.draftConfig}:null;
    return studio.prepare(proposal);
  };
  // This gates these original source replacements BEFORE mutation, not merely their later navigation.
  const replaceOwnerSource=action=>{
    if(liveControlContext.current!==controlContext)return false;
    const run=()=>{if(liveControlContext.current!==controlContext)return false;return action();};
    if(Object.values(ownerDirtyParts.current).some(Boolean)){
      if(s.requestOwnerEditTransition)return s.requestOwnerEditTransition(run,{reason:'source-change'});
      setStudioNotice('Keep editing or cancel your unsaved wording before replacing this private app.');return false;
    }
    return run();
  };
  const approvalEpoch=ownerDraftEpoch.current;
  const mayReplaceOwnerSource=()=>{
    if(liveControlContext.current!==controlContext||approvalEpoch!==ownerDraftEpoch.current)return false;
    const dirty=Object.keys(ownerDirtyParts.current).filter(part=>ownerDirtyParts.current[part]);
    const proposed=proposalDraft.current;
    if(dirty.length&&!(dirty.length===1&&dirty[0]===proposed?.part&&proposed.epoch===ownerDraftEpoch.current&&proposed.source===view.draftConfig)){
      setStudioNotice('Other wording is not saved. Keep editing, or cancel that wording before approving this change. Your proposal and private app are unchanged.');return false;
    }
    return true;
  };

  const approveOwnerDraft=async()=>{
    if(!mayReplaceOwnerSource())return {ok:false};
    const part=proposalDraft.current?.part;
    const expected=captureAppDraftAcknowledgement({...controlContext,config:view.draftConfig},part,ownerPartEpochs.current[part]);
    const result=await studio.approve();
    const cleared=acknowledgedAppDraftPart(expected,result,liveControlContext.current,ownerPartEpochs.current);
    if(cleared){
      ownerDirtyParts.current={...ownerDirtyParts.current,[cleared]:false};
      if(cleared==='copy'){legacyCopyLive.current.value='';setStudioCopy('');}
      setConfirmedOwnerParts(previous=>({...previous,[cleared]:(previous[cleared]||0)+1}));
      currentOwnerReport.current(Object.values(ownerDirtyParts.current).some(Boolean));
    }
    return result;
  };

  const studioIsCurrent=!!studio.preview;
  const goalMemory=useOwnerDesignMemory({businessId:s.cloudWorkspace?.businessId||"",
    ownerId:s.ownerSession?.userId||"",appId:app?.id,revision:app?.draft_revision},s.getAppDesignLearningStatus);

  const syntheticStagingGate=assessSyntheticStagingAction({
    businessId:s.cloudWorkspace?.businessId||"",app,
    probe:stagingProbe,install:stagingInstallAudit
  });
  React.useEffect(()=>{
    setStandaloneEligibility(null);
    setStandaloneHandoff(null);
    setPendingAppearance(null);
    setAppearancePreviewOpen(false);
    setStudioPreview(null);
    setStudioWords("");
    setStudioNotice("");
    setSelectedCustomerTask("book");
    setShowCustomerTaskReview(false);
    setShowJourneyPractice(false);
    setStagingHandoff(null);
    setStagingProbe(null);
    setStagingSyntheticResult(null);
    setStagingInstallAudit(null);
    setBrainOwnerHistory(null);
    setBrainOwnerNotice("");
  },[app?.id,s.cloudWorkspace?.businessId,s.ownerSession?.userId]);
  React.useEffect(()=>{
    setPendingAppearance(null);
    setAppearancePreviewOpen(false);
    setAppearanceInstructionNotice("");
    setShowAppVoice(false);
    setPendingMove(null);
    setStudioPreview(null);
    setStudioVoiceOpen(false);
    setStagingProbe(null);
    setStagingInstallAudit(null);
    setStagingSyntheticResult(null);
  },[app?.draft_revision]);
  React.useEffect(()=>{
    let valid=true;
    const businessId=s.cloudWorkspace?.businessId||"";
    const appId=app?.id||"";
    const revision=Number(app?.draft_revision)||0;
    setBrainOwnerHistory(null);
    setBrainOwnerNotice("");
    if(showCustomerTaskReview&&businessId&&appId&&revision>0&&
       typeof s.getAppBrainDecisions==="function"){
      s.getAppBrainDecisions({appId,expectedRevision:revision})
        .then(result=>{
          if(!valid)return;
          if(result?.ok&&result.appId===appId&&
             Number(result.revision)===revision&&
             result.businessId===businessId)
            setBrainOwnerHistory(result);
          else setBrainOwnerNotice(result?.reason||
             "Private preferences are unavailable until V3.176 is deployed.");
        }).catch(error=>{
          if(valid)setBrainOwnerNotice(String(error?.message||
            "Owner decisions couldn't be loaded.").slice(0,200));
        });
    }
    return ()=>{valid=false;};
  },[showCustomerTaskReview,app?.id,app?.draft_revision,
     s.cloudWorkspace?.businessId]);
  const modules = Array.isArray(view.catalog) ? view.catalog : [];
  const configuredModules = new Map(
    (view.modules || []).map((item) => [item.key, item])
  );
  const plan = s.miniAppBuilderPlan || view.builderPlan || null;
  const intelligence = s.businessCreationIntelligence || {};
  const recommendedModules = Array.isArray(intelligence.recommendedAppModules)
    ? intelligence.recommendedAppModules
    : [];
  const recommendationRows = Array.isArray(intelligence.recommendations?.app)
    ? intelligence.recommendations.app.filter((item) => item?.recommended)
    : [];
  const missingFacts = Array.isArray(plan?.missingFacts)
    ? plan.missingFacts
    : [];
  const draftBuilt = !!view.draftConfig?.builderPlan;
  // Exact immutable preview identity and positive revision matter; two
  // absent revision numbers must never accidentally count as a current app.
  const previewProof = businessAppPreviewProof({app,preview:view.previewVersion});
  const previewMatchesDraft = previewProof.matches;
  const distributionPlan=buildAppDistributionPlan({
    mode:distributionMode,app,preview:view.previewVersion,
    entitlement:null, // Not connected to an independently verified billing entitlement yet.
    acknowledgements:distributionAcks,requestedPlatforms,
    ownerApproval:false
  });
  const experience=planFunctionalBusinessApp({
    businessName:view.displayName||s.businessName,
    businessType:view.category||s.trade||"",
    businessGoals:s.miniAppBuildBrief||plan?.ownerRequest||"",
    catalog:view.catalog||[],
    profile:view.draftConfig?.publicProfile||view.activeConfig?.publicProfile||{},
    approvedContent:approvedRecords.feed,businessId:s.cloudWorkspace?.businessId,
    offerTerms:view.draftConfig?.offers||view.activeConfig?.offers||[]
  });
  const quality=appDesignQualityReport(view.draftConfig||view.activeConfig||{},view.catalog||[]);
  const usability=auditBusinessAppUsability(view.draftConfig||view.activeConfig||{});
  const customerTaskReport=view.draftConfig?
    buildCustomerTaskDesignReport(view.draftConfig):null;
  const customerTaskPlan=view.draftConfig?
    proposeTaskFirstNavigation(view.draftConfig,selectedCustomerTask):null;
  const practiceReport=view.draftConfig?
    runCustomerJourneyPractice(view.draftConfig):null;
  const customerExperience=view.draftConfig?
    reviewCustomerExperience(view.draftConfig,{goal:selectedCustomerTask}):null;
  const sharedAppJourney=view.draftConfig?reviewSharedCustomerGoal({
    goal:selectedCustomerTask,appConfig:view.draftConfig
  }):null;
  const appEvidence=customerTaskPlan?.preview?.ok?
    appDesignEvidenceComparison({before:view.draftConfig,
      after:customerTaskPlan.preview.nextConfig,goal:selectedCustomerTask}):null;
  const stagingPlan=stagingJourneyTestPlan({
    kind:selectedCustomerTask==="enquire"?"enquiry":"booking_request",
    channel:"busy_marketplace"
  });
  const serviceClarity=view.draftConfig?
    reviewBusinessInformation({appConfig:view.draftConfig}):null;
  const stagedDryRun=view.draftConfig&&["book","enquire"].includes(selectedCustomerTask)?
    prepareStagingJourneyRun({
      kind:selectedCustomerTask==="enquire"?"enquiry":"booking_request",
      channel:"busy_marketplace",businessId:s.cloudWorkspace?.businessId||"",
      draftRevision:app?.draft_revision||0,
      environment:"dry_run"
    }):null;
  const comparativeEvidence=customerTaskPlan?.preview?.ok?
    compareAppGoalCandidate({before:view.draftConfig,
      after:customerTaskPlan.preview.nextConfig,
      goal:selectedCustomerTask}):null;
  const offlinePreflight=view.draftConfig&&["book","enquire"].includes(selectedCustomerTask)?
    executeOfflineJourneyPreflight({
      appConfig:view.draftConfig,
      kind:selectedCustomerTask==="enquire"?"enquiry":"booking_request",
      channel:"busy_marketplace",businessId:s.cloudWorkspace?.businessId||"",
      draftRevision:app?.draft_revision||0}):null;
  const nativeDeviceChecklist=view.draftConfig?prepareDeviceReview({
    businessId:s.cloudWorkspace?.businessId||"",surface:"business_app",
    draftId:app?.id||"",revision:app?.draft_revision||0
  }):null;
  const ownerImprovementPlan=view.draftConfig?prepareOwnerImprovementPlan({
    goal:selectedCustomerTask,appConfig:view.draftConfig,
    appRevision:app?.draft_revision||0}):null;
  const coordinatedBuilders=s.websiteDraft&&view.draftConfig&&
    app?.business_id===s.cloudWorkspace?.businessId?
    prepareCoordinatedBuilderReview({
      businessId:s.cloudWorkspace.businessId,
      appBusinessId:app.business_id,websiteBusinessId:s.cloudWorkspace.businessId,
      websiteDraft:s.websiteDraft,brandBrain:s.brandBrain||{},
      appConfig:view.draftConfig,websiteRevision:Number(s.websiteDraft.generation)||0,
      appRevision:Number(app.draft_revision)||0
    }):null;
  const connectedJourney=coordinatedBuilders?.ok?
    coordinateCustomerJourneyReview({
      goal:["book","enquire","services"].includes(selectedCustomerTask)?
        selectedCustomerTask:"book",
      businessId:s.cloudWorkspace?.businessId||"",
      websiteBusinessId:s.cloudWorkspace?.businessId||"",
      appBusinessId:app?.business_id||"",
      websiteRevision:Number(s.websiteDraft?.generation)||0,
      appRevision:Number(app?.draft_revision)||0,
      builderReview:coordinatedBuilders,outcomeProof:view.outcomeProof
    }):null;
  const businessBrainQueue=view.draftConfig?prepareBusinessBrainWork({
    businessId:s.cloudWorkspace?.businessId||"",
    goal:selectedCustomerTask,appConfig:view.draftConfig,
    appRevision:app?.draft_revision||0,
    ownerDecisions:brainOwnerHistory?.appId===app?.id&&
      Number(brainOwnerHistory?.revision)===Number(app?.draft_revision)&&
      brainOwnerHistory?.businessId===s.cloudWorkspace?.businessId?
      brainOwnerHistory.records:[]
  }):null;
  const syntheticEvidence=stagingSyntheticResult?.ok?
    assessBrainOutcomeEvidence({
      businessId:s.cloudWorkspace?.businessId||"",
      appId:app?.id||"",revision:Number(app?.draft_revision)||0,
      evidence:stagingSyntheticResult,
      routeKind:selectedCustomerTask==="enquire"?"enquiry":"booking_request",
      channel:"busy_marketplace"
    }):null;
  const launchReadiness=app?.id&&app?.draft_revision?
    evaluateReleaseReadiness({
      businessId:s.cloudWorkspace?.businessId||"",
      appId:app.id,draftRevision:Number(app.draft_revision),
      installAudit:stagingInstallAudit,
      syntheticEvidence:stagingSyntheticResult
    }):null;
  const nonAiDesignHints=proposeLowRiskDesignHints(view.draftConfig||view.activeConfig||{});
  const responsiveGuidance=recommendResponsiveDesign(view.draftConfig||view.activeConfig||{});
  const appGoalDesign=view.draftConfig&&app?.draft_revision?
    reviewAppGoalDesignV3240({
      businessId:s.cloudWorkspace?.businessId||"",app,
      website:s.websiteDraft||null,goal:selectedCustomerTask,
      ownerId:s.ownerSession?.userId||"",ownerDesignHistory:goalMemory.memory
    }):null;
  const responsiveQuality=evaluateAppAcrossScreens(view.draftConfig||view.activeConfig||{});
  const measuredNativeContrast=auditStandaloneContrast(nativePalette(
    (view.draftConfig||view.activeConfig)?.presentation?.brandPalette,
    (view.draftConfig||view.activeConfig)?.presentation?.brandAccent));
  const liveMatchesDraft =
    businessAppPreviewProof({app,preview:view.liveVersion}).matches;
  const journeyLabel = !plan
    ? "Describe the app you want"
    : missingFacts.length
    ? "BUSY needs a few details"
    : !draftBuilt
    ? "Review BUSY's app plan"
    : !previewMatchesDraft
    ? "BUSY is preparing the customer preview"
    : !liveMatchesDraft
    ? "Customer preview ready for approval"
    : "Your Business App is live";
  const journeySteps = [
    {
      id: "describe",
      label: "Describe the customer experience",
      status: plan ? "complete" : "working",
    },
    {
      id: "facts",
      label: "Fill only the missing facts",
      status: !plan
        ? "waiting"
        : missingFacts.length
        ? "working"
        : "complete",
    },
    {
      id: "draft",
      label: "BUSY builds the private app",
      status: draftBuilt
        ? "complete"
        : plan && !missingFacts.length
        ? "working"
        : "waiting",
    },
    {
      id: "preview",
      label: "Review the real customer experience",
      status: previewMatchesDraft
        ? "complete"
        : draftBuilt
        ? "working"
        : "waiting",
    },
    {
      id: "live",
      label: "Owner approves Go Live",
      status: liveMatchesDraft
        ? "complete"
        : previewMatchesDraft
        ? "working"
        : "waiting",
    },
  ];

  const exploreContext={kind:'app',ownerId:s.ownerSession?.userId,businessId:s.cloudWorkspace?.businessId,catalog:view.catalog||[],project:app?{...app,draft_config:view.draftConfig}:null};
  const exploreLive=React.useRef(null);exploreLive.current=exploreContext;
  if(explore)return <Shell s={s} title="Business App • Talk & Explore" subtitle="Nothing will be changed"><BuilderTalkExplore context={exploreContext} onExit={()=>setExplore(false)} onHandoff={handoff=>{
    if(s.miniAppsAction||studio.pending||studio.uncertain||!currentBuilderExplore({ok:true,source:handoff.source},exploreLive.current))return false;
    if(!setStudioPreview(handoff.proposal))return false;
    setExplore(false);setStudioNotice('Explore ended. Review the original Studio comparison; no project change was applied.');return true;
  }}/></Shell>;
  return (
    <Shell
      s={s}
      title="Business App Builder"
      subtitle="Describe the customer experience you want. BUSY turns it into a controlled app plan using tested modules and the business facts it already knows."
      brandCue="V3.56 • shared business profile • intelligent module recommendations • owner-controlled publishing."
    >
      <Button label="Talk & Explore — no project changes" disabled={!app||!view.draftConfig||!!s.miniAppsAction||studio.pending||studio.uncertain} onPress={()=>s.requestOwnerEditTransition?s.requestOwnerEditTransition(()=>setExplore(true)):setExplore(true)}/>
      <BusinessContentEditor key={['records',s.ownerSession?.userId,s.cloudWorkspace?.businessId].join(':')}
        businessId={s.cloudWorkspace?.businessId} request={s.businessContentRequest}
        onApprovedRecords={approvedRecords.onApprovedRecords}
        onCompose={(_,choice)=>{const old=validContentLayout(view.draftConfig?.contentLayout)?view.draftConfig.contentLayout:[],block={kind:choice.kind,layout:choice.layout,featuredId:choice.featuredId,title:choice.kind==='product'?'Products':'Upcoming events'};const value=choice.remove?old.filter(x=>x.kind!==choice.kind):old.some(x=>x.kind===choice.kind)?old.map(x=>x.kind===choice.kind?block:x):[...old,block];const proposal=proposeContentComposition(view.draftConfig,[{kind:'content_layout',value}]);if(proposal.ok)proposal.businessContentPreview=choice.previewFeed;setStudioPreview(proposal.ok?proposal:null);setStudioNotice(proposal.ok?'Review the real content composition in Studio. Approved records are loaded separately.':proposal.reason);}}/>
      <FirstAppFromWebsite website={s.websiteDraft}
        app={app} businessId={s.cloudWorkspace?.businessId}
        businessType={s.trade} services={s.miniAppProfileDraft?.services||s.services}
        onCreate={s.createPrivateAppFromWebsite}
        onCheckBenefit={s.checkStandaloneEligibility}
        busy={s.miniAppsAction}/>
      {(()=>{const next=suggestFirstAppNextStep({
        website:s.websiteDraft,app,businessId:s.cloudWorkspace?.businessId
      });return next.show?<Card eyebrow="What Busy recommends next"
        title={next.title} body={next.why}
        footer={next.action} tone="blue">
        <Text style={styles.cardBody}>
          This is a private, explainable recommendation based on your actual
          app draft. It does not enable features or publish anything.
        </Text>
        <Button label="Check my latest private app status"
          disabled={!!s.miniAppsAction}
          onPress={()=>s.refreshMiniAppsStatus()}/>
      </Card>:null;})()}
      <IndustryFirstExperienceReview
        businessId={s.cloudWorkspace?.businessId}
        app={app} catalog={s.miniAppsStatus?.catalog||[]}
        onSave={s.saveCoordinatedAppChanges}
        onRefresh={s.refreshMiniAppsStatus}
        busy={s.miniAppsAction}/>
      <BusinessBrandDnaPreview key={[s.ownerSession?.userId,s.cloudWorkspace?.businessId,s.websiteDraft?.id,app?.id].join(':')} website={s.websiteDraft}
        app={app} businessId={s.cloudWorkspace?.businessId}
        catalog={view.catalog||s.miniAppsStatus?.catalog||[]}/>
      <UniversalBuilderPlanReview surface="app" approvedContent={approvedRecords.feed}
        businessId={s.cloudWorkspace?.businessId||""}
        businessType={view.category||s.trade||""}
        website={s.websiteDraft} app={app} catalog={view.catalog||[]}
        initialGoal={s.miniAppBuildBrief||plan?.ownerRequest||""}
        onSaveAppChanges={s.saveCoordinatedAppChanges}
        busy={!!s.miniAppsAction}/>
      <WebsiteToAppDesignTransfer key={[s.ownerSession?.userId,s.cloudWorkspace?.businessId,s.websiteDraft?.id,app.id].join(':')} website={s.websiteDraft} app={app}
        businessId={s.cloudWorkspace?.businessId}
        onPreview={setStudioPreview} busy={!!s.miniAppsAction||studio.pending||studio.uncertain}/>
      <Card
        eyebrow="Choose how customers use your app"
        title="Inside Busy, standalone, or eventually both"
        body="We are building both routes. Your business information and supported app modules can be shared, but independent downloadable apps need an additional packaging and store-distribution process."
        footer="Standalone inclusion in a higher subscription is planned. No pricing, included allowance or eligibility is final until your verified subscription says so."
        tone="blue"
      >
        <Button label={(distributionMode==="busy_marketplace"?"✓ ":"")+"App inside Busy Does It"}
          onPress={()=>{setDistributionMode("busy_marketplace");setStandaloneHandoff(null);setStandaloneHandoffNotice("");}}/>
        <Button label={(distributionMode==="standalone"?"✓ ":"")+"Standalone downloadable iPhone / Android app"}
          onPress={()=>{setDistributionMode("standalone");setStandaloneHandoff(null);setStandaloneHandoffNotice("");}}/>
        <Text style={styles.cardBody}>{distributionPlan.description}</Text>
        {distributionMode==="busy_marketplace"?(
          <>
            <MetricRow left="Existing real features" right="Enquiries and booking requests" strong/>
            <MetricRow left="Marketplace listing" right={view.isDiscoverable?"Live owner-approved listing":"Separate owner approval required"}/>
            <Text style={styles.cardBody}>A booking request is not a confirmed appointment. BUSY never enables payment collection just because a customer asks for it.</Text>
            <Text style={styles.cardBody}>Customers find published, explicitly listed Business Apps through the Busy Apps marketplace.</Text>
          </>
        ):(
          <>
            <Text style={styles.sectionLabel}>Before creating a standalone app</Text>
            <Text style={styles.cardBody}>{distributionPlan.eligible.label}</Text>
            {distributionPlan.costs.map(item=>(
              <MetricRow key={item.key} left={item.title} right={item.detail}/>
            ))}
            <Text style={styles.cardBody}>Choose the platforms you may want. This does not place an order or sign you up to Apple or Google.</Text>
            <Button label={(requestedPlatforms.includes("ios")?"✓ ":"")+"iPhone (iOS)"}
              onPress={()=>{
                setRequestedPlatforms(old=>old.includes("ios")?
                  (old.length>1?old.filter(x=>x!=="ios"):old):[...old,"ios"]);
                setStandaloneHandoff(null);
              }}/>
            <Button label={(requestedPlatforms.includes("android")?"✓ ":"")+"Android"}
              onPress={()=>{
                setRequestedPlatforms(old=>old.includes("android")?
                  (old.length>1?old.filter(x=>x!=="android"):old):[...old,"android"]);
                setStandaloneHandoff(null);
              }}/>
            <Text style={styles.sectionLabel}>Please review these separate-cost conditions</Text>
            {[
              ["externalFees","Developer registrations, app-store charges and external provider fees may cost extra."],
              ["externalAccounts","I may need to create and maintain my own Apple, Google or other provider accounts."],
              ["storeApproval","Apple and Google decide whether to accept an app; approval is not guaranteed."],
              ["ongoingCosts","Store requirements, certificates, updates and third-party usage may create ongoing costs."]
            ].map(([key,label])=>(
              <Button key={key} label={(distributionAcks[key]?"✓ Reviewed: ":"Review: ")+label}
                onPress={()=>{
                  setDistributionAcks(prev=>({...prev,[key]:!prev[key]}));
                  setStandaloneHandoff(null);setStandaloneHandoffNotice("");
                }}/>
            ))}
            <MetricRow left="App preview matches current draft" right={previewProof.matches?"Yes":"Prepare new private preview"} strong/>
            <MetricRow left="Standalone eligibility"
              right={standaloneEligibility?.verified&&standaloneEligibility?.businessId===s.cloudWorkspace?.businessId
                ?standaloneEligibility.eligible?"Verified allowance available":"Verified but allowance used"
                :"Not verified"}/>
            <Button label={standaloneEligibilityBusy?"Checking secure billing record…":"Check my standalone subscription benefit"}
              disabled={standaloneEligibilityBusy}
              onPress={async()=>{
                setStandaloneEligibilityBusy(true);
                try{
                  const result=await s.checkStandaloneEligibility?.();
                  setStandaloneEligibility(result||null);
                }finally{setStandaloneEligibilityBusy(false);}
              }}/>
            {standaloneEligibility?.reason?
              <Text style={styles.cardBody}>{standaloneEligibility.reason}</Text>:null}
            <Text style={styles.cardBody}>This creates only a private planning specification. It cannot package, charge for, sign or submit an app. A verified higher-tier entitlement and further explicit approval will be required.</Text>
            <Button label="Prepare my private standalone-app requirements"
              disabled={!app||!previewProof.matches||
                !distributionPlan.requirements.filter(x=>["external-fees","external-accounts","store-approval","maintenance"].includes(x.id)).every(x=>x.passed)}
              onPress={()=>{
                const next=buildStandalonePrivateHandoff({app,preview:view.previewVersion,
                  plan:distributionPlan,catalog:view.catalog||[],ownerConfirmed:true});
                setStandaloneHandoff(next.ok?next:null);
                setStandaloneHandoffNotice(next.ok
                  ?"Your private standalone plan is ready. This is NOT a downloadable or submitted app."
                  :next.reason);
              }}/>
            {standaloneHandoffNotice?<Text style={styles.cardBody}>{standaloneHandoffNotice}</Text>:null}
            {standaloneHandoff?.ok&&
             standaloneHandoff.ownerAppId===app?.id&&
             standaloneHandoff.previewVersionId===view.previewVersion?.id&&
             standaloneHandoff.sourceDraftRevision===app?.draft_revision?(
              <Card eyebrow="Private standalone plan"
                title={standaloneHandoff.appName}
                body={"Target platforms: "+standaloneHandoff.platformTargets.join(" and ")+
                  ". Supported modules: "+(standaloneHandoff.modules.join(", ")||"None yet")}
                footer="Build package not created • No app-store submission • No charges"
                tone="blue"/>
            ):null}
          </>
        )}
      </Card>

      <Card eyebrow="BUSY's functional app layout"
        title={"Recommended: "+experience.layout.replaceAll("-"," ")}
        body={"BUSY selected an app structure for "+(experience.businessType||"this business")+
          " from currently available modules. Recommendations do not enable modules or change a live app."}
        footer="This is a suggested private app experience, not a new hard-coded trade-specific app template."
        tone="blue">
        <Text style={styles.cardBody}>{experience.layoutReason}</Text>
        {experience.needsClarification?<Text style={styles.cardBody}>Your brief includes and excludes the same action. Clarify that choice before enabling it; BUSY has left it out of recommendations.</Text>:null}
        {experience.declinedCapabilities?.length?<Text style={styles.cardBody}>Left out at your request: {experience.declinedCapabilities.join(', ')}. Existing saved modules are unchanged.</Text>:null}
         {experience.understoodGoals?.length?(
          <Text style={styles.cardBody}>{"Customer goals identified: "+
            experience.understoodGoals.join(", ")}</Text>
        ):null}
        {experience.missingOwnerFacts?.length?(
           <Text style={styles.cardBody}>
             {"Before showing these features, BUSY needs: "+
              experience.missingOwnerFacts.map(x=>x==="approved_gallery_photos"?
                "approved photographs":x==="approved_offer_terms"?
                "approved offer terms":x==="owner_service_details"?"owner-written service details":x==="approved_product_records"?"current approved product records in Products & Events":x==="approved_event_records"?"current approved event records in Products & Events":"owner details").join(", ")+
              ". Review the existing content editor; no facts, stock, prices or availability will be invented."}
           </Text>
         ):null}
         {experience.unavailableGoalCapabilities?.length?(
          <Text style={styles.cardBody}>{"Not yet available: "+
            experience.unavailableGoalCapabilities.join(", ")+
            ". BUSY will not pretend these work."}</Text>
        ):null}
        {experience.approvedRecords?.map(row=><View key={row.kind}>
          <Text style={styles.cardBody}>{row.count+' approved '+(row.kind==='product'?'product':'upcoming event')+' record(s) in the latest loaded snapshot. No stock, attendance or availability is confirmed.'}</Text>
          {!view.draftConfig?.contentLayout?.some(block=>block.kind===row.kind)?<Button label={'Review '+(row.kind==='product'?'approved products':'approved events')+' in my app'} onPress={()=>{
            if(liveControlContext.current!==controlContext||!approvedRecords.isCurrent())return;
            const proposal=planApprovedAppRecordSection(view.draftConfig,approvedRecords.feed,s.cloudWorkspace?.businessId,row.kind);
            setStudioPreview(proposal.ok?proposal:null);setStudioNotice(proposal.ok?'Review the original private Studio preview before approval. Publication remains separate.':proposal.reason);
          }}/>:<Text style={styles.cardBody}>Already included. Studio keeps your existing heading, layout and featured item.</Text>}
        </View>)}
        {experience.suggestedModules.filter(item=>item.suggested).slice(0,7).map(item=>(
          <MetricRow key={item.key} left={item.title} right={item.reason}/>
        ))}
      </Card>

      <Card
        eyebrow="Your app journey"
        title={journeyLabel}
        body="BUSY keeps the technical work underneath one simple path: describe it, answer only what is missing, review the customer experience, then approve Go Live."
        footer="Nothing public changes until you approve the exact immutable customer preview."
        tone={liveMatchesDraft ? "green" : "blue"}
      >
        {journeySteps.map((step) => (
          <MetricRow
            key={step.id}
            left={step.label}
            right={
              step.status === "complete"
                ? "Done"
                : step.status === "working"
                ? "Current"
                : "Waiting"
            }
            strong={step.status === "complete"}
          />
        ))}
      </Card>

      <Card
        eyebrow="BUSY already knows"
        title={
          recommendedModules.length
            ? `${recommendedModules.length} module${recommendedModules.length === 1 ? "" : "s"} fit this business`
            : "Your shared business profile is ready"
        }
        body="V3.56 uses the same approved business facts for the website and Business App, then suggests modules that fit the type of business without inventing services, offers, prices or claims."
        footer={
          intelligence.aligned === false
            ? "BUSY spotted a difference between a current builder draft and the shared profile. Review before publishing."
            : "Website and Business App intelligence are aligned to the same source of truth."
        }
        tone={intelligence.aligned === false ? "amber" : "blue"}
      >
        {recommendationRows.slice(0, 6).map((item) => (
          <MetricRow
            key={`intelligence-${item.key}`}
            left={miniAppModuleLabel(item.key)}
            right={item.reason || "Recommended from approved business facts"}
            strong
          />
        ))}
      </Card>

      <Card
        eyebrow="Tell BUSY the outcome"
        title="What should customers be able to do?"
        body="Use normal language — for example: “I want customers to see my services and photos, request a quote and ask for a booking.” BUSY plans the app before building anything."
        footer="You can also use the BUSY microphone. Voice is transcribed through the existing BUSY Operator and returns here as a plan."
        tone="green"
      >
        <Field
          label="Describe your app"
          value={s.miniAppBuildBrief}
          onChangeText={s.setMiniAppBuildBrief}
          placeholder="e.g. Let customers see our work, request quotes and ask for bookings"
        />
        <Button
          label={
            s.miniAppsAction === "plan-app"
              ? "Creating app plan…"
              : "Create app plan"
          }
          primary
          disabled={!String(s.miniAppBuildBrief || "").trim() || !!s.miniAppsAction}
          onPress={() => s.planMiniAppFromBrief()}
        />
        <Button
          label="Describe it by voice"
          disabled={!!s.miniAppsAction}
          onPress={s.describeMiniAppByVoice}
        />
      </Card>

      {plan ? (
        <Card
          eyebrow="BUSY App Plan"
          title={plan.summary || "Proposed customer app"}
          body="BUSY maps your request onto the tested modules it can safely support. It asks only for facts that are genuinely missing before it builds the private app."
          footer={`Confidence: ${plan.confidence || "Not stated"} • Nothing public changes here.`}
          tone={missingFacts.length ? "amber" : "blue"}
        >
          {(plan.modules || [])
            .filter((item) => item.enabled)
            .map((item) => (
              <MetricRow
                key={`plan-module-${item.key}`}
                left={miniAppModuleLabel(item.key)}
                right={item.reason || "Included"}
                strong
              />
            ))}

          {missingFacts.length ? (
            <>
              <Text style={styles.sectionLabel}>BUSY still needs</Text>
              {missingFacts.map((item) =>
                item.key === "gallery" ? (
                  <Card
                    key={`missing-${item.key}`}
                    eyebrow="Approved photos"
                    title="Add the photos you want customers to see"
                    body={item.question}
                    footer="BUSY will only use imagery already approved for the public business profile."
                    tone="amber"
                  >
                    <Button
                      label="Open Brand Identity photos"
                      disabled={!!s.miniAppsAction}
                      onPress={s.openBrandIdentity}
                    />
                  </Card>
                ) : (
                  <Field
                    key={`missing-${item.key}`}
                    label={item.question}
                    value={s.miniAppFactAnswers?.[item.key] || ""}
                    onChangeText={(value) =>
                      s.updateMiniAppFactAnswer(item.key, value)
                    }
                    placeholder={
                      item.key === "loyalty"
                        ? "e.g. 6 visits earns a free wash"
                        : item.key === "offers"
                        ? "Exact offer wording, terms and optional dates"
                        : "Tell BUSY this detail"
                    }
                  />
                )
              )}
              <Button
                label={
                  s.miniAppsAction === "plan-app"
                    ? "Updating plan…"
                    : "Use these answers & update plan"
                }
                primary
                disabled={!!s.miniAppsAction}
                onPress={s.answerMiniAppMissingFacts}
              />
            </>
          ) : null}

          {(plan.unsupportedRequests || []).length ? (
            <>
              <Text style={styles.sectionLabel}>Planned for later</Text>
              {(plan.unsupportedRequests || []).map((item, index) => (
                <MetricRow
                  key={`unsupported-${index}-${item.request}`}
                  left={item.request}
                  right={item.reason}
                />
              ))}
            </>
          ) : null}

          {(plan.offers || []).length ? (
            <>
              <Text style={styles.sectionLabel}>Approved offer wording</Text>
              {(plan.offers || []).map((offer, index) => (
                <MetricRow
                  key={`planned-offer-${index}`}
                  left={offer.title}
                  right={[
                    offer.body,
                    offer.terms,
                    offer.startDate ? `Starts ${offer.startDate}` : "",
                    offer.endDate ? `Ends ${offer.endDate}` : "",
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                />
              ))}
            </>
          ) : null}

          {plan.loyalty?.enabled ? (
            <>
              <Text style={styles.sectionLabel}>Loyalty</Text>
              <MetricRow
                left={plan.loyalty.programName || "Loyalty reward"}
                right={`${plan.loyalty.targetStamps || 0} stamps → ${plan.loyalty.reward || "Reward not set"}`}
                strong
              />
              {plan.loyalty.terms ? (
                <MetricRow left="Terms" right={plan.loyalty.terms} />
              ) : null}
            </>
          ) : null}

          {!missingFacts.length ? (
            <Button
              label={
                s.miniAppsAction === "apply-app-plan"
                  ? "Building customer preview…"
                  : app
                  ? "Build this update & show me"
                  : "Build this app & show me"
              }
              primary
              disabled={!!s.miniAppsAction}
              onPress={()=>replaceOwnerSource(()=>s.applyMiniAppPlan())}
            />
          ) : null}
        </Card>
      ) : null}

      <Card
        eyebrow="Your Business App"
        title={view.statusLabel || "Not built"}
        body={
          app
            ? "The mutable draft is separate from immutable preview/live versions. Changing a module here does not silently change the live app."
            : "BUSY can create the first draft from your Brand Brain without writing a bespoke codebase."
        }
        footer={
          app
            ? `Draft revision ${app.draft_revision || 1} • ${view.enabledModules?.length || 0} enabled modules`
            : "Start with the tested module catalogue."
        }
        tone={view.hasLive ? "green" : "blue"}
      >
        <MetricRow left="Business" right={view.displayName || s.businessName} strong />
        <MetricRow left="Category" right={view.category || s.trade || "Not recorded"} />
        <MetricRow left="Marketplace" right={view.isDiscoverable ? "Listed" : "Not listed"} />
        <Button
          label={
            s.miniAppsAction === "build"
              ? "Refreshing business facts…"
              : app
              ? "Review saved business fact updates"
              : "Quick-build from Business Brain facts"
          }
          disabled={!!s.miniAppsAction}
          onPress={()=>app?setShowFactRefresh(value=>!value):s.buildMiniAppFromBrandBrain()}
        />
        {app&&showFactRefresh?(<>
          <AppBusinessFactRefresh key={[s.ownerSession?.userId,s.cloudWorkspace?.businessId,app.id,app.draft_revision,s.miniAppsStatus?.publicProfile?.revision].join(":")}
            businessId={s.cloudWorkspace?.businessId||""} app={app}
            profileRecord={s.miniAppsStatus?.publicProfile} busy={!!s.miniAppsAction||studio.pending}
            onPreview={setStudioPreview} onNotice={setStudioNotice}/>
        </>):null}
        {view.activeConfig ? (
          <Button label="Preview Business App" onPress={s.openMiniAppPreview} />
        ) : null}
      </Card>

      {app&&view.draftConfig?(
        <Card eyebrow="V3.158 • Intelligent App Studio"
          title="Tell BUSY several changes at once"
          body="Describe the result you want. BUSY identifies only supported safe edits, checks the current private app, then shows the entire proposed customer view. If an instruction is unclear, nothing is applied."
          footer="One approval saves the complete batch as ONE private revision. Undo reverses that batch without touching the live app."
          tone="blue">
          <Text style={styles.cardBody}>
            Try: rename products section to {'"Our collection"'}; show products as rows.
            For approved gallery photos, try: describe gallery photo 1 as
            {' "Workshop entrance" caption "Find us here"'}. Images stay unchanged.
          </Text>
          <Button label={showCustomerTaskReview?
              "Hide customer journey ideas":"Help customers find what they need"}
            onPress={()=>setShowCustomerTaskReview(x=>!x)}/>
          {showCustomerTaskReview?(
            <>
              <Text style={styles.sectionLabel}>
                What should customers be able to do first?
              </Text>
              <Text style={styles.cardBody}>
                BUSY checks the actual enabled sections, not just the appearance.
                Choose a customer goal; Busy only suggests moving an already
                enabled section. No bookings or enquiries are created.
              </Text>
              {(customerTaskReport?.tasks||[]).map(item=>(
            <Button key={"customer-task-"+item.id}
              label={(selectedCustomerTask===item.id?"✓ ":"")+item.label}
              disabled={!!s.miniAppsAction}
              onPress={()=>{
                setSelectedCustomerTask(item.id);
                setStudioPreview(null);
                setStudioNotice("");
              }}/>
          ))}
          {customerTaskPlan?.task?.ok?(
            <>
              <MetricRow left="This customer action"
                right={customerTaskPlan.task.status.replaceAll("_"," ")}/>
              {customerTaskPlan.task.sectionPosition!==null?(
                <MetricRow left="Currently in app navigation"
                  right={"Position "+customerTaskPlan.task.sectionPosition}/>
              ):null}
              {(customerTaskPlan.task.blockers||[]).map((note,i)=>(
                <Text key={"task-blocker-"+i} style={styles.cardBody}>
                  {"Needs setup: "+note}
                </Text>
              ))}
              {(customerTaskPlan.task.cautions||[]).map((note,i)=>(
                <Text key={"task-caution-"+i} style={styles.cardBody}>{note}</Text>
              ))}
              {customerTaskPlan?.preview?.ok?(
                <>
                  <Text style={styles.cardBody}>
                    {"BUSY suggests placing this action at position "+
                     customerTaskPlan.comparison.afterPosition+
                     " instead of "+customerTaskPlan.comparison.beforePosition+
                     ". This is a navigation hypothesis, not proven task success."}
                  </Text>
                  <Button label="Preview a clearer customer journey"
                    disabled={!!s.miniAppsAction}
                    onPress={()=>{
                      const fresh=proposeTaskFirstNavigation(
                        view.draftConfig,selectedCustomerTask);
                      setStudioPreview(fresh.preview?.ok?fresh.preview:null);
                      setStudioComparisonSide("proposed");
                      setStudioNotice(fresh.preview?.ok?
                        "Compare the ORIGINAL and PROPOSED real app views below. Nothing is saved until you approve.":
                        fresh.reason||"No safe preview was prepared.");
                    }}/>
                </>
              ):(
                <Text style={styles.cardBody}>{customerTaskPlan?.reason||
                  "BUSY is keeping the existing customer journey."}</Text>
              )}
              <Text style={styles.cardBody}>
                Marketplace and standalone apps use this same private draft.
                Static navigation checks do not prove actual submissions,
                accessibility, appointment confirmations or customer outcomes.
              </Text>
              {customerExperience?.ok?(
                <>
                  <Text style={styles.sectionLabel}>V3.171 • How Busy would improve this</Text>
                  <Text style={styles.cardBody}>
                    These are preparation steps for your selected customer goal.
                    Nothing has been changed, published or sent to customers.
                  </Text>
                  {customerExperience.improvements.length?(
                    customerExperience.improvements.map(item=>(
                      <View key={"cx-finding-"+item.id}>
                        <MetricRow left={item.title}
                          right={item.priority==="important"?"Needs checking":"Suggested"}/>
                        <Text style={styles.cardBody}>{item.ownerAction}</Text>
                      </View>
                    ))
                  ):(
                    <Text style={styles.cardBody}>
                      No additional supported change was identified.
                      Actual customer testing is still required.
                    </Text>
                  )}
                  {customerExperience.navigationPreview?.ok&&
                    !customerTaskPlan?.preview?.ok?(
                    <Button label="Compare Busy's suggested section order"
                      disabled={!!s.miniAppsAction}
                      onPress={()=>{
                        setStudioPreview(customerExperience.navigationPreview);
                        setStudioComparisonSide("proposed");
                        setStudioNotice("This is only a private proposal. Review both versions and approve or discard below.");
                      }}/>
                  ):null}
                </>
              ):null}
              {sharedAppJourney?.ok?(
                <Text style={styles.cardBody}>
                  {"V3.172 • Shared website/app review: "+
                    sharedAppJourney.totalFindings+
                    " owner-review step(s) for this goal. "+
                    "This app review uses only this business's current App Builder draft."}
                </Text>
              ):null}
              {appEvidence?.ok?(
                <Text style={styles.cardBody}>
                  {"Predicted navigation at "+
                    appEvidence.profiles.map(x=>x.logicalWidth).join(", ")+
                    " layout points. Moving a section earlier isn't proof "+
                    "that a real customer completes the task faster."}
                </Text>
              ):null}
              {stagingPlan?.ok&&
                ["book","enquire"].includes(selectedCustomerTask)?(
                <Text style={styles.cardBody}>
                  {"Staging readiness: "+stagingPlan.requiredCount+
                    " separate checks are still unverified for "+
                    selectedCustomerTask+
                    ". No real customer journey was executed here."}
                </Text>
              ):null}
              {serviceClarity?.ok&&serviceClarity.appServicesEnabled&&
                ["services","book"].includes(selectedCustomerTask)?(
                <>
                  <Text style={styles.sectionLabel}>V3.173 • Service clarity</Text>
                  <MetricRow left="Services with clear descriptions"
                    right={serviceClarity.appCompleteDescriptions+" of "+serviceClarity.appServiceCount}/>
                  {(serviceClarity.issues||[]).filter(issue=>issue.surface==="app")
                    .slice(0,4).map((issue,i)=>(
                    <Text key={"service-clarity-"+i} style={styles.cardBody}>
                      {issue.title+
                        (issue.position?" (service "+issue.position+")":"")+
                        ". "+issue.ownerAction}
                    </Text>
                  ))}
                  <Text style={styles.cardBody}>
                    Busy does not invent your services, prices or business claims.
                    Make wording changes in the private service editor.
                  </Text>
                </>
              ):null}
              {comparativeEvidence?.ok?(
                <Text style={styles.cardBody}>
                  {"V3.173 • Evidence review: "+
                    comparativeEvidence.widths.length+
                    " predicted layout widths; recommendation: "+
                    comparativeEvidence.recommendation.replaceAll("_"," ")+
                    ". Not actual customer testing."}
                </Text>
              ):null}
              {stagedDryRun?.ok?(
                <Text style={styles.cardBody}>
                  {"V3.173 • Ready-to-review staging plan: "+
                    stagedDryRun.caseCount+
                    " practice cases prepared; zero executed. "+
                    "A separate owner-approved isolated staging runner is required."}
                </Text>
              ):null}
              {view.draftConfig&&app?.draft_revision>0?(
                <Button label="Prepare a staging handoff (no live tests)"
                  disabled={!!s.miniAppsAction}
                  onPress={()=>{
                    const prepared=compileStagingRunnerHandoff({
                      appConfig:view.draftConfig,
                      businessId:s.cloudWorkspace?.businessId||"",
                      draftRevision:app.draft_revision,
                      environment:"isolated_staging",
                      runLabel:"busy_owner_review_v3175",
                      ownerApproved:true
                    });
                    setStagingHandoff(prepared);
                  }}/>
              ):null}
              {stagingHandoff?.ok?(
                <Text style={styles.cardBody}>
                  {"V3.175 • "+stagingHandoff.routeCount+
                    " staging routes documented. "+
                    stagingHandoff.nextStep+
                    " Network requests: zero; publishing: disabled."}
                </Text>
              ):stagingHandoff?.reason?(
                <Text style={styles.cardBody}>{stagingHandoff.reason}</Text>
              ):null}
              {view.draftConfig&&app?.draft_revision>0&&
                typeof s.checkIsolatedAppStagingConnection==="function"?(
                <Button label="Check isolated staging connection (read only)"
                  disabled={!!s.miniAppsAction}
                  onPress={async()=>{
                    setStagingProbe({busy:true});
                    const result=await s.checkIsolatedAppStagingConnection({
                      appId:app.id,expectedRevision:Number(app.draft_revision)
                    });
                    setStagingProbe(result);
                  }}/>
              ):null}
              {stagingProbe?.ok?(
                <Text style={styles.cardBody}>
                  Staging owner access and private app revision were checked
                  by the isolated server. No bookings, enquiries or messages
                  were sent. Full end-to-end testing is still required.
                </Text>
              ):stagingProbe?.reason?(
                <Text style={styles.cardBody}>{stagingProbe.reason}</Text>
              ):null}
              {view.draftConfig&&app?.draft_revision>0&&
               ["book","enquire"].includes(selectedCustomerTask)&&
               typeof s.runIsolatedSyntheticAppJourney==="function"?(
                <Button label="Run isolated synthetic database check"
                  disabled={stagingSyntheticBusy||!!s.miniAppsAction||
                    !syntheticStagingGate.ok}
                  onPress={()=>{
                    const current=assessSyntheticStagingAction({
                      businessId:s.cloudWorkspace?.businessId||"",
                      app,probe:stagingProbe,install:stagingInstallAudit
                    });
                    if(!current.ok){
                      setStagingSyntheticResult({ok:false,reason:current.why});
                      return;
                    }
                    Alert.alert("Run a synthetic staging check?",
                      "Only a specially configured isolated staging project can run this. It writes a test-only record, not a customer request. No messages are sent.",[
                        {text:"Cancel",style:"cancel"},
                        {text:"Run test",onPress:async()=>{
                          setStagingSyntheticBusy(true);
                          setStagingSyntheticResult(null);
                          try{
                            const result=await s.runIsolatedSyntheticAppJourney({
                              appId:app.id,expectedRevision:Number(app.draft_revision),
                              journeyKind:selectedCustomerTask==="enquire"?
                                "enquiry":"booking_request",
                              channel:"busy_marketplace"
                            });
                            setStagingSyntheticResult(result);
                          }catch(error){
                            setStagingSyntheticResult({ok:false,
                              reason:String(error?.message||
                                "Isolated staging check unavailable.").slice(0,190)});
                          }finally{setStagingSyntheticBusy(false);}
                        }}
                      ]);
                  }}/>
              ):null}
              {!syntheticStagingGate.ok&&
                typeof s.runIsolatedSyntheticAppJourney==="function"?(
                  <Text style={styles.cardBody}>
                    {"Before a synthetic check: "+syntheticStagingGate.why}
                  </Text>
                ):null}
              {syntheticEvidence?.ok?(
                <Text style={styles.cardBody}>
                  {"V3.177 • "+
                    (syntheticEvidence.syntheticStagingEvidencePresented?
                      "Isolated test-only database write/read verified. ":
                      "Staging evidence doesn't match this current app. ")+
                    "This does NOT verify customer bookings, enquiry delivery, "+
                    "messages or sales."}
                </Text>
              ):stagingSyntheticResult?.reason?(
                <Text style={styles.cardBody}>{stagingSyntheticResult.reason}</Text>
              ):null}
              {launchReadiness?.ok?(
                <>
                  <Text style={styles.sectionLabel}>
                    V3.178 • Launch-readiness checks
                  </Text>
                  <Text style={styles.cardBody}>
                    {"Release status: NOT READY. "+
                      launchReadiness.unresolvedMandatoryGates+
                      " mandatory checks remain unverified. "+
                      launchReadiness.nextPriority}
                  </Text>
                  <Button label="Check staging installation (read only)"
                    disabled={stagingInstallBusy||!!s.miniAppsAction||
                      typeof s.checkIsolatedAppInstallAudit!=="function"}
                    onPress={async()=>{
                      setStagingInstallBusy(true);
                      setStagingInstallAudit(null);
                      try{
                        const result=await s.checkIsolatedAppInstallAudit({
                          appId:app.id,expectedRevision:Number(app.draft_revision)
                        });
                        setStagingInstallAudit(result);
                      }catch(error){
                        setStagingInstallAudit({ok:false,reason:String(error?.message||
                          "Staging is not installed.").slice(0,200)});
                      }finally{setStagingInstallBusy(false);}
                    }}/>
                  {stagingInstallAudit?.ok?(
                    <Text style={styles.cardBody}>
                      {"Staging tables reachable: "+
                        launchReadiness.visibleStagingTables+" of "+
                        launchReadiness.totalStagingTables+
                        ". This does not verify RLS, bookings or delivery."}
                    </Text>
                  ):stagingInstallAudit?.reason?(
                    <Text style={styles.cardBody}>
                      {stagingInstallAudit.reason}
                    </Text>
                  ):null}
                </>
              ):null}
              {view.followUpIntelligence?.ok?(
                <Card eyebrow="Busy keeps an eye on enquiries"
                  title={view.followUpIntelligence.counts.needsReply?
                    view.followUpIntelligence.counts.needsReply+
                    " customer request(s) to review":
                    "Customer replies are under review"}
                  body="Busy compares signed-in customer requests with saved conversation activity. Review the suggestion before sending anything."
                  tone={view.followUpIntelligence.counts.needsReply?"amber":"blue"}>
                  <MetricRow left="May need a reply"
                    right={String(view.followUpIntelligence.counts.needsReply)}/>
                  <MetricRow left="Waiting after business reply"
                    right={String(view.followUpIntelligence.counts.waiting)}/>
                  <MetricRow left="Needs manual checking"
                    right={String(view.followUpIntelligence.counts.manualReview+
                      view.followUpIntelligence.counts.unknown)}/>
                  {view.followUpIntelligence.items.filter(item=>
                    item.category==="needsReply").slice(0,3).map(item=>(
                    <View key={"followup-"+item.requestId}>
                      <Text style={styles.sectionLabel}>
                        {item.requestType==="booking_request"?
                          "Booking request needs review":"Enquiry needs review"}
                      </Text>
                      <Text style={styles.cardBody}>{item.why}</Text>
                      <Button label="Open request and prepare reply"
                        onPress={()=>s.openOwnerMiniAppRequest(item.requestId)}
                        disabled={!!s.miniAppsAction}/>
                    </View>
                  ))}
                  {view.followUpIntelligence.messageHistoryIncomplete||
                     view.followUpIntelligence.limitedToRecentRequests?(
                    <Text style={styles.cardBody}>
                      Only recent records were checked. Open individual
                      conversations before concluding older requests are answered.
                    </Text>
                  ):null}
                  <Text style={styles.cardBody}>
                    Nothing is sent automatically. Guest enquiries require
                    review of their separate contact method.
                  </Text>
                </Card>
              ):null}
              {view.journeyEvidence?.ok?(
                <>
                  <Text style={styles.sectionLabel}>
                    V3.179 • Recorded customer requests
                  </Text>
                  <Text style={styles.cardBody}>
                    {"Stored booking requests: "+view.journeyEvidence.bookingRequests+
                      " • enquiries: "+view.journeyEvidence.enquiries+
                      " • still pending: "+view.journeyEvidence.pending+
                      " • not linked to a customer record: "+
                      view.journeyEvidence.unlinkedRequests+"."}
                  </Text>
                  {view.journeyEvidence.inconsistentConfirmedStates>0?(
                    <Text style={styles.cardBody}>
                      {"Needs attention: "+
                        view.journeyEvidence.inconsistentConfirmedStates+
                        " booking states disagree with their owner links."}
                    </Text>
                  ):null}
                  <Text style={styles.cardBody}>
                    Recorded states are not proof that a reply reached the customer
                    or that an appointment exists in a verified live diary.
                  </Text>
                </>
              ):null}
              {view.evidenceCompleteness?.ok?(
                <>
                  <Text style={styles.sectionLabel}>
                    Busy's next check
                  </Text>
                  <Text style={styles.cardBody}>
                    {view.ownerNextAction?.ok&&view.ownerNextAction.suggestions.length?
                      view.ownerNextAction.suggestions[0].title:
                      "No problems spotted in the recent sample."}
                  </Text>
                  <Text style={styles.cardBody}>
                    {view.ownerNextAction?.ok&&view.ownerNextAction.suggestions.length?
                      view.ownerNextAction.suggestions[0].next:
                      "An incomplete sample cannot prove that every task is finished."}
                  </Text>
                  <Text style={styles.cardBody}>
                    Nothing will be changed or sent without checking the original record.
                  </Text>
                </>
              ):null}
              {view.outcomeProof?.ok?(
                <>
                  <Text style={styles.sectionLabel}>
                    V3.187 • What actually happened
                  </Text>
                  <Text style={styles.cardBody}>
                    {"Requests recorded: "+view.outcomeProof.counts.requests+
                     " • owner replies saved: "+view.outcomeProof.counts.savedOwnerReplies+
                     " • confirmed inside BUSY Work: "+
                     view.outcomeProof.counts.acceptedBookingsWithWork+
                     " • Work cancellations: "+view.outcomeProof.counts.cancelledWorkBookings+"."}
                  </Text>
                  {view.outcomeProof.priorities.slice(0,2).map(item=>(
                    <Text key={"proof-"+item.id} style={styles.cardBody}>
                      {item.next}
                    </Text>
                  ))}
                  {view.outcomeProof.coveragePartial?(
                    <Text style={styles.cardBody}>
                      These figures cover a limited set of recent records, not every customer.
                    </Text>
                  ):null}
                  <Text style={styles.cardBody}>
                    BUSY cannot yet verify that a customer saw a notification,
                    attended an appointment, paid, or was satisfied.
                  </Text>
                </>
              ):null}
              {view.measuredOwnerActions?.ok?(
                <>
                  <Text style={styles.sectionLabel}>
                    V3.186 • What Busy thinks needs attention
                  </Text>
                  <Text style={styles.cardBody}>
                    {view.measuredOwnerActions.highestPriority.recommendation}
                  </Text>
                  <Text style={styles.cardBody}>
                    {view.measuredOwnerActions.highestPriority.why}
                  </Text>
                  {view.measuredOwnerActions.coveragePartial?(
                    <Text style={styles.cardBody}>
                      Evidence covers limited and potentially different time windows.
                      The absence of a warning is not proof every request succeeded.
                    </Text>
                  ):null}
                  <Text style={styles.cardBody}>
                    A suggestion only. Busy will not contact customers, change
                    bookings or report revenue without verified evidence.
                  </Text>
                </>
              ):null}
              {view.pushGatewayEvidence?.ok?(
                <>
                  <Text style={styles.sectionLabel}>
                    V3.186 • Notification gateway evidence
                  </Text>
                  <Text style={styles.cardBody}>
                    {"Expo accepted submissions for "+
                      view.pushGatewayEvidence.counts.gatewayAcceptedMessages+
                      " saved message(s) • rejected: "+
                      view.pushGatewayEvidence.counts.gatewayRejectedMessages+
                      " • incomplete or ambiguous tickets: "+
                      (view.pushGatewayEvidence.counts.mixedOrUnknownGatewayTickets+
                       view.pushGatewayEvidence.counts.submittedNoSavedGatewayTicket)+"."}
                  </Text>
                  <Text style={styles.cardBody}>
                    {view.pushGatewayEvidence.nextOwnerReview}
                  </Text>
                  {view.pushGatewayEvidence.coveragePartial?(
                    <Text style={styles.cardBody}>
                      This is a partial sample; don't infer other messages succeeded.
                    </Text>
                  ):null}
                  <Text style={styles.cardBody}>
                    Gateway acceptance is not confirmation of phone delivery,
                    notification display or a customer reading the reply.
                  </Text>
                </>
              ):null}
              {view.deliveryEvidence?.ok?(
                <>
                  <Text style={styles.sectionLabel}>
                    V3.185 • Customer notification checks
                  </Text>
                  <Text style={styles.cardBody}>
                    {"Messages awaiting submission check: "+
                      view.deliveryEvidence.counts.pending+
                      " • no push submission evidence: "+
                      view.deliveryEvidence.counts.submissionWithoutProviderReceipt+
                      " • submitted, customer delivery unverified: "+
                      view.deliveryEvidence.counts.submittedButDeliveryUnverified+"."}
                  </Text>
                  <Text style={styles.cardBody}>
                    {view.deliveryEvidence.nextOwnerReview}
                  </Text>
                  {view.deliveryEvidence.coveragePartial?(
                    <Text style={styles.cardBody}>
                      This is a limited set of recent notifications.
                    </Text>
                  ):null}
                  <Text style={styles.cardBody}>
                    A saved BUSY reply is available in the conversation even
                    if a push notification never reaches the customer's phone.
                  </Text>
                </>
              ):null}
              {view.journeyCheckpoints?.ok?(
                <>
                  <Text style={styles.sectionLabel}>
                    V3.184 • Customer journey checkpoints
                  </Text>
                  <Text style={styles.cardBody}>
                    {"Requests needing an owner reply: "+
                      view.journeyCheckpoints.counts.requestsAwaitingOwnerReply+
                      " • requests with saved owner replies: "+
                      view.journeyCheckpoints.counts.ownerRepliesSaved+
                      " • confirmed with a saved Work record: "+
                      view.journeyCheckpoints.counts.ownerConfirmedAndWorkSaved+"."}
                  </Text>
                  <Text style={styles.cardBody}>
                    {view.journeyCheckpoints.nextOwnerReview}
                  </Text>
                  {view.journeyCheckpoints.coveragePartial?(
                    <Text style={styles.cardBody}>
                      Only recent records were checked. Earlier messages and bookings
                      need a separate review before concluding nothing is missing.
                    </Text>
                  ):null}
                  <Text style={styles.cardBody}>
                    Saved replies are not proof that notifications reached customers,
                    and a Work booking is not proof that a job was completed.
                  </Text>
                </>
              ):null}
              {view.durableWorkEvidence?.ok?(
                <>
                  <Text style={styles.sectionLabel}>
                    V3.181 • Real saved Work-booking evidence
                  </Text>
                  <Text style={styles.cardBody}>
                    {"Confirmed in BUSY Work: "+
                      view.durableWorkEvidence.counts.savedConfirmedWork+
                      " • cancellations saved: "+
                      view.durableWorkEvidence.counts.savedCancelledWork+
                      " • accepted requests missing saved Work: "+
                      view.durableWorkEvidence.counts.acceptedMissingWork+"."}
                  </Text>
                  <Text style={styles.cardBody}>
                    {view.durableWorkEvidence.nextOwnerReview}
                  </Text>
                  <Text style={styles.cardBody}>
                    These are server-saved records, not proof of an externally
                    delivered calendar event, completed job or customer payment.
                  </Text>
                </>
              ):null}
              {view.observedOutcomes?.ok?(
                <>
                  <Text style={styles.sectionLabel}>
                    V3.180 • What recorded requests tell Busy
                  </Text>
                  <Text style={styles.cardBody}>
                    {"Requests waiting: "+view.observedOutcomes.metrics.awaitingOwner+
                     " • over 48 hours: "+
                     view.observedOutcomes.metrics.awaitingOver48Hours+
                     " • owner-marked bookings: "+
                     view.observedOutcomes.metrics.ownerMarkedBookings+"."}
                  </Text>
                  <Text style={styles.cardBody}>
                    {view.observedOutcomes.nextOwnerReview.why}
                  </Text>
                  <Text style={styles.cardBody}>
                    Busy's figures come from stored requests, not verified
                    customer conversion, external diary delivery or revenue.
                  </Text>
                </>
              ):null}
              {coordinatedBuilders?.ok?(
                <>
                  <Text style={styles.sectionLabel}>
                    V3.180 • Keep website and app facts coordinated
                  </Text>
                  <Text style={styles.cardBody}>
                    {"Shared services: "+
                      coordinatedBuilders.sharedServiceOverlapCount+
                      " • differences to review: "+
                      coordinatedBuilders.unresolvedFactChecks+"."}
                  </Text>
                  {coordinatedBuilders.actions.slice(0,3).map(item=>(
                    <Text key={"builder-review-"+item.key} style={styles.cardBody}>
                      {item.title+". "+item.next}
                    </Text>
                  ))}
                  <Text style={styles.cardBody}>
                    Local review only. Busy won't copy descriptions, change
                    your design or publish either surface without approval.
                  </Text>
                </>
              ):null}
              {connectedJourney?.ok?(
                <>
                  <Text style={styles.sectionLabel}>
                    V3.187 • One joined-up customer journey
                  </Text>
                  {connectedJourney.actions.slice(0,3).map(item=>(
                    <Text key={"customer-route-"+item.id} style={styles.cardBody}>
                      {item.title+". "+item.next}
                    </Text>
                  ))}
                  <Text style={styles.cardBody}>
                    BUSY only prepares checks here. Websites and apps can
                    look different, and you'll approve any actual changes.
                  </Text>
                </>
              ):null}
              {businessBrainQueue?.ok?(
                <>
                  <Text style={styles.sectionLabel}>
                    V3.176 • Busy's private work suggestions
                  </Text>
                  <Text style={styles.cardBody}>
                    Busy can remember your explicit decisions for this app
                    revision, when private storage is available. Remembering
                    feedback doesn't change or publish your app.
                  </Text>
                  {brainOwnerNotice?(
                    <Text style={styles.cardBody}>{brainOwnerNotice}</Text>
                  ):null}
                  {businessBrainQueue.items.map(item=>(
                    <View key={"brain-work-"+item.id}>
                      <MetricRow left={item.title} right="Not executed"/>
                      <Text style={styles.cardBody}>{item.reason}</Text>
                      <Text style={styles.cardBody}>{item.nextStep}</Text>
                      {brainOwnerHistory?.appId===app?.id&&
                        !brainOwnerBusy&&
                        typeof s.recordAppBrainOwnerDecision==="function"?(
                        <>
                          <Button label="Not useful — remember my choice"
                            disabled={!!s.miniAppsAction}
                            onPress={async()=>{
                              setBrainOwnerBusy(true);
                              const expectedRevision=Number(app?.draft_revision)||0;
                              const appId=app?.id;
                              try{
                                const answer=await s.recordAppBrainOwnerDecision({
                                  appId,expectedRevision,
                                  goal:selectedCustomerTask,actionId:item.id,
                                  decision:"rejected"
                                });
                                if(!answer?.ok)throw Error(answer?.reason||"Saving failed");
                                const latest=await s.getAppBrainDecisions({
                                  appId,expectedRevision
                                });
                                if(!latest?.ok)throw Error(latest?.reason||
                                  "Feedback saved; refresh this draft to reload it.");
                                setBrainOwnerHistory(latest);
                                setBrainOwnerNotice("Preference saved to your private Business Brain history.");
                              }catch(error){
                                setBrainOwnerNotice(String(error?.message||
                                  "Your decision could not be saved.").slice(0,200));
                              }finally{setBrainOwnerBusy(false);}
                            }}/>
                        </>
                      ):null}
                    </View>
                  ))}
                  {brainOwnerHistory?.appId===app?.id&&
                    typeof s.clearAppBrainOwnerDecisions==="function"?(
                    <Button label="Clear my saved Business Brain choices"
                      disabled={brainOwnerBusy||!!s.miniAppsAction}
                      onPress={()=>{
                        Alert.alert("Clear saved decisions?",
                          "This removes your private owner choices for this app. It won't change the published app.",[
                          {text:"Cancel",style:"cancel"},
                          {text:"Clear",style:"destructive",onPress:async()=>{
                            setBrainOwnerBusy(true);
                            try{
                              const response=await s.clearAppBrainOwnerDecisions({
                                appId:app.id,expectedRevision:Number(app.draft_revision)
                              });
                              if(!response?.ok)throw Error(response?.reason||
                                "Clearing private decisions failed.");
                              setBrainOwnerHistory(null);
                              setBrainOwnerNotice("Private decisions cleared. Reopen these suggestions to refresh.");
                            }catch(error){
                              setBrainOwnerNotice(String(error?.message||
                                "Couldn't clear private decisions.").slice(0,200));
                            }finally{setBrainOwnerBusy(false);}
                          }}
                        ]);
                      }}/>
                  ):null}
                </>
              ):ownerImprovementPlan?.ok?(
                <Text style={styles.cardBody}>
                  Busy has prepared review ideas. A current private app
                  revision and connected business are needed to remember choices.
                </Text>
              ):null}
              {offlinePreflight?.ok?(
                <Text style={styles.cardBody}>
                  {"Offline staging preflight: "+
                    offlinePreflight.passedFixtureCases+" of "+
                    offlinePreflight.executedFixtureCases+
                    " fictional state checks passed; "+
                    offlinePreflight.blockedFixtureCases+
                    " blocked. "+
                    "Live submissions: zero. A trusted staging runner is still required."}
                </Text>
              ):null}
              {nativeDeviceChecklist?.ok?(
                <Text style={styles.cardBody}>
                  {"Device review prepared: "+
                    nativeDeviceChecklist.checks.length+
                    " checks for phone, Android, tablet, large text and "+
                    "screen reader. No device capture or accessibility "+
                    "certification has been performed."}
                </Text>
              ):null}
              <Button label={showJourneyPractice?
                  "Hide practice journey checks":"Check sample booking & enquiry journeys"}
                onPress={()=>setShowJourneyPractice(x=>!x)}/>
              {showJourneyPractice&&practiceReport?.ok?(
                <>
                  <Text style={styles.sectionLabel}>
                    V3.170 • Practice journeys (fictional, offline)
                  </Text>
                  <Text style={styles.cardBody}>
                    BUSY runs imaginary booking and enquiry states through the
                    existing request rules. This does not submit a request,
                    message a customer or confirm a real booking.
                  </Text>
                  <MetricRow left="Practice cases checked"
                    right={String(practiceReport.ranCount)+
                      " of "+String(practiceReport.scenarioCount)}/>
                  <MetricRow left="Passed offline safeguards"
                    right={String(practiceReport.passedCount)}/>
                  <MetricRow left="Offline failures"
                    right={String(practiceReport.failedCount)}/>
                  {practiceReport.unavailableCount?(
                    <Text style={styles.cardBody}>
                      {practiceReport.unavailableCount+
                        " case(s) could not run because a tracked feature is not enabled."}
                    </Text>
                  ):null}
                  {(practiceReport.results||[]).map(item=>(
                    <MetricRow key={"practice-"+item.id}
                      left={item.label}
                      right={!item.ran?"Needs feature setup":
                        item.passed?"Practice passed":"Practice failed"}/>
                  ))}
                  <Text style={styles.sectionLabel}>Still required before release</Text>
                  {(practiceReport.releaseChecklist||[]).map(item=>(
                    <Text key={"release-"+item.id} style={styles.cardBody}>
                      {"Not verified: "+item.label}
                    </Text>
                  ))}
                  <Text style={styles.cardBody}>
                    These are offline state-machine exercises, not end-to-end
                    customer tests. The business owner retains final approval
                    before any publishing or external action.
                  </Text>
                </>
              ):null}
            </>
          ):null}
            </>
          ):null}
          <AppOwnerLockControls key={[s.ownerSession?.userId,s.cloudWorkspace?.businessId,app.id,app.draft_revision,ownerEditorEpoch].join(":")}
            config={view.draftConfig} onPreview={setStudioPreview} onNotice={setStudioNotice}
            busy={!!s.miniAppsAction||studio.pending}/>
          <Text style={styles.sectionLabel}>Or tell Busy other changes</Text>
          <Field label="App instructions" value={studioWords}
            onChangeText={value=>{setStudioWords(value);setStudioPreview(null);}}
            placeholder='Rename service "Survey" to "Site survey"; move service "Repair" before service "Site survey"'/>
          <Button label="Preview these app changes together" disabled={!!s.miniAppsAction||!studioWords.trim()}
            onPress={()=>{
              const p=planAppVoiceInstructions(view.draftConfig,studioWords);
              setStudioPreview(p.ok?p:null);
              setStudioNotice(p.ok?
                "Your complete private preview is ready. Nothing has been saved.":
                p.reason||"BUSY needs more detail.");
            }}/>
          <Button label={studioVoiceOpen?"Close app microphone":"🎙 Say my whole-app changes"}
            onPress={()=>setStudioVoiceOpen(x=>!x)}/>
          {studioVoiceOpen&&s.cloudWorkspace?.businessId?(
            <WebsiteSelectedVoice key={app.id+":"+app.draft_revision+":whole_app"}
              editorKind="app" contextLabel="whole Business App draft"
              selection={{appId:app.id,revision:app.draft_revision,
                businessId:s.cloudWorkspace.businessId,selectedPart:"whole_app"}}
              onTranscribe={(uri,scope)=>s.transcribeSelectedAppAudio?.(uri,scope)}
              onTranscript={words=>{
                setStudioWords(words);setStudioPreview(null);
                setStudioNotice("Check what BUSY heard, then tap Preview. Nothing changed automatically.");
              }}/>
          ):null}
          <Text style={styles.cardBody}>
            Voice provides transcription only, within its existing daily allowance. BUSY asks before changing the private app.
          </Text>
          <AppPublicCollectionEditor key={['public-info',s.ownerSession?.userId,s.cloudWorkspace?.businessId,app.id,app.draft_revision,ownerEditorEpoch].join(':')}
            config={view.draftConfig} suggestions={view.enquiryContentGaps?.suggestions||[]} onPreview={setStudioPreview} onNotice={setStudioNotice} busy={!!s.miniAppsAction||studio.pending}/>
          <AppContactEditor key={[s.ownerSession?.userId,s.cloudWorkspace?.businessId,app.id,app.draft_revision,ownerEditorEpoch,confirmedOwnerParts.contact||0].join(':')}
            businessId={s.cloudWorkspace?.businessId||''} app={app} busy={!!s.miniAppsAction||studio.pending||studio.uncertain}
            onDraftChange={value=>markOwnerDirty('contact',value)}
            onPreview={proposal=>setStudioPreview(proposal,'contact')} onNotice={setStudioNotice}/>
          <View style={styles.inspectorGroup}>
          <Text accessibilityRole="header" style={styles.inspectorHeading}>Edit public wording</Text>
          <Text style={styles.workspaceMeta}>Choose one part, write your replacement, then preview it before approval.</Text>
          <View style={styles.choiceGrid}>
          {[
            ["tagline","Tagline"],["about","About section"],["description","Description"]
          ].map(([key,label])=>(
            <View key={key} style={styles.choiceCell}><Button compact selected={studioCopyField===key} label={(studioCopyField===key?"✓ ":"")+"Edit "+label}
              onPress={()=>{const change=()=>{setStudioCopyField(key);setStudioPreview(null);};if(ownerDirtyParts.current.copy&&s.requestOwnerEditTransition)s.requestOwnerEditTransition(change);else change();}}/></View>
          ))}
          </View>
          <Field label={"Replacement "+studioCopyField+" (owner-approved copy)"}
            value={copyScopeCurrent?studioCopy:''} editable={studio.canEdit()} onChangeText={value=>{if(liveControlContext.current!==controlContext||!studio.canEdit())return;legacyCopyLive.current.value=value;setStudioCopy(value);markOwnerDirty('copy',!!value);setStudioPreview(null);}}
            placeholder="Write the exact words you want customers to see"/>
          {studioCopy?<Button label="Cancel replacement wording" onPress={()=>{if(liveControlContext.current!==controlContext||legacyCopyLive.current.value!==studioCopy)return;legacyCopyLive.current.value='';setStudioCopy('');markOwnerDirty('copy',false);setStudioPreview(null);}}/>:null}
          <Button label="Preview exact wording" disabled={!studioCopy.trim()||!!s.miniAppsAction}
            onPress={()=>{
              if(liveControlContext.current!==controlContext||!copyScopeCurrent||legacyCopyLive.current.value!==studioCopy||legacyCopyLive.current.field!==studioCopyField||legacyCopyLive.current.source!==view.draftConfig)return;
              const p=proposeCoordinatedAppChanges(view.draftConfig,
                [{kind:"text",field:studioCopyField,value:studioCopy}]);
              setStudioPreview(p.ok?p:null,'copy');setStudioNotice(p.ok?
                "Owner-written wording is ready to preview, not yet saved.":p.reason);
            }}/>
          </View>
          {view.draftConfig.modules?.some(m=>m.key==='services'&&m.enabled===true)?(
            <AppServiceEditor key={[s.ownerSession?.userId,s.cloudWorkspace?.businessId,app.id,ownerEditorEpoch,confirmedOwnerParts.services||0].join(':')}
              onDraftChange={value=>markOwnerDirty('services',value)} requestTransition={s.requestOwnerEditTransition}
              config={view.draftConfig} revision={app.draft_revision} busy={!!s.miniAppsAction||studio.pending||studio.uncertain}
              onPreview={proposal=>setStudioPreview(proposal,'services')} onNotice={setStudioNotice}/>
          ):null}
          {view.draftConfig.modules?.some(x=>x.key==='gallery'&&x.enabled===true)?(
            <AppGalleryDescriptionEditor key={[s.ownerSession?.userId,s.cloudWorkspace?.businessId,app.id,ownerEditorEpoch,confirmedOwnerParts.gallery||0].join(':')}
              config={view.draftConfig} revision={app.draft_revision}
              busy={!!s.miniAppsAction||studio.pending||studio.uncertain}
              onDraftChange={value=>markOwnerDirty('gallery',value)} requestTransition={s.requestOwnerEditTransition}
              onPreview={proposal=>setStudioPreview(proposal,'gallery')} onNotice={setStudioNotice}/>
          ):null}
          {Array.isArray(view.draftConfig.publicProfile?.assets?.gallery)&&
            view.draftConfig.publicProfile.assets.gallery.length>=2?(
            <>
              <Text style={styles.sectionLabel}>Move an existing gallery photo</Text>
              <Field label="Photo position to move (1 is first)" value={photoFrom}
                onChangeText={setPhotoFrom}/>
              <Field label="Move it to position" value={photoTo} onChangeText={setPhotoTo}/>
              <Button label="Preview photo order" disabled={!!s.miniAppsAction}
                onPress={()=>{
                  const p=proposeCoordinatedAppChanges(view.draftConfig,[{
                    kind:"photo",from:Number(photoFrom)-1,to:Number(photoTo)-1}]);
                  setStudioPreview(p.ok?p:null);setStudioNotice(p.ok?
                    "Gallery order preview ready; only existing approved imagery is reused.":p.reason);
                }}/>
            </>
          ):null}
          {!studio.recoveryReady?<Text style={styles.cardBody}>Checking your encrypted private Studio checkpoint…</Text>:null}
          {studio.recoveryError?<Text style={styles.cardBody}>{studio.recoveryError}</Text>:null}
          {studio.interrupted?<Button label="Refresh current private app" disabled={!!s.miniAppsAction||studio.pending}
            onPress={studio.reconcile}/>:null}
          {studioNotice?<Text style={styles.cardBody}>{studioNotice}</Text>:null}
          {studioPreview?.ok&&studioIsCurrent?(
            <>
              <Text style={styles.sectionLabel}>Proposed changes — not saved</Text>
              {studioPreview.changes.map((change,index)=>(
                <View key={"change-"+index}>
                  <MetricRow left={"Change "+(index+1)} right={change}/>
                  <Button label={"Leave out change "+(index+1)}
                    disabled={studio.pending||studio.uncertain||!!s.miniAppsAction}
                    onPress={()=>studio.removeChange(index)}/>
                </View>
              ))}
              {studioPreview.preserved?.length?(
                <Text style={styles.cardBody}>
                  {"Kept unchanged: "+studioPreview.preserved.join("; ")}
                </Text>
              ):null}
              <AppStudioComparison key={studioPreview.source.configStamp+":"+JSON.stringify(studioPreview.operations)}
                original={view.draftConfig} proposed={studioPreview.nextConfig}
                onQualityRepair={repair=>{
                  if(liveControlContext.current!==controlContext||!studioIsCurrent||studio.pending||studio.uncertain)return;
                  const next=amendAppQualityProposal(view.draftConfig,studioPreview,repair);
                  if(next.ok)setStudioPreview(next);else setStudioNotice(next.reason);
                }}
                renderSurface={config=><MiniAppSurface config={config} businessContent={s.miniAppsView?.app?.businessContent||null}/>}/>
              <Button primary label={"Approve all "+studioPreview.changes.length+" private change(s)"}
                disabled={!!s.miniAppsAction||!studio.canApprove}
                onPress={approveOwnerDraft}/>
              <Button label="Discard the whole proposed batch" disabled={studio.pending||studio.uncertain}
                onPress={studio.discard}/>
            </>
          ):null}
          {studio.undo?(
            <Button label="Undo my last approved batch"
              disabled={!!s.miniAppsAction||!studio.canUndo}
              onPress={()=>{if(Object.values(ownerDirtyParts.current).some(Boolean)){setStudioNotice('Keep editing or cancel your unsaved wording before Undo.');return;}if(liveControlContext.current===controlContext&&approvalEpoch===ownerDraftEpoch.current)return studio.undoLast();}}/>
          ):null}
          <Text style={styles.cardBody}>
            BUSY cannot treat unrecognised instructions as completed edits. Payments,
            confirmed bookings, app-store submissions and live publishing remain separate approvals.
          </Text>
        </Card>
      ):null}

      {app&&view.draftConfig?(
        <Card eyebrow="Customer-experience inspection"
          title="What still needs checking?"
          body="BUSY inspects the shared app configuration here. These are static checks, NOT evidence of a real rendered screenshot, successful booking submission or app-store acceptance."
          tone="blue">
          <MetricRow left="Supported shared runtime"
            right={quality.ok?"Verified by schema":"Needs review"}/>
          {quality.checks.filter(x=>!x.passed).map(item=>(
            <MetricRow key={item.id} left={item.id.replaceAll("_"," ")}
              right={item.detail}/>
          ))}
          <Text style={styles.sectionLabel}>V3.163 • Designed for every screen</Text>
          <Text style={styles.cardBody}>
            BUSY adapts navigation, photographs and service layouts to available
            screen width. You keep control of any permanent changes.
          </Text>
          <Button label={showResponsiveDetails?
              "Hide Busy’s design reasoning":"Why does Busy choose different layouts?"}
            onPress={()=>setShowResponsiveDetails(x=>!x)}/>
          {showResponsiveDetails?(
            <>
              <Text style={styles.sectionLabel}>Cross-screen quality checks</Text>
          {responsiveQuality.ok?(
            <>
              <MetricRow left="Example screen widths checked"
                right={String(responsiveQuality.summary.screenProfiles)}/>
              <MetricRow left="Runtime layout adaptations"
                right={String(responsiveQuality.summary.responsiveAdaptations)}/>
              <MetricRow left="Checks still needing a real device"
                right={String(responsiveQuality.summary.needsDeviceReview)}/>
              <MetricRow left="Important public-config concerns"
                right={String(responsiveQuality.summary.supportedConfigurationConcerns)}/>
              {responsiveQuality.assessments.map(screen=>(
                <View key={"quality-screen-"+screen.id}
                  style={{marginBottom:10}}>
                  <Text style={styles.sectionLabel}>{screen.label}</Text>
                  {screen.checks.filter(x=>x.result==="needs_device_review")
                    .slice(0,3).map(item=>(
                      <Text key={item.id} style={styles.cardBody}>
                        {"Still needs checking: "+item.detail}
                      </Text>
                    ))}
                </View>
              ))}
              <Text style={styles.cardBody}>
                BUSY has assessed known layout rules, not measured screenshots,
                tested booking forms or certified accessibility. Run the listed
                real-device checks before publishing.
              </Text>
            </>
          ):null}
          {appGoalDesign?.ok?(
            <>
              <Text style={styles.sectionLabel}>V3.240 • BUSY’s design decision</Text>
              <Text style={styles.cardBody}>{appGoalDesign.recommendation}</Text>
              <Text style={styles.cardBody}>{"Customer goal: "+selectedCustomerTask+
                ". Current private capability: "+appGoalDesign.task.status.replaceAll("_"," ")+
                ". This does not confirm a real booking or enquiry."}</Text>
              <Text style={styles.cardBody}>{appGoalDesign.brand.note}</Text>
              {appGoalDesign.businessContext.considered?<Text style={styles.cardBody}>{appGoalDesign.businessContext.note}</Text>:null}
              {appGoalDesign.contentReadiness.blockers.map((reason,index)=>(
                <Text key={"goal-content-"+index} style={styles.cardBody}>{reason}</Text>))}
              <AppGoalContentAssistant key={[s.ownerSession?.userId,s.cloudWorkspace?.businessId,app.id,app.draft_revision,selectedCustomerTask].join(":")}
                businessId={s.cloudWorkspace?.businessId||""} ownerId={s.ownerSession?.userId||""} app={app} goal={selectedCustomerTask}
                busy={!!s.miniAppsAction||studio.pending} onPreview={setStudioPreview} onNotice={setStudioNotice}
                onSavedFacts={()=>setShowFactRefresh(true)}/>
              {appGoalDesign.visualTradeoffs.map(choice=>(
                <Text key={"goal-relevance-"+choice.field} style={styles.cardBody}>
                  {choice.goalRelevance+" "+choice.tradeoff}
                </Text>))}
              <Button label={goalMemory.busy?"Loading saved choices…":"Use my saved design choices"}
                disabled={goalMemory.busy||!!s.miniAppsAction} onPress={goalMemory.refresh}/>
              {goalMemory.notice?<Text style={styles.cardBody}>{goalMemory.notice}</Text>:null}
              {appGoalDesign.ownerMemory.used?<Text style={styles.cardBody}>{
                appGoalDesign.ownerMemory.suppressedCount+" suggested choice(s) set aside to respect your saved preferences."}</Text>:null}

              {appGoalDesign.operations.length&&!appGoalDesign.task.needsSetup?(
                <Button label="Preview BUSY’s recommended private design"
                  disabled={!!s.miniAppsAction}
                  onPress={()=>{
                    const proposal=proposeCoordinatedAppChanges(view.draftConfig,
                      appGoalDesign.operations);
                    setStudioPreview(proposal.ok?proposal:null);
                    setStudioNotice(proposal.ok?
                      "Recommended design prepared in the App Studio above. Compare the original, then approve or discard.":proposal.reason);
                  }}/>
              ):null}

              {appGoalDesign.potentialNewStaticAdvisories?(
                <Text style={styles.cardBody}>
                  A possible new width-specific advisory needs inspection before keeping any design.
                </Text>
              ):null}
              <Text style={styles.cardBody}>
                These are predictions for three example layout widths, not native screenshots or customer task tests. Use the existing private design-preview controls below to inspect the alternative and approve it yourself.
              </Text>
            </>
          ):null}
          <Text style={styles.sectionLabel}>V3.163 • Design for every screen size</Text>
          <Text style={styles.cardBody}>
            BUSY compares three example content widths and predicts how your
            customer layout will adapt. These are engineering rules, not
            screenshots or proof of appearance on those devices.
          </Text>
          {responsiveGuidance.ok?(
            <>
              {responsiveGuidance.screens.map(sample=>(
                <View key={"responsive-"+sample.id}
                  style={{marginBottom:12}}>
                  <MetricRow left={sample.label+" ("+sample.assumedContentWidth+" pt)"}
                    right={sample.layout.navigation+" menu • "+
                      sample.layout.galleryColumns+" photo column(s) • "+
                      sample.layout.serviceColumns+" service column(s)"}/>
                  {sample.layout.reasons.slice(0,2).map((reason,index)=>(
                    <Text key={"responsive-reason-"+index}
                      style={styles.cardBody}>{reason}</Text>
                  ))}
                </View>
              ))}
              {responsiveGuidance.suggestions.length?(
                <>
                  <Text style={styles.sectionLabel}>
                    BUSY's explained alternatives
                  </Text>
                  <Text style={styles.cardBody}>
                    These are supported options to compare, not automatic changes.
                    BUSY keeps your wording, existing colours, booking setup and
                    approved photographs unchanged.
                  </Text>
                  {responsiveGuidance.suggestions.map(item=>(
                    <View key={"guide-"+item.field}
                      style={{marginBottom:12}}>
                      <MetricRow left={"Try "+item.field}
                        right={item.value}/>
                      <Text style={styles.cardBody}>
                        {"Why: "+item.reason}
                      </Text>
                      <Text style={styles.cardBody}>
                        {"Trade-off: "+item.tradeoff}
                      </Text>
                      <Button label={"Preview "+item.field+" in my private app"}
                        disabled={!!s.miniAppsAction}
                        onPress={()=>{
                          const preview=proposeCoordinatedAppChanges(
                            view.draftConfig,[{kind:"appearance",
                              field:item.field,value:item.value}]);
                          setStudioPreview(preview.ok?preview:null);
                          setStudioNotice(preview.ok?
                            "BUSY prepared this explained alternative in the Intelligent App Studio above. Review the original and proposed designs before approving.":
                            preview.reason);
                        }}/>
                    </View>
                  ))}
                  {responsiveGuidance.suggestions.length>1?(
                    <Button label="Preview all suggested layout changes together"
                      disabled={!!s.miniAppsAction}
                      onPress={()=>{
                        const changes=responsiveGuidance.suggestions.map(item=>({
                          kind:"appearance",field:item.field,value:item.value
                        }));
                        const preview=proposeCoordinatedAppChanges(
                          view.draftConfig,changes);
                        setStudioPreview(preview.ok?preview:null);
                        setStudioNotice(preview.ok?
                          "Multiple screen-size improvements are ready in the private Studio above. Each proposed change needs your approval.":
                          preview.reason);
                      }}/>
                  ):null}
                </>
              ):(
                <Text style={styles.cardBody}>
                  The responsive rules found no supported style adjustment to
                  recommend. Test the real customer journey and images on actual devices.
                </Text>
              )}
            </>
          ):(
            <Text style={styles.cardBody}>
              BUSY needs an up-to-date private app draft to assess different widths.
            </Text>
          )}
            </>
          ):null}
          <Text style={styles.sectionLabel}>V3.162 • Suggested design checks</Text>
          {nonAiDesignHints.ok&&nonAiDesignHints.suggestions.length?(
            <>
              <Text style={styles.cardBody}>
                BUSY found some possible improvements using configuration rules,
                without AI charges. These are ideas to inspect, not proven fixes.
              </Text>
              {nonAiDesignHints.suggestions.map(hint=>(
                <Button key={hint.field} label={"Preview "+hint.field+": "+hint.value}
                  disabled={!!s.miniAppsAction}
                  onPress={()=>{
                    const p=proposeCoordinatedAppChanges(view.draftConfig,[{
                      kind:"appearance",field:hint.field,value:hint.value
                    }]);
                    setStudioPreview(p.ok?p:null);
                    setStudioNotice(p.ok?"A private alternative is ready in Intelligent App Studio above. Nothing was applied.":p.reason);
                  }}/>
              ))}
            </>
          ):(
            <Text style={styles.cardBody}>
              No supported one-click design hints from these static rules.
              Real device checks may still reveal problems.
            </Text>
          )}
          <Text style={styles.sectionLabel}>V3.160 • Accessible app checklist</Text>
          <MetricRow left="Static issues to review"
            right={String(usability.importantCount)}/>
          <MetricRow left="Manual accessibility checks remaining"
            right={String(usability.manualTestsNeeded)}/>
          <Text style={styles.sectionLabel}>Standalone app colour contrast</Text>
          {measuredNativeContrast.readings.filter(x=>x.threshold>0).map(item=>(
            <MetricRow key={item.id} left={item.id.replaceAll("_"," ")}
              right={item.ratio+":1 • "+(item.passes?"AA normal text":"Needs attention")}/>
          ))}
          <Text style={styles.cardBody}>
            Contrast ratios are calculated for the selected native colour palette.
            They do not measure text over photos, other themes or the displayed
            screenshot. This is not an accessibility certification.
          </Text>
          {usability.issues.filter(x=>x.severity!=="needs_test").slice(0,7).map(item=>(
            <MetricRow key={item.id} left={item.id.replaceAll("_"," ")}
              right={item.message}/>
          ))}
          {usability.issues.filter(x=>x.severity==="needs_test").slice(0,5).map(item=>(
            <MetricRow key={item.id} left={item.id.replaceAll("_"," ")}
              right={item.suggestion}/>
          ))}
          <Text style={styles.cardBody}>
            These are deterministic configuration checks, not a measured WCAG
            audit. Test VoiceOver, TalkBack, large text, touch targets and
            contrast on real devices before release.
          </Text>
          <Text style={styles.cardBody}>
            Before launch, inspect actual phone/tablet screenshots and test the
            full request → acknowledgement → business decision → status journey.
            The standalone app needs separate signing, provider accounts, device
            testing, eligibility and store approval.
          </Text>
        </Card>
      ):null}

      {app&&view.draftConfig?(
        <Card eyebrow="Edit how your app looks"
          title="Change the private app design"
          body="Try a header style, spacing or navigation look. BUSY shows an unsaved customer preview first. Keeping it creates a new private draft revision, not a live update."
          tone="blue">
          <AppVisualSelection key={[s.ownerSession?.userId,s.cloudWorkspace?.businessId,app.id,app.draft_revision,ownerEditorEpoch].join(':')}
            onDraftChange={value=>markOwnerDirty('selected',value)}
            Surface={MiniAppSurface} config={view.draftConfig} businessContent={app.businessContent||null}
            voiceScope={s.cloudWorkspace?.businessId?{appId:app.id,revision:app.draft_revision,businessId:s.cloudWorkspace.businessId,selectedPart:'whole_app'}:null}
            onTranscribe={s.transcribeSelectedAppAudio}
            busy={!!s.miniAppsAction||studio.pending||studio.uncertain}
            onPrepare={proposal=>{
              if(liveControlContext.current!==controlContext)return;
              setStudioPreview(proposal,'selected');setStudioNotice('Review the selected visual change in the original Studio comparison. Approval saves one private revision; Undo restores it.');
            }}/>
          <View style={styles.workspacePanel}><Text accessibilityRole="header" style={styles.workspacePanelTitle}>Select the part you want to change</Text>
          <View style={styles.choiceGrid}>{[
            ["header","Header"],["spacing","Spacing"],["navigation","Navigation"]
          ].map(([part,label])=>(
            <View key={part} style={styles.choiceCell}><Button compact selected={selectedAppPart===part} label={(selectedAppPart===part?"✓ ":"")+"Edit "+label}
              onPress={()=>{setSelectedAppPart(part);setPendingAppearance(null);
                setAppearanceInstructionNotice("");setShowAppVoice(false);}}/></View>
          ))}</View>
          <Field label="Tell BUSY how to change the selected part"
            value={appearanceWords} onChangeText={setAppearanceWords}
            placeholder="e.g. Make the header bold, or use roomier spacing"/></View>
          <Button primary label="Preview my described app change" disabled={!appearanceWords.trim()}
            onPress={()=>{
              const proposal=interpretSelectedAppAppearance(view.draftConfig,{
                selected:selectedAppPart,text:appearanceWords
              });
              if(proposal.ok){
                setPendingAppearance(bindAppControlReview({field:proposal.field,value:proposal.value},controlContext));
                setAppearancePreviewOpen(true);
                setAppearanceInstructionNotice("BUSY prepared one reviewable, private appearance change. Nothing is saved yet.");
              }else{
                setPendingAppearance(null);setAppearancePreviewOpen(false);
                setAppearanceInstructionNotice(proposal.reason);
              }
            }}/>
          {appearanceInstructionNotice?<Text style={styles.cardBody}>
            {appearanceInstructionNotice}
          </Text>:null}
          <Button label={showAppVoice?"Close app microphone — discard unsent recording":
              "🎙 Talk to BUSY about this selected app part"}
            onPress={()=>setShowAppVoice(old=>!old)}/>
          {showAppVoice&&s.cloudWorkspace?.businessId?(
            <WebsiteSelectedVoice key={app.id+":"+app.draft_revision+":"+selectedAppPart}
              editorKind="app" contextLabel="selected app design"
              selection={{appId:app.id,revision:app.draft_revision,
                businessId:s.cloudWorkspace.businessId,selectedPart:selectedAppPart}}
              onTranscribe={(uri,scope)=>s.transcribeSelectedAppAudio?.(uri,scope)}
              onTranscript={text=>{
                setAppearanceWords(text);
                setPendingAppearance(null);setAppearancePreviewOpen(false);
                setAppearanceInstructionNotice("Check the transcribed words and tap Preview. Nothing was changed.");
              }}/>
          ):null}
          <Text style={styles.cardBody}>
            App voice uses its own 12-request daily per-business allowance (UTC).
            Record, Stop and review explicitly. BUSY never applies a transcription on its own.
          </Text>
          {[
            ["headerStyle","Header",appAppearanceOptions.headerStyle],
            ["layoutDensity","Space around content",appAppearanceOptions.layoutDensity],
            ["navigationStyle","Navigation look",appAppearanceOptions.navigationStyle],
            ["galleryLayout","Gallery layout",appAppearanceOptions.galleryLayout],
            ["typeStyle","Headings and typography",appAppearanceOptions.typeStyle],
            ["serviceStyle","Service presentation",appAppearanceOptions.serviceStyle],
            ["imageCorners","Photo corners",appAppearanceOptions.imageCorners],
            ["brandPalette","Business App colours",appAppearanceOptions.brandPalette.filter(x=>x!=="custom")]
          ].map(([field,label,values])=>(
            <View key={field} style={{marginTop:9}}>
              <Text style={styles.sectionLabel}>{label}</Text>
              {((field==="brandPalette"&&!showAllPalettes)?
                values.slice(0,8):values).map(value=>(
                <Button key={value} label={
                  (pendingAppearance?.field===field&&pendingAppearance?.value===value?"✓ ":"")+
                  (field==="brandPalette"?(nativePaletteLabels[value]||value):
                    field==="typeStyle"?(TYPE_LABELS[value]||value):
                    field==="serviceStyle"?(SERVICE_LABELS[value]||value):
                    value.replaceAll("-"," "))}
                  disabled={!!s.miniAppsAction}
                  onPress={()=>{
                    setPendingAppearance(bindAppControlReview({field,value},controlContext));
                    setAppearancePreviewOpen(true);
                  }}/>
              ))}
              {field==="brandPalette"?(
                <>
                  <Button label={showAllPalettes?
                    "Show fewer colours":"Show all 20 colour schemes"}
                    onPress={()=>setShowAllPalettes(v=>!v)}/>
                  <Text style={styles.cardBody}>
                    Have your own brand colour? Enter its exact six-digit hex code.
                    Busy adjusts the supporting colours for readability.
                  </Text>
                  <Field label="My brand colour (example: #FF8A56)"
                    value={brandAccentDraft} onChangeText={setBrandAccentDraft}
                    placeholder="#FF8A56"/>
                  <Button label="Preview my own brand colour"
                    disabled={!!s.miniAppsAction}
                    onPress={()=>{
                      setPendingAppearance(bindAppControlReview({field:"brandAccent",value:brandAccentDraft},controlContext));
                      setAppearancePreviewOpen(true);
                    }}/>
                </>
              ):null}
            </View>
          ))}
          {pendingAppearance?(()=>{
            const proposal=appControlReviewCurrent(pendingAppearance,controlContext)?previewPrivateAppAppearance(view.draftConfig,pendingAppearance):{ok:false,reason:"This appearance preview is outdated. Prepare it again."};
            return proposal.ok?(
              <>
                <MetricRow left="Proposed change"
                  right={pendingAppearance.field+" • "+proposal.previous+" → "+proposal.value}/>
                {["brandPalette","brandAccent"].includes(pendingAppearance.field)?(()=>{
                  const colours=nativePalette(proposal.nextConfig.presentation.brandPalette,
                    proposal.nextConfig.presentation.brandAccent);
                  return <View style={{backgroundColor:colours.bg,
                    padding:14,borderRadius:12,marginVertical:10}}>
                    <Text style={{color:colours.text,fontSize:18,fontWeight:"700"}}>
                      {view.draftConfig.display?.name||"Your business app"}
                    </Text>
                    <Text style={{color:colours.muted,marginTop:7}}>
                      Native screen colour preview • owner approval required
                    </Text>
                    <View style={{backgroundColor:colours.surface,
                      borderRadius:8,padding:11,marginTop:10}}>
                      <Text style={{color:colours.text}}>Service information</Text>
                      <View style={{backgroundColor:colours.accent,borderRadius:7,
                       marginTop:8,padding:11,alignItems:"center"}}>
                       <Text style={{color:colours.bg,fontWeight:"700"}}>
                         Request a booking
                       </Text>
                      </View>
                    </View>
                  </View>;
                })():null}
                {appearancePreviewOpen?(
                  <>
                    <Text style={styles.cardBody}>Unsaved customer-view preview; no public changes have been made.</Text>
                    <MiniAppSurface config={proposal.nextConfig} businessContent={proposal.businessContentPreview||s.miniAppsView?.app?.businessContent||null}/>
                  </>
                ):null}
                <Button label="Keep this appearance in my PRIVATE app"
                  primary disabled={!!s.miniAppsAction}
                  onPress={()=>replaceOwnerSource(async()=>{
                    if(!appControlReviewCurrent(pendingAppearance,liveControlContext.current))return;
                    const ok=await s.savePrivateAppAppearance?.({
                      field:pendingAppearance.field,value:pendingAppearance.value,appId:app.id,
                      expectedRevision:pendingAppearance.reviewSource.revision
                    });
                    if(ok&&appControlReviewCurrent(pendingAppearance,liveControlContext.current)){setPendingAppearance(null);setAppearancePreviewOpen(false);}
                  })}/>
                <Button label="Discard appearance changes"
                  onPress={()=>{setPendingAppearance(null);setAppearancePreviewOpen(false);}}/>
              </>
            ):<Text style={styles.cardBody}>{proposal.reason}</Text>;
          })():null}
        </Card>
      ):null}

      {app&&view.draftConfig?(
        <Card eyebrow="Arrange your app"
          title="Move sections up or down"
          body="Your sections work in both the BUSY marketplace app and its standalone native counterpart. Preview a one-position move before keeping it in your PRIVATE draft."
          tone="blue">
          {orderedAppModules(view.draftConfig).map((module,index,items)=>(
            <View key={module.key} style={styles.recordRow}>
              <Text accessibilityRole="header" style={styles.workspacePanelTitle}>{(index+1)+". "+module.key.replaceAll("_"," ")}</Text>
              {index>0?<Button label={"Move "+module.key.replaceAll("_"," ")+" up"}
                disabled={!!s.miniAppsAction}
                onPress={()=>setPendingMove(bindAppControlReview({moduleKey:module.key,direction:"up"},controlContext))}/>:null}
              {index<items.length-1?<Button label={"Move "+module.key.replaceAll("_"," ")+" down"}
                disabled={!!s.miniAppsAction}
                onPress={()=>setPendingMove(bindAppControlReview({moduleKey:module.key,direction:"down"},controlContext))}/>:null}
            </View>
          ))}
          {pendingMove?(()=>{
            const proposal=appControlReviewCurrent(pendingMove,controlContext)?proposeAppSectionMove(view.draftConfig,pendingMove):{ok:false,reason:"This section preview is outdated. Prepare it again."};
            return proposal.ok?(
              <>
                <Text style={styles.cardBody}>
                  {"Proposed order: "+proposal.after.map(x=>x.replaceAll("_"," ")).join(" → ")}
                </Text>
                <MiniAppSurface config={proposal.nextConfig} businessContent={proposal.businessContentPreview||s.miniAppsView?.app?.businessContent||null}/>
                <Button label="Keep new order in PRIVATE app"
                  primary disabled={!!s.miniAppsAction}
                  onPress={()=>replaceOwnerSource(async()=>{
                    if(!appControlReviewCurrent(pendingMove,liveControlContext.current))return;
                    const ok=await s.movePrivateAppSection?.({
                      moduleKey:pendingMove.moduleKey,direction:pendingMove.direction,appId:app.id,expectedRevision:pendingMove.reviewSource.revision});
                    if(ok&&appControlReviewCurrent(pendingMove,liveControlContext.current))setPendingMove(null);
                  })}/>
                <Button label="Discard section move" onPress={()=>setPendingMove(null)}/>
              </>
            ):<Text style={styles.cardBody}>{proposal.reason}</Text>;
          })():null}
          <Text style={styles.cardBody}>
            Only a new private app draft is saved. Your existing published app and customer requests are unaffected.
          </Text>
        </Card>
      ):null}

      {s.miniAppsError ? (
        <Card
          eyebrow="Nothing unsafe was applied"
          title="Business App needs attention"
          body={s.miniAppsError}
          tone="amber"
        />
      ) : null}

      {s.miniAppsNotice ? (
        <Card
          eyebrow="Latest update"
          title={view.statusLabel || "Business App"}
          body={s.miniAppsNotice}
          tone="blue"
        />
      ) : null}

      {app ? (
        <>
          <Text style={styles.sectionLabel}>Fine-tune app sections</Text>
          {modules.map((module) => {
            const configured = configuredModules.get(module.module_key);
            const enabled = !!configured?.enabled;
            const planned = module.status !== "available";
            return (
              <Card
                key={module.module_key}
                eyebrow={planned ? "Planned module" : "Tested module"}
                title={module.title}
                body={module.description}
                footer={
                  planned
                    ? "Visible in the platform plan, but BUSY will not pretend it works yet."
                    : enabled
                    ? "Enabled in private draft"
                    : "Available but disabled"
                }
                tone={enabled ? "green" : planned ? "blue" : "blue"}
              >
                <MetricRow left="Module version" right={String(module.module_version || 1)} />
                <MetricRow left="State" right={planned ? "Planned" : enabled ? "Enabled" : "Disabled"} strong={enabled} />
                {!planned && module.module_key !== "business_profile" ? (
                  <Button
                    label={
                      s.miniAppsAction === `module:${module.module_key}`
                        ? "Updating…"
                        : enabled
                        ? "Disable in draft"
                        : "Enable in draft"
                    }
                    disabled={!!s.miniAppsAction}
                    onPress={() =>
                      replaceOwnerSource(()=>s.toggleMiniAppModule(module.module_key, !enabled))
                    }
                  />
                ) : null}
              </Card>
            );
          })}

          <Text style={styles.sectionLabel}>Preview & Go Live</Text>
          <Card
            eyebrow="Immutable preview"
            title={
              view.previewVersion
                ? `Customer preview v${view.previewVersion.version_no}`
                : "No customer preview prepared yet"
            }
            body={
              view.previewVersion
                ? view.previewVersion.change_label || "Prepared Business App version"
                : "BUSY freezes the current private app into an immutable customer preview so the exact version you approve is the version that goes live."
            }
            footer="Draft edits remain private until another version is prepared and explicitly approved."
            tone={view.previewVersion ? "green" : "blue"}
          >
            <Button
              label={s.miniAppsAction === "prepare" ? "Preparing…" : "Prepare immutable app preview"}
              primary={!!view.canPrepare}
              disabled={!view.canPrepare || !!s.miniAppsAction}
              onPress={s.prepareMiniAppPreview}
            />
            {view.previewVersion ? (
              <Button label="Open prepared app preview" onPress={s.openMiniAppPreview} />
            ) : null}
          </Card>

          {view.canPublish ? (
            <Card
              eyebrow="Public Go Live gate"
              title={`Business App v${view.previewVersion.version_no} is ready`}
              body="Review the real customer experience first. If you approve Go Live, BUSY publishes exactly this immutable version — never a later draft."
              footer="Go Live and marketplace listing remain deliberate owner decisions."
              tone="amber"
            >
              <Button
                label={s.miniAppsAction === "publish" ? "Publishing…" : "Review & approve Go Live"}
                primary
                disabled={!!s.miniAppsAction}
                onPress={() => s.confirmPublishMiniApp(view.previewVersion.id)}
              />
            </Card>
          ) : null}

          {view.hasLive ? (
            <Card
              eyebrow={`Live Business App v${view.liveVersion.version_no}`}
              title={view.isDiscoverable ? "Listed in BUSY Apps" : "Live but not listed"}
              body={
                view.isDiscoverable
                  ? "Customers can find this business through BUSY Apps search, and the exact QR/share link also opens it directly."
                  : "The app is live and hidden from marketplace search, but customers with the exact owner-shared link or QR code can still open it."
              }
              footer={`Public slug: ${view.publicSlug || "Not set"}`}
              tone="green"
            >
              <MetricRow
                left="Public Business App"
                right={view.webReady ? "Ready" : "Needs republish"}
                strong={view.webReady}
              />
              <Button
                label="Share, link & QR"
                primary
                onPress={s.openMiniAppShareCentre}
              />
              <Button
                label={view.isDiscoverable ? "Remove from BUSY Apps search" : "List in BUSY Apps search"}
                disabled={!!s.miniAppsAction}
                onPress={() => s.confirmMiniAppDiscoverable(!view.isDiscoverable)}
              />
            </Card>
          ) : null}

          {app?.id ? (
            <Card
              eyebrow="Business App inbox"
              title="Requests needing attention"
              body="Check your saved customer requests without sending messages or changing any booking."
              footer="A booking request is not a confirmed appointment."
            >
              {s.ownerQueueSummary?.ok===true &&
               s.ownerQueueSummary?.appId===app.id &&
               s.ownerQueueSummary?.businessId===app.business_id ? (
                <>
                  <MetricRow
                    left="New requests"
                    right={String(s.ownerQueueSummary.received||0)}
                    strong={Number(s.ownerQueueSummary.received||0)>0}
                  />
                  <MetricRow
                    left="Being reviewed"
                    right={String(s.ownerQueueSummary.reviewing||0)}
                  />
                  {s.ownerQueueSummary.guestAlerts?.ok===true &&
                   s.ownerQueueSummary.guestAlerts?.businessId===app.business_id &&
                   s.ownerQueueSummary.guestAlerts?.appId===app.id ? (
                    <>
                      <MetricRow
                        left="Alerts awaiting provider confirmation"
                        right={String(s.ownerQueueSummary.guestAlerts.needsProviderReview||0)}
                      />
                      <MetricRow
                        left="Alerts accepted by push gateway (not phone delivery)"
                        right={String(s.ownerQueueSummary.guestAlerts.gatewayAcceptedCount||0)}
                      />
                      <Text style={styles.cardBody}>
                        {s.ownerQueueSummary.guestAlerts.explanation}
                        {s.ownerQueueSummary.guestAlerts.manualReview>0 ?
                          " Please review uncertain alerts in your Business App." : ""}
                      </Text>
                    </>
                  ) : null}
                  <Text style={styles.cardBody}>
                    {s.ownerQueueSummary.nextStep?.evidenceFromAuthenticatedEndpoint===true &&
                          s.ownerQueueSummary.nextStep?.businessId===app.business_id &&
                          s.ownerQueueSummary.nextStep?.appId===app.id ?
                          "BUSY suggests: "+s.ownerQueueSummary.nextStep.title+
                          ". "+s.ownerQueueSummary.nextStep.explanation+"\n" : ""}
                         {s.ownerQueueSummary.explanation}
                  </Text>
                  {s.ownerQueueSummary.latestRequestId ? (
                    <Button
                      label={s.ownerQueueSummary.received>0?"Open new request":"Continue request review"}
                      disabled={!!s.ownerQueueBusy}
                      onPress={()=>s.openOwnerMiniAppRequest(s.ownerQueueSummary.latestRequestId)}
                    />
                  ) : null}
                </>
              ) : null}
              <Button
                label={s.ownerQueueBusy?"Checking requests…":"Check customer requests"}
                disabled={!!s.ownerQueueBusy || !!s.miniAppsAction}
                onPress={s.checkOwnerRequestQueue}
              />
            </Card>
          ) : null}

          {view.pendingRequests?.length ? (
            <>
              <Text style={styles.sectionLabel}>Customer requests</Text>
              {view.pendingRequests.slice(0, 10).map((request) => {
                const link = view.linkByRequest?.get?.(request.id) || null;
                const actions=ownerRequestActionsV3233({request,link});
                return (
                  <Card
                    key={request.id}
                    eyebrow={
                      request.request_type === "booking_request"
                        ? "Booking request"
                        : "Enquiry"
                    }
                    title={
                      request.contact_name ||
                      request.payload?.name ||
                      request.service_name ||
                      request.payload?.service ||
                      "Customer request"
                    }
                    body={
                      request.request_type === "booking_request"
                        ? [
                            request.service_name || request.payload?.service || "Service not stated",
                            request.preferred_date_text || request.payload?.preferredDate || "Date/time still to agree",
                            request.payload?.note || "",
                          ].filter(Boolean).join(" • ")
                        : request.payload?.message || "No message supplied."
                    }
                    footer={
                      link
                        ? `Linked to BUSY customer • ${link.bridge_state.replaceAll("_", " ")}`
                        : `${request.status} • ${readableDate(request.created_at)}`
                    }
                    tone={link ? "green" : "amber"}
                  >
                    <MetricRow
                      left="Contact"
                      right={
                        request.contact_phone ||
                        request.contact_email ||
                        "Not supplied"
                      }
                    />
                    {request.request_origin === "guest_web" ? (
                      <>
                        <MetricRow
                          left="Source"
                          right="Public web guest"
                          strong
                        />
                        <MetricRow
                          left="Verification"
                          right="Browser challenge passed • contact details self-reported"
                        />
                      </>
                    ) : (
                      <MetricRow left="Source" right="Signed-in BUSY customer" />
                    )}
                    {!link ? (
                      <Button
                        label={
                          s.miniAppsAction === `bridge:${request.id}`
                            ? "Linking into BUSY…"
                            : request.request_type === "booking_request"
                            ? "Create BUSY customer + Draft booking"
                            : "Add to BUSY customer journey"
                        }
                        primary
                        disabled={!!s.miniAppsAction}
                        onPress={() =>
                          s.bridgeMiniAppRequestIntoBusy(request.id)
                        }
                      />
                    ) : null}
                    {actions.canReview ? (
                      <Button
                        label="Mark reviewing"
                        disabled={!!s.miniAppsAction}
                        onPress={() =>
                          s.updateMiniAppRequestStatus(
                            request.id,
                            "reviewing",
                            request
                          )
                        }
                      />
                    ) : null}
                    {actions.canDecline ? (
                      <Button
                        label="Decline request"
                        disabled={!!s.miniAppsAction}
                        onPress={() =>
                          s.updateMiniAppRequestStatus(
                            request.id,
                            "declined",
                            request
                          )
                        }
                      />
                    ) : null}

                    {actions.showDraftBooking ? (
                      <Button
                        label="Open BUSY booking to confirm"
                        primary
                        onPress={() =>
                          s.openMiniAppLinkedBooking(request.id)
                        }
                      />
                    ) : null}
                    {actions.showConfirmedBooking ? (
                      <Button
                        label="Open confirmed BUSY booking"
                        onPress={() =>
                          s.openMiniAppLinkedBooking(request.id)
                        }
                      />
                    ) : null}

                    {Number(request.business_unread_count || 0) > 0 ? (
                      <MetricRow
                        left="New customer activity"
                        right={`${Number(request.business_unread_count || 0)} unread`}
                        strong
                      />
                    ) : null}
                    <Button
                      label={
                        request.request_origin === "guest_web"
                          ? "Open guest request"
                          : Number(request.business_unread_count || 0) > 0
                          ? "Open new message"
                          : "Open conversation"
                      }
                      primary={
                        request.request_origin === "guest_web" ||
                        Number(request.business_unread_count || 0) > 0
                      }
                      onPress={() => s.openOwnerMiniAppRequest(request.id)}
                    />
                  </Card>
                );
              })}
            </>
          ) : null}

          {view.versions
            ?.filter(
              (version) =>
                !!version.published_at &&
                version.id !== view.liveVersion?.id
            )
            .slice(0, 6)
            .map((version) => (
              <Card
                key={version.id}
                eyebrow={`Previously published • v${version.version_no}`}
                title={version.change_label || "Business App version"}
                body="Immutable previously published configuration retained for rollback."
                footer={readableDate(version.published_at, "Published previously")}
                tone="blue"
              >
                <Button
                  label={s.miniAppsAction === `rollback:${version.id}` ? "Restoring…" : `Restore v${version.version_no}`}
                  disabled={!!s.miniAppsAction}
                  onPress={() =>
                    s.confirmRollbackMiniApp(version.id, version.version_no)
                  }
                />
              </Card>
            ))}
        </>
      ) : null}

      <Button label="BUSY Apps marketplace" onPress={s.openBusyAppsMarketplace} />
      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function MiniAppPreview({ s }) {
  const view = s.miniAppsView || {};
  const previewMatchesDraft=businessAppPreviewProof({
    app:view.app,preview:view.previewVersion}).matches;
  // A stale immutable preview must never pose as the current private draft.
  const config =
    (previewMatchesDraft?view.previewVersion?.config:null) ||
    view.draftConfig ||
    view.liveVersion?.config ||
    null;
  const appId=view.app?.id||"";
  const revision=Number(view.app?.draft_revision)||0;
  const [capture,setCapture]=React.useState(null);
  const [captureBusy,setCaptureBusy]=React.useState(false);
  const [captureError,setCaptureError]=React.useState("");
  const [visualAllowance,setVisualAllowance]=React.useState(null);
  const [visualReport,setVisualReport]=React.useState(null);
  const [visualBusy,setVisualBusy]=React.useState(false);
  const [visualProposal,setVisualProposal]=React.useState(null);
  const [visualCompareSide,setVisualCompareSide]=React.useState("proposed");
  const [visualNotice,setVisualNotice]=React.useState("");
  const [visualSelected,setVisualSelected]=React.useState([]);
  const [pairedCapture,setPairedCapture]=React.useState(null);
  const [pairBusy,setPairBusy]=React.useState(false);
  const [pairReview,setPairReview]=React.useState(null);
  const [pairNotice,setPairNotice]=React.useState("");
  const [designCheckpoint,setDesignCheckpoint]=React.useState(null);
  const [designMemory,setDesignMemory]=React.useState(null);
  const [designMemoryBusy,setDesignMemoryBusy]=React.useState(false);
  const [designMemoryNotice,setDesignMemoryNotice]=React.useState("");
  const [showDesignMemory,setShowDesignMemory]=React.useState(false);
  const [designIndustry,setDesignIndustry]=React.useState("general");
  const [showIndustryReview,setShowIndustryReview]=React.useState(false);
  const [qualityEnabled,setQualityEnabled]=React.useState(false);
  const [currentMeasurements,setCurrentMeasurements]=React.useState([]);
  const [beforeMeasurements,setBeforeMeasurements]=React.useState([]);
  const [afterMeasurements,setAfterMeasurements]=React.useState([]);
  const [currentMeasuredWidth,setCurrentMeasuredWidth]=React.useState(0);
  const [beforeMeasuredWidth,setBeforeMeasuredWidth]=React.useState(0);
  const [afterMeasuredWidth,setAfterMeasuredWidth]=React.useState(0);
  const [virtualWidthId,setVirtualWidthId]=React.useState("small");
  const [virtualBeforeObs,setVirtualBeforeObs]=React.useState([]);
  const [virtualAfterObs,setVirtualAfterObs]=React.useState([]);
  const [virtualBeforeWidth,setVirtualBeforeWidth]=React.useState(0);
  const [virtualAfterWidth,setVirtualAfterWidth]=React.useState(0);
  const [virtualSamples,setVirtualSamples]=React.useState({});
  const [virtualBusy,setVirtualBusy]=React.useState(false);
  const [virtualNotice,setVirtualNotice]=React.useState("");
  const [virtualAiReview,setVirtualAiReview]=React.useState(null);
  const virtualBeforeRef=React.useRef(null);
  const virtualAfterRef=React.useRef(null);
  const appSurfaceRef=React.useRef(null);
  const originalComparisonRef=React.useRef(null);
  const proposedComparisonRef=React.useRef(null);
  React.useEffect(()=>{
    setDesignCheckpoint(null);
    setDesignIndustry("general");setShowIndustryReview(false);
  },[appId]);
  React.useEffect(()=>{
    let active=true;
    setDesignMemory(null);setDesignMemoryNotice("");
    if(appId&&revision>0){
      s.getAppDesignLearningStatus?.({appId}).then(result=>{
        if(active)setDesignMemory(result||{ok:false,records:[]});
      }).catch(()=>{
        if(active)setDesignMemory({ok:false,records:[],
          reason:"Private design feedback is unavailable."});
      });
    }
    return ()=>{active=false;};
  },[appId,revision]);
  React.useEffect(()=>{
    setCapture(null);setCaptureError("");setVisualReport(null);
    setVisualProposal(null);setVisualAllowance(null);setVisualNotice("");
    setVisualSelected([]);setPairedCapture(null);setPairReview(null);
    setPairNotice("");setPairBusy(false);
    setQualityEnabled(false);setCurrentMeasurements([]);
    setBeforeMeasurements([]);setAfterMeasurements([]);
    setCurrentMeasuredWidth(0);setBeforeMeasuredWidth(0);setAfterMeasuredWidth(0);
    setVirtualWidthId("small");setVirtualSamples({});
    setVirtualBeforeObs([]);setVirtualAfterObs([]);
    setVirtualBeforeWidth(0);setVirtualAfterWidth(0);
    setVirtualNotice("");setVirtualAiReview(null);setVirtualBusy(false);
  },[appId,revision,view.previewVersion?.id]);
  // Only dimensions, counts and finite element IDs are kept in local React state.
  const collectCurrent=React.useCallback(value=>{
    setCurrentMeasurements(previous=>{
      const result=mergeRenderedObservations(previous,value);
      return result.ok&&result.changed?result.observations:previous;
    });
  },[]);
  const collectBefore=React.useCallback(value=>{
    setBeforeMeasurements(previous=>{
      const result=mergeRenderedObservations(previous,value);
      return result.ok&&result.changed?result.observations:previous;
    });
  },[]);
  const collectAfter=React.useCallback(value=>{
    setAfterMeasurements(previous=>{
      const result=mergeRenderedObservations(previous,value);
      return result.ok&&result.changed?result.observations:previous;
    });
  },[]);
  const proposedDesignKey=JSON.stringify(visualProposal?.operations||
    (visualProposal?.operation?[visualProposal.operation]:[]));
  React.useEffect(()=>{
    setBeforeMeasurements([]);setAfterMeasurements([]);
    setBeforeMeasuredWidth(0);setAfterMeasuredWidth(0);
    setVirtualSamples({});
  },[appId,revision,proposedDesignKey]);
  const capturePreset=getViewport(virtualWidthId);
  const collectVirtualBefore=React.useCallback(value=>{
    setVirtualBeforeObs(previous=>{
      const result=mergeRenderedObservations(previous,value);
      return result.ok&&result.changed?result.observations:previous;
    });
  },[]);
  const collectVirtualAfter=React.useCallback(value=>{
    setVirtualAfterObs(previous=>{
      const result=mergeRenderedObservations(previous,value);
      return result.ok&&result.changed?result.observations:previous;
    });
  },[]);
  React.useEffect(()=>{
    setVirtualBeforeObs([]);setVirtualAfterObs([]);
    setVirtualBeforeWidth(0);setVirtualAfterWidth(0);
    setVirtualAiReview(null);setVirtualNotice("");
  },[appId,revision,virtualWidthId,proposedDesignKey]);
  const measuredReport=qualityEnabled&&currentMeasuredWidth>=250&&currentMeasurements.length?
    evaluateRenderedQuality({appId,revision,observations:currentMeasurements,
      viewportWidth:currentMeasuredWidth}):null;
  const measuredBefore=qualityEnabled&&beforeMeasuredWidth>=250&&beforeMeasurements.length?
    evaluateRenderedQuality({appId,revision,observations:beforeMeasurements,
      viewportWidth:beforeMeasuredWidth}):null;
  const measuredAfter=qualityEnabled&&afterMeasuredWidth>=250&&afterMeasurements.length?
    evaluateRenderedQuality({appId,revision,observations:afterMeasurements,
      viewportWidth:afterMeasuredWidth}):null;
  const geometryComparison=measuredBefore?.ok&&measuredAfter?.ok?
    compareRenderedQuality(measuredBefore,measuredAfter):null;
  const priorMeasurement=designCheckpoint?.priorRenderedQuality||null;
  const savedMeasurementReview=priorMeasurement&&measuredReport?.ok&&
    designCheckpoint?.saveConfirmed===true?
    compareApprovedRevisionMeasurements(priorMeasurement,measuredReport,{
      appId,expectedBeforeRevision:designCheckpoint.beforeRevision,
      verifiedSavedRevision:designCheckpoint.expectedAfterRevision
    }):null;
  const measuredSuggestions=measuredReport?.ok?
    suggestMeasuredAppearance(config,measuredReport):null;
  const localDesignReport=measuredReport?.ok?{
    ok:true,summary:"BUSY measured the actual layout of customer-only components. These are finite checks, not AI visual inspection.",
    observations:measuredReport.issues.map(x=>x.message),
    suggestions:(measuredSuggestions?.suggestions||[]).map(item=>({
      kind:"appearance",field:item.field,value:item.value,
      reason:item.why+" "+item.tradeoff
    }))
  }:null;
  const displayedReview=visualReport?.ok?visualReport:localDesignReport||
    (visualProposal?.ok?{ok:true,
      summary:"BUSY has prepared an unsaved design plan for your approval.",
      observations:[],suggestions:[]} : null);
  const proposedOperations=visualProposal?.operations||
    (visualProposal?.operation?[visualProposal.operation]:[]);
  const presetBefore=virtualBeforeWidth===capturePreset?.width&&virtualBeforeObs.length?
    evaluateRenderedQuality({appId,revision,viewportWidth:virtualBeforeWidth,
      observations:virtualBeforeObs}):null;
  const presetAfter=virtualAfterWidth===capturePreset?.width&&virtualAfterObs.length?
    evaluateRenderedQuality({appId,revision,viewportWidth:virtualAfterWidth,
      observations:virtualAfterObs}):null;
  const presetComparison=presetBefore?.ok&&presetAfter?.ok?
    compareRenderedQuality(presetBefore,presetAfter):null;
  const recordedWidths=Object.entries(virtualSamples)
    .filter(([id,v])=>getViewport(id)&&v?.beforeQuality?.ok&&v?.afterQuality?.ok)
    .map(([viewportId,v])=>({viewportId,before:v.beforeQuality,after:v.afterQuality}));
  const multiviewAssessment=recordedWidths.length?
    compareViewportSet({appId,revision,results:recordedWidths}):null;
  const responsiveSuggestions=recommendResponsiveDesign(config)?.suggestions||[];
  const rankedDesign=rankDesignSuggestions(config,{
    history:designMemory?.ok?designMemory.records:[],
    measured:measuredSuggestions?.suggestions||[],
    ai:visualReport?.suggestions||[],
    responsive:responsiveSuggestions
  });
  const ownerPatterns=buildOwnerDesignPatterns(
    designMemory?.ok?designMemory.records:[]);
  const nextDesignExperiment=prepareOwnerAwareDesignExperiments(config,{
    history:designMemory?.ok?designMemory.records:[],
    measured:measuredSuggestions?.suggestions||[],
    ai:visualReport?.suggestions||[],
    responsive:responsiveSuggestions
  });
  const industryDesignReview=prepareIndustryAwareAppReview(config,{
    industry:designIndustry,
    history:designMemory?.ok?designMemory.records:[],
    measured:measuredSuggestions?.suggestions||[],
    ai:visualReport?.suggestions||[],
    responsive:responsiveSuggestions
  });
  const savedOwnerVerdict=(designMemory?.records||[]).find(item=>
    item.context==="saved_revision"&&item.draftRevision===revision&&
    designCheckpoint?.desiredAppearance?.some(op=>
      op.field===item.field&&op.value===item.value))?.verdict||null;
  const designOutcome=explainOwnerDesignOutcome({
    verdict:savedOwnerVerdict,
    actuallySaved:designCheckpoint?.saveConfirmed===true&&
      designCheckpoint?.expectedAfterRevision===revision&&
      designCheckpoint?.desiredAppearance?.every(choice=>
        config?.presentation?.[choice.field]===choice.value)===true,
    beforeWarnings:savedMeasurementReview?.ok?
      savedMeasurementReview.beforeWarnings:null,
    afterWarnings:savedMeasurementReview?.ok?
      savedMeasurementReview.afterWarnings:null
  });
  const refreshDesignMemory=async()=>{
    const response=await s.getAppDesignLearningStatus?.({appId});
    setDesignMemory(response||{ok:false,records:[],
      reason:"Private design history is unavailable."});
    return response;
  };
  const recordDesignChoice=async(verdict,context="preview")=>{
    const operations=context==="saved_revision"?
      (designCheckpoint?.desiredAppearance||[]).map(x=>({
        field:x.field,value:x.value
      })):proposedOperations;
    if(!Array.isArray(operations)||!operations.length||
       operations.length>3||designMemoryBusy)return;
    setDesignMemoryBusy(true);setDesignMemoryNotice("");
    try{
      let completed=0;
      for(const op of operations){
        const suggestedSource=visualProposal?.explanations?.find(
          x=>x.field===op.field)?.source;
        const source=context==="saved_revision"?"manual":
          ["measured","ai","responsive","manual"].includes(suggestedSource)?
            suggestedSource:
          visualReport?.ok?"ai":measuredReport?.ok?"measured":"responsive";
        const result=await s.recordAppDesignPreference?.({
          appId,expectedRevision:revision,field:op.field,value:op.value,
          verdict,context,source,
          baselineWarnings:context==="preview"&&presetComparison?.ok?
            presetComparison.beforeIssueCount:null,
          proposedWarnings:context==="preview"&&presetComparison?.ok?
            presetComparison.afterIssueCount:null
        });
        if(!result?.ok)throw Error(result?.reason||
          "Your private design feedback could not be saved.");
        completed++;
      }
      const fresh=await refreshDesignMemory();
      if(context==="preview"&&verdict!=="better"){
        // Fail closed: when private memory cannot be reloaded, preparing
        // another option from empty history could repeat the rejected style.
        const freshOptions={
          history:fresh?.records||[],
          measured:measuredSuggestions?.suggestions||[],
          ai:visualReport?.suggestions||[],
          responsive:responsiveSuggestions
        };
        const alternative=fresh?.ok?(visualProposal?.industryId==="general"||
          !visualProposal?.industryId?
          prepareOwnerAwareDesignExperiments(config,freshOptions):
          prepareIndustryAwareAppReview(config,{
            ...freshOptions,industry:visualProposal.industryId
          })):null;
        const next=alternative?.preview?.ok?{
          ...alternative.preview,
          industryId:visualProposal?.industryId||"general",
          explanations:alternative.reasoning.map(x=>({
            field:x.field,value:x.value,
            source:["measured","ai","responsive"].includes(
              alternative.proposed.find(p=>p.field===x.field)?.sources?.[0])?
                alternative.proposed.find(p=>p.field===x.field).sources[0]:"manual",
            why:x.why,tradeoff:x.tradeoff
          }))
        }:null;
        setVisualProposal(next);setVirtualSamples({});
        setDesignMemoryNotice(completed+" preference(s) remembered for this business. "+
          (!fresh?.ok?
            "BUSY couldn't reload private memory yet, so she has NOT prepared another option that could repeat your rejection.":
            next?"BUSY has prepared a DIFFERENT private option to review.":
            "BUSY won't repeat that rejected setting; no safe alternative is currently supported."));
      }else{
        setDesignMemoryNotice(completed+" preference(s) recorded for this business only. BUSY will consider them in future private suggestions.");
      }
    }catch(error){
      setDesignMemoryNotice(String(error?.message||
        "Design feedback was not saved.").slice(0,230));
    }finally{setDesignMemoryBusy(false);}
  };
  const clearDesignMemory=()=>{
    Alert.alert("Clear this business's design preferences?",
      "BUSY will delete saved App Builder design feedback for this business. This does not change your private draft, existing published app, customer records or subscription.",
      [{text:"Cancel",style:"cancel"},{text:"Clear feedback",
        style:"destructive",onPress:async()=>{
          setDesignMemoryBusy(true);
          const cleared=await s.clearAppDesignLearning?.({appId});
          if(cleared?.ok){
            await refreshDesignMemory();
            setDesignMemoryNotice("Private App Builder design preferences were cleared.");
          }else setDesignMemoryNotice(cleared?.reason||
            "BUSY could not clear design history.");
          setDesignMemoryBusy(false);
        }}]);
  };
  const prepareCoordinatedReview=(useIndustry=false)=>{
    const profile=useIndustry===true&&designMemory?.ok?designIndustry:"general";
    const baseline=coordinateVisualEvidence(config,{
      measured:measuredSuggestions?.suggestions||[],
      ai:visualReport?.suggestions||[],
      responsive:responsiveSuggestions
    });
    const guided=profile==="general"?nextDesignExperiment:industryDesignReview;
    const plan=guided?.preview?.ok?
      {...guided.preview,industryId:profile,
        explanations:guided.reasoning.map(x=>({
          field:x.field,value:x.value,
          source:["measured","ai","responsive"].includes(
            guided.proposed.find(p=>p.field===x.field)?.sources?.[0])?
              guided.proposed.find(p=>p.field===x.field).sources[0]:"manual",
          why:x.why+" "+x.ownerPreference+
            ". This is a reasoned suggestion, not a proven improvement.",
          tradeoff:x.tradeoff
        }))}:designMemory?.ok?{ok:false,
        reason:"Busy won't repeat an owner-rejected setting. No supported improvement remains from the current evidence."}:baseline;
    setVisualProposal(plan.ok?plan:null);
    setVisualSelected([]);
    setVisualNotice(plan.ok?
      "A coordinated PRIVATE alternative is ready. Review it at different widths and approve explicitly.":
      plan.reason);
    setVirtualSamples({});setVirtualAiReview(null);setVirtualNotice("");
  };
  // These captures are of customer-only views rendered at virtual widths.
  // Real phone/tablet device QA remains outstanding.
  const captureVirtualPair=async()=>{
    const width=capturePreset?.width;
    if(!width||!visualProposal?.ok||!virtualBeforeRef.current||
       !virtualAfterRef.current||virtualBusy)return;
    setVirtualBusy(true);setVirtualNotice("");setVirtualAiReview(null);
    try{
      if(!presetComparison?.ok)
        throw Error("Wait for comparable native layout measurements at this width.");
      const settings={format:"jpg",quality:0.25,result:"tmpfile"};
      const beforeUri=await captureRef(virtualBeforeRef.current,settings);
      const afterUri=await captureRef(virtualAfterRef.current,settings);
      const getPixels=uri=>new Promise((resolve,reject)=>
        Image.getSize(uri,(w,h)=>resolve({w,h}),reject));
      const [firstPixels,secondPixels]=await Promise.all([
        getPixels(beforeUri),getPixels(afterUri)
      ]);
      const makeReceipt=(uri,pixels)=>{
        const file=new ExpoFile(uri);
        if(!file.exists||Number(file.size)<512||Number(file.size)>590000||
           pixels.w<Math.floor(width*PixelRatio.get()*0.85))
          throw Error("This device could not verify the full layout-width image. A smaller width may work.");
        return {uri,appId,revision,layoutWidth:width,
          pixelWidth:Math.round(pixels.w),pixelHeight:Math.round(pixels.h),
          sizeBytes:Number(file.size),scope:"public_app_only"};
      };
      const before=makeReceipt(beforeUri,firstPixels),
        after=makeReceipt(afterUri,secondPixels);
      const pair=validateViewportPair({appId,revision,
        viewportId:capturePreset.id,before,after,operations:proposedOperations});
      if(!pair.ok)throw Error(pair.reason);
      if(Number(s.miniAppsView?.app?.draft_revision)!==revision||
         s.miniAppsView?.app?.id!==appId)
        throw Error("The app revision changed while capturing. No images were sent.");
      setVirtualSamples(previous=>({...previous,[capturePreset.id]:{
        pair,before,after,beforeQuality:presetBefore,afterQuality:presetAfter
      }}));
      setVirtualNotice("Captured both customer-only layouts at "+width+
        " points. Images are temporary local files; no upload has happened.");
    }catch(error){
      setVirtualNotice(String(error?.message||
        "This device could not capture both layouts. Nothing was uploaded.").slice(0,260));
    }finally{setVirtualBusy(false);}
  };
  const consentToCompareVirtualWidth=()=>{
    const sample=virtualSamples[virtualWidthId];
    if(!sample?.pair?.ok||!visualProposal?.ok||virtualBusy||
       visualAllowance?.enabled!==true||visualAllowance.remaining<1||
       JSON.stringify(sample.pair.operations)!==JSON.stringify(proposedOperations))return;
    Alert.alert("Review both screenshots with AI?",
      "These TWO owner-approved customer-only screenshots show a simulated "+
      capturePreset.width+"-point layout, NOT two tested physical devices. "+
      "This uses ONE of your monthly AI reviews. Each additional width requires another explicit approval and review allowance. No app changes are applied.",
      [{text:"Cancel",style:"cancel"},{text:"Approve one AI review",onPress:async()=>{
        setVirtualBusy(true);setVirtualNotice("");setVirtualAiReview(null);
        const result=await s.comparePrivateAppScreenshots?.({
          appId,expectedRevision:revision,
          beforeUri:sample.before.uri,afterUri:sample.after.uri,
          operations:sample.pair.operations,captureScope:"public_app_only"
        });
        if(result?.ok){
          setVirtualAiReview({viewportId:virtualWidthId,review:result.review});
          setVisualAllowance(result.status);
          setVirtualNotice("AI compared these owner-submitted virtual-width images. It did not inspect a physical tablet or certify layout quality.");
        }else setVirtualNotice(result?.reason||"This review was unavailable. Nothing changed.");
        setVirtualBusy(false);
      }}]);
  };
  const takeScreenCapture=async()=>{
    setCaptureBusy(true);setCaptureError("");setCapture(null);
    try{
      if(!appSurfaceRef.current)throw Error("Open the current customer-only app preview first.");
      // Capture precisely the public app surface, excluding editor toolbars,
      // account controls, messages and the rest of the device screen.
      const uri=await captureRef(appSurfaceRef.current,{
        format:"jpg",quality:0.4,result:"tmpfile"
      });
      const window=Dimensions.get("window");
      const proof=appVisibleCaptureReceipt({appId,revision,screenshotUri:uri,
        width:Math.round(window.width),height:Math.round(window.height),
        platform:Platform.OS,capturedAt:new Date().toISOString()});
      if(!proof.ok)throw Error(proof.reason||"Capture could not be checked.");
      setCapture({...proof,captureScope:"public_app_only",mimeType:"image/jpeg"});
      setVisualReport(null);setVisualProposal(null);
      setVisualAllowance(null);setVisualNotice("");
    }catch(error){
      setCaptureError(String(error?.message||"Could not capture this device screen.").slice(0,250));
    }finally{setCaptureBusy(false);}
  };
  const iterationRecheck=designCheckpoint?.ok?
    inspectApprovedAppIteration(designCheckpoint,{
      appId,revision,config,saveConfirmed:designCheckpoint.saveConfirmed
    }):null;
  const captureCurrent=currentAppVisibleCapture(capture,{appId,revision});
  const localDeviceEvidence=captureCurrent?summarizeLocalAppCapture({
    businessId:s.cloudWorkspace?.businessId||"",
    appId,revision,capture
  }):null;
  const pairedCurrent=pairedCapture?.revision===revision&&
    pairedCapture?.appId===appId&&visualProposal?.ok===true&&
    JSON.stringify(pairedCapture.operations)===
      JSON.stringify(visualProposal.operations||[visualProposal.operation]);
  const captureComparisonPair=async()=>{
    if(!visualProposal?.ok||!originalComparisonRef.current||
       !proposedComparisonRef.current)return;
    setPairBusy(true);setPairNotice("");setPairReview(null);setPairedCapture(null);
    try{
      const args={format:"jpg",quality:0.3,result:"tmpfile"};
      // Both image sources are customer-only rendered views. Never capture
      // the editor, owner profile, dashboard or any customer database.
      const beforeUri=await captureRef(originalComparisonRef.current,args);
      const afterUri=await captureRef(proposedComparisonRef.current,args);
      const device=Dimensions.get("window");
      const common={appId,revision,width:Math.round(device.width),
        height:Math.round(device.height),platform:Platform.OS,
        capturedAt:new Date().toISOString()};
      const first=appVisibleCaptureReceipt({...common,screenshotUri:beforeUri});
      const second=appVisibleCaptureReceipt({...common,screenshotUri:afterUri});
      if(!first.ok||!second.ok)throw Error(first.reason||second.reason||
        "The current preview could not be captured.");
      setPairedCapture({appId,revision,beforeUri,afterUri,
        operations:visualProposal.operations||[visualProposal.operation],
        source:"two_native_customer_only_preview_views",
        independentAuthenticityCheck:false,automatedPixelDiff:false});
      setPairNotice("Two real local screenshots captured from the original and proposed app views. They have not been sent to AI.");
    }catch(error){setPairNotice(String(error?.message||
      "Both visible app previews require a development build.").slice(0,235));}
    finally{setPairBusy(false);}
  };
  const consentToComparePair=()=>{
    if(!pairedCurrent||visualAllowance?.enabled!==true||
       visualAllowance.remaining<1||pairBusy)return;
    Alert.alert("Compare these two private app screenshots with AI?",
      "BUSY will send BOTH customer-facing images to the configured AI provider. This uses ONE of your business's monthly visual reviews. Images are not stored by BUSY; AI suggestions cannot edit or publish without another approval.",
      [{text:"Cancel",style:"cancel"},{text:"Approve comparison",onPress:async()=>{
        setPairBusy(true);setPairReview(null);setPairNotice("");
        const result=await s.comparePrivateAppScreenshots?.({
          appId,expectedRevision:revision,
          beforeUri:pairedCapture.beforeUri,afterUri:pairedCapture.afterUri,
          operations:pairedCapture.operations,captureScope:"public_app_only"
        });
        if(result?.ok){
          setPairReview(result.review);setVisualAllowance(result.status);
          setPairNotice("AI compared two owner-submitted previews. This is qualitative advice, not a measured pixel-difference test.");
        }else setPairNotice(result?.reason||
          "Comparison was unavailable. Your draft remains unchanged.");
        setPairBusy(false);
      }}]);
  };
  const refreshVisualAllowance=async()=>{
    const status=await s.checkPrivateAppVisualReview?.();
    setVisualAllowance(status||{enabled:false,remaining:0,
      reason:"App visual review is not available."});
  };
  const approveVisualAI=()=>{
    if(!captureCurrent||capture?.captureScope!=="public_app_only"||
      visualAllowance?.enabled!==true||visualAllowance.remaining<1||visualBusy)return;
    Alert.alert("Send this private app preview to AI?",
      "Only the owner-approved public-facing app preview image will be sent for a design-only review. One of this business's monthly AI reviews will be used. The screenshot will not be saved by BUSY. No changes are made automatically.",
      [{text:"Cancel",style:"cancel"},{text:"Approve one AI review",
        onPress:async()=>{
          setVisualBusy(true);setVisualNotice("");setVisualProposal(null);
          const result=await s.reviewPrivateAppScreenshot?.({
            appId,expectedRevision:revision,uri:capture.uri,
            captureScope:"public_app_only"
          });
          if(result?.ok){
            setVisualReport(result.review);
            setVisualAllowance(result.status);
            setVisualNotice("AI inspected this owner-submitted image. Compare the suggestions yourself; nothing was applied.");
          }else setVisualNotice(result?.reason||
            "AI review was unavailable. Your existing private app has not changed.");
          setVisualBusy(false);
        }}]);
  };
  return (
    <Shell
      s={s}
      title="Customer Preview"
      subtitle="See the Business App as a customer will see it before approving any public change."
      brandCue="V3.55 • real customer experience • immutable preview • explicit owner Go Live."
    >
      <Card
        eyebrow="Customer view"
        title="Review the experience, not the machinery"
        body={previewMatchesDraft?
          "This immutable preview matches your current private draft. Review it carefully before approving Go Live.":
          "This is a PRIVATE draft or earlier live view. Prepare a fresh immutable preview after editing before any Go Live approval."}
        footer="Opening this preview does not make anything public."
        tone="green"
      />
      {config&&appId&&revision>0?(
        <Card eyebrow="V3.168 • Intelligent app creation"
          title="Tailor this app to your business"
          body="BUSY can compare design ideas for different types of businesses. Choose the type yourself: no industry is inferred from private customer information."
          footer="This never enables bookings, sends customer messages, changes your draft or publishes an app.">
          <Button label={showIndustryReview?
              "Hide business design options":"Choose business type & review"}
            onPress={()=>setShowIndustryReview(x=>!x)}/>
          {showIndustryReview?(
            <>
              {INDUSTRY_PROFILES.map(profile=>(
                <Button key={"industry-"+profile.id}
                  label={(designIndustry===profile.id?"✓ ":"")+profile.label}
                  onPress={()=>{
                    setDesignIndustry(profile.id);
                    setVisualProposal(null);setVisualSelected([]);
                    setVirtualSamples({});setVisualNotice("");
                  }}/>
              ))}
              <Text style={styles.cardBody}>
                {industryDesignReview?.profile?.description||
                  "This draft needs a valid business type."}
              </Text>
              {(industryDesignReview?.customerJourney?.steps||[]).map(step=>(
                <View key={"industry-journey-"+step.id}>
                  <MetricRow left={step.label} right={step.status.replaceAll("_"," ")}/>
                  <Text style={styles.cardBody}>{step.detail}</Text>
                </View>
              ))}
              {industryDesignReview?.releaseIssues?.map(issue=>(
                <Text key={"industry-issue-"+issue.id} style={styles.cardBody}>
                  {"Before release: "+issue.message}
                </Text>
              ))}
              {!designMemory?.ok&&designIndustry!=="general"?(
                <Text style={styles.cardBody}>
                  Private design preferences are not connected yet. BUSY will not
                  guess which styles you previously rejected. Your current draft is safe.
                </Text>
              ):null}
              {designMemory?.ok&&industryDesignReview?.preview?.ok&&designIndustry!=="general"?(
                <>
                  <Text style={styles.cardBody}>
                    {"BUSY has "+industryDesignReview.proposed.length+
                    " reversible appearance idea(s). All require your approval."}
                  </Text>
                  {industryDesignReview.widthReview?.ok?(
                    <Text style={styles.cardBody}>
                      {"Rules-based layout checks at 320, 390 and 820 points: "+
                        industryDesignReview.widthReview.beforeWarnings+
                        " warning(s) before, "+
                        industryDesignReview.widthReview.afterWarnings+
                        " after. These are not visual screenshots or real-device tests."}
                    </Text>
                  ):null}
                  <Button label="Compare the proposed design with my original"
                    disabled={designMemoryBusy||!!s.miniAppsAction||virtualBusy}
                    onPress={()=>prepareCoordinatedReview(true)}/>
                </>
              ):(
                <Text style={styles.cardBody}>
                  BUSY is keeping your current design. There is no supported new
                  appearance change to suggest for this selection.
                </Text>
              )}
              <Text style={styles.cardBody}>
                BUSY marketplace and standalone packages use the same underlying
                app draft. Store acceptance and real booking/enquiry delivery
                still require separate end-to-end testing.
              </Text>
            </>
          ):null}
        </Card>
      ):null}
      {config&&appId&&revision>0?(
        <Card eyebrow="V3.166 • Your design preferences"
          title="Busy remembers your design choices"
          body="Only this business's supported layout choices, your feedback and limited measurement counts are used. No screenshots, private customer records or free-form notes are saved as learning history."
          footer="Owner feedback improves suggestion ranking. It does not retrain the AI model or prove a design is successful.">
          <Text style={styles.cardBody}>
            {nextDesignExperiment?.preview?.ok?
              designMemory?.ok?
                "BUSY has a private design idea based on checked layouts and your business preferences. You decide whether to use it.":
                "BUSY has a private design idea from layout checks. Personal design memory is not connected yet, so this idea is NOT preference-informed.":
              "BUSY is keeping your current design until there is a supported alternative worth reviewing."}
          </Text>
          {nextDesignExperiment?.preview?.ok?(
            <Button label={"Preview Busy’s "+nextDesignExperiment.proposed.length+
                " suggested improvement(s)"}
              disabled={designMemoryBusy||!!s.miniAppsAction||virtualBusy}
              onPress={prepareCoordinatedReview}/>
          ):null}
          <Button label={showDesignMemory?
              "Hide design memory details":"Why is Busy recommending these designs?"}
            onPress={()=>setShowDesignMemory(x=>!x)}/>
          {designMemoryNotice?(
            <Text style={styles.cardBody}>{designMemoryNotice}</Text>
          ):null}
          {showDesignMemory?(
            <>
              {designMemory?.ok?(
                <>
                  <MetricRow left="Private design decisions remembered"
                    right={String(designMemory.records.length)}/>
                  <MetricRow left="Disliked choices excluded"
                    right={String(nextDesignExperiment?.suppressed?.length||0)}/>
                  <MetricRow left="Repeated dislikes across revisions"
                    right={String(ownerPatterns?.repeatedDislikeCount||0)}/>
                  <MetricRow left="Mixed or changing preferences"
                    right={String(ownerPatterns?.mixedPreferenceCount||0)}/>
                  {(nextDesignExperiment?.reasoning||[]).slice(0,3).map((item,i)=>(
                    <View key={"design-reason-"+i}>
                      <MetricRow left={"BUSY proposes "+item.field} right={item.value}/>
                      <Text style={styles.cardBody}>{"Why: "+item.why}</Text>
                      <Text style={styles.cardBody}>{"Trade-off: "+item.tradeoff}</Text>
                    </View>
                  ))}
                  {(nextDesignExperiment?.suppressed||[]).slice(0,3).map((item,i)=>(
                    <Text key={"avoided-"+i} style={styles.cardBody}>
                      {"Avoided "+item.field+": "+item.value+". "+item.reason}
                    </Text>
                  ))}
                  {(rankedDesign?.recommended||[]).slice(0,3).map(item=>(
                    <View key={"learned-choice-"+item.field}>
                      <MetricRow left={"Consider "+item.field} right={item.value}/>
                      <Text style={styles.cardBody}>
                        {item.reason+". "+item.ownerPreference+
                          ". This is a recommendation, not a verified result."}
                      </Text>
                    </View>
                  ))}
                  {designMemory.records.slice(0,5).map((event,i)=>(
                    <MetricRow key={"decision-"+i}
                      left={event.field+" → "+event.value}
                      right={event.verdict.replaceAll("_"," ")+
                        " ("+(event.context==="preview"?"preview":"after saving")+")"}/>
                  ))}
                  <Button label={designMemoryBusy?
                      "Updating history…":"Refresh private design history"}
                    disabled={designMemoryBusy} onPress={refreshDesignMemory}/>
                  <Button label="Clear this business's design feedback"
                    disabled={designMemoryBusy||!!s.miniAppsAction}
                    onPress={clearDesignMemory}/>
                </>
              ):(
                <Text style={styles.cardBody}>
                  {designMemory?.reason||
                    "Loading this business's private design history. Live storage requires the new backend migration and deployment."}
                </Text>
              )}
            </>
          ):null}
        </Card>
      ):null}
      {iterationRecheck?.ok?(
        <Card eyebrow="V3.162 • Improvement cycle"
          title="Recheck your approved private design"
          body={iterationRecheck.allSettingsApplied?
            "The approved design settings are present in the new private revision.":
            "Some approved settings did not match the current draft. Review before proceeding."}
          tone={iterationRecheck.allSettingsApplied?"green":"amber"}
          footer="A configuration recheck is not visual proof. Capture the updated customer view below and approve another AI review separately if needed.">
          <MetricRow left="Private draft revision" right={String(revision)}/>
          <MetricRow left="Settings correctly applied"
            right={iterationRecheck.settings.filter(x=>x.applied).length+
              " of "+iterationRecheck.settings.length}/>
          <MetricRow left="Configuration flags resolved"
            right={String(iterationRecheck.resolvedStaticFlags.length)}/>
          <MetricRow left="New configuration flags"
            right={String(iterationRecheck.newStaticFlags.length)}/>
          {iterationRecheck.newStaticFlags.map(key=>(
            <MetricRow key={key} left="Review new warning" right={key.replaceAll("_"," ")}/>
          ))}
          <Text style={styles.cardBody}>
            {iterationRecheck.nextAction}
          </Text>
          {designOutcome?.ok?(
            <Text style={styles.cardBody}>
              {"BUSY's assessment: "+designOutcome.assessment.replaceAll("_"," ")+
              ". Owner feedback and layout warnings cannot prove customer success."}
            </Text>
          ):null}
          {iterationRecheck.allSettingsApplied?(
            <>
              <Text style={styles.sectionLabel}>How is the saved design?</Text>
              <Text style={styles.cardBody}>
                This is your judgement AFTER the design was saved to the
                private draft, not a claim of improved bookings or sales.
              </Text>
              <Button label="Better — remember this preference"
                disabled={designMemoryBusy||!!s.miniAppsAction}
                onPress={()=>recordDesignChoice("better","saved_revision")}/>
              <Button label="Worse — remember this preference"
                disabled={designMemoryBusy||!!s.miniAppsAction}
                onPress={()=>recordDesignChoice("worse","saved_revision")}/>
              <Button label="Not quite right — try something else next time"
                disabled={designMemoryBusy||!!s.miniAppsAction}
                onPress={()=>recordDesignChoice("not_quite_right","saved_revision")}/>
            </>
          ):null}
          {savedMeasurementReview?.ok?(
            <>
              <Text style={styles.sectionLabel}>V3.164 • New rendered geometry</Text>
              <MetricRow left="Previously measured warnings"
                right={String(savedMeasurementReview.beforeWarnings)}/>
              <MetricRow left="Warnings in new private revision"
                right={String(savedMeasurementReview.afterWarnings)}/>
              <MetricRow left="No longer flagged"
                right={String(savedMeasurementReview.noLongerFlagged.length)}/>
              <MetricRow left="New warnings to inspect"
                right={String(savedMeasurementReview.newlyFlagged.length)}/>
              <Text style={styles.cardBody}>
                Both revisions had real component layout observations at
                the same width. This is not proof that images or accessibility
                improved. Inspect the new screenshot before release.
              </Text>
            </>
          ):null}
        </Card>
      ):null}
      {config&&appId&&revision>0?(
        <Card eyebrow="V3.164 • On-device visual quality"
          title="Inspect what BUSY actually rendered"
          body="Read local measurements of public-app navigation labels, service cards and photo frames. Nothing is uploaded; no customer text, photo URLs or image content enters this report."
          footer="Wrapped labels and aspect-ratio cropping warnings are hints to inspect. This is not a completed accessibility test."
          tone="blue">
          <Button label={qualityEnabled?
              "Stop local component inspection":"Inspect rendered layout (no AI cost)"}
            onPress={()=>{
              setQualityEnabled(v=>!v);
              setCurrentMeasurements([]);setBeforeMeasurements([]);
              setAfterMeasurements([]);setCurrentMeasuredWidth(0);
              setBeforeMeasuredWidth(0);setAfterMeasuredWidth(0);
            }}/>
          {qualityEnabled?(
            <>
              <MetricRow left="Rendered components measured"
                right={String(measuredReport?.ok?measuredReport.measuredComponents:0)}/>
              <MetricRow left="Actual content width"
                right={currentMeasuredWidth?currentMeasuredWidth+" layout points":"Waiting for layout"}/>
              <MetricRow left="Warnings to review"
                right={String(measuredReport?.ok?measuredReport.issueCount:0)}/>
              {(measuredReport?.issues||[]).slice(0,8).map(issue=>(
                <Text key={issue.id} style={styles.cardBody}>{issue.message}</Text>
              ))}
              {measuredReport?.unmeasuredImageCount?(
                <Text style={styles.cardBody}>
                  {measuredReport.unmeasuredImageCount+
                    " images lack decoded source dimensions, so cropping cannot be assessed."}
                </Text>
              ):null}
              {measuredSuggestions?.suggestions?.length?(
                <Text style={styles.cardBody}>
                  BUSY has identified supported alternatives to preview. Nothing
                  is edited automatically.
                </Text>
              ):null}
            </>
          ):null}
          <Text style={styles.cardBody}>
            Use the simple recommendation above to prepare a private,
            reversible design. Owner approval is required before saving.
          </Text>
          <Text style={styles.cardBody}>
            BUSY prioritises real local measurements, then separately consented
            AI observations, then no-cost responsive rules. The result is an
            unsaved plan with no more than three supported appearance changes.
          </Text>
        </Card>
      ):null}
      {config&&appId&&revision>0?(
        <Card eyebrow="V3.164 • Private app design reviewer"
          title="Inspect your real app preview"
          body="Capture ONLY the rendered customer-facing app area. Account controls, editing tools and private customer records are excluded. This is an owner-submitted screenshot, not independent device verification."
          footer="Local capture is free. AI review requires separate opt-in, configured usage allowance and approval for each submission."
          tone="blue">
          <Button label={captureBusy?"Capturing app preview…":"Capture visible screen (app only)"}
            disabled={captureBusy} onPress={takeScreenCapture}/>
          {captureError?<Text style={styles.cardBody}>{captureError}</Text>:null}
          {captureCurrent?(
            <>
              <MetricRow left="Device window (layout points)" right={capture.platform+" • "+
                capture.width+" × "+capture.height}/>
              {localDeviceEvidence?.ok?(
                <Text style={styles.cardBody}>
                  {"V3.174 • Local device capture recorded for "+
                    localDeviceEvidence.logicalWidth+
                    " layout points on "+localDeviceEvidence.platform+
                    ". The screenshot is still local. Other devices, full "+
                    "screen scrolling and accessibility remain unverified."}
                </Text>
              ):null}
              <Text style={styles.cardBody}>
                Check readability, image cropping, touch targets and spacing.
                This image contains the public preview only; no upload occurs
                unless you separately approve an AI review.
              </Text>
              <Image source={{uri:capture.uri}} resizeMode="contain"
                style={{width:"100%",height:295,borderRadius:12,marginTop:10}}/>
              <Button label="Check my private AI design review allowance"
                disabled={visualBusy}
                onPress={refreshVisualAllowance}/>
              {visualAllowance?(
                <Text style={styles.cardBody}>
                  {visualAllowance.enabled?
                    visualAllowance.remaining+" of "+visualAllowance.monthlyLimit+
                    " monthly reviews available.":visualAllowance.reason}
                </Text>
              ):null}
              {visualAllowance?.enabled===true&&visualAllowance.remaining>0?(
                <Button label={visualBusy?"Reviewing screenshot…":"Ask AI to inspect this screenshot"}
                  disabled={visualBusy||!!s.miniAppsAction}
                  onPress={approveVisualAI}/>
              ):null}
            </>
          ):null}
          {visualNotice?<Text style={styles.cardBody}>{visualNotice}</Text>:null}
              {displayedReview?.ok?(
                <>
                  <Text style={styles.sectionLabel}>
                    {visualReport?.ok?"AI design observations":"Measured layout observations (no AI)"}
                  </Text>
                  <Text style={styles.cardBody}>{displayedReview.summary}</Text>
                  {(displayedReview.observations||[]).map((item,i)=>(
                    <MetricRow key={"observed-"+i} left={"Observation "+(i+1)}
                      right={item}/>
                  ))}
                  <Text style={styles.sectionLabel}>
                    Choose up to three suggestions to preview together
                  </Text>
                  {(displayedReview.suggestions||[]).map((item,i)=>(
                    <Button key={"visual-proposal-"+i}
                      label={(visualSelected.includes(i)?"✓ ":"")+
                        item.field+": "+item.value}
                      disabled={!!s.miniAppsAction}
                      onPress={()=>{
                        setVisualSelected(previous=>previous.includes(i)?
                          previous.filter(n=>n!==i):
                          previous.length>=3?previous:[...previous,i]);
                        setVisualProposal(null);setPairedCapture(null);
                        setPairReview(null);setPairNotice("");
                      }}/>
                  ))}
                  {displayedReview.suggestions?.length?(
                    <Button label={"Preview "+visualSelected.length+" design change(s) together"}
                      disabled={!visualSelected.length||!!s.miniAppsAction}
                      onPress={()=>{
                        const chosen=displayedReview.suggestions
                          .filter((_,index)=>visualSelected.includes(index));
                        const proposed=prepareAppVisualBatch(config,chosen);
                        setVisualProposal(proposed.ok?proposed:null);
                        setPairedCapture(null);setPairReview(null);
                        setPairNotice("");
                        if(!proposed.ok)setVisualNotice(proposed.reason);
                      }}/>
                  ):null}
                  {!displayedReview.suggestions?.length&&!visualProposal?.ok?(
                    <Text style={styles.cardBody}>
                      No additional supported design suggestion was available
                      from this review.
                    </Text>
                  ):null}
                  <Text style={styles.cardBody}>
                    A single screenshot does not prove good design on other devices.
                    BUSY has not edited, published or verified working bookings.
                  </Text>
                  {visualProposal?.ok?(
                    <>
                      <Text style={styles.sectionLabel}>Alternative private design</Text>
                      <Text style={styles.cardBody}>
                        {(visualProposal.changes||[]).join("; ")||
                          visualProposal.reason||
                          "Review this alternative against your current private draft."}
                      </Text>
                      {(()=>{
                        const comparison=compareBusinessAppDesign(config,
                          visualProposal.nextConfig);
                        return comparison.ok?(
                          <>
                            <MetricRow left="Change being compared"
                              right={comparison.changes.map(x=>
                                x.label+": "+x.from+" → "+x.to).join("; ")}/>
                            <MetricRow left="Change affects customer records"
                              right={comparison.designOnly?"No":"Review required"}/>
                          </>
                        ):null;
                      })()}
                      <Button label={visualCompareSide==="original"?
                          "✓ Original design":"Show original design"}
                        onPress={()=>setVisualCompareSide("original")}/>
                      <Button label={visualCompareSide==="proposed"?
                          "✓ Suggested design":"Show suggested design"}
                        onPress={()=>setVisualCompareSide("proposed")}/>
                      <MiniAppSurface config={visualCompareSide==="original"?
                        config:visualProposal.nextConfig}/>
                      <Text style={styles.sectionLabel}>Actual rendered before / after</Text>
                      <Text style={styles.cardBody}>
                        These are separate customer-only native preview surfaces.
                        Scroll to inspect them before capturing. Captures are local
                        unless you explicitly approve a two-image AI review.
                      </Text>
                      <Text style={styles.sectionLabel}>Original private app</Text>
                      <View ref={originalComparisonRef} collapsable={false}>
                        <MiniAppSurface
                          key={"original-"+proposedDesignKey+"-"+qualityEnabled}
                          config={config}
                          onQualityObservation={qualityEnabled?collectBefore:null}
                          onMeasuredWidth={qualityEnabled?setBeforeMeasuredWidth:null}/>
                      </View>
                      <Text style={styles.sectionLabel}>Proposed private app</Text>
                      <View ref={proposedComparisonRef} collapsable={false}>
                        <MiniAppSurface
                          key={"proposed-"+proposedDesignKey+"-"+qualityEnabled}
                          config={visualProposal.nextConfig}
                          onQualityObservation={qualityEnabled?collectAfter:null}
                          onMeasuredWidth={qualityEnabled?setAfterMeasuredWidth:null}/>
                      </View>
                      {geometryComparison?.ok?(
                        <>
                          <Text style={styles.sectionLabel}>Measured layout comparison</Text>
                          <MetricRow left="Original component warnings"
                            right={String(geometryComparison.beforeIssueCount)}/>
                          <MetricRow left="Proposed component warnings"
                            right={String(geometryComparison.afterIssueCount)}/>
                          <MetricRow left="No longer flagged"
                            right={String(geometryComparison.noLongerFlagged.length)}/>
                          <MetricRow left="New flags"
                            right={String(geometryComparison.newlyFlagged.length)}/>
                          <Text style={styles.cardBody}>
                            Based on native layout events at the same actual
                            content width. The original is unchanged until
                            you approve a private revision. No pixel-level
                            screenshot comparison is implied.
                          </Text>
                        </>
                      ):qualityEnabled?(
                        <Text style={styles.cardBody}>
                          Waiting for both original and proposed customer previews
                          to report comparable native layout geometry.
                        </Text>
                      ):null}
                      <Text style={styles.sectionLabel}>
                        V3.165 • Compare across three layout widths
                      </Text>
                      <Text style={styles.cardBody}>
                        Select a width, inspect the actual native-rendered customer
                        components and capture the original and proposed views.
                        These are simulated layout widths on THIS device, not
                        independent hardware tests. The tablet-width image may be
                        unsupported on a narrow phone.
                      </Text>
                      <View style={{flexDirection:"row",flexWrap:"wrap",gap:6}}>
                        {VIEWPORTS.map(item=>(
                          <Button key={item.id}
                            label={(virtualWidthId===item.id?"✓ ":"")+item.width+" pt"}
                            disabled={virtualBusy}
                            onPress={()=>setVirtualWidthId(item.id)}/>
                        ))}
                      </View>
                      <MetricRow left="Selected virtual layout width"
                        right={String(capturePreset?.width||0)+" points"}/>
                      <Text style={styles.sectionLabel}>Original customer layout</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator>
                        <View ref={virtualBeforeRef} collapsable={false}
                          style={{width:capturePreset?.width||320}}>
                          <MiniAppSurface key={"width-before-"+virtualWidthId}
                            config={config}
                            onQualityObservation={collectVirtualBefore}
                            onMeasuredWidth={setVirtualBeforeWidth}/>
                        </View>
                      </ScrollView>
                      <Text style={styles.sectionLabel}>Proposed customer layout</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator>
                        <View ref={virtualAfterRef} collapsable={false}
                          style={{width:capturePreset?.width||320}}>
                          <MiniAppSurface key={"width-after-"+virtualWidthId}
                            config={visualProposal.nextConfig}
                            onQualityObservation={collectVirtualAfter}
                            onMeasuredWidth={setVirtualAfterWidth}/>
                        </View>
                      </ScrollView>
                      {presetComparison?.ok?(
                        <>
                          <MetricRow left="Original geometry warnings"
                            right={String(presetComparison.beforeIssueCount)}/>
                          <MetricRow left="Proposed geometry warnings"
                            right={String(presetComparison.afterIssueCount)}/>
                          <MetricRow left="Warnings no longer flagged"
                            right={String(presetComparison.noLongerFlagged.length)}/>
                          <MetricRow left="New warnings to inspect"
                            right={String(presetComparison.newlyFlagged.length)}/>
                        </>
                      ):(
                        <Text style={styles.cardBody}>
                          Waiting for comparable component measurements from
                          both customer-only views at this width.
                        </Text>
                      )}
                      <Button label={virtualBusy?"Capturing layouts…":
                        "Capture original and proposed at "+capturePreset?.width+" pt"}
                        disabled={virtualBusy||!presetComparison?.ok||!!s.miniAppsAction}
                        onPress={captureVirtualPair}/>
                      {virtualSamples[virtualWidthId]?.pair?.ok?(
                        <>
                          <Text style={styles.sectionLabel}>
                            Local screenshots at this width
                          </Text>
                          <Image source={{uri:virtualSamples[virtualWidthId].before.uri}}
                            resizeMode="contain"
                            style={{width:"100%",height:175,marginBottom:6}}/>
                          <Image source={{uri:virtualSamples[virtualWidthId].after.uri}}
                            resizeMode="contain"
                            style={{width:"100%",height:175,marginBottom:6}}/>
                          {visualAllowance===null?(
                            <Button label="Check private AI review allowance"
                              disabled={virtualBusy} onPress={refreshVisualAllowance}/>
                          ):null}
                          {visualAllowance?.enabled&&visualAllowance.remaining>0?(
                            <Button label={virtualBusy?"Comparing with AI…":
                              "Ask AI to compare these two screenshots (one credit)"}
                              disabled={virtualBusy||!!s.miniAppsAction}
                              onPress={consentToCompareVirtualWidth}/>
                          ):null}
                          {visualAllowance?.enabled===false?(
                            <Text style={styles.cardBody}>
                              {visualAllowance.reason||"Visual AI is not configured."}
                            </Text>
                          ):null}
                        </>
                      ):null}
                      {virtualNotice?(
                        <Text style={styles.cardBody}>{virtualNotice}</Text>
                      ):null}
                      {virtualAiReview?.viewportId===virtualWidthId&&
                        virtualAiReview.review?.ok?(
                        <>
                          <Text style={styles.sectionLabel}>
                            AI assessment for this one width
                          </Text>
                          <Text style={styles.cardBody}>
                            {virtualAiReview.review.summary}
                          </Text>
                          {(virtualAiReview.review.observations||[]).map((finding,i)=>(
                            <MetricRow key={"virtual-ai-"+i}
                              left={"Finding "+(i+1)} right={finding}/>
                          ))}
                        </>
                      ):null}
                      {multiviewAssessment?.ok?(
                        <>
                          <Text style={styles.sectionLabel}>
                            Local review across captured widths
                          </Text>
                          <MetricRow left="Simulated widths inspected"
                            right={String(multiviewAssessment.inspectedWidthCount)}/>
                          <MetricRow left="Warnings no longer flagged"
                            right={String(multiviewAssessment.warningsNoLongerFlagged)}/>
                          <MetricRow left="New warnings across captured widths"
                            right={String(multiviewAssessment.newWarnings)}/>
                          {multiviewAssessment.comparisons.map(result=>(
                            <MetricRow key={result.viewportId}
                              left={result.width+" pt layout"}
                              right={result.beforeFlags+" → "+result.afterFlags+
                                " geometry warnings"}/>
                          ))}
                          <Text style={styles.cardBody}>
                            These comparisons do not validate text readability,
                            photographs or interactions on separate physical devices.
                            Nothing is published or automatically changed.
                          </Text>
                        </>
                      ):null}
                      {visualProposal.explanations?.length?(
                        <>
                          <Text style={styles.sectionLabel}>
                            Why BUSY prepared these coordinated changes
                          </Text>
                          {visualProposal.explanations.map(item=>(
                            <View key={"reason-"+item.field}>
                              <Text style={styles.cardBody}>
                                {item.field+": "+item.value+" ("+item.source+")"}
                              </Text>
                              <Text style={styles.cardBody}>{"Why: "+item.why}</Text>
                              <Text style={styles.cardBody}>
                                {"Trade-off: "+item.tradeoff}
                              </Text>
                            </View>
                          ))}
                        </>
                      ):null}
                      <Button label={pairBusy?"Capturing / reviewing…":"Capture both rendered app views"}
                        disabled={pairBusy||!!s.miniAppsAction}
                        onPress={captureComparisonPair}/>
                      {pairedCurrent?(
                        <>
                          <Text style={styles.sectionLabel}>Local before / after screenshots</Text>
                          <Image source={{uri:pairedCapture.beforeUri}} resizeMode="contain"
                            style={{width:"100%",height:245,marginBottom:8,borderRadius:12}}/>
                          <Image source={{uri:pairedCapture.afterUri}} resizeMode="contain"
                            style={{width:"100%",height:245,marginBottom:8,borderRadius:12}}/>
                          {visualAllowance===null?(
                            <Button label="Check my AI comparison allowance"
                              onPress={refreshVisualAllowance}/>
                          ):null}
                          {visualAllowance?.enabled&&visualAllowance.remaining>0?(
                            <Button label={pairBusy?"Comparing with AI…":"Ask AI to compare both screenshots"}
                              disabled={pairBusy||!!s.miniAppsAction}
                              onPress={consentToComparePair}/>
                          ):null}
                        </>
                      ):null}
                      {pairNotice?<Text style={styles.cardBody}>{pairNotice}</Text>:null}
                      {pairReview?.ok?(
                        <>
                          <Text style={styles.sectionLabel}>AI before / after observations</Text>
                          <Text style={styles.cardBody}>{pairReview.summary}</Text>
                          {(pairReview.observations||[]).map((observation,i)=>(
                            <MetricRow key={"pair-observation-"+i}
                              left={"Finding "+(i+1)} right={observation}/>
                          ))}
                          <Text style={styles.cardBody}>
                            AI did not independently authenticate the images,
                            measure pixel differences or inspect other devices.
                            Your existing design stays unchanged until approval.
                          </Text>
                        </>
                      ):null}
                      <Text style={styles.sectionLabel}>Your preference before saving</Text>
                      <Text style={styles.cardBody}>
                        BUSY can remember which version you favour. This
                        does not apply or publish either version.
                      </Text>
                      <Button label="Prefer proposed design — remember"
                        disabled={designMemoryBusy||!!s.miniAppsAction}
                        onPress={()=>recordDesignChoice("better","preview")}/>
                      <Button label="Keep original — remember what I disliked"
                        disabled={designMemoryBusy||!!s.miniAppsAction}
                        onPress={()=>recordDesignChoice("worse","preview")}/>
                      <Button label="Try another design — remember"
                        disabled={designMemoryBusy||!!s.miniAppsAction}
                        onPress={()=>recordDesignChoice("not_quite_right","preview")}/>
                      <Button primary label={"Approve "+(visualProposal.operations?.length||1)+
                        " PRIVATE design change(s)"}
                        disabled={!!s.miniAppsAction}
                        onPress={async()=>{
                          const operations=visualProposal.operations||
                            [visualProposal.operation];
                          const prepared=prepareAppDesignIteration({
                            appId,revision,config,operations
                          });
                          if(!prepared.ok){
                            setPairNotice(prepared.reason);
                            return;
                          }
                          const saved=await s.saveCoordinatedAppChanges?.({
                            appId,expectedRevision:revision,operations
                          });
                          if(saved?.ok){
                            if(saved.newRevision===prepared.expectedAfterRevision)
                              setDesignCheckpoint({...prepared,saveConfirmed:true,
                                priorRenderedQuality:measuredReport?.ok?
                                  measuredReport:null});
                            setVisualProposal(null);setVisualReport(null);setCapture(null);
                            setPairedCapture(null);setPairReview(null);
                            setVisualSelected([]);
                            setVisualNotice("The approved change was saved to your PRIVATE draft. Prepare another preview to inspect it.");
                          }else setVisualNotice("The private draft could not be safely updated. Refresh and retry.");
                        }}/>
                      <Button label="Keep my original design" onPress={()=>setVisualProposal(null)}/>
                    </>
                  ):null}
                </>
              ):null}
        </Card>
      ):null}
      {config ? (
        <View ref={appSurfaceRef} collapsable={false}>
          <MiniAppSurface key={"current-"+appId+"-"+revision+"-"+qualityEnabled} businessContent={s.miniAppsView?.app?.businessContent||null}
            config={config}
            onQualityObservation={qualityEnabled?collectCurrent:null}
            onMeasuredWidth={qualityEnabled?setCurrentMeasuredWidth:null}/>
        </View>
      ) : (
        <Card
          eyebrow="Preview"
          title="No Business App draft yet"
          body="Build the private Business App before opening the customer preview."
          tone="amber"
        />
      )}
      {previewMatchesDraft && view.canPublish && view.previewVersion ? (
        <Card
          eyebrow="Owner approval"
          title="Happy with what customers will see?"
          body={`Business App v${view.previewVersion.version_no} is frozen and ready. Go Live will publish exactly this preview.`}
          footer="Marketplace listing is a separate choice inside the approval dialog."
          tone="amber"
        >
          <Button
            label={
              s.miniAppsAction === "publish"
                ? "Publishing…"
                : "Review & approve Go Live"
            }
            primary
            disabled={!!s.miniAppsAction}
            onPress={() =>
              s.confirmPublishMiniApp(view.previewVersion.id)
            }
          />
        </Card>
      ) : null}
      <Button
        label="Back to Business App Builder"
        onPress={() => s.go("miniAppBuilder")}
      />
    </Shell>
  );
}

function BusyAppDetail({ s }) {
  // A different account, app or published version starts a separate form.
  const detail=s.selectedBusyAppDetail;
  return <BusyAppDetailForm key={[s.ownerSession?.userId||"",detail?.app?.id||"",detail?.version?.id||"",JSON.stringify(detail?.entryContentInterest?.selection||null)].join(":")} s={s}/>;
}
function BusyAppDetailForm({ s }) {
  const requestUserId=s.ownerSession?.userId;
  const detail = s.selectedBusyAppDetail || {};
  const config = detail?.version?.config || null;
  const requestScroll=React.useRef(null),requestFormY=React.useRef(null);
  const [requestKind,setRequestKind]=React.useState(config?.modules?.some(m=>m.enabled&&m.key==='enquiry')?'enquiry':'booking_request');
  const goToRequest=type=>{
    if(['enquiry','booking_request'].includes(type)&&config?.modules?.some(m=>m.enabled&&m.key===type)){
      if(type==='booking_request'&&contentInterest)setContentNotice('The selected product or event is an enquiry. Remove that selection before switching to a booking request.');
      else setRequestKind(type);
    }
    if(Number.isFinite(requestFormY.current))requestScroll.current?.scrollTo?.({y:Math.max(0,requestFormY.current-12),animated:true});
  };
  const saved=s.readBusyAppCustomerForm?.()||{};
  const initial=detail.entryContentInterest;
  const [name, setName] = React.useState(saved.name||"");
  const [email, setEmail] = React.useState(saved.email||"");
  const [phone, setPhone] = React.useState(saved.phone||"");
  const [service, setService] = React.useState(saved.service??initial?.service??"");
  const [date, setDate] = React.useState(saved.date||"");
  const [note, setNote] = React.useState(saved.note||"");
  const [message, setMessage] = React.useState(saved.message??initial?.message??"");

  const [contentInterest,setContentInterest]=React.useState(Object.hasOwn(saved,'contentInterest')?saved.contentInterest:initial?.selection??null);
  const [contentNotice,setContentNotice]=React.useState(detail.entryContentNotice||'');
  const [requirements,setRequirements]=React.useState(saved.requirements||emptyEnquiryRequirements());
  const recoveryDraft={name,email,phone,service,message,contentInterest,requirements};
  const privateRecovery=useCustomerEnquiryRecovery({userId:s.ownerSession?.userId,detail,draft:recoveryDraft,
    onRestore:value=>{setName(value.name);setEmail(value.email);setPhone(value.phone);setService(value.service);setMessage(value.message);setContentInterest(value.contentInterest);setRequirements(value.requirements||emptyEnquiryRequirements());}});
  React.useEffect(()=>{s.saveBusyAppCustomerForm?.({name,email,phone,service,date,note,message,contentInterest,requirements});},[name,email,phone,service,date,note,message,contentInterest,requirements]);
  const chooseContent=(label,prepared)=>{
    const checked=prepareBusinessContentEnquiry(detail.businessContent,detail.app?.business_id,prepared?.selection);
    if(!checked.ok){setContentNotice(checked.reason);return;}
    const stamp=formLive.current,selectedUser=s.ownerSession?.userId;
    const apply=()=>{
      if(!formAlive.current||formLive.current!==stamp||s.selectedBusyAppDetail!==detail||s.ownerSession?.userId!==selectedUser){setContentNotice('Your draft or app changed. Choose the listing again; your newer details were kept.');return;}
      const fresh=prepareBusinessContentEnquiry(s.selectedBusyAppDetail?.businessContent,detail.app?.business_id,checked.selection);
      if(!fresh.ok){setContentNotice(fresh.reason);return;}
      setService(fresh.service);setMessage(fresh.message);setContentInterest(fresh.selection);setContentNotice('Selected item added to your enquiry. Review the message before sending.');goToRequest('enquiry');};
    if(message.trim())Alert.alert('Replace this enquiry draft?','Your current message will be replaced by the selected listing context.',[{text:'Keep my message',style:'cancel'},{text:'Use selected item',onPress:apply}]);else apply();
  };
  const chooseService=(label,kind,topic)=>{
    const type=['enquiry','booking_request'].includes(kind)?kind:config?.modules?.some(m=>m.enabled&&m.key==='enquiry')?'enquiry':'booking_request';
    if(!config?.modules?.some(m=>m.enabled&&m.key===type))return;
    const question=topic?prepareServiceQuestion(config?.publicProfile?.services||[],label,topic):null;
    if(topic&&(!question?.ok||type!=='enquiry')){setContentNotice(question?.reason||'Choose an enquiry question.');return;}
    const stamp=formLive.current,selectedUser=s.ownerSession?.userId;
    const apply=()=>{
      if(!formAlive.current||formLive.current!==stamp||s.selectedBusyAppDetail!==detail||s.ownerSession?.userId!==selectedUser){setContentNotice('Your draft changed. Choose the service again; your newer details were kept.');return;}
      setService(label);setRequestKind(type);if(question){setContentInterest(null);setMessage(question.message);setContentNotice('Question prepared, not sent. Add your requirements and review before confirming.');}else if(contentInterest){setContentInterest(null);setMessage("I'd like to ask about "+label+'.');setContentNotice('Selected listing removed. Review your service enquiry before sending.');}else if(type==='enquiry'&&!message.trim())setMessage("I'd like to ask about "+label+'.');goToRequest();};
    if(question&&message.trim())Alert.alert('Replace this enquiry message?','Your existing message will be replaced by the service question. Contact details and requirements will be kept.',[{text:'Keep my message',style:'cancel'},{text:'Use question',onPress:apply}]);else if(contentInterest)Alert.alert('Replace the selected listing?','This removes the product or event selection and replaces its enquiry message with the selected service.',[{text:'Keep selected item',style:'cancel'},{text:'Use service',onPress:apply}]);else apply();
  };
  const enabled = new Set(
    (config?.modules || [])
      .filter((item) => item.enabled)
      .map((item) => item.key)
  );

  const formLive=React.useRef(null),formAlive=React.useRef(true);
  formLive.current=JSON.stringify([name,email,phone,service,date,note,message,contentInterest,requirements]);
  React.useEffect(()=>{formAlive.current=true;return()=>{formAlive.current=false;};},[]);
  const requestInput={name,email,phone,service,preferredDate:date,note,message};
  const preparedBookingNote=prepareCustomerBookingNote(note,requirements);
  const bookingReady=preparedBookingNote.ok?validateNativeGuestRequest('booking_request',{...requestInput,note:preparedBookingNote.note}):preparedBookingNote;
  const preparedEnquiry=prepareCustomerEnquiry({message,requirements,feed:detail.businessContent,businessId:detail.app?.business_id,selection:contentInterest});
  const enquiryReady=preparedEnquiry.ok?validateNativeGuestRequest('enquiry',{...requestInput,message:preparedEnquiry.message}):preparedEnquiry;
  const serviceChoices=searchPublicNativeServices(config?.publicProfile?.services||[],service.slice(0,80)).slice(0,8);
  const preferredDates=React.useMemo(()=>nativePreferredDates(new Date(),7),[]);
  const reviewScope=JSON.stringify([s.ownerSession?.userId,detail.app?.business_id,detail.app?.id,detail.version?.id,requestKind]);
  const [bookingReview,setBookingReview]=React.useState(null),bookingConfirming=React.useRef(false);
  const currentBookingReview=bookingReady.ok&&!contentInterest?customerEnquiryReview(bookingReady.payload,reviewScope,formLive.current,'booking_request'):null;
  const bookingLive=React.useRef(null);bookingLive.current={key:currentBookingReview?.key,detail};
  const bookingReviewCurrent=!!bookingReview&&bookingReview.key===currentBookingReview?.key;
  const submitBooking = async () => {
    if(!bookingReady.ok||contentInterest||bookingConfirming.current||!formAlive.current||!enabled.has('booking_request'))return false;
    if(!currentBookingReview||bookingLive.current?.key!==currentBookingReview.key||bookingLive.current?.detail!==detail)return false;
    if(!bookingReviewCurrent){setBookingReview(currentBookingReview);return false;}
    const reviewed=formLive.current;
    setBookingReview(null);bookingConfirming.current=true;
    let ok=false;
    try{ok=await s.submitBusyAppRequest('booking_request',bookingReview.payload);}
    finally{bookingConfirming.current=false;}
    if (ok&&formAlive.current&&formLive.current===reviewed) {
      setService("");
      setDate("");
      setNote("");
      setRequirements(emptyEnquiryRequirements());
    }
  };

  const [enquiryReview,setEnquiryReview]=React.useState(null);
  const enquiryConfirming=React.useRef(false);

  const currentEnquiryReview=enquiryReady.ok?customerEnquiryReview(enquiryReady.payload,reviewScope,formLive.current):null;
  const enquiryLive=React.useRef(null);enquiryLive.current={key:currentEnquiryReview?.key,detail};
  const enquiryReviewCurrent=!!enquiryReview&&enquiryReview.key===currentEnquiryReview?.key;
  const submitEnquiry = async () => {
    if(!enquiryReady.ok||enquiryConfirming.current||!formAlive.current)return false;
    if(contentInterest){const checked=prepareBusinessContentEnquiry(detail.businessContent,detail.app?.business_id,contentInterest);if(!checked.ok){setContentNotice(checked.reason);return false;}}
    if(!currentEnquiryReview||enquiryLive.current?.key!==currentEnquiryReview.key||enquiryLive.current?.detail!==detail)return false;
    if(!enquiryReviewCurrent){setEnquiryReview(currentEnquiryReview);return false;}
    const reviewed=formLive.current;
    setEnquiryReview(null);
    enquiryConfirming.current=true;
    let ok=false;
    try{ok=await s.submitBusyAppRequest("enquiry", enquiryReview.payload);}
    finally{enquiryConfirming.current=false;}
    if(ok)privateRecovery.clearIfSame(recoveryDraft).catch(()=>{});
    if (ok&&formAlive.current&&formLive.current===reviewed) {setMessage("");setContentInterest(null);setRequirements(emptyEnquiryRequirements());s.saveBusyAppCustomerForm?.({name,email,phone,service,date,note,message:"",contentInterest:null,requirements:emptyEnquiryRequirements()});}
  };

  return (
    <Shell
      s={s}
      title={detail?.app?.name || "Business App"}
      subtitle="Customer-facing business app inside BUSY."
      brandCue="V3.55 • live Business App • customer requests • loyalty progress."
      scrollRef={requestScroll}
    >
      {detail?.entryIntent ? (
        <Card
          eyebrow="From the web Business App"
          title={
            detail.entryIntent === "booking_request"
              ? "Continue your booking request"
              : "Continue your enquiry"
          }
          body={
            detail.entryIntent === "booking_request"
              ? "BUSY kept the business and action you chose on the public web Business App. Complete the request below; it is still only a request until the business confirms it."
              : "BUSY kept the business and action you chose on the public web Business App. Complete the enquiry below and it will go to the right business."
          }
          tone="green"
        />
      ) : null}
      {(enabled.has('enquiry')||enabled.has('booking_request'))?<Button label={(requestKind==='booking_request'?bookingReviewCurrent:enquiryReviewCurrent)?'Return to my reviewed request':'Return to my request draft'} disabled={!!s.miniAppsAction} onPress={()=>{if(formAlive.current&&s.selectedBusyAppDetail===detail&&s.ownerSession?.userId===requestUserId)goToRequest();}}/>:null}
      {config?.contentLayout?.length?<Button label="Refresh products and events" disabled={!!s.miniAppsAction} onPress={()=>s.openBusyAppDetail(detail.app.slug)}/>:null}
      {config ? (
        <MiniAppSurface
          config={config}
          interactive
          s={s}
          loyaltyProgress={detail?.loyaltyProgress || null}
          businessContent={detail.businessContent}
          catalogueContextKey={JSON.stringify([s.ownerSession?.userId||'',detail.app?.business_id||'',detail.app?.id||'',detail.version?.id||''])}
          onSelectService={enabled.has('enquiry')||enabled.has('booking_request')?chooseService:null}
          onRequestNavigation={goToRequest}
          onSelectContent={enabled.has('enquiry')?chooseContent:null}
        />
      ) : null}
      <Card
        eyebrow="My BUSY Apps"
        title={detail?.app?.favorite ? "★ Favourite" : "This app is saved to your history"}
        body="Opening a BUSY Business App automatically keeps it in My BUSY Apps so you can return without searching again."
        footer="Favourites stay pinned above recently used apps."
        tone={detail?.app?.favorite ? "green" : "blue"}
      >
        <Button
          label={detail?.app?.favorite ? "Remove favourite" : "Add to favourites"}
          disabled={s.miniAppsAction === `favorite:${detail?.app?.slug}`}
          onPress={() =>
            s.toggleBusyAppFavorite(
              detail?.app?.slug,
              !detail?.app?.favorite
            )
          }
        />
      </Card>



      {s.miniAppsNotice&&(!s.latestCustomerRequestOutcome?.ok||
        s.latestCustomerRequestOutcome.businessAppId===detail?.app?.id) ? (
        <Card
          eyebrow="BUSY"
          title="Request update"
          body={s.miniAppsNotice}
          tone="green"
        />
      ) : null}
      {s.latestCustomerRequestOutcome?.ok===true&&
        s.latestCustomerRequestOutcome.businessAppId===detail?.app?.id?(
        <Card eyebrow="What Busy has verified"
          title="Earlier saved request — separate from this draft"
          body={s.latestCustomerRequestOutcome.evidenceLevel===
            "authenticated_customer_readback"?
            "Busy checked the saved request after an interrupted response.":
            "The server confirmed the saved request."}
          tone="blue">
          <Text style={styles.cardBody}>
            This does not yet verify that a notification arrived, the
            business replied, or an appointment was confirmed.
          </Text>
          <Text style={styles.cardBody}>This receipt does not show that the currently edited form was sent. A changed request needs its own exact review and submission.</Text>
          {typeof s.latestCustomerRequestOutcome.requestId==='string'&&/^[a-zA-Z0-9_-]{1,120}$/.test(s.latestCustomerRequestOutcome.requestId)?<Text selectable style={styles.cardBody}>{'Saved request reference: '+s.latestCustomerRequestOutcome.requestId}</Text>:null}
          <Button label="Review My BUSY Apps"
            onPress={()=>s.go("busyAppsMarketplace")}/>
        </Card>
      ):null}

      {s.miniAppsError ? (
        <Card
          eyebrow="BUSY Apps"
          title="Could not complete that action"
          body={s.miniAppsError}
          tone="amber"
        />
      ) : null}

      <BusinessAppCustomerRequestFields s={s} form={{returnToInformation:()=>requestScroll.current?.scrollTo?.({y:0,animated:true}),bookingReview:bookingReviewCurrent?bookingReview:null,cancelBookingReview:()=>setBookingReview(null),enquiryReview:enquiryReviewCurrent?enquiryReview:null,cancelEnquiryReview:()=>setEnquiryReview(null),requirements,setRequirements,requestKind,setRequestKind,enabled,name,email,phone,service,date,note,message,contentNotice,contentInterest,preferredDates,serviceChoices,bookingReady,enquiryReady,privateRecovery,setName,setEmail,setPhone,setService,setDate,setNote,setMessage,setContentInterest,setContentNotice,submitBooking,submitEnquiry}} onLayout={event=>{requestFormY.current=event.nativeEvent.layout.y;}}/>
      <Button label="Back to BUSY Apps" onPress={() => s.go("busyAppsMarketplace")} />
    </Shell>
  );
}

function MiniAppShareCentre({ s }) {
  const view = s.miniAppsView || {};
  const links = s.miniAppShareLinks || {};
  const entryCounts = view.entryCounts || { bySource: {}, byStage: {} };
  const webViewCount = Number(
    entryCounts.byStage?.web_view || entryCounts.byStage?.landing || 0
  );
  const actionIntentCount = Number(entryCounts.byStage?.action_intent || 0);
  const appOpenCount = Number(entryCounts.byStage?.app_open || 0);
  const requestCount = Number(view.requestCount30 || 0);
  const guestRequestCount = Number(view.guestRequestCount30 || 0);
  const qrCount = Number(entryCounts.bySource?.qr || 0);
  const shareCount = Number(entryCounts.bySource?.share || 0);

  return (
    <Shell
      s={s}
      title="Share Business App"
      subtitle="Give customers an install-free web view of this business's live BUSY Business App."
      brandCue="V3.55 • stable QR/share links • install-free guest requests • live Business App delivery."
    >
      {view.hasLive && links.qr ? (
        <>
          <Card
            eyebrow="Customer QR code"
            title={view.displayName || "Your BUSY Business App"}
            body="Customers can scan this code from a counter sign, van, leaflet, website or another phone and immediately browse the live Business App in their web browser."
            footer="No BUSY install or sign-in is needed just to browse. The stable HTTPS QR can later gain App Store fallback without changing the printed code."
            tone="green"
          >
            <View style={{ alignItems: "center", paddingVertical: 18 }}>
              <QRCode value={links.qr} size={220} />
            </View>
            <Button label="Share customer link" primary onPress={s.shareMiniAppCustomerLink} />
            <Button label="Open customer link" onPress={() => s.openMiniAppCustomerLink("share")} />
          </Card>

          <Card
            eyebrow="Direct entry"
            title="One business, one stable public slug"
            body="Marketplace listing and exact-link access stay separate. The public web experience is rendered from the immutable live Business App version, so unlisting the business from search does not break its owner-shared QR code."
            footer={`Native route: ${links.native || "Not ready"}`}
            tone="blue"
          >
            <MetricRow left="Marketplace" right={view.isDiscoverable ? "Listed" : "Unlisted"} />
            <MetricRow left="Public web" right={view.webReady ? "Ready" : "Needs republish"} strong={view.webReady} />
            <MetricRow
              left="Guest web forms"
              right={view.guestWebReady ? "Ready" : "Republish live version to enable"}
              strong={view.guestWebReady}
            />
            <MetricRow left="Live version" right={view.liveVersion ? `v${view.liveVersion.version_no}` : "Not live"} strong />
          </Card>

          <Text style={styles.sectionLabel}>Last 30 days</Text>
          <Card
            eyebrow="Customer-entry signals"
            title="See the customer journey without inflating results"
            body="BUSY keeps public web views, action attempts, authenticated app opens and genuine requests separate. A scan or page view is never counted as an enquiry or booking."
            tone="blue"
          >
            <MetricRow left="Web Business App views" right={String(webViewCount)} strong={webViewCount > 0} />
            <MetricRow left="Contact / booking attempts" right={String(actionIntentCount)} strong={actionIntentCount > 0} />
            <MetricRow left="Opened in BUSY" right={String(appOpenCount)} strong={appOpenCount > 0} />
            <MetricRow left="Genuine requests" right={String(requestCount)} strong={requestCount > 0} />
            <MetricRow left="Guest web requests" right={String(guestRequestCount)} strong={guestRequestCount > 0} />
            <MetricRow left="QR-attributed entry" right={String(qrCount)} />
            <MetricRow left="Shared-link entry" right={String(shareCount)} />
          </Card>

          <Card
            eyebrow="Guest customer entry"
            title="Browse and contact the business without installing BUSY"
            body={
              view.guestWebReady
                ? "V3.45 lets a customer submit an enquiry or booking request directly from the public web Business App. BUSY uses a short-lived browser challenge, a hidden bot trap and server-side rate limits before the request enters the business workflow."
                : "This live web artifact was published before V3.45 guest forms. Republish the current Business App version through the normal owner approval flow to add guest enquiry and booking forms without changing the saved business content."
            }
            footer="The browser challenge reduces automated spam but does not prove ownership of the email address or phone number typed by the customer. Booking requests are still requests, never silent confirmed diary entries."
            tone="blue"
          />
        </>
      ) : (
        <Card
          eyebrow="Share Business App"
          title="Publish the Business App first"
          body="BUSY only creates customer entry links and QR codes for a genuinely live Business App."
          tone="amber"
        />
      )}

      <Button label="Back to Business App Builder" onPress={() => s.go("miniAppBuilder")} />
    </Shell>
  );
}

function MiniAppRequestDetail({ s }) {
 const request=s.selectedMiniAppRequestDetail?.request;
 return <MiniAppRequestDetailForm key={[s.ownerSession?.userId,s.cloudWorkspace?.businessId,s.selectedMiniAppRequestRole,request?.id].join(':')} s={s}/>;
}
function MiniAppRequestDetailForm({ s }) {
  const detail = s.selectedMiniAppRequestDetail || {};
  const request = detail.request || null;
  const role = s.selectedMiniAppRequestRole || "customer";
  const [draft, setDraftValue] = React.useState("");
  const replyTyping=React.useRef(0);
  const setDraft=value=>{replyTyping.current++;liveReply.current=value;setDraftValue(value);};
  const [reviewedReplyStamp,setReviewedReplyStamp]=React.useState(null);
  const liveReply=React.useRef(null),replyAlive=React.useRef(true);liveReply.current=draft;
  const liveReplyContext=React.useRef(s);liveReplyContext.current=s;
  React.useEffect(()=>{replyAlive.current=true;return()=>{replyAlive.current=false;};},[]);
  const ownerView = role === "business";
  React.useEffect(()=>{
    setReviewedReplyStamp(null);
    setDraft("");
  },[request?.id,role]);
  const accountReview=detail.accountBookingReview;
  const accountContext=accountBookingContext(accountReview,{ownerId:s.ownerSession?.userId,businessId:s.cloudWorkspace?.businessId,role:s.cloudWorkspace?.role,request,customers:s.customers,lastSimulatedRecipients:s.lastSimulatedRecipients,replyActions:s.replyActions,revision:s.cloudRevision});
  const guestWebRequest = request?.request_origin === "guest_web";
  const followUpSuggestion=request?.id?
    s.miniAppsView?.followUpIntelligence?.items?.find(item=>
      item.requestId===request.id&&
      item.appId===request.mini_app_id):null;
  const link = request?.id ? s.miniAppsView?.linkByRequest?.get?.(request.id) || null : null;
  const journey=request?appRequestJourney(request,link):null;
  const experienceMessage=request?describeRequestExperience(request,link,{
    audience:ownerView?"business":"customer"}):null;

  const send = async () => {
    const originalDraft=draft;
    const body = draft.trim();
    if (!request?.id || !body) return;
    const stamp=ownerView&&
      reviewedReplyStamp?.requestId===request.id&&
      reviewedReplyStamp?.appId===request.mini_app_id?
      reviewedReplyStamp.sourceStamp:null;
    const ok = ownerView
      ? await s.sendMiniAppRequestMessage(request.id, body,
          {reviewedFollowupStamp:stamp})
      : await s.replyBusyAppRequestMessage(request.id, body);
    if (ok&&replyAlive.current&&liveReply.current===originalDraft) {
      setDraft("");
      setReviewedReplyStamp(null);
    }
  };

  return (
    <Shell
      s={s}
      title={ownerView ? request?.contact_name || "Customer request" : detail.app?.display_name || "BUSY request"}
      subtitle={
        ownerView
          ? guestWebRequest
            ? "Public web guest request"
            : "Business App customer conversation"
          : "Your conversation with this business"
      }
      brandCue="V3.55 • request conversation • real BUSY booking bridge • signed-in loyalty progress."
    >
      {s.miniAppRequestHistoryLoading && !request ? (
        <Card eyebrow="Conversation" title="Loading…" body="BUSY is loading the latest request activity." tone="blue" />
      ) : request ? (
        <>
          <Card
            eyebrow={request.request_type === "booking_request" ? "Booking request" : "Enquiry"}
            title={detail.app?.display_name || detail.app?.name || (ownerView ? request.contact_name || "Customer" : "BUSY business")}
            body={
              request.request_type === "booking_request"
                ? [
                    request.service_name || request.payload?.service || "Service not stated",
                    request.preferred_date_text || request.payload?.preferredDate || "Date/time still to agree",
                  ].filter(Boolean).join(" • ")
                : request.payload?.message || "Customer enquiry"
            }
            footer={experienceMessage?.ok?"Status: "+experienceMessage.title:
              `Status: ${String(request.status || "received").replaceAll("_", " ")}`}
            tone={experienceMessage?.confirmationRecorded?"green":
              ["declined", "closed"].includes(request.status)?"amber":"blue"}
          >
            {ownerView ? (
              <>
                <MetricRow left="Contact" right={request.contact_phone || request.contact_email || "Not supplied"} />
                <MetricRow
                  left="Request source"
                  right={guestWebRequest ? "Public web guest" : "Signed-in BUSY customer"}
                  strong={guestWebRequest}
                />
                {guestWebRequest ? (
                  <MetricRow
                    left="Identity assurance"
                    right="Browser challenge passed • contact details self-reported"
                  />
                ) : null}
              </>
            ) : null}
            {ownerView && !link ? (
              <Button
                label={request.request_type === "booking_request" ? "Create BUSY customer + Draft booking" : "Add to BUSY customer journey"}
                primary
                disabled={!!s.miniAppsAction}
                onPress={() => s.bridgeMiniAppRequestIntoBusy(request.id)}
              />
            ) : null}
            {ownerView && ownerRequestActionsV3233({request,link}).canReview ? (
              <Button
                label="Mark reviewing"
                disabled={!!s.miniAppsAction}
                onPress={() => s.updateMiniAppRequestStatus(request.id, "reviewing", request)}
              />
            ) : null}
            {ownerView && ownerRequestActionsV3233({request,link}).canDecline ? (
              <Button
                label="Decline request"
                disabled={!!s.miniAppsAction}
                onPress={() => s.updateMiniAppRequestStatus(request.id, "declined", request)}
              />
            ) : null}
          </Card>

          {journey?(
            <Card eyebrow="Request progress" title={experienceMessage?.ok?
                experienceMessage.title:journey.type==="booking_request"?
                "Booking request — follow the real diary":"Enquiry — follow the response"}
              body={experienceMessage?.ok?
                experienceMessage.explanation:journey.customerMessage}
              footer="The same tracked request is used in the marketplace and standalone app. Acceptance alone does not make an appointment."
              tone={experienceMessage?.confirmationRecorded?"green":"blue"}>
              {(experienceMessage?.ok?experienceMessage.stageLabels:
                journey.stages).map(step=>(
                <MetricRow key={step.key} left={step.label}
                  right={step.complete?"Recorded":"Waiting"}/>
              ))}
              {experienceMessage?.ok?(
                <>
                  <Text style={styles.sectionLabel}>What happens next?</Text>
                  <Text style={styles.cardBody}>{experienceMessage.nextStep}</Text>
                  {experienceMessage.inconsistentRecords?(
                    <Text style={styles.cardBody}>
                      BUSY cannot verify this booking from the request and diary
                      statuses shown here. Check both records before confirming.
                    </Text>
                  ):null}
                </>
              ):null}
            </Card>
          ):null}
          {ownerView?(
            <Card eyebrow="BUSY verification"
              title="Check the customer request reached this business"
              body="Busy can check the exact saved request in your authenticated business inbox, including older requests not shown in the recent list."
              tone="blue">
              <Button label="Verify this request in my inbox"
                disabled={!!s.miniAppsAction}
                onPress={()=>s.verifyOwnerRequestInbox(request.id)}/>
            </Card>
          ):null}
          {s.latestCommunicationEvidence?.ok&&
            s.latestCommunicationEvidence.requestId===request.id?(
            <Card eyebrow="What Busy verified"
              title={s.latestCommunicationEvidence.kind==="business_request_inbox_evidence_v3205"?
                "Saved in this business inbox":"Reply saved in BUSY"}
              body={s.latestCommunicationEvidence.summary}
              tone="blue">
              <Text style={styles.cardBody}>
                A saved record is not proof that a notification arrived or
                that the customer saw a reply. Booking confirmation requires
                its own verified diary entry.
              </Text>
            </Card>
          ):null}
          {ownerView&&!guestWebRequest&&!["declined","closed"].includes(request.status)?(
            <Card eyebrow="Busy checks before recommending"
              title="Check if this request needs a reply"
              body={followUpSuggestion?.category==="needsReply"?
                "The recent activity suggests this customer may need a reply. Busy must check the current saved messages first.":
                "Busy will check the latest recorded activity in this exact conversation before suggesting anything."}
              tone="blue">
              <Button label={s.ownerFollowupBusy?
                "Checking saved messages…":"Check latest conversation"}
                disabled={!!s.miniAppsAction||!!s.ownerFollowupBusy}
                onPress={()=>s.checkOwnerFollowup(request.id)}/>
              {s.ownerFollowupReview?.ok&&
                s.ownerFollowupReview.requestId===request.id&&
                s.ownerFollowupReview.businessId===request.business_id&&
                s.ownerFollowupReview.appId===request.mini_app_id?(
                <View>
                  {s.ownerFollowupReview.nextStep?.ok?(
                    <Card eyebrow="BUSY suggests"
                      title={s.ownerFollowupReview.nextStep.title}
                      body={s.ownerFollowupReview.nextStep.explanation}
                      footer="Suggestion only. BUSY has not contacted the customer or confirmed a booking."
                      tone="blue" />
                  ):null}
                  {s.ownerFollowupReview.outcomeEvidence?.ok?(
                    <Text style={styles.cardBody}>
                      {s.ownerFollowupReview.outcomeEvidence.summary}
                    </Text>
                  ):null}
                  <Text style={styles.cardBody}>
                    {s.ownerFollowupReview.why}
                  </Text>
                  {s.ownerFollowupReview.mayPrepareDraft?(
                    <View>
                      <Text style={styles.sectionLabel}>Private reply suggestion</Text>
                      {s.ownerFollowupReview.preparation?(
                        <View>
                          <Text style={styles.cardBody}>{s.ownerFollowupReview.preparation.subject}</Text>
                          <Text style={styles.cardBody}>{s.ownerFollowupReview.preparation.answerSource==='no_verified_answer'?'No verified answer found. Check the details before making a commitment.':'Uses current approved business information. Review its suitability before sending; availability and commitments still need checking.'}</Text>
                          {s.ownerFollowupReview.preparation.missingInformation.map((item,index)=><Text key={index} style={styles.cardBody}>{item}</Text>)}
                        </View>
                      ):null}
                      <Text style={styles.cardBody}>
                        {s.ownerFollowupReview.draft}
                      </Text>
                      <Button label="Use as an editable draft"
                        disabled={!!s.miniAppsAction||!!s.ownerFollowupBusy}
                        onPress={()=>{
                          const stamp=s.ownerFollowupReview.sourceStamp;
                          const epoch=replyTyping.current,originalWords=liveReply.current,review=s.ownerFollowupReview;
                          let consumed=false;
                          const current=()=>{const now=liveReplyContext.current;return replyAlive.current&&replyTyping.current===epoch&&liveReply.current===originalWords&&now.ownerSession?.userId===s.ownerSession?.userId&&now.cloudWorkspace?.businessId===s.cloudWorkspace?.businessId&&now.selectedMiniAppRequestRole===role&&now.selectedMiniAppRequestDetail?.request===request&&now.ownerFollowupReview===review&&review.sourceStamp===stamp;};
                          const apply=async()=>{
                            if(consumed||!current())return false;consumed=true;
                            const confirmed=await s.prepareVerifiedOwnerFollowupDraft(
                              request.id,stamp);
                            if(!current())return false;
                            if(confirmed?.ok&&confirmed.sourceStamp&&
                               confirmed.requestId===request.id&&
                               confirmed.appId===request.mini_app_id){
                              setDraft(confirmed.draft);
                              setReviewedReplyStamp({
                                requestId:request.id,
                                appId:request.mini_app_id,
                                sourceStamp:confirmed.sourceStamp
                              });
                              return true;
                            }else{
                              Alert.alert("Review the latest conversation",
                                confirmed?.reason||
                                "Busy couldn't verify that this reply is still appropriate.");
                            }
                          };
                          if(draft.trim()){
                            Alert.alert("Replace your current reply?",
                              "Busy will check the current saved messages again before replacing your unsent text. Nothing will be sent.",[
                                {text:"Keep my text",style:"cancel",onPress:()=>{consumed=true;}},
                                {text:"Recheck and use draft",onPress:apply}
                              ]);
                          }else return apply();
                        }}/>
                    </View>
                  ):null}
                </View>
              ):null}
              <Text style={styles.cardBody}>
                Busy only prepares text. You decide whether to send it.
                A saved reply is not proof a notification was delivered.
              </Text>
            </Card>
          ):null}
          {ownerView&&request.request_type==='booking_request'?<Card eyebrow="Returning to work" title="Inspect this account booking" body="Check one current account customer and Work action. This does not restore the workspace or settle an uncertain booking.">
            <Button label="Inspect current account customer and Work" disabled={s.cloudWorkspace?.role!=='owner'} onPress={()=>{const epoch=replyTyping.current;return s.inspectMiniAppAccountBooking?.(request.id,{isCurrent:()=>replyAlive.current&&replyTyping.current===epoch});}}/>
            {!accountContext?<Text accessibilityLiveRegion="polite" style={styles.helper}>{s.cloudWorkspace?.role!=='owner'?'Owner-private account inspection is unavailable for this role.':'No supported account context is verified here. Inspect again; missing, changed, inaccessible or unsupported records cannot be restored from this view.'}</Text>:null}
            {accountContext?<View>
              <Text style={styles.sectionLabel}>{detail.accountBookingReview.customer.name+' · '+detail.accountBookingReview.customer.service}</Text>
              <Text accessibilityLiveRegion="polite" style={styles.cardBody}>Last checked account version — read-only. This is not a recovered editable customer or a save receipt.</Text>
              <Text style={styles.cardBody}>{{missing:'No corresponding customer is loaded on this device. You can inspect this account observation without restoring a customer.',ambiguous:'Device identity is ambiguous. No customer can be safely selected from these copies.',foreign:'A device record has a different business identity. It was not used.',unsupported:'The device customer has no matching supported booking source. Nothing was combined.',matching:'The listed device facts match this account observation. This does not confirm a save or settle an earlier uncertain operation.',different:'The device and account facts differ. Your device copy and unsaved work are kept; no automatic replacement is available.'}[accountContext.device]}</Text>
              {accountContext.revisionDiffers?<Text style={styles.helper}>Account and device revisions differ. Inspecting this booking does not update the rest of your workspace.</Text>:null}
              <Details label="Read-only customer and source references"><Text selectable style={styles.cardBody}>{'Customer '+accountReview.customer.id+' · Work '+accountReview.action.id+' · request '+accountReview.requestId+' · account revision '+accountReview.revision}</Text><Text style={styles.cardBody}>{'Request checked: '+accountReview.requestRevision+' · Work checked: '+accountReview.workRevision}</Text><Text style={styles.helper}>Contact details, private notes, replies and unrelated records are not included. Open only the supported diary context below; broad customer editing remains unavailable.</Text></Details>
              <Text style={styles.cardBody}>{'Account booking: '+detail.accountBookingReview.action.status+' · '+detail.accountBookingReview.action.date+' '+detail.accountBookingReview.action.time}</Text>
              <Text style={styles.cardBody}>{'Work diary: '+detail.accountBookingReview.ledger.date+' '+detail.accountBookingReview.ledger.time+' · '+detail.accountBookingReview.ledger.timeZone}</Text>
              <Text style={styles.cardBody}>{detail.accountBookingReview.matchesLedger?'These account and Work facts agree. No local customer was inserted and no own-operation receipt was reconstructed.':'Account and Work facts differ. Keep current work and review the source; no automatic repair is available.'}</Text>
              <Button label="Review account booking day in diary" disabled={!!draft.trim()||!detail.accountBookingReview.matchesLedger} onPress={()=>{if(liveReply.current?.trim())return false;const epoch=replyTyping.current;return s.inspectMiniAppAccountBooking?.(request.id,{navigate:'diary',isCurrent:()=>replyAlive.current&&replyTyping.current===epoch});}}/>
              {draft.trim()?<Text style={styles.helper}>Your unfinished conversation wording is kept. Finish or clear it deliberately before leaving this context.</Text>:null}
            </View>:null}
          </Card>:null}
          {ownerView && link?.bridge_state === "booking_draft" ? (
            <Card
              eyebrow="BUSY booking"
              title="Booking request linked • confirmation still required"
              body="BUSY has created the draft booking from this customer request. Open it to choose/confirm the real diary date and time."
              footer="The customer is not told the booking is confirmed until you confirm it in BUSY."
              tone="amber"
            >
              <Button
                label="Open BUSY booking to confirm"
                primary
                onPress={() => s.openMiniAppLinkedBooking(request.id)}
              />
            </Card>
          ) : null}

          {ownerView && link?.bridge_state === "booking_confirmed" ? (
            <Card
              eyebrow="BUSY booking"
              title={experienceMessage?.confirmationRecorded?
                "Booking confirmed":"Check booking request status"}
              body={experienceMessage?.confirmationRecorded?
                "The linked diary confirms a booking and the customer request is accepted.":
                "The linked diary has a confirmation marker, but this request does not yet agree. Verify the two records before informing the customer."}
              tone={experienceMessage?.confirmationRecorded?"green":"amber"}
            >
              <Button
                label="Open linked BUSY booking"
                onPress={() => s.openMiniAppLinkedBooking(request.id)}
              />
            </Card>
          ) : null}

          {detail.loyaltyProgress ? (
            <Card
              eyebrow="Loyalty"
              title={
                detail.loyaltyProgress.programName ||
                "Customer loyalty progress"
              }
              body={
                detail.loyaltyProgress.rewardReached
                  ? `Reward reached: ${detail.loyaltyProgress.reward || "reward"}`
                  : `${detail.loyaltyProgress.stamps || 0}/${detail.loyaltyProgress.targetStamps || 0} stamps • ${detail.loyaltyProgress.remaining || 0} to go`
              }
              footer={
                detail.loyaltyProgress.terms ||
                "The business records eligible stamps manually."
              }
              tone={detail.loyaltyProgress.rewardReached ? "green" : "blue"}
            >
              {ownerView ? (
                <Button
                  label={
                    s.miniAppsAction === `loyalty:${request.id}`
                      ? "Recording stamp…"
                      : detail.loyaltyProgress.rewardReached
                      ? "Reward target reached"
                      : "Record 1 eligible loyalty stamp"
                  }
                  primary={!detail.loyaltyProgress.rewardReached}
                  disabled={
                    !!s.miniAppsAction ||
                    !!detail.loyaltyProgress.rewardReached
                  }
                  onPress={() =>
                    s.awardMiniAppLoyaltyStamp(request.id)
                  }
                />
              ) : null}
            </Card>
          ) : null}

          <Text style={styles.sectionLabel}>{guestWebRequest && ownerView ? "Request activity" : "Conversation & request activity"}</Text>
          <Card
            eyebrow="Latest activity"
            title={guestWebRequest && ownerView ? "Guest request timeline" : "One shared request timeline"}
            body={
              guestWebRequest && ownerView
                ? "Lifecycle events stay attached to this request. The guest can check its status from the same browser receipt, but BUSY chat replies are not delivered to guest web customers in V3.45."
                : "Messages and real request-status events stay attached to this request. BUSY does not turn internal drafts into customer-facing confirmations."
            }
            tone="blue"
          >
            <RequestTimeline messages={detail.messages || []} events={detail.events || []} />
            {detail.nextBefore ? (
              <Button
                label={s.miniAppRequestHistoryLoading ? "Loading earlier…" : "Load earlier messages"}
                disabled={s.miniAppRequestHistoryLoading}
                onPress={s.loadEarlierMiniAppRequestMessages}
              />
            ) : null}
          </Card>

          {!["declined", "closed"].includes(request.status) ? (
            guestWebRequest && ownerView ? (
              <Card
                eyebrow="Guest follow-up"
                title="Use the supplied contact details for replies"
                body="This customer submitted from the public web Business App without a BUSY account. V3.45 deliberately does not pretend an in-app message will reach them. Use the supplied email or phone while their browser receipt continues to show genuine request-status changes."
                footer={request.contact_email || request.contact_phone || "No contact details supplied"}
                tone="amber"
              />
            ) : (
              <Card
                eyebrow="Reply"
                title={ownerView ? "Reply to customer" : "Reply to business"}
                body="Your message stays inside this request conversation."
                tone="green"
              >
                <Field
                  label="Message"
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={ownerView ? "Write a customer update…" : "Write a reply…"}
                  multiline
                />
                {ownerView&&reviewedReplyStamp?.requestId===request.id?(
                  <Text style={styles.cardBody}>
                    Busy will check the latest customer conversation once
                    more before sending this reviewed follow-up. If anything
                    has changed, the reply will need another review.
                  </Text>
                ):null}
                <Button
                  label={s.miniAppsAction?.includes("message:") ? "Sending…" : "Send message"}
                  primary
                  disabled={!draft.trim() || !!s.miniAppsAction}
                  onPress={send}
                />
              </Card>
            )
          ) : null}
        </>
      ) : (
        <Card eyebrow="Conversation" title="Request unavailable" body={s.miniAppsError || "BUSY could not load this request."} tone="amber" />
      )}

      <Button
        label={ownerView ? "Back to Business App Builder" : "Back to My BUSY Apps"}
        onPress={() => (ownerView ? s.go("miniAppBuilder") : s.go("busyAppsMarketplace"))}
      />
    </Shell>
  );
}

export {
  MiniAppSurface,
  BusyAppsMarketplace,
  MiniAppBuilder,
  MiniAppPreview,
  BusyAppDetail,
  MiniAppShareCentre,
  MiniAppRequestDetail,
};

