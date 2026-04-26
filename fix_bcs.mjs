import { readFileSync, writeFileSync } from 'fs';

let src = readFileSync('src/pages/BusinessContentSuite.jsx', 'utf8');

// Helper to build a clean single-line LLM fetch
const llmFetch = (prompt) =>
  `await (async () => { const _r = await fetch('/api/llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: ${prompt} }) }); const _d = await _r.json(); return _d.result ?? ''; })()`;

// Find and replace all broken async IIFE LLM blocks
// Pattern: the broken block starts with "const res = await (async () => {\n  const _llmRes..."
// and ends with "})();"
// We'll split on known anchor lines and reconstruct

const lines = src.split('\n');
const out = [];
let i = 0;
while (i < lines.length) {
  const line = lines[i];

  // Detect broken LLM block start (the mangled prompt line)
  if (line.includes("const _llmRes = await fetch('/api/llm'") && line.includes('`Write a ${duration')) {
    // Replace the broken block (4 lines: _llmRes, _llmData, return, })();)
    // and the line before it (const res = await (async () => {)
    // We already pushed "const res = await (async () => {" — pop it and push fixed version
    out.pop(); // remove "const res = await (async () => {"
    const prompt = '`Write a ${duration}-second ${type?.toLowerCase?.() ?? "video"} script about: "${topic}". Format with HOOK, BODY, CTA. Be engaging and natural-sounding.`';
    out.push(`      const res = ${llmFetch(prompt)};`);
    i += 3; // skip _llmData, return, })();
    i++; // skip current line
    continue;
  }

  if (line.includes("const _llmRes = await fetch('/api/llm'") && line.includes('`Create a 30-day')) {
    out.pop();
    const prompt = '`Create a 30-day social media plan for a ${niche} creator with goal: "${goal}". Return JSON array with fields: day, theme, content_type, topic, caption_hook`';
    out.push(`      const res = ${llmFetch(prompt)};`);
    i += 3;
    i++;
    continue;
  }

  // Fix setScript line using old res?.response pattern
  if (line.includes("setScript(typeof res === 'string' ? res : res?.response || JSON.stringify(res))")) {
    out.push(line.replace("setScript(typeof res === 'string' ? res : res?.response || JSON.stringify(res))", "setScript(typeof res === 'string' ? res : (res?.result ?? res?.response ?? res ?? ''))"));
    i++;
    continue;
  }

  out.push(line);
  i++;
}

src = out.join('\n');
writeFileSync('src/pages/BusinessContentSuite.jsx', src, 'utf8');
console.log('fixed BusinessContentSuite.jsx');
