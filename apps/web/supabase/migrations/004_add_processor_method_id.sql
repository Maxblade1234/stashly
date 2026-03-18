-- 004_add_processor_method_id.sql
-- Adds processor_method_id column referenced by the payment-methods API route,
-- and renames last_four to last4 to match application code conventions.

-- Add the missing processor_method_id column
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS processor_method_id text;

-- Rename last_four to last4 so it matches the API route insert
ALTER TABLE public.payment_methods RENAME COLUMN last_four TO last4;
