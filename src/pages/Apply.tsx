import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import PersonalInfoStep from '../components/application/PersonalInfoStep';
import DocumentsStep from '../components/application/DocumentsStep';
import PaymentStep from '../components/application/PaymentStep';
import ReviewStep from '../components/application/ReviewStep';
import { useAuth } from '../contexts/AuthContext';
import { useApplications } from '../contexts/ApplicationContext';

export interface ApplicationFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  email: string;
  phone: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  passportPhoto: File | null;
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
  const [formData, setFormData] = useState<ApplicationFormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    nationality: 'Lesotho',
    email: user?.email || '',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    passportPhoto: null,
    idDocument: null,
    birthCertificate: null,
    proofOfAddress: null
    proofOfPayment: null
  });

  const steps = [
    { number: 1, title: 'Personal Information', component: PersonalInfoStep },
    { number: 2, title: 'Documents', component: DocumentsStep },
    { number: 3, title: 'Payment', component: PaymentStep },
    { number: 4, title: 'Review & Submit', component: ReviewStep }
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
      const refNumber = `LSO${Date.now().toString().slice(-8)}`;
      
      // In a real app, you would upload files to Supabase Storage here
      // For now, we'll use placeholder URLs
      const applicationData = {
        user_id: user!.id,
        reference_number: refNumber,
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        place_of_birth: formData.placeOfBirth,
        nationality: formData.nationality,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,
        passport_photo_url: formData.passportPhoto ? 'uploaded' : null,
        id_document_url: formData.idDocument ? 'uploaded' : null,
        birth_certificate_url: formData.birthCertificate ? 'uploaded' : null,
        proof_of_address_url: formData.proofOfAddress ? 'uploaded' : null,
        proof_of_payment_url: formData.proofOfPayment ? 'uploaded' : null,
        status: 'submitted' as const,
        collection_point_id: null,
        qr_code: null
      };

      const { error } = await createApplication(applicationData);
      
      if (error) {
        throw error;
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex-1 flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= step.number
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.number}
              </div>
              <div className="ml-3 flex-1">
                <p
                  className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
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
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <CurrentStepComponent
          formData={formData}
          updateFormData={setFormData}
          onNext={nextStep}
          onPrev={prevStep}
          onSubmit={submitApplication}
          isFirst={currentStep === 1}
          isLast={currentStep === steps.length}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}