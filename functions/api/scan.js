// functions/api/scan.js
// POST /api/scan — validate code, log scan, return location info

export async function onRequestPost(context) {
  const { request, env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const body = await request.json();
    const code = (body.code || '').trim().toUpperCase();

    if (!code) {
      return new Response(JSON.stringify({ success: false, error: 'No code provided' }), { headers });
    }

    // Look up sticker in KV
    const stickerData = await env.WADADA_KV.get(`sticker:${code}`, 'json');

    if (!stickerData) {
      return new Response(JSON.stringify({ success: false, error: 'Code not found' }), { headers });
    }

    // Increment scan counter
    const scanKey = `scans:${code}`;
    const currentScans = parseInt(await env.WADADA_KV.get(scanKey) || '0');
    await env.WADADA_KV.put(scanKey, String(currentScans + 1));

    // Log individual scan event
    const scanEvent = {
      code,
      location: stickerData.location,
      lga: stickerData.lga,
      ward: stickerData.ward || '',
      lat: stickerData.lat || null,
      lng: stickerData.lng || null,
      ts: new Date().toISOString(),
      topic: null
    };

    // Append to scan log (last 500 scans)
    const logRaw = await env.WADADA_KV.get('scan_log', 'json') || [];
    logRaw.unshift(scanEvent);
    if (logRaw.length > 500) logRaw.length = 500;
    await env.WADADA_KV.put('scan_log', JSON.stringify(logRaw));

    return new Response(JSON.stringify({
      success: true,
      location: stickerData.location,
      lga: stickerData.lga,
      ward: stickerData.ward || ''
    }), { headers });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), { status: 500, headers });
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
