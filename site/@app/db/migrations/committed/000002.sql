--! Previous: sha1:63a50514a4220f720580d12c52dde288bd806d16
--! Hash: sha1:8c55cfcf9daf2c19fd2bdb4c280cc8e765121e5b

--! split: 1-current.sql
do $$ begin
    create type create_api_key_result as (
    api_key text
  );
exception
    when duplicate_object then null;
end $$;

create or replace function app_public.create_api_key(api_key_name text) returns create_api_key_result as $$
declare
  hashed text;
  raw text;
begin
  select replace(uuid_generate_v4()::text, '-', '') into raw;
  select sha256(convert_to(raw, 'UTF8')::bytea) into hashed;

  insert into app_private.user_api_keys
    (user_id, name, api_key_hash, api_key_generated_ts)
  values
    (app_public.current_user_id(), api_key_name, hashed, current_timestamp);

  return row(raw);
end;
$$ language plpgsql security definer volatile set search_path to pg_catalog, public, pg_temp;

create or replace function app_public.delete_api_key(api_key_name text) returns void as $$
begin
  delete from app_private.user_api_keys
  where user_id = app_public.current_user_id()
    and name = api_key_name;
end;
$$ language plpgsql security definer volatile set search_path to pg_catalog, public, pg_temp;



create or replace view app_public.api_keys as
  select name, api_key_generated_ts
  from app_private.user_api_keys
  where user_id = app_public.current_user_id()
  order by api_key_generated_ts asc;

grant select on app_public.api_keys to :DATABASE_VISITOR;



create or replace view app_public.debug as
  select name, api_key_generated_ts, app_public.current_user_id() useridsess, user_id
  from app_private.user_api_keys
  order by api_key_generated_ts asc;

grant select on app_public.debug to :DATABASE_VISITOR;


create or replace function app_public.update_workspace(workspace_id text, data JSONB) returns void as $$
declare
begin
  insert into app_public.workspaces
    (user_id, gitpod_workspace_id, workspace_data)
  values
    (app_public.current_user_id(), workspace_id, data)
  on conflict (user_id, gitpod_workspace_id) do
    update set workspace_data = data, last_updated_ts = current_timestamp;
end;
$$ language plpgsql security definer volatile set search_path to pg_catalog, public, pg_temp;

create or replace function app_public.workspace_keepalive(workspace_id text) returns void as $$
declare
begin
  update app_public.workspaces
  set last_updated_ts = current_timestamp
  where user_id = app_public.current_user_id()
    and gitpod_workspace_id = workspace_id;
end;
$$ language plpgsql security definer volatile set search_path to pg_catalog, public, pg_temp;

drop table if exists app_public.notes cascade;
create table app_public.notes (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null default app_public.current_user_id() references app_public.users on delete cascade,
  text_content text not null,
  short_text_content text generated always as (
    left(
      trim(
        regexp_replace(
          regexp_replace(
            text_content, E'[\\n\\r]+', ' ', 'g'
          ), E'\\s+', ' ', 'g'
        )
      ), 100
    )
  ) stored,
  last_updated_ts timestamptz not null default current_timestamp
);

alter table app_public.notes enable row level security;
grant select, insert, update, delete on app_public.notes to :DATABASE_VISITOR;

create policy insert_own on app_public.notes for insert with check (user_id = app_public.current_user_id());
create policy select_own on app_public.notes for select using (user_id = app_public.current_user_id());
create policy update_own on app_public.notes for update using (user_id = app_public.current_user_id());
create policy delete_own on app_public.notes for delete using (user_id = app_public.current_user_id());

create index notes_user_id_idx on app_public.notes(user_id);
create index notes_last_updated_ts_idx on app_public.notes(last_updated_ts);
