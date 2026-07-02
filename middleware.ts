import { rewrite } from '@vercel/functions';

export const config = {
  matcher: '/api/:path*',
};

export default function middleware(request: Request): Response {
  const configuredOrigin = process.env.BACKEND_ORIGIN?.trim();

  if (!configuredOrigin) {
    return new Response('BACKEND_ORIGIN is not configured', { status: 500 });
  }

  let backendOrigin: URL;
  try {
    backendOrigin = new URL(configuredOrigin);
  } catch {
    return new Response('BACKEND_ORIGIN must be a valid URL', { status: 500 });
  }

  if (!['http:', 'https:'].includes(backendOrigin.protocol)) {
    return new Response('BACKEND_ORIGIN must use HTTP or HTTPS', { status: 500 });
  }

  const incomingUrl = new URL(request.url);
  const destination = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, backendOrigin.origin);

  return rewrite(destination);
}
