# ChatBot Builder

AI-платформа для создания чатботов, которые превращают документы компании в умных ассистентов. Загружайте документы, настраивайте внешний вид чатбота и встраивайте его на любой сайт.

## Возможности

- **Загрузка документов** — drag & drop файлов PDF, TXT, MD, CSV, JSON
- **AI-чат** — задавайте вопросы по документам, модель Groq (openai/gpt-oss-20b)
- **Встраиваемый виджет** — один `<script>` тег для встраивания на любой сайт
- **Кастомизация темы** — 5 пресетов + пользовательские цвета (Pro план)
- **Stripe биллинг** — Free (1 док, 100 сообщений) и Pro ($29/мес, безлимит)
- **Превью виджета** — тестирование виджета перед встраиванием

## Технологии

| Уровень | Технология |
|---------|-----------|
| Фронтенд | React 18, Vite, React Router |
| Бэкенд | Node.js, Express.js |
| База данных | Supabase (PostgreSQL + pgvector) |
| AI | Groq API (openai/gpt-oss-20b) |
| Платежи | Stripe (test mode) |
| Авторизация | Supabase Auth (email) |
| Хостинг | Vercel (frontend) + Render (backend) |

## Структура проекта

```
chatbot-builder/
├── backend/
│   ├── config/
│   │   ├── index.js          # централизованный конфиг
│   │   └── supabase.js       # общий клиент Supabase
│   ├── middleware/
│   │   ├── auth.js           # JWT auth middleware
│   │   └── subscription.js   # лимиты планов, проверка Stripe
│   ├── routes/
│   │   ├── auth.js           # регистрация, вход
│   │   ├── chat.js           # AI чат эндпоинты
│   │   ├── documents.js      # загрузка, список, удаление
│   │   ├── widget.js         # код виджета, тема, превью
│   │   └── billing.js        # Stripe checkout, webhook
│   ├── utils/
│   │   └── error.js          # единый формат ошибок
│   ├── server.js             # Express, проверка env, graceful shutdown
│   ├── package.json
│   └── .env                  # локальные переменные (не коммитится)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Toast.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useAuthenticatedFetch.js
│   │   ├── pages/
│   │   │   ├── Auth.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Documents.jsx
│   │   │   ├── Landing.jsx
│   │   │   ├── Pricing.jsx
│   │   │   └── Widget.jsx
│   │   ├── lib/
│   │   │   └── supabase.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vercel.json
└── REFACTOR_ROADMAP.md
```

## Быстрый старт

### Требования

- Node.js 18+
- npm
- Аккаунт Supabase
- API ключ Groq
- Аккаунт Stripe (test mode)

### Установка

```bash
git clone https://github.com/Alexuslo/chatbot-builder.git
cd chatbot-builder
```

### Бэкенд

```bash
cd backend
cp .env.example .env
# Заполни .env своими ключами
npm install
npm run dev
```

### Фронтенд

```bash
cd frontend
cp .env.example .env
# Заполни .env своими ключами
npm install
npm run dev
```

## Переменные окружения

### Backend (.env)

| Переменная | Описание |
|------------|----------|
| `PORT` | Порт сервера (по умолчанию: 3001) |
| `SUPABASE_URL` | URL проекта Supabase |
| `SUPABASE_ANON_KEY` | Анонимный ключ Supabase |
| `GROQ_API_KEY` | API ключ Groq для AI чата |
| `STRIPE_SECRET_KEY` | Секретный ключ Stripe (test mode) |
| `STRIPE_WEBHOOK_SECRET` | Секрет вебхука Stripe |
| `FRONTEND_URL` | URL фронтенда (по умолчанию: http://localhost:5173) |
| `API_URL` | URL бэкенда (по умолчанию: http://localhost:3001) |

### Frontend (.env)

| Переменная | Описание |
|------------|----------|
| `VITE_SUPABASE_URL` | URL проекта Supabase |
| `VITE_SUPABASE_ANON_KEY` | Анонимный ключ Supabase |
| `VITE_API_URL` | URL API бэкенда |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Публичный ключ Stripe |

## Схема базы данных

### Таблицы

- **documents** — загруженные файлы (id, user_id, name, content, created_at)
- **chunks** — чанки документов для векторного поиска (id, document_id, user_id, content, embedding)
- **chat_messages** — история чата (id, user_id, role, content, created_at)
- **subscriptions** — планы пользователей (id, user_id, plan, stripe_subscription_id, public_id, theme, custom_bg, custom_hover, custom_text, created_at, updated_at)

### Расширения

- `vector` — pgvector для эмбеддингов

## API эндпоинты

### Авторизация
- `POST /api/auth/register` — регистрация нового пользователя
- `POST /api/auth/login` — вход, возвращает JWT

### Документы
- `GET /api/documents` — список документов пользователя
- `POST /api/documents/upload` — загрузка документа (multipart/form-data)
- `DELETE /api/documents/:id` — удаление документа

### Чат
- `POST /api/chat` — отправка сообщения, получение ответа AI
- `POST /api/chat/widget` — чат для встроенного виджета (rate limit: 20 запросов/мин)

### Виджет
- `GET /api/widget` — получить код виджета
- `GET /api/widget/preview/:widgetId` — страница превью виджета
- `GET /api/widget/theme` — получить настройки темы
- `POST /api/widget/theme` — сохранить настройки темы (только Pro)

### Биллинг
- `POST /api/billing/checkout` — создать Stripe checkout сессию
- `POST /api/billing/webhook` — обработчик Stripe webhook
- `GET /api/billing/success` — редирект после успешной оплаты

## Встраивание виджета

Скопируйте код виджета из Dashboard и вставьте перед `</body>` на вашем сайте:

```html
<script src="https://frontend-ecru-six-55.vercel.app/widget.js"></script>
<script>
  ChatBotWidget.init({
    id: "YOUR_WIDGET_ID",
    apiBase: "https://chatbot-builder-zks4.onrender.com"
  });
</script>
```

## Деплой

### Фронтенд (Vercel)

```bash
cd frontend
vercel --yes --prod
```

### Бэкенд (Render)

Пуш в ветку `master` → Render автоматически деплоит из GitHub.

Или ручной деплой: Render Dashboard → Service → Manual Deploy → Deploy latest commit.

## Тарифы

| Функция | Free | Pro ($29/мес) |
|---------|------|------|
| Документы | 1 | Безлимит |
| Сообщений/мес | 100 | Безлимит |
| Встраивание виджета | Нет | Да |
| Кастомизация темы | Нет | Да |
| AI модель | gpt-oss-20b | gpt-oss-20b |

## Лицензия

MIT
