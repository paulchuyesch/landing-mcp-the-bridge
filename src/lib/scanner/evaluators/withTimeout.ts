/**
 * A Higher Order Function (HOF) that wraps any given evaluator function.
 * It injects an AbortSignal configured to timeout after a set duration,
 * catching any internal or timeout errors and safely returning a fallback value.
 *
 * @param evaluatorFn The async function to wrap. Must accept a URL and an AbortSignal.
 * @param fallbackValue The default value to return if the evaluator fails or times out.
 * @param timeoutMs The max duration allowed in milliseconds. Defaults to 5000ms.
 */
export function withTimeoutFallback<T, U = string>(
  evaluatorFn: (url: U, signal?: AbortSignal) => Promise<T>,
  fallbackValue: T,
  timeoutMs: number = 5000,
  onFailure?: (error: unknown) => void,
): (url: U, parentSignal?: AbortSignal) => Promise<T> {
  return async (url: U, parentSignal?: AbortSignal): Promise<T> => {
    const controller = new AbortController();
    const abortFromParent = () => controller.abort(parentSignal?.reason);
    if (parentSignal?.aborted) {
      abortFromParent();
    } else {
      parentSignal?.addEventListener("abort", abortFromParent, { once: true });
    }

    const timeoutId = setTimeout(() => {
      const timeoutError = new Error(`Execution timed out after ${timeoutMs}ms`);
      timeoutError.name = "TimeoutError";
      controller.abort(timeoutError);
    }, timeoutMs);

    try {
      if (controller.signal.aborted) {
        return fallbackValue;
      }
      // TS ensures the generic return type aligns with fallbackValue
      const result = await evaluatorFn(url, controller.signal);
      return result;
    } catch (err: unknown) {
      // Any error, including AbortError, Network errors, or custom Evaluator errors
      // are swallowed, returning the fallback gracefully.
      onFailure?.(err);
      return fallbackValue;
    } finally {
      clearTimeout(timeoutId);
      parentSignal?.removeEventListener("abort", abortFromParent);
    }
  };
}
