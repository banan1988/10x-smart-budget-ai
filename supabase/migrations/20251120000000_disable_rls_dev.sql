-- Temporary migration to disable RLS for development
-- WARNING: This should NEVER be used in production!
-- Re-enable RLS before deploying to production

-- Disable RLS on user_profiles
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on categories (already accessible, but for consistency)
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- Disable RLS on transactions
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on feedback
ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;

-- Note: To re-enable RLS, run:
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

