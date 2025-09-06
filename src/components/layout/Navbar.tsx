import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, LogOut, Menu } from 'lucide-react';
import CoatOfArms from '../../CoatOfArms.png';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg border-b-2 border-blue-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src={CoatOfArms} 
                alt="Coat of Arms" 
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/apply"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/apply') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Apply
                </Link>
                <Link
                  to="/collection-points"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/collection-points') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Collection Points
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/admin') 
                        ? 'bg-red-100 text-red-700' 
                        : 'text-red-600 hover:text-red-700'
                    }`}
                  >
                    Admin
                  </Link>
                )}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/dashboard') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/apply"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/apply') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Apply
                </Link>
                <Link
                  to="/collection-points"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/collection-points') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Collection Points
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/admin') 
                        ? 'bg-red-100 text-red-700' 
                        : 'text-red-600 hover:text-red-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex items-center px-3 py-2">
                    <User className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-sm text-gray-700">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-3 py-2 text-left text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}