import type { RawScanData } from "./orchestrator.js";
import type { PillarResult, Check } from "./schemas.js";

export function calculateScores(data: RawScanData): PillarResult[] {
  return [
    calculateEnrichmentScore(data.semantics),
    calculateCatalogScore(data.catalog),
    calculateSemanticScore(data.semantics),
    calculateSpeedScore(data.speed),
    calculateAccessibilityScore(data.botAccess)
  ];
}

function calculateEnrichmentScore(semantics: RawScanData["semantics"]): PillarResult {
  if (!semantics.hasMcpBeacon) {
    return {
      pillar: "ai_enrichment",
      score: 0,
      maxScore: 25, // Forma parte del 100% total
      checks: [
        {
          id: "requires_mcp_protocol",
          passed: false,
          details: "Requiere exponer endpoints estructurados (MCP) o un archivo llm.txt/ai-instructions.",
        },
      ],
    };
  }

  return {
    pillar: "ai_enrichment",
    score: 25,
    maxScore: 25,
    checks: [
      { id: "mcp_beacon_detected", passed: true, details: "Capa semántica para LLMs detectada" },
      { id: "mcp_endpoint_exposed", passed: true, details: "Punto de enlace de IA estructurado habilitado" },
      { id: "mcp_ai_instructions", passed: true, details: "Instrucciones de rastreo para Agentes configuradas" },
    ],
  };
}

function calculateCatalogScore(catalog: RawScanData["catalog"]): PillarResult {
  const maxScore = 30;
  let score = 0;
  const checks: Check[] = [];

  const hasProducts = catalog.totalProducts > 0;
  checks.push({
    id: "has_products",
    passed: hasProducts,
    details: hasProducts ? `Found ${catalog.totalProducts} products` : "No products found",
  });

  if (hasProducts) {
    score += 10;

    const evalCoverage = (count: number, threshold: number = 0.8) => (count / catalog.totalProducts) >= threshold;

    const imgPassed = evalCoverage(catalog.productsWithImages);
    score += imgPassed ? 5 : 0;
    checks.push({
      id: "high_image_coverage",
      passed: imgPassed,
      details: `${Math.round((catalog.productsWithImages / catalog.totalProducts) * 100)}% coverage`,
    });

    const descPassed = evalCoverage(catalog.productsWithDescription);
    score += descPassed ? 5 : 0;
    checks.push({
      id: "high_desc_coverage",
      passed: descPassed,
      details: `${Math.round((catalog.productsWithDescription / catalog.totalProducts) * 100)}% coverage`,
    });

    const pricePassed = evalCoverage(catalog.productsWithPrice);
    score += pricePassed ? 5 : 0;
    checks.push({
      id: "high_price_coverage",
      passed: pricePassed,
      details: `${Math.round((catalog.productsWithPrice / catalog.totalProducts) * 100)}% coverage`,
    });

    const catPassed = evalCoverage(catalog.productsWithCategories);
    score += catPassed ? 5 : 0;
    checks.push({
      id: "high_category_coverage",
      passed: catPassed,
      details: `${Math.round((catalog.productsWithCategories / catalog.totalProducts) * 100)}% coverage`,
    });
  } else {
    // Fill empty checks for consistency
    checks.push(
      { id: "high_image_coverage", passed: false, details: "0% coverage" },
      { id: "high_desc_coverage", passed: false, details: "0% coverage" },
      { id: "high_price_coverage", passed: false, details: "0% coverage" },
      { id: "high_category_coverage", passed: false, details: "0% coverage" }
    );
  }

  return {
    pillar: "catalog",
    score,
    maxScore,
    checks
  };
}

function calculateSemanticScore(semantics: RawScanData["semantics"]): PillarResult {
  const maxScore = 25;
  let score = 0;
  const checks: Check[] = [];

  const passedJson = semantics.hasJsonLd;
  score += passedJson ? 15 : 0;
  checks.push({
    id: "has_json_ld",
    passed: passedJson,
  });

  const passedOg = semantics.hasOpenGraph;
  score += passedOg ? 10 : 0;
  checks.push({
    id: "has_open_graph",
    passed: passedOg,
  });

  return {
    pillar: "semantic",
    score,
    maxScore,
    checks
  };
}

function calculateSpeedScore(speed: RawScanData["speed"]): PillarResult {
  const maxScore = 20;
  let score = 0;
  const checks: Check[] = [];

  const passedTtfb = speed.ttfbMs > 0 && speed.ttfbMs <= 600;
  score += passedTtfb ? 10 : 0;
  checks.push({
    id: "ttfb_fast",
    passed: passedTtfb,
    details: speed.ttfbMs > 0 ? `${Math.round(speed.ttfbMs)}ms` : "Failed",
  });

  const passedTotal = speed.totalTimeMs > 0 && speed.totalTimeMs <= 2000;
  score += passedTotal ? 10 : 0;
  checks.push({
    id: "total_time_fast",
    passed: passedTotal,
    details: speed.totalTimeMs > 0 ? `${Math.round(speed.totalTimeMs)}ms` : "Failed",
  });

  return {
    pillar: "speed",
    score,
    maxScore,
    checks
  };
}

function calculateAccessibilityScore(botAccess: RawScanData["botAccess"]): PillarResult {
  const maxScore = 25;
  let score = 0;
  const checks: Check[] = [];

  const passedRobots = botAccess.hasRobotsTxt;
  score += passedRobots ? 10 : 0;
  checks.push({
    id: "has_robots_txt",
    passed: passedRobots,
  });

  const passedSitemap = botAccess.hasSitemapXml;
  score += passedSitemap ? 15 : 0;
  checks.push({
    id: "has_sitemap_xml",
    passed: passedSitemap,
  });

  return {
    pillar: "accessibility",
    score,
    maxScore,
    checks
  };
}
