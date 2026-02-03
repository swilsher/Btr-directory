import { Resend } from 'resend';

const NOTIFICATION_EMAIL = 'sam@montyspace.com';
const FROM_EMAIL = 'onboarding@resend.dev'; // Use verified domain sender after setup

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set!');
    return null;
  }
  return new Resend(apiKey);
}

export async function sendNewsletterSignupNotification(email: string, name?: string) {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    console.log('Sending newsletter notification email...');
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFICATION_EMAIL,
      subject: 'New Newsletter Signup - BTR Directory',
      text: `New newsletter subscriber!\n\nEmail: ${email}\nName: ${name || 'Not provided'}\n\nTime: ${new Date().toISOString()}`,
    });

    if (error) {
      console.error('Failed to send newsletter notification:', error);
      return { success: false, error };
    }

    console.log('Newsletter notification sent successfully:', data);
    return { success: true };
  } catch (error) {
    console.error('Failed to send newsletter notification:', error);
    return { success: false, error };
  }
}

export async function sendCorrectionRequestNotification(
  requestType: 'correction' | 'missing_site',
  userName: string,
  userEmail: string,
  message: string
) {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const typeLabel = requestType === 'correction' ? 'Error Report' : 'Missing Development Report';
    console.log('Sending correction notification email...');

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFICATION_EMAIL,
      subject: `New ${typeLabel} - BTR Directory`,
      text: `New correction request received!\n\nType: ${typeLabel}\nFrom: ${userName} (${userEmail})\n\nDetails:\n${message}\n\nTime: ${new Date().toISOString()}`,
    });

    if (error) {
      console.error('Failed to send correction notification:', error);
      return { success: false, error };
    }

    console.log('Correction notification sent successfully:', data);
    return { success: true };
  } catch (error) {
    console.error('Failed to send correction notification:', error);
    return { success: false, error };
  }
}

export async function sendSupplierRequestNotification(
  companyName: string,
  category: string,
  website: string,
  contactName: string,
  contactEmail: string,
  contactPhone: string | null,
  description: string
) {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    console.log('Sending supplier notification email...');
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFICATION_EMAIL,
      subject: `New Supplier Submission - ${companyName}`,
      text: `New supplier submission received!\n\nCompany: ${companyName}\nCategory: ${category}\nWebsite: ${website}\n\nContact: ${contactName}\nEmail: ${contactEmail}\nPhone: ${contactPhone || 'Not provided'}\n\nDescription:\n${description}\n\nTime: ${new Date().toISOString()}`,
    });

    if (error) {
      console.error('Failed to send supplier notification:', error);
      return { success: false, error };
    }

    console.log('Supplier notification sent successfully:', data);
    return { success: true };
  } catch (error) {
    console.error('Failed to send supplier notification:', error);
    return { success: false, error };
  }
}
