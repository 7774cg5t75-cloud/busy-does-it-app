// Immutable per-action denials, not a runtime enable switch. Existing private
// planners/readers retain their contracts. Each denied action needs its own
// independently reviewed transactional replacement before source removal.
const denied=Object.freeze({
 website:new Set(['prepare','preview_url','publish','rollback','request_domain','verify_domain','provision_domain','recover']),
 app:new Set(['prepare_preview','publish','rollback','set_discoverable','send_request_message','reply_request_message','update_request_status','mark_request_linked','award_loyalty_stamp']),
 app_push:new Set(['dispatch']),
 website_worker:new Set(['dispatch']),
 website_provider:new Set(['bootstrap_platform','reconcile_platform','provision_domain','sync_domains','reserve_default_hostnames']),
 push:new Set(['test'])
});
// A true result means only not quarantined; it never grants identity, scope or approval.
export function legacyConsequentialAllowed(domain,action){return !Object.hasOwn(denied,domain)||!denied[domain].has(action);}
