import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Upload, Loader2, X, Camera, Plus, Trash2, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function EditProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef(null);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [full_name, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [saving, setSaving] = useState(false);
  // Work Experience
  const [workExperience, setWorkExperience] = useState([]);
  const [companySearch, setCompanySearch] = useState({});
  const [companySuggestions, setCompanySuggestions] = useState({});

  const { user: user, loading: isLoading } = useAuth();

  useEffect(() => {
    if (user) {
      setAvatarPreview(user.avatar_url || '');
      setFullName(user.full_name || '');
      setBio(user.bio || '');
      setWebsite(user.website || '');
      setBannerPreview(user.banner_url || '');
    }
  }, [user]);

  // Load work experience
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('work_experience').select('*').eq('user_id', user.id).order('start_date', { ascending: false })
      .then(({ data }) => { if (data?.length) setWorkExperience(data) });
  }, [user?.id]);

  const addPosition = () => {
    setWorkExperience(prev => [...prev, {
      id: `new-${Date.now()}`, company_id: null, company_name: '', company_logo: null,
      title: '', employment_type: 'Full-time', start_date: '', end_date: '', is_current: false, description: ''
    }]);
  };

  const updatePosition = (idx, field, val) => {
    setWorkExperience(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  };

  const removePosition = async (idx) => {
    const pos = workExperience[idx];
    if (pos.id && !String(pos.id).startsWith('new-')) {
      await supabase.from('work_experience').delete().eq('id', pos.id).catch(() => {});
    }
    setWorkExperience(prev => prev.filter((_, i) => i !== idx));
  };

  const searchCompanies = async (idx, query) => {
    if (!query || query.length < 2) { setCompanySuggestions(p => ({ ...p, [idx]: [] })); return; }
    const { data } = await supabase.from('companies').select('id, name, logo_url').ilike('name', `%${query}%`).limit(5);
    setCompanySuggestions(p => ({ ...p, [idx]: data || [] }));
  };

  const saveWorkExperience = async () => {
    for (const pos of workExperience) {
      const payload = {
        user_id: user.id, company_id: pos.company_id || null, company_name: pos.company_name,
        company_logo: pos.company_logo || null, title: pos.title, employment_type: pos.employment_type,
        start_date: pos.start_date || null, end_date: pos.is_current ? null : (pos.end_date || null),
        is_current: pos.is_current, description: pos.description || null,
      };
      if (String(pos.id).startsWith('new-')) {
        await supabase.from('work_experience').insert(payload).catch(() => {});
      } else {
        await supabase.from('work_experience').update(payload).eq('id', pos.id).catch(() => {});
      }
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => setAvatarPreview(evt.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => setBannerPreview(evt.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let avatarUrl = user?.avatar_url || '';
      let bannerUrl = user?.banner_url || '';

      // Upload avatar if provided
      if (avatarFile) {
        const avatarRes = await (async () => {
  const _uPath = `uploads/${Date.now()}-${avatarFile.name}`;
  const { data: _uData, error: _uErr } = await supabase.storage.from('uploads').upload(_uPath, avatarFile, { upsert: true });
  if (_uErr) throw _uErr;
  const { data: { publicUrl: _uUrl } } = supabase.storage.from('uploads').getPublicUrl(_uData.path);
  return { file_url: _uUrl };
})();
        avatarUrl = avatarRes.file_url;
      }

      // Upload banner if provided
      if (bannerFile) {
        const res = await (async () => {
  const _uPath = `uploads/${Date.now()}-${bannerFile.name}`;
  const { data: _uData, error: _uErr } = await supabase.storage.from('uploads').upload(_uPath, bannerFile, { upsert: true });
  if (_uErr) throw _uErr;
  const { data: { publicUrl: _uUrl } } = supabase.storage.from('uploads').getPublicUrl(_uData.path);
  return { file_url: _uUrl };
})();
        bannerUrl = res.file_url;
      }

      // Update user profile
      await supabase.from('users').update({
        avatar_url: avatarUrl,
        full_name: full_name.trim().eq('id', user.id),
        bio: bio.trim(),
        website: website.trim(),
        banner_url: bannerUrl,
      });

      queryClient.invalidateQueries({ queryKey: ['user'] });
      await saveWorkExperience();
      toast.success('Profile updated!');
      navigate('/profile');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/profile')}
          className="h-10 w-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
      </div>

      <div className="space-y-6">
        {/* Avatar Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div
              className="relative w-24 h-24 rounded-full overflow-hidden bg-muted flex-shrink-0 cursor-pointer group"
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-2xl">
                  {user?.full_name?.[0] || '?'}
                </div>
              )}
              {/* Camera overlay on hover */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Upload a new photo</p>
              <p className="text-xs text-muted-foreground mt-1">Click the circle to browse. JPG, PNG or GIF.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 mr-2" />
                Choose Photo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Full Name */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Full Name</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="full_name">Display name</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="Your full name"
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Profile Banner */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Banner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <div className="h-48 rounded-lg border-2 border-dashed border-border bg-muted overflow-hidden">
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Upload className="w-8 h-8" />
                    <p className="text-sm">No banner uploaded</p>
                  </div>
                )}
              </div>
              <label className="absolute bottom-3 right-3 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
                <div className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Upload className="w-4 h-4" />
                </div>
              </label>
              {bannerPreview && (
                <button
                  onClick={() => {
                    setBannerFile(null);
                    setBannerPreview('');
                  }}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 hover:bg-black/60 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended: 1200x300px or larger
            </p>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="bio">Tell people about yourself</Label>
            <Textarea
              id="bio"
              placeholder="Share your story, interests, and expertise..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/500 characters
            </p>
          </CardContent>
        </Card>

        {/* Website */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Website</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="website">Your website or portfolio link</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourwebsite.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Include the full URL with https://
            </p>
          </CardContent>
        </Card>

        {/* Work Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Work Experience</span>
              <Button variant="outline" size="sm" onClick={addPosition}>
                <Plus className="w-4 h-4 mr-1" /> Add Position
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {workExperience.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No work experience added yet. Click "Add Position" to get started.</p>
            )}
            {workExperience.map((pos, idx) => (
              <div key={pos.id} className="border border-border rounded-xl p-4 space-y-3 relative">
                <button onClick={() => removePosition(idx)} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {/* Company search */}
                <div className="relative">
                  <Label className="text-xs text-muted-foreground mb-1 block">Company Name</Label>
                  <Input
                    value={companySearch[idx] ?? pos.company_name}
                    onChange={e => {
                      const val = e.target.value;
                      setCompanySearch(p => ({ ...p, [idx]: val }));
                      updatePosition(idx, 'company_name', val);
                      updatePosition(idx, 'company_id', null);
                      searchCompanies(idx, val);
                    }}
                    placeholder="Search companies or enter name..."
                  />
                  {companySuggestions[idx]?.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 bg-card border border-border rounded-xl shadow-xl mt-1 overflow-hidden">
                      {companySuggestions[idx].map(co => (
                        <button key={co.id} onClick={() => {
                          updatePosition(idx, 'company_id', co.id);
                          updatePosition(idx, 'company_name', co.name);
                          updatePosition(idx, 'company_logo', co.logo_url);
                          setCompanySearch(p => ({ ...p, [idx]: co.name }));
                          setCompanySuggestions(p => ({ ...p, [idx]: [] }));
                        }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs">
                            {co.logo_url ? <img src={co.logo_url} alt="" className="w-full h-full object-cover rounded" /> : co.name[0]}
                          </div>
                          {co.name}
                          {pos.company_id === co.id && <span className="ml-auto text-xs text-primary">✓ Linked</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {pos.company_id && (
                    <p className="text-xs text-primary mt-1">✓ Linked to company page</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Job Title</Label>
                  <Input value={pos.title} onChange={e => updatePosition(idx, 'title', e.target.value)} placeholder="e.g. Senior Video Editor" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Employment Type</Label>
                  <select value={pos.employment_type} onChange={e => updatePosition(idx, 'employment_type', e.target.value)}
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                    {['Full-time','Part-time','Contract','Freelance','Internship','Self-employed'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Start Date</Label>
                    <Input type="month" value={pos.start_date} onChange={e => updatePosition(idx, 'start_date', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">End Date</Label>
                    <Input type="month" value={pos.end_date} onChange={e => updatePosition(idx, 'end_date', e.target.value)} disabled={pos.is_current} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={pos.is_current} onChange={e => { updatePosition(idx, 'is_current', e.target.checked); if (e.target.checked) updatePosition(idx, 'end_date', ''); }}
                    className="w-4 h-4 accent-primary" />
                  I currently work here
                </label>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Description (optional)</Label>
                  <Textarea value={pos.description} onChange={e => updatePosition(idx, 'description', e.target.value)}
                    placeholder="Describe your role and key achievements..." rows={2} className="resize-none" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => navigate('/profile')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
