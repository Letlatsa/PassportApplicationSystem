import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, FileCheck, Package, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface StatusUpdate {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_by?: string;
}

interface StatusTimelineProps {
  applicationId: string;
  currentStatus: string;
}

const statusSteps = [
  { key: 'submitted', label: 'Submitted', icon: FileCheck },
  { key: 'approved', label: 'Approved', icon: CheckCircle },
  { key: 'appointment_booked', label: 'Appointment Booked', icon: Clock },
  { key: 'await_printing', label: 'Await Printing', icon: Clock },
  { key: 'ready_for_collection', label: 'Ready for Collection', icon: Package },
  { key: 'collected', label: 'Collected', icon: CheckCircle }
];

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Application submitted',
  approved: 'Application approved',
  appointment_booked: 'Appointment booked',
  await_printing: 'Await printing',
  ready_for_collection: 'Ready for collection',
  collected: 'Collected',
  rejected: 'Application rejected',
};

export default function StatusTimeline({ applicationId, currentStatus }: StatusTimelineProps) {
  const [updates, setUpdates] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdates = async () => {
      const { data } = await supabase
        .from('application_status_updates')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

      setUpdates(data || []);
      setLoading(false);
    };

    fetchUpdates();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('status-updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'application_status_updates' },
        (payload) => {
          if (payload.new.application_id === applicationId) {
            setUpdates(prev => [...prev, payload.new as StatusUpdate]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [applicationId]);

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.key === currentStatus);
  };

  const getStepStatus = (stepIndex: number) => {
    const currentIndex = getCurrentStepIndex();
    if (currentStatus === 'rejected') return stepIndex === 0 ? 'completed' : 'rejected';
    if (stepIndex <= currentIndex) return 'completed';
    if (stepIndex === currentIndex + 1) return 'active';
    return 'upcoming';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const label = STATUS_LABELS[currentStatus] ?? currentStatus;

  return (
    <div className="p-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-6">Application Progress</h4>
      
      {currentStatus === 'rejected' ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center text-red-800 mb-2">
            <X className="w-5 h-5 mr-2" />
            <span className="font-semibold">Application Rejected</span>
          </div>
          {updates.find(u => u.status === 'rejected')?.notes && (
            <p className="text-red-700 text-sm">
              {updates.find(u => u.status === 'rejected')?.notes}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {statusSteps.map((step, index) => {
            const status = getStepStatus(index);
            const Icon = step.icon;
            const update = updates.find(u => u.status === step.key);

            return (
              <div key={step.key} className="flex items-start">
                <div className="flex flex-col items-center mr-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      status === 'completed'
                        ? 'bg-green-100 text-green-600'
                        : status === 'active'
                        ? 'bg-blue-100 text-blue-600'
                        : status === 'rejected'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`w-0.5 h-12 mt-2 ${
                        status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
                
                <div className="flex-1 min-w-0 pb-8">
                  <div className="flex items-center justify-between">
                    <h5
                      className={`text-sm font-medium ${
                        status === 'completed' || status === 'active'
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </h5>
                    {update && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {format(new Date(update.created_at), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                    )}
                  </div>
                  {update?.notes && (
                    <p className="text-xs text-gray-600 mt-1">{update.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-4 text-sm text-gray-700">
        {label}
      </div>
    </div>
  );
}