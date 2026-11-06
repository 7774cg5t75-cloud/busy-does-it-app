-- READ ONLY; metadata and the separately approved fictional identity only.
-- No Auth credentials, token material or customer records are returned.
BEGIN READ ONLY;
SELECT jsonb_build_object('observedAt',now(),'readOnly',current_setting('transaction_read_only'),
 'authUserCount',(SELECT count(*) FROM auth.users),'identityCount',(SELECT count(*) FROM auth.identities),
 'owners',(SELECT coalesce(jsonb_agg(jsonb_build_object('ownerId',u.id,'email',u.email,'emailConfirmedAt',u.email_confirmed_at,'isAnonymous',u.is_anonymous,'role',u.role,'aud',u.aud,'deletedAt',u.deleted_at,'bannedUntil',u.banned_until,'identityProvider',i.provider) ORDER BY u.id),'[]') FROM auth.users u LEFT JOIN auth.identities i ON i.user_id=u.id WHERE u.email='quiet-light-owner@busy-ai-lab.invalid'),
 'businessCount',(SELECT count(*) FROM public.busy_businesses),'membershipCount',(SELECT count(*) FROM public.busy_business_memberships),
 'businesses',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'createdBy',created_by) ORDER BY id),'[]') FROM public.busy_businesses WHERE name='Quiet Light Studio' AND created_by IN(SELECT id FROM auth.users WHERE email='quiet-light-owner@busy-ai-lab.invalid')),
 'memberships',(SELECT coalesce(jsonb_agg(jsonb_build_object('businessId',business_id,'userId',user_id,'role',role) ORDER BY business_id,user_id),'[]') FROM public.busy_business_memberships WHERE user_id IN(SELECT id FROM auth.users WHERE email='quiet-light-owner@busy-ai-lab.invalid')),
 'policy',(SELECT jsonb_build_object('enabled',enabled,'monthlyHardLimit',monthly_hard_limit) FROM busy_ai_private.policy),
 'aiAccounts',(SELECT count(*) FROM busy_ai_private.accounts),'aiPeriods',(SELECT count(*) FROM busy_ai_private.periods),'aiTariffs',(SELECT count(*) FROM busy_ai_private.tariffs),'aiOperations',(SELECT count(*) FROM busy_ai_private.operations),'aiEvents',(SELECT count(*) FROM busy_ai_private.events),
 'profiles',(SELECT count(*) FROM public.busy_public_business_profiles),'snapshots',(SELECT count(*) FROM public.busy_business_snapshots),
 'nativeReceipts',(SELECT jsonb_agg(jsonb_build_object('version',version,'name',name,'statementCount',cardinality(statements),'executionSha256',encode(sha256(convert_to(array_to_string(statements,E'\n'),'UTF8')),'hex')) ORDER BY version) FROM supabase_migrations.schema_migrations)) AS verification;
COMMIT;
