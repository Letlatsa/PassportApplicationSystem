import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      status: 200 
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SENDGRID_API_KEY) {
      throw new Error('SendGrid API key is not configured');
    }

    const { recipient_email, status, name, reference_number, appointment_date, appointment_time, otp_code } = await req.json();
    console.log('Sending email to:', recipient_email);

    if (!recipient_email) {
      throw new Error('Missing recipient email');
    }

    // For password reset, we don't need name and reference_number
    if (status !== 'password_reset_otp' && !status) {
      throw new Error('Missing status field');
    }

    let message: string;
    let emailSubject: string;

    if (status === 'password_reset_otp') {
      // Handle password reset OTP
      if (!otp_code) {
        throw new Error('OTP code is required for password reset');
      }
      message = `Dear User,<br><br>You have requested to reset your password. Your verification code is:<br><br><strong style="font-size: 24px; color: #2563eb;">${otp_code}</strong><br><br>This code will expire in 10 minutes. If you did not request this reset, please ignore this email.`;
      emailSubject = 'Password Reset Verification Code';
    } else {
      // Handle application status updates
      if (!status || !name || !reference_number) {
        throw new Error('Missing required fields for application status update');
      }

      const statusMessages: Record<string, string> = {
        submitted: `Dear ${name},<br><br>Your passport application (Ref: ${reference_number}) has been successfully submitted. You will be notified once it is reviewed and approved.`,
        approved: `Dear ${name},<br><br>Great news! Your passport application (Ref: ${reference_number}) has been approved. Please schedule an appointment to visit our offices for biometrics.`,
        appointment_booked: `Dear ${name},<br><br>Your biometrics appointment has been successfully booked!<br><br><strong>Appointment Details:</strong><br>Date: ${appointment_date || 'N/A'}<br>Time: ${appointment_time || 'N/A'}<br>Reference: ${reference_number}<br><br>Please arrive 10 minutes early and bring a valid ID document.`,
        await_printing: `Dear ${name},<br><br>Your passport application (Ref: ${reference_number}) has been processed and is now awaiting printing. You will be notified once your passport is ready for collection.`,
        ready_for_collection: `Dear ${name},<br><br>Your passport (Ref: ${reference_number}) is ready for collection. Please visit your selected collection point with a valid ID.`,
        collected: `Dear ${name},<br><br>Your passport (Ref: ${reference_number}) has been successfully collected. Thank you for using our service.`,
        rejected: `Dear ${name},<br><br>Unfortunately, your passport application (Ref: ${reference_number}) has been rejected. Log in and reapply or contact our office for more details.`,
      };

      message = statusMessages[status] || `Dear ${name},<br><br>Your application status for Ref: ${reference_number} has been updated.`;

      // Dynamic subject line based on status
      emailSubject = status === 'appointment_booked'
        ? `Biometrics Appointment Confirmed - Ref: ${reference_number}`
        : `Passport Application Update - Ref: ${reference_number}`;
    }


    console.log('Calling SendGrid API...');

    // Send email using SendGrid with VERIFIED sender
    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: recipient_email, name: name || 'User' }],
          subject: emailSubject
        }],
        from: {
          email: 'kadijodeliveries@gmail.com', 
          name: 'Passport Office'
        },
        content: [{
          type: 'text/html',
          value: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        max-width: 600px; 
                        margin: 0 auto; 
                        padding: 20px;
                        color: #333;
                    }
                    .header { 
                        color: #333; 
                        border-bottom: 2px solid #f0f0f0; 
                        padding-bottom: 15px;
                    }
                    .content { 
                        background: #f9f9f9; 
                        padding: 25px; 
                        border-radius: 8px; 
                        margin: 20px 0;
                        line-height: 1.6;
                    }
                    .footer { 
                        color: #666; 
                        font-size: 12px; 
                        margin-top: 20px; 
                        padding-top: 15px; 
                        border-top: 1px solid #eee;
                    }
                    .reference {
                        background: #e8f4fd;
                        padding: 10px;
                        border-radius: 4px;
                        font-weight: bold;
                        margin: 10px 0;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>${status === 'password_reset_otp' ? 'Password Reset Verification' : 'Passport Application Status Update'}</h2>
                </div>

                <div class="content">
                    ${message}
                </div>

                ${status !== 'password_reset_otp' ? `<div class="reference">Reference Number: ${reference_number}</div>` : ''}
                
                <div class="footer">
                    This is an automated message from Passport Office. Please do not reply to this email.
                </div>
            </body>
            </html>
          `
        }]
      }),
    });

    console.log('SendGrid response status:', sendgridResponse.status);

    if (!sendgridResponse.ok) {
      const errorText = await sendgridResponse.text();
      console.error('SendGrid API error:', sendgridResponse.status, errorText);
      throw new Error(`SendGrid API error: ${sendgridResponse.status} - ${errorText}`);
    }

    console.log('✅ Email sent successfully via SendGrid to:', recipient_email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification email sent successfully to applicant',
        service: 'SendGrid',
        recipient: recipient_email
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error in email service:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});