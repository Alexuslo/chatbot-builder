const express = require('express');
const auth = require('../middleware/auth');
const config = require('../config');
const supabase = require('../config/supabase');
const { errorResponse } = require('../utils/error');

const router = express.Router();

// Get current theme
router.get('/theme', auth, async (req, res) => {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('theme, custom_bg, custom_hover, custom_text')
    .eq('user_id', req.user.id)
    .single();

  res.json({
    theme: sub?.theme || 'blue',
    customBg: sub?.custom_bg,
    customHover: sub?.custom_hover,
    customText: sub?.custom_text
  });
});

// Public theme endpoint (no auth) - for dynamic widget theme loading
router.get('/:widgetId/theme', async (req, res) => {
  const { widgetId } = req.params;

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('theme, custom_bg, custom_hover, custom_text')
    .eq('public_id', widgetId)
    .single();

  if (!sub) {
    return res.status(404).json({ error: 'Widget not found' });
  }

  const themes = THEMES;

  let theme = themes[sub.theme] || themes.blue;

  if (sub.custom_bg) theme.bg = sub.custom_bg;
  if (sub.custom_hover) theme.hover = sub.custom_hover;
  if (sub.custom_text) theme.text = sub.custom_text;

  res.json(theme);
});

// Save theme (Pro only) - saves to subscriptions (user-level)
router.post('/theme', auth, async (req, res) => {
  const { theme, customBg, customHover, customText } = req.body;

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', req.user.id)
    .single();

  if (sub?.plan !== 'pro') {
    return res.status(403).json({ error: 'Pro plan required' });
  }

  const { data, error, count } = await supabase
    .from('subscriptions')
    .update({
      theme: theme || 'blue',
      custom_bg: customBg || null,
      custom_hover: customHover || null,
      custom_text: customText || null
    })
    .eq('user_id', req.user.id);

  console.log('Theme save result:', { data, error, count, userId: req.user.id });

  if (error) return errorResponse(res, 500, 'THEME_SAVE_ERROR', 'Failed to save theme');
  res.json({ success: true });
});

// Get public_id for preview
router.get('/public-id', auth, async (req, res) => {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('public_id')
    .eq('user_id', req.user.id)
    .single();

  if (!sub?.public_id) {
    return res.status(404).json({ error: 'No public ID' });
  }

  res.json({ publicId: sub.public_id });
});

// Shared widget code generator
function generateWidgetCode({ publicId, theme, isPro, frontendUrl, apiBase }) {
  const adBanner = isPro ? '' : `
    // Chat ad overlay - covers chat area for 5s on open
    const chatAd = document.createElement('div');
    chatAd.style.cssText = 'position:absolute;bottom:70px;right:0;width:400px;height:520px;background:white;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15);z-index:10001;display:none;flex-direction:column;align-items:center;justify-content:center;';
    chatAd.innerHTML = '<div style="font-size:32px;font-weight:700;color:#dc3545;letter-spacing:4px">ADS</div><div style="margin-top:12px;font-size:12px;color:#999">Closes in <span id="chatbot-ad-timer">5</span>s</div>';
    
    let chatAdTimer = null;
    function showChatAd() {
      chatAd.style.display = 'flex';
      let sec = 5;
      const timerEl = chatAd.querySelector('#chatbot-ad-timer');
      chatAdTimer = setInterval(() => {
        sec--;
        if (timerEl) timerEl.textContent = sec;
        if (sec <= 0) {
          clearInterval(chatAdTimer);
          chatAd.style.display = 'none';
        }
      }, 1000);
    }`;

  return `<div id="chatbot-widget"></div>
<script>
(function() {
  const widgetId = '${publicId}';
  const apiBase = '${apiBase}';
  const frontendUrl = '${frontendUrl}';
  
  let theme = ${JSON.stringify(theme)};
  
  const container = document.createElement('div');
  container.id = 'chatbot-widget-container';
  container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;font-family:system-ui,-apple-system,sans-serif;';
  
  const button = document.createElement('button');
  button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  button.style.cssText = 'width:60px;height:60px;border-radius:50%;background:'+theme.bg+';color:'+theme.text+';border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;transition:background-color 1s ease,color 1s ease,transform 0.2s;';
  button.onmouseover = () => { button.style.background = theme.hover; button.style.transform = 'scale(1.1)'; };
  button.onmouseout = () => { button.style.background = theme.bg; button.style.transform = 'scale(1)'; };
  
  fetch(apiBase + '/api/widget/' + widgetId + '/theme')
    .then(r => r.json())
    .then(t => {
      theme = t;
      button.style.background = theme.bg;
      button.style.color = theme.text;
      button.onmouseover = () => { button.style.background = theme.hover; button.style.transform = 'scale(1.1)'; };
      button.onmouseout = () => { button.style.background = theme.bg; button.style.transform = 'scale(1)'; };
    })
    .catch(() => {});
  
  const iframe = document.createElement('iframe');
  iframe.src = frontendUrl + '/widget/' + widgetId;
  iframe.style.cssText = 'display:none;position:absolute;bottom:70px;right:0;width:400px;height:520px;border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15);';
  
  let isOpen = false;
  button.onclick = () => {
    isOpen = !isOpen;
    iframe.style.display = isOpen ? 'block' : 'none';
    button.innerHTML = isOpen 
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    ${!isPro ? 'if (isOpen) showChatAd();' : ''}
  };
  
  ${adBanner}
  container.appendChild(iframe);
  container.appendChild(button);
  ${!isPro ? 'container.appendChild(chatAd);' : ''}
  document.body.appendChild(container);
})();
</script>`;
}

// Get subscription data by public_id
async function getSubByPublicId(publicId) {
  return supabase
    .from('subscriptions')
    .select('user_id, plan, theme, custom_bg, custom_hover, custom_text')
    .eq('public_id', publicId)
    .single();
}

const THEMES = {
  blue: { bg: '#007bff', hover: '#0056b3', text: '#ffffff' },
  green: { bg: '#28a745', hover: '#1e7e34', text: '#ffffff' },
  dark: { bg: '#343a40', hover: '#23272b', text: '#ffffff' },
  purple: { bg: '#6f42c1', hover: '#5a32a3', text: '#ffffff' },
  orange: { bg: '#fd7e14', hover: '#e8590c', text: '#ffffff' }
};

function resolveTheme(sub) {
  let theme = THEMES[sub?.theme] || THEMES.blue;
  if (sub?.custom_bg) theme = { ...theme, bg: sub.custom_bg };
  if (sub?.custom_hover) theme = { ...theme, hover: sub.custom_hover };
  if (sub?.custom_text) theme = { ...theme, text: sub.custom_text };
  return theme;
}

// Widget code - uses public_id, not userId
router.get('/', auth, async (req, res) => {
  const userId = req.user.id;
  const frontendUrl = config.FRONTEND_URL;
  const apiBase = config.API_URL;

  // Get or create public_id
  let { data: sub } = await supabase
    .from('subscriptions')
    .select('public_id, plan, theme, custom_bg, custom_hover, custom_text')
    .eq('user_id', userId)
    .single();

  if (!sub) {
    // Create subscription with public_id
    const publicId = require('crypto').randomBytes(8).toString('hex');
    const { data: newSub } = await supabase
      .from('subscriptions')
      .insert({ user_id: userId, plan: 'free', public_id: publicId })
      .select('public_id, plan, theme, custom_bg, custom_hover, custom_text')
      .single();
    sub = newSub;
  } else if (!sub.public_id) {
    // Generate public_id if missing
    const publicId = require('crypto').randomBytes(8).toString('hex');
    await supabase
      .from('subscriptions')
      .update({ public_id: publicId })
      .eq('user_id', userId);
    sub.public_id = publicId;
  }

  const isPro = sub?.plan === 'pro';
  const publicId = sub.public_id;

  console.log('Widget GET sub:', { plan: sub?.plan, theme: sub?.theme, custom_bg: sub?.custom_bg });

  const theme = resolveTheme(sub);

  const widgetCode = `<!-- ChatBot Builder Widget -->\n${generateWidgetCode({ publicId, theme, isPro, frontendUrl, apiBase })}`;

  res.json({ widgetCode });
});

// Widget preview page - reuses widget code generator
router.get('/preview/:widgetId', async (req, res) => {
  const { widgetId } = req.params;
  const frontendUrl = config.FRONTEND_URL;
  const apiBase = config.API_URL;

  const { data: sub } = await getSubByPublicId(widgetId);
  const isPro = sub?.plan === 'pro';
  const theme = resolveTheme(sub);

  const widgetCode = generateWidgetCode({ publicId: widgetId, theme, isPro, frontendUrl, apiBase });

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Widget Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); text-align: center; max-width: 500px; }
    h1 { font-size: 24px; margin-bottom: 12px; }
    p { color: #666; margin-bottom: 8px; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Widget Preview</h1>
    <p>This is how your chatbot widget will look on a website.</p>
    <p>Click the button in the bottom-right corner to open it.</p>
    <p style="margin-top:16px"><code>Widget ID: ${widgetId}</code></p>
    <p style="margin-top:8px"><span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;color:white;background:${isPro ? '#28a745' : '#6c757d'}">${isPro ? 'PRO' : 'FREE'}</span></p>
  </div>
  ${widgetCode}
</body>
</html>`);
});

module.exports = router;
