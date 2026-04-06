// Netlify Function: proxies OWGR API to avoid CORS restrictions
// Endpoint: /.netlify/functions/owgr-rankings

const https = require('https');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Poolside/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON from OWGR')); }
      });
    }).on('error', reject);
  });
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Fetch page 1 (top 200)
    const url1 = 'https://api2.owgr.com/api/owgr/rankings/getRankings?pageSize=200&pageNumber=1';
    const data1 = await fetchJSON(url1);

    // Fetch page 2 (201-400) for deeper field coverage
    const url2 = 'https://api2.owgr.com/api/owgr/rankings/getRankings?pageSize=200&pageNumber=2';
    let data2 = null;
    try { data2 = await fetchJSON(url2); } catch {}

    // Build rankings map
    const rankings = {};
    const processList = (data) => {
      const list = data?.rankingsList || data?.rankings || data?.data || [];
      for (const p of list) {
        const name = p.playerName || p.name || '';
        const rank = parseInt(p.rankingPosition || p.position || p.rank || 0);
        if (name && rank > 0) {
          // Normalize: lowercase, remove accents/punctuation
          const norm = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
          rankings[norm] = rank;
        }
      }
    };

    processList(data1);
    if (data2) processList(data2);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        rankings,
        count: Object.keys(rankings).length,
        fetchedAt: new Date().toISOString(),
      }),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch OWGR rankings', details: err.message }),
    };
  }
};
