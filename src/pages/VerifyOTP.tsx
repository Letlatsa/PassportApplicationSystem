import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import CoatOfArms from '../CoatOfArms.png';

interface VerifyOTPForm {
  otp: string;
}

export default function VerifyOTP() {
  const { verifyOTP } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<VerifyOTPForm>();

  const onSubmit = async (data: VerifyOTPForm) => {
    setIsLoading(true);
    setError('');

    try {
      // Get email from localStorage (set during forgot password)
      const storedEmail = localStorage.getItem('reset_email');

      if (!storedEmail) {
        setError('Session expired. Please start over.');
        setIsLoading(false);
        return;
      }

      const { error } = await verifyOTP(storedEmail, data.otp);

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);

      // Clear localStorage and redirect to login after success message
      setTimeout(() => {
        // Get the email from localStorage to send Supabase reset email
        const keys = Object.keys(localStorage);
        const resetKey = keys.find(key => key.startsWith('password_reset_verified_'));
        if (resetKey) {
          const email = resetKey.replace('password_reset_verified_', '');
          // Trigger Supabase password reset email
          supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          }).catch(console.error);
        }

        // Clear localStorage and redirect
        keys.forEach(key => {
          if (key.startsWith('password_reset_')) {
            localStorage.removeItem(key);
          }
        });

        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Invalid verification code. Please try again.');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-sm rounded-lg p-8 shadow-lg">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img
                src={CoatOfArms}
                alt="Coat of Arms"
                className="h-16 w-auto"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Code Verified Successfully</h2>
             <p className="text-gray-600 mb-6">
               Your verification code has been confirmed. You will now be redirected to the sign-in page.
             </p>
             <p className="text-sm text-gray-500 mb-4">
               After signing in, please check your email for the password reset link sent by Supabase.
             </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-sm rounded-lg p-8 shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img
              src={CoatOfArms}
              alt="Coat of Arms"
              className="h-16 w-auto"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Code</h2>
          <p className="text-gray-600">
            Enter the 5-digit verification code sent to your email address.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              {...register('otp', {
                required: 'Verification code is required',
                pattern: {
                  value: /^\d{5}$/,
                  message: 'Please enter a valid 5-digit code'
                }
              })}
              type="text"
              maxLength={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
              placeholder="00000"
            />
            {errors.otp && (
              <p className="text-red-500 text-xs mt-1">{errors.otp.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-md font-semibold transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Verify Code
              </>
            )}
          </button>

          <div className="text-center space-y-2">
            <p className="text-gray-600">
              Didn't receive the code?{' '}
              <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                Send again
              </Link>
            </p>
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}