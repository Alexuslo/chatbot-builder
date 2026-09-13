import { useState, useEffect, useCallback } from 'react';

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, duration = 2000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return { toasts, addToast };
}

export default function Toast({ toasts }) {
  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 3000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          role="alert"
          style={{
            padding: '12px 24px',
            backgroundColor: '#333',
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
