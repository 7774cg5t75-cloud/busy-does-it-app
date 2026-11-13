-- Retain original operations, prices and receipts. No DROP or history deletion.
BEGIN;
REVOKE ALL ON FUNCTION public.busy_ai_operation_read_v1(uuid,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
