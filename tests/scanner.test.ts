import assert from "node:assert/strict";
import { Readable } from "node:stream";
import test from "node:test";
import { createScanPostHandler, DEFAULT_ALLOWED_ORIGIN } from "../src/pages/api/scan.js";
import { MemoryRateLimiter } from "../src/lib/scanner/core/rateLimiter.js";
import { calculateScores } from "../src/lib/scanner/core/scoringEngine.js";
import { isExplicitAccessBlock } from "../src/lib/scanner/core/orchestrator.js";
import { assertSuccessfulPublicResponse, createPinnedPublicLookup, createPublicRequestHeaders, safePublicGet, SCANNER_USER_AGENT, type SafePublicResponse } from "../src/lib/scanner/core/safePublicRequest.js";
import { evaluateCatalog } from "../src/lib/scanner/evaluators/catalogEvaluator.js";
import { SSRFValidationError, resolvePublicUrl } from "../src/lib/scanner/core/ssrfValidator.js";
import { withTimeoutFallback } from "../src/lib/scanner/evaluators/withTimeout.js";
import { isBridgeConnected } from "../src/components/scanner/PillarCards.js";
import { GREEN_SCORE_THRESHOLD, hasMcpEnrichment, isGreenScore } from "../src/components/scanner/BridgeNextStep.js";

const allowedOrigin = DEFAULT_ALLOWED_ORIGIN;
const result = {
  url: "https://shop.example/",
  timestamp: "2026-08-27T00:00:00.000Z",
  totalScore: 0,
  pillars: [],
};

const requestForScan = (body: unknown, origin = allowedOrigin): Request => new Request("https://venore.app/api/scan", {
  method: "POST",
  headers: { "content-type": "application/json", origin },
  body: JSON.stringify(body),
});

void test("scanner rejects a foreign browser origin before resolving or scanning", async () => {
  let scannerCalls = 0;
  const handler = createScanPostHandler({
    allowedOrigin,
    runScannerImpl: (async () => {
      scannerCalls += 1;
      return result;
    }) as never,
    validateUrlImpl: (async () => result.url) as never,
    limiter: new MemoryRateLimiter(50),
    cache: new Map(),
  });
  const response = await handler({ request: requestForScan({ url: result.url }, "https://attacker.example") } as never) as Response;
  assert.equal(response.status, 403);
  assert.equal(scannerCalls, 0);
});

void test("scanner defaults to the canonical public landing origin", () => {
  assert.equal(DEFAULT_ALLOWED_ORIGIN, "https://www.mcp-bridge.com");
});

void test("scanner accepts Astro local development without allowing it in production", async () => {
  const developmentHandler = createScanPostHandler({
    allowedOrigin,
    allowLocalDevelopmentOrigins: true,
    runScannerImpl: (async () => result) as never,
    validateUrlImpl: (async () => result.url) as never,
    limiter: new MemoryRateLimiter(50),
    cache: new Map(),
  });
  const localResponse = await developmentHandler({ request: requestForScan({ url: result.url }, "http://localhost:4322") } as never) as Response;
  assert.equal(localResponse.status, 200);
  assert.equal(localResponse.headers.get("access-control-allow-origin"), "http://localhost:4322");

  const productionHandler = createScanPostHandler({
    allowedOrigin,
    allowLocalDevelopmentOrigins: false,
    runScannerImpl: (async () => result) as never,
    validateUrlImpl: (async () => result.url) as never,
    limiter: new MemoryRateLimiter(50),
    cache: new Map(),
  });
  const productionResponse = await productionHandler({ request: requestForScan({ url: result.url }, "http://localhost:4322") } as never) as Response;
  assert.equal(productionResponse.status, 403);
});

void test("scanner rejects an unsafe URL before it reaches the scanner", async () => {
  let scannerCalls = 0;
  const handler = createScanPostHandler({
    allowedOrigin,
    runScannerImpl: (async () => {
      scannerCalls += 1;
      return result;
    }) as never,
    validateUrlImpl: (async () => {
      throw new SSRFValidationError("private destination");
    }) as never,
    limiter: new MemoryRateLimiter(50),
    cache: new Map(),
  });
  const response = await handler({ request: requestForScan({ url: "http://127.0.0.1/" }) } as never) as Response;
  assert.equal(response.status, 400);
  assert.equal(scannerCalls, 0);
});

void test("public URL resolution rejects a private answer and preserves a public one", async () => {
  await assert.rejects(
    resolvePublicUrl("https://shop.example", async () => [{ address: "127.0.0.1", family: 4 }]),
    SSRFValidationError,
  );
  const resolved = await resolvePublicUrl("https://shop.example/catalog", async () => [{ address: "8.8.8.8", family: 4 }]);
  assert.equal(resolved.address, "8.8.8.8");
  assert.equal(resolved.url.hostname, "shop.example");
});

void test("safe public response rejects redirects instead of following them", () => {
  const response: SafePublicResponse = {
    status: 302,
    headers: { location: "http://127.0.0.1/" },
    body: Readable.from([]) as never,
  };
  assert.throws(() => assertSuccessfulPublicResponse(response, "test"));
});

void test("scanner identifies outbound requests without imitating a browser", () => {
  assert.deepEqual(createPublicRequestHeaders("text/html"), {
    Accept: "text/html",
    "User-Agent": SCANNER_USER_AGENT,
  });
  assert.match(SCANNER_USER_AGENT, /^MCP-Bridge-AEO-Scanner\/1\.0/);
});

void test("catalog falls back to public product links when a Woo-only route is denied", async () => {
  const requestedUrls: string[] = [];
  const publicGet = (async (url: string) => {
    requestedUrls.push(url);
    if (url.includes("/wp-json/wc/store/v1/products")) {
      return { status: 403, headers: {}, body: Readable.from([]) } as SafePublicResponse;
    }
    return {
      status: 200,
      headers: {},
      body: Readable.from([
        '<a href="/p/mochila">Mochila</a>',
        '<a href="https://shop.example/products/casaca">Casaca</a>',
        '<a href="https://outside.example/products/ajeno">Ajeno</a>',
      ]),
    } as SafePublicResponse;
  }) as typeof safePublicGet;

  const catalog = await evaluateCatalog("https://shop.example/", undefined, publicGet);
  assert.equal(requestedUrls.length, 2);
  assert.equal(catalog.totalProducts, 2);
  assert.equal(catalog.firstProductUrl, "https://shop.example/p/mochila");
});

void test("pinned DNS lookup returns the validated IP in both Node lookup modes", () => {
  const lookup = createPinnedPublicLookup("8.8.8.8", 4);
  let singleResult: unknown[] = [];
  lookup("shop.example", {}, (...result) => {
    singleResult = result;
  });
  assert.deepEqual(singleResult, [null, "8.8.8.8", 4]);

  let allResult: unknown[] = [];
  lookup("shop.example", { all: true }, (...result) => {
    allResult = result;
  });
  assert.deepEqual(allResult, [null, [{ address: "8.8.8.8", family: 4 }]]);
});

void test("a parent deadline aborts an evaluator and returns its safe fallback", async () => {
  const parent = new AbortController();
  const wrapped = withTimeoutFallback(async (_url: string, signal?: AbortSignal) => {
    if (signal?.aborted) throw signal.reason;
    await new Promise<void>((_resolve, reject) => {
      signal?.addEventListener("abort", () => reject(signal.reason), { once: true });
    });
    return "unreachable";
  }, "fallback", 5000);
  parent.abort(new Error("global deadline"));
  assert.equal(await wrapped("https://shop.example", parent.signal), "fallback");
});

void test("scanner marks explicit access denials without treating ordinary failures as blocks", async () => {
  let capturedFailure: unknown;
  const wrapped = withTimeoutFallback(async () => {
    throw new Error("Store API returned HTTP status 403");
  }, "fallback", 5000, (error) => {
    capturedFailure = error;
  });

  assert.equal(await wrapped("https://shop.example"), "fallback");
  assert.equal(isExplicitAccessBlock(capturedFailure), true);
  assert.equal(isExplicitAccessBlock(new Error("Store API returned HTTP status 404")), false);
  assert.equal(isExplicitAccessBlock(new Error("Network timeout")), false);
});

void test("scanner does not cache results that were marked as blocked", async () => {
  let scannerCalls = 0;
  const blockedResult = { ...result, accessBlocked: true };
  const handler = createScanPostHandler({
    allowedOrigin,
    runScannerImpl: (async () => {
      scannerCalls += 1;
      return blockedResult;
    }) as never,
    validateUrlImpl: (async () => result.url) as never,
    limiter: new MemoryRateLimiter(50),
    cache: new Map(),
  });

  const firstResponse = await handler({ request: requestForScan({ url: result.url }) } as never) as Response;
  const secondResponse = await handler({ request: requestForScan({ url: result.url }) } as never) as Response;

  assert.equal(firstResponse.status, 200);
  assert.equal(secondResponse.status, 200);
  assert.equal(scannerCalls, 2);
});

void test("scanner discards a previously cached blocked result before retrying", async () => {
  let scannerCalls = 0;
  const cache = new Map([[result.url, { data: { ...result, accessBlocked: true }, timestamp: Date.now() }]]);
  const handler = createScanPostHandler({
    allowedOrigin,
    runScannerImpl: (async () => {
      scannerCalls += 1;
      return result;
    }) as never,
    validateUrlImpl: (async () => result.url) as never,
    limiter: new MemoryRateLimiter(50),
    cache,
  });

  const response = await handler({ request: requestForScan({ url: result.url }) } as never) as Response;

  assert.equal(response.status, 200);
  assert.equal(scannerCalls, 1);
  assert.equal(cache.get(result.url)?.data.accessBlocked, undefined);
});

void test("score contract includes the MCP enrichment pillar in the total", () => {
  const pillars = calculateScores({
    catalog: { totalProducts: 0, productsWithImages: 0, productsWithPrice: 0, productsWithDescription: 0, productsWithCategories: 0, firstProductUrl: null },
    semantics: { hasJsonLd: false, hasOpenGraph: false },
    speed: { ttfbMs: 0, totalTimeMs: 0 },
    botAccess: { hasRobotsTxt: false, hasSitemapXml: false },
  });
  assert.equal(pillars.length, 5);
  assert.deepEqual(pillars.at(0), {
    pillar: "ai_enrichment",
    score: 0,
    maxScore: 25,
    checks: [{
      id: "requires_mcp_protocol",
      passed: false,
      details: "Requiere exponer endpoints estructurados (MCP) o un archivo llm.txt/ai-instructions.",
    }],
  });
});

void test("public results keep unavailable AI enrichment in its locked state", () => {
  const pillars = calculateScores({
    catalog: { totalProducts: 0, productsWithImages: 0, productsWithPrice: 0, productsWithDescription: 0, productsWithCategories: 0, firstProductUrl: null },
    semantics: { hasJsonLd: false, hasOpenGraph: false },
    speed: { ttfbMs: 0, totalTimeMs: 0 },
    botAccess: { hasRobotsTxt: false, hasSitemapXml: false },
  });
  assert.equal(pillars.length, 5);
  assert.equal(isBridgeConnected(pillars), false);
  assert.equal(isBridgeConnected(pillars.map((pillar) =>
    pillar.pillar === "ai_enrichment" ? { ...pillar, score: 25 } : pillar,
  )), true);
});

void test("green result CTA starts at 80 without changing score thresholds", () => {
  assert.equal(GREEN_SCORE_THRESHOLD, 80);
  assert.equal(isGreenScore(79), false);
  assert.equal(isGreenScore(80), true);
  assert.equal(isGreenScore(100), true);
});

void test("green result CTA only presents Bridge as the route to 100 when MCP is absent", () => {
  const withoutMcp = calculateScores({
    catalog: { totalProducts: 1, productsWithImages: 1, productsWithPrice: 1, productsWithDescription: 1, productsWithCategories: 1, firstProductUrl: "https://shop.example/product" },
    semantics: { hasJsonLd: true, hasOpenGraph: true, hasMcpBeacon: false },
    speed: { ttfbMs: 100, totalTimeMs: 500 },
    botAccess: { hasRobotsTxt: true, hasSitemapXml: true },
  });
  assert.equal(hasMcpEnrichment(withoutMcp), false);

  const withMcp = calculateScores({
    catalog: { totalProducts: 1, productsWithImages: 1, productsWithPrice: 1, productsWithDescription: 1, productsWithCategories: 1, firstProductUrl: "https://shop.example/product" },
    semantics: { hasJsonLd: true, hasOpenGraph: true, hasMcpBeacon: true },
    speed: { ttfbMs: 100, totalTimeMs: 500 },
    botAccess: { hasRobotsTxt: true, hasSitemapXml: true },
  });
  assert.equal(hasMcpEnrichment(withMcp), true);
});
