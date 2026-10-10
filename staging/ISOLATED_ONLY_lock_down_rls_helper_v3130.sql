-- This exact statement was applied exclusively to the separate Supabase
-- project Busy Does It Staging (pnjdlogwegnqbsfpcofw) during V3.130.
-- This is a provenance copy, NOT a production migration or a command
-- to run against Busy Does It or Slow Roast.
--
-- Supabase's automatic public RLS event-trigger helper was SECURITY DEFINER,
-- and initial role grants allowed anonymous and signed-in direct invocation.
-- We preserve its event trigger but remove all Data API role access.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
