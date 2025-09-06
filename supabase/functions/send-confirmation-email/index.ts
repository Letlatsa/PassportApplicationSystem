import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, reference_number } = await req.json()

    // Email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0066cc; margin-bottom: 10px;">Lesotho Passport Services</h1>
          <h2 style="color: #333; margin-bottom: 20px;">Application Submitted Successfully</h2>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #333; font-size: 16px; margin-bottom: 15px;">Dear ${name},</p>
          
          <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
            Thank you for submitting your passport application. We have received your application and it is now being processed.
          </p>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #1976d2; font-weight: bold; margin: 0; font-size: 18px;">
              Your Reference Number: ${reference_number}
            </p>
          </div>
          
          <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
            <strong>What happens next:</strong>
          </p>
          
          <ul style="color: #333; font-size: 16px; margin-bottom: 20px; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Your application will be reviewed by our team (5-7 business days)</li>
            <li style="margin-bottom: 8px;">Once approved, you will be notified to visit a passport office for biometrics</li>
            <li style="margin-bottom: 8px;">You can book your biometrics appointment through your dashboard</li>
            <li style="margin-bottom: 8px;">After biometrics, your passport will be processed (10-15 business days)</li>
            <li style="margin-bottom: 8px;">You will be notified when your passport is ready for collection</li>
          </ul>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>Important:</strong> Please keep your reference number safe. You will need it to book your biometrics appointment and track your application status.
            </p>
          </div>
          
          <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
            You can track your application progress anytime by logging into your account at our website.
          </p>
          
          <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
            If you have any questions, please contact our support team.
          </p>
          
          <p style="color: #333; font-size: 16px;">
            Best regards,<br>
            <strong>Lesotho Passport Services Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `

    // In a real implementation, you would use SendGrid or another email service
    // For demo purposes, we'll just log the email content
    console.log(`Email sent to: ${email}`)
    console.log(`Subject: Passport Application Submitted - Reference: ${reference_number}`)
    console.log(`Content: ${emailContent}`)

    // Simulate successful email sending
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Confirmation email sent successfully',
        reference_number 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})