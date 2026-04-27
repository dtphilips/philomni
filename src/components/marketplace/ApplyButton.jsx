import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';

export default function ApplyButton({ job, user }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ cover_message: '', resume_url: '' });
  const [submitting, setSubmitting] = useState(false);

  const { data: existing = [] } = useQuery({
    queryKey: ['application-check', job.id, user?.id],
    queryFn: async () => { const { data } = await supabase.from('applications').select('*').eq('job_id', job.id).eq('applicant_id', user.id); return data ?? []; },
    enabled: !!user && !!job.id,
  });

  const alreadyApplied = existing.length > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    (await supabase.from('applications').insert({
      job_id: job.id,
      job_title: job.title,
      poster_id: job.poster_id,
      poster_name: job.poster_name,
      applicant_id: user.id,
      applicant_name: user.full_name,
      applicant_avatar: user.avatar_url || '',
      applicant_headline: user.headline || '',
      cover_message: form.cover_message || undefined,
      resume_url: form.resume_url || undefined,
      status: 'pending',
    }).select().single()).data;
    setSubmitting(false);
    setOpen(false);
    queryClient.invalidateQueries({ queryKey: ['application-check', job.id, user?.id] });
    queryClient.invalidateQueries({ queryKey: ['my-applications', user?.id] });
  };

  // Don't show button on own jobs
  if (job.poster_id === user?.id) return null;

  if (alreadyApplied) {
    return (
      <span className="flex items-center gap-1 text-xs text-primary font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" /> Applied
      </span>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs px-3">
          <Send className="w-3 h-3 mr-1" /> Apply
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Apply for: {job.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">Posted by {job.poster_name}</p>
          <div>
            <Label>Cover Message <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              value={form.cover_message}
              onChange={e => setForm(p => ({ ...p, cover_message: e.target.value }))}
              rows={5}
              placeholder="Introduce yourself and explain why you're a great fit..."
              className="mt-1"
            />
          </div>
          <div>
            <Label>Resume / Portfolio URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              value={form.resume_url}
              onChange={e => setForm(p => ({ ...p, resume_url: e.target.value }))}
              placeholder="https://your-resume.com or LinkedIn"
              className="mt-1"
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Application'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}