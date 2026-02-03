import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendSupplierRequestNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyName,
      category,
      website,
      contactName,
      contactEmail,
      contactPhone,
      description,
    } = body;

    if (!companyName || !category || !website || !contactName || !contactEmail || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert into database
    const { error: dbError } = await supabase
      .from('supplier_submissions')
      .insert([{
        company_name: companyName,
        category,
        website,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        description,
        status: 'pending',
      }]);

    if (dbError) {
      throw dbError;
    }

    // Send notification email
    await sendSupplierRequestNotification(
      companyName,
      category,
      website,
      contactName,
      contactEmail,
      contactPhone || null,
      description
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Supplier submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit your application. Please try again later.' },
      { status: 500 }
    );
  }
}
