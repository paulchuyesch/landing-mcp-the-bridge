import { lookup } from "node:dns/promises";
import { isIPv4, isIPv6 } from "node:net";

export type DnsRecord = { address: string; family: number };
export type LookupPublicHost = (hostname: string) => Promise<DnsRecord[]>;

export type ResolvedPublicUrl = {
  url: URL;
  address: string;
  family: 4 | 6;
};

const awaitWithAbort = async <T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> => {
  if (!signal) return promise;
  if (signal.aborted) throw signal.reason instanceof Error ? signal.reason : new SSRFValidationError("URL validation aborted");
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason instanceof Error ? signal.reason : new SSRFValidationError("URL validation aborted"));
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
};

export class SSRFValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SSRFValidationError";
  }
}

function ipv4ToLong(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isPrivateIPv4(ip: string): boolean {
  if (!isIPv4(ip)) return false;

  const longIp = ipv4ToLong(ip);

  const ranges = [
    { start: "0.0.0.0", end: "0.255.255.255" }, // Current network
    { start: "10.0.0.0", end: "10.255.255.255" }, // Private
    { start: "100.64.0.0", end: "100.127.255.255" }, // Shared address space
    { start: "127.0.0.0", end: "127.255.255.255" }, // Loopback
    { start: "169.254.0.0", end: "169.254.255.255" }, // Link-local
    { start: "172.16.0.0", end: "172.31.255.255" }, // Private
    { start: "192.168.0.0", end: "192.168.255.255" }, // Private
    { start: "192.0.0.0", end: "192.0.0.255" }, // Protocol assignments
    { start: "192.0.2.0", end: "192.0.2.255" }, // Documentation
    { start: "198.18.0.0", end: "198.19.255.255" }, // Benchmarking
    { start: "198.51.100.0", end: "198.51.100.255" }, // Documentation
    { start: "203.0.113.0", end: "203.0.113.255" }, // Documentation
    { start: "224.0.0.0", end: "255.255.255.255" }, // Multicast/reserved
  ];

  return ranges.some((range) => {
    return longIp >= ipv4ToLong(range.start) && longIp <= ipv4ToLong(range.end);
  });
}

function isPrivateIPv6(ip: string): boolean {
  if (!isIPv6(ip)) return false;

  const lowerIp = ip.toLowerCase();

  // IPv4-mapped IPv6 addresses (::ffff:192.168.1.1)
  if (lowerIp.startsWith("::ffff:")) {
    const ipv4Part = lowerIp.substring(7);
    return isPrivateIPv4(ipv4Part);
  }

  // Loopback
  if (lowerIp === "::1" || lowerIp === "0000:0000:0000:0000:0000:0000:0000:0001") return true;
  // Unspecified
  if (lowerIp === "::" || lowerIp === "0000:0000:0000:0000:0000:0000:0000:0000") return true;

  // fc00::/7 (Unique local)
  if (/^[fF][cCdDeEfF]/.test(lowerIp)) return true;

  // fe80::/10 (Link-local)
  if (/^[fF][eE][89aAbB]/.test(lowerIp)) return true;

  return false;
}

const defaultLookup: LookupPublicHost = async (hostname) => {
  return lookup(hostname, { all: true, verbatim: true });
};

export async function resolvePublicUrl(
  urlInput: string,
  lookupPublicHost: LookupPublicHost = defaultLookup,
  signal?: AbortSignal
): Promise<ResolvedPublicUrl> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(urlInput);
  } catch (err) {
    throw new SSRFValidationError("Invalid URL format");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new SSRFValidationError(`Protocol not allowed: ${parsedUrl.protocol}`);
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new SSRFValidationError("Credentials in URL are not allowed");
  }

  try {
    let hostnameToResolve = parsedUrl.hostname;
    if (hostnameToResolve.startsWith("[") && hostnameToResolve.endsWith("]")) {
      hostnameToResolve = hostnameToResolve.slice(1, -1);
    }

    const addresses = await awaitWithAbort(lookupPublicHost(hostnameToResolve), signal);

    if (!addresses || addresses.length === 0) {
      throw new SSRFValidationError("Hostname could not be resolved");
    }

    for (const record of addresses) {
      if (record.family === 4 && isPrivateIPv4(record.address)) {
        throw new SSRFValidationError(`Resolved to a private IPv4 address: ${record.address}`);
      }
      if (record.family === 6 && isPrivateIPv6(record.address)) {
        throw new SSRFValidationError(`Resolved to a private IPv6 address: ${record.address}`);
      }
    }

    const selected = addresses[0];
    if (!selected || (selected.family !== 4 && selected.family !== 6)) {
      throw new SSRFValidationError("Hostname did not resolve to a supported IP address");
    }

    return {
      url: parsedUrl,
      address: selected.address,
      family: selected.family,
    };
  } catch (err: any) {
    if (err instanceof SSRFValidationError) {
      throw err;
    }
    throw new SSRFValidationError(`DNS lookup failed: ${err.message}`);
  }

}

export async function validateUrlForSSRF(urlInput: string, signal?: AbortSignal): Promise<string> {
  const resolved = await resolvePublicUrl(urlInput, defaultLookup, signal);
  return resolved.url.toString();
}
