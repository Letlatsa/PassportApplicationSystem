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
import CollectionInterface from './pages/CollectionInterface';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return !user ? <>{children}</> : <Navigate to="/dashboard" />;
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
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/collection-points" element={<ProtectedRoute><CollectionPoints /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/collection-interface" element={<CollectionInterface />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ApplicationProvider>
    </AuthProvider>
  );
}

export default App;