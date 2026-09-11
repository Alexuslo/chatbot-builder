-- Add public_id column for widget (public identifier, not sensitive)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS public_id TEXT UNIQUE;

-- Generate public_id for existing users
UPDATE subscriptions 
SET public_id = substr(md5(random()::text), 1, 12)
WHERE public_id IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_subscriptions_public_id ON subscriptions(public_id);
