-- 002_payment_processor_columns.sql
-- Adds processor-agnostic payment columns

-- Profiles: track which processor and external customer ID
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_processor text,
  ADD COLUMN IF NOT EXISTS processor_customer_id text;

-- Payment methods: track which processor holds this method
ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS processor text;

-- Transactions: full processor tracking
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS processor text,
  ADD COLUMN IF NOT EXISTS processor_transaction_id text,
  ADD COLUMN IF NOT EXISTS processor_refund_id text,
  ADD COLUMN IF NOT EXISTS payment_method_id uuid references public.payment_methods(id),
  ADD COLUMN IF NOT EXISTS processor_fee numeric(10, 2),
  ADD COLUMN IF NOT EXISTS net_amount numeric(10, 2);

-- Index for payment method lookups
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method
  ON public.transactions(payment_method_id);

-- Index for processor transaction lookups (webhook reconciliation)
CREATE INDEX IF NOT EXISTS idx_transactions_processor_txn_id
  ON public.transactions(processor_transaction_id);
