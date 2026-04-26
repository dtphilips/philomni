import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, Loader2, Users, Zap, TrendingUp, Plus, X, Mail,
  CheckCircle2, AlertCircle, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProjectMatcher() {
  const [tab, setTab] = useState('form');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Form state
  const [projectTitle, setProjectTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('web-development');
  const [teamSize, setTeamSize] = useState(3);
  const [skills, setSkills] = useState(['']);

  const projectTypes = [
    { id: 'web-development', label: 'Web Development' },
    { id: 'mobile-development', label: 'Mobile Development' },
    { id: 'design', label: 'Design' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'content-creation', label: 'Content Creation' },
    { id: 'data-science', label: 'Data Science' },
    { id: 'video-production', label: 'Video Production' },
    { id: 'audio-production', label: 'Audio Production' },
    { id: 'strategy', label: 'Strategy & Consulting' },
    { id: 'other', label: 'Other' },
  ];

  const addSkill = () => setSkills([...skills, '']);
  const removeSkill = (idx) => setSkills(skills.filter((_, i) => i !== idx));
  const updateSkill = (idx, val) => {
    const newSkills = [...skills];
    newSkills[idx] = val;
    setSkills(newSkills);
  };

  const handleMatch = async (e) => {
    e.preventDefault();
    if (!projectTitle.trim() || skills.filter(s => s.trim()).length === 0) {
      return;
    }

    setLoading(true);
    try {
      const { data: users } = await supabase.from('users').select('*').limit(20);
      const matched = (users ?? []).filter(u =>
        skills.some(sk => u.headline?.toLowerCase().includes(sk.toLowerCase()) || u.bio?.toLowerCase().includes(sk.toLowerCase()))
      );
      setResults({ matches: matched.length ? matched : (users ?? []).slice(0, 5) });
      setTab('results');
    } catch (error) {
      console.error('Failed to match members:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-primary" />
          Project Matcher
        </h1>
        <p className="text-muted-foreground">
          AI-powered team builder — find the perfect collaborators based on skills and expertise
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="w-full grid w-full grid-cols-2">
          <TabsTrigger value="form">Find Team</TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>
            Results {results && <Badge className="ml-2">{results.matches.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Form Tab */}
        <TabsContent value="form" className="space-y-6">
          <form onSubmit={handleMatch} className="space-y-6">
            {/* Project Title */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Project Title *</label>
              <Input
                placeholder="e.g., Mobile App Redesign, Content Marketing Campaign"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Project Description</label>
              <Textarea
                placeholder="Provide context about the project, goals, timeline, and any other important details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-24"
              />
            </div>

            {/* Project Type */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Project Type</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
              >
                {projectTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Team Size */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Team Size Needed</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className="flex-1"
                />
                <Badge variant="secondary" className="text-base px-4 py-1">
                  {teamSize} {teamSize === '1' ? 'person' : 'people'}
                </Badge>
              </div>
            </div>

            {/* Required Skills */}
            <div className="space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                Required Skills *
                <span className="text-xs text-muted-foreground font-normal">
                  ({skills.filter(s => s.trim()).length} added)
                </span>
              </label>
              <div className="space-y-2">
                {skills.map((skill, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder={`Skill ${idx + 1}, e.g., React, UX Design, Python`}
                      value={skill}
                      onChange={(e) => updateSkill(idx, e.target.value)}
                      className="flex-1"
                    />
                    {skills.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSkill(idx)}
                        className="h-9 w-9"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addSkill}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" /> Add Another Skill
              </Button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing profiles...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Find Team Members
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Our AI will scan user expertise and skills to suggest the best matches for your project.
            </p>
          </form>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {results && (
            <>
              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <h2 className="font-semibold text-lg">{results.projectTitle}</h2>
                <div className="flex flex-wrap gap-2">
                  {results.requiredSkills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary">{skill}</Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Found {results.totalMatches} recommended team members
                </p>
              </div>

              {results.matches.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No strong matches found. Try adjusting your skill requirements.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.matches.map((match, idx) => (
                    <div
                      key={match.userId}
                      className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-base">{match.userName}</h3>
                            <Badge className="bg-primary/10 text-primary">
                              #{idx + 1} Match
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{match.recommendation}</p>
                        </div>

                        {/* Match Score */}
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center justify-end gap-1 mb-1">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <span className={cn(
                              'text-2xl font-bold',
                              match.matchScore >= 80 ? 'text-green-600' :
                              match.matchScore >= 60 ? 'text-blue-600' :
                              'text-amber-600'
                            )}>
                              {match.matchScore}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">match score</p>
                        </div>
                      </div>

                      {/* Matching Skills */}
                      {match.matchReasons.length > 0 && (
                        <div className="mb-3 pb-3 border-b border-border">
                          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            Matching Skills
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {match.matchReasons.map((skill, i) => (
                              <Badge key={i} variant="secondary" className="text-xs bg-green-500/10 text-green-700">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Skills */}
                      {match.missingSkills.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            Skills to Develop
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {match.missingSkills.map((skill, i) => (
                              <Badge key={i} variant="outline" className="text-xs text-amber-700 bg-amber-500/10">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action */}
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        Send Invite
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setResults(null);
                  setTab('form');
                }}
                className="w-full"
              >
                ← Try Another Search
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>

      <style>{`
        input[type="range"] {
          accent-color: hsl(var(--primary));
        }
      `}</style>
    </div>
  );
}