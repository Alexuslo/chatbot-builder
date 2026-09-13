# Дорожная карта рефакторинга ChatBot Builder

**Ветка:** `refactor` (локальная)
**Цель:** привести код в состояние, безопасное для открытия и демонстрации.

---

## Phase 0 — Багфиксы (критичные, до рефакторинга)

- [x] **Message count bug** — `middleware/subscription.js:59` — добавить `.eq('user_id', userId)` в count-запрос
- [x] **Document delete ownership** — `routes/documents.js:99` — добавить `.eq('user_id', req.user.id)`
- [x] **Theme mutation** — `Chat.jsx:49`, `Documents.jsx:86` — `{ ...THEMES.blue }` вместо `THEMES.blue`
- [x] **`onKeyPress` deprecated** — заменить на `onKeyDown` в Chat.jsx и Widget.jsx

## Phase 1 — Backend: структура и безопасность

- [x] **Shared supabase client** — `config/supabase.js`, удалить createClient из 5 файлов
- [x] **Shared auth middleware** — `middleware/auth.js`, удалить из 4 файлов
- [x] **Global error handler** — `app.use((err, req, res, next) => ...)` в server.js
- [x] **Rate limiting** — `express-rate-limit` на `POST /api/chat/widget`
- [ ] **Input validation** — `joi` или `zod` для body/params (пропущено — низкий приоритет)
- [x] **Env validation при старте** — проверка обязательных переменных
- [x] **Document upload limits** — max file size, file type filter в multer
- [x] **Temp file cleanup** — `fs.unlinkSync(file.path)` после обработки
- [x] **Config centralization** — `config/index.js` с дефолтами
- [x] **Health check** — проверка Supabase connectivity
- [x] **Graceful shutdown** — SIGTERM/SIGINT handler

## Phase 2 — Backend: архитектура

- [ ] **Vector search в чате** — заменить `select('content')` на pgvector similarity search через `search_chunks` (пропущено — требует изменения фронтенда)
- [ ] **N+1 fix** — batch embeddings через `Promise.all` + concurrency limit (пропущено — требует изменения фронтенда)
- [x] **Stripe verification cache** — in-memory cache на 1ч для subscription check
- [x] **Error responses** — единый формат `{ error: { code, message } }`, не leak'ать internals
- [ ] **Structured logging** — `pino` или `morgan` вместо console.log (пропущено — низкий приоритет)
- [x] **Удалить unused deps** — `@google/generative-ai`, `openai` из package.json

## Phase 3 — Frontend: инфраструктура

- [x] **`.env` в `.gitignore`** — добавить, создать `.env.example`
- [x] **Удалить `App.css`** — 184 строки мёртвого Vite-шаблона
- [ ] **CSS-модули или классы** — вынести inline styles в CSS файлы (пропущено — требует полного переделывания стилей)
- [x] **Delete `themeLoaded` state** — мёртвый код в Documents.jsx
- [x] **HTML meta tags** — title, description, Open Graph

## Phase 4 — Frontend: компоненты

- [ ] **AuthContext** — единый auth state, удалить checkUser из 4 страниц
- [ ] **ThemeContext** — единый theme state, удалить loadTheme из 3 страниц
- [ ] **ProtectedRoute** — wrapper для приватных маршрутов
- [ ] **useAuthenticatedFetch hook** — единый паттерн API-запросов
- [ ] **Modal component** — переиспользуемый (theme picker, delete confirm)
- [ ] **Toast component** — с cleanup и `role="alert"`
- [ ] **Layout component** — навигация, общая обёртка
- [ ] **ChatInterface component** — объединить Chat.jsx и Widget.jsx
- [ ] **ErrorBoundary** — обёртка для страниц
- [ ] **Lazy loading** — `React.lazy()` для страниц

## Phase 5 — Frontend: polish

- [ ] **Responsive design** — медиа-запросы для mobile
- [ ] **Hover/focus/active states** — в CSS вместо inline
- [ ] **Accessibility** — aria-labels, roles, focus trap в модалках
- [ ] **404 route** — catch-all для неизвестных путей
- [ ] **HTML meta tags** — title, description, Open Graph
- [ ] **Input validation** — client-side file size, message length
- [ ] **Debounce на Send** — предотвращение дублей

---

## Порядок выполнения

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
```

Каждый Phase — отдельный коммит. Phase 0 обязателен перед любым рефакторингом.
