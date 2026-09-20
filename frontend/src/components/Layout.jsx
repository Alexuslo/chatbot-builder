import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children, showNav = true }) {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (!showNav) return children;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <nav style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
        {session ? (
          <>
            <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', background: 'none', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>Dashboard</button>
            <button onClick={handleLogout} style={{ padding: '8px 16px', background: 'none', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/login')} style={{ padding: '8px 16px', background: 'none', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>Login</button>
            <button onClick={() => navigate('/register')} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Register</button>
          </>
        )}
      </nav>
      {children}
    </div>
  );
}
