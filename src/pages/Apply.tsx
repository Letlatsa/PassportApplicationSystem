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
    idDocument: null,
    birthCertificate: null,
    proofOfAddress: null,
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
      
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.address || !formData.email || !formData.phone) {
        throw new Error('Please fill in all required fields: name, address, email, and phone');
      }

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
        id_document_url: formData.idDocument ? 'uploaded' : null,
        birth_certificate_url: formData.birthCertificate ? 'uploaded' : null,
        proof_of_address_url: formData.proofOfAddress ? 'uploaded' : null,
        proof_of_payment_url: formData.proofOfPayment ? 'uploaded' : null,
        status: 'submitted' as const,
        collection_point_id: null,
        qr_code: null
      };

      console.log('Submitting application data:', applicationData);

      const { error } = await createApplication(applicationData);
      
      if (error) {
        console.error('Supabase error:', error);
        // Provide more specific error messages
        if (error.code === 'PGRST204') {
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
    </div>
  );
}