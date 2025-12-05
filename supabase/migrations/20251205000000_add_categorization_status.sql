-- migration: add categorization status to transactions table
-- purpose: track the status of AI categorization for background processing
-- tables affected: transactions
-- notes:
--   - adds categorization_status column to track: pending, completed
--   - pending: transaction created, waiting for AI categorization
--   - completed: categorization finished (successfully or as fallback)
--   - indexed for efficient querying of pending transactions

-- add categorization_status column to transactions table
alter table if exists public.transactions
add column if not exists categorization_status text not null default 'completed' check (categorization_status in ('pending', 'completed'));

comment on column public.transactions.categorization_status is 'status of ai categorization: pending (waiting for ai), completed (finished)';

-- create index for efficient queries of pending categorizations
create index if not exists idx_transactions_categorization_status_pending
on public.transactions (user_id, id)
where categorization_status = 'pending' and type = 'expense';

comment on index idx_transactions_categorization_status_pending is 'index for efficiently fetching pending expense categorizations per user';

