import { NextRequest, NextResponse } from 'next/server';
import { sendContactFormAdmin, sendContactFormAutoReply } from '@/lib/email/sendgrid';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 },
      );
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 },
      );
    }

    const data = {
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    };

    // Send admin notification
    const adminResult = await sendContactFormAdmin(data);
    if (!adminResult.success) {
      console.error('[Contact] Admin email failed:', adminResult.error);
      return NextResponse.json(
        { error: 'Failed to send message. Please try again later.' },
        { status: 500 },
      );
    }

    // Send auto-reply (best-effort — don't fail the request if this fails)
    const replyResult = await sendContactFormAutoReply(data);
    if (!replyResult.success) {
      console.error('[Contact] Auto-reply failed:', replyResult.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Contact] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 },
    );
  }
}
