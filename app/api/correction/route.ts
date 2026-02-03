import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendCorrectionRequestNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestType, userName, userEmail, developmentName, message } = body;

    if (!requestType || !userName || !userEmail || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build the message with development name if provided
    const fullMessage = requestType === 'missing_site' && developmentName
      ? `Development Name: ${developmentName}\n\n${message}`
      : message;

    // Insert into database
    const { error: dbError } = await supabase
      .from('correction_requests')
      .insert([{
        request_type: requestType,
        user_name: userName,
        user_email: userEmail,
        message: fullMessage,
        status: 'pending',
      }]);

    if (dbError) {
      throw dbError;
    }

    // Send notification email
    console.log('Attempting to send correction notification...');
    const emailResult = await sendCorrectionRequestNotification(requestType, userName, userEmail, fullMessage);
    console.log('Email result:', emailResult);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Correction submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit your request. Please try again later.' },
      { status: 500 }
    );
  }
}
