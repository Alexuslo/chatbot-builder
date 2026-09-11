import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div>
      <nav style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '24px', fontWeight: 'bold' }}>ChatBot Builder</span>
        <div>
          <Link to="/login" style={{ marginRight: '20px', textDecoration: 'none' }}>Login</Link>
          <Link to="/register" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '6px' }}>
            Get Started
          </Link>
        </div>
      </nav>

      <section style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
          Turn Your Docs into AI Chatbot
        </h1>
        <p style={{ fontSize: '20px', color: '#555', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
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

      <section style={{ padding: '60px 20px', backgroundColor: '#f8f9fa' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📄</div>
            <h3>Upload Documents</h3>
            <p style={{ color: '#555' }}>Support for PDF, TXT, MD files. Auto-indexed for AI search.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤖</div>
            <h3>AI Chatbot</h3>
            <p style={{ color: '#555' }}>ChatGPT-like interface that knows your documents.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔗</div>
            <h3>Embed Anywhere</h3>
            <p style={{ color: '#555' }}>Get a widget to embed on your website in one line of code.</p>
          </div>
        </div>
      </section>

      <section style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Ready to build your chatbot?</h2>
        <p style={{ color: '#555', marginBottom: '30px' }}>Start for free. No credit card required.</p>
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

      <footer style={{ padding: '40px 20px', backgroundColor: '#f8f9fa', textAlign: 'center', color: '#555' }}>
        <p>© 2026 ChatBot Builder. Built with AI.</p>
      </footer>
    </div>
  );
}
