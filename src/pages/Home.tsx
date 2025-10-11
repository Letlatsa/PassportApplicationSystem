import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Clock, MapPin, Smartphone, CheckCircle, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white/10 backdrop-blur-sm">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-green-600 text-white pt-24 pb-16">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Digital Passport Services
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Apply for your Lesotho passport from anywhere. Simple, secure, and convenient.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  View Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Apply Now
                  </Link>
                  <Link
                    to="/login"
                    className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Digital Applications?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience a faster, more convenient way to apply for your passport
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Save Time</h3>
              <p className="text-gray-600 leading-relaxed">
                No more long queues. Submit your application online and track progress in real-time.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Convenient Collection</h3>
              <p className="text-gray-600 leading-relaxed">
                Choose from multiple collection points across Lesotho for easy passport pickup.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Mobile Friendly</h3>
              <p className="text-gray-600 leading-relaxed">
                Optimized for mobile devices with simple, step-by-step guidance.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure & Safe</h3>
              <p className="text-gray-600 leading-relaxed">
                End-to-end encryption protects your personal information and documents.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Real-time Updates</h3>
              <p className="text-gray-600 leading-relaxed">
                Receive SMS and email notifications at every step of the process.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Simple Process</h3>
              <p className="text-gray-600 leading-relaxed">
                User-friendly interface designed for all literacy levels with clear instructions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to get your passport
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Register Account</h3>
              <p className="text-gray-600">Create your secure account with email verification</p>
            </div>

            <div className="text-center">
              <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Submit Application</h3>
              <p className="text-gray-600">Fill the form and upload required documents</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Progress</h3>
              <p className="text-gray-600">Monitor your application status in real-time</p>
            </div>

            <div className="text-center">
              <div className="bg-orange-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Collect Passport</h3>
              <p className="text-gray-600">Pick up from your chosen collection point</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600/90 backdrop-blur-sm text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Apply?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of citizens who have already simplified their passport application process
          </p>
          {!user && (
            <Link
              to="/register"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center"
            >
              <FileText className="w-5 h-5 mr-2" />
              Start Your Application
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}