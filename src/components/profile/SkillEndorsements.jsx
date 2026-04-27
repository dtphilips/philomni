import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Award, Plus, Loader2, ThumbsUp, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export default function SkillEndorsements({ userId, isOwnProfile, userFullName }) {
  const [endorsements, setEndorsements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [skill, setSkill] = useState('');
  const [category, setCategory] = useState('other');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadEndorsements();
    loadCurrentUser();
  }, [userId]);

  const loadCurrentUser = async () => {
    try {
      const user = user /* useAuth() */;
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadEndorsements = async () => {
    try {
      setLoading(true);
      const items = (await supabase.from('skillEndorsements').select('*').eq('endorsed_user_id', userId)).data ?? [];

      setEndorsements(items);
    } catch (error) {
      console.error('Failed to load endorsements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndorse = async () => {
    if (!skill.trim()) {
      toast.error('Please enter a skill');
      return;
    }

    setSubmitting(true);
    try {
      (await supabase.from('skillEndorsements').insert({
        endorsed_user_id: userId,
        endorsed_user_name: userFullName,
        endorser_id: currentUser.id,
        endorser_name: currentUser.full_name,
        endorser_avatar: currentUser.avatar_url || '',
        skill: skill.trim().select().single()).data,
        skill_category: category,
        endorsement_message: message.trim(),
        is_verified: false
      });

      toast.success(`Endorsed ${userFullName} for ${skill}`);
      setSkill('');
      setMessage('');
      setCategory('other');
      setShowDialog(false);
      await loadEndorsements();
    } catch (error) {
      console.error('Failed to endorse:', error);
      toast.error('Failed to send endorsement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEndorsement = async (endorsementId) => {
    if (!confirm('Remove this endorsement?')) return;

    try {
      await supabase.from('skillEndorsements').delete().eq('id', endorsementId);
      await loadEndorsements();
      toast.success('Endorsement removed');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to remove endorsement');
    }
  };

  // Group endorsements by skill
  const skillGroups = endorsements.reduce((acc, end) => {
    if (!acc[end.skill]) {
      acc[end.skill] = [];
    }
    acc[end.skill].push(end);
    return acc;
  }, {});

  // Get top skills (most endorsed)
  const topSkills = Object.entries(skillGroups)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5);

  const categoryColors = {
    design: 'bg-purple-500/10 text-purple-700 border-purple-200',
    development: 'bg-blue-500/10 text-blue-700 border-blue-200',
    marketing: 'bg-green-500/10 text-green-700 border-green-200',
    audio: 'bg-orange-500/10 text-orange-700 border-orange-200',
    video: 'bg-red-500/10 text-red-700 border-red-200',
    writing: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
    business: 'bg-teal-500/10 text-teal-700 border-teal-200',
    other: 'bg-gray-500/10 text-gray-700 border-gray-200'
  };

  return (
    <div className="space-y-6">
      {/* Top Skills Badges */}
      {topSkills.length > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Top Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {topSkills.map(([skillName, endorsersList]) => (
              <Badge
                key={skillName}
                className={`gap-1.5 ${categoryColors[endorsersList[0].skill_category] || categoryColors.other}`}
              >
                <span className="font-medium">{skillName}</span>
                <span className="text-xs font-semibold">×{endorsersList.length}</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Endorsement Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">
              Skill Endorsements ({Object.keys(skillGroups).length})
            </h3>
          </div>
          {!isOwnProfile && currentUser?.id !== userId && (
            <Button
              size="sm"
              onClick={() => setShowDialog(true)}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Endorse
            </Button>
          )}
        </div>

        {/* Endorsements List */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : Object.keys(skillGroups).length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No skill endorsements yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(skillGroups).map(([skillName, endorsersList]) => (
              <div key={skillName} className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{skillName}</h4>
                  <Badge
                    variant="secondary"
                    className={categoryColors[endorsersList[0].skill_category] || categoryColors.other}
                  >
                    {endorsersList[0].skill_category}
                  </Badge>
                </div>

                {/* Endorsers */}
                <div className="space-y-2">
                  {endorsersList.map((endorsement) => (
                    <div
                      key={endorsement.id}
                      className="flex items-start justify-between gap-2 bg-muted/30 rounded p-2"
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={endorsement.endorser_avatar} />
                          <AvatarFallback className="text-xs">
                            {endorsement.endorser_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-medium">{endorsement.endorser_name}</p>
                          {endorsement.endorsement_message && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              "{endorsement.endorsement_message}"
                            </p>
                          )}
                        </div>
                      </div>
                      {isOwnProfile && (
                        <button
                          onClick={() => handleDeleteEndorsement(endorsement.id)}
                          className="p-1 hover:bg-destructive/10 rounded shrink-0"
                          title="Remove endorsement"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Endorse Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Endorse a Skill</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
                Skill Name
              </label>
              <Input
                placeholder="e.g., React, Audio Mixing, UI Design"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm"
              >
                <option value="design">Design</option>
                <option value="development">Development</option>
                <option value="marketing">Marketing</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
                <option value="writing">Writing</option>
                <option value="business">Business</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
                Message (Optional)
              </label>
              <Textarea
                placeholder="Why are you endorsing this skill?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEndorse}
              disabled={submitting}
              className="gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Endorsing...
                </>
              ) : (
                <>
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Endorse
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}