-- Add theme columns to subscriptions (user-level theme)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'blue';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS custom_bg TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS custom_hover TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS custom_text TEXT;
