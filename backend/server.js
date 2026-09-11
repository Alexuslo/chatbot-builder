const express = require('express');
const cors = require('cors');
require('dotenv').config();

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
