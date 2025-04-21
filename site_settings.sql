-- Supabase SQL for site_settings table (admin settings persistence)
create table if not exists site_settings (
  id text primary key, -- always 'singleton'
  settings jsonb,
  updated_at timestamp with time zone default now()
);

insert into site_settings (id, settings)
values ('singleton', '{}')
on conflict (id) do nothing;

-- Usage: Store all admin/config settings in the 'settings' JSONB field.
-- The frontend will read/write this as a single object.
