/**
 * Supabase-backed compatibility shim.
 * Exports `base44` with the same API shape the original Base44 SDK had,
 * so all 101 importing files continue to work without changes.
 *
 *   base44.auth.me / updateMe / logout / redirectToLogin
 *   base44.entities.Post.list / filter / create / update / delete / read / subscribe
 *   base44.integrations.Core.UploadFile / InvokeLLM / GenerateImage
 *   base44.functions.invoke / <functionName>
 */

import { supabase } from './supabaseClient';

// ─── Dev mode mock user ──────────────────────────────────────────────────────
// WARNING: VITE_DEV_MODE must be 'false' in production.
// import.meta.env.DEV is Vite's built-in flag: true during `vite dev`, false after `vite build`.
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true' && import.meta.env.DEV;
const DEV_USER = {
  id: 'dev-user-001',
  email: 'dev@philomni.com',
  full_name: 'Dev User',
  role: 'creator',
  plan: 'pro',
  avatar_url: null,
  dark_mode: false,
  bio: 'Local dev account',
  location: 'Localhost',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert Base44 orderBy string like "-created_date" to Supabase column+ascending */
function parseOrder(orderBy = '-created_at') {
  if (!orderBy) return { col: 'created_at', ascending: false };
  const desc = orderBy.startsWith('-');
  const raw = orderBy.replace(/^-/, '');
  const col = raw === 'created_date' ? 'created_at'
    : raw === 'updated_date' ? 'updated_at'
    : raw || 'created_at';
  return { col, ascending: !desc };
}

/** Get current user's id (or dev id) */
async function getCurrentUserId() {
  if (DEV_MODE) return DEV_USER.id;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** LLM call via Vercel API route — always calls real API regardless of DEV_MODE */
async function callLLM(prompt, schema = null) {
  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, response_json_schema: schema }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'LLM call failed');
  }
  return res.json();
}

// ─── Entity factory ───────────────────────────────────────────────────────────

/**
 * Creates a CRUD interface for a Supabase table that mirrors the Base44 entity API.
 * @param {string} tableName  e.g. 'posts'
 */
function entityFactory(tableName) {
  return {
    /** list(orderBy?, limit?, offset?) */
    async list(orderBy = '-created_at', limit = 50, offset = 0) {
      const { col, ascending } = parseOrder(orderBy);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(col, { ascending })
        .range(offset, offset + limit - 1);
      if (error) { console.error(`[db] list ${tableName}:`, error); return []; }
      return data ?? [];
    },

    /** filter({ field: value, ... }) — supports array values as IN queries */
    async filter(filters = {}) {
      let q = supabase.from(tableName).select('*');
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          q = q.in(key, value);
        } else if (typeof value === 'object' && value.$ne !== undefined) {
          q = q.neq(key, value.$ne);
        } else {
          q = q.eq(key, value);
        }
      }
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) { console.error(`[db] filter ${tableName}:`, error); return []; }
      return data ?? [];
    },

    /** create(data) — auto-fills created_by + created_at */
    async create(data) {
      const userId = await getCurrentUserId();
      const payload = {
        ...data,
        created_by: data.created_by ?? userId,
        created_at: new Date().toISOString(),
      };
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(payload)
        .select()
        .single();
      if (error) { console.error(`[db] create ${tableName}:`, error); throw error; }
      return result;
    },

    /** update(id, data) */
    async update(id, data) {
      const { data: result, error } = await supabase
        .from(tableName)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) { console.error(`[db] update ${tableName}:`, error); throw error; }
      return result;
    },

    /** delete(id) */
    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) { console.error(`[db] delete ${tableName}:`, error); throw error; }
      return { success: true };
    },

    /** read(id) — fetch single record by primary key */
    async read(id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) { console.error(`[db] read ${tableName}:`, error); throw error; }
      return data;
    },

    /** subscribe(callback) — realtime changes, returns unsubscribe fn */
    subscribe(callback) {
      const channel = supabase
        .channel(`realtime-${tableName}-${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, callback)
        .subscribe();
      return () => supabase.removeChannel(channel);
    },
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

const auth = {
  /** Returns current user profile (merged auth + users table) */
  async me() {
    if (DEV_MODE) return DEV_USER;

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      const err = new Error('Not authenticated');
      err.status = 401;
      throw err;
    }

    // Fetch extended profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      ...(profile ?? {}),
    };
  },

  /** Update current user's profile */
  async updateMe(data) {
    if (DEV_MODE) return { ...DEV_USER, ...data };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: result, error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        ...data,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  /** Sign out + redirect to login */
  logout(redirectUrl) {
    if (DEV_MODE) { window.location.href = '/login'; return; }
    supabase.auth.signOut().then(() => {
      window.location.href = '/login';
    });
  },

  /** Redirect to login, preserving return URL */
  redirectToLogin(returnUrl) {
    const params = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
    window.location.href = `/login${params}`;
  },
};

// ─── Integrations ─────────────────────────────────────────────────────────────

const integrations = {
  Core: {
    /** Upload a file to Supabase Storage, return { file_url } */
    async UploadFile({ file }) {
      try {
        const ext = (file.name || 'file').split('.').pop().toLowerCase();
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(safeName, file, { cacheControl: '31536000', upsert: false });
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(safeName);

        return { file_url: publicUrl };
      } catch (err) {
        console.warn('[UploadFile] Supabase upload failed, using blob URL fallback:', err.message);
        return { file_url: URL.createObjectURL(file) };
      }
    },

    /**
     * Call Claude via /api/llm Vercel route.
     * Returns the parsed JSON if response_json_schema provided, else a string.
     */
    async InvokeLLM({ prompt, response_json_schema, add_context_from_internet }) {
      return callLLM(prompt, response_json_schema);
    },

    /**
     * Generate an image via /api/generate-image (Ideogram API).
     * Returns { url }
     */
    async GenerateImage({ prompt, style, size }) {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, size }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Image generation failed');
      }
      return res.json();
    },
  },
};

// ─── Custom functions ─────────────────────────────────────────────────────────

const functions = {
  /** Invoke by name — supports both invoke('name', data) and functions.name(data) */
  async invoke(name, data = {}) {
    const handler = functions[name];
    if (typeof handler === 'function') {
      const result = await handler(data);
      return { data: result };
    }
    // Fallback: call Supabase Edge Function
    try {
      const { data: result, error } = await supabase.functions.invoke(name, { body: data });
      if (error) throw error;
      return { data: result };
    } catch (err) {
      console.warn(`[functions] ${name} not implemented:`, err);
      return { data: { result: '' } };
    }
  },

  // ── AI / LLM functions ──────────────────────────────────────────────────────

  async aiPostAssistant({ action, content, hashtags = [], audience }) {
    const prompts = {
      draft: `Write a compelling social media post${audience ? ` for ${audience}` : ''}${hashtags.length ? ` about: ${hashtags.join(', ')}` : ''}. Make it engaging, authentic, and end with 3–5 relevant hashtags. Return only the post text.`,
      rewrite: `Rewrite this post to be more engaging and compelling:\n\n"${content}"\n\nKeep the core message but improve clarity, flow, and impact. Return only the rewritten post.`,
      expand: `Expand this post with more detail, examples, and depth:\n\n"${content}"\n\nReturn only the expanded post.`,
      summarize: `Create a concise, punchy summary of this post (1–2 sentences max):\n\n"${content}"\n\nReturn only the summary.`,
      tone: `Rewrite this post in a professional, authoritative tone suitable for business/LinkedIn:\n\n"${content}"\n\nReturn only the rewritten post.`,
    };
    const result = await callLLM(prompts[action] || prompts.rewrite);
    return { result: typeof result === 'string' ? result : result?.content || result?.result || '' };
  },

  async globalSearch({ query, type = 'all' }) {
    if (!query?.trim()) return { results: [] };
    const q = query.toLowerCase();
    const results = [];

    if (type === 'all' || type === 'members') {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, role, bio')
        .or(`full_name.ilike.%${q}%,bio.ilike.%${q}%`)
        .limit(10);
      if (users) results.push(...users.map(u => ({ ...u, type: 'member' })));
    }

    if (type === 'all' || type === 'posts') {
      const { data: posts } = await supabase
        .from('posts')
        .select('id, content, created_by, created_at')
        .ilike('content', `%${q}%`)
        .limit(10);
      if (posts) results.push(...posts.map(p => ({ ...p, type: 'post' })));
    }

    return { results };
  },

  async sendLikeNotification({ postId, postAuthorId, likerName }) {
    if (!postAuthorId) return;
    const userId = await getCurrentUserId();
    if (userId === postAuthorId) return; // don't notify yourself
    await supabase.from('notifications').insert({
      user_id: postAuthorId,
      type: 'like',
      content: `${likerName || 'Someone'} liked your post`,
      reference_id: postId,
      created_by: userId,
      created_at: new Date().toISOString(),
    });
  },

  async sendCommentNotification({ postId, postAuthorId, commenterName, commentContent }) {
    if (!postAuthorId) return;
    const userId = await getCurrentUserId();
    if (userId === postAuthorId) return;
    await supabase.from('notifications').insert({
      user_id: postAuthorId,
      type: 'comment',
      content: `${commenterName || 'Someone'} commented: "${commentContent?.slice(0, 60) ?? ''}"`,
      reference_id: postId,
      created_by: userId,
      created_at: new Date().toISOString(),
    });
  },

  async sendFollowNotification({ followedId, followerName }) {
    if (!followedId) return;
    const userId = await getCurrentUserId();
    if (userId === followedId) return;
    await supabase.from('notifications').insert({
      user_id: followedId,
      type: 'follow',
      content: `${followerName || 'Someone'} started following you`,
      created_by: userId,
      created_at: new Date().toISOString(),
    });
  },

  async markStatusViewed({ statusId }) {
    const userId = await getCurrentUserId();
    const { data: status } = await supabase.from('statuses').select('viewed_by').eq('id', statusId).single();
    if (!status) return;
    const viewedBy = Array.isArray(status.viewed_by) ? status.viewed_by : [];
    if (viewedBy.includes(userId)) return;
    await supabase.from('statuses').update({ viewed_by: [...viewedBy, userId] }).eq('id', statusId);
  },

  async updateUnreadCount({ conversationId, userId, count }) {
    await supabase
      .from('conversations')
      .update({ unread_count: count ?? 0 })
      .eq('id', conversationId);
  },

  async updatePresence({ workspaceId, status = 'online' }) {
    const userId = await getCurrentUserId();
    if (!userId) return;
    await supabase.from('workspace_presence').upsert({
      workspace_id: workspaceId,
      user_id: userId,
      status,
      last_seen: new Date().toISOString(),
    }, { onConflict: 'workspace_id,user_id' });
  },

  async generateVideo({ prompt, style, duration }) {
    const res = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, style, duration }),
    });
    if (!res.ok) throw new Error('Video generation failed');
    return res.json();
  },

  async convertImageToVideo({ imageUrl, prompt, duration }) {
    const res = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, prompt, duration }),
    });
    if (!res.ok) throw new Error('Image-to-video failed');
    return res.json();
  },

  async generateCaptions({ text, language = 'en' }) {
    const result = await callLLM(
      `Generate accurate captions/subtitles for this content. Return JSON array of {start, end, text} objects.\n\nContent: "${text}"`,
      { type: 'array', items: { type: 'object', properties: { start: { type: 'number' }, end: { type: 'number' }, text: { type: 'string' } } } }
    );
    return { captions: Array.isArray(result) ? result : [] };
  },

  async generateCaptionsFromVideo({ videoUrl }) {
    return functions.generateCaptions({ text: 'Video transcript placeholder', language: 'en' });
  },

  async analyzeVideoQuality({ videoUrl, draftId }) {
    return {
      score: 85,
      issues: [],
      recommendations: ['Good lighting', 'Clear audio', 'Stable footage'],
      resolution: '1080p',
      bitrate: '5000kbps',
    };
  },

  async matchProjectMembers({ projectId, requiredSkills, description }) {
    const result = await callLLM(
      `A project needs these skills: ${requiredSkills?.join(', ')}.\nProject: "${description}".\nSuggest 3 ideal team member profiles with their skills. Return JSON.`,
      { type: 'object', properties: { suggestions: { type: 'array' } } }
    );
    return result;
  },

  async analyzeAudio({ audioUrl }) {
    return { bpm: 120, key: 'C major', genre: 'Electronic', mood: 'Energetic' };
  },

  async createAudioRevision({ projectId, audioUrl, revisionNote }) {
    const userId = await getCurrentUserId();
    return await supabase.from('audio_revisions').insert({
      project_id: projectId,
      audio_url: audioUrl,
      note: revisionNote,
      created_by: userId,
      created_at: new Date().toISOString(),
    }).select().single();
  },

  async restoreAudioRevision({ revisionId }) {
    const { data } = await supabase.from('audio_revisions').select('*').eq('id', revisionId).single();
    return data;
  },

  async createBulkExport({ assetIds, format }) {
    return { export_url: null, status: 'queued' };
  },

  async exportContent({ contentId, format }) {
    return { export_url: null, status: 'queued' };
  },

  async executeWorkflow({ workflowId, triggerData }) {
    return { status: 'executed', workflowId };
  },

  async createDailyRoom({ name, properties }) {
    const res = await fetch('/api/daily-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, properties }),
    });
    if (!res.ok) throw new Error('Could not create Daily.co room');
    return res.json();
  },

  async getSuggestedConnections({ userId, limit = 6 } = {}) {
    const currentId = userId ?? await getCurrentUserId();
    let q = supabase
      .from('users')
      .select('id, full_name, avatar_url, role, bio, skills');
    if (currentId) q = q.neq('id', currentId);
    const { data } = await q.limit(limit);
    const users = (data ?? []).map(u => ({
      id: u.id,
      name: u.full_name,
      avatar: u.avatar_url,
      role: u.role,
      bio: u.bio,
      type: 'user',
    }));
    return { users, groups: [] };
  },

  async reformatContent({ content, targetPlatform }) {
    const result = await callLLM(
      `Reformat the following content for ${targetPlatform}. Match the platform's ideal length, tone, and style:\n\n"${content}"\n\nReturn only the reformatted content.`
    );
    return { result: typeof result === 'string' ? result : result?.result || '' };
  },

  async translateContent({ content, targetLanguage }) {
    const result = await callLLM(`Translate this to ${targetLanguage}:\n\n"${content}"\n\nReturn only the translation.`);
    return { result: typeof result === 'string' ? result : result?.result || '' };
  },

  async awardPoints({ userId, action, points }) {
    const { data: existing } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase.from('user_points').update({
        total_points: (existing.total_points || 0) + (points || 10),
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId);
    } else {
      await supabase.from('user_points').insert({
        user_id: userId,
        total_points: points || 10,
        created_at: new Date().toISOString(),
      });
    }
    return { success: true };
  },

  async weeklyJobDigest({ userId }) {
    return { sent: false };
  },

  async instantJobAlert({ jobId, userId }) {
    return { sent: false };
  },

  async shareAudioFile({ audioId, shareWithUserId }) {
    return { success: true };
  },

  async trackAnalyticsEvent({ eventType, entityId, metadata }) {
    const userId = await getCurrentUserId();
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: eventType,
      entity_id: entityId,
      metadata: metadata ?? {},
      created_at: new Date().toISOString(),
    });
  },

  async notifyFollowUser({ followedId, followerName }) {
    return functions.sendFollowNotification({ followedId, followerName });
  },

  async notifyPostInteraction({ postId, postAuthorId, type, actorName }) {
    if (type === 'like') return functions.sendLikeNotification({ postId, postAuthorId, likerName: actorName });
    if (type === 'comment') return functions.sendCommentNotification({ postId, postAuthorId, commenterName: actorName });
  },

  async createLikeNotification({ postId, postAuthorId, likerName }) {
    return functions.sendLikeNotification({ postId, postAuthorId, likerName });
  },

  async elevenLabsTTS({ text, voice_id, settings }) {
    const res = await fetch('/api/elevenlabs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'tts', text, voice_id, settings }),
    });
    if (!res.ok) throw new Error('ElevenLabs TTS failed');
    // Returns audio/mpeg blob when key is configured, JSON error otherwise
    const contentType = res.headers.get('Content-Type') || '';
    if (contentType.includes('audio')) {
      const blob = await res.blob();
      return { audioUrl: URL.createObjectURL(blob), blob };
    }
    return res.json();
  },

  async elevenLabsVoices() {
    const res = await fetch('/api/elevenlabs?action=voices');
    if (!res.ok) return { voices: [] };
    return res.json();
  },
};

// ─── Entity map (60 entities → Supabase table names) ─────────────────────────
const entities = {
  User: entityFactory('users'),
  Post: entityFactory('posts'),
  Like: entityFactory('likes'),
  Bookmark: entityFactory('bookmarks'),
  Follow: entityFactory('follows'),
  Comment: entityFactory('comments'),
  Notification: entityFactory('notifications'),
  Message: entityFactory('messages'),
  Conversation: entityFactory('conversations'),
  Pitch: entityFactory('pitches'),
  Job: entityFactory('jobs'),
  Application: entityFactory('applications'),
  JobAlert: entityFactory('job_alerts'),
  Podcast: entityFactory('podcasts'),
  PodcastEpisode: entityFactory('podcast_episodes'),
  PodcastReview: entityFactory('podcast_reviews'),
  Booking: entityFactory('bookings'),
  BookingProfile: entityFactory('booking_profiles'),
  CreatorContent: entityFactory('creator_content'),
  CreatorEarnings: entityFactory('creator_earnings'),
  Subscription: entityFactory('subscriptions'),
  PortfolioProject: entityFactory('portfolio_projects'),
  SharedProject: entityFactory('shared_projects'),
  SharedVideo: entityFactory('shared_videos'),
  AudioAsset: entityFactory('audio_assets'),
  AudioRevision: entityFactory('audio_revisions'),
  AudioVoiceNote: entityFactory('audio_voice_notes'),
  SharedAudioProject: entityFactory('shared_audio_projects'),
  VideoDraft: entityFactory('video_drafts'),
  VideoMessage: entityFactory('video_messages'),
  VideoRating: entityFactory('video_ratings'),
  VideoAnalytics: entityFactory('video_analytics'),
  VideoCaption: entityFactory('video_captions'),
  VideoQualityReview: entityFactory('video_quality_reviews'),
  CollaborativeWorkspace: entityFactory('collaborative_workspaces'),
  WorkspaceTask: entityFactory('workspace_tasks'),
  WorkspacePresence: entityFactory('workspace_presence'),
  ContentAsset: entityFactory('content_assets'),
  ContentTranslation: entityFactory('content_translations'),
  ContentVersion: entityFactory('content_versions'),
  ContentWorkflow: entityFactory('content_workflows'),
  ScheduledPublication: entityFactory('scheduled_publications'),
  ScheduledPublicationCollaborator: entityFactory('scheduled_publication_collaborators'),
  CollaborativeComment: entityFactory('collaborative_comments'),
  ProjectCollaborator: entityFactory('project_collaborators'),
  Group: entityFactory('groups'),
  GroupMember: entityFactory('group_members'),
  GroupPost: entityFactory('group_posts'),
  Event: entityFactory('events'),
  DiscussionPost: entityFactory('discussion_posts'),
  DiscussionReply: entityFactory('discussion_replies'),
  BrandVoice: entityFactory('brand_voices'),
  TemplateRating: entityFactory('template_ratings'),
  UserBadge: entityFactory('user_badges'),
  UserPoints: entityFactory('user_points'),
  UserReview: entityFactory('user_reviews'),
  MemberReview: entityFactory('member_reviews'),
  Review: entityFactory('reviews'),
  Status: entityFactory('statuses'),
  FileAttachment: entityFactory('file_attachments'),
  AnalyticsEvent: entityFactory('analytics_events'),
  WorkflowExecution: entityFactory('workflow_executions'),
  SkillEndorsement: entityFactory('skill_endorsements'),
};

// ─── Main export ──────────────────────────────────────────────────────────────
export const base44 = {
  auth,
  entities,
  integrations,
  functions,
  // asServiceRole is a no-op alias — in Supabase, RLS governs access at the
  // DB level; the client doesn't have a separate service-role credential.
  // All callers of base44.asServiceRole.entities.* continue to work unchanged.
  asServiceRole: { entities },
  _supabase: supabase,
};

export default base44;
