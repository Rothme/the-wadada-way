// functions/api/admin/stats.js
// GET /api/admin/stats — dashboard statistics (admin-only)

const TOPICS = ['human', 'energy', 'agriculture', 'rural', 'trade', 'security'];
const TOPIC_LABELS = {
  human: 'Human Capital',
  energy: 'Energy & Minerals',
  agriculture: 'Agriculture',
  rural: 'Rural Development',
  trade: 'Trade & Economy',
  security: 'Security'
};

export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  // Auth check
  const auth = request.headers.get('X-Admin-Auth');
  if (auth !== 'Beckham') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  try {
    // Total stickers
    const stickerIndex = await env.WADADA_KV.get('sticker_index', 'json') || [];
    const totalStickers = stickerIndex.length;

    // Total scans and hostile zones
    let totalScans = 0;
    let hostileZones = 0;
    const now = Date.now();

    for (const code of stickerIndex) {
      const scans = parseInt(await env.WADADA_KV.get(`scans:${code}`) || '0');
      totalScans += scans;

      if (scans === 0) {
        const sticker = await env.WADADA_KV.get(`sticker:${code}`, 'json');
        if (sticker) {
          const deployed = new Date(sticker.deployedAt).getTime();
          const daysDiff = (now - deployed) / (1000 * 60 * 60 * 24);
          if (daysDiff >= 7) hostileZones++;
        }
      }
    }

    // Total agents
    const agentIndex = await env.WADADA_KV.get('agent_index', 'json') || [];
    const totalAgents = agentIndex.length;

    // Recent scans
    const scanLog = await env.WADADA_KV.get('scan_log', 'json') || [];
    const recentScans = scanLog.slice(0, 20);

    // Topic counts
    const topicCounts = [];
    for (const t of TOPICS) {
      const count = parseInt(await env.WADADA_KV.get(`topic_count:${t}`) || '0');
      if (count > 0) {
        topicCounts.push({ topic: TOPIC_LABELS[t] || t, count });
      }
    }
    topicCounts.sort((a, b) => b.count - a.count);

    return new Response(JSON.stringify({
      totalScans,
      totalStickers,
      hostileZones,
      totalAgents,
      recentScans,
      topTopics: topicCounts
    }), { headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
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
