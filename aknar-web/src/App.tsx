import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Orchards from './pages/Orchards';
import OrchardDetail from './pages/OrchardDetail';
import Predict from './pages/Predict';
import Alerts from './pages/Alerts';
import Irrigation from './pages/Irrigation';
import Producers from './pages/Producers';
import Users from './pages/Users';
import Devices from './pages/Devices';
import Profile from './pages/Profile';
import History from './pages/History';
import Reports from './pages/Reports';
import DiseaseGuide from './pages/DiseaseGuide';
import SensorKds from './pages/SensorKds';
import CompareOrchards from './pages/CompareOrchards';

// Components
import Sidebar from './components/Sidebar';
import Chatbot from './components/Chatbot';
import { getAlerts } from './api/alerts';

function ProtectedLayout() {
  const { user } = useAuth();
  const [alertCount, setAlertCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    getAlerts()
      .then((a) => setAlertCount(a.filter((x) => !x.isRead).length))
      .catch(() => {});
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar alertCount={alertCount} />
      <div className="main-content">
        <div className="page-body">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orchards" element={<Orchards />} />
            <Route path="/compare" element={<CompareOrchards />} />
            <Route path="/orchards/:id" element={<OrchardDetail />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/irrigation" element={<Irrigation />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reports" element={<Reports />} />
             <Route path="/guide" element={<DiseaseGuide />} />
            <Route path="/sensor-kds" element={<SensorKds />} />
            <Route path="/history" element={<History />} />
            <Route path="/producers" element={<Producers />} />
            <Route path="/users" element={<Users />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
      <button 
        className="btn btn-primary"
        style={{ 
          position: 'fixed', 
          bottom: '24px', 
          right: '24px', 
          borderRadius: '50%', 
          width: '56px', 
          height: '56px', 
          padding: 0, 
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
          zIndex: 99
        }}
        onClick={() => setIsChatOpen(!isChatOpen)}
      >
        <span style={{ fontSize: '24px' }}>💬</span>
      </button>
      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

function PublicRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <Login />;
}

function RegisterRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <Register />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#161b22',
            color: '#e6edf3',
            border: '1px solid #30363d',
            borderRadius: '8px',
            fontSize: '13px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#0d1117' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#0d1117' },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<PublicRoute />} />
        <Route path="/register" element={<RegisterRoute />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
