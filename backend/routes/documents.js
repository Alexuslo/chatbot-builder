const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { HfInference } = require('@huggingface/inference');
const { subscriptionCheck, getSubscription } = require('../middleware/subscription');
const auth = require('../middleware/auth');
const config = require('../config');
const supabase = require('../config/supabase');
const { errorResponse } = require('../utils/error');

const router = express.Router();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.txt', '.md', '.csv', '.json'];
    const ext = require('path').extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

const hf = new HfInference(config.HUGGINGFACE_TOKEN);

// Upload document (with plan check)
router.post('/upload', auth, subscriptionCheck('document'), upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const content = fs.readFileSync(file.path, 'utf-8');
    fs.unlinkSync(file.path);

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
    errorResponse(res, 500, 'UPLOAD_ERROR', 'Failed to upload document');
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
  await supabase.from('documents').delete().eq('id', req.params.id).eq('user_id', req.user.id);
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
