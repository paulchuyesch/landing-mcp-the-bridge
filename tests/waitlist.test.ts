import assert from 'node:assert/strict';
import test from 'node:test';
import { createWaitlistPostHandler } from '../src/pages/api/waitlist.js';

type TestEnv = Record<string, string | undefined>;

const baseEnv: TestEnv = {
  BREVO_API_KEY: 'brevo-test-key',
  BREVO_LIST_ID: '2',
  WAITLIST_RATE_LIMIT_WINDOW_MS: '60000',
  WAITLIST_RATE_LIMIT_GLOBAL_MAX: '100',
  WAITLIST_RATE_LIMIT_IP_MAX: '10',
  WAITLIST_RATE_LIMIT_EMAIL_MAX: '3',
};

const buildRequest = (
  body: unknown,
  headers: Record<string, string> = {}
): Request => {
  return new Request('https://landing.example/api/waitlist', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
};

const invokeWaitlist = async (options: {
  body: unknown;
  env?: TestEnv;
  headers?: Record<string, string>;
  fetchImpl?: typeof fetch;
  now?: () => number;
  store?: Map<string, { count: number; resetAt: number }>;
}): Promise<Response> => {
  const handler = createWaitlistPostHandler({
    env: {
      ...baseEnv,
      ...options.env,
    },
    fetchImpl:
      options.fetchImpl ??
      (() => Promise.resolve(new Response('{}', { status: 201 }))),
    now: options.now ?? (() => 1_000),
    rateLimitStore: options.store ?? new Map(),
  });

  return handler({
    request: buildRequest(options.body, options.headers),
  } as never) as Promise<Response>;
};

void test('waitlist rejects bodies over 2048 bytes before Brevo', async () => {
  let calls = 0;
  const response = await invokeWaitlist({
    body: {
      email: 'person@example.com',
      padding: 'x'.repeat(2200),
    },
    fetchImpl: (() => {
      calls += 1;
      return Promise.resolve(new Response('{}', { status: 201 }));
    }) as typeof fetch,
  });

  assert.equal(response.status, 413);
  assert.equal(calls, 0);
});

void test('waitlist honeypot rejects bot submissions before Brevo', async () => {
  let calls = 0;
  const response = await invokeWaitlist({
    body: {
      email: 'person@example.com',
      website: 'https://spam.example',
    },
    fetchImpl: (() => {
      calls += 1;
      return Promise.resolve(new Response('{}', { status: 201 }));
    }) as typeof fetch,
  });

  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

void test('waitlist direct requests do not trust spoofed forwarded headers', async () => {
  const store = new Map<string, { count: number; resetAt: number }>();
  let calls = 0;
  const fetchImpl = (() => {
    calls += 1;
    return Promise.resolve(new Response('{}', { status: 201 }));
  }) as typeof fetch;

  for (let index = 0; index < 2; index += 1) {
    const response = await invokeWaitlist({
      body: { email: `person-${index}@example.com` },
      headers: { 'x-forwarded-for': `203.0.113.${index}` },
      env: {
        WAITLIST_TRUST_PROXY: 'false',
        WAITLIST_RATE_LIMIT_IP_MAX: '2',
        WAITLIST_RATE_LIMIT_EMAIL_MAX: '10',
      },
      fetchImpl,
      store,
    });
    assert.equal(response.status, 200);
  }

  const blocked = await invokeWaitlist({
    body: { email: 'person-3@example.com' },
    headers: { 'x-forwarded-for': '203.0.113.200' },
    env: {
      WAITLIST_TRUST_PROXY: 'false',
      WAITLIST_RATE_LIMIT_IP_MAX: '2',
      WAITLIST_RATE_LIMIT_EMAIL_MAX: '10',
    },
    fetchImpl,
    store,
  });

  assert.equal(blocked.status, 429);
  assert.equal(calls, 2);
});

void test('waitlist blocks many emails from the same trusted client IP', async () => {
  const store = new Map<string, { count: number; resetAt: number }>();
  let calls = 0;
  const fetchImpl = (() => {
    calls += 1;
    return Promise.resolve(new Response('{}', { status: 201 }));
  }) as typeof fetch;

  for (let index = 0; index < 2; index += 1) {
    const response = await invokeWaitlist({
      body: { email: `shopper-${index}@example.com` },
      headers: { 'cf-connecting-ip': '198.51.100.10' },
      env: {
        WAITLIST_TRUST_PROXY: 'true',
        WAITLIST_RATE_LIMIT_IP_MAX: '2',
        WAITLIST_RATE_LIMIT_EMAIL_MAX: '10',
      },
      fetchImpl,
      store,
    });
    assert.equal(response.status, 200);
  }

  const blocked = await invokeWaitlist({
    body: { email: 'shopper-3@example.com' },
    headers: { 'cf-connecting-ip': '198.51.100.10' },
    env: {
      WAITLIST_TRUST_PROXY: 'true',
      WAITLIST_RATE_LIMIT_IP_MAX: '2',
      WAITLIST_RATE_LIMIT_EMAIL_MAX: '10',
    },
    fetchImpl,
    store,
  });

  assert.equal(blocked.status, 429);
  assert.equal(calls, 2);
});

void test('waitlist blocks the same email across many trusted client IPs', async () => {
  const store = new Map<string, { count: number; resetAt: number }>();
  let calls = 0;
  const fetchImpl = (() => {
    calls += 1;
    return Promise.resolve(new Response('{}', { status: 201 }));
  }) as typeof fetch;

  for (let index = 0; index < 2; index += 1) {
    const response = await invokeWaitlist({
      body: { email: 'same-person@example.com' },
      headers: { 'cf-connecting-ip': `198.51.100.${index}` },
      env: {
        WAITLIST_TRUST_PROXY: 'true',
        WAITLIST_RATE_LIMIT_IP_MAX: '10',
        WAITLIST_RATE_LIMIT_EMAIL_MAX: '2',
      },
      fetchImpl,
      store,
    });
    assert.equal(response.status, 200);
  }

  const blocked = await invokeWaitlist({
    body: { email: 'same-person@example.com' },
    headers: { 'cf-connecting-ip': '198.51.100.200' },
    env: {
      WAITLIST_TRUST_PROXY: 'true',
      WAITLIST_RATE_LIMIT_IP_MAX: '10',
      WAITLIST_RATE_LIMIT_EMAIL_MAX: '2',
    },
    fetchImpl,
    store,
  });

  assert.equal(blocked.status, 429);
  assert.equal(calls, 2);
});

void test('waitlist blocks globally before Brevo', async () => {
  const store = new Map<string, { count: number; resetAt: number }>();
  let calls = 0;
  const fetchImpl = (() => {
    calls += 1;
    return Promise.resolve(new Response('{}', { status: 201 }));
  }) as typeof fetch;

  for (let index = 0; index < 2; index += 1) {
    const response = await invokeWaitlist({
      body: { email: `global-${index}@example.com` },
      headers: { 'cf-connecting-ip': `198.51.100.${index}` },
      env: {
        WAITLIST_TRUST_PROXY: 'true',
        WAITLIST_RATE_LIMIT_GLOBAL_MAX: '2',
        WAITLIST_RATE_LIMIT_IP_MAX: '10',
        WAITLIST_RATE_LIMIT_EMAIL_MAX: '10',
      },
      fetchImpl,
      store,
    });
    assert.equal(response.status, 200);
  }

  const blocked = await invokeWaitlist({
    body: { email: 'global-3@example.com' },
    headers: { 'cf-connecting-ip': '198.51.100.200' },
    env: {
      WAITLIST_TRUST_PROXY: 'true',
      WAITLIST_RATE_LIMIT_GLOBAL_MAX: '2',
      WAITLIST_RATE_LIMIT_IP_MAX: '10',
      WAITLIST_RATE_LIMIT_EMAIL_MAX: '10',
    },
    fetchImpl,
    store,
  });

  assert.equal(blocked.status, 429);
  assert.equal(calls, 2);
});

void test('waitlist does not call Brevo without BREVO_API_KEY', async () => {
  let calls = 0;
  const response = await invokeWaitlist({
    body: { email: 'person@example.com' },
    env: { BREVO_API_KEY: undefined },
    fetchImpl: (() => {
      calls += 1;
      return Promise.resolve(new Response('{}', { status: 201 }));
    }) as typeof fetch,
  });

  assert.equal(response.status, 500);
  assert.equal(calls, 0);
});

void test('waitlist filters Brevo errors and does not update existing contacts', async () => {
  let requestBody: { updateEnabled?: boolean } | null = null;
  const response = await invokeWaitlist({
    body: { email: 'Person@Example.com' },
    fetchImpl: ((_input, init) => {
      requestBody = JSON.parse(String(init?.body));
      return Promise.resolve(
        new Response(
          JSON.stringify({
            code: 'bad_request',
            message: 'api-key brevo-test-key rejected',
          }),
          { status: 400 }
        )
      );
    }) as typeof fetch,
  });

  const payload = await response.json();

  assert.equal(response.status, 502);
  assert.equal(payload.error, 'Registration failed');
  assert.equal(requestBody?.updateEnabled, false);
});
