"""
Migrate Base44 API calls to direct Supabase calls across all restored pages.
Run: python migrate_base44.py
"""
import re, os, sys

ENTITY_TO_TABLE = {
    'VideoDraft': 'video_drafts',
    'Post': 'posts',
    'SharedVideo': 'shared_videos',
    'SharedProject': 'shared_projects',
    'PodcastEpisode': 'podcast_episodes',
    'Notification': 'notifications',
    'VideoRating': 'video_ratings',
    'TemplateRating': 'template_ratings',
    'Podcast': 'podcasts',
    'VideoCaption': 'video_captions',
    'User': 'users',
    'Job': 'jobs',
    'Group': 'groups',
    'BookingProfile': 'booking_profiles',
    'Booking': 'bookings',
    'VideoMessage': 'video_messages',
    'UserPoints': 'user_points',
    'Status': 'statuses',
    'ProjectComment': 'project_comments',
    'PortfolioProject': 'portfolio_projects',
    'Like': 'likes',
    'GroupMember': 'group_members',
    'CreatorContent': 'creator_content',
    'VideoQualityReview': 'video_quality_reviews',
    'VideoAnalytics': 'video_analytics',
    'UserBadge': 'user_badges',
    'Subscription': 'subscriptions',
    'ScheduledPublication': 'scheduled_publications',
    'Pitch': 'pitches',
    'Follow': 'follows',
    'CreatorEarnings': 'creator_earnings',
    'ContentWorkflow': 'content_workflows',
    'ContentAsset': 'content_assets',
    'Comment': 'comments',
    'CollaborativeWorkspace': 'collaborative_workspaces',
    'Bookmark': 'bookmarks',
    'AnalyticsEvent': 'analytics_events',
    'ContentDraft': 'content_drafts',
    'Template': 'templates',
    'Reel': 'reels',
    'Story': 'statuses',
    'Project': 'projects',
}

FILES = [
    'src/pages/Admin.jsx',
    'src/pages/Billing.jsx',
    'src/pages/BookingCalendar.jsx',
    'src/pages/BusinessContentSuite.jsx',
    'src/pages/CollaborationFeed.jsx',
    'src/pages/CollaborativeStudio.jsx',
    'src/pages/ContentCalendar.jsx',
    'src/pages/ContentPerformance.jsx',
    'src/pages/CreatorAnalytics.jsx',
    'src/pages/CreatorMarketplace.jsx',
    'src/pages/Creators.jsx',
    'src/pages/Discover.jsx',
    'src/pages/Drafts.jsx',
    'src/pages/EditProfile.jsx',
    'src/pages/Explore.jsx',
    'src/pages/Gamification.jsx',
    'src/pages/GlobalSearch.jsx',
    'src/pages/Groups.jsx',
    'src/pages/Marketplace.jsx',
    'src/pages/MonetizationHub.jsx',
    'src/pages/Notifications.jsx',
    'src/pages/Onboarding.jsx',
    'src/pages/OnboardingProfile.jsx',
    'src/pages/PodcastStudio.jsx',
    'src/pages/PostVideoEditorPage.jsx',
    'src/pages/ProjectMatcher.jsx',
    'src/pages/QualityReview.jsx',
    'src/pages/Reels.jsx',
    'src/pages/Settings.jsx',
    'src/pages/SharedProjectView.jsx',
    'src/pages/SharedVideoView.jsx',
    'src/pages/Stories.jsx',
    'src/pages/TemplateMarketplace.jsx',
    'src/pages/UGCCreatorSuite.jsx',
    'src/pages/Upgrade.jsx',
    'src/pages/VideoAnalyticsDashboard.jsx',
    'src/pages/VideoCaptions.jsx',
    'src/pages/VideoMarketplace.jsx',
    'src/pages/VideoMessages.jsx',
    'src/pages/VideoStudio.jsx',
    'src/pages/WorkflowAutomation.jsx',
    'src/pages/AITools.jsx',
    'src/pages/Signup.jsx',
]

def get_table(entity):
    return ENTITY_TO_TABLE.get(entity, entity[0].lower() + entity[1:] + 's')

def parse_filter_obj(obj_str):
    """Parse a simple JS object literal into list of (key, val) pairs."""
    pairs = []
    # Match key: value patterns (handles quoted and unquoted keys)
    for m in re.finditer(r'(\w+)\s*:\s*([^,}]+)', obj_str):
        key = m.group(1).strip()
        val = m.group(2).strip()
        pairs.append((key, val))
    return pairs

def filter_to_supabase(entity, obj_str, sort_str=None, limit_str=None):
    table = get_table(entity)
    pairs = parse_filter_obj(obj_str)
    chain = f"supabase.from('{table}').select('*')"
    for k, v in pairs:
        chain += f".eq('{k}', {v})"
    if sort_str:
        sort_str = sort_str.strip().strip("'\"")
        asc = not sort_str.startswith('-')
        col = sort_str.lstrip('-')
        if col == 'created_date':
            col = 'created_at'
        chain += f".order('{col}', {{ ascending: {str(asc).lower()} }})"
    if limit_str:
        chain += f".limit({limit_str.strip()})"
    return chain

def migrate_content(src, filename):
    needs_supabase = False
    needs_useauth = False

    # ── 1. Remove base44 import line ──────────────────────────────────────
    src = re.sub(r"import\s*\{[^}]*base44[^}]*\}\s*from\s*['\"]@?/?api/base44Client['\"];?\n?", '', src)

    # ── 2. Fix supabaseClient import path ─────────────────────────────────
    src = re.sub(
        r"from\s*['\"]@/api/supabaseClient['\"]",
        "from '@/lib/supabase'",
        src
    )

    # ── 3. Fix AuthContext import path ────────────────────────────────────
    src = re.sub(
        r"from\s*['\"]@/lib/AuthContext['\"]",
        "from '@/context/AuthContext'",
        src
    )
    src = re.sub(
        r"from\s*['\"]../lib/AuthContext['\"]",
        "from '@/context/AuthContext'",
        src
    )

    # ── 4. Replace useQuery user query → useAuth ──────────────────────────
    # Pattern: const { data: user, ...rest } = useQuery({ queryKey: [...], queryFn: () => base44.auth.me() });
    def replace_user_query(m):
        nonlocal needs_useauth
        needs_useauth = True
        # Extract any destructuring aliases from the useQuery result
        binding = m.group(1)  # e.g. "data: user, isLoading" or "data: currentUser, isLoading: loading"
        # Parse the binding to get variable names
        data_var = 'user'
        loading_var = None
        loading_alias = None
        for part in binding.split(','):
            part = part.strip()
            if 'data' in part:
                dm = re.search(r'data\s*:\s*(\w+)', part)
                if dm:
                    data_var = dm.group(1)
            if 'isLoading' in part or 'loading' in part.lower():
                lm = re.search(r'isLoading\s*:\s*(\w+)', part)
                if lm:
                    loading_alias = lm.group(1)
                elif re.search(r'\bisLoading\b', part):
                    loading_var = 'isLoading'
                else:
                    lm2 = re.search(r'(\w+)', part)
                    if lm2:
                        loading_var = lm2.group(1)

        parts = [f'{data_var}: user']
        if loading_alias:
            parts.append(f'loading: {loading_alias}')
        elif loading_var:
            parts.append(f'loading: {loading_var}')
        return f'const {{ {", ".join(parts)} }} = useAuth()'

    src = re.sub(
        r'const\s*\{([^}]+)\}\s*=\s*useQuery\s*\(\s*\{[^}]*queryKey[^}]*queryFn\s*:\s*\(\s*\)\s*=>\s*base44\.auth\.me\s*\(\s*\)[^}]*\}\s*\)',
        replace_user_query,
        src,
        flags=re.DOTALL
    )

    # Simpler auth.me pattern (no destructuring aliases)
    src = re.sub(
        r'const\s*\{([^}]+)\}\s*=\s*useQuery\s*\(\s*\{\s*queryKey\s*:\s*\[.*?\]\s*,\s*queryFn\s*:\s*\(\s*\)\s*=>\s*base44\.auth\.me\s*\(\s*\)\s*,?\s*\}\s*\)',
        lambda m: (setattr(sys, '_needs_useauth', True) or '') + _user_query_replace(m),
        src,
        flags=re.DOTALL
    )

    # Direct (non-query) auth.me
    src = re.sub(r'await\s+base44\.auth\.me\s*\(\s*\)', 'user /* from useAuth() */', src)
    src = re.sub(r'base44\.auth\.me\s*\(\s*\)', 'user /* from useAuth() */', src)
    if 'base44.auth.me' not in src and ('useAuth' in src or needs_useauth):
        needs_useauth = True

    # ── 5. Replace auth.updateMe ──────────────────────────────────────────
    needs_supabase = needs_supabase or 'base44.auth.updateMe' in src
    def replace_update_me(m):
        nonlocal needs_supabase
        needs_supabase = True
        obj = m.group(1).strip()
        return f"supabase.from('users').update({obj}).eq('id', user.id)"
    src = re.sub(
        r'base44\.auth\.updateMe\s*\(([^)]+)\)',
        replace_update_me,
        src
    )

    # ── 6. Replace entity calls in queryFn / mutationFn ──────────────────
    needs_supabase = needs_supabase or bool(re.search(r'base44\.entities\.', src))

    # .list() inside queryFn (arrow function body)
    def replace_list_qfn(m):
        entity = m.group(1)
        table = get_table(entity)
        return f"async () => {{ const {{ data }} = await supabase.from('{table}').select('*'); return data ?? []; }}"
    src = re.sub(
        r'\(\s*\)\s*=>\s*base44\.entities\.(\w+)\.list\s*\(\s*\)',
        replace_list_qfn,
        src
    )

    # .filter({...}, sort?, limit?) inside queryFn
    def replace_filter_qfn(m):
        entity = m.group(1)
        obj_str = m.group(2)
        sort_str = m.group(3)
        limit_str = m.group(4)
        table = get_table(entity)
        chain = filter_to_supabase(entity, obj_str, sort_str, limit_str)
        return f"async () => {{ const {{ data }} = await {chain}; return data ?? []; }}"
    src = re.sub(
        r'\(\s*\)\s*=>\s*base44\.entities\.(\w+)\.filter\s*\(\s*(\{[^}]+\})\s*(?:,\s*([\'"][^,)]*[\'"]))?(?:,\s*(\d+))?\s*\)',
        replace_filter_qfn,
        src
    )

    # Conditional: () => user ? base44.entities.X.filter(...) : []
    def replace_cond_filter_qfn(m):
        cond = m.group(1)
        entity = m.group(2)
        obj_str = m.group(3)
        sort_str = m.group(4)
        limit_str = m.group(5)
        table = get_table(entity)
        chain = filter_to_supabase(entity, obj_str, sort_str, limit_str)
        return f"async () => {{ if (!({cond})) return []; const {{ data }} = await {chain}; return data ?? []; }}"
    src = re.sub(
        r'\(\s*\)\s*=>\s*([^?]+\?)\s*base44\.entities\.(\w+)\.filter\s*\(\s*(\{[^}]+\})\s*(?:,\s*([\'"][^,)]*[\'"]))?(?:,\s*(\d+))?\s*\)\s*:\s*\[\s*\]',
        replace_cond_filter_qfn,
        src
    )

    # .create in mutationFn
    def replace_create_mfn(m):
        param = m.group(1)
        entity = m.group(2)
        arg = m.group(3)
        table = get_table(entity)
        return f"async ({param}) => {{ const {{ data: result }} = await supabase.from('{table}').insert({arg}).select().single(); return result; }}"
    src = re.sub(
        r'\((\w+)\)\s*=>\s*base44\.entities\.(\w+)\.create\s*\(\s*(\w+)\s*\)',
        replace_create_mfn,
        src
    )

    # .update in mutationFn  ({ id, ...rest }) => base44.entities.X.update(id, rest)
    def replace_update_mfn(m):
        param = m.group(1)
        entity = m.group(2)
        id_var = m.group(3)
        data_var = m.group(4)
        table = get_table(entity)
        return f"async ({param}) => {{ const {{ data: result }} = await supabase.from('{table}').update({data_var}).eq('id', {id_var}).select().single(); return result; }}"
    src = re.sub(
        r'\((\{[^}]+\})\)\s*=>\s*base44\.entities\.(\w+)\.update\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)',
        replace_update_mfn,
        src
    )

    # .delete in mutationFn  (id) => base44.entities.X.delete(id)
    def replace_delete_mfn(m):
        param = m.group(1)
        entity = m.group(2)
        arg = m.group(3)
        table = get_table(entity)
        return f"async ({param}) => {{ await supabase.from('{table}').delete().eq('id', {arg}); }}"
    src = re.sub(
        r'\((\w+)\)\s*=>\s*base44\.entities\.(\w+)\.delete\s*\(\s*(\w+)\s*\)',
        replace_delete_mfn,
        src
    )

    # ── 7. Replace direct await calls in handlers ─────────────────────────

    # await base44.entities.X.create(data)
    def replace_direct_create(m):
        entity = m.group(1)
        arg = m.group(2)
        table = get_table(entity)
        return f"(await supabase.from('{table}').insert({arg}).select().single()).data"
    src = re.sub(
        r'await\s+base44\.entities\.(\w+)\.create\s*\(([^)]+)\)',
        replace_direct_create,
        src
    )

    # await base44.entities.X.update(id, data)
    def replace_direct_update(m):
        entity = m.group(1)
        id_arg = m.group(2)
        data_arg = m.group(3)
        table = get_table(entity)
        return f"(await supabase.from('{table}').update({data_arg}).eq('id', {id_arg}).select().single()).data"
    src = re.sub(
        r'await\s+base44\.entities\.(\w+)\.update\s*\(([^,)]+),\s*([^)]+)\)',
        replace_direct_update,
        src
    )

    # await base44.entities.X.delete(id)
    def replace_direct_delete(m):
        entity = m.group(1)
        arg = m.group(2)
        table = get_table(entity)
        return f"(await supabase.from('{table}').delete().eq('id', {arg}))"
    src = re.sub(
        r'await\s+base44\.entities\.(\w+)\.delete\s*\(([^)]+)\)',
        replace_direct_delete,
        src
    )

    # await base44.entities.X.filter({...}, sort?, limit?)
    def replace_direct_filter(m):
        entity = m.group(1)
        obj_str = m.group(2)
        sort_str = m.group(3)
        limit_str = m.group(4)
        chain = filter_to_supabase(entity, obj_str, sort_str, limit_str)
        return f"(await {chain}).data ?? []"
    src = re.sub(
        r'await\s+base44\.entities\.(\w+)\.filter\s*\(\s*(\{[^}]+\})\s*(?:,\s*([\'"][^,)]*[\'"]))?(?:,\s*(\d+))?\s*\)',
        replace_direct_filter,
        src
    )

    # await base44.entities.X.list()
    def replace_direct_list(m):
        entity = m.group(1)
        table = get_table(entity)
        return f"(await supabase.from('{table}').select('*')).data ?? []"
    src = re.sub(
        r'await\s+base44\.entities\.(\w+)\.list\s*\(\s*\)',
        replace_direct_list,
        src
    )

    # await base44.entities.X.get(id)
    def replace_direct_get(m):
        entity = m.group(1)
        arg = m.group(2)
        table = get_table(entity)
        return f"(await supabase.from('{table}').select('*').eq('id', {arg}).single()).data"
    src = re.sub(
        r'await\s+base44\.entities\.(\w+)\.get\s*\(([^)]+)\)',
        replace_direct_get,
        src
    )

    # ── 8. Replace UploadFile ─────────────────────────────────────────────
    # Pattern: const res = await base44.integrations.Core.UploadFile({ file: someVar });
    # then: someUrl = res.file_url;
    def replace_upload(m):
        nonlocal needs_supabase
        needs_supabase = True
        file_var = m.group(1).strip()
        # Return a multi-line replacement
        return (
            f"await (async () => {{\n"
            f"  const _uploadPath = `uploads/${{Date.now()}}-${{{file_var}.name}}`;\n"
            f"  const {{ data: _uploadData, error: _uploadError }} = await supabase.storage.from('uploads').upload(_uploadPath, {file_var}, {{ upsert: true }});\n"
            f"  if (_uploadError) throw _uploadError;\n"
            f"  const {{ data: {{ publicUrl: _publicUrl }} }} = supabase.storage.from('uploads').getPublicUrl(_uploadData.path);\n"
            f"  return {{ file_url: _publicUrl }};\n"
            f"}})()"
        )
    src = re.sub(
        r'await\s+base44\.integrations\.Core\.UploadFile\s*\(\s*\{\s*file\s*:\s*([^}]+)\}\s*\)',
        replace_upload,
        src
    )

    # ── 9. Replace InvokeLLM ──────────────────────────────────────────────
    def replace_llm(m):
        full_arg = m.group(1).strip()
        # Try to extract prompt value
        pm = re.search(r'prompt\s*:\s*(.+?)(?:,\s*\w+\s*:|$)', full_arg, re.DOTALL)
        prompt_val = pm.group(1).strip().rstrip(',') if pm else full_arg
        return (
            f"await (async () => {{\n"
            f"  const _llmRes = await fetch('/api/llm', {{ method: 'POST', headers: {{ 'Content-Type': 'application/json' }}, body: JSON.stringify({{ prompt: {prompt_val} }}) }});\n"
            f"  const _llmData = await _llmRes.json();\n"
            f"  return {{ result: _llmData.result ?? '' }};\n"
            f"}})()"
        )
    src = re.sub(
        r'await\s+base44\.integrations\.Core\.InvokeLLM\s*\(\s*(\{[^}]+\})\s*\)',
        replace_llm,
        src
    )

    # ── 10. Replace base44.functions.invoke ───────────────────────────────
    src = re.sub(
        r'await\s+base44\.functions\.invoke\s*\([^)]+\)',
        '/* TODO: migrate base44.functions.invoke */ null',
        src
    )
    src = re.sub(
        r'base44\.functions\.invoke\s*\([^)]+\)',
        '/* TODO: migrate base44.functions.invoke */ null',
        src
    )

    # ── 11. Any remaining base44.entities.X calls (fallback) ─────────────
    def replace_remaining_entity(m):
        entity = m.group(1)
        method = m.group(2)
        args = m.group(3)
        table = get_table(entity)
        if method == 'list':
            return f"supabase.from('{table}').select('*')"
        elif method == 'filter':
            return f"supabase.from('{table}').select('*') /* TODO: add filter from: {args} */"
        elif method == 'create':
            return f"supabase.from('{table}').insert({args}).select().single()"
        elif method == 'update':
            return f"supabase.from('{table}').update(/* args */).eq('id', id) /* TODO: fix args: {args} */"
        elif method == 'delete':
            return f"supabase.from('{table}').delete().eq('id', {args})"
        elif method == 'get':
            return f"supabase.from('{table}').select('*').eq('id', {args}).single()"
        else:
            return f"supabase.from('{table}') /* TODO: .{method}({args}) */"
    src = re.sub(
        r'base44\.entities\.(\w+)\.(\w+)\s*\(([^)]*)\)',
        replace_remaining_entity,
        src
    )

    # ── 12. Determine if we need to add imports ───────────────────────────
    needs_supabase = needs_supabase or 'supabase.' in src
    needs_useauth = needs_useauth or 'useAuth' in src

    # ── 13. Add missing imports ───────────────────────────────────────────
    # Find the first import line position
    first_import = src.find('import ')
    if first_import == -1:
        first_import = 0

    # Check what's already imported
    has_supabase_import = bool(re.search(r"from\s*['\"]@/lib/supabase['\"]", src) or
                                re.search(r"from\s*['\"]../lib/supabase['\"]", src))
    has_useauth_import = bool(re.search(r"useAuth", src.split('\n')[0:20].__class__(''.join(src.split('\n')[0:20])) if False else
                               re.search(r"import.*useAuth.*from", src[:2000])))
    has_useauth_import = bool(re.search(r"import[^;]+useAuth[^;]+from", src))

    inserts = []
    if needs_supabase and not has_supabase_import:
        inserts.append("import { supabase } from '@/lib/supabase';")
    if needs_useauth and not has_useauth_import:
        inserts.append("import { useAuth } from '@/context/AuthContext';")

    if inserts:
        # Insert after the last React import
        react_import_end = 0
        for m in re.finditer(r'^import\s+React.*?;\s*$', src, re.MULTILINE):
            react_import_end = m.end()
        if react_import_end:
            src = src[:react_import_end] + '\n' + '\n'.join(inserts) + src[react_import_end:]
        else:
            src = '\n'.join(inserts) + '\n' + src

    # ── 14. Remove orphaned imports of base44 if any remain ───────────────
    src = re.sub(r"import\s*\{[^}]*\}\s*from\s*['\"][^'\"]*base44[Cc]lient['\"];?\n?", '', src)

    return src

def _user_query_replace(m):
    """Fallback for simpler user query pattern."""
    return "const { user, loading: isLoading } = useAuth()"

def migrate_file(path):
    if not os.path.exists(path):
        print(f"  SKIP (not found): {path}")
        return False
    with open(path, 'r', encoding='utf-8') as f:
        original = f.read()
    if 'base44' not in original and '@/api/supabaseClient' not in original and '@/lib/AuthContext' not in original:
        print(f"  CLEAN: {path}")
        return False
    migrated = migrate_content(original, path)
    if migrated == original:
        print(f"  UNCHANGED: {path}")
        return False
    with open(path, 'w', encoding='utf-8') as f:
        f.write(migrated)
    # Report remaining base44 refs
    remaining = [l.strip() for l in migrated.split('\n') if 'base44' in l]
    if remaining:
        print(f"  MIGRATED (with {len(remaining)} remaining base44 refs): {path}")
        for r in remaining[:3]:
            print(f"    → {r[:100]}")
    else:
        print(f"  MIGRATED: {path}")
    return True

if __name__ == '__main__':
    base = os.path.dirname(os.path.abspath(__file__))
    changed = 0
    for rel in FILES:
        path = os.path.join(base, rel)
        if migrate_file(path):
            changed += 1
    print(f"\nDone. {changed}/{len(FILES)} files migrated.")
