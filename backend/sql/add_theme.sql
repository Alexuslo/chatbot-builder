-- Добавить колонки для темы и кастомных цветов
ALTER TABLE documents ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'blue';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS custom_bg TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS custom_hover TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS custom_text TEXT;

-- Обновить существующие документы
UPDATE documents SET theme = 'blue' WHERE theme IS NULL;
