export interface BotAccessMetrics {
  hasRobotsTxt: boolean;
  hasSitemapXml: boolean;
}

export class BotAccessEvaluatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BotAccessEvaluatorError";
  }
}

/**
 * Checks for the existence of /robots.txt and /sitemap.xml
 * by doing a lightweight GET request and immediately cancelling the body stream.
 */
export async function evaluateBotAccess(baseUrl: string, signal?: AbortSignal): Promise<BotAccessMetrics> {
  const metrics: BotAccessMetrics = {
    hasRobotsTxt: false,
    hasSitemapXml: false,
  };

  let rootUrl: string;
  try {
    const parsed = new URL(baseUrl);
    rootUrl = parsed.origin;
  } catch (err: any) {
    throw new BotAccessEvaluatorError(`Invalid base URL provided: ${err.message}`);
  }

  const checkEndpoint = async (endpoint: string): Promise<boolean> => {
    try {
      const response = await safePublicGet(`${rootUrl}${endpoint}`, {
        accept: "text/plain,application/xml",
        signal,
      });

      // We only care about the headers, so cancel the body immediately to save bandwidth
      discardPublicBody(response);
      return response.status >= 200 && response.status < 300;
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw err; // Always re-throw aborts to allow the wrapper to timeout the process
      }
      // If network fails (e.g. timeout, DNS issue) assume it doesn't have the file
      return false;
    }
  };

  // Run both checks concurrently
  const [robotsResult, sitemapResult] = await Promise.allSettled([
    checkEndpoint("/robots.txt"),
    checkEndpoint("/sitemap.xml")
  ]);

  // If either of them was rejected due to an AbortError, we must propagate it.
  if (robotsResult.status === "rejected" && robotsResult.reason?.name === "AbortError") {
    throw robotsResult.reason;
  }
  if (sitemapResult.status === "rejected" && sitemapResult.reason?.name === "AbortError") {
    throw sitemapResult.reason;
  }

  metrics.hasRobotsTxt = robotsResult.status === "fulfilled" ? robotsResult.value : false;
  metrics.hasSitemapXml = sitemapResult.status === "fulfilled" ? sitemapResult.value : false;

  return metrics;
}
import {
  discardPublicBody,
  safePublicGet,
} from "../core/safePublicRequest.js";
