-- PREPARED ONLY; NOT EXECUTED. Fictional isolated PostgreSQL fixture, not hosted DDL.
-- Reproduces only documented schema facts. Original policies/functions were paraphrased,
-- so these test definitions are explicitly reconstructed, NOT original captured SQL.
\set ON_ERROR_STOP on
DO $$ BEGIN IF current_database()<>'busy_phase58_disposable' THEN RAISE EXCEPTION 'Disposable-only database required'; END IF; END $$;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
-- Mock JWT identity for a local SQL fixture; not Supabase token authentication proof.
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
CREATE TABLE public.busy_businesses(id uuid PRIMARY KEY,name text DEFAULT 'My Business',created_by uuid,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE public.busy_business_memberships(business_id uuid REFERENCES public.busy_businesses ON DELETE CASCADE,user_id uuid,role text DEFAULT 'owner' CHECK(role IN ('owner','admin','member')),created_at timestamptz DEFAULT now(),PRIMARY KEY(business_id,user_id));
CREATE TABLE public.busy_business_snapshots(business_id uuid PRIMARY KEY REFERENCES public.busy_businesses ON DELETE CASCADE,payload jsonb DEFAULT '{}',schema_version integer DEFAULT 1,revision bigint DEFAULT 1,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
ALTER TABLE public.busy_business_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY members_read_own_memberships ON public.busy_business_memberships FOR SELECT TO authenticated USING(auth.uid() IS NOT NULL AND user_id=auth.uid());
ALTER TABLE public.busy_business_snapshots ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.busy_business_snapshots,public.busy_business_memberships TO authenticated,service_role;
CREATE POLICY members_read_snapshot ON public.busy_business_snapshots FOR SELECT TO authenticated USING(auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.busy_business_memberships m WHERE m.business_id=busy_business_snapshots.business_id AND m.user_id=auth.uid()));
CREATE POLICY members_insert_snapshot ON public.busy_business_snapshots FOR INSERT TO authenticated WITH CHECK(auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.busy_business_memberships m WHERE m.business_id=busy_business_snapshots.business_id AND m.user_id=auth.uid()));
CREATE POLICY members_update_snapshot ON public.busy_business_snapshots FOR UPDATE TO authenticated USING(auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.busy_business_memberships m WHERE m.business_id=busy_business_snapshots.business_id AND m.user_id=auth.uid())) WITH CHECK(auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.busy_business_memberships m WHERE m.business_id=busy_business_snapshots.business_id AND m.user_id=auth.uid()));
CREATE POLICY owners_delete_snapshot ON public.busy_business_snapshots FOR DELETE TO authenticated USING(auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.busy_business_memberships m WHERE m.business_id=busy_business_snapshots.business_id AND m.user_id=auth.uid() AND m.role='owner'));
INSERT INTO public.busy_businesses(id) VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
INSERT INTO public.busy_business_memberships(business_id,user_id,role) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','cccccccc-cccc-4ccc-8ccc-cccccccccccc','owner'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','dddddddd-dddd-4ddd-8ddd-dddddddddddd','owner'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','member');
INSERT INTO public.busy_business_snapshots(business_id,payload) VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{"unknownFuture":{"keep":true},"customers":[{"id":"alex","contactOk":true,"privateEnquiryReply":{"version":2,"privateOnly":true,"ownerId":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","businessId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","customerId":"alex","text":"Owner words","futureExtension":{"keep":true}}}],"socialDrafts":[{"id":"newsletter","status":"Draft","text":"Subject: Saved\n\nBody","contentEvidence":{"businessId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","channel":"newsletter"},"futureField":"keep"}],"quote":{"amount":"95","date":"2099-05-01"}}');
DO $$ DECLARE original_payload jsonb; customer jsonb; enquiry jsonb; saved jsonb; BEGIN
 SELECT s.payload INTO original_payload FROM public.busy_business_snapshots s WHERE business_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 customer:=original_payload->'customers'->0;
 enquiry:='{"id":"enquiry","status":"Filed","filedCustomerId":"alex","reviewedAt":"2026-10-22T12:00:00.000Z","rawText":"A customer question"}'::jsonb;
 saved:=(customer->'privateEnquiryReply')||jsonb_build_object('reference',jsonb_build_object('version',1,'businessId','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','customerId','alex','inboxId','enquiry','reviewedAt','2026-10-22T12:00:00.000Z','queuedAt',null,'snapshotRevision',1),'sourceStamp',jsonb_build_array(customer-'privateEnquiryReply',enquiry)::text);
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(jsonb_set(original_payload,'{customers,0,privateEnquiryReply}',saved,false),'{inboxItems}',jsonb_build_array(enquiry),true) WHERE business_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
END $$;
-- Original live design finding reproduced as a fixture BEFORE the candidate fence.
SET ROLE authenticated;
SET request.jwt.claim.sub='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
BEGIN;
UPDATE public.busy_business_snapshots SET payload=payload-'unknownFuture' WHERE business_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
DO $$ BEGIN IF EXISTS(SELECT 1 FROM public.busy_business_snapshots WHERE payload ? 'unknownFuture') THEN RAISE EXCEPTION 'Expected legacy loss was not reproduced'; END IF; END $$;
ROLLBACK;
RESET ROLE;
