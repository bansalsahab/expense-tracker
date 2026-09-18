-- Adds an optional payment method to transactions (Cash / Card / UPI / Other).
-- Safe to run on an existing database: the column is nullable, so existing rows
-- keep NULL and existing code (which treats missing payment methods as "—") is
-- unaffected.

alter table transactions
  add column if not exists payment_method text
  check (payment_method is null or payment_method in ('Cash','Card','UPI','Other'));
