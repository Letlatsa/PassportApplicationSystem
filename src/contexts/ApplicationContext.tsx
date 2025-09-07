import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Database } from '../lib/supabase';

type Application = Database['public']['Tables']['passport_applications']['Row'];
type ApplicationInsert = Database['public']['Tables']['passport_applications']['Insert'];

interface ApplicationContextType {
  applications: Application[];
  loading: boolean;
  refreshApplications: () => Promise<void>;
  createApplication: (data: ApplicationInsert) => Promise<{ data: Application | null; error: any }>;
  updateApplicationStatus: (id: string, status: string, notes?: string) => Promise<{ error: any }>;
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

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const createApplication = async (applicationData: ApplicationInsert) => {
    console.log('Creating application with data:', applicationData);
    
    const { data, error } = await supabase
      .from('passport_applications')
      .insert([applicationData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
    }

    if (!error && data) {
      await refreshApplications();
    }

    return { data, error };
  };

  const updateApplicationStatus = async (id: string, status: string, notes?: string) => {
    const { error } = await supabase
      .from('passport_applications')
      .update({ status: status as any, updated_at: new Date().toISOString() })
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
  }, [user]);

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