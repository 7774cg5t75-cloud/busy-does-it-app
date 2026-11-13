BEGIN READ ONLY;
SELECT jsonb_build_object('observedAt',now(),'transactionReadOnly',current_setting('transaction_read_only'),
'eventTriggers',(SELECT jsonb_agg(jsonb_build_object('name',evtname,'event',evtevent,'owner',pg_get_userbyid(evtowner),'enabled',evtenabled::text,'function',evtfoid::regprocedure::text,'tags',evttags) ORDER BY evtname) FROM pg_event_trigger),
'authUserCount',(SELECT count(*) FROM auth.users),'businessCount',(SELECT count(*) FROM public.busy_businesses),'membershipCount',(SELECT count(*) FROM public.busy_business_memberships),
'policy',(SELECT jsonb_build_object('enabled',enabled,'monthlyHardLimit',monthly_hard_limit) FROM busy_ai_private.policy),
'aiOperations',(SELECT count(*) FROM busy_ai_private.operations),'aiEvents',(SELECT count(*) FROM busy_ai_private.events)) AS verification;
COMMIT;
