import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ApplicationProvider } from './contexts/ApplicationContext';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Apply from './pages/Apply';
import Dashboard from './pages/Dashboard';
import CollectionPoints from './pages/CollectionPoints';
import AdminDashboard from './pages/AdminDashboard';
import OfficialDashboard from './pages/OfficialDashboard';
import OfficerRegister from './pages/OfficerRegister';
import CollectionInterface from './pages/CollectionInterface';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';

function ProtectedRoute({ children, allowedRoles = [] }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, loading, isAdmin, isStaff } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check if user has permission for this route
  const userRole = isAdmin ? 'admin' : isStaff ? 'staff' : 'user';
  const hasPermission = allowedRoles.length === 0 || allowedRoles.includes(userRole);

  if (!hasPermission) {
    // Redirect to appropriate dashboard
    if (isAdmin) {
      return <Navigate to="/admin" />;
    } else if (isStaff) {
      return <Navigate to="/official" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, isStaff } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect authenticated users to appropriate dashboard based on role
  if (user) {
    if (isAdmin) {
      return <Navigate to="/admin" />;
    } else if (isStaff) {
      return <Navigate to="/official" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <ApplicationProvider>
        <Router>
          <div className="min-h-screen">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/apply" element={<ProtectedRoute><Apply /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['user']}><Dashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/collection-points" element={<ProtectedRoute><CollectionPoints /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/official" element={<ProtectedRoute allowedRoles={['staff']}><OfficialDashboard /></ProtectedRoute>} />
                <Route path="/officerRegister" element={<ProtectedRoute><OfficerRegister /></ProtectedRoute>} />
                <Route path="/collection-interface" element={<CollectionInterface />} />
                <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                <Route path="/verify-otp" element={<PublicRoute><VerifyOTP /></PublicRoute>} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ApplicationProvider>
    </AuthProvider>
  );
}

export default App;
