-- Review-only original central-AI operation readback; no hosted installation.
DO $$ BEGIN RAISE EXCEPTION 'CREATIVE RECEIPT REVIEW FUSE: explicit approval required'; END $$;
BEGIN;
DO $$ BEGIN IF current_user<>'postgres' OR to_regclass('busy_ai_private.operations') IS NULL THEN RAISE EXCEPTION 'Original central AI authority required'; END IF; END $$;
CREATE FUNCTION public.busy_ai_operation_read_v1(p_actor uuid,p_business uuid,p_operation uuid,p_request_nonce uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE op busy_ai_private.operations;
BEGIN
 SELECT * INTO op FROM busy_ai_private.operations WHERE id=p_operation AND actor_id=p_actor AND business_id=p_business AND request_nonce=p_request_nonce;
 IF NOT FOUND THEN RAISE EXCEPTION 'Exact original operation required'; END IF;
 PERFORM public.busy_ai_context_v1(p_actor,p_business,op.binding);
 RETURN jsonb_build_object('operationId',op.id,'state',op.state,'attempts',op.attempts,'goalHash',op.goal_hash,'model',op.model,'tariffRevision',op.tariff_revision,'maximumMicroGBP',op.maximum,'actualMicroGBP',op.actual,'inputTokens',op.usage_input,'outputTokens',op.usage_output,'providerReceipt',op.receipt,'binding',op.binding,'createdAt',op.created_at,'pricing',op.pricing);
END $$;
REVOKE ALL ON FUNCTION public.busy_ai_operation_read_v1(uuid,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.busy_ai_operation_read_v1(uuid,uuid,uuid,uuid) TO service_role;
COMMIT;
