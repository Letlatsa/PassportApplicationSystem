import React, { useState, useEffect } from 'react';
import { FileText, Users, Search, Filter, Calendar, Camera, Fingerprint, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { sendNotificationEmail } from '../lib/notifications';
import type { Database } from '../lib/supabase';

type Application = Database['public']['Tables']['passport_applications']['Row'] & {
  collection_point_name?: string;
  collection_point_district?: string;
};

interface BiometricsAppointment {
  id: string;
  application_id: string;
  date: string; // Changed from appointment_date to date
  time: string; // Changed from appointment_time to time
  status: string;
  notes?: string;
  reference_number: string;
  created_at: string;
  passport_applications?: {
    first_name: string;
    last_name: string;
    collection_point_id: string;
  };
}

interface Official {
  id: string;
  first_name: string;
  last_name: string;
  district: string;
  employee_id: string;
}

export default function OfficialDashboard() {
  const { user } = useAuth();
  const [official, setOfficial] = useState<Official | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appointments, setAppointments] = useState<BiometricsAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showBiometricsModal, setShowBiometricsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [applicationToReject, setApplicationToReject] = useState<string | null>(null);
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null);
  const [fingerprintData, setFingerprintData] = useState('');

  useEffect(() => {
    fetchOfficialData();
  }, [user]);

  useEffect(() => {
    if (official) {
      fetchApplications();
      fetchAppointments();
    }
  }, [official]);

  const fetchOfficialData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', 'staff')
        .single();

      if (error) {
        console.error("Error fetching official data:", error);
      } else if (data) {
        setOfficial({
          id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          district: data.district,
          employee_id: data.national_id
        });
      }
    } catch (error) {
      console.error("Error in fetchOfficialData:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    if (!official) return;

    try {
      console.log("Fetching applications for official district:", official.district);

      // Get the first word of the official's district for flexible matching
      const officialDistrictFirstWord = official.district.split(' ')[0].toLowerCase();
      console.log("Using first word for matching:", officialDistrictFirstWord);

      // First, get all collection points to understand the structure
      const { data: allCollectionPoints, error: cpError } = await supabase
        .from('collection_points')
        .select('*');

      if (cpError) {
        console.error("Error fetching collection points:", cpError);
        return;
      }

      console.log("All collection points:", allCollectionPoints);

      // Find collection points that match the official's district
      const matchingCollectionPoints = allCollectionPoints.filter(cp => {
        const cpDistrict = cp.district?.toLowerCase() || '';
        const cpName = cp.name?.toLowerCase() || '';
        
        return (
          cpDistrict === official.district.toLowerCase() ||
          cpName === official.district.toLowerCase() ||
          cpDistrict.includes(officialDistrictFirstWord) ||
          cpName.includes(officialDistrictFirstWord) ||
          cpDistrict.includes(official.district.toLowerCase()) ||
          cpName.includes(official.district.toLowerCase())
        );
      });

      console.log("Matching collection points:", matchingCollectionPoints);

      if (matchingCollectionPoints.length === 0) {
        console.log("No matching collection points found for district:", official.district);
        setApplications([]);
        return;
      }

      const collectionPointIds = matchingCollectionPoints.map(cp => cp.id);

      // Get applications for those collection points
      const { data: applicationsData, error: appsError } = await supabase
        .from('passport_applications')
        .select('*')
        .in('collection_point_id', collectionPointIds)
        .order('created_at', { ascending: false });

      if (appsError) {
        console.error("Error fetching applications:", appsError);
        return;
      }

      // Enrich applications with collection point data
      const enrichedApplications = (applicationsData || []).map(app => {
        const collectionPoint = matchingCollectionPoints.find(cp => cp.id === app.collection_point_id);
        return {
          ...app,
          collection_point_name: collectionPoint?.name || 'Unknown',
          collection_point_district: collectionPoint?.district || 'Unknown'
        };
      });

      console.log("Fetched and enriched applications:", enrichedApplications);
      console.log(`Filtered applications: ${enrichedApplications.length} out of ${applicationsData?.length}`);

      setApplications(enrichedApplications);
    } catch (error) {
      console.error("Error in fetchApplications:", error);
    }
  };

  const fetchAppointments = async () => {
    if (!official) return;

    try {
      console.log("Fetching appointments for official district:", official.district);

      // Get the first word of the official's district for flexible matching
      const officialDistrictFirstWord = official.district.split(' ')[0].toLowerCase();

      // First, get all collection points
      const { data: allCollectionPoints, error: cpError } = await supabase
        .from('collection_points')
        .select('*');

      if (cpError) {
        console.error("Error fetching collection points:", cpError);
        return;
      }

      // Find collection points that match the official's district
      const matchingCollectionPoints = allCollectionPoints.filter(cp => {
        const cpDistrict = cp.district?.toLowerCase() || '';
        const cpName = cp.name?.toLowerCase() || '';
        
        return (
          cpDistrict === official.district.toLowerCase() ||
          cpName === official.district.toLowerCase() ||
          cpDistrict.includes(officialDistrictFirstWord) ||
          cpName.includes(officialDistrictFirstWord) ||
          cpDistrict.includes(official.district.toLowerCase()) ||
          cpName.includes(official.district.toLowerCase())
        );
      });

      if (matchingCollectionPoints.length === 0) {
        console.log("No matching collection points found for appointments");
        setAppointments([]);
        return;
      }

      const collectionPointIds = matchingCollectionPoints.map(cp => cp.id);

      // Get applications for those collection points
      const { data: applicationsData, error: appsError } = await supabase
        .from('passport_applications')
        .select('id, first_name, last_name, collection_point_id')
        .in('collection_point_id', collectionPointIds);

      if (appsError) {
        console.error("Error fetching applications for appointments:", appsError);
        return;
      }

      if (!applicationsData || applicationsData.length === 0) {
        setAppointments([]);
        return;
      }

      const applicationIds = applicationsData.map(app => app.id);

      // Get appointments for those applications - FIXED COLUMN NAMES
      const { data: appointmentsData, error: aptError } = await supabase
        .from('biometrics_appointments')
        .select('*')
        .in('application_id', applicationIds)
        .order('date', { ascending: true }); // Changed from appointment_date to date

      if (aptError) {
        console.error("Error fetching appointments:", aptError);
        return;
      }

      // Enrich appointments with application data
      const enrichedAppointments = (appointmentsData || []).map(apt => {
        const application = applicationsData.find(app => app.id === apt.application_id);
        return {
          ...apt,
          passport_applications: application ? {
            first_name: application.first_name,
            last_name: application.last_name,
            collection_point_id: application.collection_point_id
          } : undefined
        };
      });

      console.log("Fetched appointments:", enrichedAppointments);
      setAppointments(enrichedAppointments);
    } catch (error) {
      console.error("Error in fetchAppointments:", error);
    }
  };

  // Rest of the functions remain the same (updateStatus, handleRejection, handleBiometricsCapture, etc.)
  const updateStatus = async (id: string, newStatus: string) => {
    if (newStatus === 'rejected') {
      setApplicationToReject(id);
      setShowRejectionModal(true);
      return;
    }

    try {
      const { error } = await supabase
        .from('passport_applications')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (!error) {
        await supabase
          .from('application_status_updates')
          .insert([{
            application_id: id,
            previous_status: applications.find(app => app.id === id)?.status,
            new_status: newStatus,
            notes: `Status updated to ${newStatus} by ${official?.first_name} ${official?.last_name}`,
            updated_by: user?.id
          }]);

        fetchApplications();

        // Send notification email to applicant
        const application = applications.find(app => app.id === id);
        if (application) {
          try {
            await sendNotificationEmail(application, newStatus);
          } catch (emailError) {
            console.error('Failed to send notification email:', emailError);
            // Don't fail the status update if email fails
          }
        }

        // Show success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
        successDiv.textContent = 'Status updated successfully';
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
      } else {
        throw error;
      }
    } catch (error) {
      console.error("Error updating status:", error);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorDiv.textContent = 'Error updating status';
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
    }
  };

  const handleRejection = async () => {
    if (!applicationToReject || !rejectionReason.trim()) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorDiv.textContent = 'Please provide a reason for rejection';
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
      return;
    }

    try {
      const { error } = await supabase
        .from('passport_applications')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationToReject);

      if (!error) {
        await supabase
          .from('application_status_updates')
          .insert([{
            application_id: applicationToReject,
            previous_status: applications.find(app => app.id === applicationToReject)?.status,
            new_status: 'rejected',
            notes: rejectionReason,
            updated_by: user?.id
          }]);

        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
        successDiv.textContent = 'Application rejected successfully';
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
        
        // Send notification email to applicant
        const application = applications.find(app => app.id === applicationToReject);
        if (application) {
          try {
            await sendNotificationEmail(application, 'rejected');
          } catch (emailError) {
            console.error('Failed to send rejection notification email:', emailError);
            // Don't fail the rejection if email fails
          }
        }

        fetchApplications();
        setShowRejectionModal(false);
        setRejectionReason('');
        setApplicationToReject(null);
      } else {
        throw error;
      }
    } catch (error) {
      console.error("Error rejecting application:", error);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorDiv.textContent = 'Error rejecting application';
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
    }
  };

  const handleBiometricsCapture = async () => {
    if (!selectedApplication || !passportPhoto) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorDiv.textContent = 'Please upload passport photo';
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
      return;
    }

    try {
      // In a real app, upload photo to Supabase Storage
      const photoUrl = `passport_photos/${selectedApplication.id}_${Date.now()}.jpg`;

      const { error } = await supabase
        .from('biometrics_data')
        .insert([{
          application_id: selectedApplication.id,
          passport_photo_url: photoUrl,
          fingerprint_data: fingerprintData ? JSON.parse(fingerprintData) : null,
          captured_by: official?.id,
          verified: true
        }]);

      if (!error) {
        // Update application status to ready for collection
        await updateStatus(selectedApplication.id, 'ready_for_collection');
        
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
        successDiv.textContent = 'Biometrics captured successfully!';
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
        
        setShowBiometricsModal(false);
        setPassportPhoto(null);
        setFingerprintData('');
      } else {
        throw error;
      }
    } catch (error) {
      console.error("Error capturing biometrics:", error);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorDiv.textContent = 'Error capturing biometrics';
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Debug info
  useEffect(() => {
    if (official) {
      console.log("Current official:", official);
      console.log("Applications count:", applications.length);
      console.log("Appointments count:", appointments.length);
    }
  }, [official, applications, appointments]);

  // Rest of the JSX remains exactly the same...
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!official) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800">Access Denied</h2>
          <p className="text-red-600 mt-2">You are not registered as a passport official.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Official Dashboard</h1>
        <p className="text-gray-600">
          Welcome, {official.first_name} {official.last_name} - {official.district} District
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Showing applications from {official.district} district ({applications.length} applications found)
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Today's Appointments</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(apt => apt.date === new Date().toISOString().split('T')[0]).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(app => ['submitted', 'under_review'].includes(app.status)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by reference number, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="ready_for_collection">Ready for Collection</option>
              <option value="collected">Collected</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collection Point
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {application.first_name} {application.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{application.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">{application.reference_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {application.collection_point_name || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {application.collection_point_district || 'Unknown district'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      application.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                      application.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                      application.status === 'approved' ? 'bg-green-100 text-green-800' :
                      application.status === 'ready_for_collection' ? 'bg-purple-100 text-purple-800' :
                      application.status === 'collected' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {application.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(application.created_at), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedApplication(application);
                          setShowApplicationModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        View
                      </button>
                      {application.status === 'approved' && (
                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowBiometricsModal(true);
                          }}
                          className="text-green-600 hover:text-green-800 text-xs font-medium"
                        >
                          Biometrics
                        </button>
                      )}
                      <select
                        value={application.status}
                        onChange={(e) => updateStatus(application.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="ready_for_collection">Ready for Collection</option>
                        <option value="collected">Collected</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Found</h3>
            <p className="text-gray-600">
              {applications.length === 0
                ? `No applications found for ${official.district} district.`
                : "No applications match your search criteria."
              }
            </p>
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Application Details - {selectedApplication.reference_number}
                </h3>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Name:</span> {selectedApplication.first_name} {selectedApplication.last_name}</div>
                <div><span className="font-medium">Email:</span> {selectedApplication.email}</div>
                <div><span className="font-medium">Phone:</span> {selectedApplication.phone}</div>
                <div><span className="font-medium">Status:</span> {selectedApplication.status}</div>
                <div><span className="font-medium">Collection Point:</span> {selectedApplication.collection_point_name || 'Unknown'}</div>
                <div><span className="font-medium">District:</span> {selectedApplication.collection_point_district || 'Unknown'}</div>
              </div>
              
              {selectedApplication.rejection_reason && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <span className="font-medium">Rejection Reason:</span> {selectedApplication.rejection_reason}
                  </p>
                </div>
              )}

              <div className="mt-6 border-t pt-6">
                <button
                  onClick={() => updateStatus(selectedApplication.id, 'approved')}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition-all"
                >
                  Approve Application
                </button>
                <button
                  onClick={() => updateStatus(selectedApplication.id, 'rejected')}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition-all mt-2"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow hover:bg-gray-400 transition-all mt-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Biometrics Capture Modal */}
      {showBiometricsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Capture Biometrics</h3>
              <button
                onClick={() => setShowBiometricsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  Passport Photo
                </h4>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPassportPhoto(e.target.files?.[0] || null)}
                    className="hidden"
                    id="passport-photo"
                  />
                  <label htmlFor="passport-photo" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm font-medium text-gray-600">
                      {passportPhoto ? passportPhoto.name : 'Upload Passport Photo'}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Fingerprint className="w-5 h-5 mr-2" />
                  Fingerprint Data
                </h4>
                <textarea
                  id="fingerprint_data"
                  name="fingerprint_data"
                  value={fingerprintData}
                  onChange={(e) => setFingerprintData(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Fingerprint data (JSON format)"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBiometricsModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBiometricsCapture}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Save Biometrics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Application</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this application:</p>
            <textarea
              id="rejection_reason_official"
              name="rejection_reason_official"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                  setApplicationToReject(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejection}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}