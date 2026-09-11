import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Auth from './pages/Auth';
import Documents from './pages/Documents';
import Chat from './pages/Chat';
import Pricing from './pages/Pricing';
import Landing from './pages/Landing';
import Widget from './pages/Widget';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          <Route path="/dashboard" element={<Documents />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/widget/:widgetId" element={<Widget />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
