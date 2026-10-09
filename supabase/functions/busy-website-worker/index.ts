import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {renderOptInContactForm} from "./formHtml.mjs";
import {formReadiness} from "./formPolicy.mjs";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SOURCE_BUCKET = "busy-social-media";
const PREVIEW_BUCKET = "busy-website-preview";
const PUBLIC_BUCKET = "busy-website-public";
const PROVIDER_URL = `${SUPABASE_URL}/functions/v1/busy-website-provider`;
const HEALTH_URL = `${SUPABASE_URL}/functions/v1/busy-website-health`;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function clean(value: unknown, max = 8000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function escapeHtml(value: unknown) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function contentTypeFor(path: string) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function assetKey(asset: any, index = 0) {
  return clean(asset?.key, 500) || clean(asset?.storagePath, 1000) || `asset-${index}`;
}

function fileNameFor(asset: any, index = 0) {
  const source = clean(asset?.storagePath, 1000);
  const raw = source.split("/").filter(Boolean).at(-1) || `asset-${index}.jpg`;
  return raw.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-180);
}

function collectAssetRefs(draft: any) {
  const raw: any[] = [];
  safeArray(draft?.sections).forEach((section: any) => {
    if (section?.id === "hero" && section?.asset) raw.push(section.asset);
    if (section?.type === "gallery") {
      safeArray(section?.items).forEach((item: any) => raw.push(item));
    }
  });

  const grouped = new Map<string, any>();
  raw.forEach((asset, index) => {
    const sourcePath = clean(asset?.storagePath, 1000);
    if (!sourcePath) return;
    const groupKey = sourcePath;
    const existing = grouped.get(groupKey) || {
      sourcePath,
      keys: [],
      fileName: fileNameFor(asset, index),
    };
    const key = assetKey(asset, index);
    if (!existing.keys.includes(key)) existing.keys.push(key);
    grouped.set(groupKey, existing);
  });
  return [...grouped.values()];
}

function buildAssetMap(manifest: any, field: "previewUrl" | "publicUrl") {
  const map: Record<string, string> = {};
  safeArray(manifest?.assets).forEach((asset: any) => {
    const url = clean(asset?.[field], 4000);
    if (!url) return;
    if (asset.sourcePath) map[asset.sourcePath] = url;
    safeArray(asset.keys).forEach((key: string) => {
      if (key) map[key] = url;
    });
  });
  return map;
}

function urlForAsset(asset: any, urls: Record<string, string>, index = 0) {
  return (
    urls[assetKey(asset, index)] ||
    urls[clean(asset?.storagePath, 1000)] ||
    ""
  );
}

function pageList(draft: any) {
  const configured = safeArray(draft?.pages).filter(
    (page: any) => page?.enabled !== false && clean(page?.id, 80)
  );
  if (configured.length) return configured;
  return [
    {
      id: "home",
      path: "/",
      outputPath: "index.html",
      title: "Home",
      sectionIds: safeArray(draft?.sections)
        .filter((section: any) => section?.enabled !== false)
        .map((section: any) => section.id),
    },
  ];
}

function pageSeo(draft: any, page: any) {
  return (
    draft?.seo?.pages?.[page?.id] || {
      title: draft?.seo?.title || draft?.businessName || "Website",
      description: draft?.seo?.description || "",
      heading: page?.id === "home" ? draft?.businessName || "" : page?.title || "",
    }
  );
}

function renderSectionHtml(
  draft: any,
  section: any,
  urls: Record<string, string>,
  isFirstSection: boolean
) {
  const theme = draft?.theme || {};
  if (section.type === "hero") {
    const image = section.asset ? urlForAsset(section.asset, urls) : "";
    return `<section class="hero hero-${escapeHtml(
      theme.heroSize || "large"
    )}"><div class="wrap">${image ? `<img class="hero-image" src="${escapeHtml(
      image
    )}" alt="">` : ""}<p class="kicker">${escapeHtml(
      draft.businessName
    )}</p><h1>${escapeHtml(section.title)}</h1><p>${escapeHtml(
      section.body
    )}</p>${
      section.cta && section.ctaHref
        ? `<a class="cta" href="${escapeHtml(
            section.ctaHref
          )}">${escapeHtml(section.cta)}</a>`
        : ""
    }</div></section>`;
  }

  const headingTag = isFirstSection ? "h1" : "h2";

  if (section.type === "services") {
    return `<section id="services"><div class="wrap"><${headingTag}>${escapeHtml(
      section.title
    )}</${headingTag}><div class="grid">${safeArray(section.items)
      .map(
        (item: any) =>
          `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(
            item.body
          )}</p></article>`
      )
      .join("")}</div></div></section>`;
  }

  if (section.type === "gallery") {
    const images = safeArray(section.items)
      .map((item: any, index: number) => {
        const url = urlForAsset(item, urls, index);
        return url
          ? `<img class="gallery-image" src="${escapeHtml(
              url
            )}" alt="">`
          : "";
      })
      .filter(Boolean)
      .join("");
    return `<section id="gallery"><div class="wrap"><${headingTag}>${escapeHtml(
      section.title
    )}</${headingTag}><div class="gallery">${images}</div></div></section>`;
  }

  if (section.type === "testimonials" || section.type === "faq") {
    return `<section id="${escapeHtml(
      section.id
    )}"><div class="wrap"><${headingTag}>${escapeHtml(
      section.title
    )}</${headingTag}>${safeArray(section.items)
      .map(
        (item: any) =>
          `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(
            item.body
          )}</p></article>`
      )
      .join("")}</div></section>`;
  }

  if (section.type === "contact") {
    return `<section id="contact"><div class="wrap"><${headingTag}>${escapeHtml(
      section.title
    )}</${headingTag}><p>${escapeHtml(section.body)}</p>${
      section.phone
        ? `<p><a href="tel:${escapeHtml(
            String(section.phone).replace(/\s+/g, "")
          )}">${escapeHtml(section.phone)}</a></p>`
        : ""
    }${
      section.email
        ? `<p><a href="mailto:${escapeHtml(
            section.email
          )}">${escapeHtml(section.email)}</a></p>`
        : ""
    }${
      section.openingHours
        ? `<p>${escapeHtml(section.openingHours)}</p>`
        : ""
    }</div></section>`;
  }

  return `<section id="${escapeHtml(
    section.id
  )}"><div class="wrap"><${headingTag}>${escapeHtml(
    section.title
  )}</${headingTag}><p>${escapeHtml(section.body).replace(
    /\n/g,
    "<br>"
  )}</p></div></section>`;
}

function relativePageHref(currentPage: any, targetPath: string) {
  const target = clean(targetPath, 240) || "/";
  const currentIsHome = !currentPage || currentPage.id === "home";
  if (target === "/") return currentIsHome ? "./index.html" : "../index.html";
  const segment = target.replace(/^\/+|\/+$/g, "");
  return currentIsHome
    ? `./${segment}/index.html`
    : `../${segment}/index.html`;
}

function renderWebsiteHtml(
  draft: any,
  urls: Record<string, string>,
  page: any,
  deploymentId: string,
  pageUrls: Record<string, string> = {},
  formMarkup: string = ""
) {
  const allSections = safeArray(draft?.sections).filter(
    (section: any) => section?.enabled !== false
  );
  const allowed = new Set(safeArray(page?.sectionIds));
  const sections =
    allowed.size > 0
      ? allSections.filter((section: any) => allowed.has(section.id))
      : allSections;
  const theme = draft?.theme || {};
  const primary = clean(theme?.primary, 100);
  const secondary = clean(theme?.secondary, 100);
  const cssVars = [
    primary ? `--brand-primary:${escapeHtml(primary)};` : "",
    secondary ? `--brand-secondary:${escapeHtml(secondary)};` : "",
  ]
    .filter(Boolean)
    .join("");
  const seo = pageSeo(draft, page);
  const navigation = safeArray(draft?.navigation);
  const navHtml = navigation.length
    ? `<nav aria-label="Main navigation"><div class="nav-wrap"><a class="brand" href="/">${escapeHtml(
        draft?.businessName || "Home"
      )}</a><div class="nav-links">${navigation
        .map(
          (item: any) =>
            `<a href="${escapeHtml(
              pageUrls[item.id] || relativePageHref(page, item.href || "/")
            )}">${escapeHtml(item.label || item.id)}</a>`
        )
        .join("")}</div></div></nav>`
    : "";

  const sectionHtml = sections
    .map((section: any, index: number) =>
      renderSectionHtml(draft, section, urls, index === 0)
    )
    .join("");

  const contact: any =
    allSections.find((section: any) => section.id === "contact") || {};
  const sameAs = Object.values(contact?.social || {})
    .map((value) => clean(value, 1000))
    .filter((value) => /^https?:\/\//i.test(value));
  const structuredData = {
    "@context": "https://schema.org",
    "@type": draft?.seo?.schemaType || "LocalBusiness",
    name: clean(draft?.businessName, 240),
    description: clean(draft?.description, 1200) || clean(seo?.description, 1200),
    telephone: clean(contact?.phone, 120) || undefined,
    email: clean(contact?.email, 240) || undefined,
    areaServed: clean(draft?.serviceArea, 500) || undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };
  Object.keys(structuredData).forEach((key) => {
    if ((structuredData as any)[key] === undefined) delete (structuredData as any)[key];
  });

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="busy-deployment" content="${escapeHtml(
    deploymentId
  )}"><meta name="busy-page" content="${escapeHtml(
    page?.id || "home"
  )}"><title>${escapeHtml(
    seo?.title || draft?.businessName || "Website"
  )}</title><meta name="description" content="${escapeHtml(
    seo?.description || ""
  )}"><script type="application/ld+json">${JSON.stringify(
    structuredData
  ).replace(/</g, "\\u003c")}</script><style>:root{${cssVars}}*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.55;color:#1f2933;background:#fff}nav{position:sticky;top:0;z-index:10;background:rgba(255,255,255,.96);border-bottom:1px solid #ececec}.nav-wrap{max-width:1080px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{font-weight:800;color:inherit;text-decoration:none}.nav-links{display:flex;gap:14px;flex-wrap:wrap}.nav-links a{color:inherit;text-decoration:none}.wrap{max-width:1080px;margin:0 auto;padding:64px 24px}section:nth-child(even){background:#f7f7f5}h1{font-size:clamp(2.4rem,7vw,4.8rem);line-height:1.04;margin:.2em 0}h2{font-size:2rem}h3{margin-top:0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px}article{padding:22px;border:1px solid #e5e7eb;border-radius:18px;background:#fff}.cta{display:inline-block;margin-top:18px;padding:12px 18px;border-radius:999px;background:var(--brand-primary,#1f5eff);color:#fff;text-decoration:none}.hero-image{width:100%;max-height:620px;object-fit:cover;border-radius:22px;margin-bottom:28px}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}.gallery-image{width:100%;height:260px;object-fit:cover;border-radius:16px}.mood-warm{background:#fffaf2}.mood-bold h1{font-weight:900}.mood-premium{letter-spacing:.01em}.hero-extra-large .wrap{padding-top:100px;padding-bottom:100px}.hero-medium .wrap{padding-top:44px;padding-bottom:44px}@media(max-width:700px){.nav-wrap{align-items:flex-start;flex-direction:column}.wrap{padding:42px 20px}.gallery-image{height:220px}}</style></head><body class="mood-${escapeHtml(
    theme?.mood || "clean"
  )}">${navHtml}${sectionHtml}${formMarkup}</body></html>`;
}

async function ensureBucket(
  name: string,
  options: { public: boolean; allowedMimeTypes: string[]; fileSizeLimit: number }
) {
  const existing = await supabase.storage.getBucket(name);
  if (!existing.error && existing.data) return;
  const created = await supabase.storage.createBucket(name, options);
  if (
    created.error &&
    !/already exists|duplicate/i.test(created.error.message || "")
  ) {
    throw created.error;
  }
}

async function ensureBuckets() {
  await ensureBucket(PREVIEW_BUCKET, {
    public: false,
    allowedMimeTypes: ["text/html", "image/jpeg", "image/png", "image/webp"],
    fileSizeLimit: 15_000_000,
  });
  await ensureBucket(PUBLIC_BUCKET, {
    public: true,
    allowedMimeTypes: ["text/html", "image/jpeg", "image/png", "image/webp"],
    fileSizeLimit: 15_000_000,
  });
}

async function uploadText(
  bucket: string,
  path: string,
  value: string,
  cacheControl: string,
  upsert = true
) {
  const result = await supabase.storage
    .from(bucket)
    .upload(path, new Blob([value], { type: "text/html" }), {
      contentType: "text/html",
      cacheControl,
      upsert,
    });
  if (result.error) throw result.error;
}

async function loadJob(jobId: string) {
  const job = await supabase
    .from("busy_website_publish_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (job.error) throw job.error;
  if (!job.data) throw new Error("Queued website publish job no longer exists.");
  return job.data;
}

async function loadDeployment(deploymentId: string) {
  const deployment = await supabase
    .from("busy_website_deployments")
    .select("*")
    .eq("id", deploymentId)
    .maybeSingle();
  if (deployment.error) throw deployment.error;
  if (!deployment.data) throw new Error("Website deployment not found.");
  return deployment.data;
}

async function loadWebsite(websiteId: string) {
  const website = await supabase
    .from("busy_websites")
    .select("*")
    .eq("id", websiteId)
    .maybeSingle();
  if (website.error) throw website.error;
  if (!website.data) throw new Error("Website project not found.");
  return website.data;
}

function profileFromDraft(draft: any) {
  const sections = safeArray(draft?.sections);
  const contact: any = sections.find((section: any) => section?.id === "contact") || {};
  const services: any = sections.find((section: any) => section?.id === "services") || {};
  const hero: any = sections.find((section: any) => section?.id === "hero") || {};
  const gallery: any = sections.find((section: any) => section?.id === "gallery") || {};
  return {
    schemaVersion: 1,
    businessName: clean(draft?.businessName, 240),
    businessType: clean(draft?.businessType, 240),
    serviceArea: clean(draft?.serviceArea, 500),
    slug: clean(draft?.slug, 100),
    theme: draft?.theme || {},
    contact: {
      phone: clean(contact?.phone, 120),
      email: clean(contact?.email, 240),
      openingHours: clean(contact?.openingHours, 600),
      social: contact?.social && typeof contact.social === "object" ? contact.social : {},
    },
    services: safeArray(services?.items).map((item: any) => ({
      id: clean(item?.id, 120),
      name: clean(item?.title, 240),
      description: clean(item?.body, 1200),
    })),
    assets: {
      hero: hero?.asset || null,
      gallery: safeArray(gallery?.items).slice(0, 24),
    },
    pages: pageList(draft).map((page: any) => ({
      id: clean(page?.id, 80),
      path: clean(page?.path, 240),
      title: clean(page?.title, 160),
    })),
  };
}

async function syncProfileForDeployment(
  job: any,
  deployment: any,
  status: "draft" | "preview_ready" | "live"
) {
  const profile = profileFromDraft(deployment.source_draft);
  const result = await supabase
    .from("busy_public_business_profiles")
    .upsert(
      {
        business_id: job.business_id,
        source_website_id: job.website_id,
        source_deployment_id: deployment.id,
        public_slug: `${clean(deployment.source_draft?.slug, 60) || "business"}-${String(
          job.business_id
        ).replaceAll("-", "").slice(0, 8)}`.slice(0, 80),
        display_name: clean(deployment.source_draft?.businessName, 240),
        status,
        revision: Math.max(1, Number(deployment.version_no) || 1),
        profile,
        updated_by: job.requested_by || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id" }
    );
  if (result.error) throw result.error;
}

async function prepareDeployment(job: any, deployment: any, website: any) {
  await ensureBuckets();
  await supabase
    .from("busy_website_deployments")
    .update({ state: "preparing", last_error: null })
    .eq("id", deployment.id);

  const refs = collectAssetRefs(deployment.source_draft);
  const assets: any[] = [];
  let artifactBytes = 0;

  for (let index = 0; index < refs.length; index += 1) {
    const ref = refs[index];
    const downloaded = await supabase.storage
      .from(SOURCE_BUCKET)
      .download(ref.sourcePath);
    if (downloaded.error || !downloaded.data) {
      assets.push({
        ...ref,
        previewPath: "",
        previewUrl: "",
        publicPath: "",
        publicUrl: "",
        warning: "Approved source image could not be copied into the website preview.",
      });
      continue;
    }

    const contentType = contentTypeFor(ref.fileName);
    const previewPath = `${job.business_id}/${job.website_id}/deployments/${deployment.id}/assets/${index + 1}-${ref.fileName}`;
    const uploaded = await supabase.storage
      .from(PREVIEW_BUCKET)
      .upload(previewPath, downloaded.data, {
        contentType,
        cacheControl: "3600",
        upsert: true,
      });
    if (uploaded.error) throw uploaded.error;

    const signed = await supabase.storage
      .from(PREVIEW_BUCKET)
      .createSignedUrl(previewPath, 31536000);
    if (signed.error) throw signed.error;

    const bytes = Number(downloaded.data.size || 0);
    artifactBytes += bytes;
    assets.push({
      ...ref,
      contentType,
      bytes,
      previewPath,
      previewUrl: signed.data.signedUrl,
      publicPath: "",
      publicUrl: "",
      warning: "",
    });
  }

  const pages = pageList(deployment.source_draft);
  const manifest: any = {
    schemaVersion: 2,
    sourceBucket: SOURCE_BUCKET,
    previewBucket: PREVIEW_BUCKET,
    publicBucket: PUBLIC_BUCKET,
    assets,
    pages: [],
    preparedAt: new Date().toISOString(),
  };

  // Include the same opt-in form in the immutable hosted preview and the
  // eventual public artifact. Browser script disallows submission from the
  // signed private preview origin. Existing sites default to NO form.
  const optedInFormHtml=renderOptInContactForm({
    siteId:website.id,siteHostname:website.default_hostname||"",
    siteKey:Deno.env.get("BUSY_TURNSTILE_SITE_KEY")||"",
    endpoint:SUPABASE_URL+"/functions/v1/busy-website-form",
    enabled:formReadiness(website,{
      globalEnabled:Deno.env.get("BUSY_WEBSITE_FORM_INTAKE_ENABLED")==="true",
      hasSecret:!!Deno.env.get("BUSY_TURNSTILE_SITE_KEY")
    }).ready
  });

  // Create each private page once so Storage can issue stable signed URLs for
  // cross-page preview navigation, then overwrite with the final signed links.
  for (const page of pages) {
    const outputPath = clean(page?.outputPath, 300) || (page.id === "home" ? "index.html" : `${page.id}/index.html`);
    const previewPath = `${job.business_id}/${job.website_id}/deployments/${deployment.id}/${outputPath}`;
    const provisional = renderWebsiteHtml(
      deployment.source_draft,
      buildAssetMap(manifest, "previewUrl"),
      page,
      deployment.id,
      {},
      page.id==="home"||page.id==="contact"?optedInFormHtml:""
    );
    await uploadText(PREVIEW_BUCKET, previewPath, provisional, "300", true);
    const signed = await supabase.storage
      .from(PREVIEW_BUCKET)
      .createSignedUrl(previewPath, 31536000);
    if (signed.error) throw signed.error;
    manifest.pages.push({
      id: page.id,
      path: page.path,
      outputPath,
      previewPath,
      previewUrl: signed.data.signedUrl,
      publicPath: "",
      publicUrl: "",
    });
  }

  const previewPageUrls = Object.fromEntries(
    manifest.pages.map((page: any) => [page.id, page.previewUrl])
  );

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    const pageManifest = manifest.pages[index];
    const finalHtml = renderWebsiteHtml(
      deployment.source_draft,
      buildAssetMap(manifest, "previewUrl"),
      page,
      deployment.id,
      previewPageUrls,
      page.id==="home"||page.id==="contact"?optedInFormHtml:""
    );
    await uploadText(PREVIEW_BUCKET, pageManifest.previewPath, finalHtml, "300", true);
    artifactBytes += new TextEncoder().encode(finalHtml).byteLength;
  }

  const homePage = manifest.pages.find((page: any) => page.id === "home") || manifest.pages[0];
  const now = new Date().toISOString();
  const updated = await supabase
    .from("busy_website_deployments")
    .update({
      state: "preview_ready",
      manifest,
      preview_storage_path: homePage?.previewPath || null,
      artifact_bytes: artifactBytes,
      last_error: null,
      prepared_at: now,
    })
    .eq("id", deployment.id)
    .select("*")
    .single();
  if (updated.error) throw updated.error;

  const websiteUpdated = await supabase
    .from("busy_websites")
    .update({
      status: website.current_live_deployment_id
        ? "update_pending"
        : "preview_ready",
      current_preview_deployment_id: deployment.id,
      last_error: null,
      updated_at: now,
    })
    .eq("id", website.id);
  if (websiteUpdated.error) throw websiteUpdated.error;

  await syncProfileForDeployment(job, updated.data, "preview_ready");
}

async function publishDeployment(job: any, deployment: any, website: any) {
  if (!deployment.preview_storage_path || !deployment.prepared_at) {
    throw new Error("The website version must be prepared before publishing.");
  }
  await ensureBuckets();

  await supabase
    .from("busy_website_deployments")
    .update({ state: "publishing", last_error: null })
    .eq("id", deployment.id);

  const manifest: any = {
    ...(deployment.manifest || {}),
    assets: safeArray(deployment.manifest?.assets).map((item: any) => ({
      ...item,
    })),
    pages: safeArray(deployment.manifest?.pages).map((item: any) => ({
      ...item,
    })),
  };

  for (let index = 0; index < manifest.assets.length; index += 1) {
    const asset = manifest.assets[index];
    if (!asset.previewPath) continue;
    const downloaded = await supabase.storage
      .from(PREVIEW_BUCKET)
      .download(asset.previewPath);
    if (downloaded.error || !downloaded.data) {
      throw new Error(
        `Prepared website asset is missing: ${asset.fileName || asset.sourcePath}`
      );
    }

    const publicPath = `${job.business_id}/${job.website_id}/deployments/${deployment.id}/assets/${index + 1}-${asset.fileName}`;
    const uploaded = await supabase.storage
      .from(PUBLIC_BUCKET)
      .upload(publicPath, downloaded.data, {
        contentType: asset.contentType || contentTypeFor(asset.fileName || ""),
        cacheControl: "31536000",
        upsert: true,
      });
    if (uploaded.error) throw uploaded.error;
    const publicUrl = supabase.storage
      .from(PUBLIC_BUCKET)
      .getPublicUrl(publicPath).data.publicUrl;
    manifest.assets[index] = {
      ...asset,
      publicPath,
      publicUrl,
    };
  }

  const pages = pageList(deployment.source_draft);
  manifest.pages = [];
  manifest.publishedAt = new Date().toISOString();

  const optedInFormHtml=renderOptInContactForm({
    siteId:website.id,
    siteHostname:website.default_hostname||"",
    siteKey:Deno.env.get("BUSY_TURNSTILE_SITE_KEY")||"",
    endpoint:SUPABASE_URL+"/functions/v1/busy-website-form",
    enabled:formReadiness(website,{
      globalEnabled:Deno.env.get("BUSY_WEBSITE_FORM_INTAKE_ENABLED")==="true",
      hasSecret:!!Deno.env.get("BUSY_TURNSTILE_SITE_KEY")
    }).ready
  });
  for (const page of pages) {
    const outputPath = clean(page?.outputPath, 300) || (page.id === "home" ? "index.html" : `${page.id}/index.html`);
    const versionPath = `${job.business_id}/${job.website_id}/deployments/${deployment.id}/${outputPath}`;
    const livePath = `${job.business_id}/${job.website_id}/live/${outputPath}`;
    const html = renderWebsiteHtml(
      deployment.source_draft,
      buildAssetMap(manifest, "publicUrl"),
      page,
      deployment.id,
      {},
      page.id==="home"||page.id==="contact"?optedInFormHtml:""
    );
    await uploadText(PUBLIC_BUCKET, versionPath, html, "31536000", true);
    await uploadText(PUBLIC_BUCKET, livePath, html, "60", true);
    manifest.pages.push({
      id: page.id,
      path: page.path,
      outputPath,
      previewPath:
        safeArray(deployment.manifest?.pages).find((item: any) => item.id === page.id)?.previewPath || "",
      previewUrl:
        safeArray(deployment.manifest?.pages).find((item: any) => item.id === page.id)?.previewUrl || "",
      publicPath: versionPath,
      publicUrl: supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(versionPath).data.publicUrl,
      livePath,
      liveUrl: supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(livePath).data.publicUrl,
    });
  }

  const homePage = manifest.pages.find((page: any) => page.id === "home") || manifest.pages[0];
  const liveUrl = homePage?.liveUrl || "";
  const versionPath = homePage?.publicPath || "";
  const now = new Date().toISOString();
  const previousLiveId = website.current_live_deployment_id;

  if (previousLiveId && previousLiveId !== deployment.id) {
    const previous = await supabase
      .from("busy_website_deployments")
      .update({ state: "superseded" })
      .eq("id", previousLiveId)
      .eq("website_id", website.id);
    if (previous.error) throw previous.error;
  }

  const deploymentUpdated = await supabase
    .from("busy_website_deployments")
    .update({
      state: "live",
      manifest,
      public_storage_path: versionPath,
      public_url: liveUrl,
      last_error: null,
      published_at: now,
    })
    .eq("id", deployment.id)
    .select("*")
    .single();
  if (deploymentUpdated.error) throw deploymentUpdated.error;

  const websiteUpdated = await supabase
    .from("busy_websites")
    .update({
      status: "live",
      current_live_deployment_id: deployment.id,
      current_preview_deployment_id: deployment.id,
      live_url: liveUrl,
      health_status: "not_checked",
      next_health_check_at: now,
      ...(website.default_hostname
        ? {
            delivery_provider: "cloudflare_saas",
            delivery_status: "provisioning",
          }
        : {}),
      last_error: null,
      updated_at: now,
    })
    .eq("id", website.id);
  if (websiteUpdated.error) throw websiteUpdated.error;

  await syncProfileForDeployment(job, deploymentUpdated.data, "live");
}

async function rollbackDeployment(job: any, target: any, website: any) {
  if (!target.published_at || !target.public_storage_path) {
    throw new Error("That website version has never been published.");
  }
  await ensureBuckets();

  const manifest: any = target.manifest || {};
  const pages = pageList(target.source_draft);
  const optedInFormHtml=renderOptInContactForm({
    siteId:website.id,siteHostname:website.default_hostname||"",
    siteKey:Deno.env.get("BUSY_TURNSTILE_SITE_KEY")||"",
    endpoint:SUPABASE_URL+"/functions/v1/busy-website-form",
    enabled:formReadiness(website,{
      globalEnabled:Deno.env.get("BUSY_WEBSITE_FORM_INTAKE_ENABLED")==="true",
      hasSecret:!!Deno.env.get("BUSY_TURNSTILE_SITE_KEY")
    }).ready
  });
  for (const page of pages) {
    const outputPath = clean(page?.outputPath, 300) || (page.id === "home" ? "index.html" : `${page.id}/index.html`);
    const livePath = `${job.business_id}/${job.website_id}/live/${outputPath}`;
    const html = renderWebsiteHtml(
      target.source_draft,
      buildAssetMap(manifest, "publicUrl"),
      page,
      target.id,
      {},
      page.id==="home"||page.id==="contact"?optedInFormHtml:""
    );
    await uploadText(PUBLIC_BUCKET, livePath, html, "60", true);
  }

  const livePath = `${job.business_id}/${job.website_id}/live/index.html`;
  const liveUrl = supabase.storage
    .from(PUBLIC_BUCKET)
    .getPublicUrl(livePath).data.publicUrl;

  const previousLiveId = website.current_live_deployment_id;
  if (previousLiveId && previousLiveId !== target.id) {
    const previous = await supabase
      .from("busy_website_deployments")
      .update({ state: "superseded" })
      .eq("id", previousLiveId)
      .eq("website_id", website.id);
    if (previous.error) throw previous.error;
  }

  const targetUpdated = await supabase
    .from("busy_website_deployments")
    .update({ state: "live", last_error: null })
    .eq("id", target.id)
    .select("*")
    .single();
  if (targetUpdated.error) throw targetUpdated.error;

  const siteUpdated = await supabase
    .from("busy_websites")
    .update({
      status: "live",
      current_live_deployment_id: target.id,
      live_url: liveUrl,
      health_status: "not_checked",
      next_health_check_at: new Date().toISOString(),
      ...(website.default_hostname
        ? {
            delivery_provider: "cloudflare_saas",
            delivery_status: "provisioning",
          }
        : {}),
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", website.id);
  if (siteUpdated.error) throw siteUpdated.error;

  await syncProfileForDeployment(job, targetUpdated.data, "live");
}

function permanentPublishingFailure(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("prepared website asset is missing") ||
    lower.includes("must be prepared before publishing") ||
    lower.includes("has never been published") ||
    lower.includes("unsupported website publish job")
  );
}

function retryDelaySeconds(jobId: string, attempt: number) {
  const base = Math.min(900, 30 * 2 ** Math.max(0, attempt - 1));
  const jitter =
    clean(jobId, 120)
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0) % 23;
  return Math.min(900, base + jitter);
}

async function failJob(
  job: any,
  messageId: number,
  leaseToken: string,
  error: unknown,
  deployment: any,
  website: any
) {
  const message =
    error instanceof Error ? error.message : "Website publishing worker failed.";
  const attempt = Number(job.attempt_count || 0) + 1;
  const canRetry =
    !permanentPublishingFailure(message) &&
    attempt < Number(job.max_attempts || 5);
  const now = new Date().toISOString();

  const released = await supabase
    .from("busy_website_publish_jobs")
    .update({
      status: canRetry ? "retry_wait" : "failed",
      attempt_count: attempt,
      processing_token: null,
      lease_expires_at: null,
      last_error: message,
      completed_at: canRetry ? null : now,
      updated_at: now,
    })
    .eq("id", job.id)
    .eq("processing_token", leaseToken)
    .select("id")
    .maybeSingle();
  if (released.error) throw released.error;
  if (!released.data?.id) {
    throw new Error(
      "BUSY worker lease was lost before the failed job could be released."
    );
  }

  if (job.action === "prepare") {
    await supabase
      .from("busy_website_deployments")
      .update({ state: canRetry ? "queued" : "failed", last_error: message })
      .eq("id", deployment.id);
  } else {
    await supabase
      .from("busy_website_deployments")
      .update({ last_error: message })
      .eq("id", deployment.id);
  }

  await supabase
    .from("busy_websites")
    .update({
      status: website.current_live_deployment_id
        ? canRetry
          ? "update_pending"
          : "live"
        : canRetry
        ? "queued"
        : "failed",
      last_error: message,
      updated_at: now,
    })
    .eq("id", website.id);

  if (canRetry) {
    const retry = await supabase.rpc("busy_retry_website_publish_message", {
      p_msg_id: messageId,
      p_delay_seconds: retryDelaySeconds(job.id, attempt),
    });
    if (retry.error) throw retry.error;
  } else {
    const archived = await supabase.rpc(
      "busy_archive_website_publish_message",
      { p_msg_id: messageId }
    );
    if (archived.error) throw archived.error;
  }
}

async function internalPost(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data?.error || `BUSY internal website service returned ${response.status}.`
    );
  }
  return data;
}

async function verifyPublicDelivery(websiteId: string) {
  const result: any = {
    providerReserved: false,
    healthChecked: false,
    defaultAddressHealthy: false,
    errors: [],
  };

  try {
    const provider = await internalPost(PROVIDER_URL, {
      action: "reserve_default_hostnames",
      websiteId,
    });
    result.providerReserved = provider?.configured !== false;
    result.reserved = Number(provider?.reserved || 0);
    result.promoted = Number(provider?.promoted || 0);
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : "BUSY address reservation check failed."
    );
  }

  try {
    const health = await internalPost(HEALTH_URL, {
      websiteId,
      limit: 1,
    });
    const check = Array.isArray(health?.results) ? health.results[0] : null;
    result.healthChecked = !!check;
    result.defaultAddressHealthy = check?.defaultDomain?.status === "healthy";
    result.liveAliasHealthy = check?.live?.status === "healthy";
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : "BUSY live delivery verification failed."
    );
  }

  console.log(
    "BUSY_WEBSITE_GO_LIVE_VERIFICATION",
    JSON.stringify({
      websiteId,
      providerReserved: result.providerReserved,
      healthChecked: result.healthChecked,
      defaultAddressHealthy: result.defaultAddressHealthy,
      liveAliasHealthy: result.liveAliasHealthy,
      errorCount: result.errors.length,
    })
  );
  return result;
}

async function succeedJob(
  job: any,
  messageId: number,
  leaseToken: string
) {
  const now = new Date().toISOString();
  const completed = await supabase
    .from("busy_website_publish_jobs")
    .update({
      status: "succeeded",
      attempt_count: Number(job.attempt_count || 0) + 1,
      processing_token: null,
      lease_expires_at: null,
      last_error: null,
      completed_at: now,
      updated_at: now,
    })
    .eq("id", job.id)
    .eq("processing_token", leaseToken)
    .select("id")
    .maybeSingle();
  if (completed.error) throw completed.error;
  if (!completed.data?.id) {
    throw new Error(
      "BUSY worker lease was lost before the completed job could be committed."
    );
  }

  const archived = await supabase.rpc(
    "busy_archive_website_publish_message",
    { p_msg_id: messageId }
  );
  if (archived.error) throw archived.error;
}

async function deferMessage(messageId: number, seconds = 20) {
  const delayed = await supabase.rpc("busy_retry_website_publish_message", {
    p_msg_id: messageId,
    p_delay_seconds: Math.min(90, Math.max(5, seconds)),
  });
  if (delayed.error) throw delayed.error;
}

async function processMessage(
  message: any,
  seenBusinesses: Set<string>
) {
  const jobId = clean(message?.message?.job_id, 80);
  if (!jobId) {
    await supabase.rpc("busy_archive_website_publish_message", {
      p_msg_id: message.msg_id,
    });
    return { ok: false, reason: "Queue message had no job id.", skipped: true };
  }

  const job = await loadJob(jobId);
  if (job.status === "succeeded" || job.status === "failed") {
    await supabase.rpc("busy_archive_website_publish_message", {
      p_msg_id: message.msg_id,
    });
    return { ok: true, jobId, skipped: true, reason: "terminal" };
  }

  if (seenBusinesses.has(job.business_id)) {
    const fairnessDelay =
      12 +
      (clean(job.business_id, 80)
        .split("")
        .reduce((sum, char) => sum + char.charCodeAt(0), 0) %
        18);
    await deferMessage(message.msg_id, fairnessDelay);
    return {
      ok: true,
      jobId,
      skipped: true,
      reason: "tenant_fairness",
    };
  }

  const leaseToken = crypto.randomUUID();
  const claim = await supabase.rpc("busy_claim_website_publish_job", {
    p_job_id: job.id,
    p_processing_token: leaseToken,
    p_lease_seconds: 300,
  });
  if (claim.error) throw claim.error;
  if (claim.data !== true) {
    await deferMessage(message.msg_id, 30);
    return {
      ok: true,
      jobId,
      skipped: true,
      reason: "lease_held",
    };
  }

  seenBusinesses.add(job.business_id);
  const deployment = await loadDeployment(job.deployment_id);
  const website = await loadWebsite(job.website_id);

  try {
    if (job.action === "prepare") {
      await prepareDeployment(job, deployment, website);
    } else if (job.action === "publish") {
      await publishDeployment(job, deployment, website);
    } else if (job.action === "rollback") {
      await rollbackDeployment(job, deployment, website);
    } else {
      throw new Error("Unsupported website publish job.");
    }
    await succeedJob(job, message.msg_id, leaseToken);

    const deliveryVerification =
      job.action === "publish" || job.action === "rollback"
        ? await verifyPublicDelivery(website.id)
        : null;

    return {
      ok: true,
      jobId,
      action: job.action,
      deliveryVerification,
    };
  } catch (error) {
    await failJob(
      job,
      message.msg_id,
      leaseToken,
      error,
      deployment,
      website
    );
    return {
      ok: false,
      jobId,
      action: job.action,
      error: error instanceof Error ? error.message : "Worker failed.",
    };
  }
}

async function validWorkerRequest(request: Request) {
  const authorization = request.headers.get("Authorization") || "";
  if (authorization === `Bearer ${SERVICE_ROLE_KEY}`) return true;

  const supplied = request.headers.get("x-busy-worker-token") || "";
  if (!supplied) return false;

  const token = await supabase
    .from("busy_internal_config")
    .select("value")
    .eq("key", "website_worker_token")
    .maybeSingle();
  if (token.error || !token.data?.value) return false;
  return supplied === token.data.value;
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json(405, { error: "POST required" });
  if (!(await validWorkerRequest(request))) {
    return json(401, { error: "Internal BUSY worker authentication required." });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const limit = Math.min(12, Math.max(1, Number(body?.limit) || 5));

    const stale = await supabase.rpc(
      "busy_recover_stale_website_publish_jobs"
    );
    if (stale.error) throw stale.error;

    // Read extra candidates so one noisy tenant cannot monopolise a worker
    // invocation. Unselected messages are returned to the queue quickly.
    const candidateLimit = Math.min(20, Math.max(limit, limit * 3));
    const read = await supabase.rpc("busy_read_website_publish_jobs", {
      p_limit: candidateLimit,
    });
    if (read.error) throw read.error;
    const messages = Array.isArray(read.data) ? read.data : [];
    const results = [];
    const seenBusinesses = new Set<string>();
    let processed = 0;

    for (const message of messages) {
      if (processed >= limit) {
        await deferMessage(message.msg_id, 20);
        results.push({
          ok: true,
          skipped: true,
          reason: "worker_capacity",
        });
        continue;
      }

      const result = await processMessage(message, seenBusinesses);
      results.push(result);
      if (!result?.skipped) processed += 1;
    }

    return json(200, {
      ok: true,
      processed,
      deferred: results.filter((item) => item?.skipped).length,
      staleRecovered: Number(stale.data || 0),
      results,
    });
  } catch (error) {
    return json(500, {
      error:
        error instanceof Error
          ? error.message
          : "Website publishing worker failed.",
    });
  }
});
