export default async function handler(req, res) {
  const id = req.query.id;
  if (!id) return res.status(400).send('Missing podcast id');

  const upstream = `https://ylqfnxvbqqwjxdfbjwjk.supabase.co/functions/v1/podcast-rss?id=${id}`;
  const response = await fetch(upstream);
  const xml = await response.text();

  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(response.status).send(xml);
}
