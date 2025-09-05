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
    const { application_id, status, recipient_email, recipient_phone } = await req.json()

    // In a real implementation, integrate with SMS/Email services
    // For demo purposes, we'll just log the notification

    const statusMessages = {
      submitted: 'Your passport application has been received and is being processed.',
      under_review: 'Your passport application is currently under review by our team.',
      approved: 'Great news! Your passport application has been approved.',
      ready_for_collection: 'Your passport is ready for collection. Please visit your selected collection point with valid ID.',
      collected: 'Your passport has been successfully collected. Thank you for using our service.',
      rejected: 'Unfortunately, your passport application has been rejected. Please contact our office for more details.'
    }

    const message = statusMessages[status as keyof typeof statusMessages] || 'Your application status has been updated.'

    // Simulate sending notifications
    console.log(`SMS to ${recipient_phone}: ${message}`)
    console.log(`Email to ${recipient_email}: ${message}`)

    // In production, you would:
    // - Use Twilio for SMS: await twilioClient.messages.create({...})
    // - Use SendGrid for Email: await sgMail.send({...})

    return new Response(
      JSON.stringify({ success: true, message: 'Notifications sent successfully' }),
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