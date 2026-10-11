import React from "react";
import { Image, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { styles } from "../theme/styles";
import { Shell, Card, Button, Field, MetricRow, StatusChip } from "../components/ui";
import { miniAppModuleLabel } from "../domain/miniApps";
import { businessAppPreviewProof } from "../core/businessAppPreviewProof.mjs";
import { buildAppDistributionPlan,buildStandalonePrivateHandoff } from "../core/appDistributionChoices.mjs";
import { planFunctionalBusinessApp } from "../core/appExperiencePlanner.mjs";
import { previewPrivateAppAppearance,OPTIONS as appAppearanceOptions } from "../core/appAppearanceEditing.mjs";
import { interpretSelectedAppAppearance } from "../core/appContextInstruction.mjs";
import {orderedAppModules,proposeAppSectionMove} from "../core/appSectionOrder.mjs";
import {proposeCoordinatedAppChanges,planAppVoiceInstructions} from "../core/appCoordinatedStudio.mjs";
import {appDesignQualityReport} from "../core/appDesignQuality.mjs";
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

function MiniAppSurface({
  config,
  interactive = false,
  s = null,
  loyaltyProgress = null,
}) {
  const profile = config?.publicProfile || {};
  const modules = orderedAppModules(config);
  const services = Array.isArray(profile?.services) ? profile.services : [];
  const gallery = Array.isArray(profile?.assets?.gallery)
    ? profile.assets.gallery.filter((item) => String(item?.uri || "").startsWith("https://"))
    : [];
  const heroUri = String(profile?.assets?.hero?.uri || "");
  const loyalty = config?.loyalty || {};
  const offers = (Array.isArray(config?.offers) ? config.offers : []).filter(
    offerActiveToday
  );
  const presentation=config?.presentation||{};
  const density=presentation.layoutDensity||"comfortable";
  const headerStyle=presentation.headerStyle||"refined";

  return (
    <>
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
        <Text style={styles.cardBody}>{"App layout: "+density+" • Header: "+headerStyle+
          " • Navigation: "+(presentation.navigationStyle||"tabs")}</Text>
        {heroUri.startsWith("https://") ? (
          <Image
            source={{ uri: heroUri }}
            resizeMode="cover"
            style={{
              width: "100%",
              height: presentation.imageScale==="large"?320:density==="compact"?172:density==="airy"?285:230,
              borderRadius: 18,
              marginBottom: 14,
            }}
          />
        ) : null}
        <MetricRow left="Powered by" right="BUSY DOES IT" strong />
      </Card>

      {modules.map((module) => {
        if (module.key === "business_profile") {
          return (
            <Card
              key={module.key}
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
          );
        }

        if (module.key === "services") {
          return (
            <View key={module.key}>
              <Text style={styles.sectionLabel}>Services</Text>
              {services.length ? (
                services.map((service) => (
                  <Card
                    key={service.id || service.name}
                    eyebrow="Service"
                    title={service.name || "Service"}
                    body={
                      service.description ||
                      "Contact the business for more information."
                    }
                    tone="blue"
                  />
                ))
              ) : (
                <Card
                  eyebrow="Services"
                  title="Services still need adding"
                  body="BUSY will not invent services just to fill the Business App."
                  tone="amber"
                />
              )}
            </View>
          );
        }

        if (module.key === "gallery") {
          return (
            <View key={module.key}>
              <Text style={styles.sectionLabel}>Gallery</Text>
              {gallery.length ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {gallery.slice(0, 12).map((asset, index) => (
                    <Image
                      key={asset.key || asset.uri || `gallery-${index}`}
                      source={{ uri: asset.uri }}
                      resizeMode="cover"
                      style={{
                        width: presentation.imageScale==="large"?"100%":"48%",
                        height: presentation.imageScale==="large"?245:150,
                        borderRadius: 14,
                        marginBottom: 8,
                      }}
                    />
                  ))}
                </View>
              ) : (
                <Card
                  eyebrow="Gallery"
                  title="No approved photos yet"
                  body="Only imagery approved for public business use is shown here."
                  tone="amber"
                />
              )}
            </View>
          );
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
    </>
  );
}

function BusyAppsMarketplace({ s }) {
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
      {s.myBusyAppsLoading ? (
        <Card
          eyebrow="My BUSY Apps"
          title="Loading…"
          body="BUSY is loading the business apps you have used."
          tone="blue"
        />
      ) : (s.myBusyApps || []).length ? (
        (s.myBusyApps || []).map((item) => (
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
  const [distributionMode,setDistributionMode]=React.useState("busy_marketplace");
  const [distributionAcks,setDistributionAcks]=React.useState({});
  const [requestedPlatforms,setRequestedPlatforms]=React.useState(["ios","android"]);
  const [standaloneHandoff,setStandaloneHandoff]=React.useState(null);
  const [standaloneHandoffNotice,setStandaloneHandoffNotice]=React.useState("");
  const [standaloneEligibility,setStandaloneEligibility]=React.useState(null);
  const [standaloneEligibilityBusy,setStandaloneEligibilityBusy]=React.useState(false);
  const [pendingAppearance,setPendingAppearance]=React.useState(null);
  const [appearancePreviewOpen,setAppearancePreviewOpen]=React.useState(false);
  const [selectedAppPart,setSelectedAppPart]=React.useState("header");
  const [appearanceWords,setAppearanceWords]=React.useState("");
  const [appearanceInstructionNotice,setAppearanceInstructionNotice]=React.useState("");
  const [showAppVoice,setShowAppVoice]=React.useState(false);
  const [pendingMove,setPendingMove]=React.useState(null);
  const [studioWords,setStudioWords]=React.useState("");
  const [studioPreview,setStudioPreview]=React.useState(null);
  const [studioNotice,setStudioNotice]=React.useState("");
  const [studioCopyField,setStudioCopyField]=React.useState("tagline");
  const [studioCopy,setStudioCopy]=React.useState("");
  const [photoFrom,setPhotoFrom]=React.useState("1");
  const [photoTo,setPhotoTo]=React.useState("2");
  const [studioVoiceOpen,setStudioVoiceOpen]=React.useState(false);
  const [studioUndo,setStudioUndo]=React.useState(null);
  const view = s.miniAppsView || {};
  const app = view.app;
  React.useEffect(()=>{
    setStandaloneEligibility(null);
    setStandaloneHandoff(null);
    setPendingAppearance(null);
    setAppearancePreviewOpen(false);
    setStudioPreview(null);
    setStudioUndo(null);
    setStudioWords("");
    setStudioNotice("");
  },[app?.id,s.cloudWorkspace?.businessId,s.ownerSession?.userId]);
  React.useEffect(()=>{
    setPendingAppearance(null);
    setAppearancePreviewOpen(false);
    setAppearanceInstructionNotice("");
    setShowAppVoice(false);
    setPendingMove(null);
    setStudioPreview(null);
    setStudioVoiceOpen(false);
  },[app?.draft_revision]);
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
    profile:view.activeConfig?.publicProfile||{}
  });
  const quality=appDesignQualityReport(view.draftConfig||view.activeConfig||{},view.catalog||[]);
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

  return (
    <Shell
      s={s}
      title="Business App Builder"
      subtitle="Describe the customer experience you want. BUSY turns it into a controlled app plan using tested modules and the business facts it already knows."
      brandCue="V3.56 • shared business profile • intelligent module recommendations • owner-controlled publishing."
    >
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
        {experience.understoodGoals?.length?(
          <Text style={styles.cardBody}>{"Customer goals identified: "+
            experience.understoodGoals.join(", ")}</Text>
        ):null}
        {experience.unavailableGoalCapabilities?.length?(
          <Text style={styles.cardBody}>{"Not yet available: "+
            experience.unavailableGoalCapabilities.join(", ")+
            ". BUSY will not pretend these work."}</Text>
        ):null}
        {experience.suggestedModules.filter(item=>item.suggested).slice(0,7).map(item=>
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
              onPress={s.applyMiniAppPlan}
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
              ? "Refresh draft from Business Brain facts"
              : "Quick-build from Business Brain facts"
          }
          disabled={!!s.miniAppsAction}
          onPress={s.buildMiniAppFromBrandBrain}
        />
        {view.activeConfig ? (
          <Button label="Preview Business App" onPress={s.openMiniAppPreview} />
        ) : null}
      </Card>

      {app&&view.draftConfig?(
        <Card eyebrow="V3.157 • Intelligent App Studio"
          title="Tell BUSY several changes at once"
          body="Describe the result you want. BUSY identifies only supported safe edits, checks the current private app, then shows the entire proposed customer view. If an instruction is unclear, nothing is applied."
          footer="One approval saves the complete batch as ONE private revision. Undo reverses that batch without touching the live app."
          tone="blue">
          <Field label="App instructions" value={studioWords}
            onChangeText={value=>{setStudioWords(value);setStudioPreview(null);}}
            placeholder="Put bookings first, make the photos bigger and keep my existing colours"/>
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
          <Text style={styles.sectionLabel}>Or change supported public wording directly</Text>
          {[
            ["tagline","Tagline"],["about","About section"],["description","Description"]
          ].map(([key,label])=>(
            <Button key={key} label={(studioCopyField===key?"✓ ":"")+"Edit "+label}
              onPress={()=>{setStudioCopyField(key);setStudioPreview(null);}}/>
          ))}
          <Field label={"Replacement "+studioCopyField+" (owner-approved copy)"}
            value={studioCopy} onChangeText={setStudioCopy}
            placeholder="Write the exact words you want customers to see"/>
          <Button label="Preview exact wording" disabled={!studioCopy.trim()||!!s.miniAppsAction}
            onPress={()=>{
              const p=proposeCoordinatedAppChanges(view.draftConfig,
                [{kind:"text",field:studioCopyField,value:studioCopy}]);
              setStudioPreview(p.ok?p:null);setStudioNotice(p.ok?
                "Owner-written wording is ready to preview, not yet saved.":p.reason);
            }}/>
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
          {studioNotice?<Text style={styles.cardBody}>{studioNotice}</Text>:null}
          {studioPreview?.ok?(
            <>
              <Text style={styles.sectionLabel}>Proposed changes — not saved</Text>
              {studioPreview.changes.map((change,index)=>(
                <MetricRow key={"change-"+index} left={"Change "+(index+1)} right={change}/>
              ))}
              {studioPreview.preserved?.length?(
                <Text style={styles.cardBody}>
                  {"Kept unchanged: "+studioPreview.preserved.join("; ")}
                </Text>
              ):null}
              <MiniAppSurface config={studioPreview.nextConfig}/>
              <Button primary label={"Approve all "+studioPreview.changes.length+" private change(s)"}
                disabled={!!s.miniAppsAction}
                onPress={async()=>{
                  const result=await s.saveCoordinatedAppChanges?.({
                    appId:app.id,expectedRevision:app.draft_revision,
                    operations:studioPreview.operations});
                  if(result?.ok){
                    setStudioUndo({operations:result.undoOperations,
                      expectedRevision:result.newRevision});
                    setStudioPreview(null);
                    setStudioNotice("Saved as one PRIVATE revision. Your live app is unchanged.");
                  }
                }}/>
              <Button label="Discard the whole proposed batch"
                onPress={()=>{setStudioPreview(null);setStudioNotice("No changes saved.");}}/>
            </>
          ):null}
          {studioUndo?.operations?.length&&
            studioUndo.expectedRevision===app.draft_revision?(
            <Button label="Undo my last approved batch" disabled={!!s.miniAppsAction}
              onPress={async()=>{
                const result=await s.saveCoordinatedAppChanges?.({
                  appId:app.id,expectedRevision:studioUndo.expectedRevision,
                  operations:studioUndo.operations});
                if(result?.ok){
                  setStudioUndo(null);
                  setStudioNotice("Batch reversed in one new private revision. No public changes.");
                }
              }}/>
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
          <Text style={styles.sectionLabel}>Select the part you want to change</Text>
          {[
            ["header","Header"],["spacing","Spacing"],["navigation","Navigation"]
          ].map(([part,label])=>(
            <Button key={part} label={(selectedAppPart===part?"✓ ":"")+"Edit "+label}
              onPress={()=>{setSelectedAppPart(part);setPendingAppearance(null);
                setAppearanceInstructionNotice("");setShowAppVoice(false);}}/>
          ))}
          <Field label="Tell BUSY how to change the selected part"
            value={appearanceWords} onChangeText={setAppearanceWords}
            placeholder="e.g. Make the header bold, or use roomier spacing"/>
          <Button label="Preview my described app change" disabled={!appearanceWords.trim()}
            onPress={()=>{
              const proposal=interpretSelectedAppAppearance(view.draftConfig,{
                selected:selectedAppPart,text:appearanceWords
              });
              if(proposal.ok){
                setPendingAppearance({field:proposal.field,value:proposal.value});
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
                businessId:s.cloudWorkspace.businessId,selectedPart}}
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
            ["navigationStyle","Navigation look",appAppearanceOptions.navigationStyle]
          ].map(([field,label,values])=>(
            <View key={field} style={{marginTop:9}}>
              <Text style={styles.sectionLabel}>{label}</Text>
              {values.map(value=>(
                <Button key={value} label={
                  (pendingAppearance?.field===field&&pendingAppearance?.value===value?"✓ ":"")+
                  value.replaceAll("-"," ")}
                  disabled={!!s.miniAppsAction}
                  onPress={()=>{
                    setPendingAppearance({field,value});
                    setAppearancePreviewOpen(true);
                  }}/>
              ))}
            </View>
          ))}
          {pendingAppearance?(()=>{
            const proposal=previewPrivateAppAppearance(view.draftConfig,pendingAppearance);
            return proposal.ok?(
              <>
                <MetricRow left="Proposed change"
                  right={pendingAppearance.field+" • "+proposal.previous+" → "+proposal.value}/>
                {appearancePreviewOpen?(
                  <>
                    <Text style={styles.cardBody}>Unsaved customer-view preview; no public changes have been made.</Text>
                    <MiniAppSurface config={proposal.nextConfig}/>
                  </>
                ):null}
                <Button label="Keep this appearance in my PRIVATE app"
                  primary disabled={!!s.miniAppsAction}
                  onPress={async()=>{
                    const ok=await s.savePrivateAppAppearance?.({
                      ...pendingAppearance,appId:app.id,
                      expectedRevision:app.draft_revision
                    });
                    if(ok){setPendingAppearance(null);setAppearancePreviewOpen(false);}
                  }}/>
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
            <View key={module.key} style={{marginTop:8}}>
              <Text style={styles.cardBody}>{(index+1)+". "+module.key.replaceAll("_"," ")}</Text>
              {index>0?<Button label={"Move "+module.key.replaceAll("_"," ")+" up"}
                disabled={!!s.miniAppsAction}
                onPress={()=>setPendingMove({moduleKey:module.key,direction:"up"})}/>:null}
              {index<items.length-1?<Button label={"Move "+module.key.replaceAll("_"," ")+" down"}
                disabled={!!s.miniAppsAction}
                onPress={()=>setPendingMove({moduleKey:module.key,direction:"down"})}/>:null}
            </View>
          ))}
          {pendingMove?(()=>{
            const proposal=proposeAppSectionMove(view.draftConfig,pendingMove);
            return proposal.ok?(
              <>
                <Text style={styles.cardBody}>
                  {"Proposed order: "+proposal.after.map(x=>x.replaceAll("_"," ")).join(" → ")}
                </Text>
                <MiniAppSurface config={proposal.nextConfig}/>
                <Button label="Keep new order in PRIVATE app"
                  primary disabled={!!s.miniAppsAction}
                  onPress={async()=>{
                    const ok=await s.movePrivateAppSection?.({
                      ...pendingMove,appId:app.id,expectedRevision:app.draft_revision});
                    if(ok)setPendingMove(null);
                  }}/>
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
                      s.toggleMiniAppModule(module.module_key, !enabled)
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

          {view.pendingRequests?.length ? (
            <>
              <Text style={styles.sectionLabel}>Customer requests</Text>
              {view.pendingRequests.slice(0, 10).map((request) => {
                const link = view.linkByRequest?.get?.(request.id) || null;
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
                    {!link && request.status !== "reviewing" ? (
                      <Button
                        label="Mark reviewing"
                        disabled={!!s.miniAppsAction}
                        onPress={() =>
                          s.updateMiniAppRequestStatus(
                            request.id,
                            "reviewing"
                          )
                        }
                      />
                    ) : null}
                    {!link ? (
                      <Button
                        label="Decline request"
                        disabled={!!s.miniAppsAction}
                        onPress={() =>
                          s.updateMiniAppRequestStatus(
                            request.id,
                            "declined"
                          )
                        }
                      />
                    ) : null}

                    {link?.bridge_state === "booking_draft" ? (
                      <Button
                        label="Open BUSY booking to confirm"
                        primary
                        onPress={() =>
                          s.openMiniAppLinkedBooking(request.id)
                        }
                      />
                    ) : null}
                    {link?.bridge_state === "booking_confirmed" ? (
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
  const config =
    view.previewVersion?.config ||
    view.draftConfig ||
    view.liveVersion?.config ||
    null;

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
        body="Check the branding, services, imagery, offers, loyalty and customer actions below. BUSY will publish exactly this immutable version only if you approve Go Live."
        footer="Opening this preview does not make anything public."
        tone="green"
      />
      {config ? (
        <MiniAppSurface config={config} />
      ) : (
        <Card
          eyebrow="Preview"
          title="No Business App draft yet"
          body="Build the private Business App before opening the customer preview."
          tone="amber"
        />
      )}
      {view.canPublish && view.previewVersion ? (
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
  const detail = s.selectedBusyAppDetail || {};
  const config = detail?.version?.config || null;
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [service, setService] = React.useState("");
  const [date, setDate] = React.useState("");
  const [note, setNote] = React.useState("");
  const [message, setMessage] = React.useState("");

  const enabled = new Set(
    (config?.modules || [])
      .filter((item) => item.enabled)
      .map((item) => item.key)
  );

  const submitBooking = async () => {
    const ok = await s.submitBusyAppRequest("booking_request", {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      service: service.trim(),
      preferredDate: date.trim(),
      note: note.trim(),
    });
    if (ok) {
      setService("");
      setDate("");
      setNote("");
    }
  };

  const submitEnquiry = async () => {
    const ok = await s.submitBusyAppRequest("enquiry", {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      service: service.trim(),
      message: message.trim(),
    });
    if (ok) setMessage("");
  };

  return (
    <Shell
      s={s}
      title={detail?.app?.name || "Business App"}
      subtitle="Customer-facing business app inside BUSY."
      brandCue="V3.55 • live Business App • customer requests • loyalty progress."

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
      {config ? (
        <MiniAppSurface
          config={config}
          interactive
          s={s}
          loyaltyProgress={detail?.loyaltyProgress || null}
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



      {s.miniAppsNotice ? (
        <Card
          eyebrow="BUSY"
          title="Request update"
          body={s.miniAppsNotice}
          tone="green"
        />
      ) : null}

      {s.miniAppsError ? (
        <Card
          eyebrow="BUSY Apps"
          title="Could not complete that action"
          body={s.miniAppsError}
          tone="amber"
        />
      ) : null}

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

      {enabled.has("booking_request") ? (
        <>
          <Text style={styles.sectionLabel}>Request a booking</Text>
          <Field label="Service" value={service} onChangeText={setService} placeholder="e.g. Haircut" />
          <Field label="Preferred date" value={date} onChangeText={setDate} placeholder="e.g. Friday afternoon" />
          <Field label="Note" value={note} onChangeText={setNote} placeholder="Anything the business should know" multiline />
          <Button
            label={s.miniAppsAction === "request:booking_request" ? "Sending…" : "Send booking request"}
            primary
            disabled={
              !name.trim() ||
              (!email.trim() && !phone.trim()) ||
              !service.trim() ||
              !!s.miniAppsAction
            }
            onPress={submitBooking}
          />
        </>
      ) : null}

      {enabled.has("enquiry") ? (
        <>
          <Text style={styles.sectionLabel}>Send an enquiry</Text>
          <Field label="Message" value={message} onChangeText={setMessage} placeholder="What would you like to ask?" multiline />
          <Button
            label={s.miniAppsAction === "request:enquiry" ? "Sending…" : "Send enquiry"}
            disabled={
              !name.trim() ||
              (!email.trim() && !phone.trim()) ||
              !message.trim() ||
              !!s.miniAppsAction
            }
            onPress={submitEnquiry}
          />
        </>
      ) : null}

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
  const detail = s.selectedMiniAppRequestDetail || {};
  const request = detail.request || null;
  const role = s.selectedMiniAppRequestRole || "customer";
  const [draft, setDraft] = React.useState("");
  const ownerView = role === "business";
  const guestWebRequest = request?.request_origin === "guest_web";
  const link = request?.id ? s.miniAppsView?.linkByRequest?.get?.(request.id) || null : null;

  const send = async () => {
    const body = draft.trim();
    if (!request?.id || !body) return;
    const ok = ownerView
      ? await s.sendMiniAppRequestMessage(request.id, body)
      : await s.replyBusyAppRequestMessage(request.id, body);
    if (ok) setDraft("");
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
            footer={`Status: ${String(request.status || "received").replaceAll("_", " ")}`}
            tone={request.status === "accepted" ? "green" : ["declined", "closed"].includes(request.status) ? "amber" : "blue"}
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
            {ownerView && !link && request.status !== "reviewing" && !["declined", "closed"].includes(request.status) ? (
              <Button
                label="Mark reviewing"
                disabled={!!s.miniAppsAction}
                onPress={() => s.updateMiniAppRequestStatus(request.id, "reviewing")}
              />
            ) : null}
            {ownerView && !["declined", "closed", "accepted"].includes(request.status) ? (
              <Button
                label="Decline request"
                disabled={!!s.miniAppsAction}
                onPress={() => s.updateMiniAppRequestStatus(request.id, "declined")}
              />
            ) : null}
          </Card>

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
              title="Booking confirmed"
              body="The linked BUSY booking is confirmed and the customer's Business App request has been updated to accepted."
              tone="green"
            >
              <Button
                label="Open confirmed BUSY booking"
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
  BusyAppsMarketplace,
  MiniAppBuilder,
  MiniAppPreview,
  BusyAppDetail,
  MiniAppShareCentre,
  MiniAppRequestDetail,
};
