-- Lead capture for anonymous chat visitors.
--
-- Before an anonymous visitor can send their first message, the widget
-- now asks for a name and one contact (email or phone). The columns live
-- on the conversation row (not per-message) because it's a one-time
-- capture per session. The record_anonymous_chat_turn RPC is extended to
-- accept the two fields on creation.

ALTER TABLE public.chat_conversations
  ADD COLUMN IF NOT EXISTS visitor_name    text,
  ADD COLUMN IF NOT EXISTS visitor_contact text;

DROP FUNCTION IF EXISTS public.record_anonymous_chat_turn(text, text, text, text, text, inet, text);
DROP FUNCTION IF EXISTS public.record_anonymous_chat_turn(text, text, text, text, text, inet, text, text, text);

CREATE OR REPLACE FUNCTION public.record_anonymous_chat_turn(
  p_conversation_id text,
  p_session_id      text,
  p_locale          text,
  p_user_message    text,
  p_assistant_message text,
  p_ip              inet,
  p_user_agent      text,
  p_visitor_name    text DEFAULT NULL,
  p_visitor_contact text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  IF p_conversation_id IS NULL OR p_conversation_id = '' THEN
    INSERT INTO public.chat_conversations (
      session_id, locale, ip_address, user_agent, title,
      visitor_name, visitor_contact
    )
    VALUES (
      p_session_id, p_locale, p_ip, p_user_agent, left(p_user_message, 80),
      nullif(trim(p_visitor_name), ''),
      nullif(trim(p_visitor_contact), '')
    )
    RETURNING id INTO v_conversation_id;
  ELSE
    v_conversation_id := p_conversation_id::uuid;
    IF NOT EXISTS (
      SELECT 1 FROM public.chat_conversations
       WHERE id = v_conversation_id AND session_id = p_session_id
    ) THEN
      RAISE EXCEPTION 'conversation_not_found_for_session';
    END IF;
    -- Backfill visitor info if it's still empty and the caller now has it.
    UPDATE public.chat_conversations
       SET visitor_name    = coalesce(visitor_name,    nullif(trim(p_visitor_name), '')),
           visitor_contact = coalesce(visitor_contact, nullif(trim(p_visitor_contact), ''))
     WHERE id = v_conversation_id;
  END IF;

  INSERT INTO public.chat_messages (conversation_id, role, content)
  VALUES
    (v_conversation_id, 'user',      p_user_message),
    (v_conversation_id, 'assistant', p_assistant_message);

  RETURN v_conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_anonymous_chat_turn(text, text, text, text, text, inet, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_anonymous_chat_turn(text, text, text, text, text, inet, text, text, text) TO service_role;
