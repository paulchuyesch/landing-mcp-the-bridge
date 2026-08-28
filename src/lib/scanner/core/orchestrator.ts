import { validateUrlForSSRF } from "./ssrfValidator.js";
import { withTimeoutFallback } from "../evaluators/withTimeout.js";
import { evaluateCatalog, type CatalogMetrics } from "../evaluators/catalogEvaluator.js";
import { evaluateSemantics, type SemanticMetrics } from "../evaluators/semanticEvaluator.js";
import { evaluateSpeed, type SpeedMetrics } from "../evaluators/speedEvaluator.js";
import { evaluateBotAccess, type BotAccessMetrics } from "../evaluators/botAccessEvaluator.js";
import { calculateScores } from "./scoringEngine.js";
import { injectRecommendations } from "./recommendationEngine.js";
import type { AeoPublicScanResult } from "./schemas.js";

export class OrchestratorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrchestratorError";
  }
}

export interface RawScanData {
  catalog: CatalogMetrics;
  semantics: SemanticMetrics;
  speed: SpeedMetrics;
  botAccess: BotAccessMetrics;
}

const ACCESS_BLOCK_STATUS_PATTERN = /HTTP status (?:401|403|429)\b/;

export const isExplicitAccessBlock = (error: unknown): boolean =>
  error instanceof Error && ACCESS_BLOCK_STATUS_PATTERN.test(error.message);

export async function runScanner(targetUrl: string, globalTimeoutMs: number = 8000): Promise<AeoPublicScanResult> {
  const globalController = new AbortController();
  const globalTimeout = setTimeout(() => {
    globalController.abort(new Error(`Scanner deadline exceeded after ${globalTimeoutMs}ms`));
  }, globalTimeoutMs);

  try {
  // 1. SSRF Validation
  try {
    const isSafe = await validateUrlForSSRF(targetUrl, globalController.signal);
    if (!isSafe) {
      throw new Error("Blocked by SSRF Policy");
    }
  } catch (err: any) {
    throw new OrchestratorError(`URL validation failed: ${err.message}`);
  }

  // 2. Wrap Evaluators
  // Fallbacks preserve availability, but an access denial to the page or the
  // catalog means the resulting zeros are not a real score.
  const blockedEssentialResources = new Set<"site" | "catalog">();
  const recordAccessBlock = (resource: "site" | "catalog") => (error: unknown): void => {
    if (isExplicitAccessBlock(error)) blockedEssentialResources.add(resource);
  };

  const catalogSafe = withTimeoutFallback<CatalogMetrics, string>(evaluateCatalog, {
    totalProducts: 0,
    productsWithPrice: 0,
    productsWithDescription: 0,
    productsWithImages: 0,
    productsWithCategories: 0,
    firstProductUrl: null
  }, globalTimeoutMs, recordAccessBlock("catalog"));

  const speedSafe = withTimeoutFallback<SpeedMetrics, string>(evaluateSpeed, {
    ttfbMs: 0,
    totalTimeMs: 0
  }, globalTimeoutMs, recordAccessBlock("site"));

  const botSafe = withTimeoutFallback<BotAccessMetrics, string>(evaluateBotAccess, {
    hasRobotsTxt: false,
    hasSitemapXml: false
  }, globalTimeoutMs);

  const semanticSafe = withTimeoutFallback<SemanticMetrics, string | null>(evaluateSemantics, {
    hasJsonLd: false,
    hasOpenGraph: false,
    hasMcpBeacon: false
  }, globalTimeoutMs);

  // 3. Concurrent Execution
  const speedPromise = speedSafe(targetUrl, globalController.signal);
  const botAccessPromise = botSafe(targetUrl, globalController.signal);
  const catalogPromise = catalogSafe(targetUrl, globalController.signal);

  const semanticPromise = catalogPromise.then(catalogRes => {
    return semanticSafe(catalogRes.firstProductUrl, globalController.signal);
  });

  // 4. Aggregation
  const [speed, botAccess, catalog, semantics] = await Promise.all([
    speedPromise,
    botAccessPromise,
    catalogPromise,
    semanticPromise
  ]);

  const rawData: RawScanData = { catalog, semantics, speed, botAccess };

  // 5. Scoring & Recommendations
  const scoredPillars = calculateScores(rawData);
  const finalPillars = injectRecommendations(scoredPillars);

  const rawTotalScore = finalPillars.reduce((acc, pillar) => acc + pillar.score, 0);
  const rawMaxScore = finalPillars.reduce((acc, pillar) => acc + pillar.maxScore, 0);

  // Rule of three: (score / max) * 100
  // If max is 100 (no plugin), it's just rawTotalScore.
  // If max is 125 (plugin detected), it scales down gracefully to 100.
  const totalScore = rawMaxScore > 0 ? Math.round((rawTotalScore / rawMaxScore) * 100) : 0;

  return {
    url: targetUrl,
    timestamp: new Date().toISOString(),
    totalScore,
    pillars: finalPillars,
    isSlow: globalController.signal.aborted || speed.totalTimeMs > 2000 || speed.totalTimeMs === 0,
    botAccess: botAccess.hasRobotsTxt && botAccess.hasSitemapXml,
    accessBlocked: blockedEssentialResources.size > 0 || undefined,
  };
  } finally {
    clearTimeout(globalTimeout);
  }
}
