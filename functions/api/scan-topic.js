// functions/api/scan-topic.js
// POST /api/scan-topic — log which HEARTS topic was selected

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const body = await request.json();
    const code = (body.code || '').trim().toUpperCase();
    const topic = (body.topic || '').trim().toLowerCase();

    if (!topic) return new Response(JSON.stringify({ success: false }), { headers });

    // Update topic tally
    const topicKey = `topic_count:${topic}`;
    const current = parseInt(await env.WADADA_KV.get(topicKey) || '0');
    await env.WADADA_KV.put(topicKey, String(current + 1));

    // Update the most recent scan log entry with topic if code matches
    if (code) {
      const logRaw = await env.WADADA_KV.get('scan_log', 'json') || [];
      const entry = logRaw.find(s => s.code === code && !s.topic);
      if (entry) {
        entry.topic = topic;
        await env.WADADA_KV.put('scan_log', JSON.stringify(logRaw));
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ success: false }), { headers });
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
