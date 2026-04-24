import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Lightbulb, Plus, Lock, Eye, Shield, Loader2 } from 'lucide-react';

export default function PitchVault() {
  const { user } = useOutletContext();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', teaser: '', full_description: '', category: '' });
  const [posting, setPosting] = useState(false);
  const [ndaPitch, setNdaPitch] = useState(null);
  const [showNda, setShowNda] = useState(false);
  const [viewingPitch, setViewingPitch] = useState(null);

  const { data: pitches = [], isLoading } = useQuery({
    queryKey: ['pitches'],
    queryFn: () => base44.entities.Pitch.filter({ status: 'active' }, '-created_date', 50),
  });

  const handleCreate = async () => {
    setPosting(true);
    await base44.entities.Pitch.create({
      ...form,
      creator_id: user.id,
      creator_name: user.full_name,
      status: 'active',
    });
    setPosting(false);
    setShowCreate(false);
    setForm({ title: '', teaser: '', full_description: '', category: '' });
    queryClient.invalidateQueries({ queryKey: ['pitches'] });
  };

  const handleRequestAccess = (pitch) => {
    setNdaPitch(pitch);
    setShowNda(true);
  };

  const handleAcceptNda = async () => {
    await base44.entities.Pitch.update(ndaPitch.id, { view_count: (ndaPitch.view_count || 0) + 1 });
    // Create notification for pitch owner
    await base44.entities.Notification.create({
      user_id: ndaPitch.creator_id,
      type: 'pitch_view',
      title: 'Someone viewed your pitch',
      body: `${user.full_name} accepted the NDA and viewed "${ndaPitch.title}"`,
      from_user_id: user.id,
      from_user_name: user.full_name,
      from_user_avatar: user.avatar_url || '',
    });
    setShowNda(false);
    setViewingPitch(ndaPitch);
    setNdaPitch(null);
  };

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Pitch Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">NDA-protected ideas and pitch decks</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Submit Pitch</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit a Pitch</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Title</Label><Input value={form.title} onChange={e => update('title', e.target.value)} /></div>
              <div><Label>Public Teaser (one line)</Label><Input value={form.teaser} onChange={e => update('teaser', e.target.value)} placeholder="Brief public description" /></div>
              <div><Label>Full Description (NDA protected)</Label><Textarea value={form.full_description} onChange={e => update('full_description', e.target.value)} rows={5} /></div>
              <Button onClick={handleCreate} disabled={posting || !form.title || !form.teaser} className="w-full">
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Pitch'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* NDA Dialog */}
      <AlertDialog open={showNda} onOpenChange={setShowNda}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Non-Disclosure Agreement
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-3">
              <p>By proceeding, you agree to the following terms:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>All information disclosed is strictly confidential</li>
                <li>You will not reproduce, distribute, or share any part of this pitch</li>
                <li>Your access is logged with timestamp and IP address</li>
                <li>A dynamic watermark with your name will appear on all pages</li>
                <li>The pitch creator will be notified of your access</li>
                <li>Violation may result in legal action</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Decline</AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptNda}>Accept NDA & View</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Viewing pitch */}
      {viewingPitch && (
        <Dialog open={!!viewingPitch} onOpenChange={() => setViewingPitch(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{viewingPitch.title}</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 text-4xl font-bold text-primary rotate-[-30deg]">
                {user.full_name} — {new Date().toLocaleDateString()}
              </div>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">By {viewingPitch.creator_name}</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{viewingPitch.full_description}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : pitches.length === 0 ? (
        <div className="text-center py-16">
          <Lightbulb className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No pitches yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pitches.map(pitch => (
            <div key={pitch.id} className="p-5 rounded-xl border border-border bg-card">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">{pitch.title}</h3>
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">{pitch.teaser}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{pitch.creator_name}</span>
                <div className="flex items-center gap-2">
                  {pitch.view_count > 0 && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3" />{pitch.view_count}
                    </span>
                  )}
                  {pitch.creator_id !== user?.id && (
                    <Button size="sm" variant="outline" onClick={() => handleRequestAccess(pitch)}>
                      Request Access
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}