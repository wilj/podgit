
select app_private.really_create_user(
  '$DEFAULT_ADMIN_USER', --username citext,
  '$DEFAULT_ADMIN_USER@$BASE_DOMAIN', --email text,
  true, --email_is_verified bool,
  '$DEFAULT_ADMIN_USER', --name text,
  null, --avatar_url text,
  '$DEFAULT_ADMIN_PASSWORD' --password text default null
);

update app_public.users
set is_admin=true, is_verified=true
where username='$DEFAULT_ADMIN_USER';

