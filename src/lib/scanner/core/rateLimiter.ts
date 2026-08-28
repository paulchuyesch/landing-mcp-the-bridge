export interface RateLimitData {
  count: number;
  resetAt: number;
}

export class MemoryRateLimiter {
  private limits: Map<string, RateLimitData>;
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 5, windowMs: number = 3600 * 1000) {
    this.limits = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  public checkLimit(ip: string, now: number = Date.now()): boolean {
    const limitData = this.limits.get(ip);

    // Garbage collection for expired IPs (runs approx 5% of requests)
    if (Math.random() < 0.05) {
      this.cleanup(now);
    }

    if (!limitData || limitData.resetAt < now) {
      this.limits.set(ip, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return true;
    }

    if (limitData.count < this.maxRequests) {
      limitData.count += 1;
      return true;
    }

    return false;
  }

  public cleanup(now: number = Date.now()): void {
    for (const [key, data] of this.limits.entries()) {
      if (data.resetAt < now) {
        this.limits.delete(key);
      }
    }
  }
}
