import React, { useState, useEffect } from 'react';
import { Calendar, User, Phone, Mail, QrCode, MessageCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/supabase';

type Application = Database['public']['Tables']['passport_applications']['Row'];

interface ApplicationCardProps {
  application: Application;
}

const statusColors = {
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  ready_for_collection: 'bg-purple-100 text-purple-800',
  collected: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800'
};

const statusLabels = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  ready_for_collection: 'Ready for Collection',
  collected: 'Collected',
  rejected: 'Rejected'
};

export default function ApplicationCard({ application }: ApplicationCardProps) {
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [loadingReason, setLoadingReason] = useState(false);

  const showQRCode = () => {
    if (application.qr_code) {
      // In a real app, this would open a modal with the QR code
      alert(`QR Code: ${application.qr_code}\nShow this at the collection point.`);
    }
  };

  const fetchRejectionReason = async () => {
    if (application.status !== 'rejected') return;

    setLoadingReason(true);
    try {
      const { data, error } = await supabase
        .from('application_status_updates')
        .select('notes')
        .eq('application_id', application.id)
        .eq('status', 'rejected')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching rejection reason:', error);
        setRejectionReason('Could not load rejection reason.');
      } else {
        setRejectionReason(data?.notes || 'No reason provided.');
      }
    } catch (error) {
      console.error('Error fetching rejection reason:', error);
      setRejectionReason('Could not load rejection reason.');
    } finally {
      setLoadingReason(false);
    }
  };

  useEffect(() => {
    if (showRejectionModal) {
      fetchRejectionReason();
    }
  }, [showRejectionModal]);

  return (
    <>
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {application.first_name} {application.last_name}
            </h3>
            <p className="text-gray-600 text-lg font-mono">
              Ref: {application.reference_number}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[application.status]}`}>
              {statusLabels[application.status]}
            </span>
            {application.status === 'rejected' && (
              <button
                onClick={() => setShowRejectionModal(true)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="View rejection reason"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            )}
            {application.status === 'ready_for_collection' && application.qr_code && (
              <button
                onClick={showQRCode}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center"
              >
                <QrCode className="w-4 h-4 mr-1" />
                Show QR
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <User className="w-4 h-4 mr-2" />
            <span>DOB: {format(new Date(application.date_of_birth), 'MMM dd, yyyy')}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Mail className="w-4 h-4 mr-2" />
            <span>{application.email}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Phone className="w-4 h-4 mr-2" />
            <span>{application.phone}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Applied: {format(new Date(application.created_at), 'MMM dd, yyyy')}</span>
          </div>
        </div>
      </div>

      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowRejectionModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rejection Reason</h3>
            {loadingReason ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            ) : (
              <p className="text-gray-700">
                {rejectionReason}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}