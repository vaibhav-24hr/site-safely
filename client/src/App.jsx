import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/layout/ErrorBoundary';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Login';
import WorkerDashboard from './components/worker/WorkerDashboard';
import SafetyForm from './pages/SafetyForm';
import SubmissionDetails from './pages/SubmissionDetails';
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import { useAuth } from './context/AuthContext';

const AppLayout = ({ children }) => (
  <>
    <Navbar />
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {children}
    </main>
  </>
);

const RootRedirect = () => {
  const { role } = useAuth();
  if (role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <AppLayout><WorkerDashboard /></AppLayout>;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/submit" element={<AppLayout><SafetyForm /></AppLayout>} />
              <Route path="/submissions/:id" element={<AppLayout><SubmissionDetails /></AppLayout>} />
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            </Route>
            
            {/* 404 Catch All */}
            <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
