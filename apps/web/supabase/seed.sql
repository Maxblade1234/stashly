-- Stashly Demo Seed Data
-- Run after migration to populate demo data

-- Note: The demo user must be created through Supabase Auth first.
-- After creating a user via signup, update their profile to admin:
-- UPDATE profiles SET role = 'admin' WHERE email = 'demo@stashly.com';

-- Sample transactions for demo (requires a valid user_id and retailer_id)
-- These will be inserted via the seed-demo API endpoint after a demo user exists.

-- Retailer seed data is already in the migration file (001_initial_schema.sql)
-- This file provides additional demo-specific data.

-- Sample Stashly balances (will be created by the seed-demo API)
-- Apple: $4.50 residual
-- Chipotle: $2.25 residual
-- Dominos: $1.75 residual
