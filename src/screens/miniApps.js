import React from "react";
import { Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { styles } from "../theme/styles";
import { Shell, Card, Button, Field, MetricRow, StatusChip } from "../components/ui";
import { miniAppModuleLabel } from "../domain/miniApps";

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

function MiniAppSurface({ config, interactive = false, s = null }) {
  const profile = config?.publicProfile || {};
  const modules = Array.isArray(config?.modules)
    ? config.modules.filter((item) => item.enabled)
    : [];
  const services = Array.isArray(profile?.services) ? profile.services : [];
  const gallery = Array.isArray(profile?.assets?.gallery)
    ? profile.assets.gallery
    : [];

  return (
    <>
      <Card
        eyebrow={config?.display?.category || profile.businessType || "BUSY Mini App"}
        title={config?.display?.name || profile.businessName || "Business"}
        body={
          config?.display?.tagline ||
          profile.tagline ||
          profile.description ||
          "Public business information"
        }
        footer={profile.serviceArea || ""}
        tone="green"
      >
        <MetricRow left="Powered by" right="BUSY DOES IT" strong />
        <MetricRow left="Modules" right={String(modules.length)} />
      </Card>

      {modules.map((module) => {
        if (module.key === "business_profile") {
          return (
            <Card
              key={module.key}
              eyebrow="About"
              title={profile.businessName || "Business profile"}
              body={profile.about || profile.description || "No public description recorded yet."}
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
                    body={service.description || "No public service description recorded."}
                    tone="blue"
                  />
                ))
              ) : (
                <Card
                  eyebrow="Services"
                  title="No public services recorded"
                  body="BUSY will not invent services just to fill the Mini App."
                  tone="amber"
                />
              )}
            </View>
          );
        }

        if (module.key === "gallery") {
          return (
            <Card
              key={module.key}
              eyebrow="Gallery"
              title={`${gallery.length} approved public image${gallery.length === 1 ? "" : "s"}`}
              body={
                gallery.length
                  ? "Only imagery already approved for public/marketing use belongs in this module."
                  : "No approved public gallery images are available yet."
              }
              tone="blue"
            />
          );
        }

        if (module.key === "contact") {
          return (
            <Card
              key={module.key}
              eyebrow="Contact"
              title="Get in touch"
              body="These details come from the shared approved public business profile."
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
              eyebrow="Enquiry"
              title="Send an enquiry through BUSY"
              body={
                interactive
                  ? "Use the enquiry form below. BUSY records it as a genuine customer request."
                  : "Customer-facing enquiry module enabled."
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
              title="Request a service/date"
              body={
                interactive
                  ? "Use the booking request form below. The business still has to accept it."
                  : "Request-only booking module enabled."
              }
              footer="Submitting this does not silently create a confirmed calendar booking."
              tone="green"
            />
          );
        }

        if (module.key === "offers") {
          const offers = Array.isArray(config?.offers) ? config.offers : [];
          return (
            <View key={module.key}>
              <Text style={styles.sectionLabel}>Offers</Text>
              {offers.length ? (
                offers.map((offer, index) => (
                  <Card
                    key={`offer-${index}-${offer.title || "offer"}`}
                    eyebrow="Approved offer"
                    title={offer.title || "Offer"}
                    body={offer.body || ""}
                    footer={offer.terms || "No additional terms recorded."}
                    tone="green"
                  />
                ))
              ) : (
                <Card
                  eyebrow="Offers"
                  title="No approved offer is stored yet"
                  body="BUSY will not invent a promotion, price or discount. Add the exact offer in your app request and review it before building."
                  tone="blue"
                />
              )}
            </View>
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
      brandCue="V3.44 • customer journey bridge • My BUSY Apps • controlled modules • shared business data."
    >
      <Card
        eyebrow="BUSY Apps marketplace"
        title="One place for small-business apps"
        body="A customer can search a business name inside BUSY, open that business's Mini App, browse services and use enabled customer actions such as enquiry or booking request."
        footer="V3.44 connects Mini Apps to real BUSY customer journeys while keeping one shared, controlled app platform."
        tone="green"
      >
        <Button
          label={s.miniAppsView?.app ? "Manage my business Mini App" : "Build my business Mini App"}
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
          "BUSY can alert this device when a business replies or a customer updates a Mini App request."
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
            body={item.tagline || "Previously used BUSY Mini App"}
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
            eyebrow={item.category || "BUSY Mini App"}
            title={item.name || "Business"}
            body={item.tagline || "Customer-facing BUSY Mini App"}
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
          body="Only live Mini Apps that their business owner has explicitly approved for marketplace discovery appear here."
          tone="blue"
        />
      )}

      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function MiniAppBuilder({ s }) {
  const view = s.miniAppsView || {};
  const app = view.app;
  const modules = Array.isArray(view.catalog) ? view.catalog : [];
  const configuredModules = new Map(
    (view.modules || []).map((item) => [item.key, item])
  );

  return (
    <Shell
      s={s}
      title="Business App Builder"
      subtitle="Describe the customer experience you want. BUSY turns it into a controlled app plan using tested modules and the business facts it already knows."
      brandCue="V3.54 • plain-English planning • voice-first input • Business Brain facts • reviewed plan → private draft → immutable preview."
    >
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

      {s.miniAppBuilderPlan ? (
        <Card
          eyebrow="BUSY App Plan"
          title={s.miniAppBuilderPlan.summary || "Proposed customer app"}
          body="BUSY has mapped your request onto the reusable modules it can safely support. Review this before BUSY changes the private draft."
          footer={`Confidence: ${s.miniAppBuilderPlan.confidence || "Not stated"} • Nothing public changes here.`}
          tone="blue"
        >
          {(s.miniAppBuilderPlan.modules || [])
            .filter((item) => item.enabled)
            .map((item) => (
              <MetricRow
                key={`plan-module-${item.key}`}
                left={miniAppModuleLabel(item.key)}
                right={item.reason || "Included"}
                strong
              />
            ))}

          {(s.miniAppBuilderPlan.missingFacts || []).length ? (
            <>
              <Text style={styles.sectionLabel}>BUSY still needs</Text>
              {(s.miniAppBuilderPlan.missingFacts || []).map((item) => (
                <MetricRow
                  key={`missing-${item.key}`}
                  left={miniAppModuleLabel(item.key)}
                  right={item.question}
                />
              ))}
            </>
          ) : null}

          {(s.miniAppBuilderPlan.unsupportedRequests || []).length ? (
            <>
              <Text style={styles.sectionLabel}>Planned for later</Text>
              {(s.miniAppBuilderPlan.unsupportedRequests || []).map((item, index) => (
                <MetricRow
                  key={`unsupported-${index}-${item.request}`}
                  left={item.request}
                  right={item.reason}
                />
              ))}
            </>
          ) : null}

          {(s.miniAppBuilderPlan.offers || []).length ? (
            <>
              <Text style={styles.sectionLabel}>Approved offer wording</Text>
              {(s.miniAppBuilderPlan.offers || []).map((offer, index) => (
                <MetricRow
                  key={`planned-offer-${index}`}
                  left={offer.title}
                  right={[offer.body, offer.terms].filter(Boolean).join(" • ")}
                />
              ))}
            </>
          ) : null}

          <Button
            label={
              s.miniAppsAction === "apply-app-plan"
                ? "Building private draft…"
                : app
                ? "Apply this plan to my draft"
                : "Build this app plan"
            }
            primary
            disabled={!!s.miniAppsAction}
            onPress={s.applyMiniAppPlan}
          />
        </Card>
      ) : null}

      <Card
        eyebrow="Your BUSY Business App"
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
          title={view.statusLabel || "Mini App"}
          body={s.miniAppsNotice}
          tone="blue"
        />
      ) : null}

      {app ? (
        <>
          <Text style={styles.sectionLabel}>Reusable modules</Text>
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

          <Text style={styles.sectionLabel}>Prepare & publish</Text>
          <Card
            eyebrow="Immutable preview"
            title={
              view.previewVersion
                ? `Prepared Mini App v${view.previewVersion.version_no}`
                : "No prepared version yet"
            }
            body={
              view.previewVersion
                ? view.previewVersion.change_label || "Prepared Mini App version"
                : "Prepare freezes the current module configuration into an immutable version for review."
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
              title={`Publish Mini App v${view.previewVersion.version_no}?`}
              body="BUSY will publish exactly this immutable configuration. You can make it live without listing it, or approve marketplace discovery at the same time."
              footer="Publishing and marketplace discoverability are deliberate owner decisions."
              tone="amber"
            >
              <Button
                label={s.miniAppsAction === "publish" ? "Publishing…" : "Review & approve publication"}
                primary
                disabled={!!s.miniAppsAction}
                onPress={() => s.confirmPublishMiniApp(view.previewVersion.id)}
              />
            </Card>
          ) : null}

          {view.hasLive ? (
            <Card
              eyebrow={`Live Mini App v${view.liveVersion.version_no}`}
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
                left="Public web Mini App"
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
                title={version.change_label || "Mini App version"}
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
      title="Mini App Preview"
      subtitle="Preview the controlled customer-facing configuration before anything changes publicly."
      brandCue="V3.44 • preview only • reusable BUSY modules."
    >
      {config ? (
        <MiniAppSurface config={config} />
      ) : (
        <Card
          eyebrow="Preview"
          title="No Mini App draft yet"
          body="Build the first Mini App draft before opening the preview."
          tone="amber"
        />
      )}
      <Button label="Back to Mini App Builder" primary onPress={() => s.go("miniAppBuilder")} />
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
      title={detail?.app?.name || "BUSY Mini App"}
      subtitle="Customer-facing business app inside BUSY."
      brandCue="V3.44 • live marketplace version."
    >
      {detail?.entryIntent ? (
        <Card
          eyebrow="From the web Mini App"
          title={
            detail.entryIntent === "booking_request"
              ? "Continue your booking request"
              : "Continue your enquiry"
          }
          body={
            detail.entryIntent === "booking_request"
              ? "BUSY kept the business and action you chose on the public web Mini App. Complete the request below; it is still only a request until the business confirms it."
              : "BUSY kept the business and action you chose on the public web Mini App. Complete the enquiry below and it will go to the right business."
          }
          tone="green"
        />
      ) : null}
      {config ? <MiniAppSurface config={config} interactive s={s} /> : null}
      <Card
        eyebrow="My BUSY Apps"
        title={detail?.app?.favorite ? "★ Favourite" : "This app is saved to your history"}
        body="Opening a BUSY Mini App automatically keeps it in My BUSY Apps so you can return without searching again."
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
      title="Share Mini App"
      subtitle="Give customers an install-free web view of this business's live BUSY Mini App."
      brandCue="V3.45 • install-free guest enquiries & booking requests • browser challenge • bounded rate limits."
    >
      {view.hasLive && links.qr ? (
        <>
          <Card
            eyebrow="Customer QR code"
            title={view.displayName || "Your BUSY Mini App"}
            body="Customers can scan this code from a counter sign, van, leaflet, website or another phone and immediately browse the live Mini App in their web browser."
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
            body="Marketplace listing and exact-link access stay separate. The public web experience is rendered from the immutable live Mini App version, so unlisting the business from search does not break its owner-shared QR code."
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
            <MetricRow left="Web Mini App views" right={String(webViewCount)} strong={webViewCount > 0} />
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
                ? "V3.45 lets a customer submit an enquiry or booking request directly from the public web Mini App. BUSY uses a short-lived browser challenge, a hidden bot trap and server-side rate limits before the request enters the business workflow."
                : "This live web artifact was published before V3.45 guest forms. Republish the current Mini App version through the normal owner approval flow to add guest enquiry and booking forms without changing the saved business content."
            }
            footer="The browser challenge reduces automated spam but does not prove ownership of the email address or phone number typed by the customer. Booking requests are still requests, never silent confirmed diary entries."
            tone="blue"
          />
        </>
      ) : (
        <Card
          eyebrow="Share Mini App"
          title="Publish the Mini App first"
          body="BUSY only creates customer entry links and QR codes for a genuinely live Mini App."
          tone="amber"
        />
      )}

      <Button label="Back to Mini App Builder" onPress={() => s.go("miniAppBuilder")} />
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
            : "Mini App customer conversation"
          : "Your conversation with this business"
      }
      brandCue="V3.45 • guest web requests • explicit identity assurance • safe owner follow-up."
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
                body="This customer submitted from the public web Mini App without a BUSY account. V3.45 deliberately does not pretend an in-app message will reach them. Use the supplied email or phone while their browser receipt continues to show genuine request-status changes."
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
        label={ownerView ? "Back to Mini App Builder" : "Back to My BUSY Apps"}
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
