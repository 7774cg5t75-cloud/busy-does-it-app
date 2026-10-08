/**
 * V3.60 opt-in cloud draft transport. Used only after the reviewed RLS schema
 * is deployed. No service-role credentials or unapproved publishing.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assertScope({ businessId, userId, accessToken, publishableKey, supabaseUrl }) {
  if (!UUID.test(businessId || "") || !UUID.test(userId || "")) throw new Error("Authenticated business scope required.");
  if (!accessToken || !publishableKey || !/^https:\/\/[^/]+$/.test(supabaseUrl || "")) throw new Error("Cloud session unavailable.");
}
function cloudDraftUrl({ supabaseUrl, businessId, userId }) {
  return `${supabaseUrl}/rest/v1/busy_business_conversations?business_id=eq.${encodeURIComponent(businessId)}&user_id=eq.${encodeURIComponent(userId)}`;
}
async function request(url, { accessToken, publishableKey, method = "GET", body, fetchImpl = fetch, headers = {} }) {
  const result = await fetchImpl(url, {
    method,
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!result.ok) throw new Error(`Cloud draft request failed (${result.status})`);
  if (result.status === 204) return [];
  return await result.json();
}
async function loadCloudConversation(args) {
  assertScope(args);
  const rows = await request(cloudDraftUrl(args) + "&select=brief,revision,updated_at&limit=1", args);
  return Array.isArray(rows) ? (rows[0] || null) : null;
}
async function saveCloudConversation(args) {
  assertScope(args);
  const brief = String(args.brief || "").slice(0, 1000);
  const url = cloudDraftUrl(args);
  if (args.revision == null) {
    // Insert is deliberately create-only: no upsert replacing another device.
    try {
      const rows = await request(`${args.supabaseUrl}/rest/v1/busy_business_conversations?select=brief,revision,updated_at`, {
        ...args, method: "POST", headers: { Prefer: "return=representation" },
        body: { business_id: args.businessId, user_id: args.userId, brief },
      });
      return { saved: true, record: rows?.[0] || null };
    } catch (error) {
      return { saved: false, conflict: true, reason: "Cloud draft may already exist. Reload before saving.", errorCode: "create_conflict_or_failure" };
    }
  }
  if (!Number.isSafeInteger(args.revision) || args.revision < 1) throw new Error("Invalid draft revision.");
  const rows = await request(url + `&revision=eq.${args.revision}&select=brief,revision,updated_at`, {
    ...args, method: "PATCH", headers: { Prefer: "return=representation" },
    body: { brief, revision: args.revision + 1, updated_at: new Date().toISOString() },
  });
  if (!Array.isArray(rows) || rows.length !== 1) return { saved: false, conflict: true, reason: "Another device changed this draft. Reload before overwriting." };
  return { saved: true, record: rows[0] };
}
export { cloudDraftUrl, loadCloudConversation, saveCloudConversation };
