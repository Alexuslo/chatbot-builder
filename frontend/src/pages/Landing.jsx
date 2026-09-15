import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <nav style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '24px', fontWeight: 'bold' }}>ChatBot Builder</span>
        <div>
          <Link to="/login" style={{             padding: '10px 30px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '6px' }}>
            Login
          </Link>
        </div>
      </nav>

      <section style={{ textAlign: 'center', padding: '1px 20px 30px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '12px' }}>
          Turn Your Docs into AI Chatbot
        </h1>
        <p style={{ fontSize: '16px', color: '#aaa', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
          Upload your company knowledge and get an AI-powered chatbot in minutes.
          Embed it anywhere.
        </p>
        <Link 
          to="/register"
          style={{ 
            padding: '15px 30px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '8px',
            fontSize: '18px'
          }}
        >
          Start Free →
        </Link>
      </section>

      <section style={{ padding: '30px 20px', backgroundColor: '#f8f9fa', borderRadius: '12px', margin: '0 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📄</div>
            <h3>Upload Documents</h3>
            <p style={{ color: '#555' }}>Support for PDF, TXT, MD files. Auto-indexed for AI search.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🤖</div>
            <h3>AI Chatbot</h3>
            <p style={{ color: '#555' }}>ChatGPT-like interface that knows your documents.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔗</div>
            <h3>Embed Anywhere</h3>
            <p style={{ color: '#555' }}>Get a widget to embed on your website in one line of code.</p>
          </div>
        </div>
      </section>

      <section style={{ textAlign: 'center', padding: '30px 20px' }}>
        <h2>Ready to build your chatbot?</h2>
        <p style={{ color: '#aaa', marginBottom: '30px' }}>Start for free. No credit card required.</p>
        <Link 
          to="/register"
          style={{ 
            padding: '15px 30px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '8px',
            fontSize: '18px'
          }}
        >
          Get Started Free
        </Link>
      </section>

      <footer style={{ padding: '20px 20px', backgroundColor: '#f8f9fa', textAlign: 'center', color: '#888', borderRadius: '12px', margin: '0 20px' }}>
        <p>© 2026 ChatBot Builder. Built with AI.</p>
      </footer>
    </div>
  );
}
