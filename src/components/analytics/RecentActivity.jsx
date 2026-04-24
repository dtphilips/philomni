import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Briefcase, Star } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }); }
  catch { return ''; }
}

const STATUS_COLORS = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-0',
  reviewed: 'bg-blue-500/10 text-blue-600 border-0',
  accepted: 'bg-green-500/10 text-green-600 border-0',
  rejected: 'bg-red-500/10 text-red-600 border-0',
};

export default function RecentActivity({ posts, applications, reviews }) {
  // Merge + sort by date
  const items = [
    ...posts.slice(0, 10).map(p => ({
      type: 'post',
      label: p.content?.slice(0, 60) + (p.content?.length > 60 ? '…' : ''),
      date: p.created_date,
      meta: `${p.like_count || 0} likes · ${p.comment_count || 0} comments`,
    })),
    ...applications.slice(0, 10).map(a => ({
      type: 'application',
      label: a.job_title,
      date: a.created_date,
      status: a.status,
    })),
    ...reviews.slice(0, 5).map(r => ({
      type: 'review',
      label: r.feedback?.slice(0, 60) || 'No feedback left',
      date: r.created_date,
      rating: r.rating,
    })),
  ]
    .filter(i => i.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 12);

  const iconMap = {
    post: { Icon: FileText, color: 'bg-blue-500/10 text-blue-600' },
    application: { Icon: Briefcase, color: 'bg-amber-500/10 text-amber-600' },
    review: { Icon: Star, color: 'bg-yellow-400/10 text-yellow-600' },
  };

  const typeLabel = { post: 'Post', application: 'Application', review: 'Review' };

  if (items.length === 0) return null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {items.map((item, i) => {
            const { Icon, color } = iconMap[item.type];
            return (
              <li key={i} className="flex items-start gap-3 px-5 py-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {typeLabel[item.type]}
                    </span>
                    {item.status && (
                      <Badge className={`text-[10px] px-1.5 py-0.5 capitalize ${STATUS_COLORS[item.status]}`}>
                        {item.status}
                      </Badge>
                    )}
                    {item.rating && (
                      <span className="text-xs text-amber-500">{'★'.repeat(item.rating)}</span>
                    )}
                  </div>
                  <p className="text-sm mt-0.5 truncate">{item.label}</p>
                  {item.meta && <p className="text-xs text-muted-foreground mt-0.5">{item.meta}</p>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 pt-0.5">
                  {timeAgo(item.date)}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}