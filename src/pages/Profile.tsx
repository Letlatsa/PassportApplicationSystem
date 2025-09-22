import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApplications } from '../contexts/ApplicationContext';
import { UserCircle, Mail, Phone, MapPin, FileText } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { applications, loading } = useApplications();

  // Assuming the most recent application is the most relevant
  const latestApplication = applications?.[0];

  const getDistrict = () => {
    if (latestApplication?.address) {
      try {
        const addressObj = JSON.parse(latestApplication.address);
        return addressObj.district || 'Not available';
      } catch (error) {
        console.error("Failed to parse address:", error);
        return 'Not available';
      }
    }
    return 'Not available';
  };

  const getStatus = (status: string | undefined) => {
    if (!status) return 'No active application';
    return status.replace(/_/g, ' ').toUpperCase();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden">
        <div className="p-8">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <UserCircle className="h-20 w-20 text-gray-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.user_metadata?.first_name || ''} {user?.user_metadata?.last_name || ''}
              </h1>
              <p className="text-gray-600 mt-1">Your personal profile details.</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50/50 px-8 py-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500 flex items-center"><Mail className="w-4 h-4 mr-2" />Email Address</dt>
              <dd className="mt-1 text-sm text-gray-900 md:mt-0 md:col-span-2">{user?.email}</dd>
            </div>
            <div className="bg-white px-8 py-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500 flex items-center"><Phone className="w-4 h-4 mr-2" />Contact Number</dt>
              <dd className="mt-1 text-sm text-gray-900 md:mt-0 md:col-span-2">{latestApplication?.phone || 'Not available'}</dd>
            </div>
            <div className="bg-gray-50/50 px-8 py-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500 flex items-center"><MapPin className="w-4 h-4 mr-2" />District</dt>
              <dd className="mt-1 text-sm text-gray-900 md:mt-0 md:col-span-2">{getDistrict()}</dd>
            </div>
            <div className="bg-white px-8 py-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500 flex items-center"><FileText className="w-4 h-4 mr-2" />Application Status</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900 md:mt-0 md:col-span-2">{getStatus(latestApplication?.status)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
