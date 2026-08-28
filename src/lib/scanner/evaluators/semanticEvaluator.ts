export interface SemanticMetrics {
  hasJsonLd: boolean;
  hasOpenGraph: boolean;
  hasMcpBeacon: boolean;
}

export class SemanticEvaluatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SemanticEvaluatorError";
  }
}

const MAX_BYTES = 100 * 1024; // 100KB

/**
 * Evaluates a product page for semantic metadata (JSON-LD and Open Graph)
 * by fetching at most 100KB of the HTML document.
 */
export async function evaluateSemantics(productUrl: string | null, signal?: AbortSignal): Promise<SemanticMetrics> {
  const metrics: SemanticMetrics = {
    hasJsonLd: false,
    hasOpenGraph: false,
    hasMcpBeacon: false,
  };

  if (!productUrl) {
    return metrics;
  }

  let response;
  try {
    response = await safePublicGet(productUrl, {
      accept: "text/html,application/xhtml+xml",
      signal,
    });
    assertSuccessfulPublicResponse(response, "Semantic fetch");
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw err;
    }
    throw new SemanticEvaluatorError(`Network error while fetching semantic data: ${err.message}`);
  }

  try {
    const htmlContent = (await readPublicBody(response, MAX_BYTES)).toString("utf8");
    metrics.hasJsonLd = /type\s*=\s*["']application\/ld\+json["']/i.test(htmlContent);
    metrics.hasOpenGraph = /<meta[^>]+property\s*=\s*["']og:[^>]+>/i.test(htmlContent);

    // Búsqueda agnóstica de estándares IA (No atada exclusivamente a "The Bridge")
    // Busca <link rel="alternate" type="application/mcp+json" ...> o <meta name="ai-instructions" ...>
    const hasMcpLink = /type\s*=\s*["']application\/mcp\+json["']/i.test(htmlContent);
    const hasAiInstructions = /name\s*=\s*["'](?:ai|llm)-instructions["']/i.test(htmlContent);

    metrics.hasMcpBeacon = hasMcpLink || hasAiInstructions;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw err; // Re-throw aborts from the wrapper
    }
    throw new SemanticEvaluatorError(`Error reading response body: ${err.message}`);
  }

  return metrics;
}
import {
  assertSuccessfulPublicResponse,
  readPublicBody,
  safePublicGet,
} from "../core/safePublicRequest.js";
