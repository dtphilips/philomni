import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function err(msg: string, status = 400) {
  return json({ error: msg }, status)
}

async function fireWebhook(url: string, payload: unknown) {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (_) { /* best-effort */ }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ── Auth via x-api-key header ───────────────────────────────────────────────
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey) return err('Missing x-api-key header', 401)

  const { data: keyRow, error: keyErr } = await supabase
    .from('developer_api_keys')
    .select('id, user_id, plan, is_active')
    .eq('key', apiKey)
    .single()

  if (keyErr || !keyRow) return err('Invalid API key', 401)
  if (!keyRow.is_active) return err('API key is inactive', 403)

  // Log usage
  await supabase.from('developer_api_logs').insert({
    key_id: keyRow.id,
    endpoint: new URL(req.url).pathname,
    method: req.method,
  })

  const url   = new URL(req.url)
  const parts = url.pathname.replace(/^\/brand-briefs-api\/?/, '').split('/').filter(Boolean)
  // parts examples: ['briefs'], ['briefs','ID'], ['briefs','ID','applications'], ['briefs','ID','applications','APP_ID'], ['analytics']

  const method = req.method

  // ── GET /analytics ──────────────────────────────────────────────────────────
  if (parts[0] === 'analytics' && method === 'GET') {
    const { data: briefs } = await supabase
      .from('brand_briefs')
      .select('id, status, budget_min, budget_max, views, application_count')
      .eq('api_key_id', keyRow.id)

    if (!briefs || briefs.length === 0) {
      return json({ analytics: { briefs: { total: 0, open: 0, closed: 0 }, applications: { total: 0, approved: 0, approval_rate: '0%' }, reach: { total_views: 0, avg_applications_per_brief: '0' }, budget: { avg_brief_budget: 0 } } })
    }

    const briefIds = briefs.map(b => b.id)
    const { data: apps } = await supabase
      .from('brief_applications')
      .select('id, status')
      .in('brief_id', briefIds)

    const allApps    = apps ?? []
    const approved   = allApps.filter(a => a.status === 'approved').length
    const totalViews = briefs.reduce((s, b) => s + (b.views ?? 0), 0)
    const avgBudget  = briefs.reduce((s, b) => s + ((b.budget_min + b.budget_max) / 2), 0) / briefs.length
    const open       = briefs.filter(b => b.status === 'open').length
    const closed     = briefs.filter(b => b.status === 'closed').length

    return json({
      analytics: {
        briefs: { total: briefs.length, open, closed },
        applications: {
          total: allApps.length,
          approved,
          approval_rate: allApps.length ? ((approved / allApps.length) * 100).toFixed(1) + '%' : '0%',
        },
        reach: {
          total_views: totalViews,
          avg_applications_per_brief: briefs.length ? (allApps.length / briefs.length).toFixed(1) : '0',
        },
        budget: { avg_brief_budget: Math.round(avgBudget) },
      },
    })
  }

  // ── GET /briefs ─────────────────────────────────────────────────────────────
  if (parts[0] === 'briefs' && parts.length === 1 && method === 'GET') {
    const p      = url.searchParams
    const limit  = Math.min(parseInt(p.get('limit') ?? '20'), 100)
    const offset = parseInt(p.get('offset') ?? '0')
    const mine   = p.get('mine') === 'true'

    let q = supabase
      .from('brand_briefs')
      .select(`id, title, status, budget_min, budget_max, currency, deadline, content_types, niches, min_followers, views, application_count, external_ref, created_at, company:companies(id, name, logo_url)`, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (mine) q = q.eq('api_key_id', keyRow.id)
    if (p.get('status'))       q = q.eq('status', p.get('status'))
    if (p.get('content_type')) q = q.contains('content_types', [p.get('content_type')])

    const { data, count, error } = await q
    if (error) return err(error.message)
    return json({ briefs: data, total: count, limit, offset })
  }

  // ── POST /briefs ─────────────────────────────────────────────────────────────
  if (parts[0] === 'briefs' && parts.length === 1 && method === 'POST') {
    const body = await req.json()
    const { title, description, budget_min, budget_max, currency = 'USD', deadline, content_types, niches, min_followers, target_audience, external_ref, webhook_url } = body

    if (!title || !budget_min || !budget_max || !deadline) {
      return err('title, budget_min, budget_max, and deadline are required')
    }

    // Resolve company for this user
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', keyRow.user_id)
      .maybeSingle()

    const { data: brief, error: insErr } = await supabase
      .from('brand_briefs')
      .insert({
        title, description, budget_min, budget_max, currency, deadline,
        content_types: content_types ?? [],
        niches: niches ?? [],
        min_followers: min_followers ?? 0,
        target_audience, external_ref, webhook_url,
        status: 'open',
        posted_by: keyRow.user_id,
        company_id: company?.id ?? null,
        api_key_id: keyRow.id,
      })
      .select('id, title, status, external_ref, created_at')
      .single()

    if (insErr) return err(insErr.message)
    return json({ brief }, 201)
  }

  // ── GET /briefs/:id ──────────────────────────────────────────────────────────
  if (parts[0] === 'briefs' && parts.length === 2 && method === 'GET') {
    const briefId = parts[1]

    // Increment view counter (fire-and-forget)
    supabase.rpc('increment_brief_view', { p_brief_id: briefId }).catch(() => {})

    const { data: brief, error } = await supabase
      .from('brand_briefs')
      .select(`*, company:companies(id, name, logo_url)`)
      .eq('id', briefId)
      .single()

    if (error || !brief) return err('Brief not found', 404)
    return json({ brief })
  }

  // ── PATCH /briefs/:id ────────────────────────────────────────────────────────
  if (parts[0] === 'briefs' && parts.length === 2 && method === 'PATCH') {
    const briefId = parts[1]
    const body = await req.json()
    const allowed = ['status', 'budget_min', 'budget_max', 'deadline', 'webhook_url', 'title', 'description', 'target_audience']
    const updates: Record<string, unknown> = {}
    for (const k of allowed) {
      if (body[k] !== undefined) updates[k] = body[k]
    }

    const { data: brief, error } = await supabase
      .from('brand_briefs')
      .update(updates)
      .eq('id', briefId)
      .eq('api_key_id', keyRow.id)
      .select('*')
      .single()

    if (error || !brief) return err('Brief not found or not owned by this key', 404)
    return json({ brief })
  }

  // ── GET /briefs/:id/applications ─────────────────────────────────────────────
  if (parts[0] === 'briefs' && parts.length === 3 && parts[2] === 'applications' && method === 'GET') {
    const briefId = parts[1]
    const p       = url.searchParams
    const limit   = Math.min(parseInt(p.get('limit') ?? '50'), 200)
    const offset  = parseInt(p.get('offset') ?? '0')

    // Verify ownership
    const { data: brief } = await supabase.from('brand_briefs').select('id').eq('id', briefId).eq('api_key_id', keyRow.id).single()
    if (!brief) return err('Brief not found or not owned by this key', 404)

    let q = supabase
      .from('brief_applications')
      .select(`id, status, pitch, quote, portfolio_urls, created_at, approved_at, decision_note, creator:profiles(id, full_name, username, avatar_url, follower_count)`, { count: 'exact' })
      .eq('brief_id', briefId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (p.get('status')) q = q.eq('status', p.get('status'))

    const { data, count, error } = await q
    if (error) return err(error.message)
    return json({ applications: data, total: count, limit, offset })
  }

  // ── PATCH /briefs/:id/applications/:appId ───────────────────────────────────
  if (parts[0] === 'briefs' && parts.length === 4 && parts[2] === 'applications' && method === 'PATCH') {
    const [, briefId, , appId] = parts
    const { status, decision_note } = await req.json()

    if (!['approved', 'rejected', 'shortlisted'].includes(status)) {
      return err('status must be one of: approved, rejected, shortlisted')
    }

    // Verify brief ownership
    const { data: brief } = await supabase.from('brand_briefs').select('id, webhook_url').eq('id', briefId).eq('api_key_id', keyRow.id).single()
    if (!brief) return err('Brief not found or not owned by this key', 404)

    const timestampField = status === 'approved' ? 'approved_at' : status === 'rejected' ? 'rejected_at' : 'shortlisted_at'
    const updates: Record<string, unknown> = { status, decision_note, [timestampField]: new Date().toISOString() }

    const { data: app, error } = await supabase
      .from('brief_applications')
      .update(updates)
      .eq('id', appId)
      .eq('brief_id', briefId)
      .select(`*, creator:profiles(id, full_name, username, avatar_url)`)
      .single()

    if (error || !app) return err('Application not found', 404)

    // Fire webhook
    if (brief.webhook_url) {
      await fireWebhook(brief.webhook_url, { event: `application.${status}`, application: app, brief_id: briefId })
    }

    return json({ application: app })
  }

  return err('Not found', 404)
})
