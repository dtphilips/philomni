import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectTitle, requiredSkills, projectType, teamSize, description } = await req.json();

    if (!requiredSkills || requiredSkills.length === 0) {
      return Response.json({ error: 'Required skills are mandatory' }, { status: 400 });
    }

    // Fetch all users with their expertise
    const allUsers = await base44.asServiceRole.entities.User.list('', 1000);
    const userExpertise = await base44.asServiceRole.entities.UserExpertise?.list?.('', 1000) || [];

    // Build user profile map with expertise
    const userProfiles = {};
    for (const u of allUsers) {
      if (u.id === user.id) continue; // Skip current user
      const expertise = userExpertise.filter(e => e.user_id === u.id);
      userProfiles[u.id] = {
        id: u.id,
        name: u.full_name,
        email: u.email,
        expertise: expertise.map(e => e.skill_name || e.skill).join(', '),
        bio: u.bio || '',
        role: u.role,
      };
    }

    // Use LLM to match users to project requirements
    const profilesJson = Object.values(userProfiles)
      .slice(0, 50) // Limit to first 50 for performance
      .map(p => `ID: ${p.id}, Name: ${p.name}, Skills: ${p.expertise}, Bio: ${p.bio}`)
      .join('\n');

    const matchingPrompt = `You are a project team matcher. Analyze the following user profiles and match them to project requirements.

PROJECT:
- Title: ${projectTitle}
- Type: ${projectType}
- Description: ${description}
- Required Skills: ${requiredSkills.join(', ')}
- Team Size Needed: ${teamSize}

USER PROFILES:
${profilesJson}

For each user, provide:
1. How well their skills match (0-100%)
2. Why they're a good/poor fit
3. Whether to include them in recommendations

Return a JSON array of recommended users sorted by match score, like:
[
  {
    "userId": "...",
    "userName": "...",
    "matchScore": 85,
    "matchReasons": ["skill1", "skill2"],
    "missingSkills": ["skill3"],
    "recommendation": "Highly recommended for..."
  }
]

Only return valid JSON, no other text.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: matchingPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          matches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                userId: { type: 'string' },
                userName: { type: 'string' },
                matchScore: { type: 'number' },
                matchReasons: { type: 'array', items: { type: 'string' } },
                missingSkills: { type: 'array', items: { type: 'string' } },
                recommendation: { type: 'string' },
              },
            },
          },
        },
      },
    });

    // Parse and validate results
    let matches = [];
    try {
      if (result.matches) {
        matches = result.matches
          .filter(m => m.matchScore >= 40) // Filter low scores
          .slice(0, Math.min(teamSize + 3, 10)) // Return up to teamSize + 3
          .sort((a, b) => b.matchScore - a.matchScore);
      }
    } catch (e) {
      console.error('Failed to parse LLM response:', e);
    }

    return Response.json({
      projectTitle,
      requiredSkills,
      matches,
      totalMatches: matches.length,
    });
  } catch (error) {
    console.error('Error in matchProjectMembers:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});