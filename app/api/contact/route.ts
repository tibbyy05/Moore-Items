import { NextRequest, NextResponse } from 'next/server';
import { sendContactFormAdmin, sendContactFormAutoReply } from '@/lib/email/sendgrid';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const contactRateLimiter = new Map<string, number[]>();

const emailRateLimit = new Map<string, { count: number; resetAt: number }>();

function looksLegit(str: string): boolean {
  return /[a-z]{4,}/i.test(str);
}

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    const now = Date.now();
    const windowMs = 60 * 60 * 1000;
    const maxRequests = 3;

    const timestamps = contactRateLimiter.get(ip) ?? [];
    const recent = timestamps.filter((t) => now - t < windowMs);

    if (recent.length >= maxRequests) {
      return NextResponse.json(
        { error: 'Too many messages sent. Please wait before sending another.' },
        { status: 429 }
      );
    }

    recent.push(now);
    contactRateLimiter.set(ip, recent);

    // Cleanup: remove IPs with no recent activity to prevent memory leak
    if (contactRateLimiter.size > 500) {
      Array.from(contactRateLimiter.entries()).forEach(([key, times]) => {
        if (times.every((t) => now - t >= windowMs)) contactRateLimiter.delete(key);
      });
    }

    const body = await req.json();
    const { name, email, subject, message, website, formLoadedAt, cfTurnstileToken } = body;

    // --- Bot protection: honeypot ---
    if (website) {
      return NextResponse.json({ success: true });
    }

    // --- Bot protection: timing check ---
    if (typeof formLoadedAt === 'number' && now - formLoadedAt < 3000) {
      return NextResponse.json({ success: true });
    }

    // --- Bot protection: Cloudflare Turnstile ---
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${cfTurnstileToken}`,
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return NextResponse.json({ error: 'Bot verification failed' }, { status: 400 });
    }

    // --- Bot protection: gibberish detection ---
    if (
      !looksLegit(name ?? '') ||
      !looksLegit(subject ?? '') ||
      !looksLegit(message ?? '') ||
      (message ?? '').length < 10
    ) {
      return NextResponse.json({ success: true });
    }

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

    // --- Bot protection: email-based rate limit (2 per 24h) ---
    const emailKey = email.trim().toLowerCase();
    const emailWindow = 24 * 60 * 60 * 1000;
    const emailEntry = emailRateLimit.get(emailKey);

    if (emailEntry) {
      if (now < emailEntry.resetAt) {
        if (emailEntry.count >= 2) {
          return NextResponse.json(
            { error: 'Too many submissions from this email' },
            { status: 429 },
          );
        }
        emailEntry.count += 1;
      } else {
        emailRateLimit.set(emailKey, { count: 1, resetAt: now + emailWindow });
      }
    } else {
      emailRateLimit.set(emailKey, { count: 1, resetAt: now + emailWindow });
    }

    // Cleanup: remove expired email entries to prevent memory leak
    if (emailRateLimit.size > 1000) {
      Array.from(emailRateLimit.entries()).forEach(([key, entry]) => {
        if (now >= entry.resetAt) emailRateLimit.delete(key);
      });
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
