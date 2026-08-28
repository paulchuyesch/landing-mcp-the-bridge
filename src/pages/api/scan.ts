import type { APIRoute } from "astro";
import { z } from "zod";
import { validateUrlForSSRF } from "../../lib/scanner/core/ssrfValidator.js";
import { MemoryRateLimiter } from "../../lib/scanner/core/rateLimiter.js";
import { runScanner } from "../../lib/scanner/core/orchestrator.js";
import type { AeoPublicScanResult } from "../../lib/scanner/core/schemas.js";

const rateLimiter = new MemoryRateLimiter(50, 3600 * 1000);
const scanCache = new Map<string, { data: AeoPublicScanResult; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;
const MAX_BODY_BYTES = 2048;
export const DEFAULT_ALLOWED_ORIGIN = "https://www.mcp-bridge.com";

export const prerender = false;

const BodySchema = z.object({ url: z.string().url("URL inválida") });

export const resolveAllowedOrigin = (
  configuredOrigin: string | undefined,
  vercelEnvironment: string | undefined,
  vercelUrl: string | undefined,
): string => {
  if (configuredOrigin) return configuredOrigin;

  // Preview deployments receive a unique Vercel hostname. Accept only that
  // deployment's own HTTPS hostname so the scanner remains testable in a PR
  // without allowing arbitrary Vercel projects.
  if (vercelEnvironment === "preview" && vercelUrl) {
    try {
      const previewOrigin = new URL(`https://${vercelUrl}`);
      if (previewOrigin.hostname.endsWith(".vercel.app")) return previewOrigin.origin;
    } catch {
      // Fall through to the canonical production origin.
    }
  }

  return DEFAULT_ALLOWED_ORIGIN;
};

type ScanHandlerOptions = {
  allowedOrigin?: string;
  allowLocalDevelopmentOrigins?: boolean;
  limiter?: MemoryRateLimiter;
  cache?: Map<string, { data: AeoPublicScanResult; timestamp: number }>;
  now?: () => number;
  runScannerImpl?: typeof runScanner;
  validateUrlImpl?: typeof validateUrlForSSRF;
};

const allowedRequestOrigin = (
  origin: string | null,
  productionOrigin: string,
  allowLocalDevelopmentOrigins: boolean,
): string | null => {
  if (origin === productionOrigin) return origin;
  if (allowLocalDevelopmentOrigins && origin && isLocalDevelopmentOrigin(origin)) return origin;
  return null;
};

const isLocalDevelopmentOrigin = (origin: string): boolean => {
  try {
    const parsed = new URL(origin);
    return parsed.protocol === "http:" && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");
  } catch {
    return false;
  }
};

const jsonResponse = (body: unknown, status: number, origin?: string): Response => {
  const headers = new Headers({ "Content-Type": "application/json", Vary: "Origin" });
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  return new Response(JSON.stringify(body), { status, headers });
};

const readJsonBody = async (request: Request): Promise<{ ok: true; body: unknown } | { ok: false; status: number; error: string }> => {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: "Solicitud demasiado grande" };
  }
  if (!request.body) return { ok: false, status: 400, error: "Payload JSON inválido" };

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) {
        text += decoder.decode();
        break;
      }
      bytes += result.value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel("scan_body_limit_exceeded").catch(() => undefined);
        return { ok: false, status: 413, error: "Solicitud demasiado grande" };
      }
      text += decoder.decode(result.value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, error: "Payload JSON inválido" };
  }
};

const pruneCache = (cache: Map<string, { data: AeoPublicScanResult; timestamp: number }>, now: number): void => {
  for (const [key, entry] of cache) {
    if (now - entry.timestamp >= CACHE_TTL_MS) cache.delete(key);
  }
  while (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (!oldest) break;
    cache.delete(oldest);
  }
};

export const createScanPostHandler = (options: ScanHandlerOptions = {}): APIRoute => {
  const allowedOrigin = options.allowedOrigin ?? resolveAllowedOrigin(
    import.meta.env?.SCAN_ALLOWED_ORIGIN,
    import.meta.env?.VERCEL_ENV,
    import.meta.env?.VERCEL_URL,
  );
  const allowLocalDevelopmentOrigins = options.allowLocalDevelopmentOrigins ?? import.meta.env?.DEV ?? false;
  const limiter = options.limiter ?? rateLimiter;
  const cache = options.cache ?? scanCache;
  const now = options.now ?? Date.now;
  const executeScanner = options.runScannerImpl ?? runScanner;
  const validateUrl = options.validateUrlImpl ?? validateUrlForSSRF;

  return async ({ request, clientAddress }) => {
    const responseOrigin = allowedRequestOrigin(request.headers.get("origin"), allowedOrigin, allowLocalDevelopmentOrigins);
    if (!responseOrigin) {
      return jsonResponse({ error: "Origen no autorizado" }, 403);
    }
    let ip = clientAddress || "127.0.0.1";
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) ip = forwarded.split(",")[0]?.trim() || ip;
    if (!limiter.checkLimit(ip)) {
      return jsonResponse({ error: "Límite de solicitudes excedido. Intenta de nuevo en una hora." }, 429, responseOrigin);
    }

    const rawBody = await readJsonBody(request);
    if (!rawBody.ok) return jsonResponse({ error: rawBody.error }, rawBody.status, responseOrigin);
    const parsed = BodySchema.safeParse(rawBody.body);
    if (!parsed.success) return jsonResponse({ error: parsed.error.issues[0]?.message || "URL inválida" }, 400, responseOrigin);

    let targetUrl: string;
    try {
      targetUrl = await validateUrl(parsed.data.url);
    } catch {
      return jsonResponse({ error: "La URL proporcionada no está permitida o no se puede resolver de forma segura." }, 400, responseOrigin);
    }

    const currentTime = now();
    pruneCache(cache, currentTime);
    const cached = cache.get(targetUrl);
    if (cached?.data.accessBlocked) {
      // Do not serve a stale access denial left by an older scanner request.
      cache.delete(targetUrl);
    } else if (cached) {
      return jsonResponse(cached.data, 200, responseOrigin);
    }

    try {
      const result = await executeScanner(targetUrl);
      // A blocked response is not a valid score and must not remain cached for
      // an hour after the storefront becomes reachable again.
      if (!result.accessBlocked) {
        cache.set(targetUrl, { data: result, timestamp: currentTime });
      }
      return jsonResponse(result, 200, responseOrigin);
    } catch {
      return jsonResponse({ error: "No pudimos analizar esta tienda de forma segura." }, 502, responseOrigin);
    }
  };
};

export const POST = createScanPostHandler();

export const OPTIONS: APIRoute = async ({ request }) => {
  const allowedOrigin = resolveAllowedOrigin(
    import.meta.env?.SCAN_ALLOWED_ORIGIN,
    import.meta.env?.VERCEL_ENV,
    import.meta.env?.VERCEL_URL,
  );
  const responseOrigin = allowedRequestOrigin(request.headers.get("origin"), allowedOrigin, import.meta.env?.DEV ?? false);
  if (!responseOrigin) {
    return new Response(null, { status: 403, headers: { Vary: "Origin" } });
  }
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": responseOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
    },
  });
};
