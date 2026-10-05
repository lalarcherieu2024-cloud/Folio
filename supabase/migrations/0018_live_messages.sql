-- Live chat: broadcast new messages through Supabase Realtime so the other person's chat updates
-- instantly, without reloading. Run after 0017. Safe to run more than once.
-- Realtime still applies the row-level rules from 0017: only the two participants receive a message.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
