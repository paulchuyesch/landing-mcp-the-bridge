import {
  assertSuccessfulPublicResponse,
  readPublicBody,
  readPublicBodyPrefix,
  safePublicGet,
} from "../core/safePublicRequest.js";

export interface CatalogMetrics {
  totalProducts: number;
  productsWithImages: number;
  productsWithPrice: number;
  productsWithDescription: number;
  productsWithCategories: number;
  firstProductUrl: string | null;
}

export class CatalogEvaluatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogEvaluatorError";
  }
}

const MAX_CATALOG_BYTES = 512 * 1024;
const MAX_GENERIC_HTML_BYTES = 100 * 1024;
const MAX_GENERIC_PRODUCTS = 10;
const PRODUCT_PATH = /^\/(?:p|products?)\/[^/]+/i;

const emptyCatalogMetrics = (): CatalogMetrics => ({
  totalProducts: 0,
  productsWithImages: 0,
  productsWithPrice: 0,
  productsWithDescription: 0,
  productsWithCategories: 0,
  firstProductUrl: null,
});

export function extractGenericProductUrls(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const urls = new Set<string>();
  const anchorPattern = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(html)) && urls.size < MAX_GENERIC_PRODUCTS) {
    try {
      const candidate = new URL(match[1], base);
      if (candidate.origin === base.origin && PRODUCT_PATH.test(candidate.pathname)) {
        candidate.hash = "";
        urls.add(candidate.toString());
      }
    } catch {
      // Ignore malformed hrefs; they are not evidence of a product page.
    }
  }

  return [...urls];
}

async function evaluateGenericCatalog(
  baseUrl: string,
  signal: AbortSignal | undefined,
  publicGet: typeof safePublicGet,
): Promise<CatalogMetrics> {
  let response;
  try {
    response = await publicGet(baseUrl, {
      accept: "text/html,application/xhtml+xml",
      signal,
    });
    assertSuccessfulPublicResponse(response, "Generic catalog page");
    const html = (await readPublicBodyPrefix(response, MAX_GENERIC_HTML_BYTES)).toString("utf8");
    const productUrls = extractGenericProductUrls(html, baseUrl);
    return {
      ...emptyCatalogMetrics(),
      totalProducts: productUrls.length,
      firstProductUrl: productUrls[0] ?? null,
    };
  } catch (err: any) {
    if (err.name === "AbortError") throw err;
    throw new CatalogEvaluatorError(`Network error while fetching generic catalog: ${err.message}`);
  }
}

/**
 * Extracts catalog signals from WooCommerce when available and otherwise from
 * product links exposed in the store's own public HTML.
 */
export async function evaluateCatalog(
  baseUrl: string,
  signal?: AbortSignal,
  publicGet: typeof safePublicGet = safePublicGet,
): Promise<CatalogMetrics> {
  let targetUrl: URL;
  try {
    targetUrl = new URL(baseUrl);
    targetUrl.pathname = "/wp-json/wc/store/v1/products";
    targetUrl.search = "";
    targetUrl.searchParams.set("per_page", "10");
  } catch (err) {
    throw new CatalogEvaluatorError("Invalid base URL provided.");
  }

  let response;
  try {
    response = await publicGet(targetUrl.toString(), {
      accept: "application/json",
      signal,
    });
    assertSuccessfulPublicResponse(response, "Store API");
  } catch (err: any) {
    if (err.name === "AbortError") throw err;
    return evaluateGenericCatalog(baseUrl, signal, publicGet);
  }

  let data: any;
  try {
    data = JSON.parse((await readPublicBody(response, MAX_CATALOG_BYTES)).toString("utf8"));
  } catch (err) {
    return evaluateGenericCatalog(baseUrl, signal, publicGet);
  }

  if (!Array.isArray(data)) {
    return evaluateGenericCatalog(baseUrl, signal, publicGet);
  }

  const metrics: CatalogMetrics = { ...emptyCatalogMetrics(), totalProducts: data.length };

  if (data.length > 0 && typeof data[0].permalink === "string") {
    const firstProductUrl = new URL(data[0].permalink);
    if (firstProductUrl.origin === new URL(baseUrl).origin) {
      metrics.firstProductUrl = firstProductUrl.toString();
    }
  }

  for (const product of data) {
    // Check images
    if (Array.isArray(product.images) && product.images.length > 0) {
      metrics.productsWithImages += 1;
    }

    // Check price
    if (product.prices && typeof product.prices.price === "string" && product.prices.price.length > 0) {
      metrics.productsWithPrice += 1;
    } else if (typeof product.price === "string" && product.price.length > 0) {
      // Fallback in case of custom schema overriding v1
      metrics.productsWithPrice += 1;
    }

    // Check description
    const hasLongDesc = typeof product.description === "string" && product.description.trim().length > 0;
    const hasShortDesc = typeof product.short_description === "string" && product.short_description.trim().length > 0;
    if (hasLongDesc || hasShortDesc) {
      metrics.productsWithDescription += 1;
    }

    // Check categories
    if (Array.isArray(product.categories) && product.categories.length > 0) {
      metrics.productsWithCategories += 1;
    }
  }

  return metrics;
}
