// functions/api/admin/locations.js
// GET /api/admin/locations — all sticker locations with scan counts

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
    const index = await env.WADADA_KV.get('sticker_index', 'json') || [];
    const now = Date.now();
    const locations = [];

    for (const code of index) {
      const sticker = await env.WADADA_KV.get(`sticker:${code}`, 'json');
      if (!sticker) continue;
      const scans = parseInt(await env.WADADA_KV.get(`scans:${code}`) || '0');
      const deployed = new Date(sticker.deployedAt).getTime();
      const daysDeployed = Math.floor((now - deployed) / (1000 * 60 * 60 * 24));

      locations.push({
        code,
        location: sticker.location,
        lga: sticker.lga,
        ward: sticker.ward || '',
        agent: sticker.agent || '—',
        scans,
        daysDeployed,
        lat: sticker.lat,
        lng: sticker.lng,
        deployedAt: sticker.deployedAt
      });
    }

    // Sort by scans descending
    locations.sort((a, b) => b.scans - a.scans);

    return new Response(JSON.stringify({ locations }), { headers });

  } catch (err) {
    return new Response(JSON.stringify({ locations: [], error: err.message }), { headers });
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
