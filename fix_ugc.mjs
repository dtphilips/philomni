import { readFileSync, writeFileSync } from 'fs';

const lines = readFileSync('src/pages/UGCCreatorSuite.jsx', 'utf8').split('\n');
const out = [];

const llm = (prompt) =>
  `await (async () => { const _r = await fetch('/api/llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: ${prompt} }) }); const _d = await _r.json(); return _d.result ?? ''; })()`;

let i = 0;
while (i < lines.length) {
  const line = lines[i];

  // Block 1: Hook generator (line ~314)
  if (line.includes('_llmRes') && line.includes('Generate exactly 5 viral ${hookType')) {
    out.pop(); // remove "const result = await (async () => {"
    const p = '`Generate exactly 5 viral ${hookType} hooks for ${platform} about: "${niche}". Be punchy and platform-specific. Return as a JSON array of strings.`';
    out.push(`      const result = ${llm(p)};`);
    // skip _llmData line and next 2 lines (return + })();)
    i++; // skip _llmData
    i++; // skip return
    i++; // skip })();
    i++; // skip current line (already consumed)
    continue;
  }

  // Block 2: Script enhancer (line ~475) - multi-line prompt
  if (line.includes('_llmRes') && line.includes('You are an expert viral content creator')) {
    out.pop();
    const p = '`You are an expert viral content creator. Improve this script to be more engaging and viral-ready: "${scriptText}". Keep the same structure but make the hook stronger, add specific details, improve the CTA, and make it conversational.`';
    out.push(`      const result = ${llm(p)};`);
    // Skip lines until we find })();
    while (i < lines.length && !lines[i].includes('})();')) i++;
    i++; // skip })();
    i++; // skip blank line after
    continue;
  }

  // Block 3: Caption generator (line ~598)
  if (line.includes('_llmRes') && line.includes('You are an expert social media copywriter')) {
    out.pop();
    const p = '`You are a social media copywriter. Create 3 ${tone} caption variations for ${platform} based on: "${description}". Include relevant hashtags and a clear CTA. Return as a JSON array of objects with {caption, hashtags} fields.`';
    out.push(`      const result = ${llm(p)};`);
    i++; // skip _llmData
    i++; // skip return
    i++; // skip })();
    i++;
    continue;
  }

  // Block 4: Posting time (line ~829)
  if (line.includes('_llmRes') && line.includes('You are a social media algorithm expert')) {
    out.pop();
    const p = '`You are a social media expert. Recommend 3 optimal posting times for a ${contentType} creator on ${postPlatform} targeting ${timezone} audiences. Return as JSON array with fields: day, time, reason, engagement_boost.`';
    out.push(`      const result = ${llm(p)};`);
    i++; // skip _llmData
    i++; // skip return
    i++; // skip })();
    i++;
    continue;
  }

  out.push(line);
  i++;
}

writeFileSync('src/pages/UGCCreatorSuite.jsx', out.join('\n'), 'utf8');
console.log('fixed UGCCreatorSuite.jsx');
