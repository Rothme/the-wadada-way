// functions/api/admin/agents.js
// GET /api/admin/agents — all agent performance data

export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  const auth = request.headers.get('X-Admin-Auth');
  if (auth !== 'Beckham') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  try {
    const agentIndex = await env.WADADA_KV.get('agent_index', 'json') || [];
    const agents = [];

    for (const agentKey of agentIndex) {
      const agentData = await env.WADADA_KV.get(`agent:${agentKey}`, 'json');
      if (!agentData) continue;

      const stickers = agentData.stickers || [];
      let totalScans = 0;
      let activeLocations = 0;

      for (const code of stickers) {
        const scans = parseInt(await env.WADADA_KV.get(`scans:${code}`) || '0');
        totalScans += scans;
        if (scans > 0) activeLocations++;
      }

      agents.push({
        name: agentData.name || agentKey,
        agentId: agentData.agentId || '',
        stickers: stickers.length,
        totalScans,
        activeLocations,
        lastActive: agentData.lastActive || agentData.firstSeen || null
      });
    }

    agents.sort((a, b) => b.totalScans - a.totalScans);

    return new Response(JSON.stringify({ agents }), { headers });

  } catch (err) {
    return new Response(JSON.stringify({ agents: [], error: err.message }), { headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Auth',
    }
  });
}
