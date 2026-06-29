// functions/api/register-sticker.js
// POST /api/register-sticker — field agent registers a sticker code to a location

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const body = await request.json();
    const { code, location, lga, ward, notes, agent, agentId } = body;

    if (!code || !location || !lga) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), { headers });
    }

    const clean = code.trim().toUpperCase();

    // Check if code already registered
    const existing = await env.WADADA_KV.get(`sticker:${clean}`, 'json');
    if (existing) {
      return new Response(JSON.stringify({
        success: false,
        error: `Code ${clean} is already registered to "${existing.location}"`
      }), { headers });
    }

    // Save sticker record
    const stickerRecord = {
      code: clean,
      location: location.trim(),
      lga,
      ward: ward || '',
      notes: notes || '',
      agent: agent || 'Unknown',
      agentId: agentId || '',
      deployedAt: new Date().toISOString(),
      lat: null,
      lng: null
    };

    await env.WADADA_KV.put(`sticker:${clean}`, JSON.stringify(stickerRecord));
    await env.WADADA_KV.put(`scans:${clean}`, '0');

    // Add to master sticker index
    const indexRaw = await env.WADADA_KV.get('sticker_index', 'json') || [];
    indexRaw.push(clean);
    await env.WADADA_KV.put('sticker_index', JSON.stringify(indexRaw));

    // Update agent record
    const agentKey = `agent:${agentId || agent}`;
    const agentRecord = await env.WADADA_KV.get(agentKey, 'json') || {
      name: agent,
      agentId: agentId || '',
      stickers: [],
      firstSeen: new Date().toISOString()
    };
    agentRecord.stickers.push(clean);
    agentRecord.lastActive = new Date().toISOString();
    await env.WADADA_KV.put(agentKey, JSON.stringify(agentRecord));

    // Add to agent index
    const agentIndexRaw = await env.WADADA_KV.get('agent_index', 'json') || [];
    if (!agentIndexRaw.includes(agentId || agent)) {
      agentIndexRaw.push(agentId || agent);
      await env.WADADA_KV.put('agent_index', JSON.stringify(agentIndexRaw));
    }

    return new Response(JSON.stringify({ success: true, code: clean }), { headers });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'Server error: ' + err.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
