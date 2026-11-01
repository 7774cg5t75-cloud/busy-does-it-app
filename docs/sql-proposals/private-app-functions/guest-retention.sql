-- REVIEW ONLY. Retain original proof linkage; receipt visibility is not CRM erasure.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'FORM RETENTION REVIEW FUSE: separate hosted approval required';END $$;
CREATE INDEX busy_form_guest_retention_link ON public.busy_mini_app_requests(guest_challenge_id) WHERE payload ? 'formDisclosure';
CREATE OR REPLACE FUNCTION public.busy_prune_mini_app_guest_challenges() RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE deleted_count bigint;
BEGIN
 WITH deleted AS (
  DELETE FROM public.busy_mini_app_guest_challenges c WHERE c.expires_at<now()-interval '24 hours'
  AND NOT EXISTS(SELECT 1 FROM public.busy_mini_app_requests r WHERE r.guest_challenge_id=c.id AND r.payload ? 'formDisclosure') RETURNING 1
 ) SELECT count(*) INTO deleted_count FROM deleted;
 RETURN deleted_count;
END $$;
ALTER FUNCTION public.busy_prune_mini_app_guest_challenges() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_prune_mini_app_guest_challenges() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_prune_mini_app_guest_challenges() TO service_role;
-- Retaining rollback must not restore deletion of proof linked to original enquiry history.
-- Canonical customer/request erasure needs its own exact-record policy and authority.
COMMIT;
