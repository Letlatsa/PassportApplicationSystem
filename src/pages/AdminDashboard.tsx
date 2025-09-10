import React, { useState, useEffect } from 'react';
import { FileText, Users, MapPin, TrendingUp, Search, Filter, Plus, Edit, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/supabase';

type Application = Database['public']['Tables']['passport_applications']['Row'];

interface Official {
  id: string;
  user_id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  district: string;
  position: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [applicationToReject, setApplicationToReject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'applications' | 'officials'>('applications');
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [editingOfficial, setEditingOfficial] = useState<Official | null>(null);
  const [officialFormData, setOfficialFormData] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    district: '',
    position: 'Passport Officer',
    password: ''
  });

  useEffect(() => {
    if (!isAdmin) return;
    fetchApplications();
    fetchOfficials();
  }, [isAdmin]);

  const fetchApplications = async () => {
    const { data } = await supabase
      .from('passport_applications')
      .select('*')
      .order('created_at', { ascending: false });

    setApplications(data || []);
    setLoading(false);
  };

  const fetchOfficials = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'staff')
      .order('created_at', { ascending: false });

    // Map profiles to officials format
    const mappedOfficials = (data || []).map(profile => ({
      id: profile.id,
      user_id: profile.user_id,
      employee_id: profile.national_id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: `${profile.first_name.toLowerCase()}.${profile.last_name.toLowerCase()}@gov.ls`,
      phone: profile.phone_number,
      district: profile.district,
      position: 'Passport Officer',
      is_active: true,
      created_at: profile.created_at
    }));
    
    setOfficials(mappedOfficials);
  };

  const districts = [
    'Butha-Buthe', 'Leribe', 'Berea', 'Maseru', 'Mafeteng', 
    'Mohale\'s Hoek', 'Qacha\'s Nek', 'Quthing', 'Mokhotlong', 'Thaba-Tseka'
  ];

  const handleCreateOfficial = async () => {
    if (!officialFormData.employee_id || !officialFormData.first_name || !officialFormData.last_name || 
        !officialFormData.email || !officialFormData.phone || !officialFormData.district || !officialFormData.password) {
      console.error('Please fill in all required fields');
      // Use a more user-friendly notification instead of alert
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorDiv.textContent = 'Please fill in all required fields';
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
      return;
    }

    try {
      // Create user account first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: officialFormData.email,
        password: officialFormData.password,
        options: {
          data: {
            first_name: officialFormData.first_name,
            last_name: officialFormData.last_name,
            role: 'staff'
          }
        }
      });

      if (authError) throw authError;

      // Create profile record
      const { error: officialError } = await supabase
        .from('profiles')
        .insert([{
          user_id: authData.user?.id || crypto.randomUUID(),
          first_name: officialFormData.first_name,
          last_name: officialFormData.last_name,
          national_id: officialFormData.employee_id,
          phone_number: officialFormData.phone,
          date_of_birth: '1990-01-01', // Mock date
          address: officialFormData.district,
          district: officialFormData.district,
          role: 'staff'
        }]);

      if (officialError) throw officialError;

      // Success notification
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
      successDiv.textContent = 'Official account created successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);
      
      setShowOfficialModal(false);
      resetOfficialForm();
      fetchOfficials();
    } catch (error: any) {
      console.error('Error creating official:', error);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorDiv.textContent = `Error creating official: ${error.message}`;
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
    }
  };

  const handleUpdateOfficial = async () => {
    if (!editingOfficial) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        national_id: officialFormData.employee_id,
        first_name: officialFormData.first_name,
        last_name: officialFormData.last_name,
        phone_number: officialFormData.phone,
        district: officialFormData.district,
        address: officialFormData.district
      })
      .eq('id', editingOfficial.id);

    if (!error) {
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
      successDiv.textContent = 'Official updated successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);
      
      setShowOfficialModal(false);
      setEditingOfficial(null);
      resetOfficialForm();
      fetchOfficials();
    } else {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorDiv.textContent = 'Error updating official';
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
    }
  };

  const handleDeleteOfficial = async (officialId: string) => {
    if (!window.confirm('Are you sure you want to delete this official?')) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', officialId);

    if (!error) {
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
      successDiv.textContent = 'Official deleted successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);
      fetchOfficials();
    } else {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorDiv.textContent = 'Error deleting official';
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
    }
  };

  const resetOfficialForm = () => {
    setOfficialFormData({
      employee_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      district: '',
      position: 'Passport Officer',
      password: ''
    });
  };

  const openEditModal = (official: Official) => {
    setEditingOfficial(official);
    setOfficialFormData({
      employee_id: official.employee_id,
      first_name: official.first_name,
      last_name: official.last_name,
      email: official.email,
      phone: official.phone,
      district: official.district,
      position: official.position,
      password: ''
    });
    setShowOfficialModal(true);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    if (newStatus === 'rejected') {
      setApplicationToReject(id);
      setShowRejectionModal(true);
      return;
    }

    const { error } = await supabase
      .from('passport_applications')
      .update({ 
        status: newStatus as any,
        updated_at: new Date().toISOString(),
        qr_code: newStatus === 'ready_for_collection' ? `QR-${id.slice(-8)}` : null
      })
      .eq('id', id);

    if (!error) {
      await supabase
        .from('application_status_updates')
        .insert([{
          application_id: id,
          status: newStatus,
          notes: `Status updated to ${newStatus}`,
          updated_by: 'admin'
        }]);

      // Send approval email if approved
      if (newStatus === 'approved') {
        const application = applications.find(app => app.id === id);
        if (application) {
          await sendApprovalEmail(application);
        }
      }

      fetchApplications();
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

    const { error } = await supabase
      .from('passport_applications')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationToReject);

    if (!error) {
      await supabase
        .from('application_status_updates')
        .insert([{
          application_id: applicationToReject,
          status: 'rejected',
          notes: rejectionReason,
          updated_by: 'admin'
        }]);

      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
      successDiv.textContent = 'Application rejected successfully';
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);
      fetchApplications();
      setShowRejectionModal(false);
      setRejectionReason('');
      setApplicationToReject(null);
    } else {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorDiv.textContent = 'Error rejecting application';
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
    }
  };

  const sendApprovalEmail = async (application: Application) => {
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-approval-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: application.email,
          name: `${application.first_name} ${application.last_name}`,
          reference_number: application.reference_number
        })
      });
    } catch (error) {
      console.error('Error sending approval email:', error);
    }
  };

  const viewApplication = (application: Application) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  const getStats = () => {
    return {
      total: applications.length,
      submitted: applications.filter(app => app.status === 'submitted').length,
      under_review: applications.filter(app => app.status === 'under_review').length,
      approved: applications.filter(app => app.status === 'approved').length,
      ready: applications.filter(app => app.status === 'ready_for_collection').length,
      collected: applications.filter(app => app.status === 'collected').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    };
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = getStats();

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800">Access Denied</h2>
          <p className="text-red-600 mt-2">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          Manage passport applications and monitor system performance
        </p>
        
        {/* Tab Navigation */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Applications
            </button>
            <button
              onClick={() => setActiveTab('officials')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'officials'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Officials Management
            </button>
          </nav>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{stats.submitted + stats.under_review}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <MapPin className="w-6 h-6 text-green-600" />
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
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.collected}</p>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'applications' && (
        <>
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
                        {new Date(application.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewApplication(application)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            View
                          </button>
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
          </div>
        </>
      )}

      {activeTab === 'officials' && (
        <>
          {/* Officials Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Officials Management</h2>
            <button
              onClick={() => {
                resetOfficialForm();
                setEditingOfficial(null);
                setShowOfficialModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Official
            </button>
          </div>

          {/* Officials Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Official
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      District
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {officials.map((official) => (
                    <tr key={official.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {official.first_name} {official.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{official.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{official.employee_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{official.district}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{official.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          official.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {official.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(official)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteOfficial(official.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium flex items-center"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Official Modal */}
      {showOfficialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingOfficial ? 'Edit Official' : 'Add New Official'}
              </h3>
              <button
                onClick={() => setShowOfficialModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  id="employee_id"
                  name="employee_id"
                  type="text"
                  value={officialFormData.employee_id}
                  onChange={(e) => setOfficialFormData({...officialFormData, employee_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={officialFormData.first_name}
                  onChange={(e) => setOfficialFormData({...officialFormData, first_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={officialFormData.last_name}
                  onChange={(e) => setOfficialFormData({...officialFormData, last_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={officialFormData.email}
                  onChange={(e) => setOfficialFormData({...officialFormData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={officialFormData.phone}
                  onChange={(e) => setOfficialFormData({...officialFormData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <select
                  id="district"
                  name="district"
                  value={officialFormData.district}
                  onChange={(e) => setOfficialFormData({...officialFormData, district: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select District</option>
                  {districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  id="position"
                  name="position"
                  type="text"
                  value={officialFormData.position}
                  onChange={(e) => setOfficialFormData({...officialFormData, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {!editingOfficial && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={officialFormData.password}
                    onChange={(e) => setOfficialFormData({...officialFormData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowOfficialModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingOfficial ? handleUpdateOfficial : handleCreateOfficial}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                {editingOfficial ? 'Update Official' : 'Create Official'}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredApplications.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Applications Found</h3>
          <p className="text-gray-600">
            No applications match your current search and filter criteria.
          </p>
        </div>
      )}

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
            
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedApplication.first_name} {selectedApplication.last_name}</div>
                  <div><span className="font-medium">Date of Birth:</span> {new Date(selectedApplication.date_of_birth).toLocaleDateString()}</div>
                  <div><span className="font-medium">Place of Birth:</span> {selectedApplication.place_of_birth}</div>
                  <div><span className="font-medium">Nationality:</span> {selectedApplication.nationality}</div>
                  <div><span className="font-medium">Email:</span> {selectedApplication.email}</div>
                  <div><span className="font-medium">Phone:</span> {selectedApplication.phone}</div>
                  <div className="col-span-2"><span className="font-medium">Address:</span> {selectedApplication.address}</div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Emergency Contact</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedApplication.emergency_contact_name}</div>
                  <div><span className="font-medium">Phone:</span> {selectedApplication.emergency_contact_phone}</div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Uploaded Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedApplication.id_document_url && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <p className="font-medium text-sm text-gray-900 mb-2">National ID / Birth Certificate</p>
                      <div className="bg-blue-50 p-2 rounded text-center">
                        <FileText className="w-8 h-8 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs text-blue-600">Document Uploaded</p>
                      </div>
                    </div>
                  )}
                  {selectedApplication.proof_of_address_url && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <p className="font-medium text-sm text-gray-900 mb-2">Village Chief Letter</p>
                      <div className="bg-green-50 p-2 rounded text-center">
                        <FileText className="w-8 h-8 text-green-600 mx-auto mb-1" />
                        <p className="text-xs text-green-600">Document Uploaded</p>
                      </div>
                    </div>
                  )}
                  {selectedApplication.proof_of_payment_url && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <p className="font-medium text-sm text-gray-900 mb-2">Proof of Payment</p>
                      <div className="bg-purple-50 p-2 rounded text-center">
                        <FileText className="w-8 h-8 text-purple-600 mx-auto mb-1" />
                        <p className="text-xs text-purple-600">Payment Verified</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Actions */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Update Status</h4>
                <div className="flex space-x-3">
                  {selectedApplication.status === 'submitted' && (
                    <button
                      onClick={() => {
                        updateStatus(selectedApplication.id, 'under_review');
                        setShowApplicationModal(false);
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Start Review
                    </button>
                  )}
                  {selectedApplication.status === 'under_review' && (
                    <>
                      <button
                        onClick={() => {
                          updateStatus(selectedApplication.id, 'approved');
                          setShowApplicationModal(false);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setShowApplicationModal(false);
                          updateStatus(selectedApplication.id, 'rejected');
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
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
              id="rejection_reason"
              name="rejection_reason"
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