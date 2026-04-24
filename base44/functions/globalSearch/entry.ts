import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchQuery = '', category = 'all', limit = 50 } = await req.json();

    if (!searchQuery || searchQuery.trim().length < 2) {
      return Response.json({
        members: [],
        posts: [],
        projects: [],
        skills: [],
        total: 0,
      });
    }

    const query = searchQuery.toLowerCase().trim();
    const results = {
      members: [],
      posts: [],
      projects: [],
      skills: [],
    };

    // Search members
    if (category === 'all' || category === 'members') {
      const allUsers = await base44.asServiceRole.entities.User.list();
      results.members = allUsers
        .filter(u =>
          u.full_name?.toLowerCase().includes(query) ||
          u.headline?.toLowerCase().includes(query) ||
          u.bio?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query)
        )
        .slice(0, limit)
        .map(u => ({
          id: u.id,
          name: u.full_name,
          avatar: u.avatar_url,
          headline: u.headline,
          role: u.role,
          type: 'member',
        }));
    }

    // Search posts
    if (category === 'all' || category === 'posts') {
      const allPosts = await base44.asServiceRole.entities.Post.list();
      results.posts = allPosts
        .filter(p =>
          (p.text?.toLowerCase().includes(query) ||
            p.title?.toLowerCase().includes(query) ||
            p.hashtags?.some(tag => tag.toLowerCase().includes(query))) &&
          p.visibility !== 'private'
        )
        .slice(0, limit)
        .map(p => ({
          id: p.id,
          title: p.title || p.text?.substring(0, 100),
          author: p.author_name,
          authorId: p.author_id,
          authorAvatar: p.author_avatar,
          image: p.image_urls?.[0],
          hashtags: p.hashtags || [],
          type: 'post',
        }));
    }

    // Search projects
    if (category === 'all' || category === 'projects') {
      const allProjects = await base44.asServiceRole.entities.SharedProject.list();
      results.projects = allProjects
        .filter(p =>
          p.title?.toLowerCase().includes(query) ||
          p.prompt?.toLowerCase().includes(query) ||
          p.owner_name?.toLowerCase().includes(query)
        )
        .slice(0, limit)
        .map(p => ({
          id: p.id,
          title: p.title || 'Untitled',
          owner: p.owner_name,
          ownerId: p.owner_id,
          image: p.image_url || p.thumbnail_url,
          type: 'project',
        }));
    }

    // Search skills
    if (category === 'all' || category === 'skills') {
      const allUsers = await base44.asServiceRole.entities.User.list();
      const skillsMap = new Map();

      allUsers.forEach(u => {
        if (u.skills && Array.isArray(u.skills)) {
          u.skills.forEach(skill => {
            if (skill?.toLowerCase().includes(query)) {
              if (!skillsMap.has(skill)) {
                skillsMap.set(skill, []);
              }
              skillsMap.get(skill).push({
                userId: u.id,
                userName: u.full_name,
                avatar: u.avatar_url,
              });
            }
          });
        }
      });

      results.skills = Array.from(skillsMap.entries())
        .slice(0, limit)
        .map(([skill, users]) => ({
          skill,
          experts: users.slice(0, 5),
          count: users.length,
          type: 'skill',
        }));
    }

    const total = results.members.length + results.posts.length + results.projects.length + results.skills.length;

    return Response.json({
      ...results,
      total,
      query,
    });
  } catch (error) {
    console.error('Global search error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});