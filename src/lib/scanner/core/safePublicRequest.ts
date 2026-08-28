import { request as httpRequest, type IncomingHttpHeaders, type IncomingMessage } from "node:http";
import { request as httpsRequest } from "node:https";
import type { ClientRequest, RequestOptions } from "node:http";
import { resolvePublicUrl } from "./ssrfValidator.js";

export class SafePublicRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SafePublicRequestError";
  }
}

export type SafePublicResponse = {
  status: number;
  headers: IncomingHttpHeaders;
  body: IncomingMessage;
};

type SafePublicRequestOptions = {
  accept: string;
  signal?: AbortSignal;
};

/**
 * Identifies the scanner without pretending to be a browser. Some public
 * storefront WAFs reject requests that omit User-Agent altogether.
 */
export const SCANNER_USER_AGENT = "MCP-Bridge-AEO-Scanner/1.0 (+https://landing-mcp-the-bridge.vercel.app/scan)";

export const createPublicRequestHeaders = (accept: string): Record<string, string> => ({
  Accept: accept,
  "User-Agent": SCANNER_USER_AGENT,
});

type LookupCallback = (error: Error | null, address: string | Array<{ address: string; family: 4 | 6 }>, family?: 4 | 6) => void;

/**
 * Keeps the connection pinned to the IP that passed the SSRF check. Node 22
 * can request `all: true` when selecting an address family, which requires an
 * array response instead of the usual address/family pair.
 */
export const createPinnedPublicLookup = (address: string, family: 4 | 6) => {
  return (_hostname: string, lookupOptions: { all?: boolean }, callback: LookupCallback): void => {
    if (lookupOptions.all) {
      callback(null, [{ address, family }]);
      return;
    }
    callback(null, address, family);
  };
};

const abortError = (signal: AbortSignal): Error => {
  return signal.reason instanceof Error ? signal.reason : new SafePublicRequestError("Request aborted");
};

/**
 * Performs one GET against the IP already classified as public. Node uses the
 * supplied lookup result, so it cannot resolve the hostname again between the
 * SSRF check and the connection. Redirects are intentionally not followed.
 */
export async function safePublicGet(
  input: string,
  options: SafePublicRequestOptions
): Promise<SafePublicResponse> {
  const resolved = await resolvePublicUrl(input, undefined, options.signal);
  const { url } = resolved;

  if (options.signal?.aborted) {
    throw abortError(options.signal);
  }

  return new Promise<SafePublicResponse>((resolve, reject) => {
    const requestOptions: RequestOptions = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || undefined,
      path: `${url.pathname}${url.search}`,
      method: "GET",
      headers: createPublicRequestHeaders(options.accept),
      servername: url.protocol === "https:" ? url.hostname : undefined,
      lookup: createPinnedPublicLookup(resolved.address, resolved.family) as RequestOptions["lookup"],
    };
    const requestFactory = url.protocol === "https:" ? httpsRequest : httpRequest;
    let request: ClientRequest;
    const onAbort = () => request.destroy(abortError(options.signal!));

    request = requestFactory(requestOptions, (response) => {
      if (options.signal?.aborted) {
        response.destroy(abortError(options.signal));
        reject(abortError(options.signal));
        return;
      }
      resolve({
        status: response.statusCode ?? 0,
        headers: response.headers,
        body: response,
      });
    });
    request.once("error", reject);
    if (options.signal) {
      options.signal.addEventListener("abort", onAbort, { once: true });
      request.once("close", () => options.signal?.removeEventListener("abort", onAbort));
    }
    request.end();
  });
}

export function assertSuccessfulPublicResponse(response: SafePublicResponse, context: string): void {
  if (response.status >= 300 && response.status < 400) {
    response.body.destroy();
    throw new SafePublicRequestError(`${context} redirected; redirects are not allowed`);
  }
  if (response.status < 200 || response.status >= 300) {
    response.body.destroy();
    throw new SafePublicRequestError(`${context} returned HTTP status ${response.status}`);
  }
}

export async function readPublicBody(response: SafePublicResponse, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  try {
    for await (const chunk of response.body) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      if (totalBytes + buffer.length > maxBytes) {
        response.body.destroy();
        throw new SafePublicRequestError(`Response exceeded ${maxBytes} bytes`);
      }
      chunks.push(buffer);
      totalBytes += buffer.length;
    }
  } catch (error) {
    response.body.destroy();
    throw error;
  }
  return Buffer.concat(chunks, totalBytes);
}

/**
 * Reads only the beginning of a public response. This is for lightweight HTML
 * discovery where the first bytes are useful, but a large landing page must
 * not turn the whole scan into a failed request.
 */
export async function readPublicBodyPrefix(response: SafePublicResponse, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  try {
    for await (const chunk of response.body) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      const remaining = maxBytes - totalBytes;
      if (remaining <= 0) {
        response.body.destroy();
        break;
      }
      if (buffer.length > remaining) {
        chunks.push(buffer.subarray(0, remaining));
        totalBytes += remaining;
        response.body.destroy();
        break;
      }
      chunks.push(buffer);
      totalBytes += buffer.length;
    }
  } catch (error) {
    response.body.destroy();
    throw error;
  }
  return Buffer.concat(chunks, totalBytes);
}

export function discardPublicBody(response: SafePublicResponse): void {
  response.body.destroy();
}
