/**
 * Vercel Serverless Function: /api/remove-bg
 * Proxies image background removal requests to remove.bg API.
 * Accepts multipart/form-data with an "image" field (file upload).
 * Returns a PNG with transparent background.
 */

export const config = {
  api: { bodyParser: false },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.REMOVE_BG_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'REMOVE_BG_API_KEY not configured' })
  }

  try {
    // Collect raw body chunks
    const chunks = []
    for await (const chunk of req) {
      chunks.push(chunk)
    }
    const rawBody = Buffer.concat(chunks)

    // Get content-type header (includes boundary for multipart)
    const contentType = req.headers['content-type'] || 'application/octet-stream'

    // Forward to remove.bg
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': contentType,
      },
      body: rawBody,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(response.status).json({ error: errorText })
    }

    const resultBuffer = await response.arrayBuffer()
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-store')
    return res.send(Buffer.from(resultBuffer))
  } catch (err) {
    console.error('[remove-bg]', err)
    return res.status(500).json({ error: err.message })
  }
}
