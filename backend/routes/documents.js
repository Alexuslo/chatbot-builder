const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { HfInference } = require('@huggingface/inference');
const { subscriptionCheck, getSubscription } = require('../middleware/subscription');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  req.user = user;
  next();
};

// Upload document (with plan check)
router.post('/upload', auth, subscriptionCheck('document'), upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const content = fs.readFileSync(file.path, 'utf-8');

    const { data: doc, error } = await supabase
      .from('documents')
      .insert({
        user_id: req.user.id,
        name: file.originalname,
        content: content
      })
      .select()
      .single();

    if (error) throw error;

    // Split into chunks and save
    const chunks = splitIntoChunks(content, 500);

    for (const chunk of chunks) {
      // Get embedding using HuggingFace
      const embedding = await hf.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: chunk
      });

      await supabase.from('chunks').insert({
        document_id: doc.id,
        content: chunk,
        embedding: JSON.stringify(Array.from(embedding))
      });
    }

    res.json({ success: true, documentId: doc.id, subscription: req.subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// List documents with subscription info
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.json({ documents: [], plan: 'free' });
    }

    const plan = await getSubscription(req.user.id);
    console.log('Documents for user:', req.user.id, 'count:', data?.length);

    res.json({ documents: data || [], plan });
  } catch (err) {
    console.error('Error loading documents:', err);
    res.json({ documents: [], plan: 'free' });
  }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
  await supabase.from('chunks').delete().eq('document_id', req.params.id);
  await supabase.from('documents').delete().eq('id', req.params.id);
  res.json({ success: true });
});

function splitIntoChunks(text, maxTokens) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxTokens * 4) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence + '. ';
    }
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}

module.exports = router;
