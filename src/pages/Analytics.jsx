import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MetricCards from '@/components/analytics/MetricCards';
import ActivityChart from '@/components/analytics/ActivityChart';
import RecentActivity from '@/components/analytics/RecentActivity';
import { BarChart2 } from 'lucide-react';

export default function Analytics() {
  const { user } = useOutletContext();

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['analytics-posts', user?.id],
    queryFn: () => base44.entities.Post.filter({ author_id: user.id }, '-created_date', 100),
    enabled: !!user,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['analytics-followers', user?.id],
    queryFn: () => base44.entities.Follow.filter({ following_id: user.id }),
    enabled: !!user,
  });

  const { data: following = [] } = useQuery({
    queryKey: ['analytics-following', user?.id],
    queryFn: () => base44.entities.Follow.filter({ follower_id: user.id }),
    enabled: !!user,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['analytics-applications', user?.id],
    queryFn: () => base44.entities.Application.filter({ applicant_id: user.id }, '-created_date', 100),
    enabled: !!user,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['analytics-reviews', user?.id],
    queryFn: () => base44.entities.UserReview.filter({ reviewee_id: user.id }),
    enabled: !!user,
  });

  const isLoading = loadingPosts;

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-display">Analytics</h1>
          <p className="text-sm text-muted-foreground">Track your performance and growth</p>
        </div>
      </div>

      {/* Metric Cards */}
      <MetricCards
        posts={posts}
        followers={followers}
        following={following}
        applications={applications}
        reviews={reviews}
        isLoading={isLoading}
      />

      {/* Charts */}
      <ActivityChart posts={posts} applications={applications} followers={followers} />

      {/* Recent Activity */}
      <RecentActivity posts={posts} applications={applications} reviews={reviews} />
    </div>
  );
}