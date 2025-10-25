
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CoatOfArms from '../CoatOfArms.png';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const { resetPassword, signOut, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if user is authenticated (coming from profile)
  const isAuthenticated = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ResetPasswordForm>();

  const password = watch('password');

  const onSubmit = async (data: ResetPasswordForm) => {
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await resetPassword(data.password);

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);

      // Show success notification
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
      successDiv.textContent = 'Password reset successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => {
        successDiv.remove();
      }, 3000);

      // For authenticated users, sign out
      if (isAuthenticated) {
        signOut(); // Fire and forget
      }

    } catch (err) {
      console.error('Password reset error:', err);
      setError('Failed to reset password. Please try again.');
      setIsLoading(false);
    }
  };

  if (success) {
    // Auto-redirect after 5 seconds
    setTimeout(() => {
      navigate('/login');
    }, 5000);

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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Password Reset Successfully</h2>
             <p className="text-gray-600 mb-6">
                Your password has been reset successfully. You will now be redirected to the login page.
              </p>
            <div className="text-sm text-gray-500">
              Loading...
            </div>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Set New Password</h2>
          <p className="text-gray-600">
            Enter your new password below.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                })}
                type={showPassword ? 'text' : 'password'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
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
                <Lock className="w-4 h-4 mr-2" />
                Update Password
              </>
            )}
          </button>

          <div className="text-center">
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