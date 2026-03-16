-- 003_webhook_events.sql
-- Webhook event deduplication table

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  processor text NOT NULL DEFAULT 'stripe',
  processed_at timestamptz NOT NULL DEFAULT now(),
  data jsonb
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at
  ON public.webhook_events(processed_at);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
