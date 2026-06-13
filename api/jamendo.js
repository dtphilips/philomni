/**
 * Vercel Serverless Function — Jamendo music library proxy
 * GET /api/jamendo?action=tracks&genre=lofi&limit=20
 * GET /api/jamendo?action=search&q=ambient&limit=10
 *
 * Proxies Jamendo's free CC-licensed music API so we can add auth headers
 * and avoid CORS issues from the browser.
 *
 * Jamendo free API docs: https://developer.jamendo.com/v3.0/tracks
 */

const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID || 'b6747d04'; // public demo key

const GENRE_TAG_MAP = {
  'Lo-Fi':      'lofi',
  'Hip-Hop':    'hiphop',
  'Ambient':    'ambient',
  'Electronic': 'electronic',
  'Cinematic':  'cinematic',
  'Jazz':       'jazz',
  'Pop':        'pop',
  'Rock':       'rock',
  'R&B':        'rnb soul',
  'Trap':       'trap',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action = 'tracks', genre, q, limit = 20, offset = 0, id } = req.query ?? {};

  // RSS proxy — /api/jamendo?action=rss&id=<podcast_id>
  if (action === 'rss') {
    if (!id) return res.status(400).send('Missing podcast id');
    const upstream = `https://ylqfnxvbqqwjxdfbjwjk.supabase.co/functions/v1/podcast-rss?id=${id}`;
    const rssRes = await fetch(upstream);
    const xml = await rssRes.text();
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(rssRes.status).send(xml);
  }

  try {
    let url;

    if (action === 'search' && q) {
      url = new URL('https://api.jamendo.com/v3.0/tracks/');
      url.searchParams.set('client_id', JAMENDO_CLIENT_ID);
      url.searchParams.set('format', 'json');
      url.searchParams.set('namesearch', q);
      url.searchParams.set('limit', Math.min(parseInt(limit) || 20, 50));
      url.searchParams.set('offset', parseInt(offset) || 0);
      url.searchParams.set('audioformat', 'mp32');
      url.searchParams.set('include', 'musicinfo');
    } else {
      url = new URL('https://api.jamendo.com/v3.0/tracks/');
      url.searchParams.set('client_id', JAMENDO_CLIENT_ID);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', Math.min(parseInt(limit) || 20, 50));
      url.searchParams.set('offset', parseInt(offset) || 0);
      url.searchParams.set('audioformat', 'mp32');
      url.searchParams.set('include', 'musicinfo');
      url.searchParams.set('order', 'popularity_total');
      if (genre && GENRE_TAG_MAP[genre]) {
        url.searchParams.set('tags', GENRE_TAG_MAP[genre]);
      }
    }

    const jamRes = await fetch(url.toString());
    if (!jamRes.ok) throw new Error(`Jamendo returned ${jamRes.status}`);

    const data = await jamRes.json();

    // Normalise to our internal track shape
    const tracks = (data.results ?? []).map(t => ({
      id:         t.id,
      title:      t.name,
      artist:     t.artist_name,
      duration:   formatDuration(t.duration),
      durationSec: t.duration,
      bpm:        t.musicinfo?.speed ?? null,
      genre:      genre || (t.musicinfo?.tags?.genres?.[0] ?? 'Music'),
      audio_url:  t.audiodownload || t.audio,
      image_url:  t.image,
      plays:      t.stats?.rate_count ?? 0,
      key:        null,
    }));

    return res.status(200).json({ tracks, total: data.headers?.results_count ?? tracks.length });
  } catch (err) {
    console.error('[api/jamendo]', err.message);
    // Return empty array — UI handles gracefully
    return res.status(200).json({ tracks: [], error: err.message });
  }
}

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
