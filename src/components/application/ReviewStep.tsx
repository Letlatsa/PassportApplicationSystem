import React from 'react';
import { ChevronLeft, Check, FileText, AlertCircle } from 'lucide-react';
import type { ApplicationFormData } from '../../pages/Apply';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';

interface ReviewStepProps {
  formData: ApplicationFormData & { collectionPointId?: string };
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

export default function ReviewStep({ formData, onPrev, onSubmit, isSubmitting }: ReviewStepProps) {
  const [collectionPoint, setCollectionPoint] = useState<any>(null);

  useEffect(() => {
    if (formData.collectionPointId) {
      fetchCollectionPoint();
    }
  }, [formData.collectionPointId]);

  const fetchCollectionPoint = async () => {
    const { data } = await supabase
      .from('collection_points')
      .select('*')
      .eq('id', formData.collectionPointId)
      .single();
    
    setCollectionPoint(data);
  };

  const personalInfo = [
    { label: 'First Name', value: formData.firstName },
    { label: 'Last Name', value: formData.lastName },
    { label: 'Date of Birth', value: formData.dateOfBirth ? format(new Date(formData.dateOfBirth), 'MMMM dd, yyyy') : '' },
    { label: 'Place of Birth', value: formData.placeOfBirth },
    { label: 'Nationality', value: formData.nationality },
    { label: 'Email', value: formData.email },
    { label: 'Phone', value: formData.phone },
    { label: 'Address', value: formData.address }
  ];

  const emergencyContact = [
    { label: 'Name', value: formData.emergencyContactName },
    { label: 'Phone', value: formData.emergencyContactPhone }
  ];

  const documents = [
    { label: 'National ID or Birth Certificate', file: formData.idDocument },
    { label: 'Village Chief Letter', file: formData.proofOfAddress },
    { label: 'Proof of Payment', file: formData.proofOfPayment }
  ];

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Application</h2>
        <p className="text-gray-600">
          Please review all information carefully before submitting your application.
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Personal Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personalInfo.map((item) => (
              <div key={item.label}>
                <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
                <dd className="text-sm text-gray-900 mt-1">{item.value || 'Not provided'}</dd>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyContact.map((item) => (
              <div key={item.label}>
                <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
                <dd className="text-sm text-gray-900 mt-1">{item.value || 'Not provided'}</dd>
              </div>
            ))}
          </div>
        </div>

        {/* Collection Point */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Collection Point</h3>
          {collectionPoint ? (
            <div className="space-y-2">
              <div><span className="font-medium">Name:</span> {collectionPoint.name}</div>
              <div><span className="font-medium">Address:</span> {collectionPoint.address}</div>
              <div><span className="font-medium">District:</span> {collectionPoint.district}</div>
              <div><span className="font-medium">Phone:</span> {collectionPoint.contact_phone}</div>
            </div>
          ) : (
            <p className="text-red-600">No collection point selected</p>
          )}
        </div>

        {/* Documents */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.label} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 space-y-1 sm:space-y-0">
                <span className="text-sm text-gray-700">{doc.label}</span>
                {doc.file ? (
                  <div className="flex items-center text-green-600">
                    <Check className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">{doc.file.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-red-600">Not uploaded</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2">Important Information:</p>
              <ul className="space-y-1 text-xs">
                <li>• Processing time: 10-15 business days</li>
                <li>• Application fee: M 350 (payment verified)</li>
                <li>• You will receive SMS and email updates</li>
                <li>• Ensure all information is accurate to avoid delays</li>
                <li>• You can track your application status in your dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between pt-6 space-y-3 sm:space-y-0">
        <button
          type="button"
          onClick={onPrev}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Submit Application
            </>
          )}
        </button>
      </div>
    </div>
  );
}