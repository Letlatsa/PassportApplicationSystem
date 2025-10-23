import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PersonalInfoStep from '../components/application/PersonalInfoStep';
import DocumentsStep from '../components/application/DocumentsStep';
import CollectionPointStep from '../components/application/CollectionPointStep';
import PaymentStep from '../components/application/PaymentStep';
import ReviewStep from '../components/application/ReviewStep';
import { useAuth } from '../contexts/AuthContext';
import { useApplications } from '../contexts/ApplicationContext';
import { FileUploadService } from '../lib/fileUpload';

export interface ApplicationFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  idNumber: string;
  email: string;
  phone: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  collectionPointId?: string;
  idDocument: File | null;
  birthCertificate: File | null;
  proofOfAddress: File | null;
  proofOfPayment: File | null;
}

export default function Apply() {
  const { user } = useAuth();
  const { createApplication } = useApplications();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState<ApplicationFormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    nationality: 'Lesotho',
    idNumber: '',
    email: user?.email || '',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    idDocument: null,
    birthCertificate: null,
    proofOfAddress: null,
    proofOfPayment: null
  });

  const steps = [
    { number: 1, title: 'Personal Information', component: PersonalInfoStep },
    { number: 2, title: 'Collection Point', component: CollectionPointStep },
    { number: 3, title: 'Documents', component: DocumentsStep },
    { number: 4, title: 'Payment', component: PaymentStep },
    { number: 5, title: 'Review', component: ReviewStep }
  ];

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitApplication = async () => {
    setIsSubmitting(true);

    try {
      // Generate reference number
      const refNumber = `LSP${Date.now().toString().slice(-8)}`;

      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.address || !formData.email || !formData.phone || !formData.collectionPointId || !formData.idNumber) {
        throw new Error('Please fill in all required fields: name, address, email, phone, ID number, and collection point');
      }

      // Validate ID number format (LS followed by 12 digits)
      const idRegex = /^LS\d{12}$/;
      if (!idRegex.test(formData.idNumber)) {
        throw new Error('ID number entered is invalid. Please make sure it has minimum 12 digits and starts with "LS".');
      }

      // Upload files to Supabase Storage
      console.log('Uploading files to storage...');
      const uploadedFiles = await FileUploadService.uploadApplicationFiles(refNumber, {
        idDocument: formData.idDocument || undefined,
        birthCertificate: formData.birthCertificate || undefined,
        proofOfAddress: formData.proofOfAddress || undefined,
        proofOfPayment: formData.proofOfPayment || undefined,
      });

      console.log('Files uploaded successfully:', uploadedFiles);

      const applicationData = {
        user_id: user!.id,
        reference_number: refNumber,
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        place_of_birth: formData.placeOfBirth,
        nationality: formData.nationality,
        id_number: formData.idNumber,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,
        id_document_url: uploadedFiles.id_document_url || null,
        birth_certificate_url: uploadedFiles.birth_certificate_url || null,
        proof_of_address_url: uploadedFiles.proof_of_address_url || null,
        proof_of_payment_url: uploadedFiles.proof_of_payment_url || null,
        collection_point_id: formData.collectionPointId,
        status: 'submitted' as const,
        qr_code: null,
        passport_photo_url: null
      };

      console.log('Submitting application data:', applicationData);

      const { error } = await createApplication(applicationData);
      
      if (error) {
        console.error('Supabase error:', error);
        // Provide more specific error messages
        if ('code' in error && error.code === 'PGRST204') {
          throw new Error('Database schema error. Please contact support.');
        }
        throw error;
      }

      // Send confirmation email
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-confirmation-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            name: `${formData.firstName} ${formData.lastName}`,
            reference_number: refNumber
          })
        });
      } catch (emailError) {
        console.warn('Email sending failed:', emailError);
        // Don't fail the application submission if email fails
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting application:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error submitting application: ${errorMessage}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Progress Bar */}
      <div className="mb-6 sm:mb-8 bg-white/90 backdrop-blur-sm rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
          {steps.map((step, index) => (
            <div key={step.number} className="flex-1 flex items-center w-full sm:w-auto">
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0 ${
                  currentStep >= step.number
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.number}
              </div>
              <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                <p
                  className={`text-xs sm:text-sm font-medium truncate ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && !window.matchMedia('(max-width: 640px)').matches && (
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-2 sm:ml-4 hidden sm:block" />
              )}
            </div>
          ))}
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
        {currentStep === 1 ? (
          <PersonalInfoStep
            formData={formData}
            updateFormData={setFormData}
            onNext={nextStep}
            onValidationError={(error) => {
              setErrorMessage(error);
              setShowErrorModal(true);
            }}
            isFirst={true}
          />
        ) : (
          <CurrentStepComponent
            formData={formData}
            updateFormData={setFormData}
            onNext={nextStep}
            onPrev={prevStep}
            onSubmit={submitApplication}
            isFirst={false}
            isLast={currentStep === steps.length}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-600">Validation Error</h3>
              <button
                onClick={() => setShowErrorModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">{errorMessage}</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}