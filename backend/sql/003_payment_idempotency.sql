CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_payment ON subscriptions(payment_id) WHERE payment_id IS NOT NULL;
