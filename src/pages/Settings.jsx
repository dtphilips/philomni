import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Loader2, Save, Moon, Sun } from 'lucide-react';
import { CATEGORY_NAMES, CATEGORIES } from '@/lib/categories';
import { toast } from 'sonner';

export default function Settings() {
  const { user, setUser } = useOutletContext();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        headline: user.headline || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        primary_category: user.primary_category || '',
        secondary_category: user.secondary_category || '',
        hourly_rate: user.hourly_rate || '',
        availability: user.availability || '',
        investment_focus: user.investment_focus || '',
        deal_size_min: user.deal_size_min || '',
        deal_size_max: user.deal_size_max || '',
        company_name: user.company_name || '',
        company_size: user.company_size || '',
        industry: user.industry || '',
        open_to_collabs: user.open_to_collabs || false,
      });
      setDarkMode(user.dark_mode || false);
    }
  }, [user]);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    let data = { ...form, dark_mode: darkMode };
    if (form.hourly_rate) data.hourly_rate = parseFloat(form.hourly_rate);
    if (form.deal_size_min) data.deal_size_min = parseFloat(form.deal_size_min);
    if (form.deal_size_max) data.deal_size_max = parseFloat(form.deal_size_max);

    if (avatarFile) {
      const res = await base44.integrations.Core.UploadFile({ file: avatarFile });
      data.avatar_url = res.file_url;
    }

    await base44.auth.updateMe(data);
    const me = await base44.auth.me();
    setUser(me);
    applyTheme(darkMode);
    setSaving(false);
    toast.success('Profile updated');
  };

  const applyTheme = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!user) return null;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-card rounded-xl border border-border p-6 space-y-5 max-w-lg">
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
          <div className="flex items-center gap-3">
            {darkMode ? (
              <Moon className="w-5 h-5 text-primary" />
            ) : (
              <Sun className="w-5 h-5 text-primary" />
            )}
            <div>
              <Label className="text-sm font-medium mb-0">Dark Mode</Label>
              <p className="text-xs text-muted-foreground">Toggle dark theme</p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              darkMode ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-4">
           <label className="relative cursor-pointer group">
            <div className="w-16 h-16 rounded-full bg-muted overflow-hidden border-2 border-border group-hover:border-primary transition-colors">
              {avatarFile ? (
                <img src={URL.createObjectURL(avatarFile)} className="w-full h-full object-cover" alt="" />
              ) : user.avatar_url ? (
                <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Camera className="w-5 h-5 text-muted-foreground" /></div>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={e => setAvatarFile(e.target.files[0])} />
          </label>
          <div>
            <p className="font-medium">{user.full_name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div><Label>Headline</Label><Input value={form.headline} onChange={e => update('headline', e.target.value)} /></div>
        <div><Label>Bio</Label><Textarea value={form.bio} onChange={e => update('bio', e.target.value)} rows={3} /></div>
        <div><Label>Location</Label><Input value={form.location} onChange={e => update('location', e.target.value)} /></div>
        <div><Label>Website</Label><Input value={form.website} onChange={e => update('website', e.target.value)} /></div>

        {(user.role === 'professional' || user.role === 'creator') && (
          <>
            <div>
              <Label>Primary Category</Label>
              <Select value={form.primary_category} onValueChange={v => update('primary_category', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CATEGORY_NAMES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.primary_category && (
              <div>
                <Label>Subcategory</Label>
                <Select value={form.secondary_category} onValueChange={v => update('secondary_category', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{CATEGORIES[form.primary_category]?.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

        {user.role === 'professional' && (
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Hourly Rate ($)</Label><Input type="number" value={form.hourly_rate} onChange={e => update('hourly_rate', e.target.value)} /></div>
            <div>
              <Label>Availability</Label>
              <Select value={form.availability} onValueChange={v => update('availability', v)}>
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

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}