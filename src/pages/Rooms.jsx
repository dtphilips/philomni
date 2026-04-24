import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Video, Users, Plus, Mic, MicOff, VideoOff, PhoneOff,
  Monitor, MessageSquare, Lock, Globe, Loader2, Radio,
  Copy, Check, Pencil, Trash2, X
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// ── Embed a Daily.co room in an iframe ──────────────────────────────────────
function DailyRoomEmbed({ url, onLeave }) {
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | live | error

  useEffect(() => {
    if (!url || !containerRef.current) return;

    let frame = null;
    const load = async () => {
      try {
        // Use DailyIframe if available (loaded from CDN), else plain iframe
        if (window.DailyIframe) {
          frame = window.DailyIframe.createFrame(containerRef.current, {
            showLeaveButton: false,
            showFullscreenButton: true,
            iframeStyle: { width: '100%', height: '100%', border: 'none', borderRadius: '12px' },
          });
          frame.on('joined-meeting', () => setStatus('live'));
          frame.on('left-meeting', onLeave);
          frame.on('error', () => setStatus('error'));
          await frame.join({ url });
          frameRef.current = frame;
        } else {
          // Fallback: plain iframe
          setStatus('live');
        }
      } catch {
        setStatus('error');
      }
    };

    load();
    return () => { try { frameRef.current?.destroy(); } catch {} };
  }, [url]);

  if (status === 'error') return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <Video className="w-12 h-12 text-muted-foreground/30" />
      <p className="text-muted-foreground">Could not connect to room.</p>
      <Button variant="outline" onClick={onLeave}>Go Back</Button>
    </div>
  );

  return (
    <div className="relative w-full h-full">
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      {/* Always render iframe as fallback / for DailyIframe to attach to */}
      <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden bg-black">
        {!window.DailyIframe && (
          <iframe
            src={url}
            allow="camera; microphone; fullscreen; speaker; display-capture"
            className="w-full h-full border-0"
            onLoad={() => setStatus('live')}
          />
        )}
      </div>

      {/* Leave button overlay */}
      <button
        onClick={onLeave}
        className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium shadow-lg hover:bg-destructive/90 transition-colors"
      >
        <PhoneOff className="w-3.5 h-3.5" /> Leave
      </button>
    </div>
  );
}

// ── Room card ────────────────────────────────────────────────────────────────
function RoomCard({ room, currentUser, onJoin, onDelete }) {
  const [copied, setCopied] = useState(false);
  const isHost = room.host_id === currentUser?.id;
  const isLive = room.status === 'live';

  const copyLink = () => {
    navigator.clipboard.writeText(room.daily_url || window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-card rounded-2xl border p-5 flex flex-col gap-4 transition-all hover:shadow-md ${isLive ? 'border-primary/40 bg-primary/5' : 'border-border'}`}
    >
      {isLive && (
        <span className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-semibold text-red-500">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          LIVE
        </span>
      )}

      <div className="flex items-start gap-3 pr-16">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isLive ? 'bg-primary/20' : 'bg-muted'}`}>
          <Radio className={`w-5 h-5 ${isLive ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate">{room.name}</h3>
          {room.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{room.description}</p>}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="secondary" className="text-xs gap-1">
              <Users className="w-3 h-3" />{room.participant_count || 0} / {room.max_participants || 50}
            </Badge>
            {room.is_private ? (
              <Badge variant="outline" className="text-xs gap-1"><Lock className="w-3 h-3" />Private</Badge>
            ) : (
              <Badge variant="outline" className="text-xs gap-1"><Globe className="w-3 h-3" />Public</Badge>
            )}
            {isHost && <Badge className="text-xs bg-primary/10 text-primary border-0">Host</Badge>}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => onJoin(room)}
          size="sm"
          className={`flex-1 gap-1.5 ${isLive ? '' : 'variant-outline'}`}
          variant={isLive ? 'default' : 'outline'}
        >
          <Video className="w-3.5 h-3.5" />
          {isLive ? 'Join Live' : 'Start Room'}
        </Button>
        <button onClick={copyLink} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
        </button>
        {isHost && (
          <button onClick={() => onDelete(room.id)} className="p-2 rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive/30 transition-colors">
            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Create Room dialog ───────────────────────────────────────────────────────
function CreateRoomDialog({ open, onClose, onCreated, user }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40);
      const roomName = `${slug}-${Date.now()}`;

      // Create Daily.co room via API
      const dailyRes = await base44.functions.createDailyRoom({
        name: roomName,
        properties: { max_participants: maxParticipants, enable_recording: false },
      });

      // Save room to Supabase
      const room = await base44.entities.Event.create({
        name: name.trim(),
        description: description.trim(),
        host_id: user.id,
        host_name: user.full_name,
        host_avatar: user.avatar_url,
        daily_room_name: roomName,
        daily_url: dailyRes.url,
        status: 'live',
        is_private: isPrivate,
        max_participants: maxParticipants,
        participant_count: 1,
        type: 'room',
      });

      toast.success('Room created!');
      onCreated(room, dailyRes.url);
      setName(''); setDescription(''); setIsPrivate(false); setMaxParticipants(10);
      onClose();
    } catch (err) {
      toast.error('Failed to create room. Check your Daily.co API key.');
      console.error(err);
    }
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Create a Room
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Room Name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Creative Collab, Design Review…" maxLength={60} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Description (optional)</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this room about?" rows={2} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Private Room</p>
              <p className="text-xs text-muted-foreground">Only visible to invited members</p>
            </div>
            <button
              onClick={() => setIsPrivate(v => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPrivate ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Max Participants: {maxParticipants}</label>
            <input type="range" min={2} max={50} value={maxParticipants} onChange={e => setMaxParticipants(Number(e.target.value))}
              className="w-full accent-primary" />
          </div>
          <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">What you get in every room:</p>
            <p>✓ HD Video &amp; Audio &nbsp;·&nbsp; ✓ Screen Share &nbsp;·&nbsp; ✓ Live Chat</p>
            <p>✓ Up to {maxParticipants} participants &nbsp;·&nbsp; ✓ Shareable link</p>
          </div>
          <Button onClick={handleCreate} disabled={creating || !name.trim()} className="w-full gap-2">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            {creating ? 'Creating Room…' : 'Create & Start Room'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Rooms page ──────────────────────────────────────────────────────────
export default function Rooms() {
  const { user } = useOutletContext();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null); // { room, url }
  const [search, setSearch] = useState('');

  // Load Daily.co SDK once
  useEffect(() => {
    if (window.DailyIframe) return;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@daily-co/daily-js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Event.filter({ type: 'room' }),
    refetchInterval: 15000,
  });

  const handleJoin = (room) => {
    if (!room.daily_url) {
      toast.error('No room URL found. The room may have expired.');
      return;
    }
    setActiveRoom({ room, url: room.daily_url });
  };

  const handleCreated = (room, url) => {
    qc.invalidateQueries({ queryKey: ['rooms'] });
    setActiveRoom({ room, url });
  };

  const handleLeave = async () => {
    if (activeRoom?.room?.host_id === user?.id) {
      try { await base44.entities.Event.update(activeRoom.room.id, { status: 'ended', participant_count: 0 }); } catch {}
      qc.invalidateQueries({ queryKey: ['rooms'] });
    }
    setActiveRoom(null);
  };

  const handleDelete = async (roomId) => {
    try {
      await base44.entities.Event.delete(roomId);
      qc.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room deleted.');
    } catch { toast.error('Failed to delete room.'); }
  };

  const filtered = rooms.filter(r =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase())
  );

  const liveRooms = filtered.filter(r => r.status === 'live');
  const otherRooms = filtered.filter(r => r.status !== 'live');

  // ── Full-screen room view ──────────────────────────────────────────────────
  if (activeRoom) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE
            </span>
            <h2 className="font-semibold text-sm truncate max-w-[200px]">{activeRoom.room.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" onClick={handleLeave} className="gap-1.5">
              <PhoneOff className="w-3.5 h-3.5" /> Leave Room
            </Button>
          </div>
        </div>

        {/* Room embed */}
        <div className="flex-1 p-4 overflow-hidden">
          <DailyRoomEmbed url={activeRoom.url} onLeave={handleLeave} />
        </div>

        {/* Feature chips */}
        <div className="px-4 pb-3 flex gap-2 flex-wrap flex-shrink-0">
          {[
            { icon: Video, label: 'HD Video' },
            { icon: Mic, label: 'Audio' },
            { icon: Monitor, label: 'Screen Share' },
            { icon: MessageSquare, label: 'Live Chat' },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
              <Icon className="w-3 h-3" /> {label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ── Room list ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Rooms</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live collaborative spaces with video, audio, screen share &amp; chat
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Create Room
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms…" className="pl-9" />
      </div>

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Radio className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg">Philomni Rooms</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              HD video calls · Screen sharing · Live chat · Up to 50 participants · No download needed
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2 flex-shrink-0">
            <Plus className="w-4 h-4" /> Start a Room
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Live rooms */}
          {liveRooms.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h2 className="font-semibold text-sm">Live Now</h2>
                <Badge variant="secondary" className="text-xs">{liveRooms.length}</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {liveRooms.map(room => (
                  <RoomCard key={room.id} room={room} currentUser={user} onJoin={handleJoin} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {/* Other / scheduled rooms */}
          {otherRooms.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm mb-3 text-muted-foreground">All Rooms</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {otherRooms.map(room => (
                  <RoomCard key={room.id} room={room} currentUser={user} onJoin={handleJoin} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                <Radio className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <div>
                <p className="font-medium">No rooms yet</p>
                <p className="text-sm text-muted-foreground mt-1">Create the first room and invite your collaborators</p>
              </div>
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Create First Room
              </Button>
            </div>
          )}
        </div>
      )}

      <CreateRoomDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} user={user} />
    </div>
  );
}
