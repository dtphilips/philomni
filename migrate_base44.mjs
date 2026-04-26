// migrate_base44.mjs — run with: node migrate_base44.mjs
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

const ENTITY_TABLE = {
  VideoDraft: 'video_drafts', Post: 'posts', SharedVideo: 'shared_videos',
  SharedProject: 'shared_projects', PodcastEpisode: 'podcast_episodes',
  Notification: 'notifications', VideoRating: 'video_ratings',
  TemplateRating: 'template_ratings', Podcast: 'podcasts',
  VideoCaption: 'video_captions', User: 'users', Job: 'jobs', Group: 'groups',
  BookingProfile: 'booking_profiles', Booking: 'bookings',
  VideoMessage: 'video_messages', UserPoints: 'user_points', Status: 'statuses',
  ProjectComment: 'project_comments', PortfolioProject: 'portfolio_projects',
  Like: 'likes', GroupMember: 'group_members', CreatorContent: 'creator_content',
  VideoQualityReview: 'video_quality_reviews', VideoAnalytics: 'video_analytics',
  UserBadge: 'user_badges', Subscription: 'subscriptions',
  ScheduledPublication: 'scheduled_publications', Pitch: 'pitches',
  Follow: 'follows', CreatorEarnings: 'creator_earnings',
  ContentWorkflow: 'content_workflows', ContentAsset: 'content_assets',
  Comment: 'comments', CollaborativeWorkspace: 'collaborative_workspaces',
  Bookmark: 'bookmarks', AnalyticsEvent: 'analytics_events',
  ContentDraft: 'content_drafts', Template: 'templates', Reel: 'reels',
  Story: 'statuses', Project: 'projects',
};

const FILES = [
  'src/pages/Admin.jsx','src/pages/Billing.jsx','src/pages/BookingCalendar.jsx',
  'src/pages/BusinessContentSuite.jsx','src/pages/CollaborationFeed.jsx',
  'src/pages/CollaborativeStudio.jsx','src/pages/ContentCalendar.jsx',
  'src/pages/ContentPerformance.jsx','src/pages/CreatorAnalytics.jsx',
  'src/pages/CreatorMarketplace.jsx','src/pages/Creators.jsx',
  'src/pages/Discover.jsx','src/pages/Drafts.jsx','src/pages/EditProfile.jsx',
  'src/pages/Explore.jsx','src/pages/Gamification.jsx','src/pages/GlobalSearch.jsx',
  'src/pages/Groups.jsx','src/pages/Marketplace.jsx','src/pages/MonetizationHub.jsx',
  'src/pages/Notifications.jsx','src/pages/Onboarding.jsx',
  'src/pages/OnboardingProfile.jsx','src/pages/PodcastStudio.jsx',
  'src/pages/PostVideoEditorPage.jsx','src/pages/ProjectMatcher.jsx',
  'src/pages/QualityReview.jsx','src/pages/Reels.jsx','src/pages/Settings.jsx',
  'src/pages/SharedProjectView.jsx','src/pages/SharedVideoView.jsx',
  'src/pages/Stories.jsx','src/pages/TemplateMarketplace.jsx',
  'src/pages/UGCCreatorSuite.jsx','src/pages/Upgrade.jsx',
  'src/pages/VideoAnalyticsDashboard.jsx','src/pages/VideoCaptions.jsx',
  'src/pages/VideoMarketplace.jsx','src/pages/VideoMessages.jsx',
  'src/pages/VideoStudio.jsx','src/pages/WorkflowAutomation.jsx',
  'src/pages/AITools.jsx','src/pages/Signup.jsx',
];

function tbl(entity) {
  return ENTITY_TABLE[entity] || (entity[0].toLowerCase() + entity.slice(1) + 's');
}

function parseFilterObj(obj) {
  // Extract key:value pairs from a JS object literal string
  const pairs = [];
  const re = /(\w+)\s*:\s*([^,}]+)/g;
  let m;
  while ((m = re.exec(obj)) !== null) {
    pairs.push([m[1].trim(), m[2].trim()]);
  }
  return pairs;
}

function filterChain(entity, objStr, sortStr, limitStr) {
  const t = tbl(entity);
  let chain = `supabase.from('${t}').select('*')`;
  for (const [k, v] of parseFilterObj(objStr)) {
    chain += `.eq('${k}', ${v})`;
  }
  if (sortStr) {
    const s = sortStr.replace(/['"]/g, '').trim();
    const asc = !s.startsWith('-');
    const col = s.replace(/^-/, '').replace('created_date', 'created_at');
    chain += `.order('${col}', { ascending: ${asc} })`;
  }
  if (limitStr) chain += `.limit(${limitStr.trim()})`;
  return chain;
}

function migrate(src) {
  // 1. Remove base44 import
  src = src.replace(/import\s*\{[^}]*base44[^}]*\}\s*from\s*['"]@?\/?api\/base44Client['"];?\n?/g, '');

  // 2. Fix supabaseClient path
  src = src.replace(/from\s*['"]@\/api\/supabaseClient['"]/g, "from '@/lib/supabase'");

  // 3. Fix AuthContext path
  src = src.replace(/from\s*['"]@\/lib\/AuthContext['"]/g, "from '@/context/AuthContext'");
  src = src.replace(/from\s*['"]\.\.\/lib\/AuthContext['"]/g, "from '@/context/AuthContext'");

  // 4. useQuery auth.me → useAuth()
  // Full pattern with possible extra keys (enabled, staleTime, etc.)
  src = src.replace(
    /const\s*\{([^}]+)\}\s*=\s*useQuery\s*\(\s*\{[^{}]*queryFn\s*:\s*\(\s*\)\s*=>\s*base44\.auth\.me\s*\(\s*\)[^{}]*\}\s*\)/gs,
    (_, binding) => {
      let dataVar = 'user', loadVar = null, loadAlias = null;
      for (const part of binding.split(',')) {
        const p = part.trim();
        const dm = p.match(/data\s*:\s*(\w+)/);
        if (dm) dataVar = dm[1];
        const lm = p.match(/isLoading\s*:\s*(\w+)/);
        if (lm) loadAlias = lm[1];
        else if (/\bisLoading\b/.test(p) && !dm) loadVar = 'isLoading';
      }
      const parts = [`${dataVar}: user`];
      if (loadAlias) parts.push(`loading: ${loadAlias}`);
      else if (loadVar) parts.push(`loading: ${loadVar}`);
      return `const { ${parts.join(', ')} } = useAuth()`;
    }
  );

  // direct auth.me
  src = src.replace(/await\s+base44\.auth\.me\s*\(\s*\)/g, 'user /* useAuth() */');
  src = src.replace(/base44\.auth\.me\s*\(\s*\)/g, 'user /* useAuth() */');

  // 5. auth.updateMe
  src = src.replace(/base44\.auth\.updateMe\s*\(([^)]+)\)/g, (_, obj) =>
    `supabase.from('users').update(${obj.trim()}).eq('id', user.id)`);

  // 6. queryFn entity patterns (arrow function form)
  // .list()
  src = src.replace(/\(\s*\)\s*=>\s*base44\.entities\.(\w+)\.list\s*\(\s*\)/g, (_, e) =>
    `async () => { const { data } = await supabase.from('${tbl(e)}').select('*'); return data ?? []; }`);

  // conditional .filter → ()=> user? ... : []
  src = src.replace(
    /\(\s*\)\s*=>\s*([^?()]+\?)\s*base44\.entities\.(\w+)\.filter\s*\(\s*(\{[^}]+\})\s*(?:,\s*(['"][^,)]*['"]))?(?:,\s*(\d+))?\s*\)\s*:\s*\[\s*\]/g,
    (_, cond, e, obj, sort, lim) => {
      const chain = filterChain(e, obj, sort, lim);
      return `async () => { if (!(${cond.replace(/\s*\?$/, '').trim()})) return []; const { data } = await ${chain}; return data ?? []; }`;
    }
  );

  // plain .filter()
  src = src.replace(
    /\(\s*\)\s*=>\s*base44\.entities\.(\w+)\.filter\s*\(\s*(\{[^}]+\})\s*(?:,\s*(['"][^,)]*['"]))?(?:,\s*(\d+))?\s*\)/g,
    (_, e, obj, sort, lim) => {
      const chain = filterChain(e, obj, sort, lim);
      return `async () => { const { data } = await ${chain}; return data ?? []; }`;
    }
  );

  // mutationFn .create(arg)
  src = src.replace(/\((\w+)\)\s*=>\s*base44\.entities\.(\w+)\.create\s*\(\s*(\w+)\s*\)/g, (_, p, e, a) =>
    `async (${p}) => { const { data: result } = await supabase.from('${tbl(e)}').insert(${a}).select().single(); return result; }`);

  // mutationFn .update({id, ...rest}, id, rest) — two forms
  src = src.replace(/\((\{[^}]+\})\)\s*=>\s*base44\.entities\.(\w+)\.update\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)/g, (_, p, e, id, d) =>
    `async (${p}) => { const { data: result } = await supabase.from('${tbl(e)}').update(${d}).eq('id', ${id}).select().single(); return result; }`);

  // mutationFn .delete(arg)
  src = src.replace(/\((\w+)\)\s*=>\s*base44\.entities\.(\w+)\.delete\s*\(\s*(\w+)\s*\)/g, (_, p, e, a) =>
    `async (${p}) => { await supabase.from('${tbl(e)}').delete().eq('id', ${a}); }`);

  // 7. Direct await calls in handlers
  src = src.replace(/await\s+base44\.entities\.(\w+)\.create\s*\(([^)]+)\)/g, (_, e, a) =>
    `(await supabase.from('${tbl(e)}').insert(${a.trim()}).select().single()).data`);

  src = src.replace(/await\s+base44\.entities\.(\w+)\.update\s*\(([^,)]+),\s*([^)]+)\)/g, (_, e, id, d) =>
    `(await supabase.from('${tbl(e)}').update(${d.trim()}).eq('id', ${id.trim()}).select().single()).data`);

  src = src.replace(/await\s+base44\.entities\.(\w+)\.delete\s*\(([^)]+)\)/g, (_, e, a) =>
    `await supabase.from('${tbl(e)}').delete().eq('id', ${a.trim()})`);

  src = src.replace(
    /await\s+base44\.entities\.(\w+)\.filter\s*\(\s*(\{[^}]+\})\s*(?:,\s*(['"][^,)]*['"]))?(?:,\s*(\d+))?\s*\)/g,
    (_, e, obj, sort, lim) => `(await ${filterChain(e, obj, sort, lim)}).data ?? []`);

  src = src.replace(/await\s+base44\.entities\.(\w+)\.list\s*\(\s*\)/g, (_, e) =>
    `(await supabase.from('${tbl(e)}').select('*')).data ?? []`);

  src = src.replace(/await\s+base44\.entities\.(\w+)\.get\s*\(([^)]+)\)/g, (_, e, a) =>
    `(await supabase.from('${tbl(e)}').select('*').eq('id', ${a.trim()}).single()).data`);

  // 8. UploadFile
  src = src.replace(
    /await\s+base44\.integrations\.Core\.UploadFile\s*\(\s*\{\s*file\s*:\s*([^}]+)\}\s*\)/g,
    (_, fileVar) => {
      const fv = fileVar.trim();
      return (
        `await (async () => {\n` +
        `  const _uPath = \`uploads/\${Date.now()}-\${${fv}.name}\`;\n` +
        `  const { data: _uData, error: _uErr } = await supabase.storage.from('uploads').upload(_uPath, ${fv}, { upsert: true });\n` +
        `  if (_uErr) throw _uErr;\n` +
        `  const { data: { publicUrl: _uUrl } } = supabase.storage.from('uploads').getPublicUrl(_uData.path);\n` +
        `  return { file_url: _uUrl };\n` +
        `})()`
      );
    }
  );

  // 9. InvokeLLM
  src = src.replace(
    /await\s+base44\.integrations\.Core\.InvokeLLM\s*\(\s*(\{[\s\S]*?\})\s*\)/g,
    (_, args) => {
      const pm = args.match(/prompt\s*:\s*([\s\S]+?)(?:,\s*\w+\s*:|(?=\s*\}))/);
      const prompt = pm ? pm[1].trim() : args;
      return (
        `await (async () => {\n` +
        `  const _llmRes = await fetch('/api/llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: ${prompt} }) });\n` +
        `  const _llmData = await _llmRes.json();\n` +
        `  return { result: _llmData.result ?? '' };\n` +
        `})()`
      );
    }
  );

  // 10. functions.invoke fallback
  src = src.replace(/await\s+base44\.functions\.invoke\s*\([^)]+\)/g,
    '/* TODO: migrate base44.functions.invoke */ Promise.resolve(null)');
  src = src.replace(/base44\.functions\.invoke\s*\([^)]+\)/g,
    '/* TODO: migrate base44.functions.invoke */ null');

  // 11. Fallback: any remaining base44.entities.X.method(...)
  src = src.replace(/base44\.entities\.(\w+)\.(\w+)\s*\(([^)]*)\)/g, (_, e, method, args) => {
    const t = tbl(e);
    if (method === 'list') return `supabase.from('${t}').select('*')`;
    if (method === 'filter') return `supabase.from('${t}').select('*') /* TODO filter: ${args} */`;
    if (method === 'create') return `supabase.from('${t}').insert(${args}).select().single()`;
    if (method === 'update') return `supabase.from('${t}').update(/* TODO */).eq('id', id)`;
    if (method === 'delete') return `supabase.from('${t}').delete().eq('id', ${args})`;
    if (method === 'get') return `supabase.from('${t}').select('*').eq('id', ${args}).single()`;
    return `supabase.from('${t}') /* TODO: .${method}(${args}) */`;
  });

  // 12. Add missing imports
  const needsSupabase = src.includes('supabase.');
  const needsUseAuth = src.includes('useAuth');
  const hasSupabaseImport = /@\/lib\/supabase|\.\.\/lib\/supabase/.test(src);
  const hasUseAuthImport = /import[^;]+useAuth[^;]+from/.test(src);

  const toInsert = [];
  if (needsSupabase && !hasSupabaseImport) toInsert.push("import { supabase } from '@/lib/supabase';");
  if (needsUseAuth && !hasUseAuthImport) toInsert.push("import { useAuth } from '@/context/AuthContext';");

  if (toInsert.length) {
    // Insert after first React import line
    src = src.replace(/^(import React[^\n]*\n)/m, `$1${toInsert.join('\n')}\n`);
  }

  // 13. Clean up any leftover base44 import lines
  src = src.replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*base44[^'"]*['"];?\n?/g, '');

  return src;
}

let changed = 0;
for (const rel of FILES) {
  const path = join(__dir, rel);
  if (!existsSync(path)) { console.log(`  SKIP (not found): ${rel}`); continue; }
  const original = readFileSync(path, 'utf8');
  if (!original.includes('base44') && !original.includes('@/api/supabaseClient') && !original.includes('@/lib/AuthContext')) {
    console.log(`  CLEAN: ${rel}`);
    continue;
  }
  const migrated = migrate(original);
  writeFileSync(path, migrated, 'utf8');
  const remaining = migrated.split('\n').filter(l => l.includes('base44')).length;
  if (remaining) {
    console.log(`  MIGRATED (${remaining} base44 refs remain): ${rel}`);
  } else {
    console.log(`  MIGRATED: ${rel}`);
  }
  changed++;
}
console.log(`\nDone. ${changed}/${FILES.length} files migrated.`);
