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

    // Email content for approval
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0066cc; margin-bottom: 10px;">Lesotho Passport Services</h1>
          <h2 style="color: #16a34a; margin-bottom: 20px;">🎉 Application Approved!</h2>
        </div>
        
        <div style="background-color: #f0fdf4; border: 2px solid #16a34a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #333; font-size: 16px; margin-bottom: 15px;">Dear ${name},</p>
          
          <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
            <strong>Congratulations!</strong> Your passport application has been approved and is ready for the next step.
          </p>
          
          <div style="background-color: #dcfce7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #16a34a; font-weight: bold; margin: 0; font-size: 18px;">
              Reference Number: ${reference_number}
            </p>
          </div>
          
          <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
            <strong>Next Steps - Biometrics Appointment:</strong>
          </p>
          
          <ol style="color: #333; font-size: 16px; margin-bottom: 20px; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Log into your account on our website</li>
            <li style="margin-bottom: 8px;">Click "Book Biometrics Appointment" in your dashboard</li>
            <li style="margin-bottom: 8px;">Enter your reference number: <strong>${reference_number}</strong></li>
            <li style="margin-bottom: 8px;">Select your preferred date and time</li>
            <li style="margin-bottom: 8px;">Attend your appointment with valid ID</li>
          </ol>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>Important:</strong> You must complete your biometrics appointment within 30 days of this approval. 
              Failure to do so may result in your application being cancelled.
            </p>
          </div>
          
          <div style="background-color: #e0f2fe; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #0277bd; margin: 0; font-size: 14px;">
              <strong>What to bring to your biometrics appointment:</strong><br>
              • Original National ID or Birth Certificate<br>
              • This approval email (printed or on your phone)<br>
              • Your reference number: ${reference_number}
            </p>
          </div>
          
          <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
            After completing your biometrics, your passport will be processed and you'll be notified when it's ready for collection.
          </p>
          
          <p style="color: #333; font-size: 16px;">
            Thank you for choosing our digital passport services!<br>
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
    console.log(`Approval email sent to: ${email}`)
    console.log(`Subject: Passport Application Approved - Book Your Biometrics Appointment`)
    console.log(`Content: ${emailContent}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Approval email sent successfully',
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