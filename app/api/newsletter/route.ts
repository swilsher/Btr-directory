import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendNewsletterSignupNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Insert into database
    const { error: dbError } = await supabase
      .from('newsletter_signups')
      .insert([{
        email,
        name: name || null,
        subscribed: true,
      }]);

    if (dbError) {
      if (dbError.code === '23505') {
        return NextResponse.json(
          { error: 'This email is already subscribed!' },
          { status: 409 }
        );
      }
      throw dbError;
    }

    // Send notification email
    console.log('Attempting to send newsletter notification...');
    const emailResult = await sendNewsletterSignupNotification(email, name);
    console.log('Email result:', emailResult);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again later.' },
      { status: 500 }
    );
  }
}
