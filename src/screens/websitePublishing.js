import React from "react";
import { Text } from "react-native";

import { styles } from "../theme/styles";
import { Shell, Card, Button, Field, MetricRow } from "../components/ui";

function readableSeconds(value) {
  const seconds = Number(value || 0);
  if (!seconds) return "Just now";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function readableDate(value, fallback = "Not yet") {
  if (!value) return fallback;
  try {
    return new Date(value).toLocaleString("en-GB");
  } catch {
    return fallback;
  }
}
function readableBytes(value) {
  const bytes = Math.max(0, Number(value || 0));
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}


function WebsitePublishing({ s }) {
  const view = s.websitePublishingView || {};
  const website = view.website || null;
  const preview = view.previewDeployment || null;
  const live = view.liveDeployment || null;
  const domain = view.domainState?.latest || null;
  const activeJob = view.activeJob || null;
  const changes = view.changeSummary?.items || [];
  const seoChecks = view.seoAudit?.checks || [];

  return (
    <Shell
      s={s}
      title="Website Management"
      subtitle="Edit privately, inspect the exact hosted version, then decide what becomes public."
      brandCue="V3.38 • real delivery • provider routing • traffic signals • usage metering."
    >
      <Card
        eyebrow="Website lifecycle"
        title={view.publicStatus || "Website status"}
        body={
          live
            ? view.draftChangedSinceHosted
              ? "Your public website is unchanged. BUSY has newer draft changes that can be prepared as a separate hosted version."
              : "The current approved version is live. Editing remains separate until another version is prepared and approved."
            : preview
            ? "A private hosted version is ready. Review exactly what changed before making anything public."
            : activeJob
            ? "BUSY is processing this website safely in the background."
            : "Build or edit the draft, then prepare a hosted preview."
        }
        footer="A draft edit never silently alters the live website."
        tone={website?.last_error ? "amber" : live ? "green" : "blue"}
      >
        <MetricRow left="Editor draft" right={s.websiteDraft ? `Generation ${s.websiteDraft.generation || 1}` : "None"} />
        <MetricRow left="Hosted preview" right={preview ? `v${preview.version_no}` : "None"} />
        <MetricRow left="Live version" right={live ? `v${live.version_no}` : "Not live"} strong={!!live} />
        <MetricRow left="Pages" right={String(view.pageCount || s.websiteDraft?.pages?.length || 1)} />
        {activeJob ? (
          <MetricRow left="Background work" right={`${activeJob.action} • ${activeJob.status}`} strong />
        ) : null}
        <Button
          label={s.websitePublishingAction === "prepare" ? "Preparing…" : preview && view.draftChangedSinceHosted ? "Prepare updated hosted preview" : "Prepare hosted preview"}
          primary={!!view.canPrepare}
          disabled={!view.canPrepare || !!s.websitePublishingAction}
          onPress={s.prepareHostedWebsite}
        />
        {preview ? (
          <Button
            label="Open exact hosted preview"
            disabled={!!s.websitePublishingAction}
            onPress={() => s.openHostedWebsitePreview(preview.id)}
          />
        ) : null}
        <Button
          label={s.websitePublishingLoading ? "Refreshing…" : "Refresh website status"}
          disabled={s.websitePublishingLoading}
          onPress={s.refreshWebsitePublishingStatus}
        />
      </Card>

      {s.websitePublishingError ? (
        <Card
          eyebrow="Needs attention"
          title="Nothing unsafe was applied"
          body={s.websitePublishingError}
          tone="amber"
        />
      ) : null}

      {s.websitePublishingNotice ? (
        <Card
          eyebrow="Latest update"
          title={view.publicStatus || "Website management"}
          body={s.websitePublishingNotice}
          tone="blue"
        />
      ) : null}

      {preview ? (
        <>
          <Text style={styles.sectionLabel}>What changed in this version</Text>
          <Card
            eyebrow={`Hosted preview v${preview.version_no}`}
            title={preview.change_label || view.changeSummary?.headline || "Website update"}
            body={
              changes.length
                ? "BUSY stores this change summary with the immutable deployment, so version history remains understandable later."
                : "This deployment predates the richer V3.37 change summary or contains no material detected change."
            }
            footer={`${preview.page_count || 1} page${Number(preview.page_count || 1) === 1 ? "" : "s"} • source generation ${preview.source_generation || 1}`}
            tone="blue"
          >
            {changes.slice(0, 8).map((item, index) => (
              <MetricRow
                key={`${item.label || "change"}-${index}`}
                left={item.label || "Website change"}
                right={item.type === "added" ? "Added" : item.type === "removed" ? "Removed" : "Changed"}
              />
            ))}
          </Card>
        </>
      ) : null}

      {preview && preview.id !== live?.id ? (
        <Card
          eyebrow="Go Live gate"
          title={`Publish v${preview.version_no}?`}
          body="This is a public change. BUSY will publish exactly the immutable hosted version you previewed — not a later editor state."
          footer="The current public version is retained as a rollback target."
          tone="amber"
        >
          <MetricRow left="Change summary" right={preview.change_label || "Website update"} strong />
          <MetricRow left="Prepared" right={readableDate(preview.prepared_at, "Ready")} />
          <MetricRow left="Pages" right={String(preview.page_count || 1)} />
          <Button
            label={s.websitePublishingAction === "publish" ? "Publishing…" : "Review & approve Go Live"}
            primary
            disabled={!view.canPublish || !!s.websitePublishingAction}
            onPress={() => s.confirmPublishHostedWebsite(preview.id)}
          />
        </Card>
      ) : null}

      {live ? (
        <>
          <Text style={styles.sectionLabel}>Live website health</Text>
          <Card
            eyebrow={`Live v${live.version_no}`}
            title={view.healthLabel || "Not checked yet"}
            body={
              view.healthStatus === "healthy"
                ? "BUSY reached the public site and confirmed it is serving the expected immutable deployment."
                : view.healthStatus === "degraded"
                ? "The site responded, but BUSY could not confirm that it is serving the expected deployment."
                : view.healthStatus === "down"
                ? "BUSY could not verify a healthy public response. The previous deployment records remain intact."
                : "The scheduled health worker will check the public site automatically. You can also run a check now."
            }
            footer={`Last checked: ${readableDate(website?.last_health_check_at)}`}
            tone={view.healthStatus === "healthy" ? "green" : view.healthStatus === "down" || view.healthStatus === "degraded" ? "amber" : "blue"}
          >
            <MetricRow left="Expected deployment" right={`v${live.version_no}`} strong />
            <MetricRow left="Last healthy" right={readableDate(website?.last_healthy_at)} />
            {view.latestHealth ? (
              <>
                <MetricRow left="HTTP" right={String(view.latestHealth.http_status || "No response")} />
                <MetricRow left="Response" right={`${Number(view.latestHealth.response_ms || 0)}ms`} />
              </>
            ) : null}
            <Button
              label={s.websitePublishingAction === "health" ? "Checking live site…" : "Check live site now"}
              disabled={!view.canCheckHealth || !!s.websitePublishingAction}
              onPress={s.runWebsiteHealthCheck}
            />
            <Button label="Open live website" primary onPress={s.openLiveWebsite} />
          </Card>
        </>
      ) : null}

      <Text style={styles.sectionLabel}>SEO basics & page structure</Text>
      <Card
        eyebrow="Evidence-led SEO"
        title={view.seoAudit?.label || "SEO basics"}
        body="BUSY checks practical on-page basics using approved business information. It does not invent locations, services or keyword claims just to make an SEO score look better."
        footer={`${s.websiteDraft?.pages?.length || 1} structured page${Number(s.websiteDraft?.pages?.length || 1) === 1 ? "" : "s"} • LocalBusiness structured-data foundation`}
        tone={view.seoAudit?.passed === view.seoAudit?.total ? "green" : "blue"}
      >
        {seoChecks.map((check) => (
          <MetricRow
            key={check.id}
            left={check.label}
            right={check.pass ? "Ready" : "Needs information"}
            strong={check.pass}
          />
        ))}
      </Card>

      <Text style={styles.sectionLabel}>Shared public business profile</Text>
      <Card
        eyebrow="Website + future BUSY Apps"
        title={view.publicProfile ? `Public profile revision ${view.publicProfile.revision || 1}` : "Created when a hosted version is prepared"}
        body="Approved public facts are projected into one server-owned profile so BUSY websites and the future BUSY Mini-App marketplace can reuse the same services, contact details, branding and public assets."
        footer="The public profile is not the private Business Brain and is not exposed directly through the database API."
        tone={view.publicProfile?.status === "live" ? "green" : "blue"}
      >
        <MetricRow left="Profile state" right={view.publicProfile?.status || "Not prepared"} />
        <MetricRow left="Source" right={view.publicProfile?.source_deployment_id ? "Immutable website deployment" : "No hosted deployment"} />
      </Card>

      {(view.previouslyPublished || []).length ? (
        <>
          <Text style={styles.sectionLabel}>Version history & rollback</Text>
          {(view.previouslyPublished || []).slice(0, 8).map((deployment) => (
            <Card
              key={deployment.id}
              eyebrow={`Previously published • v${deployment.version_no}`}
              title={deployment.change_label || "Website version"}
              body={
                deployment.change_summary?.items?.length
                  ? deployment.change_summary.items
                      .slice(0, 3)
                      .map((item) => item.label)
                      .join(" • ")
                  : "Immutable previously published version retained for rollback."
              }
              footer={`${readableDate(deployment.published_at, "Published previously")} • ${deployment.page_count || 1} page${Number(deployment.page_count || 1) === 1 ? "" : "s"}`}
              tone="blue"
            >
              <Button
                label={s.websitePublishingAction === `rollback:${deployment.id}` ? "Restoring…" : `Restore v${deployment.version_no}`}
                disabled={!view.canRollback || !!s.websitePublishingAction}
                onPress={() => s.confirmRollbackWebsite(deployment.id, deployment.version_no)}
              />
            </Card>
          ))}
        </>
      ) : null}

      <Text style={styles.sectionLabel}>Real website signals</Text>
      <Card
        eyebrow="External traffic • last 30 days"
        title={
          view.analyticsView?.collecting
            ? "Real delivery signals are being collected"
            : view.providerState?.configured
            ? "Cloudflare connected • waiting for routed traffic"
            : "BUSY collector ready • Cloudflare connection required"
        }
        body={
          view.analyticsView?.collecting
            ? "These figures come from the external delivery/analytics provider and are aggregated into BUSY by tenant. They are not generated estimates."
            : view.providerState?.configured
            ? "BUSY can read provider traffic, but no active BUSY-routed hostname has produced a provider rollup yet."
            : "The traffic collector and database rollups are live, but Cloudflare credentials/zone setup are still the external account gate. BUSY records zero rather than inventing traffic."
        }
        footer={`Last provider sync: ${readableDate(view.analyticsView?.lastSyncAt)}`}
        tone={view.analyticsView?.collecting ? "green" : "blue"}
      >
        <MetricRow left="HTTP requests" right={String(view.analyticsView?.requests || 0)} />
        <MetricRow left="Visits" right={String(view.analyticsView?.visits || 0)} />
        <MetricRow left="Edge transfer" right={readableBytes(view.analyticsView?.edgeBytes || 0)} />
        <MetricRow
          left="Attributed enquiries"
          right={String(view.enquiryView?.count || 0)}
          strong={Number(view.enquiryView?.count || 0) > 0}
        />
        <Button
          label={s.websitePublishingAction === "signals" ? "Refreshing signals…" : "Refresh real signals"}
          disabled={!!s.websitePublishingAction}
          onPress={s.refreshWebsiteSignals}
        />
      </Card>

      <Text style={styles.sectionLabel}>Delivery provider</Text>
      <Card
        eyebrow="Provider-neutral BUSY layer"
        title={view.providerState?.label || "External delivery not configured"}
        body={
          view.providerState?.configured
            ? "BUSY has the server-side provider configuration needed for Cloudflare for SaaS. Customer hostname activation, certificate state and real-route health remain independently verified."
            : "The V3.38 adapter is deployed, scheduled and tested. The remaining gate is the account-owner Cloudflare setup: API token, SaaS zone and managed CNAME target. No secret belongs in the app or GitHub."
        }
        footer="Cloudflare is the first adapter, not the BUSY data model. Another delivery provider can be added behind the same states later."
        tone={view.providerState?.configured ? "green" : "blue"}
      >
        <MetricRow left="API token" right={view.providerState?.tokenReady ? "Server secret ready" : "Not connected"} />
        <MetricRow left="SaaS zone" right={view.providerState?.zoneReady ? "Ready" : "Not connected"} />
        <MetricRow left="Routing target" right={view.providerState?.targetReady ? "Ready" : "Not connected"} />
        <MetricRow left="BUSY web domain" right={view.providerState?.baseDomainConfigured ? view.providerState.baseDomain : "Not configured"} />
      </Card>

      <Text style={styles.sectionLabel}>Default BUSY website address</Text>
      <Card
        eyebrow="Instant-address foundation"
        title={view.defaultAddressState?.address?.hostname || view.defaultAddressState?.status || "Not reserved yet"}
        body={
          view.defaultAddressState?.address
            ? "BUSY has reserved a tenant-safe hostname. It only becomes a usable public address after the BUSY platform domain/routing layer genuinely serves the expected deployment."
            : "V3.38 can reserve a BUSY-owned address automatically once the BUSY website base domain is connected to the provider."
        }
        footer="Two businesses with the same trading name still receive different tenant-safe hostnames."
        tone={view.defaultAddressState?.address?.live ? "green" : "blue"}
      >
        <MetricRow left="Address state" right={view.defaultAddressState?.status || "Not configured"} strong={view.defaultAddressState?.address?.live} />
        {view.defaultAddressState?.address?.live ? (
          <Button label="Open BUSY website address" primary onPress={s.openDefaultWebsiteAddress} />
        ) : null}
      </Card>

      <Text style={styles.sectionLabel}>Website usage & cost signals</Text>
      <Card
        eyebrow="Last 30 days • per business"
        title="Usage is measurable before scale arrives"
        body="BUSY now rolls up deployment work, generated artifact bytes, provider requests/visits/egress, health checks and active custom domains per tenant. This is the foundation for evidence-based fair-use limits and pricing."
        footer="Growth should mean increasing capacity and predictable variable cost, not rebuilding the platform."
        tone="blue"
      >
        <MetricRow left="Deployments created" right={String(view.usageView?.deployments || 0)} />
        <MetricRow left="Versions published" right={String(view.usageView?.publishedVersions || 0)} />
        <MetricRow left="Generated artifacts" right={readableBytes(view.usageView?.artifactBytes || 0)} />
        <MetricRow left="Provider egress" right={readableBytes(view.usageView?.edgeBytes || 0)} />
        <MetricRow left="Health checks" right={String(view.usageView?.healthChecks || 0)} />
        <MetricRow left="Active custom domains" right={String(view.usageView?.activeCustomDomains || 0)} />
      </Card>

      <Text style={styles.sectionLabel}>Enquiry attribution</Text>
      <Card
        eyebrow="Only genuine events count"
        title={
          view.enquiryView?.hasRealAttribution
            ? `${view.enquiryView.count} attributed website enquir${view.enquiryView.count === 1 ? "y" : "ies"}`
            : "Attribution pipeline ready • no events recorded"
        }
        body={
          view.enquiryView?.hasRealAttribution
            ? "BUSY has real website enquiry-attribution events for this tenant. These can later be joined to customer journeys without treating clicks or visits as enquiries."
            : "V3.38 has the tenant-safe attribution store ready, but the current static website does not silently add a public enquiry form or tracking event. BUSY will only count a real enquiry when an approved public enquiry module/provider emits one."
        }
        footer="Traffic, visits and enquiries remain separate evidence."
        tone={view.enquiryView?.hasRealAttribution ? "green" : "blue"}
      />

      <Text style={styles.sectionLabel}>Custom domain</Text>
      <Card
        eyebrow="Three separate truths"
        title={domain ? domain.hostname : "Connect a domain you already own"}
        body={
          domain
            ? "BUSY tracks ownership, traffic routing and SSL separately. A verified TXT record is not treated as a live HTTPS website."
            : "Start with ownership verification. Routing and certificate activation will only become active when a genuine domain-routing provider confirms them."
        }
        footer={
          view.providerState?.configured
            ? "Cloudflare provider adapter is connected; BUSY still waits for real DNS + deployment health before declaring routing active."
            : "BUSY-side provider adapter is ready. Cloudflare account setup is the remaining external gate."
        }
        tone={view.domainState?.routingActive ? "green" : "blue"}
      >
        <MetricRow left="Ownership" right={view.domainState?.ownership || "Not connected"} strong={view.domainState?.ownership === "Verified"} />
        <MetricRow left="Routing" right={view.domainState?.routing || "Not configured"} strong={view.domainState?.routing === "Active"} />
        <MetricRow left="SSL / HTTPS" right={view.domainState?.ssl || "Not configured"} strong={view.domainState?.ssl === "Active"} />
        {!domain ? (
          <>
            <Field
              label="Domain"
              value={s.websiteDomainDraft}
              onChangeText={s.setWebsiteDomainDraft}
              autoCapitalize="none"
              placeholder="example.co.uk"
            />
            <Button
              label={s.websitePublishingAction === "domain" ? "Creating verification…" : "Start domain verification"}
              disabled={!s.websiteDomainDraft.trim() || !!s.websitePublishingAction}
              onPress={s.requestWebsiteDomain}
            />
          </>
        ) : (
          <>
            <MetricRow left="Ownership TXT name" right={`_busy-verify.${domain.hostname}`} />
            <MetricRow left="TXT value" right={domain.verification_token || "Saved securely"} />
            {domain.status === "pending_verification" ? (
              <Button
                label={s.websitePublishingAction === `verify-domain:${domain.id}` ? "Checking DNS…" : "Check ownership verification"}
                disabled={!!s.websitePublishingAction}
                onPress={() => s.verifyWebsiteDomain(domain.id)}
              />
            ) : null}
            {view.canProvisionDomain ? (
              <Button
                label={
                  s.websitePublishingAction === `provision-domain:${domain.id}`
                    ? "Preparing provider routing…"
                    : view.providerState?.configured
                    ? "Prepare Cloudflare routing & SSL"
                    : "Cloudflare setup required before routing"
                }
                primary={!!view.providerState?.configured}
                disabled={!view.providerState?.configured || !!s.websitePublishingAction}
                onPress={() => s.provisionWebsiteDomain(domain.id)}
              />
            ) : null}
            {(view.domainState?.requiredRecords || []).slice(0, 8).map((record, index) => (
              <MetricRow
                key={`${record.purpose || "dns"}-${record.type || ""}-${record.name || index}`}
                left={`${record.type || "DNS"} • ${record.purpose || "required"}`}
                right={`${record.name || ""} → ${record.value || ""}`}
              />
            ))}
          </>
        )}
      </Card>

      <Text style={styles.sectionLabel}>Publishing infrastructure</Text>
      <Card
        eyebrow="Shared scalable worker queue"
        title={view.queueHealth?.status || "Queue not checked"}
        body="Publishing remains durable server-side work. Phones can close, reconnect or fail without becoming the deployment engine."
        footer="Each queued job stays tenant-scoped even though the worker infrastructure is shared."
        tone={view.queueHealth?.status === "Backlog needs attention" ? "amber" : "green"}
      >
        <MetricRow left="Waiting jobs" right={String(view.queueHealth?.length || 0)} />
        <MetricRow left="Oldest waiting" right={view.queueHealth?.oldestSeconds == null ? "None" : readableSeconds(view.queueHealth.oldestSeconds)} />
        <MetricRow left="Jobs seen" right={String(view.queueHealth?.totalMessages || 0)} />
      </Card>

      <Button label="Website Builder" onPress={() => s.go("websiteBuilder")} />
      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { WebsitePublishing };
