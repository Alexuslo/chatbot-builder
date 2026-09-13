require('dotenv').config();

const config = require('./config');

// Validate required env vars
const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GROQ_API_KEY'];
for (const key of required) {
  if (!config[key]) {
    console.error(`Missing required env: ${key}`);
    process.exit(1);
  }
}

const express = require('express');
const cors = require('cors');

const documentsRouter = require('./routes/documents');
const chatRouter = require('./routes/chat');
const billingRouter = require('./routes/billing');
const widgetRouter = require('./routes/widget');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/documents', documentsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/billing', billingRouter);
app.use('/api/widget', widgetRouter);

app.get('/api/health', async (req, res) => {
  const checks = { status: 'ok' };
  try {
    const supabase = require('./config/supabase');
    await supabase.from('subscriptions').select('id').limit(1);
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
    checks.status = 'degraded';
  }
  res.json(checks);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

// Graceful shutdown
function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
