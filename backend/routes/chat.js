const express = require('express');
const rateLimit = require('express-rate-limit');
const { subscriptionCheck } = require('../middleware/subscription');
const auth = require('../middleware/auth');
const config = require('../config');
const supabase = require('../config/supabase');
const { errorResponse } = require('../utils/error');

const router = express.Router();

const widgetLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later' }
});

async function callGroq(messages) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages,
      max_tokens: 1024,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Public chat for widget (no auth required, searches all user's documents)
router.post('/widget', widgetLimiter, async (req, res) => {
  try {
    const { message, widgetId } = req.body;

    if (!widgetId || !message) {
      return errorResponse(res, 400, 'MISSING_FIELDS', 'message and widgetId required');
    }

    // Resolve public_id → userId
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('public_id', widgetId)
      .single();

    if (!sub) {
      return errorResponse(res, 404, 'WIDGET_NOT_FOUND', 'Invalid widget ID');
    }

    // Get all user's documents
    const { data: docs } = await supabase
      .from('documents')
      .select('id, name, content')
      .eq('user_id', sub.user_id);

    if (!docs || docs.length === 0) {
      return errorResponse(res, 404, 'NO_DOCUMENTS', 'No documents found for this widget');
    }

    const context = docs.map(d => `[${d.name}]\n${d.content.substring(0, 2000)}`).join('\n\n');

    const response = await callGroq([
      {
        role: 'system',
        content: `You are a helpful and friendly assistant for a company. You have access to the company's documents. Answer questions based on those documents when relevant. For greetings and general questions, respond naturally and helpfully. Always cite which document the answer comes from when using document information.\n\nDocuments:\n${context}`
      },
      { role: 'user', content: message }
    ]);

    res.json({ response });
  } catch (error) {
    console.error('Widget chat error:', error);
    errorResponse(res, 500, 'CHAT_ERROR', 'Failed to process message');
  }
});

// Chat with all user's documents
router.post('/', auth, subscriptionCheck('message'), async (req, res) => {
  try {
    const { message } = req.body;

    // Get all user's documents
    const { data: docs } = await supabase
      .from('documents')
      .select('id, name, content')
      .eq('user_id', req.user.id);

    if (!docs || docs.length === 0) {
      return res.json({ response: 'No documents uploaded yet. Please upload a document first.' });
    }

    // Build context from all documents
    const context = docs.map(d => `[${d.name}]\n${d.content.substring(0, 3000)}`).join('\n\n');

    // Call Groq AI
    const response = await callGroq([
      {
        role: 'system',
        content: `You are a helpful and friendly assistant for a company. You have access to the company's documents. Answer questions based on those documents when relevant. For greetings and general questions, respond naturally and helpfully. Always cite which document the answer comes from when using document information.\n\nDocuments:\n${context}`
      },
      { role: 'user', content: message }
    ]);

    res.json({ response, subscription: req.subscription });
  } catch (error) {
    console.error('Chat error:', error);
    errorResponse(res, 500, 'CHAT_ERROR', 'Failed to process message');
  }
});

module.exports = router;
