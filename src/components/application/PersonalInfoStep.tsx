import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronRight, Loader2 } from 'lucide-react';
import type { ApplicationFormData } from '../../pages/Apply';
import { supabase } from '../../lib/supabase';

interface PersonalInfoStepProps {
  formData: ApplicationFormData;
  updateFormData: (data: ApplicationFormData) => void;
  onNext: () => void;
  onValidationError?: (error: string) => void;
  isFirst: boolean;
  isLast?: boolean;
}

export default function PersonalInfoStep({ formData, updateFormData, onNext, onValidationError }: PersonalInfoStepProps) {
  const [isValidating, setIsValidating] = useState(false);

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
      idNumber: formData.idNumber,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone: formData.emergencyContactPhone
    }
  });


  const validateCitizenData = async (idNumber: string, firstName: string, lastName: string): Promise<string | null> => {
    try {
      // 1. Check ID format validity
      const idRegex = /^LS\d{12}$/;
      if (!idRegex.test(idNumber)) {
        return 'ID, Names or other details are invalid. Please check information entered and try again.';
      }

      // 2. Check if ID exists in Basotho table and validate names
      const { data: basotho, error } = await supabase
        .from('basotho')
        .select('idnumber, name, surname')
        .eq('idnumber', idNumber);

      console.log('Basotho query result:', { data: basotho, error, idNumber });

      if (error || !basotho || basotho.length === 0) {
        console.log('No Basotho found with ID:', idNumber);
        return 'ID, Names or other details are invalid. Please check information entered and try again.';
      }

      const basothoRecord = basotho[0];

      // 3. Compare names
      const formFirstName = firstName.trim().toLowerCase();
      const formLastName = lastName.trim().toLowerCase();
      const dbFirstName = basothoRecord.name.toLowerCase();
      const dbLastName = basothoRecord.surname.toLowerCase();

      console.log('Name comparison:', {
        formFirstName,
        formLastName,
        dbFirstName,
        dbLastName
      });

      // Check if names match
      const firstNameMatch = formFirstName === dbFirstName;
      const lastNameMatch = formLastName === dbLastName;

      if (!firstNameMatch || !lastNameMatch) {
        console.log('Name mismatch detected');
        return 'ID, Names or other details are invalid. Please check information entered and try again.';
      }

      console.log('Validation passed');
      return null; // Validation passed
    } catch (error) {
      console.error('Error validating Basotho data:', error);
      return 'ID, Names or other details are invalid. Please check information entered and try again.';
    }
  };

  const onSubmit = async (data: Partial<ApplicationFormData>) => {
    setIsValidating(true);

    try {
      const validationError = await validateCitizenData(
        data.idNumber || '',
        data.firstName || '',
        data.lastName || ''
      );

      if (validationError) {
        if (onValidationError) {
          onValidationError(validationError);
        } else {
          alert(validationError);
        }
        setIsValidating(false);
        return;
      }

      updateFormData({
        ...formData,
        ...data
      });
      onNext();
    } catch (error) {
      console.error('Validation error:', error);
      alert('An error occurred during validation. Please try again.');
    } finally {
      setIsValidating(false);
    }
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
            <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-1">
              National ID Number *
            </label>
            <input
              {...register('idNumber', {
                required: 'ID number is required',
                pattern: {
                  value: /^LS\d{12}$/,
                  message: 'ID number must start with "LS" followed by exactly 12 digits'
                }
              })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="National ID Number"
              maxLength={14}
            />
            {errors.idNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.idNumber.message}</p>
            )}
          </div>

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
            disabled={isValidating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                Next Step
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}