import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'ko', label: '한국어' },
  { code: 'ar', label: 'العربية' }
];

export default function ContentCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState('month'); // month or week

  const { data: publications = [] } = useQuery({
    queryKey: ['scheduled-publications'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.ScheduledPublication.filter({ user_id: user.id });
    }
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.ContentWorkflow.filter({ user_id: user.id });
    }
  });

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const publicationsMap = useMemo(() => {
    const map = {};
    publications.forEach(pub => {
      const dateKey = format(new Date(pub.scheduled_publish_date), 'yyyy-MM-dd');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(pub);
    });
    return map;
  }, [publications]);

  const getDayPublications = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return publicationsMap[dateKey] || [];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="w-8 h-8" />
          Content Calendar
        </h1>
        <p className="text-muted-foreground mt-1">Visualize and manage your scheduled publications and workflows</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
              <CardDescription>Drag publications to reschedule</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((date, idx) => {
              const dayPubs = getDayPublications(date);
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isToday = isSameDay(date, new Date());

              return (
                <div
                  key={idx}
                  className={`min-h-24 p-2 rounded-lg border transition-all ${
                    isCurrentMonth
                      ? isToday
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:border-primary'
                      : 'bg-muted/50 border-border opacity-50'
                  }`}
                >
                  <p className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                    {format(date, 'd')}
                  </p>

                  <div className="space-y-1 max-h-16 overflow-y-auto">
                    {dayPubs.map(pub => (
                      <div
                        key={pub.id}
                        draggable
                        className="p-1 rounded text-xs bg-primary/20 text-primary cursor-move hover:bg-primary/30 truncate"
                        title={pub.item_title}
                      >
                        {pub.item_title}
                      </div>
                    ))}
                  </div>

                  {dayPubs.length > 2 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      +{dayPubs.length - 2} more
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-primary/20"></div>
            <span className="text-sm">Scheduled Publication</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded border-2 border-primary"></div>
            <span className="text-sm">Today</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge>Upcoming</Badge>
            <span className="text-sm">Active workflows</span>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Publications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Publications</CardTitle>
        </CardHeader>
        <CardContent>
          {publications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scheduled publications yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {publications
                .sort((a, b) => new Date(a.scheduled_publish_date) - new Date(b.scheduled_publish_date))
                .map(pub => (
                  <div key={pub.id} className="p-3 rounded-lg border border-border flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{pub.item_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(pub.scheduled_publish_date), 'PPp')}
                      </p>
                    </div>
                    <Badge variant={pub.status === 'published' ? 'default' : 'secondary'}>
                      {pub.status}
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}