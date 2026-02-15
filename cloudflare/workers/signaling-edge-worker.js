/**
 * Cloudflare Worker - Signaling Edge Proxy
 *
 * Routes signaling traffic through Cloudflare edge while preserving
 * minimal metadata and strict cache bypass for real-time paths.
 */

export default {
  async fetch(request, env) {
    const upstream = env.SIGNALING_ORIGIN;
    if (!upstream) {
      return new Response('SIGNALING_ORIGIN is not configured', { status: 500 });
    }

    const incomingUrl = new URL(request.url);
    const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, upstream);

    const headers = new Headers(request.headers);
    headers.set('x-forwarded-host', incomingUrl.host);
    headers.set('x-forwarded-proto', 'https');
    headers.delete('cf-connecting-ip');

    const proxied = new Request(upstreamUrl.toString(), {
      method: request.method,
      headers,
      body: request.body,
      redirect: 'follow',
    });

    const response = await fetch(proxied, {
      cf: {
        cacheEverything: false,
        cacheTtl: 0,
      },
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('cache-control', 'no-store');
    responseHeaders.set('x-tallow-edge', 'cloudflare-worker');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  },
};
