import React from "react";
import { Text, View } from "react-native";

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
          return (
            <Card
              key={module.key}
              eyebrow="Offers"
              title="No approved offer is stored yet"
              body="The module can exist without BUSY inventing a promotion, price or discount."
              tone="blue"
            />
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
      brandCue="V3.39 • BUSY-owned marketplace • controlled modules • shared public business data."
    >
      <Card
        eyebrow="BUSY Apps marketplace"
        title="One place for small-business apps"
        body="A customer can search a business name inside BUSY, open that business's Mini App, browse services and use enabled customer actions such as enquiry or booking request."
        footer="V3.39 builds the marketplace foundation; it does not create arbitrary bespoke native apps."
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
      title="Mini App Builder"
      subtitle="BUSY assembles a customer-facing app from reusable tested modules and approved public business facts."
      brandCue="V3.39 • one controlled platform • immutable versions • marketplace approval separated from Go Live."
    >
      <Card
        eyebrow="Your BUSY Mini App"
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
          label={s.miniAppsAction === "build" ? "Building…" : app ? "Refresh draft from Brand Brain" : "Build my Mini App"}
          primary={!app}
          disabled={!!s.miniAppsAction}
          onPress={s.buildMiniAppFromBrandBrain}
        />
        {view.activeConfig ? (
          <Button label="Preview Mini App" onPress={s.openMiniAppPreview} />
        ) : null}
      </Card>

      {s.miniAppsError ? (
        <Card
          eyebrow="Nothing unsafe was applied"
          title="Mini App needs attention"
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
              label={s.miniAppsAction === "prepare" ? "Preparing…" : "Prepare immutable preview"}
              primary={!!view.canPrepare}
              disabled={!view.canPrepare || !!s.miniAppsAction}
              onPress={s.prepareMiniAppPreview}
            />
            {view.previewVersion ? (
              <Button label="Open prepared preview" onPress={s.openMiniAppPreview} />
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
                  ? "Signed-in BUSY users can find this business through marketplace search."
                  : "The app is live, but it stays out of marketplace search until you explicitly approve listing."
              }
              footer={`Public slug: ${view.publicSlug || "Not set"}`}
              tone="green"
            >
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
              {view.pendingRequests.slice(0, 10).map((request) => (
                <Card
                  key={request.id}
                  eyebrow={request.request_type === "booking_request" ? "Booking request" : "Enquiry"}
                  title={request.payload?.service || request.payload?.name || "Customer request"}
                  body={request.payload?.note || request.payload?.message || "No note supplied."}
                  footer={`${request.status} • ${readableDate(request.created_at)}`}
                  tone="amber"
                >
                  <Button
                    label="Mark reviewing"
                    disabled={!!s.miniAppsAction}
                    onPress={() => s.updateMiniAppRequestStatus(request.id, "reviewing")}
                  />
                  <Button
                    label="Accept request"
                    primary
                    disabled={!!s.miniAppsAction}
                    onPress={() => s.updateMiniAppRequestStatus(request.id, "accepted")}
                  />
                  <Button
                    label="Decline request"
                    disabled={!!s.miniAppsAction}
                    onPress={() => s.updateMiniAppRequestStatus(request.id, "declined")}
                  />
                </Card>
              ))}
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
      brandCue="V3.39 • preview only • reusable BUSY modules."
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
      message: message.trim(),
    });
    if (ok) setMessage("");
  };

  return (
    <Shell
      s={s}
      title={detail?.app?.name || "BUSY Mini App"}
      subtitle="Customer-facing business app inside BUSY."
      brandCue="V3.39 • live marketplace version."
    >
      {config ? <MiniAppSurface config={config} interactive s={s} /> : null}

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

      {enabled.has("booking_request") ? (
        <>
          <Text style={styles.sectionLabel}>Request a booking</Text>
          <Field label="Service" value={service} onChangeText={setService} placeholder="e.g. Haircut" />
          <Field label="Preferred date" value={date} onChangeText={setDate} placeholder="e.g. Friday afternoon" />
          <Field label="Note" value={note} onChangeText={setNote} placeholder="Anything the business should know" multiline />
          <Button
            label={s.miniAppsAction === "request:booking_request" ? "Sending…" : "Send booking request"}
            primary
            disabled={!service.trim() || !!s.miniAppsAction}
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
            disabled={!message.trim() || !!s.miniAppsAction}
            onPress={submitEnquiry}
          />
        </>
      ) : null}

      <Button label="Back to BUSY Apps" onPress={() => s.go("busyAppsMarketplace")} />
    </Shell>
  );
}

export {
  BusyAppsMarketplace,
  MiniAppBuilder,
  MiniAppPreview,
  BusyAppDetail,
};
