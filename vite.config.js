import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// Reads raw POST body as a string
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-dev-middleware',
      configureServer(server) {
        // Serve /api/llm in Vite dev mode (vercel dev / production handle it natively)
        server.middlewares.use('/api/llm', async (req, res, next) => {
          if (req.method !== 'POST') return next();
          try {
            const raw = await readBody(req);
            const { prompt, response_json_schema } = JSON.parse(raw || '{}');
            if (!prompt) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'prompt is required' }));
            }

            const apiKey = process.env.ANTHROPIC_API_KEY;
            if (!apiKey) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }));
            }

            const systemPrompt = response_json_schema
              ? `You are a helpful AI assistant. Respond ONLY with valid JSON matching this schema: ${JSON.stringify(response_json_schema)}. No markdown, no explanation.`
              : 'You are a helpful AI assistant for Philomni, a global creator and professional platform. Be concise, helpful, and professional.';

            const upstream = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 4096,
                system: systemPrompt,
                messages: [{ role: 'user', content: prompt }],
              }),
            });

            if (!upstream.ok) {
              const err = await upstream.text();
              res.writeHead(502, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'LLM API error', details: err }));
            }

            const data = await upstream.json();
            const text = data.content?.[0]?.text ?? '';

            res.writeHead(200, { 'Content-Type': 'application/json' });
            if (response_json_schema) {
              try {
                return res.end(JSON.stringify(JSON.parse(text)));
              } catch {
                return res.end(JSON.stringify({ result: text }));
              }
            }
            return res.end(JSON.stringify({ result: text }));
          } catch (err) {
            console.error('[vite /api/llm]', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        });

        // /api/generate-image — Ideogram proxy
        server.middlewares.use('/api/generate-image', async (req, res, next) => {
          if (req.method !== 'POST') return next();
          try {
            const raw = await readBody(req);
            const { prompt, style, size } = JSON.parse(raw || '{}');
            if (!prompt) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'prompt is required' }));
            }
            const apiKey = process.env.IDEOGRAM_API_KEY;
            if (!apiKey) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ url: `https://picsum.photos/seed/${Date.now()}/1024/1024`, fallback: true }));
            }
            const styleMap = { photorealistic: 'REALISTIC', cinematic: 'REALISTIC', illustration: 'DESIGN', anime: 'ANIME', '3d': 'RENDER_3D', logo: 'DESIGN', editorial: 'GENERAL', abstract: 'GENERAL', fantasy: 'GENERAL', portrait: 'REALISTIC', nature: 'REALISTIC', neon: 'GENERAL', noir: 'REALISTIC' };
            const ideogramStyle = styleMap[style?.toLowerCase()] ?? 'AUTO';
            const upstream = await fetch('https://api.ideogram.ai/generate', {
              method: 'POST',
              headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_request: { prompt, aspect_ratio: 'ASPECT_1_1', model: 'V_2', magic_prompt_option: 'AUTO', style_type: ideogramStyle } }),
            });
            if (!upstream.ok) {
              const err = await upstream.text();
              res.writeHead(502, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'Ideogram error', details: err }));
            }
            const data = await upstream.json();
            const url = data.data?.[0]?.url;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ url }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        });

        // /api/elevenlabs — ElevenLabs TTS proxy (GET voices, POST tts)
        server.middlewares.use('/api/elevenlabs', async (req, res, next) => {
          const apiKey = process.env.ELEVENLABS_API_KEY;
          if (req.method === 'GET') {
            if (!apiKey) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ voices: [] })); }
            try {
              const r = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': apiKey } });
              const d = await r.json();
              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ voices: d.voices ?? [] }));
            } catch (err) { res.writeHead(500, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: err.message })); }
          }
          if (req.method !== 'POST') return next();
          try {
            const raw = await readBody(req);
            const { text, voice_id = 'EXAVITQu4vr4xnSDxMaL', settings } = JSON.parse(raw || '{}');
            if (!apiKey) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ fallback: true })); }
            const voiceSettings = settings ?? { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true };
            const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
              method: 'POST',
              headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
              body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: voiceSettings }),
            });
            if (!r.ok) { const err = await r.text(); res.writeHead(502, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: err })); }
            const ab = await r.arrayBuffer();
            res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': ab.byteLength });
            res.end(Buffer.from(ab));
          } catch (err) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: err.message })); }
        });

        // /api/daily-room — Daily.co room creation
        server.middlewares.use('/api/daily-room', async (req, res, next) => {
          if (req.method !== 'POST') return next();
          try {
            const raw = await readBody(req);
            const { name, properties = {} } = JSON.parse(raw || '{}');
            const apiKey = process.env.DAILY_API_KEY;
            if (!apiKey) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ url: `https://demo.daily.co/${name}`, name })); }
            const r = await fetch('https://api.daily.co/v1/rooms', {
              method: 'POST',
              headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, privacy: 'public', properties: { max_participants: 50, enable_screenshare: true, enable_chat: true, exp: Math.floor(Date.now() / 1000) + 4 * 3600, ...properties } }),
            });
            const d = await r.json();
            if (!r.ok) { res.writeHead(502, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'Daily.co error', details: d })); }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ url: d.url, name: d.name }));
          } catch (err) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: err.message })); }
        });

        // Raise HTTP header size limit (Supabase JWTs can be large)
        if (server.httpServer) {
          server.httpServer.maxHeaderSize = 65536;
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    headers: {
      'Cache-Control': 'no-store',
    },
    // Increase the header size limit for the underlying http server.
    // This value is passed as maxHeaderSize to Node's http.createServer.
    hmr: {
      // Separate HMR port avoids HMR websocket headers contributing to the limit.
      port: 5174,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          query: ['@tanstack/react-query'],
          motion: ['framer-motion'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
