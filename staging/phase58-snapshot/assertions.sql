-- PREPARED ONLY; run AFTER fixture + writer + explicitly reviewed fuse-removed fence.
-- This is executable PostgreSQL test source, NOT a record of executed tests.
\set ON_ERROR_STOP on
DO $$ BEGIN IF current_database()<>'busy_phase58_disposable' THEN RAISE EXCEPTION 'Disposable-only database required'; END IF; END $$;
SET ROLE authenticated;
SET request.jwt.claim.sub='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
DO $$ BEGIN
 BEGIN UPDATE public.busy_business_snapshots SET payload='{}'; RAISE EXCEPTION 'Legacy update escaped'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN INSERT INTO public.busy_business_snapshots(business_id,payload) VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{}') ON CONFLICT(business_id) DO UPDATE SET payload=excluded.payload; RAISE EXCEPTION 'Legacy upsert escaped'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN TRUNCATE public.busy_business_snapshots; RAISE EXCEPTION 'Legacy truncate escaped'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN DELETE FROM public.busy_business_snapshots; RAISE EXCEPTION 'Direct delete escaped'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
DO $$ DECLARE old_reply jsonb; receipt jsonb; saved jsonb; BEGIN
 SELECT payload->'customers'->0->'privateEnquiryReply' INTO old_reply FROM public.busy_business_snapshots WHERE business_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 receipt:=public.busy_snapshot_private_mutation_v1('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1,1,'private_reply_edit_text','alex',old_reply,'New owner wording',(old_reply->>'sourceStamp')::jsonb);
 SELECT payload->'customers'->0->'privateEnquiryReply' INTO saved FROM public.busy_business_snapshots WHERE business_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 IF saved->>'text'<>'New owner wording' OR saved-'text' IS DISTINCT FROM old_reply-'text' OR receipt->>'revision'<>'2' THEN RAISE EXCEPTION 'Text-only edit lost extensions or receipt'; END IF;
END $$;
-- Explicit bounded removal preserves unrelated private state and cannot be replayed.
DO $$ DECLARE old_reply jsonb; receipt jsonb; before jsonb; after jsonb; BEGIN
 SELECT payload INTO before FROM public.busy_business_snapshots WHERE business_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 old_reply:=before->'customers'->0->'privateEnquiryReply';
 receipt:=public.busy_snapshot_private_mutation_v1('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',2,1,'private_reply_remove','alex',old_reply);
 SELECT payload INTO after FROM public.busy_business_snapshots WHERE business_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 IF after->'unknownFuture' IS DISTINCT FROM before->'unknownFuture' OR after->'quote' IS DISTINCT FROM before->'quote' OR after->'socialDrafts' IS DISTINCT FROM before->'socialDrafts' OR after->'customers'->0 ? 'privateEnquiryReply' OR receipt->>'revision'<>'3' THEN RAISE EXCEPTION 'Removal/retention receipt failed'; END IF;
 BEGIN PERFORM public.busy_snapshot_private_mutation_v1('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',2,1,'private_reply_remove','alex',old_reply); RAISE EXCEPTION 'Stale replay escaped'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN PERFORM public.busy_snapshot_private_mutation_v1('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',2,1,'private_reply_remove','alex',old_reply); RAISE EXCEPTION 'Wrong tenant escaped'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SET request.jwt.claim.sub='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
DO $$ BEGIN
 BEGIN PERFORM public.busy_snapshot_private_mutation_v1('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',3,1,'newsletter_remove','newsletter','{}'); RAISE EXCEPTION 'Member write escaped'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
-- More two-session revocation/concurrency and genuine JWT/PostgREST acceptance are
-- specified in README. This single-session fixture cannot establish them.
