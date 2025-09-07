import React from 'react';
import { ChevronLeft, ChevronRight, Upload, Check, AlertCircle } from 'lucide-react';
import type { ApplicationFormData } from '../../pages/Apply';

interface DocumentsStepProps {
  formData: ApplicationFormData;
  updateFormData: (data: ApplicationFormData) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function DocumentsStep({ formData, updateFormData, onNext, onPrev }: DocumentsStepProps) {
  const handleFileChange = (field: keyof ApplicationFormData, file: File | null) => {
    updateFormData({
      ...formData,
      [field]: file
    });
  };

  const validateAndNext = () => {
    // Check if all required documents are uploaded
    const requiredDocs = ['idDocument', 'proofOfAddress'];
    const missingDocs = requiredDocs.filter(doc => !formData[doc as keyof ApplicationFormData]);
    
    if (missingDocs.length > 0) {
      alert('Please upload all required documents before proceeding.');
      return;
    }
    
    onNext();
  };

  const documents = [
    {
      key: 'idDocument' as keyof ApplicationFormData, 
      title: 'National ID OR Birth Certificate',
      description: 'Certified copy of National ID or Birth Certificate (choose one)',
      required: true
    },
    {
      key: 'proofOfAddress' as keyof ApplicationFormData, 
      title: 'Village Chief Letter',
      description: 'Letter from village chief as proof of residence',
      required: true
    }
  ];

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
        <p className="text-gray-600">
          Please upload all required documents. Ensure they are clear and readable.
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {documents.map((doc) => {
          const file = formData[doc.key] as File | null;
          
          return (
            <div key={doc.key} className="border border-gray-200 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 space-y-2 sm:space-y-0">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                    {doc.title}
                    {doc.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                </div>
                
                {file && (
                  <div className="flex items-center text-green-600">
                    <Check className="w-5 h-5 mr-1" />
                    <span className="text-sm font-medium">Uploaded</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {file && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">{file.name}</p>
                        <p className="text-xs text-green-600">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileChange(doc.key, null)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) {
                        if (selectedFile.size > 5 * 1024 * 1024) {
                          alert('File size must be less than 5MB');
                          return;
                        }
                        handleFileChange(doc.key, selectedFile);
                      }
                    }}
                    className="hidden"
                    id={`file-${doc.key}`}
                  />
                  <label
                    htmlFor={`file-${doc.key}`}
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-600">
                      {file ? 'Replace File' : 'Choose File'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PNG, JPG, PDF up to 5MB
                    </span>
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Document Requirements:</p>
            <ul className="text-xs space-y-1">
              <li>• All documents must be clear and readable</li>
              <li>• ID or Birth Certificate must be certified copies</li>
              <li>• Scans should be in color and high resolution</li>
              <li>• File formats: JPEG, PNG, PDF only</li>
              <li>• Village chief letter must be official and signed</li>
            </ul>
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
          onClick={validateAndNext}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
        >
          Next Step
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}