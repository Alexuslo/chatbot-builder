import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const THEMES = [
  { id: 'blue', name: 'Blue', bg: '#007bff', hover: '#0056b3', text: '#ffffff' },
  { id: 'green', name: 'Green', bg: '#28a745', hover: '#1e7e34', text: '#ffffff' },
  { id: 'dark', name: 'Dark', bg: '#343a40', hover: '#23272b', text: '#ffffff' },
  { id: 'purple', name: 'Purple', bg: '#6f42c1', hover: '#5a32a3', text: '#ffffff' },
  { id: 'orange', name: 'Orange', bg: '#fd7e14', hover: '#e8590c', text: '#ffffff' },
  { id: 'custom', name: 'Custom', bg: '#007bff', hover: '#0056b3', text: '#ffffff' }
];

const THEMES_COLORS = {
  blue: { bg: '#007bff', hover: '#0056b3', text: '#ffffff' },
  green: { bg: '#28a745', hover: '#1e7e34', text: '#ffffff' },
  dark: { bg: '#343a40', hover: '#23272b', text: '#ffffff' },
  purple: { bg: '#6f42c1', hover: '#5a32a3', text: '#ffffff' },
  orange: { bg: '#fd7e14', hover: '#e8590c', text: '#ffffff' }
};

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [widgetCode, setWidgetCode] = useState('');
  const [plan, setPlan] = useState('free');
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [theme, setTheme] = useState({ bg: '#6c757d', hover: '#5a6268', text: '#ffffff' });
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('blue');
  const [customBg, setCustomBg] = useState('#007bff');
  const [customHover, setCustomHover] = useState('#0056b3');
  const [customText, setCustomText] = useState('#ffffff');
  const [toast, setToast] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  useEffect(() => {
    checkUser();
    loadDocuments();
    loadTheme();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    }
  };

  const loadDocuments = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/documents`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    const result = await response.json();
    setDocuments(result.documents || []);
    setPlan(result.plan || 'free');
  };

  const loadTheme = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/widget/theme`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    const data = await response.json();
    setSelectedTheme(data.theme || 'blue');
    if (data.customBg) setCustomBg(data.customBg);
    if (data.customHover) setCustomHover(data.customHover);
    if (data.customText) setCustomText(data.customText);
    
    const t = THEMES_COLORS[data.theme] || THEMES_COLORS.blue;
    if (data.customBg) t.bg = data.customBg;
    if (data.customHover) t.hover = data.customHover;
    if (data.customText) t.text = data.customText;
    setTheme(t);
    setThemeLoaded(true);
  };

  const [dragOver, setDragOver] = useState(false);

  const uploadDocument = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.upgrade) {
        showToast('Free plan: maximum 1 document. Upgrade to Pro for unlimited.');
        return;
      }

      loadDocuments();
      setFile(null);
    } catch (error) {
      console.error(error);
    }

    setUploading(false);
  };

  const saveTheme = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_API_URL}/api/widget/theme`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        theme: selectedTheme,
        customBg: selectedTheme === 'custom' ? customBg : null,
        customHover: selectedTheme === 'custom' ? customHover : null,
        customText: selectedTheme === 'custom' ? customText : null
      })
    });
    showToast('Theme saved!');
    setShowThemePicker(false);
    const t = THEMES_COLORS[selectedTheme] || THEMES_COLORS.blue;
    if (selectedTheme === 'custom') {
      if (customBg) t.bg = customBg;
      if (customHover) t.hover = customHover;
      if (customText) t.text = customText;
    }
    setTheme(t);
  };

  const getWidgetCode = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/widget`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    const data = await response.json();
    setWidgetCode(data.widgetCode);
    navigator.clipboard.writeText(data.widgetCode);
  };

  const copyWidgetCode = () => {
    navigator.clipboard.writeText(widgetCode);
    showToast('Widget code copied!');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>My Documents</h1>
        </div>
        <div>
          {plan === 'pro' && (
            <button 
              onClick={() => setShowThemePicker(true)}
              style={{ marginRight: '10px', padding: '8px 16px', background: 'none', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}
            >
              Theme
            </button>
          )}
          <button onClick={() => navigate('/pricing')} style={{ marginRight: '10px', padding: '8px 16px', background: 'none', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>Pricing</button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: 'none', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>
      
      <div 
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); setFile(e.dataTransfer.files[0]); }}
        style={{ 
          position: 'relative',
          marginBottom: '30px', 
          padding: '40px', 
          border: `2px dashed ${dragOver ? theme.bg : '#ccc'}`, 
          borderRadius: '8px',
          textAlign: 'center',
          backgroundColor: dragOver ? '#f0f7ff' : 'transparent',
          transition: 'all 0.2s'
        }}
      >
        {/* Plan badge - rounded triangle in corner */}
        <div style={{
          position: 'absolute',
          top: '-1px',
          left: '-1px',
          width: '80px',
          height: '80px',
          overflow: 'hidden',
          borderRadius: '8px 0 8px 0',
          zIndex: 10
        }}>
          <div style={{
            position: 'absolute',
            top: '-40px',
            left: '-40px',
            width: '80px',
            height: '80px',
            backgroundColor: plan === 'pro' ? '#28a745' : '#6c757d',
            transform: 'rotate(45deg)'
          }} />
          <span style={{
            position: 'absolute',
            top: '16px',
            left: '4px',
            color: 'white',
            fontSize: '11px',
            fontWeight: '700',
            transform: 'rotate(-45deg)'
          }}>
            {plan === 'pro' ? 'PRO' : 'FREE'}
          </span>
        </div>
        <p style={{ marginBottom: '15px', color: '#555' }}>
          {file ? file.name : 'Drag & drop a file here, or click to browse'}
        </p>
        <input
          type="file"
          accept=".pdf,.txt,.md"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label 
          htmlFor="file-input" 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#6c757d', 
            color: 'white', 
            borderRadius: '6px', 
            cursor: 'pointer',
            display: 'inline-block',
            marginBottom: '10px'
          }}
        >
          Browse Files
        </label>
        <br />
        <button 
          onClick={uploadDocument} 
          disabled={!file || uploading}
          style={{ padding: '10px 20px', backgroundColor: theme.bg, color: theme.text, border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.3s ease' }}
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {documents.length > 0 && (
          <>
            <button 
              onClick={() => navigate('/chat')}
              style={{ flex: 4, padding: '12px 24px', backgroundColor: theme.bg, color: theme.text, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', transition: 'background-color 0.3s ease' }}
            >
              Chat with all documents
            </button>
            <button 
              onClick={getWidgetCode}
              style={{ flex: 1, padding: '12px 24px', backgroundColor: theme.bg, color: theme.text, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', transition: 'background-color 0.3s ease' }}
            >
              Get Widget
            </button>
          </>
        )}
      </div>

      <h2>Uploaded Documents</h2>
      {documents.length === 0 ? (
        <p>No documents yet. Upload your first document above.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {documents.map(doc => (
            <li key={doc.id} style={{ padding: '15px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500' }}>{doc.name}</span>
              <button 
                onClick={() => setConfirmDelete(doc.id)}
                style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {showThemePicker && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
            <h3 style={{ marginTop: 0 }}>Choose Widget Theme</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTheme(t.id)}
                  style={{
                    padding: '15px',
                    border: selectedTheme === t.id ? '3px solid #007bff' : '2px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: t.bg,
                    color: t.text,
                    fontWeight: 'bold'
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>

            {selectedTheme === 'custom' && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Background Color</label>
                  <input type="color" value={customBg} onChange={(e) => setCustomBg(e.target.value)} style={{ width: '100%', height: '40px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Hover Color</label>
                  <input type="color" value={customHover} onChange={(e) => setCustomHover(e.target.value)} style={{ width: '100%', height: '40px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Text Color</label>
                  <input type="color" value={customText} onChange={(e) => setCustomText(e.target.value)} style={{ width: '100%', height: '40px' }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={saveTheme}
                style={{ flex: 1, padding: '10px', backgroundColor: theme.bg, color: theme.text, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Save Theme
              </button>
              <button 
                onClick={() => setShowThemePicker(false)}
                style={{ flex: 1, padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {widgetCode && (
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3>Embed Widget Code</h3>
          <p style={{ color: '#555', marginBottom: '10px', fontSize: '14px' }}>Copy and paste this code into your website's HTML:</p>
          <textarea 
            readOnly 
            value={widgetCode} 
            style={{ width: '100%', height: '150px', fontFamily: 'monospace', fontSize: '12px', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
          />
          <button 
            onClick={copyWidgetCode}
            style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: theme.bg, color: theme.text, border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.3s ease' }}
          >
            Copy Code
          </button>
        </div>
      )}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '12px 24px', backgroundColor: '#333', color: 'white', borderRadius: '8px', zIndex: 3000, fontSize: '14px' }}>
          {toast}
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ marginBottom: '20px', fontSize: '16px' }}>Delete this document?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={async () => {
                  const { data: { session } } = await supabase.auth.getSession();
                  await fetch(`${import.meta.env.VITE_API_URL}/api/documents/${confirmDelete}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                  });
                  setConfirmDelete(null);
                  loadDocuments();
                }}
                style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Delete
              </button>
              <button 
                onClick={() => setConfirmDelete(null)}
                style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
