import React from 'react';
import { useForm } from 'react-hook-form';
import { ChevronRight } from 'lucide-react';
import type { ApplicationFormData } from '../../pages/Apply';

interface PersonalInfoStepProps {
  formData: ApplicationFormData;
  updateFormData: (data: ApplicationFormData) => void;
  onNext: () => void;
  isFirst: boolean;
}

export default function PersonalInfoStep({ formData, updateFormData, onNext, isFirst }: PersonalInfoStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      placeOfBirth: formData.placeOfBirth,
      nationality: formData.nationality,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone: formData.emergencyContactPhone
    }
  });

  const onSubmit = (data: any) => {
    updateFormData({
      ...formData,
      ...data
    });
    onNext();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-600">
          Please fill in your personal details accurately as they appear on your official documents.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              {...register('firstName', { required: 'First name is required' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="First name"
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              {...register('lastName', { required: 'Last name is required' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Last name"
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth *
            </label>
            <input
              {...register('dateOfBirth', { required: 'Date of birth is required' })}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.dateOfBirth && (
              <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="placeOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
              Place of Birth *
            </label>
            <input
              {...register('placeOfBirth', { required: 'Place of birth is required' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="City, District"
            />
            {errors.placeOfBirth && (
              <p className="text-red-500 text-xs mt-1">{errors.placeOfBirth.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
              Nationality *
            </label>
            <select
              {...register('nationality', { required: 'Nationality is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Lesotho">Lesotho</option>
              <option value="South Africa">South Africa</option>
              <option value="Other">Other</option>
            </select>
            {errors.nationality && (
              <p className="text-red-500 text-xs mt-1">{errors.nationality.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your.email@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              {...register('phone', { required: 'Phone number is required' })}
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+266 xxxx xxxx"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Residential Address *
          </label>
          <textarea
            {...register('address', { required: 'Address is required' })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Full residential address including district"
          />
          {errors.address && (
            <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                {...register('emergencyContactName', { required: 'Emergency contact name is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Emergency contact full name"
              />
              {errors.emergencyContactName && (
                <p className="text-red-500 text-xs mt-1">{errors.emergencyContactName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                {...register('emergencyContactPhone', { required: 'Emergency contact phone is required' })}
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+266 xxxx xxxx"
              />
              {errors.emergencyContactPhone && (
                <p className="text-red-500 text-xs mt-1">{errors.emergencyContactPhone.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
          >
            Next Step
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </form>
    </div>
  );
}