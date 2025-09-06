import React from 'react';
import { ChevronLeft, ChevronRight, Upload, Check, AlertCircle, CreditCard, Smartphone, Building } from 'lucide-react';
import type { ApplicationFormData } from '../../pages/Apply';

interface PaymentStepProps {
  formData: ApplicationFormData;
  updateFormData: (data: ApplicationFormData) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function PaymentStep({ formData, updateFormData, onNext, onPrev }: PaymentStepProps) {
  const handleFileChange = (file: File | null) => {
    updateFormData({
      ...formData,
      proofOfPayment: file
    });
  };

  const validateAndNext = () => {
    if (!formData.proofOfPayment) {
      alert('Please upload proof of payment before proceeding.');
      return;
    }
    
    onNext();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment</h2>
        <p className="text-gray-600">
          Complete your payment and upload proof to proceed with your application.
        </p>
      </div>

      {/* Payment Methods */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-600 p-2 rounded-lg">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 ml-3">M-Pesa</h3>
          </div>
          <div className="space-y-2 text-sm text-green-700">
            <p><span className="font-semibold">Merchant Code:</span> 45271</p>
            <p><span className="font-semibold">Amount:</span> M 350</p>
            <p className="text-xs text-green-600">Send money to merchant code and save receipt</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="bg-orange-600 p-2 rounded-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-orange-800 ml-3">EcoCash</h3>
          </div>
          <div className="space-y-2 text-sm text-orange-700">
            <p><span className="font-semibold">Merchant Code:</span> 92234</p>
            <p><span className="font-semibold">Amount:</span> M 350</p>
            <p className="text-xs text-orange-600">Send money to merchant code and save receipt</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Building className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-blue-800 ml-3">Bank Transfer</h3>
          </div>
          <div className="space-y-2 text-sm text-blue-700">
            <p><span className="font-semibold">Bank:</span> Standard Lesotho Bank</p>
            <p><span className="font-semibold">Account:</span> 261877094223</p>
            <p><span className="font-semibold">Amount:</span> M 350</p>
            <p className="text-xs text-blue-600">Transfer to account and save receipt</p>
          </div>
        </div>
      </div>

      {/* Upload Proof of Payment */}
      <div className="border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              Upload Proof of Payment
              <span className="text-red-500 ml-1">*</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Upload a clear photo or screenshot of your payment receipt/confirmation
            </p>
          </div>
          
          {formData.proofOfPayment && (
            <div className="flex items-center text-green-600">
              <Check className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">Uploaded</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {formData.proofOfPayment && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">{formData.proofOfPayment.name}</p>
                  <p className="text-xs text-green-600">
                    {(formData.proofOfPayment.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleFileChange(null)}
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
                  handleFileChange(selectedFile);
                }
              }}
              className="hidden"
              id="proof-of-payment"
            />
            <label
              htmlFor="proof-of-payment"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">
                {formData.proofOfPayment ? 'Replace File' : 'Choose File'}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                PNG, JPG, PDF up to 5MB
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Important Information */}
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Payment Instructions:</p>
            <ul className="text-xs space-y-1">
              <li>• Application fee is M 350 (non-refundable)</li>
              <li>• Payment must be made before application submission</li>
              <li>• Keep your payment receipt for verification</li>
              <li>• Upload a clear, readable proof of payment</li>
              <li>• Processing will begin only after payment verification</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={onPrev}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </button>

        <button
          type="button"
          onClick={validateAndNext}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
        >
          Next Step
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}