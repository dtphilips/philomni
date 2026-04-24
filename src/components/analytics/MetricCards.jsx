import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Users, Briefcase, Star, TrendingUp, Heart } from 'lucide-react';

function MetricCard({ icon: Icon, label, value, sub, color, isLoading }) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
              {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MetricCards({ posts, followers, following, applications, reviews, isLoading }) {
  const totalLikes = posts.reduce((sum, p) => sum + (p.like_count || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comment_count || 0), 0);
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '—';
  const acceptedApps = applications.filter(a => a.status === 'accepted').length;

  const metrics = [
    {
      icon: FileText,
      label: 'Total Posts',
      value: posts.length,
      sub: `${totalLikes} likes · ${totalComments} comments`,
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      icon: Users,
      label: 'Followers',
      value: followers.length,
      sub: `Following ${following.length}`,
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Briefcase,
      label: 'Applications',
      value: applications.length,
      sub: `${acceptedApps} accepted`,
      color: 'bg-amber-500/10 text-amber-600',
    },
    {
      icon: Star,
      label: 'Avg Rating',
      value: avgRating,
      sub: `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`,
      color: 'bg-yellow-400/10 text-yellow-600',
    },
    {
      icon: Heart,
      label: 'Total Likes',
      value: totalLikes,
      sub: `Across ${posts.length} posts`,
      color: 'bg-rose-500/10 text-rose-500',
    },
    {
      icon: TrendingUp,
      label: 'Engagement',
      value: posts.length ? `${((totalLikes + totalComments) / posts.length).toFixed(1)}` : '—',
      sub: 'Avg per post',
      color: 'bg-green-500/10 text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {metrics.map(m => (
        <MetricCard key={m.label} {...m} isLoading={isLoading} />
      ))}
    </div>
  );
}