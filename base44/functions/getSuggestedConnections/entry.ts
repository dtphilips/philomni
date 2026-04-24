import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { limit = 8 } = await req.json();

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const currentUserFollow = await base44.asServiceRole.entities.Follow.filter({
      follower_id: user.id,
    });
    const followingIds = new Set(currentUserFollow.map(f => f.following_id));

    // Get all groups
    const allGroups = await base44.asServiceRole.entities.Group.list();
    const groupMembers = await base44.asServiceRole.entities.GroupMember.list();

    // Get user's groups
    const userGroups = groupMembers
      .filter(gm => gm.user_id === user.id)
      .map(gm => gm.group_id);

    // Get collaborative history
    const allCollaborators = await base44.asServiceRole.entities.ProjectCollaborator.list();
    const userCollaborations = allCollaborators
      .filter(c => c.collaborator_email === user.email)
      .map(c => c.project_id);

    // Calculate user match scores
    const userScores = allUsers
      .filter(u => u.id !== user.id && !followingIds.has(u.id))
      .map(u => {
        let score = 0;

        // Match skills/interests (weight: 30)
        if (user.skills && u.skills) {
          const commonSkills = user.skills.filter(s =>
            u.skills.includes(s)
          ).length;
          score += commonSkills * 30;
        }

        // Match categories (weight: 20)
        if (user.category && u.category && user.category === u.category) {
          score += 20;
        }

        // Mutual collaborators (weight: 25)
        if (user.headline && u.headline) {
          // Simple text similarity for headlines/interests
          const userHeadline = (user.headline || '').toLowerCase().split(/\s+/);
          const uHeadline = (u.headline || '').toLowerCase().split(/\s+/);
          const commonWords = userHeadline.filter(w =>
            uHeadline.includes(w) && w.length > 3
          ).length;
          score += commonWords * 25;
        }

        // Mutual connections bonus (weight: 25)
        if (user.role === u.role) {
          score += 10;
        }

        return { ...u, matchScore: score };
      })
      .filter(u => u.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    // Calculate group match scores
    const groupScores = allGroups
      .filter(g => !userGroups.includes(g.id))
      .map(g => {
        let score = 0;

        // Category match (weight: 50)
        if (user.category && g.category === user.category) {
          score += 50;
        }

        // Member overlap (weight: 30)
        const groupMembersIds = groupMembers
          .filter(gm => gm.group_id === g.id)
          .map(gm => gm.user_id);
        const commonMembers = groupMembersIds.filter(id =>
          followingIds.has(id)
        ).length;
        score += commonMembers * 30;

        // Tag overlap (weight: 20)
        if (user.skills && g.tags) {
          const commonTags = g.tags.filter(t =>
            user.skills.includes(t)
          ).length;
          score += commonTags * 20;
        }

        return { ...g, matchScore: score };
      })
      .filter(g => g.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, Math.ceil(limit / 2));

    return Response.json({
      users: userScores.map(u => ({
        id: u.id,
        name: u.full_name,
        avatar: u.avatar_url,
        headline: u.headline,
        matchScore: u.matchScore,
        category: u.category,
        skills: u.skills || [],
        type: 'user',
      })),
      groups: groupScores.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description,
        cover: g.cover_image,
        category: g.category,
        memberCount: g.member_count || 0,
        matchScore: g.matchScore,
        type: 'group',
      })),
    });
  } catch (error) {
    console.error('Suggested connections error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});