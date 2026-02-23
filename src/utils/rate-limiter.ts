/**
 * In-memory rate limiter for API endpoints.
 * Tracks requests per IP address with configurable limits.
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 30 seconds
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime < now) {
      store.delete(key);
    }
  }
}, 30000);

// Prevent interval from keeping process alive
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

export function isRateLimited(
  identifier: string,
  config: RateLimitConfig
): boolean {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetTime < now) {
    // Create new entry
    store.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return false;
  }

  // Increment counter
  entry.count += 1;

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    return true;
  }

  return false;
}

export function getRateLimitInfo(
  identifier: string,
  config: RateLimitConfig
): { remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetTime < now) {
    return {
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    };
  }

  return {
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}
