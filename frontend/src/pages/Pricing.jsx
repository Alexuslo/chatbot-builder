import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Pricing() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setIsLoggedIn(!!session);
      if (session) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/billing/subscription`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        setCurrentPlan(data.plan || 'free');
      }
    });
  }, []);

  const allPlans = [
    {
      name: 'Free',
      price: '$0',
      period: '',
      features: ['1 document', '100 messages/month', 'Basic chatbot'],
      priceId: null
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/mo',
      features: ['Unlimited documents', 'Unlimited messages', 'Embeddable widget', 'Priority support'],
      priceId: 'price_1UDohcJtBbzVlHiNyaiJ7ZTS'
    }
  ];

  // Pro user sees only Pro, others see both
  const plans = currentPlan === 'pro' ? allPlans.filter(p => p.name.toLowerCase() === 'pro') 
    : currentPlan === null ? [] 
    : allPlans;

  const getButtonLabel = (plan) => {
    if (!isLoggedIn) return plan.name === 'Free' ? 'Get Started' : 'Subscribe';
    if (plan.name.toLowerCase() === currentPlan) return 'Current Plan';
    return plan.name === 'Pro' ? 'Upgrade' : 'Get Started';
  };

  const handlePlanClick = async (plan) => {
    if (!isLoggedIn) {
      navigate('/register');
      return;
    }

    if (plan.name.toLowerCase() === currentPlan) return;

    if (plan.name === 'Free') {
      navigate('/dashboard');
      return;
    }

    // Pro plan - create checkout
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/billing/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ priceId: plan.priceId })
      });

      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <nav style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderBottom: '1px solid #eee' }}>
        <Link to="/" style={{ fontSize: '24px', fontWeight: 'bold', textDecoration: 'none', color: '#333' }}>ChatBot Builder</Link>
        <div>
          {isLoggedIn ? (
            <Link to="/dashboard" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '6px' }}>Dashboard</Link>
          ) : (
            <>
              <Link to="/login?returnTo=pricing" style={{ marginRight: '20px', textDecoration: 'none', color: '#555' }}>Login</Link>
              <Link to="/register" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '6px' }}>Get Started</Link>
            </>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '36px' }}>Simple Pricing</h1>
        <p style={{ textAlign: 'center', color: '#555', marginBottom: '50px' }}>Start free, upgrade when you need more.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${plans.length}, 1fr)`, gap: '30px', maxWidth: plans.length === 1 ? '400px' : '800px', margin: '0 auto' }}>
          {plans.map(plan => (
            <div 
              key={plan.name}
              style={{ 
                border: plan.name === 'Pro' ? '2px solid #007bff' : '2px solid #ddd', 
                borderRadius: '12px', 
                padding: '30px',
                textAlign: 'center',
                backgroundColor: 'white',
                position: 'relative'
              }}
            >
              {plan.name === 'Pro' && (
                <div style={{ 
                  position: 'absolute', 
                  top: '-12px', 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>POPULAR</div>
              )}
              <h2 style={{ marginBottom: '10px' }}>{plan.name}</h2>
              <div style={{ fontSize: '42px', fontWeight: 'bold', margin: '20px 0' }}>
                {plan.price}
                {plan.period && <span style={{ fontSize: '16px', color: '#555', fontWeight: 'normal' }}>{plan.period}</span>}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '30px', textAlign: 'left' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ padding: '8px 0', color: '#555' }}>
                    <span style={{ color: '#28a745', marginRight: '8px' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handlePlanClick(plan)}
                disabled={isLoggedIn && plan.name.toLowerCase() === currentPlan}
                style={{ 
                  display: 'block',
                  width: '100%',
                  padding: '14px 24px',
                  backgroundColor: (isLoggedIn && plan.name.toLowerCase() === currentPlan) ? '#ccc' : (plan.name === 'Pro' ? '#007bff' : '#6c757d'),
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: (isLoggedIn && plan.name === currentPlan) ? 'default' : 'pointer'
                }}
              >
                {getButtonLabel(plan)}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
