-- Restrict has_role / handle_new_user EXECUTE
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;

-- Tighten reading_events: must reference an existing post
DROP POLICY "anyone insert reading events" ON public.reading_events;
CREATE POLICY "insert reading events for real posts"
  ON public.reading_events FOR INSERT
  WITH CHECK (post_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));