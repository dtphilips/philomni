import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Calendar, Users, DollarSign, Settings, Plus, Check, X,
  Clock, Video, Phone, MessageSquare, Globe, Loader2,
  ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay,
  addMonths, subMonths, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SESSION_TYPES = [
  { id: 'consultation', label: 'Consultation', icon: MessageSquare, defaultDuration: 30 },
  { id: 'coaching', label: 'Coaching Session', icon: Users, defaultDuration: 60 },
  { id: 'video_call', label: 'Video Call', icon: Video, defaultDuration: 45 },
  { id: 'phone_call', label: 'Phone Call', icon: Phone, defaultDuration: 30 },
  { id: 'workshop', label: 'Workshop', icon: Globe, defaultDuration: 120 },
];

const STATUS_COLORS = {
  confirmed: 'bg-green-500/10 text-green-600 border-green-200',
  pending: 'bg-amber-500/10 text-amber-600 border-amber-200',
  completed: 'bg-blue-500/10 text-blue-600 border-blue-200',
  cancelled: 'bg-red-500/10 text-red-600 border-red-200',
};

// Availability day row
function AvailabilityDayRow({ day, dayIndex, availability, onChange }) {
  const dayData = availability[dayIndex] || { enabled: false, start: '09:00', end: '17:00' };

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-24 flex-shrink-0">
        <Switch
          checked={dayData.enabled}
          onCheckedChange={v => onChange(dayIndex, { ...dayData, enabled: v })}
          id={`day-${dayIndex}`}
        />
        <Label htmlFor={`day-${dayIndex}`} className="ml-2 text-sm cursor-pointer">{day.slice(0, 3)}</Label>
      </div>
      {dayData.enabled ? (
        <div className="flex items-center gap-2">
          <Input
            type="time"
            value={dayData.start}
            onChange={e => onChange(dayIndex, { ...dayData, start: e.target.value })}
            className="h-8 w-28 text-sm"
          />
          <span className="text-muted-foreground text-sm">–</span>
          <Input
            type="time"
            value={dayData.end}
            onChange={e => onChange(dayIndex, { ...dayData, end: e.target.value })}
            className="h-8 w-28 text-sm"
          />
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">Unavailable</span>
      )}
    </div>
  );
}

// Mini month calendar
function MiniCalendar({ bookings, selectedDate, onSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const bookingDates = bookings.map(b => b.scheduled_at ? new Date(b.scheduled_at).toDateString() : null).filter(Boolean);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded hover:bg-muted">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold">{format(currentMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded hover:bg-muted">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 text-center">
        {days.map(day => {
          const hasBooking = bookingDates.includes(day.toDateString());
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelect(day)}
              className={`
                py-1.5 text-xs rounded-full mx-0.5 relative transition-colors
                ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                ${isToday(day) && !isSelected ? 'font-bold text-primary' : ''}
                ${!isCurrentMonth ? 'text-muted-foreground/30' : ''}
                ${!isSelected && isCurrentMonth ? 'hover:bg-muted' : ''}
              `}
            >
              {format(day, 'd')}
              {hasBooking && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BookingCalendar() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    is_active: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    bio: '',
    buffer_minutes: 15,
    advance_booking_days: 30,
    session_types: [{ type: 'consultation', duration: 30, price: 50, currency: 'USD', enabled: true }],
    availability: Object.fromEntries(
      [0, 1, 2, 3, 4, 5, 6].map(i => [i, { enabled: i >= 1 && i <= 5, start: '09:00', end: '17:00' }])
    ),
  });

  const { data: bookingProfile } = useQuery({
    queryKey: ['booking-profile'],
    queryFn: async () => {
      const u = user /* useAuth() */;
      const profiles = (await supabase.from('booking_profiles').select('*').eq('user_id', u.id)).data ?? [];
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const { data: allBookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const u = user /* useAuth() */;
      const [hosting, attending] = await Promise.all([
        supabase.from('bookings').select('*') /* TODO filter: { professional_id: u.id }, '-scheduled_at', 50 */,
        supabase.from('bookings').select('*') /* TODO filter: { client_id: u.id }, '-scheduled_at', 50 */,
      ]);
      return [...hosting, ...attending].sort((a, b) =>
        new Date(b.scheduled_at || 0) - new Date(a.scheduled_at || 0)
      );
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (bookingProfile) {
      setProfileForm(prev => ({
        ...prev,
        is_active: bookingProfile.is_active || false,
        timezone: bookingProfile.timezone || prev.timezone,
        bio: bookingProfile.bio || '',
        buffer_minutes: bookingProfile.buffer_minutes || 15,
        advance_booking_days: bookingProfile.advance_booking_days || 30,
        session_types: bookingProfile.session_types || prev.session_types,
        availability: bookingProfile.availability || prev.availability,
      }));
    }
  }, [bookingProfile]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      if (bookingProfile) {
        (await supabase.from('booking_profiles').update(profileForm).eq('id', bookingProfile.id).select().single()).data;
      } else {
        (await supabase.from('booking_profiles').insert({ ...profileForm, user_id: user.id }).select().single()).data;
      }
      qc.invalidateQueries({ queryKey: ['booking-profile'] });
      toast.success('Booking profile saved!');
      setShowSettings(false);
    } catch (_) {
      toast.error('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleBookingAction = async (bookingId, status) => {
    (await supabase.from('bookings').update({ status }).eq('id', bookingId).select().single()).data;
    qc.invalidateQueries({ queryKey: ['bookings'] });
    toast.success(status === 'confirmed' ? 'Booking confirmed!' : 'Booking declined');
  };

  const upcoming = allBookings.filter(b =>
    b.scheduled_at && new Date(b.scheduled_at) >= new Date() && b.status !== 'cancelled'
  );
  const past = allBookings.filter(b =>
    b.scheduled_at && new Date(b.scheduled_at) < new Date()
  );
  const pendingCount = allBookings.filter(b => b.status === 'pending').length;
  const totalEarnings = allBookings
    .filter(b => b.status === 'completed' && b.professional_id === user?.id)
    .reduce((s, b) => s + (b.price || 0), 0);

  const dayBookings = allBookings.filter(b =>
    b.scheduled_at && isSameDay(new Date(b.scheduled_at), selectedDate)
  );

  const updateAvailability = (dayIndex, data) => {
    setProfileForm(prev => ({
      ...prev,
      availability: { ...prev.availability, [dayIndex]: data },
    }));
  };

  const addSessionType = () => {
    setProfileForm(prev => ({
      ...prev,
      session_types: [...prev.session_types, { type: 'consultation', duration: 30, price: 0, currency: 'USD', enabled: true }],
    }));
  };

  const updateSessionType = (index, field, value) => {
    setProfileForm(prev => ({
      ...prev,
      session_types: prev.session_types.map((st, i) => i === index ? { ...st, [field]: value } : st),
    }));
  };

  const removeSessionType = (index) => {
    setProfileForm(prev => ({
      ...prev,
      session_types: prev.session_types.filter((_, i) => i !== index),
    }));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6" /> Bookings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your sessions and availability</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="gap-1.5 flex-shrink-0">
          <Settings className="w-4 h-4" /> Settings
        </Button>
      </div>

      {!bookingProfile?.is_active && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-200 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-amber-800">Booking profile not activated</p>
            <p className="text-xs text-amber-700 mt-0.5">Enable your profile to start accepting client bookings.</p>
            <Button size="sm" className="mt-2" onClick={() => setShowSettings(true)}>
              Set Up Bookings
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Upcoming</span>
          </div>
          <p className="text-2xl font-bold">{upcoming.length}</p>
          {pendingCount > 0 && (
            <p className="text-xs text-amber-600 mt-0.5">{pendingCount} awaiting confirmation</p>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground font-medium">Total Earned</span>
          </div>
          <p className="text-2xl font-bold">${totalEarnings.toFixed(0)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground font-medium">Completed</span>
          </div>
          <p className="text-2xl font-bold">{past.filter(b => b.status === 'completed').length}</p>
        </div>
      </div>

      {/* Calendar + Day view */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mb-6">
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">
              Upcoming {upcoming.length > 0 && <Badge variant="secondary" className="ml-1.5 h-4 text-xs">{upcoming.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">No upcoming sessions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(booking => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    userId={user?.id}
                    onAction={handleBookingAction}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {past.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">No past sessions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {past.slice(0, 20).map(booking => (
                  <BookingRow key={booking.id} booking={booking} userId={user?.id} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div>
          <MiniCalendar bookings={allBookings} selectedDate={selectedDate} onSelect={setSelectedDate} />
          {dayBookings.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {format(selectedDate, 'EEE, MMM d')}
              </p>
              {dayBookings.map(b => (
                <div key={b.id} className="p-2.5 rounded-lg border border-border bg-card text-xs">
                  <p className="font-medium truncate">{b.client_name || b.title || 'Session'}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {b.scheduled_at ? format(new Date(b.scheduled_at), 'h:mm a') : '—'} · {b.duration_minutes}m
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Profile Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-2">
            {/* Active toggle */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
              <div>
                <p className="font-medium text-sm">Accept Bookings</p>
                <p className="text-xs text-muted-foreground">Enable your public booking page</p>
              </div>
              <Switch
                checked={profileForm.is_active}
                onCheckedChange={v => setProfileForm(p => ({ ...p, is_active: v }))}
              />
            </div>

            {/* Bio */}
            <div>
              <Label>Booking Page Bio</Label>
              <Textarea
                value={profileForm.bio}
                onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                rows={2}
                placeholder="Tell clients what you specialise in..."
                className="mt-1"
              />
            </div>

            {/* Settings row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Timezone</Label>
                <Input
                  value={profileForm.timezone}
                  onChange={e => setProfileForm(p => ({ ...p, timezone: e.target.value }))}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label>Buffer (min)</Label>
                <Input
                  type="number"
                  value={profileForm.buffer_minutes}
                  onChange={e => setProfileForm(p => ({ ...p, buffer_minutes: +e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Advance Booking</Label>
                <Select
                  value={String(profileForm.advance_booking_days)}
                  onValueChange={v => setProfileForm(p => ({ ...p, advance_booking_days: +v }))}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[7, 14, 30, 60, 90].map(d => <SelectItem key={d} value={String(d)}>{d} days</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Weekly availability */}
            <div>
              <Label className="text-sm font-semibold">Weekly Availability</Label>
              <div className="mt-2 divide-y divide-border border border-border rounded-xl overflow-hidden">
                {DAYS.map((day, i) => (
                  <div key={day} className="px-4">
                    <AvailabilityDayRow
                      day={day}
                      dayIndex={i}
                      availability={profileForm.availability}
                      onChange={updateAvailability}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Session types */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Session Types</Label>
                <Button variant="outline" size="sm" onClick={addSessionType} className="gap-1.5 h-7">
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {profileForm.session_types.map((st, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-center">
                    <Select
                      value={st.type}
                      onValueChange={v => updateSessionType(idx, 'type', v)}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SESSION_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={st.duration}
                      onChange={e => updateSessionType(idx, 'duration', +e.target.value)}
                      placeholder="min"
                      className="h-8 text-xs"
                    />
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                      <Input
                        type="number"
                        value={st.price}
                        onChange={e => updateSessionType(idx, 'price', +e.target.value)}
                        className="h-8 pl-5 text-xs"
                      />
                    </div>
                    <button
                      onClick={() => removeSessionType(idx)}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Settings'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookingRow({ booking, userId, onAction }) {
  const isHost = booking.professional_id === userId;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{booking.client_name || booking.title || 'Session'}</p>
            <Badge
              variant="outline"
              className={`text-xs ${STATUS_COLORS[booking.status] || 'border-border text-muted-foreground'}`}
            >
              {booking.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
            {booking.scheduled_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(booking.scheduled_at), 'EEE, MMM d · h:mm a')}
              </span>
            )}
            {booking.duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {booking.duration_minutes}m
              </span>
            )}
            {booking.session_type && <span>{booking.session_type}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          {booking.price > 0 && (
            <p className="font-semibold text-sm">${booking.price}</p>
          )}
          {isHost && booking.status === 'pending' && onAction && (
            <div className="flex gap-1.5 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 gap-1 text-xs border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => onAction(booking.id, 'cancelled')}
              >
                <X className="w-3 h-3" /> Decline
              </Button>
              <Button
                size="sm"
                className="h-7 px-2 gap-1 text-xs"
                onClick={() => onAction(booking.id, 'confirmed')}
              >
                <Check className="w-3 h-3" /> Confirm
              </Button>
            </div>
          )}
          {booking.room_url && booking.status === 'confirmed' && (
            <a
              href={booking.room_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-1.5"
            >
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <Video className="w-3 h-3" /> Join
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
