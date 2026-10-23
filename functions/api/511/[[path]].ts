export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const targetPath = url.pathname.replace(/^\/api\/511/, '');
  const targetUrl = `https://511on.ca${targetPath}${url.search}`;

  const headers = new Headers(context.request.headers);
  headers.set('Referer', 'https://511on.ca/');
  headers.delete('host');

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
