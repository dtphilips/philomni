import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, AlertTriangle, Zap, Volume2, Lightbulb, Clapperboard, ArrowRight } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'good':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    case 'critical':
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    default:
      return null;
  }
};

export default function QualityReview() {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  const { data: draft } = useQuery({
    queryKey: ['draft', draftId],
    queryFn: () => base44.entities.VideoDraft.get ? base44.entities.VideoDraft.list().then(drafts => drafts.find(d => d.id === draftId)) : null
  });

  const { data: review } = useQuery({
    queryKey: ['qualityReview', draftId],
    queryFn: async () => {
      if (!draftId) return null;
      const reviews = await base44.entities.VideoQualityReview.filter({ draft_id: draftId });
      return reviews[0];
    },
    enabled: !!draftId
  });

  const handleAnalyze = async () => {
    if (!draft) return;
    setIsAnalyzing(true);
    try {
      const response = await base44.functions.invoke('analyzeVideoQuality', { draft_id: draftId });
      queryClient.invalidateQueries({ queryKey: ['qualityReview', draftId] });
      toast.success('Analysis complete');
    } catch (error) {
      toast.error('Failed to analyze video');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!review) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
              ← Back
            </Button>
            <h1 className="text-3xl font-bold">Quality Review</h1>
            <p className="text-muted-foreground text-sm mt-1">{draft?.title}</p>
          </div>

          <Card className="text-center py-12">
            <CardContent>
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No analysis yet. Run a quality check to get started.</p>
              <Button onClick={handleAnalyze} disabled={isAnalyzing} className="gap-2">
                {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
            ← Back
          </Button>
          <h1 className="text-3xl font-bold">Quality Review</h1>
          <p className="text-muted-foreground text-sm mt-1">{draft?.title}</p>
        </div>

        {/* Overall Score */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Quality Score</p>
                <p className="text-4xl font-bold mt-2">{review.overall_score}/100</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-2">Ready to publish</p>
                {review.overall_score >= 80 ? (
                  <CheckCircle className="w-12 h-12 text-green-600 ml-auto" />
                ) : review.overall_score >= 60 ? (
                  <AlertTriangle className="w-12 h-12 text-yellow-600 ml-auto" />
                ) : (
                  <AlertCircle className="w-12 h-12 text-red-600 ml-auto" />
                )}
              </div>
            </div>
            <Progress value={review.overall_score} className="mt-4" />
          </CardContent>
        </Card>

        {/* Audio Analysis */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <CardTitle className="text-lg">Audio Analysis</CardTitle>
              </div>
              <StatusIcon status={review.audio_analysis?.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Average Level</p>
                <p className="text-lg font-semibold">{review.audio_analysis?.average_level}dB</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Peak Level</p>
                <p className="text-lg font-semibold">{review.audio_analysis?.peak_level}dB</p>
              </div>
            </div>
            {review.audio_analysis?.noise_detected && (
              <div className="p-3 rounded bg-yellow-50 border border-yellow-200">
                <p className="text-sm text-yellow-800">⚠️ Background noise detected. Consider noise reduction.</p>
              </div>
            )}
            {review.audio_analysis?.issues?.length > 0 && (
              <ul className="space-y-2">
                {review.audio_analysis.issues.map((issue, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Visual Analysis */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              <div className="flex-1">
                <CardTitle className="text-lg">Visual Analysis</CardTitle>
              </div>
              <StatusIcon status={review.visual_analysis?.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Brightness Consistency</p>
                <p className="text-lg font-semibold">{review.visual_analysis?.brightness_consistency}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lighting Quality</p>
                <p className="text-lg font-semibold capitalize">{review.visual_analysis?.lighting_quality}</p>
              </div>
            </div>
            {review.visual_analysis?.color_grading_issues?.length > 0 && (
              <ul className="space-y-2">
                {review.visual_analysis.color_grading_issues.map((issue, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Transition Analysis */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clapperboard className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <CardTitle className="text-lg">Transition Analysis</CardTitle>
              </div>
              <StatusIcon status={review.transition_analysis?.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Transitions</p>
              <p className="text-lg font-semibold">{review.transition_analysis?.total_transitions}</p>
            </div>
            {review.transition_analysis?.broken_transitions?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">⚠️ Issues Found:</p>
                {review.transition_analysis.broken_transitions.map((issue, i) => (
                  <div key={i} className="text-sm p-2 rounded bg-red-50 border border-red-200">
                    <p className="font-medium">@ {issue.timestamp}s</p>
                    <p className="text-red-800">{issue.issue}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        {review.recommendations?.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {review.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleAnalyze} disabled={isAnalyzing}>
            Re-analyze
          </Button>
          <Link to={`/video-captions/${draftId}`}>
            <Button className="gap-2">
              Add Captions <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}