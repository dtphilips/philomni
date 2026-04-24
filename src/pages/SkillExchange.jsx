import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, ArrowLeftRight, User, Clock, Star, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStartConversation } from '@/hooks/useStartConversation';
import { CATEGORY_NAMES } from '@/lib/categories';
import SkillsInput from '@/components/ui/SkillsInput';

export default function SkillExchange() {
  const { user } = useOutletContext();
  const qc = useQueryClient();
  const startConversation = useStartConversation(user);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    offering_skills: [],
    seeking_skills: [],
    category: '',
    duration_hours: '',
    availability: '',
  });
  const [posting, setPosting] = useState(false);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['skill-exchange'],
    queryFn: () => base44.entities.SkillExchange
      ? base44.entities.SkillExchange.filter({ status: 'open' }, '-created_date', 50)
      : Promise.resolve([]),
  });

  const filtered = listings.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || l.title?.toLowerCase().includes(q)
      || l.offering_skills?.some(s => s.toLowerCase().includes(q))
      || l.seeking_skills?.some(s => s.toLowerCase().includes(q));
    const matchCat = categoryFilter === 'all' || l.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.title || form.offering_skills.length === 0 || form.seeking_skills.length === 0) {
      toast.error('Please fill in title, skills you offer, and skills you seek.');
      return;
    }
    setPosting(true);
    try {
      await base44.entities.SkillExchange.create({
        ...form,
        duration_hours: form.duration_hours ? parseFloat(form.duration_hours) : undefined,
        poster_id: user.id,
        poster_name: user.full_name,
        poster_avatar: user.avatar_url || '',
        poster_headline: user.headline || '',
        status: 'open',
      });
      qc.invalidateQueries({ queryKey: ['skill-exchange'] });
      setShowCreate(false);
      setForm({ title: '', description: '', offering_skills: [], seeking_skills: [], category: '', duration_hours: '', availability: '' });
      toast.success('Listing posted!');
    } catch (_) {
      toast.error('Failed to post listing.');
    } finally {
      setPosting(false);
    }
  };

  const handleMessage = async (listing) => {
    const targetUser = await base44.entities.User.filter({ id: listing.poster_id }).then(r => r[0]);
    if (targetUser) startConversation(targetUser);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold">Skill Exchange</h1>
          <p className="text-sm text-muted-foreground mt-1">Barter your skills — no money, just value for value</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="flex-shrink-0 gap-1.5">
          <Plus className="w-4 h-4" /> Post Offer
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-10 bg-muted/50"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 h-10">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_NAMES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Listings */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <ArrowLeftRight className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No skill exchanges yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4">Be the first to post a skill swap offer</p>
          <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
            Post an offer
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(listing => (
            <div
              key={listing.id}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
            >
              {/* Author */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                  {listing.poster_avatar
                    ? <img src={listing.poster_avatar} className="w-full h-full object-cover" alt="" />
                    : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">{listing.poster_name?.[0]}</div>
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{listing.poster_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{listing.poster_headline}</p>
                </div>
                {listing.category && (
                  <Badge variant="secondary" className="text-xs ml-auto flex-shrink-0">{listing.category}</Badge>
                )}
              </div>

              <h3 className="font-semibold text-sm mb-1.5">{listing.title}</h3>
              {listing.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{listing.description}</p>
              )}

              {/* Skills exchange */}
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium">Offering</p>
                  <div className="flex flex-wrap gap-1">
                    {listing.offering_skills?.map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
                    ))}
                  </div>
                </div>
                <ArrowLeftRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium">Seeking</p>
                  <div className="flex flex-wrap gap-1">
                    {listing.seeking_skills?.map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {listing.duration_hours && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {listing.duration_hours}h
                    </span>
                  )}
                  {listing.availability && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {listing.availability}
                    </span>
                  )}
                </div>
                {listing.poster_id !== user?.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-8 text-xs"
                    onClick={() => handleMessage(listing)}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Propose Swap
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post a Skill Exchange</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder="e.g. I'll design your logo for SEO consulting"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                rows={3}
                placeholder="Tell people what you're offering and what you need..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Skills I'm Offering</Label>
              <div className="mt-1">
                <SkillsInput
                  skills={form.offering_skills}
                  onChange={v => update('offering_skills', v)}
                  placeholder="e.g. Logo design, Figma..."
                  max={8}
                />
              </div>
            </div>
            <div>
              <Label>Skills I'm Seeking</Label>
              <div className="mt-1">
                <SkillsInput
                  skills={form.seeking_skills}
                  onChange={v => update('seeking_skills', v)}
                  placeholder="e.g. SEO, Copywriting..."
                  max={8}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => update('category', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_NAMES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Est. Hours</Label>
                <Input
                  type="number"
                  value={form.duration_hours}
                  onChange={e => update('duration_hours', e.target.value)}
                  placeholder="e.g. 5"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Availability</Label>
              <Input
                value={form.availability}
                onChange={e => update('availability', e.target.value)}
                placeholder="e.g. Weekends, evenings..."
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={posting || !form.title || form.offering_skills.length === 0 || form.seeking_skills.length === 0}
              >
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Exchange'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
