import React from "react";
import { Text, View } from "react-native";

import { styles } from "../theme/styles";
import { Shell, Card, Button, Field, MetricRow, StatusChip } from "../components/ui";

function readableSeconds(value) {
  const seconds = Number(value || 0);
  if (!seconds) return "Just now";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function WebsitePublishing({ s }) {
  const view = s.websitePublishingView || {};
  const website = view.website || null;
  const preview = view.previewDeployment || null;
  const live = view.liveDeployment || null;
  const domain = view.domainState?.latest || null;
  const activeJob = view.activeJob || null;

  return (
    <Shell
      s={s}
      title="Website Publishing"
      subtitle="Prepare, preview and publish one business at a time — on infrastructure designed for many BUSY businesses."
      brandCue="V3.36 • Multi-tenant • immutable versions • queued publishing • static CDN delivery."
    >
      <Card
        eyebrow="Hosting architecture"
        title="Built as a multi-business platform"
        body="Every website, deployment, domain and publish job is isolated by BUSY business ID. Public visitors load static CDN files instead of calling the BUSY app, AI or business database."
        footer="More publishing workers can be added later without changing the mobile app or the tenant data model."
        tone="green"
      >
        <MetricRow left="Business workspace" right={s.cloudWorkspace?.businessId ? "Tenant isolated" : "Sign in required"} strong={!!s.cloudWorkspace?.businessId} />
        <MetricRow left="Public delivery" right="Static CDN" strong />
        <MetricRow left="Version model" right="Immutable deployments" strong />
        <MetricRow left="Publishing queue" right={view.queueHealth?.status || "Not checked"} />
      </Card>

      {s.websitePublishingError ? (
        <Card
          eyebrow="Publishing needs attention"
          title="Nothing unsafe was applied"
          body={s.websitePublishingError}
          tone="amber"
        />
      ) : null}

      {s.websitePublishingNotice ? (
        <Card
          eyebrow="Latest website publishing update"
          title={view.publicStatus || "Website status"}
          body={s.websitePublishingNotice}
          tone="blue"
        />
      ) : null}

      <Card
        eyebrow="Current state"
        title={view.publicStatus || "Website publishing"}
        body={
          live
            ? view.draftChangedSinceHosted
              ? "The current site is live, but the BUSY draft has newer changes. Prepare a new hosted preview before changing the live site."
              : "The current approved version is live and the saved draft matches the latest hosted generation."
            : preview
            ? "A hosted preview is ready. Review that exact immutable version before deciding whether to make it public."
            : activeJob
            ? "The publishing worker is processing this business's queued website job."
            : "Prepare a hosted preview when the website draft is ready."
        }
        footer={website?.last_error ? `Last error: ${website.last_error}` : "Public changes require a separate owner-controlled approval."}
        tone={website?.last_error ? "amber" : live ? "green" : "blue"}
      >
        <MetricRow left="Draft generation" right={String(s.websiteDraft?.generation || 0)} />
        <MetricRow left="Hosted generation" right={String(preview?.source_generation || live?.source_generation || 0)} />
        <MetricRow left="Latest hosted version" right={view.latestDeployment ? `v${view.latestDeployment.version_no}` : "None"} />
        <MetricRow left="Live version" right={live ? `v${live.version_no}` : "Not live"} strong={!!live} />
        {activeJob ? (
          <MetricRow
            left="Queued work"
            right={`${activeJob.action} • ${activeJob.status}`}
            strong
          />
        ) : null}
        <Button
          label={s.websitePublishingAction === "prepare" ? "Preparing…" : "Prepare hosted preview"}
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
          label={s.websitePublishingLoading ? "Refreshing…" : "Refresh publishing status"}
          disabled={s.websitePublishingLoading}
          onPress={s.refreshWebsitePublishingStatus}
        />
      </Card>

      {preview && preview.id !== live?.id ? (
        <Card
          eyebrow="Go Live gate"
          title={`Publish website version v${preview.version_no}?`}
          body="This is a public change. BUSY will publish exactly the hosted version you previewed — not whatever happens to be in the editor later."
          footer="The previous live version is kept so it can be restored."
          tone="amber"
        >
          <MetricRow left="Exact version" right={`v${preview.version_no}`} strong />
          <MetricRow left="Source generation" right={String(preview.source_generation || 1)} />
          <MetricRow left="Prepared" right={preview.prepared_at ? new Date(preview.prepared_at).toLocaleString("en-GB") : "Ready"} />
          <Button
            label={s.websitePublishingAction === "publish" ? "Publishing…" : "Review & approve Go Live"}
            primary
            disabled={!view.canPublish || !!s.websitePublishingAction}
            onPress={() => s.confirmPublishHostedWebsite(preview.id)}
          />
        </Card>
      ) : null}

      {live ? (
        <Card
          eyebrow="Live website"
          title={`Version v${live.version_no} is public`}
          body="Visitors are served the stable live alias from public object storage/CDN. Normal page views do not need the BUSY database or AI."
          footer={website?.live_url || live.public_url || "Live URL is being recorded"}
          tone="green"
        >
          <MetricRow left="Published" right={live.published_at ? new Date(live.published_at).toLocaleString("en-GB") : "Live"} />
          <MetricRow left="CDN serving" right="Active" strong />
          <Button label="Open live website" primary onPress={s.openLiveWebsite} />
        </Card>
      ) : null}

      {(view.previouslyPublished || []).length ? (
        <>
          <Text style={styles.sectionLabel}>Version history & rollback</Text>
          {(view.previouslyPublished || []).slice(0, 8).map((deployment) => (
            <Card
              key={deployment.id}
              eyebrow="Previously published"
              title={`Website v${deployment.version_no}`}
              body="This published version is retained as an immutable rollback target."
              footer={deployment.published_at ? new Date(deployment.published_at).toLocaleString("en-GB") : "Published previously"}
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

      <Text style={styles.sectionLabel}>Publishing queue health</Text>
      <Card
        eyebrow="Shared scalable worker queue"
        title={view.queueHealth?.status || "Queue not checked"}
        body="Website publishing jobs are durable server-side work. A spike in publishes does not force every phone to stay connected while files are prepared."
        footer="The queue is shared infrastructure, but each job still carries one business tenant ID."
        tone={view.queueHealth?.status === "Backlog needs attention" ? "amber" : "green"}
      >
        <MetricRow left="Waiting jobs" right={String(view.queueHealth?.length || 0)} />
        <MetricRow left="Oldest waiting" right={view.queueHealth?.oldestSeconds == null ? "None" : readableSeconds(view.queueHealth.oldestSeconds)} />
        <MetricRow left="Jobs seen by queue" right={String(view.queueHealth?.totalMessages || 0)} />
      </Card>

      <Text style={styles.sectionLabel}>Custom domain</Text>
      <Card
        eyebrow="Domain ownership"
        title={domain ? domain.hostname : "Connect a domain you already own"}
        body={
          domain
            ? domain.status === "verified"
              ? "BUSY has verified that this business controls the domain. Routing and SSL are deliberately separate states and are not being falsely marked active."
              : "Add the TXT verification record shown below, then ask BUSY to verify it."
            : "V3.36 records and verifies domain ownership per business. Domain purchase and automatic routing are separate provider integrations."
        }
        footer={domain ? `Ownership: ${domain.status} • SSL: ${domain.ssl_status} • routing: ${domain.routing_provider}` : "Verification does not move or alter the domain by itself."}
        tone={domain?.status === "verified" ? "green" : "blue"}
      >
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
            <MetricRow left="DNS record" right={`_busy-verify.${domain.hostname}`} />
            <MetricRow left="TXT value" right={domain.verification_token || "Saved securely"} />
            <Button
              label={s.websitePublishingAction === `verify-domain:${domain.id}` ? "Checking DNS…" : "Check DNS verification"}
              disabled={domain.status === "active" || !!s.websitePublishingAction}
              onPress={() => s.verifyWebsiteDomain(domain.id)}
            />
          </>
        )}
      </Card>

      <Card
        eyebrow="V3.36 boundary"
        title="Custom routing is not being faked"
        body="A verified domain means BUSY proved ownership. It does not yet mean DNS traffic has been routed to BUSY or that an SSL certificate is active. Those states remain explicit until a routing provider is genuinely connected."
        tone="blue"
      />

      <Button label="Website Builder" onPress={() => s.go("websiteBuilder")} />
      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { WebsitePublishing };
