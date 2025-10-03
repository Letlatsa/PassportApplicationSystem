import type { Database } from './supabase';

type Application = Database['public']['Tables']['passport_applications']['Row'];

export const sendNotificationEmail = async (application: Application, newStatus: string) => {
  console.log('Sending notification for application:', application.id, 'with status:', newStatus);
  
  // Validate application data before sending
  if (!application.email || !application.first_name || !application.last_name || !application.reference_number) {
    console.error('Missing required application data:', {
      email: application.email,
      firstName: application.first_name,
      lastName: application.last_name,
      reference: application.reference_number
    });
    throw new Error('Incomplete application data for sending notification');
  }

  try {
    // Use the exact URL from your successful deployment
    const functionUrl = 'https://paprayofznxapwnendfa.supabase.co/functions/v1/email_service';
    console.log('Calling function URL:', functionUrl);

    const requestBody = {
      recipient_email: application.email,
      status: newStatus,
      name: `${application.first_name} ${application.last_name}`,
      reference_number: application.reference_number,
    };

    console.log('Request payload:', requestBody);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status, response.statusText);

    // Handle non-OK responses
    if (!response.ok) {
      let errorDetails;
      try {
        errorDetails = await response.json();
      } catch {
        errorDetails = await response.text();
      }
      
      console.error('Email service error:', {
        status: response.status,
        statusText: response.statusText,
        details: errorDetails
      });
      
      throw new Error(`Email service error: ${response.status} ${response.statusText}`);
    }

    // Parse successful response
    const responseData = await response.json();
    console.log('Notification sent successfully:', responseData);
    return responseData;
    
  } catch (error) {
    console.error('Error sending notification email:', error);
    
    // Re-throw with more context
    throw new Error(`Failed to send notification: ${error.message}`);
  }
};