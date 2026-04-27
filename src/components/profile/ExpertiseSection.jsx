import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil, Zap } from 'lucide-react';
import SkillsInput from '@/components/ui/SkillsInput';
import { useQueryClient } from '@tanstack/react-query';

export default function ExpertiseSection({ user, isOwnProfile }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [skills, setSkills] = useState(user?.skills || []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('users').update({ skills }).eq('id', user.id);
    queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    setSaving(false);
    setOpen(false);
  };

  const displaySkills = user?.skills || [];
  if (!isOwnProfile && displaySkills.length === 0) return null;

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Expertise</h3>
        {isOwnProfile && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setSkills(user?.skills || []); }}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto">
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Edit Skills & Expertise</DialogTitle></DialogHeader>
              <div className="mt-2 space-y-4">
                <SkillsInput skills={skills} onChange={setSkills} placeholder="e.g. React, Video Editing..." />
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? 'Saving...' : 'Save Skills'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {displaySkills.length === 0 ? (
        isOwnProfile && (
          <p className="text-sm text-muted-foreground">
            Add your skills to help others discover you.{' '}
            <button onClick={() => setOpen(true)} className="text-primary underline underline-offset-2">Add skills</button>
          </p>
        )
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {displaySkills.map(skill => (
            <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}