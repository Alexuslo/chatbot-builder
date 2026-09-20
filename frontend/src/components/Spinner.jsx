export function Spinner({ size = 20, color = 'white' }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid rgba(255,255,255,0.2)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }}
    />
  );
}

export function FullScreenSpinner({ text = 'Wait please...' }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5000,
    }}>
      <Spinner size={40} color="white" />
      <p style={{ color: 'white', marginTop: '16px', fontSize: '16px' }}>{text}</p>
    </div>
  );
}

export default Spinner;
