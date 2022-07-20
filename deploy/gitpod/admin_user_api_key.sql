do $$
declare
  hashed text;
  user_id uuid;
begin
  select sha256(convert_to('${PODGIT_API_KEY}', 'UTF8')::bytea) into hashed;
  select (
    select id 
    from app_public.users 
    order by created_at
    limit 1
  ) into user_id;

  insert into app_private.user_api_keys
    (user_id, name, api_key_hash, api_key_generated_ts)
  values
    (user_id, 'Default API Key', hashed, current_timestamp);
end;
$$ language plpgsql;