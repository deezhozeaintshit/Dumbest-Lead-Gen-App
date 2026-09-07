import Bottleneck from 'bottleneck';

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
}

/**
 * Execute an async operation with exponential backoff and jitter.
 * Automatically retries on HTTP 429 and 5xx errors or network timeouts.
 */
export async function withExponentialBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 500,
    maxDelayMs = 8000,
    jitter = true,
  } = options;

  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      if (attempt > maxRetries) {
        throw error;
      }

      // Check if the error is retryable
      const status = error?.response?.status || error?.status;
      const isRetryableStatus = status === 429 || (status >= 500 && status <= 599);
      const isNetworkError =
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('network') ||
        error.message?.includes('timeout');

      if (!isRetryableStatus && !isNetworkError) {
        // Non-retryable error (e.g. 400 Bad Request, 401 Unauthorized)
        throw error;
      }

      // Respect Retry-After header if provided by external provider
      let delayMs: number;
      const retryAfterHeader = error?.response?.headers?.['retry-after'];
      if (retryAfterHeader) {
        const parsedSeconds = parseInt(retryAfterHeader, 10);
        if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
          delayMs = Math.min(parsedSeconds * 1000, maxDelayMs);
        } else {
          delayMs = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
        }
      } else {
        // Exponential backoff
        const expDelay = baseDelayMs * Math.pow(2, attempt - 1);
        delayMs = Math.min(expDelay, maxDelayMs);
      }

      if (jitter) {
        // Add random jitter between 0% and 50% of the delay
        delayMs = delayMs + Math.random() * (delayMs * 0.5);
      }

      console.warn(
        `[RateLimiter] Attempt ${attempt} failed with status ${status || error.code || 'UNKNOWN'}. Retrying in ${Math.round(delayMs)}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Provider-specific rate limiter instances
 */
export const providerRateLimiters: Record<string, Bottleneck> = {
  sec_edgar: new Bottleneck({
    minTime: 120, // SEC limit: max 10 req/sec with compliant User-Agent
    maxConcurrent: 2,
    reservoir: 10,
    reservoirRefreshAmount: 10,
    reservoirRefreshInterval: 1000,
  }),
  osm_commercial: new Bottleneck({
    minTime: 1000, // Nominatim / Overpass policy: 1 req/sec
    maxConcurrent: 1,
  }),
  google_places: new Bottleneck({
    minTime: 250, // 4 req/sec
    maxConcurrent: 2,
    reservoir: 50,
    reservoirRefreshAmount: 50,
    reservoirRefreshInterval: 60 * 1000,
  }),
  b2b_contacts: new Bottleneck({
    minTime: 400, // 2.5 req/sec
    maxConcurrent: 2,
    reservoir: 30,
    reservoirRefreshAmount: 30,
    reservoirRefreshInterval: 60 * 1000,
  }),
  csv_import: new Bottleneck({
    minTime: 20,
    maxConcurrent: 5,
  }),
  default: new Bottleneck({
    minTime: 300,
    maxConcurrent: 3,
  }),
};

export function getRateLimiterForProvider(providerId: string): Bottleneck {
  return providerRateLimiters[providerId] || providerRateLimiters.default;
}
