import type { APIRoute } from 'astro';

export const prerender = false;

type WaitlistRateLimitEntry = {
  count: number;
  resetAt: number;
};

type WaitlistEnv = Record<string, string | undefined>;

type WaitlistHandlerOptions = {
  env?: WaitlistEnv;
  fetchImpl?: typeof fetch;
  now?: () => number;
  rateLimitStore?: Map<string, WaitlistRateLimitEntry>;
};

const WAITLIST_MAX_BODY_BYTES = 2048;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_EMAIL_RATE_LIMIT_MAX = 3;
const DEFAULT_IP_RATE_LIMIT_MAX = 10;
const DEFAULT_GLOBAL_RATE_LIMIT_MAX = 100;
const DEFAULT_WAITLIST_CLIENT_IP = 'direct:unknown';
const TRUSTED_CLIENT_IP_HEADERS = new Set([
  'cf-connecting-ip',
  'x-real-ip',
  'x-forwarded-for',
]);
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

const isEnvFlagEnabled = (value: string | undefined): boolean => {
  return value === 'true' || value === '1' || value === 'yes';
};

const normalizeClientIpCandidate = (value: string | null): string | null => {
  const normalized = value?.split(',')[0]?.trim();
  if (!normalized || normalized.length > 128) {
    return null;
  }

  return normalized;
};

const getClientIp = (request: Request, env: WaitlistEnv): string => {
  if (!isEnvFlagEnabled(env.WAITLIST_TRUST_PROXY)) {
    return DEFAULT_WAITLIST_CLIENT_IP;
  }

  const configuredHeader = (env.WAITLIST_CLIENT_IP_HEADER ?? 'cf-connecting-ip')
    .trim()
    .toLowerCase();
  const headerName = TRUSTED_CLIENT_IP_HEADERS.has(configuredHeader)
    ? configuredHeader
    : 'cf-connecting-ip';

  return normalizeClientIpCandidate(request.headers.get(headerName)) ?? 'proxy:unknown';
};

const cleanupExpiredRateLimits = (
  store: Map<string, WaitlistRateLimitEntry>,
  now: number
): void => {
  for (const [entryKey, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(entryKey);
    }
  }
};

const isRateLimited = (
  store: Map<string, WaitlistRateLimitEntry>,
  key: string,
  now: number,
  limit: number,
  windowMs: number
): boolean => {
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return false;
  }

  current.count += 1;
  return current.count > limit;
};

const readJsonBody = async (
  request: Request
): Promise<
  | { ok: true; body: unknown }
  | { ok: false; status: number; error: string }
> => {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > WAITLIST_MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: 'Request too large' };
  }

  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;

  if (!request.body) {
    text = await request.text();
    bytes = new TextEncoder().encode(text).byteLength;
    if (bytes > WAITLIST_MAX_BODY_BYTES) {
      return { ok: false, status: 413, error: 'Request too large' };
    }
  } else {
    const reader = request.body.getReader();
    try {
      while (true) {
        const readResult = await reader.read();
        if (readResult.done) {
          text += decoder.decode();
          break;
        }

        bytes += readResult.value.byteLength;
        if (bytes > WAITLIST_MAX_BODY_BYTES) {
          await reader.cancel('waitlist_body_limit_exceeded').catch(() => undefined);
          return { ok: false, status: 413, error: 'Request too large' };
        }

        text += decoder.decode(readResult.value, { stream: true });
      }
    } finally {
      reader.releaseLock();
    }
  }

  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON body' };
  }
};

const isWaitlistRateLimited = (
  store: Map<string, WaitlistRateLimitEntry>,
  request: Request,
  env: WaitlistEnv,
  normalizedEmail: string,
  now: number
): boolean => {
  cleanupExpiredRateLimits(store, now);

  const legacyLimit = parsePositiveInteger(
    env.WAITLIST_RATE_LIMIT_MAX,
    DEFAULT_EMAIL_RATE_LIMIT_MAX
  );
  const rateLimitWindowMs = parsePositiveInteger(
    env.WAITLIST_RATE_LIMIT_WINDOW_MS,
    DEFAULT_RATE_LIMIT_WINDOW_MS
  );
  const emailLimitMax = parsePositiveInteger(
    env.WAITLIST_RATE_LIMIT_EMAIL_MAX,
    legacyLimit
  );
  const ipLimitMax = parsePositiveInteger(
    env.WAITLIST_RATE_LIMIT_IP_MAX,
    DEFAULT_IP_RATE_LIMIT_MAX
  );
  const globalLimitMax = parsePositiveInteger(
    env.WAITLIST_RATE_LIMIT_GLOBAL_MAX,
    DEFAULT_GLOBAL_RATE_LIMIT_MAX
  );
  const clientIp = getClientIp(request, env);

  const checks = [
    { key: 'global', limit: globalLimitMax },
    { key: `ip:${clientIp}`, limit: ipLimitMax },
    { key: `email:${normalizedEmail}`, limit: emailLimitMax },
  ];

  return checks.some(({ key, limit }) => {
    return isRateLimited(store, key, now, limit, rateLimitWindowMs);
  });
};

export const createWaitlistPostHandler = (
  options: WaitlistHandlerOptions = {}
): APIRoute => {
  const env = options.env ?? (import.meta.env as WaitlistEnv);
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  const rateLimitStore = options.rateLimitStore ?? waitlistRateLimits;

  return async ({ request }) => {
    try {
      const parsedBody = await readJsonBody(request);
      if (!parsedBody.ok) {
        return jsonResponse({ error: parsedBody.error }, parsedBody.status);
      }

      const body = parsedBody.body;
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return jsonResponse({ error: 'Invalid JSON body' }, 400);
      }

      const { email, website } = body as { email?: unknown; website?: unknown };

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

      if (isWaitlistRateLimited(rateLimitStore, request, env, normalizedEmail, now())) {
        return jsonResponse({ error: 'Too many requests' }, 429);
      }

      const BREVO_API_KEY = env.BREVO_API_KEY;
      const BREVO_LIST_ID = env.BREVO_LIST_ID || '2';

      if (!BREVO_API_KEY) {
        console.error('BREVO_API_KEY not configured');
        return jsonResponse({ error: 'Server configuration error' }, 500);
      }

      const brevoListId = parseInt(BREVO_LIST_ID, 10);
      if (!Number.isFinite(brevoListId) || brevoListId <= 0) {
        console.error('BREVO_LIST_ID is invalid');
        return jsonResponse({ error: 'Server configuration error' }, 500);
      }

      const response = await fetchImpl('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify({
          email: normalizedEmail,
          listIds: [brevoListId],
          updateEnabled: false,
        }),
      });

      if (response.ok) {
        return jsonResponse({ success: true, message: "You're on the list!" }, 200);
      }

      const errorData = await response.json().catch(() => ({}));

      // If contact already exists, treat as success
      if (
        errorData &&
        typeof errorData === 'object' &&
        'code' in errorData &&
        errorData.code === 'duplicate_parameter'
      ) {
        return jsonResponse({ success: true, message: "You're already on the list!" }, 200);
      }

      console.error('Brevo waitlist registration failed', {
        status: response.status,
        code:
          errorData && typeof errorData === 'object' && 'code' in errorData
            ? errorData.code
            : 'unknown',
      });
      return jsonResponse({ error: 'Registration failed' }, 502);
    } catch (error) {
      console.error('Waitlist error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  };
};

export const POST = createWaitlistPostHandler();
