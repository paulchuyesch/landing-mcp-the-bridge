export interface SpeedMetrics {
  ttfbMs: number;
  totalTimeMs: number;
}

export class SpeedEvaluatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpeedEvaluatorError";
  }
}

/**
 * Measures the Time to First Byte (TTFB) and total download time for a given URL.
 */
export async function evaluateSpeed(url: string, signal?: AbortSignal): Promise<SpeedMetrics> {
  const startTime = performance.now();
  let response;

  try {
    response = await safePublicGet(url, {
      accept: "text/html,application/xhtml+xml,application/json",
      signal,
    });
    assertSuccessfulPublicResponse(response, "Speed fetch");
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw err;
    }
    throw new SpeedEvaluatorError(`Network error while evaluating speed: ${err.message}`);
  }

  // At this point, the headers have been received
  const ttfb = performance.now() - startTime;

  try {
    await readPublicBody(response, MAX_SPEED_RESPONSE_BYTES);
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw err;
    }
    throw new SpeedEvaluatorError(`Error reading response body for speed evaluation: ${err.message}`);
  }

  const totalTime = performance.now() - startTime;

  return {
    ttfbMs: Math.round(ttfb),
    totalTimeMs: Math.round(totalTime)
  };
}
import {
  assertSuccessfulPublicResponse,
  readPublicBody,
  safePublicGet,
} from "../core/safePublicRequest.js";

const MAX_SPEED_RESPONSE_BYTES = 512 * 1024;
