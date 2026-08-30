const NOT_FOUND_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Content-Type': 'text/plain; charset=utf-8',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

export function onRequest() {
  return new Response('Not Found\n', {
    status: 404,
    headers: NOT_FOUND_HEADERS,
  });
}
