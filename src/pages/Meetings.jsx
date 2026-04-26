import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Video, Phone, PhoneOff, VideoOff, Mic, MicOff, Monitor,
  Plus, Users, Clock, Calendar, ExternalLink, Copy, X, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ────────────────────────────────────────────────────────────────
// Daily.co room creation via backend function (or direct API)
// DAILY_API_KEY must be set in your environment/backend
// ────────────────────────────────────────────────────────────────
async function createDailyRoom(roomName, isPro) {
  const domain = import.meta.env.VITE_DAILY_DOMAIN || 'philomni';
  const fallbackUrl = `https://${domain}.daily.co/${roomName}`;
  try {
    const result = await Promise.race([
      base44.functions.createDailyRoom({
        name: roomName,
        properties: {
          max_participants: isPro ? 50 : 2,
          enable_recording: isPro,
          enable_screenshare: true,
          enable_chat: true,
          exp: Math.floor(Date.now() / 1000) + 4 * 60 * 60,
        },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Daily.co API timeout after 8s')), 8000)
      ),
    ]);
    return result?.url || fallbackUrl;
  } catch (err) {
    console.error('[Meetings] Daily.co API failed, using fallback URL:', err);
    return fallbackUrl;
  }
}

// ────────────────────────────────────────────────────────────────
// In-app call frame — plain iframe embed
// ────────────────────────────────────────────────────────────────
function CallFrame({ roomUrl, onLeave }) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-3 bg-black/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden">
            <img src="/logo_v2.svg" alt="Philomni" className="w-7 h-7" />
          </div>
          <span className="text-white font-semibold text-sm">Philomni Call</span>
        </div>
        <Button variant="destructive" size="sm" onClick={onLeave} className="gap-1.5">
          <PhoneOff className="w-4 h-4" />
          Leave
        </Button>
      </div>
      <iframe
        src={roomUrl}
        allow="camera; microphone; fullscreen; speaker; display-capture"
        style={{ width: '100%', height: '100%', border: 'none', flex: 1 }}
        title="Philomni Call"
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// New Meeting Dialog
// ────────────────────────────────────────────────────────────────
function NewMeetingDialog({ open, onClose, currentUser }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('video'); // video | voice
  const [loading, setLoading] = useState(false);
  const [roomUrl, setRoomUrl] = useState(null);
  const qc = useQueryClient();

  const handleCreate = async () => {
    setLoading(true);
    try {
      const slug = `philomni-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const url = await createDailyRoom(slug, currentUser?.plan === 'pro');

      // Save to DB
      await base44.entities.Booking.create({
        title: title || `${currentUser?.full_name}'s ${type === 'video' ? 'Video' : 'Voice'} Call`,
        meeting_type: type,
        room_url: url,
        host_id: currentUser?.id,
        status: 'active',
        started_at: new Date().toISOString(),
      });

      setRoomUrl(url);
      qc.invalidateQueries({ queryKey: ['meetings'] });
    } catch (err) {
      console.error('[Meetings] NewMeetingDialog handleCreate failed:', err);
      toast.error('Could not create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (roomUrl) {
    return <CallFrame roomUrl={roomUrl} onLeave={() => { setRoomUrl(null); onClose(); }} />;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Start a Call</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setType('video')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                type === 'video' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
              }`}
            >
              <Video className={`w-6 h-6 ${type === 'video' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium">Video Call</span>
            </button>
            <button
              onClick={() => setType('voice')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                type === 'voice' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
              }`}
            >
              <Phone className={`w-6 h-6 ${type === 'voice' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium">Voice Call</span>
            </button>
          </div>

          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Meeting title (optional)"
          />

          {currentUser?.plan !== 'pro' && (
            <p className="text-xs text-muted-foreground bg-muted rounded-lg p-2.5">
              Free plan: 1-on-1 calls only. <strong>Upgrade to Pro</strong> for group calls up to 50 participants, recording, and more.
            </p>
          )}

          <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? 'Creating room…' : 'Start Call Now'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────────
// Main Meetings Page
// ────────────────────────────────────────────────────────────────
export default function Meetings() {
  const { user } = useOutletContext();
  const [tab, setTab] = useState('upcoming');
  const [newMeetingOpen, setNewMeetingOpen] = useState(false);
  const [activeCallUrl, setActiveCallUrl] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const u = await base44.auth.me();
      return base44.entities.Booking.filter({ host_id: u.id, meeting_type: ['video', 'voice'] });
    },
  });

  const upcoming = meetings.filter(m => m.status === 'scheduled' || m.status === 'active');
  const past = meetings.filter(m => m.status === 'ended' || m.status === 'completed');

  const copyLink = (url, id) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      toast.success('Link copied');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (activeCallUrl) {
    return <CallFrame roomUrl={activeCallUrl} onLeave={() => setActiveCallUrl(null)} />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Meetings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Instant video & voice calls powered by Daily.co
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setNewMeetingOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Call
          </Button>
        </div>
      </div>

      {/* Quick start cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => setNewMeetingOpen(true)}
          className="p-5 rounded-xl bg-primary/10 border border-primary/20 text-left hover:bg-primary/15 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-colors">
            <Video className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Instant Video Call</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Start a room and share the link</p>
        </button>
        <button
          onClick={() => setNewMeetingOpen(true)}
          className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-left hover:bg-emerald-500/15 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3 group-hover:bg-emerald-500/30 transition-colors">
            <Phone className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="font-semibold text-foreground">Voice Call</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Audio-only call, no camera needed</p>
        </button>
      </div>

      {/* Meeting list */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {(tab === 'upcoming' ? upcoming : past).length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Video className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">
                {tab === 'upcoming' ? 'No upcoming meetings' : 'No past meetings'}
              </p>
              {tab === 'upcoming' && (
                <Button variant="outline" className="mt-4" onClick={() => setNewMeetingOpen(true)}>
                  Start your first call
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          (tab === 'upcoming' ? upcoming : past).map(meeting => (
            <Card key={meeting.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  meeting.meeting_type === 'video'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  {meeting.meeting_type === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{meeting.title || 'Untitled Call'}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {meeting.started_at
                        ? format(new Date(meeting.started_at), 'MMM d, h:mm a')
                        : 'Instant call'}
                    </span>
                    <Badge variant={meeting.status === 'active' ? 'default' : 'secondary'} className="text-xs h-5">
                      {meeting.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {meeting.room_url && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(meeting.room_url, meeting.id)}
                        className="gap-1.5 text-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedId === meeting.id ? 'Copied!' : 'Copy link'}
                      </Button>
                      {tab === 'upcoming' && (
                        <Button
                          size="sm"
                          onClick={() => setActiveCallUrl(meeting.room_url)}
                          className="gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Join
                        </Button>
                      )}
                      {tab === 'past' && meeting.recording_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={meeting.recording_url} target="_blank" rel="noreferrer">
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                            Recording
                          </a>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <NewMeetingDialog open={newMeetingOpen} onClose={() => setNewMeetingOpen(false)} currentUser={user} />
    </div>
  );
}
