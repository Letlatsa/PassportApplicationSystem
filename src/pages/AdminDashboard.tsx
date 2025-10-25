import { useState, useEffect } from 'react';
import { FileText, Users, MapPin, TrendingUp, Search, Filter, Plus, X, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/supabase';
import { sendNotificationEmail } from '../lib/notifications';
import { useNavigate } from 'react-router-dom';
import { DocumentPreview } from '../components/DocumentViewer';

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

type RawProfile = {
  id: string;
  user_id?: string;
  national_id?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  district?: string;
  created_at?: string;
};

export default function AdminDashboard() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate(); // Add this hook
  const [applications, setApplications] = useState<Application[]>([]);
  const [appointments, setAppointments] = useState<Array<{
    id: string;
    application_id: string;
    user_id: string;
    reference_number: string;
    date: string;
    time: string;
    created_at: string;
    passport_application?: { reference_number?: string; first_name?: string; last_name?: string; user_id?: string };
  }>>([]);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [applicationToReject, setApplicationToReject] = useState<string | null>(null);
  const [collectionPointName, setCollectionPointName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'applications' | 'officials' | 'appointments'>('applications');
  
  // Remove official modal and form state since we're redirecting
  //const [editingOfficial, setEditingOfficial] = useState<Official | null>(null);

  useEffect(() => {
    // Check admin status more thoroughly
    const adminEmails = ['admin@lesotho.gov', 'admin@gov.ls'];
    const isAdminUser = isAdmin || adminEmails.includes(user?.email || '') || user?.email?.includes('admin');
    
    if (!isAdminUser) return;
    fetchApplications();
    fetchAppointments();
    fetchOfficials();
  }, [isAdmin, user]);

  const fetchApplications = async () => {
    const { data } = await supabase
      .from('passport_applications')
      .select('*')
      .order('created_at', { ascending: false });

    setApplications(data || []);
    setLoading(false);
  };
  
  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('biometrics_appointments')
        .select(`
          id,
          application_id,
          user_id,
          reference_number,
          date,
          time,
          created_at,
          passport_applications (id, reference_number, first_name, last_name, user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((row: unknown) => {
        const r = row as Record<string, unknown>;
        const passportApp = (r['passport_applications'] ?? r['passport_application']) as Record<string, unknown> | null;
        return {
          id: typeof r['id'] === 'string' ? r['id'] : String(r['id'] ?? ''),
          application_id: typeof r['application_id'] === 'string' ? r['application_id'] : String(r['application_id'] ?? ''),
          user_id: typeof r['user_id'] === 'string' ? r['user_id'] : String(r['user_id'] ?? ''),
          reference_number: typeof r['reference_number'] === 'string' ? r['reference_number'] : String(r['reference_number'] ?? ''),
          date: typeof r['date'] === 'string' ? r['date'] : String(r['date'] ?? ''),
          time: typeof r['time'] === 'string' ? r['time'] : String(r['time'] ?? ''),
          created_at: typeof r['created_at'] === 'string' ? r['created_at'] : String(r['created_at'] ?? ''),
          passport_application: passportApp
            ? {
                reference_number: typeof passportApp['reference_number'] === 'string' ? passportApp['reference_number'] : undefined,
                first_name: typeof passportApp['first_name'] === 'string' ? passportApp['first_name'] : undefined,
                last_name: typeof passportApp['last_name'] === 'string' ? passportApp['last_name'] : undefined,
                user_id: typeof passportApp['user_id'] === 'string' ? passportApp['user_id'] : undefined,
              }
            : undefined,
        };
      });

      console.debug('fetchAppointments: success, rows:', mapped.length, { raw: data });
      setAppointments(mapped);
      setAppointmentsError(null);
    } catch (err: unknown) {
      let msg = String(err);
      if (err instanceof Error) msg = err.message;
      console.warn('Could not fetch appointments (table or RLS may not allow access):', err);
      setAppointments([]);
      setAppointmentsError(msg || 'Could not load appointments. Ensure the biometrics_appointments table exists and RLS policies allow admin access.');
    }
  };

  const fetchOfficials = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'staff')
      .order('created_at', { ascending: false });

    // Map profiles to officials format (provide safe defaults so types align)
    const mappedOfficials: Official[] = (data || []).map((profile: RawProfile) => {
      const first = (profile.first_name ?? '').trim();
      const last = (profile.last_name ?? '').trim();
      return {
        id: profile.id,
        user_id: profile.user_id ?? '',
        employee_id: profile.national_id ?? '',
        first_name: first,
        last_name: last,
        email: `${first.toLowerCase() || 'unknown'}.${last.toLowerCase() || 'user'}@gov.ls`,
        phone: profile.phone_number ?? '',
        district: profile.district ?? '',
        position: 'Passport Officer',
        is_active: true,
        created_at: profile.created_at ?? ''
      };
    });

    setOfficials(mappedOfficials);
  };

  // Remove handleCreateOfficial function

  // Remove handleUpdateOfficial function

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

  // Remove resetOfficialForm function

  // Remove openEditModal function

  // Add this function to handle navigation to OfficerRegister
  const handleAddOfficial = () => {
    navigate('/officerRegister');
  };

  const updateStatus = async (id: string, newStatus: string) => {
    if (newStatus === 'rejected') {
      setApplicationToReject(id);
      setShowRejectionModal(true);
      return;
    }

    const { error: updateError } = await supabase
      .from('passport_applications')
      .update({
        status: newStatus as Application['status'],
        updated_at: new Date().toISOString(),
        qr_code: newStatus === 'ready_for_collection' ? `QR-${id.slice(-8)}` : null
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating application status:', JSON.stringify(updateError, null, 2));
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorDiv.textContent = `Error updating status: ${updateError.message || 'Check console for details.'}`;
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Error: No authenticated user found for logging status update.');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorDiv.textContent = 'Could not find authenticated user to log status update.';
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
      return;
    }

    const { error: logError } = await supabase
      .from('application_status_updates')
      .insert([{ 
        application_id: id,
        status: newStatus,
        notes: `Status updated to ${newStatus}`,
        updated_by: user.id
      }]);

    if (logError) {
      console.error('Error logging status update:', JSON.stringify(logError, null, 2));
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorDiv.textContent = `Error logging status update: ${logError.message || 'Check console for details.'}`;
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
    } else {
      const application = applications.find(app => app.id === id);
      if (application) {
        await sendNotificationEmail(application, newStatus);
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

    const { error: updateError } = await supabase
      .from('passport_applications')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationToReject);

    if (updateError) {
      console.error('Error rejecting application:', JSON.stringify(updateError, null, 2));
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorDiv.textContent = `Error rejecting application: ${updateError.message || 'Check console for details.'}`;
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Error: No authenticated user found for logging rejection.');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorDiv.textContent = 'Could not find authenticated user to log rejection.';
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
      return;
    }

    const { error: logError } = await supabase
      .from('application_status_updates')
      .insert([{ 
        application_id: applicationToReject,
        status: 'rejected',
        notes: rejectionReason,
        updated_by: user.id
      }]);

    if (logError) {
      console.error('Error logging rejection:', JSON.stringify(logError, null, 2));
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
      errorDiv.textContent = `Error logging rejection: ${logError.message || 'Check console for details.'}`;
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
    } else {
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
      successDiv.textContent = 'Application rejected successfully';
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);

      const application = applications.find(app => app.id === applicationToReject);
      if (application) {
        await sendNotificationEmail(application, 'rejected');
      }

      fetchApplications();
      setShowRejectionModal(false);
      setRejectionReason('');
      setApplicationToReject(null);
    }
  };

  const fetchCollectionPointName = async (id: string) => {
    const { data } = await supabase
      .from('collection_points')
      .select('name')
      .eq('id', id)
      .single();
    
    if (data) {
      setCollectionPointName(data.name);
    }
  };

  const viewApplication = (application: Application) => {
    setSelectedApplication(application);
    if (application.collection_point_id) {
      fetchCollectionPointName(application.collection_point_id);
    }
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
      rejected: applications.filter(app => app.status === 'rejected').length,
      appointments: appointments.length
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

  // safe accessor for optional fields on Application rows (avoids TS errors)
  const getAppField = (app: Application | null, key: string): string | undefined => {
    if (!app) return undefined;
    const r = app as unknown as Record<string, unknown>;
    const v = r[key];
    return typeof v === 'string' ? v : undefined;
  };

  // More flexible accessor: tries multiple key names and nested shapes
  const findAppValue = (app: Application | null, candidates: string[]): string | undefined => {
    if (!app) return undefined;
    const r = app as unknown as Record<string, unknown>;
    for (const k of candidates) {
      const v = r[k];
      if (typeof v === 'string' && v.trim()) return v;
      if (typeof v === 'number') return String(v);
      if (Array.isArray(v) && v.length) return JSON.stringify(v);
      if (typeof v === 'object' && v !== null) {
        // if nested object contains a string value for a reasonable key, return first string
        const nested = v as Record<string, unknown>;
        for (const nk of Object.keys(nested)) {
          const nv = nested[nk];
          if (typeof nv === 'string' && nv.trim()) return nv;
        }
      }
    }

    // try a case-insensitive key match as a last resort
    const lower = Object.keys(r).find(k => candidates.some(c => k.toLowerCase().includes(c.toLowerCase())));
    if (lower) {
      const v = r[lower];
      if (typeof v === 'string') return v;
      if (typeof v === 'number') return String(v);
    }
    return undefined;
  };

  // Render uploaded documents/attachments for an application, handling a few shapes
  const getAppDocuments = (app: Application | null): Array<{ name?: string; url: string }> => {
    if (!app) return [];
    const r = app as unknown as Record<string, unknown>;
    const documents: Array<{ name?: string; url: string }> = [];

    // Check for specific document URL fields
    const documentFields = [
      { key: 'id_document_url', name: 'ID Document' },
      { key: 'birth_certificate_url', name: 'Birth Certificate' },
      { key: 'proof_of_address_url', name: 'Proof of Address' },
      { key: 'proof_of_payment_url', name: 'Proof of Payment' },
      { key: 'passport_photo_url', name: 'Passport Photo' }
    ];

    for (const field of documentFields) {
      const url = r[field.key];
      if (typeof url === 'string' && url.trim() && url.startsWith('http')) {
        documents.push({ name: field.name, url });
      }
    }

    // Fallback to legacy document handling
    if (documents.length === 0) {
      const candidateKeys = ['uploaded_documents', 'documents', 'attachments', 'files'];
      for (const key of candidateKeys) {
        const v = r[key];
        if (!v) continue;
        // if it's already an array
        if (Array.isArray(v)) {
          return v.map(item => {
            if (typeof item === 'string') return { url: item };
            const obj = item as Record<string, unknown>;
            return { name: typeof obj.name === 'string' ? obj.name : undefined, url: String(obj.url ?? obj.path ?? obj.file_url ?? obj.key ?? '') };
          }).filter(d => d.url);
        }
        // if it's a JSON string
        if (typeof v === 'string') {
          try {
            const parsed = JSON.parse(v);
            if (Array.isArray(parsed)) {
              return parsed.map(item => {
                if (typeof item === 'string') return { url: item };
                const obj = item as Record<string, unknown>;
                return { name: typeof obj.name === 'string' ? obj.name : undefined, url: String(obj.url ?? obj.path ?? obj.file_url ?? obj.key ?? '') };
              }).filter(d => d.url);
            }
          } catch {
            // not JSON — if the string looks like a URL, use it
            if (v.startsWith('http') || v.startsWith('/')) return [{ url: v }];
          }
        }
        // if it's an object with keys pointing to files
        if (typeof v === 'object' && v !== null) {
          const obj = v as Record<string, unknown>;
          const urls: Array<{ name?: string; url: string }> = [];
          for (const k of Object.keys(obj)) {
            const val = obj[k];
            if (typeof val === 'string' && (val.startsWith('http') || val.startsWith('/'))) {
              urls.push({ name: k, url: val });
            }
          }
          if (urls.length) return urls;
        }
      }
    }

    return documents;
  };

  // Check admin status more thoroughly
  const adminEmails = ['admin@lesotho.gov', 'admin@gov.ls'];
  const isAdminUser = isAdmin || adminEmails.includes(user?.email || '') || user?.email?.includes('admin');
  
  if (!isAdminUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800">Access Denied</h2>
          <p className="text-red-600 mt-2">You don't have permission to access this page. Please log in with an admin account.</p>
          <p className="text-red-500 text-sm mt-1">Current user: {user?.email}</p>
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
              onClick={() => setActiveTab('appointments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${ 
                activeTab === 'appointments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4 inline-block mr-2" /> Appointments
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
                  <option value="approved">Approved</option>
                  <option value="appointment_booked">Appointment Booked</option>
                  <option value="await_printing">Await Printing</option>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((application) => {
                    const appt = appointments.find(a => a.application_id === application.id);

                    return (
                      <tr key={application.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{application.first_name} {application.last_name}</div>
                            <div className="text-sm text-gray-500">{application.email}</div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">{application.reference_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {appt ? (
                            <div className="text-sm text-gray-700">{appt.date ? new Date(appt.date).toLocaleDateString() : '-'} {appt.time ?? ''}</div>
                          ) : (
                            <div className="text-sm text-gray-400">No appointment</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{findAppValue(application, ['district', 'area', 'region', 'ward']) ?? '-'}</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              application.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                              application.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                              application.status === 'approved' ? 'bg-green-100 text-green-800' :
                              application.status === 'ready_for_collection' ? 'bg-purple-100 text-purple-800' :
                              application.status === 'collected' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
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
                              <option value="approved">Approved</option>
                              <option value="appointment_booked">Appointment Booked</option>
                              <option value="await_printing">Await Printing</option>
                              <option value="ready_for_collection">Ready for Collection</option>
                              <option value="collected">Collected</option>
                              <option value="rejected">Rejected</option>
                            </select>
                            {application.status === 'appointment_booked' && (
                              <button
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setShowBiometricsModal(true);
                                }}
                                className="text-purple-600 hover:text-purple-800 text-xs font-medium ml-2"
                              >
                                Biometrics
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'appointments' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">Biometrics Appointments</h2>
            <p className="text-sm text-gray-600 mt-1">List of all booked biometrics appointments</p>
            <p className="text-xs text-gray-400 mt-2">Debug: fetched {appointments.length} rows. {appointmentsError ? `Error: ${appointmentsError}` : ''}</p>
          </div>
          <div className="p-6">
            {appointmentsError ? (
              <div className="text-sm text-red-600">{appointmentsError}</div>
            ) : appointments.length === 0 ? (
              <div className="text-sm text-gray-500">No appointments found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Reference</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Applicant</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Time</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Booked At</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.map((a) => (
                      <tr key={a.id}>
                        <td className="px-4 py-2 text-sm font-mono">
                          {a.reference_number || a.passport_application?.reference_number || '-'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {a.passport_application
                            ? `${a.passport_application.first_name ?? ''} ${a.passport_application.last_name ?? ''}`.trim()
                            : (a.user_id ?? '-')}
                        </td>
                        <td className="px-4 py-2 text-sm">{a.date ? new Date(a.date).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-2 text-sm">{a.time ?? '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{a.created_at ? new Date(a.created_at).toLocaleString() : '-'}</td>
                        <td className="px-4 py-2 text-sm">
                          <button
                            onClick={() => { /* future: navigate to application or mark attended */ }}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'officials' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Officials Management</h2>
              <button
                onClick={handleAddOfficial} // Updated to use navigation function
                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-all"
              >
                <Plus className="w-4 h-4 inline-block mr-2" /> Add Official
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">Manage officials assigned to process passport applications</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Officials</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {officials.map((official) => (
                    <tr key={official.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{official.first_name} {official.last_name}</div>
                        <div className="text-sm text-gray-500">{official.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{official.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{official.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{official.district}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            official.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {official.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {/* Remove Edit button since we're redirecting to separate page */}
                          <button
                            onClick={() => handleDeleteOfficial(official.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
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
        </div>
      )}

      {/* Application Details Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Application Details</h3>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Reference Number</p>
                  <p className="text-lg font-semibold">{selectedApplication.reference_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedApplication.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                      selectedApplication.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                      selectedApplication.status === 'approved' ? 'bg-green-100 text-green-800' :
                      selectedApplication.status === 'ready_for_collection' ? 'bg-purple-100 text-purple-800' :
                      selectedApplication.status === 'collected' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedApplication.status.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Applicant Name</p>
                  <p className="text-lg font-semibold">{selectedApplication.first_name} {selectedApplication.last_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="text-lg font-semibold">{new Date(selectedApplication.date_of_birth).toLocaleDateString()}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-lg font-semibold">{selectedApplication.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-lg font-semibold">{selectedApplication.phone}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">District</p>
                  <p className="text-lg font-semibold">{collectionPointName ?? getAppField(selectedApplication, 'district') ?? '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-lg font-semibold">{getAppField(selectedApplication, 'address') ?? '-'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Collection Point</p>
                  <p className="text-lg font-semibold">{collectionPointName ?? '-'}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-lg font-semibold">{getAppField(selectedApplication, 'notes') ?? '-'}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Uploaded Documents</p>
                  <div className="mt-2">
                    <DocumentPreview documents={getAppDocuments(selectedApplication)} />
                  </div>
                </div>
              </div>

              <div className="mt-4">
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
                {appointments.some(apt => apt.application_id === selectedApplication.id) && selectedApplication.status === 'appointment_booked' && (
                  <button
                    onClick={() => {
                      setShowApplicationModal(false);
                      setShowBiometricsModal(true);
                    }}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700 transition-all mt-2"
                  >
                    Capture Biometrics
                  </button>
                )}
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

      {/* Remove Official Form Modal */}

      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Rejection Reason</h3>
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="rejection_reason">
                  Reason for Rejection
                </label>
                <textarea
                  id="rejection_reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow hover:bg-gray-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejection}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition-all"
                >
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}