import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { subDays, format, parseISO, startOfDay } from 'date-fns';

function buildDailyData(items, dateField = 'created_date', days = 30) {
  const today = startOfDay(new Date());
  const buckets = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = format(subDays(today, i), 'MMM d');
    buckets[d] = 0;
  }
  items.forEach(item => {
    if (!item[dateField]) return;
    const d = format(startOfDay(parseISO(item[dateField])), 'MMM d');
    if (d in buckets) buckets[d]++;
  });
  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

export default function ActivityChart({ posts, applications, followers }) {
  const chartData = useMemo(() => {
    const postData = buildDailyData(posts);
    const appData = buildDailyData(applications);
    const followerData = buildDailyData(followers);
    return postData.map((d, i) => ({
      date: d.date,
      Posts: d.count,
      Applications: appData[i]?.count || 0,
      Followers: followerData[i]?.count || 0,
    }));
  }, [posts, applications, followers]);

  // Only show every 5th label to avoid crowding
  const tickFormatter = (val, i) => i % 5 === 0 ? val : '';

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Activity Over the Last 30 Days</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="gPosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(174,46%,33%)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(174,46%,33%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gApps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gFollowers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={tickFormatter} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="Posts" stroke="hsl(174,46%,33%)" fill="url(#gPosts)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="Applications" stroke="#f59e0b" fill="url(#gApps)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="Followers" stroke="#6366f1" fill="url(#gFollowers)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}