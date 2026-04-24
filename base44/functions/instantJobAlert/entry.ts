/**
 * Called when a new Job is created (via entity automation).
 * Checks all active instant-frequency alerts and notifies matching users.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();
  const job = body?.data;

  if (!job) return Response.json({ error: 'No job data' }, { status: 400 });

  // Only active instant alerts
  const alerts = await base44.asServiceRole.entities.JobAlert.filter({ is_active: true, digest_frequency: 'instant' });

  let notified = 0;
  for (const alert of alerts) {
    // Skip if this alert belongs to the job poster
    if (alert.user_id === job.poster_id) continue;

    // Category filter
    if (alert.categories?.length && !alert.categories.includes(job.category)) continue;
    // Job type filter
    if (alert.job_types?.length && !alert.job_types.includes(job.type)) continue;
    // Remote filter
    if (alert.remote_only && !job.remote) continue;
    // Budget filter
    if (alert.min_budget && job.budget_max && job.budget_max < alert.min_budget) continue;
    if (alert.max_budget && job.budget_min && job.budget_min > alert.max_budget) continue;
    // Keyword filter
    if (alert.keywords) {
      const kw = alert.keywords.toLowerCase();
      const haystack = `${job.title} ${job.description} ${job.category}`.toLowerCase();
      if (!haystack.includes(kw)) continue;
    }

    // In-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_id: alert.user_id,
      type: 'job_match',
      title: 'New job matches your alert',
      body: `"${job.title}" by ${job.poster_name || 'someone'} — ${job.category || ''}`,
      link: '/marketplace',
      read: false,
    });

    // Email notification
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: alert.user_email,
      subject: `🔔 New job match: "${job.title}"`,
      body: `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#111;">
          <div style="background:#2d7d72;padding:20px 24px;border-radius:12px 12px 0 0;">
            <h2 style="color:#fff;margin:0;font-size:18px;">New Job Match!</h2>
            <p style="color:#a7f3d0;margin:6px 0 0;font-size:13px;">A new opportunity matching your alert "${alert.label || 'Job Alert'}" was just posted.</p>
          </div>
          <div style="padding:24px;background:#f9fafb;border-radius:0 0 12px 12px;">
            <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;background:#fff;">
              <h3 style="margin:0 0 4px;font-size:16px;">${job.title}</h3>
              <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">${job.poster_name || ''} ${job.category ? `· ${job.category}` : ''} ${job.remote ? '· Remote' : ''}</p>
              ${job.description ? `<p style="margin:0;font-size:13px;color:#6b7280;">${job.description.slice(0, 160)}${job.description.length > 160 ? '…' : ''}</p>` : ''}
            </div>
            <div style="text-align:center;margin-top:20px;">
              <a href="/marketplace" style="background:#2d7d72;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Job →</a>
            </div>
            <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:20px;">Manage your alerts in the Marketplace on Philomni.</p>
          </div>
        </div>
      `,
    });

    notified++;
  }

  return Response.json({ notified });
});