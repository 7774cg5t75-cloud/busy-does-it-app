-- Synthetic role/RLS harness only. Load the privately supplied exact functions
-- separately; original private function bodies are deliberately not published.
\set ON_ERROR_STOP on
DO $$ BEGIN IF current_database()<>'busy_phase58_disposable' THEN RAISE EXCEPTION 'Disposable-only database required'; END IF; END $$;
ALTER TABLE public.busy_businesses ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE ON public.busy_businesses TO authenticated;
CREATE POLICY creator_insert_business ON public.busy_businesses FOR INSERT TO authenticated WITH CHECK(created_by=auth.uid());
CREATE POLICY members_read_business ON public.busy_businesses FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.busy_business_memberships m WHERE m.business_id=id AND m.user_id=auth.uid()));
CREATE POLICY managers_update_business ON public.busy_businesses FOR UPDATE TO authenticated USING(EXISTS(SELECT 1 FROM public.busy_business_memberships m WHERE m.business_id=id AND m.user_id=auth.uid() AND m.role IN ('owner','admin'))) WITH CHECK(EXISTS(SELECT 1 FROM public.busy_business_memberships m WHERE m.business_id=id AND m.user_id=auth.uid() AND m.role IN ('owner','admin')));
