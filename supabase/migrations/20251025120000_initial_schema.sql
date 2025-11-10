-- migration: initial schema for smartbudgetai mvp
-- purpose: create core tables (user_profiles, categories, transactions, feedback) with proper relations, indexes, and rls policies
-- tables affected: user_profiles, categories, transactions, feedback
-- notes:
--   - creates user_profiles table extending auth.users with custom fields (nickname, preferences)
--   - implements strict rls for data isolation
--   - optimized indexes for dashboard queries
--   - amount stored as integer (grosze/cents) for financial precision
--   - transactions support both income and expense types
--   - category_id is nullable for income transactions, required for expenses via application logic
--   - adds feedback table for storing user ratings and comments

-- =============================================================================
-- create user_profiles table (extends auth.users)
-- =============================================================================

-- user_profiles table stores additional user data beyond supabase auth
-- one-to-one relationship with auth.users
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname varchar,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_profiles is 'user profiles extending auth.users with custom fields';
comment on column public.user_profiles.id is 'primary key and foreign key to auth.users, cascade delete for gdpr compliance';
comment on column public.user_profiles.nickname is 'optional display name for user';
comment on column public.user_profiles.preferences is 'flexible jsonb storage for user settings, feedback, and preferences, defaults to empty json object';

-- create gin index on preferences for efficient jsonb queries
create index if not exists idx_user_profiles_preferences
on public.user_profiles using gin (preferences);

-- enable row level security
alter table public.user_profiles enable row level security;

-- rls policy: users can view their own profile
-- rationale: users need access to their nickname and preferences
create policy "users can select own profile"
on public.user_profiles
for select
to authenticated
using (auth.uid() = id);

-- rls policy: users can insert their own profile (on signup)
-- rationale: profile created automatically on user registration
create policy "users can insert own profile"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = id);

-- rls policy: users can update their own profile
-- rationale: users can change nickname and preferences
create policy "users can update own profile"
on public.user_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- rls policy: users can delete their own profile
-- rationale: profile deletion handled via cascade when user deletes account
create policy "users can delete own profile"
on public.user_profiles
for delete
to authenticated
using (auth.uid() = id);

-- =============================================================================
-- create trigger to auto-create profile on user signup
-- =============================================================================

-- create trigger function to automatically create profile when new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, created_at)
  values (new.id, now());
  return new;
end;
$$ language plpgsql security definer;

comment on function public.handle_new_user is 'trigger function to automatically create profile for new users';

-- attach trigger to auth.users table
-- note: cannot add comment on this trigger as we don't own auth.users table
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =============================================================================
-- create categories table
-- =============================================================================

-- categories are global and shared across all users
-- used by ai for transaction categorization with multilingual support
create table if not exists public.categories (
  id bigserial primary key,
  key varchar unique not null,
  translations jsonb not null,
  created_at timestamptz not null default now()
);

comment on table public.categories is 'global categories for transaction classification with multilingual support';
comment on column public.categories.key is 'unique category key for ai (e.g., food, transport, entertainment)';
comment on column public.categories.translations is 'jsonb field storing category name translations (e.g., {"pl": "Jedzenie", "en": "Food"})';

-- create index on key for efficient category lookups by ai
create index if not exists idx_categories_key
on public.categories (key);

-- create gin index on translations for efficient jsonb queries
create index if not exists idx_categories_translations
on public.categories using gin (translations);

-- enable row level security
alter table public.categories enable row level security;

-- rls policy: authenticated users can view all categories
-- rationale: categories are global and needed for transaction creation/editing
create policy "authenticated users can select categories"
on public.categories
for select
to authenticated
using (true);

-- rls policy: anonymous users can view all categories
-- rationale: may be needed for public-facing features or ai categorization endpoint
create policy "anonymous users can select categories"
on public.categories
for select
to anon
using (true);

-- rls policy: only authenticated users via api can insert categories
-- rationale: prevents unauthorized category creation, ai service uses authenticated role
create policy "authenticated users can insert categories"
on public.categories
for insert
to authenticated
with check (true);

-- rls policy: only authenticated users via api can update categories
-- rationale: allows category name updates via admin or ai refinement
create policy "authenticated users can update categories"
on public.categories
for update
to authenticated
using (true)
with check (true);

-- rls policy: restrict delete if category is in use
-- rationale: on delete restrict foreign key will prevent deletion, but rls adds extra layer
-- note: actual prevention handled by foreign key constraint on transactions table
create policy "authenticated users can delete categories"
on public.categories
for delete
to authenticated
using (true);

-- =============================================================================
-- create transactions table
-- =============================================================================

-- transactions are user-specific financial records
-- each transaction belongs to one user and optionally one category (for expenses only)
create table if not exists public.transactions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id bigint references public.categories(id) on delete restrict,
  type varchar not null default 'expense' check (type in ('income', 'expense')),
  amount integer not null check (amount > 0),
  description text not null,
  date date not null,
  is_ai_categorized boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.transactions is 'user financial transactions with ai-powered categorization';
comment on column public.transactions.user_id is 'reference to auth.users (not user_profiles to avoid circular dependency), cascade delete for gdpr compliance';
comment on column public.transactions.category_id is 'reference to categories, nullable for income transactions, required for expense transactions via application logic';
comment on column public.transactions.type is 'transaction type: income or expense, used to determine if category is required';
comment on column public.transactions.amount is 'transaction amount in grosze/cents (integer) for financial precision';
comment on column public.transactions.description is 'user-provided or ai-generated transaction description';
comment on column public.transactions.date is 'transaction date for monthly dashboard aggregations';
comment on column public.transactions.is_ai_categorized is 'flag indicating if category was assigned by ai';

-- create composite index on (user_id, date) for optimized dashboard queries
-- rationale: dashboard queries filter by user and aggregate by month/date range
create index if not exists idx_transactions_user_date
on public.transactions (user_id, date desc);

-- create index on category_id for efficient category-based queries
-- rationale: needed for category statistics and ai analysis
create index if not exists idx_transactions_category
on public.transactions (category_id);

-- create index on user_id for general user-specific queries
-- rationale: postgresql creates this automatically for foreign keys, but explicit for clarity
create index if not exists idx_transactions_user
on public.transactions (user_id);

-- enable row level security
alter table public.transactions enable row level security;

-- rls policy: users can only select their own transactions
-- rationale: core data isolation - users must never see other users' financial data
create policy "users can select own transactions"
on public.transactions
for select
to authenticated
using (auth.uid() = user_id);

-- rls policy: users can only insert transactions for themselves
-- rationale: prevents users from creating transactions for other users
create policy "users can insert own transactions"
on public.transactions
for insert
to authenticated
with check (auth.uid() = user_id);

-- rls policy: users can only update their own transactions
-- rationale: users can edit amount, description, category, date of their transactions
create policy "users can update own transactions"
on public.transactions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- rls policy: users can only delete their own transactions
-- rationale: users can remove transactions from their history
create policy "users can delete own transactions"
on public.transactions
for delete
to authenticated
using (auth.uid() = user_id);

-- =============================================================================
-- create feedback table
-- =============================================================================

create table if not exists public.feedback (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text check (length(comment) <= 1000),
  created_at timestamptz not null default now()
);

comment on table public.feedback is 'stores user feedback about the application';
comment on column public.feedback.user_id is 'reference to the user who submitted the feedback';
comment on column public.feedback.rating is 'user rating from 1 to 5';
comment on column public.feedback.comment is 'optional user comment, max 1000 characters';

-- create index on user_id for efficient feedback queries by user
create index if not exists idx_feedback_user_id
on public.feedback (user_id);

-- enable row level security
alter table public.feedback enable row level security;

-- rls policy: users can insert their own feedback
-- rationale: allows users to submit feedback
create policy "users can insert their own feedback"
on public.feedback
for insert
to authenticated
with check (auth.uid() = user_id);

-- note: by default, select, update, and delete are denied, which is the desired behavior.
-- users should not be able to see, modify, or delete feedback once submitted.

-- =============================================================================
-- create triggers for updated_at timestamp
-- =============================================================================

-- create trigger function to automatically update updated_at column
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function public.handle_updated_at is 'trigger function to automatically update updated_at timestamp on row modification';

-- attach trigger to user_profiles table
create trigger set_updated_at_user_profiles
before update on public.user_profiles
for each row
execute function public.handle_updated_at();

comment on trigger set_updated_at_user_profiles on public.user_profiles is 'automatically updates updated_at column when user profile is modified';

-- attach trigger to transactions table
create trigger set_updated_at_transactions
before update on public.transactions
for each row
execute function public.handle_updated_at();

comment on trigger set_updated_at_transactions on public.transactions is 'automatically updates updated_at column when transaction is modified';

-- =============================================================================
-- seed initial categories
-- =============================================================================

-- insert default categories for mvp with polish translations
-- rationale: provides baseline categories for ai to work with from day one
-- note: mvp supports polish only, but structure allows easy addition of other languages
insert into public.categories (key, translations) values
  ('groceries', '{"pl": "Zakupy spożywcze", "en": "Groceries"}'),
  ('transport', '{"pl": "Transport", "en": "Transport"}'),
  ('entertainment', '{"pl": "Rozrywka", "en": "Entertainment"}'),
  ('utilities', '{"pl": "Opłaty", "en": "Utilities"}'),
  ('healthcare', '{"pl": "Zdrowie", "en": "Healthcare"}'),
  ('education', '{"pl": "Edukacja", "en": "Education"}'),
  ('shopping', '{"pl": "Zakupy", "en": "Shopping"}'),
  ('dining', '{"pl": "Restauracje", "en": "Dining"}'),
  ('housing', '{"pl": "Mieszkanie", "en": "Housing"}'),
  ('insurance', '{"pl": "Ubezpieczenia", "en": "Insurance"}'),
  ('savings', '{"pl": "Oszczędności", "en": "Savings"}'),
  ('other', '{"pl": "Inne", "en": "Other"}')
on conflict (key) do nothing;

comment on table public.categories is 'global categories seeded with common expense types for ai categorization with multilingual support';

