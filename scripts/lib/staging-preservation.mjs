import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stagingPreflight} from './staging-installation-security.mjs';
export const preservedOnboardingNames=['busy_marketing_waitlist','busy_staging_rls_canary'];
const literal=s=>"'"+s.replaceAll("'","''")+"'";
// Only catalogue evidence. No persistent registry, customer row export or SQL executor.
export function stagingPreservation(root){
 const path='docs/sql-proposals/preservation-foundation/onboarding-baseline.json',bytes=readFileSync(root+'/'+path,'utf8'),baseline=JSON.parse(bytes);
 if(baseline.relations?.map(x=>x.name).sort().join(',')!=='busy_marketing_waitlist,busy_marketing_waitlist_id_seq,busy_staging_rls_canary')throw Error('Exact reviewed onboarding baseline required');
 const snapshot=readFileSync(root+'/scripts/lib/onboarding-preservation-snapshot.sql','utf8').replace(/^--[^\n]*\n/gm,'').trim().replace(/;$/,'');
 const identities=`SELECT jsonb_build_object('relations',(SELECT jsonb_agg(oid ORDER BY oid) FROM pg_class WHERE oid IN (to_regclass('public.busy_marketing_waitlist'),to_regclass('public.busy_staging_rls_canary'),to_regclass('public.busy_marketing_waitlist_id_seq')) OR oid IN (SELECT indexrelid FROM pg_index WHERE indrelid IN ('public.busy_marketing_waitlist'::regclass,'public.busy_staging_rls_canary'::regclass))), 'constraints',(SELECT jsonb_agg(oid ORDER BY oid) FROM pg_constraint WHERE conrelid IN ('public.busy_marketing_waitlist'::regclass,'public.busy_staging_rls_canary'::regclass)), 'triggers',(SELECT jsonb_agg(to_jsonb(t) ORDER BY oid) FROM pg_trigger t WHERE tgrelid IN ('public.busy_marketing_waitlist'::regclass,'public.busy_staging_rls_canary'::regclass) OR tgconstraint IN (SELECT oid FROM pg_constraint WHERE conrelid IN ('public.busy_marketing_waitlist'::regclass,'public.busy_staging_rls_canary'::regclass))), 'defaults',(SELECT jsonb_agg(to_jsonb(a) ORDER BY oid) FROM pg_default_acl a), 'events',(SELECT jsonb_agg(to_jsonb(e) ORDER BY oid) FROM pg_event_trigger e), 'rlsFunction',(SELECT oid FROM pg_proc WHERE oid=to_regprocedure('public.rls_auto_enable()'))) AS identities`;
 const dataFingerprint=`SELECT jsonb_build_object('waitlist',(SELECT encode(sha256(convert_to(coalesce(string_agg(encode(sha256(convert_to(to_jsonb(t)::text,'UTF8')),'hex'),'' ORDER BY id),''),'UTF8')),'hex') FROM public.busy_marketing_waitlist t),'canary',(SELECT encode(sha256(convert_to(coalesce(string_agg(encode(sha256(convert_to(to_jsonb(t)::text,'UTF8')),'hex'),'' ORDER BY id),''),'UTF8')),'hex') FROM public.busy_staging_rls_canary t),'sequence',(SELECT encode(sha256(convert_to(jsonb_build_object('last_value',t.last_value,'is_called',t.is_called)::text,'UTF8')),'hex') FROM public.busy_marketing_waitlist_id_seq t)) AS fingerprints`;
 const before=`DO $$ BEGIN
 IF current_user<>'postgres' OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=current_user AND (rolsuper OR rolbypassrls)) THEN RAISE EXCEPTION 'Reviewed postgres installer with existing RLS bypass required for complete internal preservation hash';END IF;
 IF to_regclass('public.busy_marketing_waitlist') IS NULL OR to_regclass('public.busy_staging_rls_canary') IS NULL THEN RAISE EXCEPTION 'Exact preserved onboarding tables required';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pgcrypto' AND e.extversion='1.3' AND n.nspname='extensions') THEN RAISE EXCEPTION 'Reviewed existing extensions.pgcrypto 1.3 required';END IF;
END $$;
SET LOCAL timezone='UTC';
LOCK TABLE public.busy_marketing_waitlist,public.busy_staging_rls_canary IN ACCESS EXCLUSIVE MODE;
CREATE TEMP TABLE busy_preservation_before ON COMMIT DROP AS ${snapshot};
CREATE TEMP TABLE busy_preservation_identity ON COMMIT DROP AS ${identities};
-- Internal one-way hashes only; no contents, counters or digests leave this transaction.
CREATE TEMP TABLE busy_preservation_data ON COMMIT DROP AS ${dataFingerprint};
DO $$ BEGIN IF (SELECT preserved FROM pg_temp.busy_preservation_before) IS DISTINCT FROM ${literal(JSON.stringify(baseline))}::jsonb THEN RAISE EXCEPTION 'Preserved catalogue drift: new review required';END IF;END $$;`;
 const after=`DO $$ BEGIN
 IF (SELECT preserved FROM pg_temp.busy_preservation_before) IS DISTINCT FROM (${snapshot}) THEN RAISE EXCEPTION 'Preserved onboarding metadata changed; entire transaction refused';END IF;
 IF (SELECT identities FROM pg_temp.busy_preservation_identity) IS DISTINCT FROM (${identities}) THEN RAISE EXCEPTION 'Preserved object identity, defaults or event triggers changed';END IF;
 IF (SELECT fingerprints FROM pg_temp.busy_preservation_data) IS DISTINCT FROM (${dataFingerprint}) THEN RAISE EXCEPTION 'Preserved onboarding data or sequence state changed; entire transaction refused';END IF;
END $$;`;
 // Fresh path remains byte-identical. Only its reviewed identity sequence exception
 // is added here, after the complete preserved catalogue has already been pinned.
 const needle="c.relname<>'busy_staging_rls_canary'";
 if(stagingPreflight.split(needle).length!==2)throw Error('Original preflight changed; independent review required');
 const preflight=stagingPreflight.replace("nspname IN ('busy_snapshot_private'", "nspname IN ('busy_ai_private','busy_snapshot_private'").replace(needle,"c.relname NOT IN ('busy_staging_rls_canary','busy_marketing_waitlist_id_seq')");
 return {before,after,preflight,names:preservedOnboardingNames,path,baselineSha256:createHash('sha256').update(bytes).digest('hex')};
}
