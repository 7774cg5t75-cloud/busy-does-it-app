/**
 * V3.95: A private hosted website must be rendered in a sandboxed native
 * viewer, never opened as an HTML document on Supabase Storage.
 *
 * Supabase Storage deliberately responds to HTML with text/plain to defend
 * against XSS. The viewer fetches authenticated, deployment-scoped signed
 * page objects as TEXT, validates them, then renders them with JS disabled.
 * Keep this helper free of React Native imports for CLI regression checks.
 */
const PREVIEW_BUCKET = "busy-website-preview";
const PREVIEW_PREFIX = "/storage/v1/object/sign/" + PREVIEW_BUCKET + "/";

function signedPreviewPath(rawUrl, supabaseUrl, deploymentId) {
  try {
    if (typeof rawUrl !== "string" || rawUrl.length > 5000) return "";
    if (typeof deploymentId !== "string" || !/^[a-zA-Z0-9_-]{8,100}$/.test(deploymentId)) return "";
    const root = new URL(supabaseUrl);
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || url.origin !== root.origin ||
        url.username || url.password || url.hash) return "";
    const path = decodeURIComponent(url.pathname);
    if (!path.startsWith(PREVIEW_PREFIX)) return "";
    if (!path.includes("/deployments/" + deploymentId + "/")) return "";
    if (!/\.html$/i.test(path)) return "";
    if (!url.searchParams.get("token")) return "";
    const pageRelative = path.slice(PREVIEW_PREFIX.length);
    if (!/^[a-zA-Z0-9_.\/-]+$/.test(pageRelative) ||
        pageRelative.split("/").some(part => part === "." || part === "..")) return "";
    return path;
  } catch {
    return "";
  }
}

function previewPagesFromManifest(manifest, supabaseUrl, deploymentId) {
  const rows = Array.isArray(manifest?.pages) ? manifest.pages : [];
  const found = new Set();
  return rows.slice(0, 30).flatMap((page) => {
    const signedPath = signedPreviewPath(page?.previewUrl, supabaseUrl, deploymentId);
    if (!signedPath || found.has(signedPath)) return [];
    found.add(signedPath);
    return [{
      id: String(page?.id || "").slice(0, 80),
      path: signedPath,
      url: page.previewUrl,
      label: String(page?.id || "Website page").slice(0, 80)
    }];
  });
}

function resolveHostedPreviewPage(targetUrl, pages, supabaseUrl, deploymentId) {
  if (targetUrl === "/") {
    return pages.find(page => page.id === "home") || pages[0] || null;
  }
  // Ignore query token differences in links, but load ONLY the server-listed
  // manifest URL, not the token or arbitrary URL supplied by the HTML itself.
  const path = signedPreviewPath(targetUrl, supabaseUrl, deploymentId);
  return path ? pages.find(page => page.path === path) || null : null;
}

function validHostedHtml(html, expectedDeploymentId) {
  if (typeof html !== "string" || html.length > 2_000_000) return false;
  const prefix = html.trimStart().slice(0, 1200);
  return /^<!doctype html\s*>\s*<html\b/i.test(prefix) &&
    prefix.includes('name="busy-deployment"') &&
    prefix.includes('content="' + expectedDeploymentId + '"');
}

export { signedPreviewPath, previewPagesFromManifest, resolveHostedPreviewPage, validHostedHtml };
