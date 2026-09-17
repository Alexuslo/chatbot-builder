import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Spinner from '../components/Spinner';

const THEMES = {
  blue: { bg: '#007bff', hover: '#0056b3', text: '#ffffff' },
  green: { bg: '#28a745', hover: '#1e7e34', text: '#ffffff' },
  dark: { bg: '#343a40', hover: '#23272b', text: '#ffffff' },
  purple: { bg: '#6f42c1', hover: '#5a32a3', text: '#ffffff' },
  orange: { bg: '#fd7e14', hover: '#e8590c', text: '#ffffff' }
};

export default function Widget() {
  const { widgetId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(THEMES.blue);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Fetch theme from server
    fetch(`${import.meta.env.VITE_API_URL}/api/widget/${widgetId}/theme`)
      .then(r => r.json())
      .then(t => {
        if (t.bg) {
          const resolved = THEMES[t.bg] || { bg: t.bg, hover: t.hover || t.bg, text: t.text || '#ffffff' };
          if (t.custom_bg) resolved.bg = t.custom_bg;
          if (t.custom_hover) resolved.hover = t.custom_hover;
          if (t.custom_text) resolved.text = t.custom_text;
          setTheme(resolved);
        }
      })
      .catch(() => {});

    if (window.parent !== window) {
      window.parent.postMessage('chatbot-opened', '*');
    }
  }, [widgetId]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/widget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, widgetId })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || 'Sorry, something went wrong.'
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error connecting to server.'
      }]);
    }

    setLoading(false);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      margin: 0, 
      padding: 0,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        padding: '12px 16px', 
        backgroundColor: theme.bg, 
        color: theme.text,
        fontWeight: '600',
        fontSize: '14px'
      }}>
        ChatBot Assistant
      </div>
      
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999', fontSize: '14px', marginTop: '40px' }}>
            Ask me anything about the uploaded documents...
          </p>
        )}
        
        {messages.map((msg, i) => (
          <div 
            key={i} 
            style={{ 
              marginBottom: '12px',
              textAlign: msg.role === 'user' ? 'right' : 'left'
            }}
          >
            <div 
              style={{ 
                display: 'inline-block',
                padding: '10px 14px',
                borderRadius: '12px',
                maxWidth: '80%',
                fontSize: '14px',
                lineHeight: '1.4',
                backgroundColor: msg.role === 'user' ? theme.bg : '#f0f0f0',
                color: msg.role === 'user' ? theme.text : '#333'
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div style={{ 
        padding: '12px', 
        borderTop: '1px solid #eee', 
        display: 'flex', 
        gap: '8px',
        backgroundColor: 'white'
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your question..."
          disabled={loading}
          style={{ 
            flex: 1, 
            padding: '10px 12px', 
            fontSize: '14px', 
            borderRadius: '8px', 
            border: '1px solid #ddd',
            outline: 'none'
          }}
        />
        <button 
          onClick={sendMessage} 
          disabled={loading || !input.trim()}
          style={{ 
            padding: '10px 16px', 
            backgroundColor: theme.bg, 
            color: theme.text, 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontSize: '14px',
            opacity: loading || !input.trim() ? 0.6 : 1
          }}
        >
          {loading ? <Spinner size={16} /> : 'Send'}
        </button>
      </div>
    </div>
  );
}
