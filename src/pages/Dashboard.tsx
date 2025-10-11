import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, Package, Plus, Search, Calendar, AlertCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApplications } from '../contexts/ApplicationContext';
import { supabase } from '../lib/supabase';
import ApplicationCard from '../components/dashboard/ApplicationCard';
import StatusTimeline from '../components/dashboard/StatusTimeline';
import type { Database } from '../lib/supabase';

type Application = Database['public']['Tables']['passport_applications']['Row'];
type BiometricsAppointment = Database['public']['Tables']['biometrics_appointments']['Row'];

export default function Dashboard() {
  const { user } = useAuth();
  const { applications, loading, refreshApplications } = useApplications();
  const adminEmails = ['admin@lesotho.gov', 'admin@gov.ls'];
  const isAdminUser = Boolean(
    user &&
    user.email &&
    (adminEmails.includes(user.email) || user.email.includes('admin'))
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    reference_number: ''
  });
  const [isBooking, setIsBooking] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState<BiometricsAppointment[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  // Added state for rejection modal
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    refreshApplications();
    loadExistingAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load all existing appointments to check for conflicts
  const loadExistingAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('biometrics_appointments')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0]);

      if (!error && data) {
        setExistingAppointments(data);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  // Function to check if a date is weekend
  const isWeekend = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  // Function to get available time slots for selected date
  const getAvailableTimeSlots = (selectedDate: string) => {
    const allTimeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    
    if (!selectedDate) return allTimeSlots;

    // Get appointments for the selected date
    const appointmentsOnDate = existingAppointments.filter(
      appointment => appointment.date === selectedDate
    );

    // Get booked time slots
    const bookedTimeSlots = appointmentsOnDate.map(appointment => appointment.time);

    // Filter out booked time slots
    const availableSlots = allTimeSlots.filter(slot => !bookedTimeSlots.includes(slot));
    
    return availableSlots;
  };

  // Update available time slots when date changes
  useEffect(() => {
    if (appointmentData.date) {
      const slots = getAvailableTimeSlots(appointmentData.date);
      setAvailableTimeSlots(slots);
      
      // If current selected time is not available, clear it
      if (appointmentData.time && !slots.includes(appointmentData.time)) {
        setAppointmentData(prev => ({ ...prev, time: '' }));
      }
    } else {
      setAvailableTimeSlots(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']);
    }
  }, [appointmentData.date, existingAppointments]);

  const hasActiveApplication = applications.some(app =>
    ['submitted', 'under_review', 'approved', 'appointment_booked'].includes(app.status)
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

  // Function to handle opening appointment modal with prefilled data
  const handleOpenAppointmentModal = async (application: Application) => {
    setSelectedApplication(application);
    setAppointmentData({
      date: '',
      time: '',
      reference_number: application.reference_number
    });
    
    // Refresh appointments data when opening modal
    await loadExistingAppointments();
    setShowAppointmentModal(true);
  };

  // Function to handle closing modal
  const handleCloseModal = () => {
    setShowAppointmentModal(false);
    // Only reset date and time, keep reference number for next time
    setAppointmentData(prev => ({
      ...prev,
      date: '',
      time: ''
    }));
    setAvailableTimeSlots(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']);
  };

  // Function to handle date change with weekend validation
  const handleDateChange = (date: string) => {
    if (date && isWeekend(date)) {
      alert('Appointments are not available on weekends. Please select a weekday (Monday to Friday).');
      return;
    }
    setAppointmentData(prev => ({ ...prev, date, time: '' }));
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

  // Check if selected date is weekend
  if (isWeekend(appointmentData.date)) {
    alert('Appointments are not available on weekends. Please select a weekday.');
    return;
  }

  // Check if time slot is still available (double-check)
  const isTimeSlotAvailable = getAvailableTimeSlots(appointmentData.date).includes(appointmentData.time);
  if (!isTimeSlotAvailable) {
    alert('This time slot is no longer available. Please select another time.');
    await loadExistingAppointments(); // Refresh appointments
    return;
  }

  // FIXED: Only prevent multiple appointments for ACTIVE applications
  // Check if user has existing future appointment for ACTIVE applications only
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Get all user's applications to check which ones are active
    const { data: userApplications, error: appsError } = await supabase
      .from('passport_applications')
      .select('id, status')
      .eq('user_id', user?.id);

    if (appsError) {
      console.error('Error fetching user applications:', appsError);
    }

    // Find active application IDs (applications that are not completed)
    const activeApplicationIds = userApplications
      ?.filter(app => ['submitted', 'under_review', 'approved', 'appointment_booked'].includes(app.status))
      .map(app => app.id) || [];

    if (activeApplicationIds.length > 0) {
      // Check if user has appointments for any ACTIVE applications
      const { data: userAppointments, error: fetchError } = await supabase
        .from('biometrics_appointments')
        .select('id, date, application_id')
        .eq('user_id', user?.id)
        .in('application_id', activeApplicationIds) // Only check appointments for active applications
        .gte('date', today); // any appointment on or after today

      if (!fetchError && Array.isArray(userAppointments) && userAppointments.length > 0) {
        // Check if the appointment is for a DIFFERENT active application
        const otherActiveAppointments = userAppointments.filter(
          appointment => appointment.application_id !== selectedApplication.id
        );

        if (otherActiveAppointments.length > 0) {
          alert('You already have a biometrics appointment scheduled for another active application. You may book a new appointment only after your current appointment date has passed.');
          return;
        }
        
        // If it's for the SAME application, allow rebooking (user might want to reschedule)
        const sameAppAppointments = userAppointments.filter(
          appointment => appointment.application_id === selectedApplication.id
        );
        
        if (sameAppAppointments.length > 0) {
          // Allow rebooking the same application (user might want to change date/time)
          console.log('User is rebooking the same application');
        }
      }
    }
  } catch (err) {
    console.warn('Could not check existing appointments:', err);
  }

  try {
    setIsBooking(true);
    
    // Log the booking attempt for debugging
    console.log('Attempting to book appointment:', {
      date: appointmentData.date,
      time: appointmentData.time,
      reference: appointmentData.reference_number
    });

    const { data, error: insertError } = await supabase
      .from('biometrics_appointments')
      .insert([{
        application_id: selectedApplication.id,
        user_id: selectedApplication.user_id,
        reference_number: appointmentData.reference_number,
        date: appointmentData.date,
        time: appointmentData.time,
        created_at: new Date().toISOString()
      }])
      .select();

    if (insertError) {
      console.error('Insert error details:', insertError);
      
      // Enhanced error handling with specific messages
      if (insertError.code === 'PGRST205' || (insertError.message && String(insertError.message).includes('Could not find the table'))) {
        alert('Booking service is currently unavailable. Please try again later or contact support.');
      } else if (insertError.code === '23505') {
        // Unique constraint violation - determine which constraint
        if (insertError.message?.includes('date_time_key') || 
            insertError.message?.includes('date, time') ||
            insertError.details?.includes('date_time_key')) {
          alert('⏰ This time slot has just been taken by another applicant. Please select a different date or time.');
        } else if (insertError.message?.includes('application_id') || 
                   insertError.message?.includes('biometrics_appointments_application_id_key')) {
          alert('📋 This application already has an appointment booked. If you need to reschedule, please contact support.');
        } else {
          alert('This time slot is no longer available. Please select a different time.');
        }
        
        // Refresh the appointments data to show current availability
        await loadExistingAppointments();
        
        // Also update available time slots for the current date
        if (appointmentData.date) {
          const updatedSlots = getAvailableTimeSlots(appointmentData.date);
          setAvailableTimeSlots(updatedSlots);
          
          // Clear the selected time since it's no longer available
          setAppointmentData(prev => ({ ...prev, time: '' }));
        }
        
      } else if (insertError.code === '42501') {
        alert('Permission denied. Please make sure you are logged in properly.');
      } else {
        alert('Failed to book appointment. Please try again or contact support if the problem persists.');
      }
      return;
    }

    // Success case - appointment booked
    console.log('Appointment created successfully:', data);

    // Send appointment confirmation email
    try {
      const emailResponse = await supabase.functions.invoke('email_service', {
        body: {
          recipient_email: user?.email || selectedApplication.email,
          status: 'appointment_booked',
          name: `${selectedApplication.first_name} ${selectedApplication.last_name}`,
          reference_number: selectedApplication.reference_number,
          appointment_date: appointmentData.date,
          appointment_time: appointmentData.time
        }
      });
      
      if (emailResponse.error) {
        console.error('Email notification error:', emailResponse.error);
      } else {
        console.log('Confirmation email sent successfully');
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    alert(`✅ Appointment booked successfully!\n\nDate: ${appointmentData.date}\nTime: ${appointmentData.time}\n\nYou will receive a confirmation email shortly.`);
    await loadExistingAppointments(); // Refresh appointments after booking
    handleCloseModal();
    refreshApplications();
    
  } catch (error) {
    console.error('Unexpected error booking appointment:', error);
    alert('An unexpected error occurred. Please try again.');
  } finally {
    setIsBooking(false);
  }
};

  const filteredApplications = applications.filter(app =>
    app.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = safeStats;

  // compute selected application's rejection reason (if any)
  const selectedRejectionReason: string | null = selectedApplication
    ? (() => {
        const record = selectedApplication as unknown as Record<string, unknown>;
        const candidates = ['rejection_reason', 'notes', 'reason', 'rejectionReason', 'admin_notes'];
        for (const key of candidates) {
          const val = record[key];
          if (typeof val === 'string' && val.trim().length > 0) return val;
        }
        return null;
      })()
    : null;

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

        {/* Top nav: Admin (only visible to admins) then Dashboard */}
        <div className="mb-4">
          <nav className="flex items-center space-x-3">
            {/* {isAdminUser && (
              <Link
                to="/admin"
                className="px-3 py-2 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200"
              >
                Admin
              </Link>
            )} */}
            {/* <Link
              to="/dashboard"
              className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
            >
              Dashboard
            </Link> */}
          </nav>
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
                  if (approvedApp) {
                    handleOpenAppointmentModal(approvedApp);
                  }
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
                <div className="border-t border-gray-200 p-4 flex items-center justify-between">
                  <StatusTimeline applicationId={application.id} currentStatus={application.status} />
                  {/* when approved show a message icon that opens informational modal + option to book */}
                  {application.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleOpenAppointmentModal(application)}
                      className="ml-2 p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      aria-label="Appointment info"
                      title="Make biometrics appointment"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appointment Booking Modal */}
      {showAppointmentModal && selectedApplication && (
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
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={appointmentData.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Weekends (Saturday & Sunday) are not available for appointments
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Time
                </label>
                <select
                  value={appointmentData.time}
                  onChange={(e) => setAppointmentData({...appointmentData, time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!appointmentData.date}
                >
                  <option value="">Select time</option>
                  {availableTimeSlots.map(slot => (
                    <option key={slot} value={slot}>
                      {slot === '09:00' ? '09:00 AM' :
                       slot === '10:00' ? '10:00 AM' :
                       slot === '11:00' ? '11:00 AM' :
                       slot === '14:00' ? '02:00 PM' :
                       slot === '15:00' ? '03:00 PM' :
                       slot === '16:00' ? '04:00 PM' : slot}
                    </option>
                  ))}
                </select>
                {appointmentData.date && (
                  <p className="text-xs text-gray-500 mt-1">
                    {availableTimeSlots.length === 0 
                      ? 'No time slots available for this date. Please select another date.'
                      : `${availableTimeSlots.length} time slot(s) available`
                    }
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={bookAppointment}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                disabled={isBooking || !appointmentData.date || !appointmentData.time}
              >
                {isBooking ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection modal */}
      {showRejectionModal && selectedApplication && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rejection-modal-title"
        >
          <div
            className="fixed inset-0 bg-black/40 -z-10"
            onClick={() => setShowRejectionModal(false)}
            aria-hidden="true"
          />
          <div className="relative max-w-lg w-full bg-white rounded-lg shadow-lg p-6 z-10">
            <div className="flex items-start justify-between">
              <div>
                <h3 id="rejection-modal-title" className="text-lg font-medium">Application Rejection Reason</h3>
                <p className="text-sm text-gray-500">
                  Reference: <span className="font-medium text-gray-700">{selectedApplication.reference_number}</span>
                  {selectedApplication.first_name || selectedApplication.last_name ? (
                    <> — {selectedApplication.first_name} {selectedApplication.last_name}</>
                  ) : null}
                </p>
              </div>

              <button
                onClick={() => setShowRejectionModal(false)}
                className="text-gray-400 hover:text-gray-600 ml-4"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-700">
              <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded">{selectedRejectionReason ?? 'No reason provided.'}</pre>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}