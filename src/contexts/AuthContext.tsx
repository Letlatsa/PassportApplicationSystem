import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  position?: string;
  district?: string;
  national_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SignUpData {
  first_name: string;
  last_name: string;
  phone: string;
  role?: string;
  position?: string;
  district?: string;
  national_id?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, userData: SignUpData) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
  userProfile: UserProfile | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const determineUserRole = (userEmail?: string, profile?: UserProfile | null) => {
    const adminEmails = ['admin@lesotho.gov', 'admin@gov.ls'];
    
    // Check if user is admin
    const isAdminUser = adminEmails.includes(userEmail || '') ||
                       profile?.role === 'admin' ||
                       userEmail?.includes('admin');
    
    // Check if user is staff - use profile role if available
    const isStaffUser = profile?.role === 'staff';
    
    setIsAdmin(!!isAdminUser);
    setIsStaff(!!isStaffUser);
    
    console.log('Role determination:', {
      email: userEmail,
      profileRole: profile?.role,
      isAdmin: isAdminUser,
      isStaff: isStaffUser,
      hasProfile: !!profile
    });
  };

  const fetchUserProfile = async (userId: string, userEmail?: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        determineUserRole(userEmail, null);
        setUserProfile(null);
        return;
      }

      if (profile) {
        setUserProfile(profile);
        determineUserRole(userEmail, profile);
      } else {
        // Profile doesn't exist - create one with proper role detection
        console.log('No profile found for user, creating one...');
        const role = userEmail?.includes('admin') ? 'admin' : 'user';
        await createDefaultProfile(userId, userEmail, role);
        
        // Fetch the newly created profile
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
          
        setUserProfile(newProfile);
        determineUserRole(userEmail, newProfile);
      }

    } catch (error) {
      console.error('Unexpected error in fetchUserProfile:', error);
      determineUserRole(userEmail, null);
      setUserProfile(null);
    }
  };

  const createDefaultProfile = async (userId: string, userEmail?: string, role: string = 'user') => {
    try {
      const defaultProfile = {
        user_id: userId,
        first_name: userEmail?.split('@')[0] || 'User',
        last_name: '',
        phone: '',
        role: role
      };

      const { error } = await supabase
        .from('profiles')
        .insert([defaultProfile]);

      if (error) {
        console.error('Error creating default profile:', error);
        return false;
      }
      
      console.log('Default profile created successfully with role:', role);
      return true;
    } catch (error) {
      console.error('Unexpected error creating default profile:', error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('Session error:', error);
          setLoading(false);
          return;
        }

        const currentUser = session?.user || null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchUserProfile(currentUser.id, currentUser.email);
        } else {
          setUserProfile(null);
          setIsAdmin(false);
          setIsStaff(false);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error in auth initialization:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);
        const currentUser = session?.user || null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchUserProfile(currentUser.id, currentUser.email);
        } else {
          setUserProfile(null);
          setIsAdmin(false);
          setIsStaff(false);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as AuthError };
    }
  };

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone: userData.phone,
            role: userData.role || 'user'
          }
        }
      });

      if (data.user && !error) {
        // Create profile with explicit role
        const profileData = {
          user_id: data.user.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone || '',
          role: userData.role || 'user', // This should be 'staff' for officers
          position: userData.position || null,
          district: userData.district || null,
          national_id: userData.national_id || null
        };

        console.log('Creating profile with data:', profileData);

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([profileData]);

        if (profileError) {
          console.error('Error creating profile during signup:', profileError);
          throw profileError;
        } else {
          console.log('Profile created successfully with role:', profileData.role);
        }
      }

      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isStaff,
    userProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}