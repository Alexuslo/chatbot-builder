const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { subscriptionCheck } = require('../middleware/subscription');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  req.user = user;
  next();
};

async function callGroq(messages) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
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
router.post('/widget', async (req, res) => {
  try {
    const { message, widgetId } = req.body;

    if (!widgetId || !message) {
      return res.status(400).json({ error: 'message and widgetId required' });
    }

    // Resolve public_id → userId
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('public_id', widgetId)
      .single();

    if (!sub) {
      return res.json({ response: 'Invalid widget ID.' });
    }

    // Get all user's documents
    const { data: docs } = await supabase
      .from('documents')
      .select('id, name, content')
      .eq('user_id', sub.user_id);

    if (!docs || docs.length === 0) {
      return res.json({ response: 'No documents found.' });
    }

    const context = docs.map(d => `[${d.name}]\n${d.content.substring(0, 2000)}`).join('\n\n');

    const response = await callGroq([
      {
        role: 'system',
        content: `You are a helpful assistant. Answer questions based ONLY on the following documents. If the answer is not in the documents, say "I don't have information about that in the uploaded documents." Be concise and accurate. Always cite which document the answer comes from.\n\nDocuments:\n${context}`
      },
      { role: 'user', content: message }
    ]);

    res.json({ response });
  } catch (error) {
    console.error('Widget chat error:', error);
    res.status(500).json({ error: error.message });
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
        content: `You are a helpful assistant. Answer questions based ONLY on the following documents. If the answer is not in the documents, say "I don't have information about that in the uploaded documents." Be concise and accurate. Always cite which document the answer comes from.\n\nDocuments:\n${context}`
      },
      { role: 'user', content: message }
    ]);

    res.json({ response, subscription: req.subscription });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
