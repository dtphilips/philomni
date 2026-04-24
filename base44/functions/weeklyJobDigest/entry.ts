import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow both scheduled (no user) and manual admin calls
  let isAdmin = false;
  try {
    const user = await base44.auth.me();
    isAdmin = user?.role === 'admin';
  } catch (_) {
    // Called from scheduler — no user context, proceed
  }

  // Fetch all active alerts
  const alerts = await base44.asServiceRole.entities.JobAlert.filter({ is_active: true });
  if (!alerts.length) return Response.json({ sent: 0, message: 'No active alerts' });

  // Jobs posted in the last 7 days
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentJobs = await base44.asServiceRole.entities.Job.filter({ status: 'open' }, '-created_date', 200);
  const newJobs = recentJobs.filter(j => j.created_date >= since);

  if (!newJobs.length) return Response.json({ sent: 0, message: 'No new jobs this week' });

  let sent = 0;

  for (const alert of alerts) {
    // Filter jobs against this alert's criteria
    const matched = newJobs.filter(job => {
      // Category filter
      if (alert.categories?.length) {
        if (!alert.categories.includes(job.category)) return false;
      }
      // Job type filter
      if (alert.job_types?.length) {
        if (!alert.job_types.includes(job.type)) return false;
      }
      // Remote filter
      if (alert.remote_only && !job.remote) return false;
      // Budget filter (at least overlap)
      if (alert.min_budget && job.budget_max && job.budget_max < alert.min_budget) return false;
      if (alert.max_budget && job.budget_min && job.budget_min > alert.max_budget) return false;
      // Keyword filter
      if (alert.keywords) {
        const kw = alert.keywords.toLowerCase();
        const haystack = `${job.title} ${job.description} ${job.category}`.toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });

    if (!matched.length) continue;

    // Create in-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_id: alert.user_id,
      type: 'job_match',
      title: `${matched.length} new job${matched.length > 1 ? 's' : ''} match your alert "${alert.label || 'Job Alert'}"`,
      body: matched.slice(0, 3).map(j => j.title).join(', ') + (matched.length > 3 ? ` and ${matched.length - 3} more` : ''),
      link: '/marketplace',
      read: false,
    });

    // Send email digest
    const jobListHtml = matched.slice(0, 10).map(j => `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px;">
        <h3 style="margin:0 0 4px;font-size:16px;">${j.title}</h3>
        <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">${j.poster_name || ''} ${j.category ? `· ${j.category}` : ''} ${j.remote ? '· Remote' : ''}</p>
        ${j.budget_min || j.budget_max ? `<p style="margin:0;font-size:13px;color:#374151;">Budget: ${j.budget_min ? '$' + j.budget_min.toLocaleString() : ''}${j.budget_min && j.budget_max ? ' – ' : ''}${j.budget_max ? '$' + j.budget_max.toLocaleString() : ''}</p>` : ''}
        ${j.description ? `<p style="margin:8px 0 0;font-size:13px;color:#6b7280;">${j.description.slice(0, 120)}${j.description.length > 120 ? '…' : ''}</p>` : ''}
      </div>
    `).join('');

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: alert.user_email,
      subject: `📋 ${matched.length} new job match${matched.length > 1 ? 'es' : ''} for "${alert.label || 'your alert'}"`,
      body: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;color:#111;">
          <div style="background:#2d7d72;padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:22px;">Your Weekly Job Digest</h1>
            <p style="color:#a7f3d0;margin:8px 0 0;font-size:14px;">Hi ${alert.user_name || 'there'} — here are the new opportunities matching your alert.</p>
          </div>
          <div style="padding:24px;background:#f9fafb;border-radius:0 0 12px 12px;">
            ${jobListHtml}
            ${matched.length > 10 ? `<p style="text-align:center;color:#6b7280;font-size:13px;">…and ${matched.length - 10} more. Visit the Marketplace to see all.</p>` : ''}
            <div style="text-align:center;margin-top:24px;">
              <a href="/marketplace" style="background:#2d7d72;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View All Jobs →</a>
            </div>
            <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:20px;">You're receiving this because you set up a job alert on Philomni. Manage your alerts in the Marketplace.</p>
          </div>
        </div>
      `,
    });

    // Update last_sent_at
    await base44.asServiceRole.entities.JobAlert.update(alert.id, { last_sent_at: new Date().toISOString() });

    sent++;
  }

  return Response.json({ sent, totalAlerts: alerts.length, newJobs: newJobs.length });
});