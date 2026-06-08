import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// ── Subscription helpers ───────────────────────────────────────────────────────
const callEdgeFn = async (name, body) => {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`,
    {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    },
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}
import {
  User, Lock, Bell, Palette, Shield, Database, HelpCircle,
  Info, LogOut, ChevronRight, Moon, Sun, Eye, EyeOff,
  Smartphone, Globe, DollarSign, BarChart2, Trash2,
  Download, CheckCircle, AlertTriangle, X, Save,
  CreditCard, Building2, Mail, Phone, MapPin, Link as LinkIcon,
  Loader2, Camera, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

// ── Section IDs ────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'account',      icon: User,       label: 'Account',          desc: 'Email, password, phone' },
  { id: 'profile',      icon: User,       label: 'Profile',          desc: 'Name, bio, links' },
  { id: 'privacy',      icon: Lock,       label: 'Privacy',          desc: 'Visibility & interactions' },
  { id: 'notifications',icon: Bell,       label: 'Notifications',    desc: 'Push & email alerts' },
  { id: 'appearance',   icon: Palette,    label: 'Appearance',       desc: 'Theme & display' },
  { id: 'creator',      icon: DollarSign, label: 'Creator Tools',    desc: 'Monetization & payouts' },
  { id: 'security',     icon: Shield,     label: 'Security',         desc: '2FA & login activity' },
  { id: 'data',         icon: Database,   label: 'Data & Privacy',   desc: 'Export & deletion' },
  { id: 'help',         icon: HelpCircle, label: 'Help & Support',   desc: 'FAQ & contact' },
  { id: 'about',        icon: Info,       label: 'About Philomni',   desc: 'Version & legal' },
];

// ── Toggle switch ──────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );
}

// ── Field row ──────────────────────────────────────────────────────────────────
function FieldRow({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, desc, children }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {desc && <p className="text-sm text-muted-foreground mt-1">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-card rounded-2xl border border-border p-6 space-y-5 ${className}`}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Ad Settings Card (monetized creators only) ────────────────────────────────
function AdSettingsCard({ user }) {
  const [allowPreRoll,  setAllowPreRoll]  = useState(user?.allow_pre_roll  !== false)
  const [allowMidRoll,  setAllowMidRoll]  = useState(user?.allow_mid_roll  !== false)
  const [allowEndRoll,  setAllowEndRoll]  = useState(user?.allow_end_roll  !== false)
  const [saving,        setSaving]        = useState(false)

  const save = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('users')
      .update({ allow_pre_roll: allowPreRoll, allow_mid_roll: allowMidRoll, allow_end_roll: allowEndRoll })
      .eq('id', user.id)
    setSaving(false)
    if (error) toast.error('Failed to save ad settings.')
    else toast.success('Ad settings saved.')
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Ad Settings</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium">Monetized</span>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Control which ad slots appear on your videos. You earn <strong>55%</strong> of revenue from each ad view.
        Disabling slots reduces potential earnings.
      </p>
      <Toggle value={allowPreRoll} onChange={v => setAllowPreRoll(v)}
        label="Pre-roll ads" desc="Ad plays before your video starts" />
      <Toggle value={allowMidRoll} onChange={v => setAllowMidRoll(v)}
        label="Mid-roll ads" desc="Ad plays at the 50% point of your video" />
      <Toggle value={allowEndRoll} onChange={v => setAllowEndRoll(v)}
        label="End-roll ads" desc="Ad plays in the last 5 seconds of your video" />
      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Ad Settings
      </button>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Cancel Subscription Button ─────────────────────────────────────────────────
function CancelSubscriptionButton({ userId }) {
  const [loading,  setLoading]  = useState(false)
  const [confirm,  setConfirm]  = useState(false)
  const { refreshProfile } = useAuth()

  const handleCancel = async () => {
    if (!confirm) { setConfirm(true); return }
    setLoading(true)
    try {
      await callEdgeFn('cancel-subscription', { userId })
      toast.success('Subscription will cancel at end of billing period. You keep access until then.')
      refreshProfile?.()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
      setConfirm(false)
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 flex items-center gap-1 ${
        confirm
          ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20'
          : 'text-muted-foreground border border-border hover:bg-muted'
      }`}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
      {confirm ? 'Confirm cancel' : 'Cancel plan'}
    </button>
  )
}

export default function Settings() {
  const { user } = useAuth();
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState('account');
  const [saving, setSaving] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Account
  const [newEmail, setNewEmail] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Profile
  const [profileForm, setProfileForm] = useState({
    full_name: '', username: '', bio: '', website: '', location: '',
    headline: '', primary_category: '',
  });

  // Privacy
  const [privacy, setPrivacy] = useState({
    account_public: true,
    allow_messages_from: 'everyone',
    allow_comments: true,
    show_activity_status: true,
    show_in_suggestions: true,
  });

  // Notifications
  const [notifs, setNotifs] = useState({
    likes: true, comments: true, follows: true,
    messages: true, mentions: true, live_videos: false,
    email_digests: true, marketing_emails: false,
  });

  // Appearance
  const [darkMode, setDarkMode] = useState(true);
  const [fontSize, setFontSize] = useState('medium');

  // Creator
  const [creatorForm, setCreatorForm] = useState({
    subscription_price: '', payout_email: '', stripe_connected: false,
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        username: user.username || '',
        bio: user.bio || '',
        website: user.website || '',
        location: user.location || '',
        headline: user.headline || '',
        primary_category: user.primary_category || '',
      });
      setDarkMode(user.dark_mode ?? true);
    }
  }, [user]);

  const save = async (data) => {
    if (!user) { toast.error('Sign in to save settings'); return; }
    setSaving(true);
    try {
      await supabase.from('users').update(data).eq('id', user.id);
      toast.success('Saved');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const handleChangeEmail = async () => {
    if (!newEmail) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success('Confirmation email sent to ' + newEmail);
      setNewEmail('');
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!newPw || newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      toast.success('Password updated');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const applyDarkMode = (on) => {
    setDarkMode(on);
    document.documentElement.classList.toggle('dark', on);
    save({ dark_mode: on });
  };

  const handleLogout = () => {
    logout();
  };

  const currentSection = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0];

  // ── Section content ──────────────────────────────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {

      // ── ACCOUNT ─────────────────────────────────────────────────────────────
      case 'account': return (
        <Section title="Account" desc="Manage your email, password, and connected accounts">
          <Card>
            <h3 className="font-semibold text-sm">Email Address</h3>
            <p className="text-xs text-muted-foreground">Current: <strong>{user?.email || 'Not signed in'}</strong></p>
            <FieldRow label="New Email">
              <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@email.com" type="email" />
            </FieldRow>
            <Button size="sm" onClick={handleChangeEmail} disabled={!newEmail || saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Update Email
            </Button>
          </Card>

          <Card>
            <h3 className="font-semibold text-sm">Change Password</h3>
            <FieldRow label="Current Password">
              <div className="relative">
                <Input type={showCurrentPw ? 'text' : 'password'} value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCurrentPw(s => !s)}>
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FieldRow>
            <FieldRow label="New Password">
              <div className="relative">
                <Input type={showNewPw ? 'text' : 'password'} value={newPw}
                  onChange={e => setNewPw(e.target.value)} placeholder="Min 8 characters" />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNewPw(s => !s)}>
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FieldRow>
            <FieldRow label="Confirm New Password">
              <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" />
            </FieldRow>
            <Button size="sm" onClick={handleChangePassword} disabled={!newPw || !confirmPw || saving}>
              Update Password
            </Button>
          </Card>

          <Card>
            <h3 className="font-semibold text-sm">Connected Accounts</h3>
            {[
              { name: 'Google', icon: '🔵', connected: false },
              { name: 'LinkedIn', icon: '💼', connected: false },
              { name: 'Twitter / X', icon: '🐦', connected: false },
            ].map(acc => (
              <div key={acc.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{acc.icon}</span>
                  <p className="text-sm font-medium">{acc.name}</p>
                </div>
                <Button size="sm" variant="outline" disabled>
                  {acc.connected ? 'Disconnect' : 'Connect'} <span className="ml-1 text-[10px] text-muted-foreground">(Coming soon)</span>
                </Button>
              </div>
            ))}
          </Card>
        </Section>
      );

      // ── PROFILE ─────────────────────────────────────────────────────────────
      case 'profile': return (
        <Section title="Profile" desc="Edit your public profile information">
          <Card>
            <FieldRow label="Full Name">
              <Input value={profileForm.full_name} onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" />
            </FieldRow>
            <FieldRow label="Username">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input value={profileForm.username} onChange={e => setProfileForm(p => ({ ...p, username: e.target.value }))} placeholder="username" className="pl-7" />
              </div>
            </FieldRow>
            <FieldRow label="Headline">
              <Input value={profileForm.headline} onChange={e => setProfileForm(p => ({ ...p, headline: e.target.value }))} placeholder="Creator · Entrepreneur · Designer" />
            </FieldRow>
            <FieldRow label="Bio">
              <Textarea value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell the world about yourself..." rows={3} className="resize-none" maxLength={300} />
              <p className="text-xs text-muted-foreground text-right">{profileForm.bio.length}/300</p>
            </FieldRow>
            <FieldRow label="Website">
              <Input value={profileForm.website} onChange={e => setProfileForm(p => ({ ...p, website: e.target.value }))} placeholder="https://yourwebsite.com" type="url" />
            </FieldRow>
            <FieldRow label="Location">
              <Input value={profileForm.location} onChange={e => setProfileForm(p => ({ ...p, location: e.target.value }))} placeholder="City, Country" />
            </FieldRow>
            <Button onClick={() => save(profileForm)} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Profile
            </Button>
          </Card>
        </Section>
      );

      // ── PRIVACY ─────────────────────────────────────────────────────────────
      case 'privacy': return (
        <Section title="Privacy" desc="Control who can see and interact with your content">
          <Card>
            <h3 className="font-semibold text-sm mb-2">Account Visibility</h3>
            <Toggle value={privacy.account_public} onChange={v => setPrivacy(p => ({ ...p, account_public: v }))}
              label="Public Account" desc="Anyone can see your profile and posts" />
            <Toggle value={privacy.show_in_suggestions} onChange={v => setPrivacy(p => ({ ...p, show_in_suggestions: v }))}
              label="Show in Suggestions" desc="Appear in 'People you may know'" />
            <Toggle value={privacy.show_activity_status} onChange={v => setPrivacy(p => ({ ...p, show_activity_status: v }))}
              label="Show Activity Status" desc="Let others see when you were last active" />
          </Card>

          <Card>
            <h3 className="font-semibold text-sm mb-2">Interactions</h3>
            <Toggle value={privacy.allow_comments} onChange={v => setPrivacy(p => ({ ...p, allow_comments: v }))}
              label="Allow Comments" desc="Let others comment on your posts" />

            <div className="py-3 border-b border-border">
              <p className="text-sm font-medium mb-2">Who can message you</p>
              <div className="flex gap-2 flex-wrap">
                {['everyone', 'followers', 'no one'].map(opt => (
                  <button key={opt} onClick={() => setPrivacy(p => ({ ...p, allow_messages_from: opt }))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all border ${privacy.allow_messages_from === opt ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-sm mb-3">Blocked Users</h3>
            <p className="text-sm text-muted-foreground">You haven't blocked anyone yet.</p>
            <Button variant="outline" size="sm" className="mt-2">Manage Blocked Users</Button>
          </Card>
        </Section>
      );

      // ── NOTIFICATIONS ────────────────────────────────────────────────────────
      case 'notifications': return (
        <Section title="Notifications" desc="Choose what you want to be notified about">
          <Card>
            <h3 className="font-semibold text-sm mb-1">Push Notifications</h3>
            {[
              { key: 'likes',      label: 'Likes',       desc: 'When someone likes your post' },
              { key: 'comments',   label: 'Comments',    desc: 'When someone comments on your post' },
              { key: 'follows',    label: 'New Followers',desc: 'When someone follows you' },
              { key: 'messages',   label: 'Messages',    desc: 'New direct messages' },
              { key: 'mentions',   label: 'Mentions',    desc: 'When someone @mentions you' },
              { key: 'live_videos',label: 'Live Videos', desc: 'When accounts you follow go live' },
            ].map(n => (
              <Toggle key={n.key} value={notifs[n.key]} onChange={v => setNotifs(p => ({ ...p, [n.key]: v }))}
                label={n.label} desc={n.desc} />
            ))}
          </Card>

          <Card>
            <h3 className="font-semibold text-sm mb-1">Email Notifications</h3>
            {[
              { key: 'email_digests',    label: 'Weekly Digest',      desc: 'Summary of your weekly activity' },
              { key: 'marketing_emails', label: 'Product Updates',    desc: 'New features and announcements' },
            ].map(n => (
              <Toggle key={n.key} value={notifs[n.key]} onChange={v => setNotifs(p => ({ ...p, [n.key]: v }))}
                label={n.label} desc={n.desc} />
            ))}
          </Card>
        </Section>
      );

      // ── APPEARANCE ───────────────────────────────────────────────────────────
      case 'appearance': return (
        <Section title="Appearance" desc="Customize how Philomni looks to you">
          <Card>
            <h3 className="font-semibold text-sm">Theme</h3>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {[
                { id: 'dark',  label: 'Dark',  icon: Moon,  desc: 'Deep dark background' },
                { id: 'light', label: 'Light', icon: Sun,   desc: 'Clean light background' },
              ].map(theme => (
                <button key={theme.id} onClick={() => applyDarkMode(theme.id === 'dark')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    (darkMode && theme.id === 'dark') || (!darkMode && theme.id === 'light')
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}>
                  <theme.icon className={`w-5 h-5 mb-2 ${(darkMode && theme.id === 'dark') || (!darkMode && theme.id === 'light') ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-semibold">{theme.label}</p>
                  <p className="text-xs text-muted-foreground">{theme.desc}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-sm">Font Size</h3>
            <div className="flex gap-2 mt-3 flex-wrap">
              {['small', 'medium', 'large'].map(size => (
                <button key={size} onClick={() => setFontSize(size)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium capitalize transition-all ${fontSize === size ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                  {size}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-sm">Language & Region</h3>
            <div className="mt-3 space-y-3">
              <FieldRow label="Language">
                <select className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  <option>English (US)</option>
                  <option>French</option>
                  <option>Spanish</option>
                  <option>Portuguese</option>
                  <option>Arabic</option>
                  <option>Chinese (Simplified)</option>
                  <option>Japanese</option>
                </select>
              </FieldRow>
              <FieldRow label="Timezone">
                <select className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  <option>UTC</option>
                  <option>America/New_York</option>
                  <option>America/Los_Angeles</option>
                  <option>Europe/London</option>
                  <option>Europe/Paris</option>
                  <option>Asia/Tokyo</option>
                </select>
              </FieldRow>
            </div>
          </Card>
        </Section>
      );

      // ── CREATOR TOOLS ────────────────────────────────────────────────────────
      case 'creator': return (
        <Section title="Creator Tools" desc="Monetization, payouts, and creator settings">
          <Card>
            <h3 className="font-semibold text-sm">Subscription Plan</h3>
            <div className="flex items-center gap-3 mt-3 p-3 rounded-xl border border-border bg-muted/30">
              <div className={`w-3 h-3 rounded-full ${['pro','promax'].includes(user?.plan) ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
              <div>
                <p className="text-sm font-medium capitalize">
                  {user?.plan === 'promax' ? 'Pro Max' : user?.plan === 'pro' ? 'Pro' : 'Free'} Plan
                  {user?.subscription_status === 'cancelling' && <span className="ml-2 text-xs text-amber-500">(cancels at period end)</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {['pro','promax'].includes(user?.plan)
                    ? 'Monetization active · Payouts every Friday'
                    : 'Upgrade to Pro to unlock monetization & weekly payouts'}
                </p>
              </div>
              {!['pro', 'promax'].includes(user?.plan) ? (
                <Link to="/pricing" className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/5 transition-colors flex-shrink-0">
                  Upgrade
                </Link>
              ) : user?.subscription_status !== 'cancelling' && (
                <CancelSubscriptionButton userId={user?.id} />
              )}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-sm">Bank & Payouts</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Connect your bank account to receive weekly creator payouts. Managed securely via your payment provider.
            </p>
            <Link to="/wallet" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <Building2 className="w-4 h-4" />
              Manage Bank Account →
            </Link>
          </Card>

          <Card>
            <h3 className="font-semibold text-sm">Analytics Preferences</h3>
            {[
              { key: 'weekly_report', label: 'Weekly Analytics Report',    desc: 'Email summary of your performance' },
              { key: 'realtime',      label: 'Real-time View Counter',      desc: 'Show live view counts on posts' },
            ].map(item => (
              <Toggle key={item.key} value={true} onChange={() => {}} label={item.label} desc={item.desc} />
            ))}
          </Card>

          {/* Ad Settings — only for monetized creators */}
          {user?.monetization_enabled ? (
            <AdSettingsCard user={user} />
          ) : (
            <Card>
              <h3 className="font-semibold text-sm">Ad Settings</h3>
              <p className="text-xs text-muted-foreground mt-1">
                <Link to="/creator-monetize" className="text-primary hover:underline">Apply for content monetization</Link>
                {' '}to control which ad slots appear on your videos and earn 55% of ad revenue.
              </p>
            </Card>
          )}
        </Section>
      );

      // ── SECURITY ─────────────────────────────────────────────────────────────
      case 'security': return (
        <Section title="Security" desc="Protect your account">
          <Card>
            <h3 className="font-semibold text-sm">Two-Factor Authentication</h3>
            <p className="text-xs text-muted-foreground mt-1">Add an extra layer of security to your account.</p>
            <div className="flex items-center justify-between mt-4 p-3 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Authenticator App</p>
                  <p className="text-xs text-muted-foreground">Not set up</p>
                </div>
              </div>
              <Button size="sm" variant="outline">Set up</Button>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-sm">Login Activity</h3>
            <p className="text-xs text-muted-foreground mt-1">Recent sign-in sessions.</p>
            <div className="mt-3 space-y-2">
              {[
                { device: 'Chrome on Windows', location: 'Current session', time: 'Active now', current: true },
                { device: 'Safari on iPhone', location: 'Last seen 2 days ago', time: '2 days ago', current: false },
              ].map((session, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/10">
                  <div>
                    <p className="text-sm font-medium">{session.device}</p>
                    <p className="text-xs text-muted-foreground">{session.location} · {session.time}</p>
                  </div>
                  {session.current
                    ? <Badge className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Current</Badge>
                    : <Button size="sm" variant="ghost" className="text-xs text-destructive">Log out</Button>}
                </div>
              ))}
            </div>
          </Card>
        </Section>
      );

      // ── DATA & PRIVACY ───────────────────────────────────────────────────────
      case 'data': return (
        <Section title="Data & Privacy" desc="Manage your data and account deletion">
          <Card>
            <h3 className="font-semibold text-sm">Download Your Data</h3>
            <p className="text-xs text-muted-foreground mt-1">Get a copy of all your Philomni data including posts, messages, and profile information.</p>
            <Button variant="outline" className="mt-4 gap-2">
              <Download className="w-4 h-4" />Request Data Export
            </Button>
          </Card>

          <Card>
            <h3 className="font-semibold text-sm text-destructive">Delete Account</h3>
            <p className="text-xs text-muted-foreground mt-1">Permanently delete your account and all associated data. This action cannot be undone.</p>
            <div className="flex items-start gap-2 mt-3 p-3 rounded-xl border border-destructive/30 bg-destructive/5">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">All your posts, followers, earnings, and profile data will be permanently deleted.</p>
            </div>
            <Button variant="destructive" className="mt-4 gap-2" size="sm">
              <Trash2 className="w-4 h-4" />Delete My Account
            </Button>
          </Card>
        </Section>
      );

      // ── HELP ─────────────────────────────────────────────────────────────────
      case 'help': return (
        <Section title="Help & Support" desc="Get help with Philomni">
          <Card className="space-y-0 p-0 overflow-hidden">
            {[
              { label: 'Help Center', desc: 'Browse frequently asked questions', icon: HelpCircle },
              { label: 'Contact Support', desc: 'Get help from our team', icon: Mail },
              { label: 'Report a Problem', desc: 'Tell us about a bug or issue', icon: AlertTriangle },
              { label: 'Community Guidelines', desc: 'Learn about our rules and policies', icon: Shield },
            ].map((item, i) => (
              <button key={i} className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </Card>
        </Section>
      );

      // ── ABOUT ─────────────────────────────────────────────────────────────────
      case 'about': return (
        <Section title="About Philomni" desc="Version, legal, and acknowledgements">
          <Card>
            <div className="flex items-center gap-4">
              <img src="/logo_v2.svg" alt="Philomni" className="w-14 h-14 rounded-2xl" />
              <div>
                <h3 className="font-bold text-lg">Philomni</h3>
                <p className="text-sm text-muted-foreground">Brilliance Deserves a Home</p>
                <p className="text-xs text-muted-foreground mt-0.5">Version 1.0.0</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-0 p-0 overflow-hidden">
            {[
              'Terms of Service', 'Privacy Policy', 'Cookie Policy',
              'Open Source Licenses', 'Accessibility',
            ].map((item, i) => (
              <button key={i} className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                <span className="text-sm">{item}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </Card>
        </Section>
      );

      default: return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-bold text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account, privacy, and preferences</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Left navigation ── */}
        <aside className="w-64 flex-shrink-0 hidden md:block">
          <nav className="bg-card rounded-2xl border border-border overflow-hidden">
            {SECTIONS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-b border-border last:border-0 ${
                  activeSection === s.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <s.icon className="w-4 h-4 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{s.label}</p>
                  <p className="text-xs opacity-70 truncate">{s.desc}</p>
                </div>
                {activeSection === s.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
              </button>
            ))}

            {/* Log out */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-destructive hover:bg-destructive/5 transition-all border-t border-border"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Log Out</span>
            </button>
          </nav>
        </aside>

        {/* ── Mobile top selector ── */}
        <div className="md:hidden w-full mb-4">
          <select
            value={activeSection}
            onChange={e => setActiveSection(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium"
          >
            {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        {/* ── Right content ── */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
