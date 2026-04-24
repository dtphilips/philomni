import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draft_id } = await req.json();
    if (!draft_id) {
      return Response.json({ error: 'Draft ID required' }, { status: 400 });
    }

    // Mock quality analysis - in production, would use actual video analysis
    const overallScore = Math.floor(Math.random() * 40) + 60;
    
    const analysisResult = {
      draft_id,
      creator_id: user.id,
      overall_score: overallScore,
      audio_analysis: {
        status: overallScore >= 80 ? 'good' : overallScore >= 60 ? 'warning' : 'critical',
        average_level: -15 + Math.random() * 5,
        peak_level: -3 + Math.random() * 3,
        noise_detected: Math.random() > 0.7,
        issues: [
          Math.random() > 0.6 ? 'Audio levels are slightly low' : null,
          Math.random() > 0.7 ? 'Minor background noise detected' : null
        ].filter(Boolean)
      },
      visual_analysis: {
        status: overallScore >= 80 ? 'good' : overallScore >= 60 ? 'warning' : 'critical',
        brightness_consistency: 75 + Math.random() * 20,
        color_grading_issues: [
          Math.random() > 0.6 ? 'Slight color temperature shift at 45s' : null,
          Math.random() > 0.8 ? 'Inconsistent white balance' : null
        ].filter(Boolean),
        lighting_quality: ['poor', 'fair', 'good', 'excellent'][Math.floor(Math.random() * 4)]
      },
      transition_analysis: {
        status: Math.random() > 0.3 ? 'good' : 'warning',
        total_transitions: Math.floor(Math.random() * 8) + 1,
        broken_transitions: Math.random() > 0.7 ? [
          {
            timestamp: Math.floor(Math.random() * 120),
            issue: 'Abrupt transition, consider fade effect'
          }
        ] : []
      },
      recommendations: [
        'Normalize audio levels to -14dB',
        'Use consistent lighting throughout the video',
        'Consider adding fade transitions between scenes',
        'Ensure text overlay is readable on dark backgrounds'
      ],
      reviewed_at: new Date().toISOString()
    };

    // Check if review exists
    const existing = await base44.entities.VideoQualityReview.filter({ draft_id });
    if (existing.length > 0) {
      await base44.entities.VideoQualityReview.update(existing[0].id, analysisResult);
    } else {
      await base44.entities.VideoQualityReview.create(analysisResult);
    }

    return Response.json({ success: true, analysis: analysisResult });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});