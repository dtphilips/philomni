import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, activityType, points, badgeId, badgeName, badgeIcon } = await req.json();

    if (!userId || !activityType || !points) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get or create user points
    const existing = await base44.asServiceRole.entities.UserPoints.filter({ user_id: userId }).then(p => p[0]);
    
    const pointsData = existing ? { ...existing } : { user_id: userId };
    const categoryKey = `${activityType}_points`;
    
    pointsData[categoryKey] = (pointsData[categoryKey] || 0) + points;
    pointsData.total_points = (pointsData.total_points || 0) + points;
    pointsData.level = Math.floor(pointsData.total_points / 1000) + 1;
    pointsData.last_activity_date = new Date().toISOString();

    if (existing) {
      await base44.asServiceRole.entities.UserPoints.update(existing.id, pointsData);
    } else {
      await base44.asServiceRole.entities.UserPoints.create(pointsData);
    }

    // Award badge if provided
    if (badgeId && badgeName && badgeIcon) {
      const existingBadge = await base44.asServiceRole.entities.UserBadge.filter({
        user_id: userId,
        badge_id: badgeId
      }).then(b => b[0]);

      if (!existingBadge) {
        await base44.asServiceRole.entities.UserBadge.create({
          user_id: userId,
          badge_id: badgeId,
          badge_name: badgeName,
          badge_icon: badgeIcon,
          category: activityType,
          earned_at: new Date().toISOString()
        });
      }
    }

    return Response.json({ success: true, newPoints: pointsData.total_points });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});