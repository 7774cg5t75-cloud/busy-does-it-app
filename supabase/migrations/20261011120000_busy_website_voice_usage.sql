-- V3.142: daily per-owner selected-website voice transcription budget.
-- Cloud setup prerequisite: deploy this migration before updating busy-command.
-- Stores COUNTS ONLY: no audio, transcripts or selected page/customer content.
CREATE TABLE IF NOT EXISTS public.busy_website_voice_daily_usage (
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_day date NOT NULL,
  requests integer NOT NULL DEFAULT 0 CHECK (requests >= 0 AND requests <= 12),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_user_id, usage_day)
);
ALTER TABLE public.busy_website_voice_daily_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.busy_website_voice_daily_usage FROM public, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.busy_website_voice_daily_usage TO service_role;

-- Atomic INSERT/UPDATE prevents concurrent requests bypassing the budget.
-- Service role only: clients cannot reserve their own or another owner's quota.
CREATE OR REPLACE FUNCTION public.busy_reserve_website_voice_request(p_owner_user_id uuid)
RETURNS TABLE(allowed boolean, used integer, remaining integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  current_uses integer := NULL;
  limit_per_day constant integer := 12;
  today_utc date := (now() AT TIME ZONE 'UTC')::date;
BEGIN
  IF p_owner_user_id IS NULL THEN
    RAISE EXCEPTION 'A verified owner is required';
  END IF;
  INSERT INTO public.busy_website_voice_daily_usage AS entry
    (owner_user_id, usage_day, requests, updated_at)
    VALUES (p_owner_user_id, today_utc, 1, now())
  ON CONFLICT (owner_user_id, usage_day) DO UPDATE
    SET requests=entry.requests+1, updated_at=now()
    WHERE entry.requests < limit_per_day
  RETURNING requests INTO current_uses;
  IF current_uses IS NULL THEN
    SELECT COALESCE(entry.requests, limit_per_day)
      INTO current_uses
      FROM public.busy_website_voice_daily_usage AS entry
      WHERE entry.owner_user_id=p_owner_user_id AND entry.usage_day=today_utc;
    RETURN QUERY SELECT false, LEAST(COALESCE(current_uses,limit_per_day),limit_per_day), 0;
    RETURN;
  END IF;
  RETURN QUERY SELECT true, current_uses, GREATEST(0,limit_per_day-current_uses);
END;
$$;
REVOKE ALL ON FUNCTION public.busy_reserve_website_voice_request(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.busy_reserve_website_voice_request(uuid) TO service_role;
COMMENT ON FUNCTION public.busy_reserve_website_voice_request(uuid) IS
  'V3.142 atomically reserves one authenticated owner voice transcription request; 12 per UTC day. No audio or transcript is stored.';
