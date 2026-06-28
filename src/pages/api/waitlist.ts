import type { APIRoute } from 'astro';

export const prerender = false;

type WaitlistRateLimitEntry = {
  count: number;
  resetAt: number;
};

const WAITLIST_MAX_BODY_BYTES = 2048;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX = 3;
const waitlistRateLimits = new Map<string, WaitlistRateLimitEntry>();

const jsonResponse = (body: unknown, status: number): Response => {
  return new Response(
    JSON.stringify(body),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
};

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
};

const getClientIp = (request: Request): string => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
};

const isRateLimited = (key: string, now: number, limit: number, windowMs: number): boolean => {
  for (const [entryKey, entry] of waitlistRateLimits.entries()) {
    if (entry.resetAt <= now) {
      waitlistRateLimits.delete(entryKey);
    }
  }

  const current = waitlistRateLimits.get(key);
  if (!current || current.resetAt <= now) {
    waitlistRateLimits.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return false;
  }

  current.count += 1;
  return current.count > limit;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentLength = Number(request.headers.get('content-length') ?? '0');
    if (Number.isFinite(contentLength) && contentLength > WAITLIST_MAX_BODY_BYTES) {
      return jsonResponse({ error: 'Request too large' }, 413);
    }

    const body = await request.json();
    const { email, website } = body;

    if (typeof website === 'string' && website.trim().length > 0) {
      return jsonResponse({ error: 'Registration failed' }, 400);
    }

    // Input validation
    if (!email || typeof email !== 'string') {
      return jsonResponse({ error: 'Email is required' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Email validation (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return jsonResponse({ error: 'Invalid email format' }, 400);
    }

    // Length validation
    if (normalizedEmail.length > 254) {
      return jsonResponse({ error: 'Email too long' }, 400);
    }

    const rateLimitMax = parsePositiveInteger(
      import.meta.env.WAITLIST_RATE_LIMIT_MAX,
      DEFAULT_RATE_LIMIT_MAX
    );
    const rateLimitWindowMs = parsePositiveInteger(
      import.meta.env.WAITLIST_RATE_LIMIT_WINDOW_MS,
      DEFAULT_RATE_LIMIT_WINDOW_MS
    );
    const rateLimitKey = `${getClientIp(request)}:${normalizedEmail}`;
    if (isRateLimited(rateLimitKey, Date.now(), rateLimitMax, rateLimitWindowMs)) {
      return jsonResponse({ error: 'Too many requests' }, 429);
    }

    const BREVO_API_KEY = import.meta.env.BREVO_API_KEY;
    const BREVO_LIST_ID = import.meta.env.BREVO_LIST_ID || '2';

    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY not configured');
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    const brevoListId = parseInt(BREVO_LIST_ID, 10);
    if (!Number.isFinite(brevoListId) || brevoListId <= 0) {
      console.error('BREVO_LIST_ID is invalid');
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        email: normalizedEmail,
        listIds: [brevoListId],
        updateEnabled: true,
      }),
    });

    if (response.ok) {
      return jsonResponse({ success: true, message: "You're on the list!" }, 200);
    }

    const errorData = await response.json();

    // If contact already exists, treat as success
    if (errorData.code === 'duplicate_parameter') {
      return jsonResponse({ success: true, message: "You're already on the list!" }, 200);
    }

    return jsonResponse({ error: errorData.message || 'Registration failed' }, response.status);
  } catch (error) {
    console.error('Waitlist error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
};
