export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const targetPath = url.pathname.replace(/^\/api\/opensky/, '/api');
  const targetUrl = `https://opensky-network.org${targetPath}${url.search}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(targetUrl, {
      method: context.request.method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (North Perth Pythia)',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    return new Response(JSON.stringify({ error: err.message, states: [] }), {
      status: 504,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
