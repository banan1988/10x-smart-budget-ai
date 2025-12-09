-- migration: add role column to user_profiles
-- purpose: add role-based access control (admin/user) support
-- tables affected: user_profiles
-- notes:
--   - adds role column with default value 'user'
--   - supports 'user' and 'admin' roles
--   - used for admin panel access control

-- add role column to user_profiles table
alter table public.user_profiles
add column if not exists role varchar not null default 'user';

-- add comment to explain the role column
comment on column public.user_profiles.role is 'user role for access control: user or admin';

-- create index on role for efficient role-based queries
create index if not exists idx_user_profiles_role
on public.user_profiles (role);

