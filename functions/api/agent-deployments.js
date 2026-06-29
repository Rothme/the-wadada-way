// functions/api/agent-deployments.js
// GET /api/agent-deployments?agentId=xxx — return stickers registered by this agent

export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const url = new URL(request.url);
    const agentId = url.searchParams.get('agentId') || '';

    if (!agentId) {
      return new Response(JSON.stringify({ deployments: [] }), { headers });
    }

    // Find all stickers in index and filter by agent
    const index = await env.WADADA_KV.get('sticker_index', 'json') || [];
    const deployments = [];

    for (const code of index) {
      const sticker = await env.WADADA_KV.get(`sticker:${code}`, 'json');
      if (sticker && (sticker.agentId === agentId || sticker.agent === agentId)) {
        const scans = parseInt(await env.WADADA_KV.get(`scans:${code}`) || '0');
        deployments.push({ ...sticker, scans });
      }
    }

    return new Response(JSON.stringify({ deployments }), { headers });

  } catch (err) {
    return new Response(JSON.stringify({ deployments: [], error: err.message }), { headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
