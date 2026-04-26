import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { ArrowRight, Camera } from 'lucide-react';
import { CATEGORIES, CATEGORY_NAMES } from '@/lib/categories';
import SkillsInput from '@/components/ui/SkillsInput';

export default function OnboardingProfile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const me = user /* useAuth() */;
      if (!me.role) { navigate('/onboarding'); return; }
      setUser(me);
    };
    load();
  }, [navigate]);

  const handleAvatarChange = (e) => {
    if (e.target.files[0]) setAvatarFile(e.target.files[0]);
  };

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    setLoading(true);
    let avatarUrl = null;
    if (avatarFile) {
      const res = await (async () => {
  const _uPath = `uploads/${Date.now()}-${avatarFile.name}`;
  const { data: _uData, error: _uErr } = await supabase.storage.from('uploads').upload(_uPath, avatarFile, { upsert: true });
  if (_uErr) throw _uErr;
  const { data: { publicUrl: _uUrl } } = supabase.storage.from('uploads').getPublicUrl(_uData.path);
  return { file_url: _uUrl };
})();
      avatarUrl = res.file_url;
    }
    const data = { ...form, onboarding_complete: true };
    if (avatarUrl) data.avatar_url = avatarUrl;
    await supabase.from('users').update(data).eq('id', user.id);
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">
            Set up your profile
          </h1>
          <p className="text-muted-foreground">
            Tell us about yourself to get started.
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-5">
          {/* Avatar */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border group-hover:border-primary transition-colors">
                {avatarFile ? (
                  <img src={URL.createObjectURL(avatarFile)} className="w-full h-full object-cover" alt="" />
                ) : (
                  <Camera className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          <div>
            <Label>Headline</Label>
            <Input
              placeholder={user.role === 'creator' ? 'e.g. Music Producer & Songwriter' : 'e.g. Full Stack Developer'}
              value={form.headline || ''}
              onChange={(e) => update('headline', e.target.value)}
            />
          </div>

          <div>
            <Label>Bio</Label>
            <Textarea
              placeholder="Tell people about yourself..."
              value={form.bio || ''}
              onChange={(e) => update('bio', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label>Location</Label>
            <Input
              placeholder="City, Country"
              value={form.location || ''}
              onChange={(e) => update('location', e.target.value)}
            />
          </div>

          {/* Role-specific fields */}
          {(user.role === 'professional' || user.role === 'creator') && (
            <>
              <div>
                <Label>Primary Category</Label>
                <Select value={form.primary_category || ''} onValueChange={(v) => update('primary_category', v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_NAMES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.primary_category && (
                <div>
                  <Label>Subcategory</Label>
                  <Select value={form.secondary_category || ''} onValueChange={(v) => update('secondary_category', v)}>
                    <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES[form.primary_category]?.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {user.role === 'professional' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hourly Rate ($)</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={form.hourly_rate || ''}
                  onChange={(e) => update('hourly_rate', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label>Availability</Label>
                <Select value={form.availability || ''} onValueChange={(v) => update('availability', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="not_available">Not Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {user.role === 'creator' && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="collabs"
                checked={form.open_to_collabs || false}
                onChange={(e) => update('open_to_collabs', e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary"
              />
              <Label htmlFor="collabs" className="mb-0">Open to collaborations</Label>
            </div>
          )}

          {user.role === 'investor' && (
            <>
              <div>
                <Label>Investment Focus</Label>
                <Input
                  placeholder="e.g. Tech startups, Creative industries"
                  value={form.investment_focus || ''}
                  onChange={(e) => update('investment_focus', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Deal Size ($)</Label>
                  <Input type="number" placeholder="10000" value={form.deal_size_min || ''} onChange={(e) => update('deal_size_min', parseFloat(e.target.value))} />
                </div>
                <div>
                  <Label>Max Deal Size ($)</Label>
                  <Input type="number" placeholder="500000" value={form.deal_size_max || ''} onChange={(e) => update('deal_size_max', parseFloat(e.target.value))} />
                </div>
              </div>
            </>
          )}

          {user.role === 'business' && (
            <>
              <div>
                <Label>Company Name</Label>
                <Input value={form.company_name || ''} onChange={(e) => update('company_name', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Industry</Label>
                  <Select value={form.industry || ''} onValueChange={(v) => update('industry', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_NAMES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Company Size</Label>
                  <Select value={form.company_size || ''} onValueChange={(v) => update('company_size', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['1-10','11-50','51-200','201-500','501-1000','1000+'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {(user.role === 'creator' || user.role === 'professional') && (
            <div>
              <Label>Skills & Expertise</Label>
              <p className="text-xs text-muted-foreground mb-1.5">Add up to 15 skills so others can find you</p>
              <SkillsInput
                skills={form.skills || []}
                onChange={(skills) => update('skills', skills)}
                placeholder="e.g. React, Video Editing..."
              />
            </div>
          )}

          <div>
            <Label>Website</Label>
            <Input
              placeholder="https://yoursite.com"
              value={form.website || ''}
              onChange={(e) => update('website', e.target.value)}
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full h-11" size="lg">
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Complete Setup
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}