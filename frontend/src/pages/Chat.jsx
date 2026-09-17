import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import Spinner from '../components/Spinner';

const THEMES = {
  blue: { bg: '#007bff', hover: '#0056b3', text: '#ffffff' },
  green: { bg: '#28a745', hover: '#1e7e34', text: '#ffffff' },
  dark: { bg: '#343a40', hover: '#23272b', text: '#ffffff' },
  purple: { bg: '#6f42c1', hover: '#5a32a3', text: '#ffffff' },
  orange: { bg: '#fd7e14', hover: '#e8590c', text: '#ffffff' }
};

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState({ bg: '#6c757d', hover: '#5a6268', text: '#ffffff' });
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const authFetch = useAuthenticatedFetch();

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }';
    document.head.appendChild(style);
    loadTheme();
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadTheme = async () => {
    const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/widget/theme`);
    const data = await response.json();
    const t = { ...(THEMES[data.theme] || THEMES.blue) };
    if (data.customBg) t.bg = data.customBg;
    if (data.customHover) t.hover = data.customHover;
    if (data.customText) t.text = data.customText;
    setTheme(t);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await authFetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: 'POST',
        body: JSON.stringify({ message: input })
      });

      const data = await response.json();
      
      if (data.upgrade) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'You reached the Free plan limit (100 messages/month). Upgrade to Pro for unlimited messages.'
        }]);
        return;
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error connecting to server.'
      }]);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '15px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', backgroundColor: theme.bg, color: theme.text, transition: 'background-color 1s ease, color 1s ease' }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.text }}>
          ← Back to Documents
        </button>
        <span>Chat with all documents</span>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999' }}>
            Ask questions about your documents...
          </p>
        )}
        
        {messages.map((msg, i) => (
          <div 
            key={i} 
            style={{ 
              marginBottom: '15px',
              textAlign: msg.role === 'user' ? 'right' : 'left'
            }}
          >
            <div 
              style={{ 
                display: 'inline-block',
                padding: '12px 16px',
                borderRadius: '12px',
                maxWidth: '70%',
                backgroundColor: msg.role === 'user' ? theme.bg : '#f0f0f0',
                color: msg.role === 'user' ? theme.text : 'black',
                transition: 'background-color 1s ease, color 1s ease'
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div style={{ padding: '20px', borderTop: '1px solid #ddd', display: 'flex', gap: '10px' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about your documents..."
          disabled={loading}
          style={{ flex: 1, padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ddd' }}
        />
        <button 
          onClick={sendMessage} 
          disabled={loading}
          style={{ padding: '12px 24px', backgroundColor: theme.bg, color: theme.text, border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 1s ease, color 1s ease' }}
        >
          {loading ? <Spinner /> : 'Send'}
        </button>
      </div>
    </div>
  );
}
