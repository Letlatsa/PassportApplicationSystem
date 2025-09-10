import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, Package, Plus, Search, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApplications } from '../contexts/ApplicationContext';
import ApplicationCard from '../components/dashboard/ApplicationCard';
import StatusTimeline from '../components/dashboard/StatusTimeline';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { user } = useAuth();
  const { applications, loading, refreshApplications } = useApplications();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    reference_number: ''
  });

  useEffect(() => {
    refreshApplications();
  }, []);

  const hasActiveApplication = applications.some(app => 
    ['submitted', 'under_review', 'approved'].includes(app.status)
  );
  
  // Add error handling for missing data
  const safeApplications = applications || [];
  const safeStats = {
    total: safeApplications.length,
    submitted: safeApplications.filter(app => app.status === 'submitted').length,
    under_review: safeApplications.filter(app => app.status === 'under_review').length,
    ready: safeApplications.filter(app => app.status === 'ready_for_collection').length,
    collected: safeApplications.filter(app => app.status === 'collected').length
  };

  const bookAppointment = async () => {
    if (!selectedApplication || !appointmentData.date || !appointmentData.time || !appointmentData.reference_number) {
      alert('Please fill in all appointment details');
      return;
    }

    if (appointmentData.reference_number !== selectedApplication.reference_number) {
      alert('Reference number does not match your application');
      return;
    }

    try {
      // In a real app, you would save this to a biometrics_appointments table
      alert(`Appointment booked successfully for ${appointmentData.date} at ${appointmentData.time}. You will receive a confirmation email shortly.`);
      setShowAppointmentModal(false);
      setAppointmentData({ date: '', time: '', reference_number: '' });
    } catch (error) {
      alert('Error booking appointment. Please try again.');
    }
  };
  const filteredApplications = applications.filter(app =>
    app.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = safeStats;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 mb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.user_metadata?.first_name || user?.email}
        </h1>
        <p className="text-gray-600">
          Manage your passport applications and track their progress
        </p>
      </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Under Review</p>
              <p className="text-2xl font-bold text-gray-900">{stats.under_review}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Ready for Collection</p>
              <p className="text-2xl font-bold text-gray-900">{stats.ready}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-emerald-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Collected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.collected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex gap-4">
            {!hasActiveApplication ? (
              <Link
                to="/apply"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Application
              </Link>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 text-sm">
                  You have an active application. Complete it before applying for another passport.
                </span>
              </div>
            )}
            
            {applications.some(app => app.status === 'approved') && (
              <button
                onClick={() => {
                  const approvedApp = applications.find(app => app.status === 'approved');
                  setSelectedApplication(approvedApp);
                  setShowAppointmentModal(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book Biometrics Appointment
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-auto sm:min-w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Applications</h2>
        
        {filteredApplications.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Applications Found</h3>
            <p className="text-gray-600 mb-6">
              {applications.length === 0 
                ? "You haven't submitted any passport applications yet." 
                : "No applications match your search criteria."
              }
            </p>
            {applications.length === 0 && !hasActiveApplication && (
              <Link
                to="/apply"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Submit Your First Application
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredApplications.map((application) => (
              <div key={application.id} className="bg-white/90 backdrop-blur-sm rounded-lg shadow overflow-hidden">
                <ApplicationCard application={application} />
                <div className="border-t border-gray-200">
                  <StatusTimeline applicationId={application.id} currentStatus={application.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appointment Booking Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Biometrics Appointment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={appointmentData.reference_number}
                  onChange={(e) => setAppointmentData({...appointmentData, reference_number: e.target.value})}
                  placeholder="Enter your reference number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={appointmentData.date}
                  onChange={(e) => setAppointmentData({...appointmentData, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Time
                </label>
                <select
                  value={appointmentData.time}
                  onChange={(e) => setAppointmentData({...appointmentData, time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select time</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="16:00">04:00 PM</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={bookAppointment}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}