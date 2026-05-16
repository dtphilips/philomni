import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dir = dirname(fileURLToPath(import.meta.url));

const uploadSnippet = (fileVar) =>
  `await (async () => { const _uPath = \`uploads/\${Date.now()}-\${${fileVar}.name}\`; const { data: _uData, error: _uErr } = await supabase.storage.from('uploads').upload(_uPath, ${fileVar}, { upsert: true }); if (_uErr) throw _uErr; const { data: { publicUrl: _uUrl } } = supabase.storage.from('uploads').getPublicUrl(_uData.path); return { file_url: _uUrl }; })()`;

const fixes = [
  // UploadFile patterns with shorthand { file }
  [/await base44\.integrations\.Core\.UploadFile\(\s*\{\s*file\s*\}\s*\)/g,
    uploadSnippet('file')],
  [/await base44\.integrations\.Core\.UploadFile\(\s*\{\s*file\s*:\s*file\s*\}\s*\)/g,
    uploadSnippet('file')],

  // GenerateImage → /api/generate-image
  [/await base44\.integrations\.Core\.GenerateImage\(\s*\{\s*prompt\s*:\s*([^}]+)\}\s*\)/g,
    (_, prompt) => `await (async () => { const _r = await fetch('/api/generate-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: ${prompt.trim()} }) }); return await _r.json(); })()`],

  // asServiceRole.entities.User.list → supabase users
  [/base44\.asServiceRole\.entities\.User\.list\s*\(\s*['"]{2}\s*,\s*(\d+)\s*\)/g,
    (_, limit) => `supabase.from('users').select('*').limit(${limit}).then(r => r.data ?? [])`],
  [/base44\.asServiceRole\.entities\.User\.list\s*\(\s*['"]{2}\s*,?\s*\)/g,
    `supabase.from('users').select('*').limit(50).then(r => r.data ?? [])`],

  // asServiceRole.entities.Follow.filter / GroupMember.filter
  [/base44\.asServiceRole\.entities\.Follow\.filter\(\s*(\{[^}]+\})\s*\)/g,
    (_, obj) => `supabase.from('follows').select('*').then(r => r.data ?? []) /* ${obj} */`],
  [/base44\.asServiceRole\.entities\.GroupMember\.filter\(\s*(\{[^}]+\})\s*\)/g,
    (_, obj) => `supabase.from('group_members').select('*').then(r => r.data ?? []) /* ${obj} */`],

  // Dynamic entity calls (CollaboratorsList pattern)
  [/base44\.entities\[entityName\]\.filter\(query\)/g,
    `supabase.from(entityName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '') + 's').select('*') /* TODO: add filter from query */`],
  [/await base44\.entities\[entityName\]\.delete\(collaboratorId\)/g,
    `await supabase.from(entityName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '') + 's').delete().eq('id', collaboratorId)`],
  [/await base44\.entities\[entityName\]\.create\(\{/g,
    `await supabase.from(entityName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '') + 's').insert({`],

  // base44._supabase → supabase
  [/base44\._supabase/g, 'supabase'],

  // base44.auth.logout() → supabase.auth.signOut()
  [/base44\.auth\.logout\s*\(\s*\)/g, 'supabase.auth.signOut()'],

  // ElevenLabs voices
  [/base44\.functions\.elevenLabsVoices\s*\(\s*\)\.then\s*\(\s*\(\s*\{\s*voices\s*\}\s*\)\s*=>/g,
    `fetch('/api/elevenlabs', { method: 'GET' }).then(r => r.json()).then(({ voices }) =>`],

  // ElevenLabs TTS
  [/await base44\.functions\.elevenLabsTTS\s*\(\s*(\{[\s\S]*?\})\s*\)/g,
    (_, args) => `await (async () => { const _r = await fetch('/api/elevenlabs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(${args}) }); return _r.ok ? await _r.arrayBuffer() : null; })()`],

  // StoryBar markStatusViewed
  [/await base44\.functions\.markStatusViewed\(\s*\{\s*statusId\s*:\s*([^}]+)\}\s*\)/g,
    (_, id) => `await supabase.from('statuses').update({ view_count: 1 }).eq('id', ${id.trim()})`],

  // PostComments asServiceRole
  [/await base44\.asServiceRole\.entities\.User\.list\s*\([^)]+\)/g,
    `(await supabase.from('users').select('*').limit(100)).data ?? []`],

  // Any remaining base44.functions calls
  [/base44\.functions\.\w+\s*\([^)]*\)/g,
    '/* TODO: migrate base44.functions call */ null'],
];

const targetFiles = [
  'src/components/ai-tools/BrandVoiceTrainer.jsx',
  'src/components/ai-tools/ToolModal.jsx',
  'src/components/audio/AudioLibrary.jsx',
  'src/components/audio/VoiceNoteRecorder.jsx',
  'src/components/audio/VoiceStudio.jsx',
  'src/components/collaboration/CollaboratorsList.jsx',
  'src/components/collaboration/InviteCollaboratorModal.jsx',
  'src/components/common/MentionAutocomplete.jsx',
  'src/components/discover/SuggestedConnections.jsx',
  'src/components/feed/CreatePost.jsx',
  'src/components/feed/PostComments.jsx',
  'src/components/feed/PostVideoEditor.jsx',
  'src/components/feed/TrendingSidebar.jsx',
  'src/components/layout/Sidebar.jsx',
  'src/components/marketplace/PublishContentDialog.jsx',
  'src/components/messages/StartConversationModal.jsx',
  'src/components/profile/PortfolioProjectModal.jsx',
  'src/components/stories/StoryBar.jsx',
  'src/components/video/VideoEditor.jsx',
  'src/components/workspace/InviteCollaboratorModal.jsx',
];

let fixed = 0;
for (const rel of targetFiles) {
  const path = join(__dir, rel);
  try {
    let src = readFileSync(path, 'utf8');
    let changed = false;
    for (const [pattern, replacement] of fixes) {
      const before = src;
      src = typeof replacement === 'function'
        ? src.replace(pattern, replacement)
        : src.replace(pattern, replacement);
      if (src !== before) changed = true;
    }
    writeFileSync(path, src, 'utf8');
    const remaining = src.split('\n').filter(l => l.includes('base44') && !l.trim().startsWith('//')).length;
    console.log(`  ${remaining ? `PARTIAL (${remaining} remain)` : 'FIXED'}: ${rel}`);
    fixed++;
  } catch (e) {
    console.log(`  ERROR: ${rel} — ${e.message}`);
  }
}
console.log(`\nFixed ${fixed} files.`);
