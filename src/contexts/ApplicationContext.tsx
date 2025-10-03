import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Database } from '../lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';
import { sendNotificationEmail } from '../lib/notifications';

type Application = Database['public']['Tables']['passport_applications']['Row'];
type ApplicationInsert = Database['public']['Tables']['passport_applications']['Insert'];

interface ApplicationContextType {
  applications: Application[];
  loading: boolean;
  refreshApplications: () => Promise<void>;
  createApplication: (data: ApplicationInsert) => Promise<{ data: Application | null; error: PostgrestError | Error | null }>;
  updateApplicationStatus: (id: string, status: string, notes?: string) => Promise<{ error: PostgrestError | null }>;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export function useApplications() {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error('useApplications must be used within an ApplicationProvider');
  }
  return context;
}

export function ApplicationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshApplications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('passport_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        // Don't throw error, just set empty array
        setApplications([]);
      } else {
      setApplications(data || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const createApplication = async (applicationData: ApplicationInsert) => {
    console.log('Creating application with data:', applicationData);
    
    // Validate required fields before submission
    if (!applicationData.address || !applicationData.first_name || !applicationData.last_name) {
      const error = new Error('Missing required fields: address, first_name, or last_name');
      console.error('Validation error:', error);
      return { data: null, error };
    }

    const { data, error } = await supabase
      .from('passport_applications')
      .insert([applicationData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      console.error('Application data that failed:', applicationData);
    }

    if (!error && data) {
      await sendNotificationEmail(data, 'submitted');
      await refreshApplications();
    }

    return { data, error };
  };

  const updateApplicationStatus = async (id: string, status: string, notes?: string) => {
    const { error } = await supabase
      .from('passport_applications')
      .update({ status: status as Application['status'], updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      // Log the status update
      await supabase
        .from('application_status_updates')
        .insert([{
          application_id: id,
          status,
          notes: notes || null,
          updated_by: user?.id || ''
        }]);

      await refreshApplications();
    }

    return { error };
  };

  useEffect(() => {
    if (user) {
      refreshApplications();
    }
  }, [user?.id]);

  const value = {
    applications,
    loading,
    refreshApplications,
    createApplication,
    updateApplicationStatus
  };

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
}