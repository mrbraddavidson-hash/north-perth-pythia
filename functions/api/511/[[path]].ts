interface Env {
  ONTARIO_511_KEY?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const targetPath = url.pathname.replace(/^\/api\/511/, '');
  // Inject the site's 511 key server-side so it never ships in the client bundle
  if (targetPath.startsWith('/api/') && !url.searchParams.has('key') && context.env.ONTARIO_511_KEY) {
    url.searchParams.set('key', context.env.ONTARIO_511_KEY);
  }
  const targetUrl = `https://511on.ca${targetPath}${url.search}`;

  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  // Allow-list: never forward the visitor's cookies or auth headers upstream
  const headers = new Headers();
  const accept = context.request.headers.get('Accept');
  if (accept) headers.set('Accept', accept);
  headers.set('Referer', 'https://511on.ca/');

  try {
    const response = await fetch(targetUrl, {
      method: context.request.method,
      headers,
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
