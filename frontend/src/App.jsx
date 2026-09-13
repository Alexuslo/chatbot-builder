import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Auth from './pages/Auth';
import Documents from './pages/Documents';
import Chat from './pages/Chat';
import Pricing from './pages/Pricing';
import Landing from './pages/Landing';
import Widget from './pages/Widget';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <div className="app">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/register" element={<Auth />} />
              <Route path="/dashboard" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/widget/:widgetId" element={<Widget />} />
            </Routes>
          </div>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;
