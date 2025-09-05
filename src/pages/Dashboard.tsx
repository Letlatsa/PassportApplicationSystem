import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, Package, Plus, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApplications } from '../contexts/ApplicationContext';
import ApplicationCard from '../components/dashboard/ApplicationCard';
import StatusTimeline from '../components/dashboard/StatusTimeline';

export default function Dashboard() {
  const { user } = useAuth();
  const { applications, loading, refreshApplications } = useApplications();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    refreshApplications();
  }, []);

  const filteredApplications = applications.filter(app =>
    app.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStats = () => {
    const stats = {
      total: applications.length,
      submitted: applications.filter(app => app.status === 'submitted').length,
      under_review: applications.filter(app => app.status === 'under_review').length,
      ready: applications.filter(app => app.status === 'ready_for_collection').length,
      collected: applications.filter(app => app.status === 'collected').length
    };
    return stats;
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.user_metadata?.first_name || user?.email}
        </h1>
        <p className="text-gray-600">
          Manage your passport applications and track their progress
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
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

        <div className="bg-white rounded-lg shadow p-6">
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

        <div className="bg-white rounded-lg shadow p-6">
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

        <div className="bg-white rounded-lg shadow p-6">
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
          <Link
            to="/apply"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Application
          </Link>

          <div className="relative w-full sm:w-auto sm:min-w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Applications</h2>
        
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Applications Found</h3>
            <p className="text-gray-600 mb-6">
              {applications.length === 0 
                ? "You haven't submitted any passport applications yet." 
                : "No applications match your search criteria."
              }
            </p>
            {applications.length === 0 && (
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
              <div key={application.id} className="bg-white rounded-lg shadow overflow-hidden">
                <ApplicationCard application={application} />
                <div className="border-t border-gray-200">
                  <StatusTimeline applicationId={application.id} currentStatus={application.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}