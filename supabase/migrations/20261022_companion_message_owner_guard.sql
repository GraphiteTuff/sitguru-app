-- Follow-up: enforce message.user_id == conversation.user_id at the database.
-- Safe when the base companion tables already exist.
-- Data-preserving; does not drop tables or rewrite history.

create or replace function public.companion_message_owner_matches_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select user_id into v_owner
  from public.companion_conversations
  where id = NEW.conversation_id;

  if v_owner is null then
    raise exception 'companion conversation not found';
  end if;

  if NEW.user_id is distinct from v_owner then
    raise exception 'companion message user_id must match conversation owner';
  end if;

  return NEW;
end;
$$;

drop trigger if exists companion_messages_owner_guard on public.companion_messages;
create trigger companion_messages_owner_guard
  before insert or update of user_id, conversation_id
  on public.companion_messages
  for each row
  execute function public.companion_message_owner_matches_conversation();

comment on function public.companion_message_owner_matches_conversation() is
  'Prevents attaching a message to another user''s companion conversation.';
