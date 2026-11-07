import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {wholeAppStagingPackage} from './whole-app-staging-package.mjs';
import {sqlStatements} from './owner-status-schema.mjs';
export const AI_LAB_REF='sbvkrvksnruiclcvclbd';
const hash=s=>createHash('sha256').update(s).digest('hex'),clean=s=>s.replace(/--[^\n]*/g,'').trim();
const extract=(s,label)=>{let fuses=0;const statements=sqlStatements(s).filter(x=>{const c=clean(x);if(/^(BEGIN|COMMIT);$/i.test(c))return false;if(/^DO \$\$ BEGIN RAISE EXCEPTION '[A-Z0-9 ]+REVIEW FUSE: [^']+'; END \$\$;$/i.test(c)){fuses++;return false;}return true;});if(fuses!==1)throw Error('Original review boundary changed: '+label);return statements.join('\n');};
const withoutFuse=s=>s.replace(/^DO \$\$ BEGIN RAISE EXCEPTION 'AI LAB (?:FOUNDATION|ROLLBACK) REVIEW FUSE:[^\n]+\n/m,'');
// Pure source composition: fixed owner-provided target, no executor/credentials/network.
export function aiLabFoundationPackage(root){
 const base=wholeAppStagingPackage(root);
 if(base.sha256!=='7eb4fcf0f924d478ffaf34073788d9657becf2d056b9401f89f57567224cac50'||base.rollbackSha256!=='f8ae624572303f06f21bf7224b8d8dcbab544be8601c975c70e38374fac40441')throw Error('Reviewed original fresh foundation changed');
 const sources=[['docs/sql-proposals/ai-budget/install.sql','8649af5f487bde9dfc984009cbf80709b49112298d0d8d02e7ec43b039df19a3'],['docs/sql-proposals/ai-creative-receipt/install.sql','799cf68878971bb888254ed2e92fc2fcb7543267c0e17c20332733eb9202e6fe'],['docs/sql-proposals/ai-budget/rollback-retain.sql','e20e0bfebf05391a10e99e60335600a161a3d20ce19a49daad120a09ccde0b39']].map(([path,sha256])=>{const sql=readFileSync(root+'/'+path,'utf8');if(hash(sql)!==sha256)throw Error('Reviewed original source changed: '+path);return {path,sha256,sql};});
 const statements=sqlStatements(base.sql).map(clean),names=[...new Set(statements.flatMap(s=>s.match(/^CREATE(?: OR REPLACE)? FUNCTION public\.([a-z0-9_]+)\(/i)?.[1]||[]))].sort(),tables=[...new Set(statements.flatMap(s=>s.match(/^CREATE TABLE(?: IF NOT EXISTS)? public\.([a-z0-9_]+)\s*\(/i)?.[1]||[]))].sort();
 if(tables.length!==28||names.length!==69||names.some(x=>!/^busy_[a-z0-9_]+$/.test(x)))throw Error('Original canonical object scope changed');
 const preconditions=`DO $$ BEGIN
 IF current_user<>'postgres' OR current_setting('server_version_num')::int NOT BETWEEN 170000 AND 179999 THEN RAISE EXCEPTION 'AI Lab requires reviewed postgres installer and PostgreSQL17';END IF;
 IF to_regclass('auth.users') IS NULL OR to_regprocedure('auth.uid()') IS NULL THEN RAISE EXCEPTION 'AI Lab requires genuine native Auth contracts';END IF;
 IF EXISTS(SELECT 1 FROM auth.users) THEN RAISE EXCEPTION 'AI Lab fresh-only: unexpected Auth records; no fixture provisioning approved';END IF;
 IF EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='busy_ai_private') OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f','S') AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.deptype='e')) THEN RAISE EXCEPTION 'AI Lab fresh-only: unexpected or partial application installation';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pgcrypto' AND e.extversion='1.3' AND n.nspname='extensions') THEN RAISE EXCEPTION 'AI Lab reviewed extensions.pgcrypto1.3 required';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_event_trigger e WHERE e.evtname='ensure_rls' AND e.evtevent='ddl_command_end' AND e.evtenabled IN ('O','A') AND e.evtfoid=to_regprocedure('public.rls_auto_enable()') AND e.evtowner='postgres'::regrole AND e.evttags @> ARRAY['CREATE TABLE','CREATE TABLE AS','SELECT INTO']) THEN RAISE EXCEPTION 'AI Lab native automatic RLS must be enabled';END IF;
 IF encode(sha256(convert_to(pg_get_functiondef(to_regprocedure('public.rls_auto_enable()')),'UTF8')),'hex') IS DISTINCT FROM 'b21d88816c445d14cef5032c3cd4abaebc1db2001fcb3435022ab6b496182ca4' THEN RAISE EXCEPTION 'AI Lab native RLS function definition drift requires review';END IF;
 IF EXISTS(SELECT 1 FROM pg_default_acl d CROSS JOIN LATERAL aclexplode(d.defaclacl) a WHERE d.defaclrole='postgres'::regrole AND d.defaclobjtype='r' AND d.defaclnamespace IN (0,'public'::regnamespace) AND a.grantee IN (0,'anon'::regrole,'authenticated'::regrole,'service_role'::regrole) AND a.privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')) THEN RAISE EXCEPTION 'AI Lab automatic new-table DML exposure must be disabled';END IF;
END $$;
-- Explicit prerequisite: preserve native hook body/event, close only its default API EXECUTE.
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC,anon,authenticated,service_role;`;
 const foundation=extract(base.sql,'fresh foundation');
 const sql=`-- REVIEW ONLY: AI Lab ${AI_LAB_REF}; control-plane identity/region/Free/config verification still required.
-- No staging/production/Slow Roast authority; source f790872f4e3177f47bb617eff24a2940b629979a.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'AI LAB FOUNDATION REVIEW FUSE: separate exact lab installation approval required'; END $$;
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='120s';
${preconditions}
${foundation}
-- Original central AI-budget source SHA256 ${sources[0].sha256}
${extract(sources[0].sql,sources[0].path)}
-- Original service-only independent receipt reader SHA256 ${sources[1].sha256}
${extract(sources[1].sql,sources[1].path)}
DO $$ BEGIN IF (SELECT enabled FROM busy_ai_private.policy) IS DISTINCT FROM false OR EXISTS(SELECT 1 FROM busy_ai_private.accounts) OR EXISTS(SELECT 1 FROM busy_ai_private.tariffs) OR EXISTS(SELECT 1 FROM busy_ai_private.operations) THEN RAISE EXCEPTION 'AI Lab installation must not enable or seed spending';END IF;END $$;
COMMIT;
`;
 const needle="n.nspname='public' AND p.proname LIKE 'busy_%'";
 if(base.rollback.split(needle).length!==2)throw Error('Original retaining rollback changed');
 const scopedRollback=base.rollback.replace(needle,needle+" AND p.proname=ANY(ARRAY["+names.map(x=>"'"+x+"'").join(',')+"])");
 const rollback=`-- REVIEW ONLY: AI Lab ${AI_LAB_REF}; retain all data and liabilities. No automatic execution.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'AI LAB ROLLBACK REVIEW FUSE: separate exact retaining rollback approval required'; END $$;
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='120s';
DO $$ BEGIN IF current_user<>'postgres' OR to_regclass('busy_ai_private.policy') IS NULL THEN RAISE EXCEPTION 'Original installed AI Lab authority required';END IF;END $$;
${extract(scopedRollback,'scoped original retaining rollback')}
${extract(sources[2].sql,sources[2].path)}
-- Keep original finish/context and independent service-only receipt reader; no reader-removal rollback.
COMMIT;
`;
 return {version:1,targetProject:AI_LAB_REF,targetUrl:'https://'+AI_LAB_REF+'.supabase.co',expectedRegion:'eu-west-1',observedRegion:'eu-west-1',regionAcceptanceRequired:false,regionAcceptance:{acceptedBy:'owner',recordedDate:'2026-11-06',scope:'Existing isolated fictional-data AI Lab only; no production-region decision',originalIntendedRegion:'eu-west-2',acceptedRegion:'eu-west-1'},expectedPlan:'free',nativeHookDefinitionSha256:'b21d88816c445d14cef5032c3cd4abaebc1db2001fcb3435022ab6b496182ca4',nativeHookAclPrerequisite:'Explicitly revoke API/PUBLIC execute; preserve exact definition and enabled event; atomic with install',sourceCommit:'f790872f4e3177f47bb617eff24a2940b629979a',hostedVerificationRequired:true,verificationBoundary:'Source package only. Refresh independent control-plane/catalogue evidence and obtain exact approval before execution; this manifest cannot grant authority.',canonicalPublicTables:tables,foundationPublicFunctions:names,originalFreshSha256:base.sha256,originalFreshRollbackSha256:base.rollbackSha256,sourceCandidates:base.sourceCandidates,supplements:base.supplements,additionalSources:sources.map(({sql,...x})=>x),preconditions,sql,rollback,sha256:hash(sql),rollbackSha256:hash(rollback),reviewedExecutionDerivativeSha256:hash(withoutFuse(sql)),reviewedRollbackDerivativeSha256:hash(withoutFuse(rollback)),autoExecute:false,providerEnabled:false,policyEnabled:false,authUsersCreated:false,entitlementsCreated:false,tariffsCreated:false,retainsLiabilities:true,receiptReaderRetained:true};
}
