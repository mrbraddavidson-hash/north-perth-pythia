export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const targetPath = url.pathname.replace(/^\/api\/wateroffice/, '/today/hydrometric');
  const targetUrl = `https://dd.weather.gc.ca${targetPath}${url.search}`;

  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  // Allow-list: never forward the visitor's cookies or auth headers upstream
  const headers = new Headers();
  const accept = context.request.headers.get('Accept');
  if (accept) headers.set('Accept', accept);
  headers.set('User-Agent', 'Mozilla/5.0 (North Perth Pythia)');

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
