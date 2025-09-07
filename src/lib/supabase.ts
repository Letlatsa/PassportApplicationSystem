import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      passport_applications: {
        Row: {
          id: string;
          user_id: string;
          reference_number: string;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          place_of_birth: string;
          nationality: string;
          email: string;
          phone: string;
          address: string;
          emergency_contact_name: string;
          emergency_contact_phone: string;
          passport_photo_url: string | null;
          id_document_url: string | null;
          birth_certificate_url: string | null;
          proof_of_address_url: string | null;
          proof_of_payment_url: string | null;
          status: 'submitted' | 'under_review' | 'approved' | 'ready_for_collection' | 'collected' | 'rejected';
          collection_point_id: string | null;
          qr_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['passport_applications']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['passport_applications']['Insert']>;
      };
      collection_points: {
        Row: {
          id: string;
          name: string;
          address: string;
          district: string;
          phone: string;
          operating_hours: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['collection_points']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['collection_points']['Insert']>;
      };
      application_status_updates: {
        Row: {
          id: string;
          application_id: string;
          status: string;
          notes: string | null;
          updated_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['application_status_updates']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['application_status_updates']['Insert']>;
      };
      notification_logs: {
        Row: {
          id: string;
          application_id: string;
          type: 'sms' | 'email';
          recipient: string;
          message: string;
          status: 'sent' | 'failed' | 'pending';
          sent_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notification_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notification_logs']['Insert']>;
      };
    };
  };
};