// Report the precise failed request without interrupting the remaining checks.
export async function checkRequest(url, { method = 'HEAD', expectedStatus, timeoutMs = 20000, fetchImpl = fetch } = {}) {
  try {
    const response = await fetchImpl(url, { method, signal: AbortSignal.timeout(timeoutMs) });
    const status = response.status;
    await response.body?.cancel();
    if (expectedStatus === undefined ? status >= 200 && status < 300 : status === expectedStatus) return null;
    return `HTTP ${status}: ${method} ${url}${expectedStatus === undefined ? '' : ` (expected ${expectedStatus})`}`;
  } catch (error) {
    const timedOut = error.name === 'TimeoutError' || error.name === 'AbortError';
    return timedOut
      ? `Timeout after ${timeoutMs}ms: ${method} ${url}`
      : `Network error: ${method} ${url}: ${error.message}${error.cause?.code ? ` (${error.cause.code})` : ''}`;
  }
}
