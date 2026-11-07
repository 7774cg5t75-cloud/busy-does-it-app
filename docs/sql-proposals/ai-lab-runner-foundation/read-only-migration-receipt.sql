-- Read-only native history inspection after an explicitly approved future execution.
-- A matching name is not proof of byte identity. Compare complete statements and
-- catalogue independently with the exact approved derivative; never auto-replay.
BEGIN READ ONLY;
SELECT jsonb_build_object(
 'transactionReadOnly',current_setting('transaction_read_only'),
 'database',current_database(),
 'installer',current_user,
 'matchingReceipts',coalesce((
   SELECT jsonb_agg(jsonb_build_object(
    'version',version,
    'name',name,
    'statementCount',cardinality(statements),
    'storedStatementsSha256',encode(sha256(convert_to(array_to_string(statements,E'\n'),'UTF8')),'hex'),
    'statements',statements
   ) ORDER BY version)
   FROM supabase_migrations.schema_migrations
   WHERE name='mission18_ai_lab_foundation'
 ),'[]'::jsonb)
);
COMMIT;
