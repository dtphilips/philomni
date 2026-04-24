import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CATEGORY_NAMES } from '@/lib/categories';
import { Bell, BellOff, Plus, Trash2, Loader2, BellRing } from 'lucide-react';

const TYPE_LABELS = {
  full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract', gig: 'Gig', internship: 'Internship'
};

function AlertForm({ user, onSaved, onClose }) {
  const [form, setForm] = useState({
    label: '',
    categories: user?.primary_category ? [user.primary_category] : [],
    job_types: [],
    remote_only: false,
    min_budget: '',
    max_budget: '',
    keywords: '',
    digest_frequency: 'weekly',
  });
  const [saving, setSaving] = useState(false);
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleCategory = (cat) => {
    setForm(p => ({
      ...p,
      categories: p.categories.includes(cat) ? p.categories.filter(c => c !== cat) : [...p.categories, cat],
    }));
  };

  const toggleType = (type) => {
    setForm(p => ({
      ...p,
      job_types: p.job_types.includes(type) ? p.job_types.filter(t => t !== type) : [...p.job_types, type],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.JobAlert.create({
      user_id: user.id,
      user_email: user.email,
      user_name: user.full_name,
      label: form.label || (form.categories[0] ? `${form.categories[0]} jobs` : 'Job Alert'),
      categories: form.categories.length ? form.categories : undefined,
      job_types: form.job_types.length ? form.job_types : undefined,
      remote_only: form.remote_only,
      min_budget: form.min_budget ? parseFloat(form.min_budget) : undefined,
      max_budget: form.max_budget ? parseFloat(form.max_budget) : undefined,
      keywords: form.keywords || undefined,
      digest_frequency: form.digest_frequency,
      is_active: true,
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="space-y-5 mt-2">
      <div>
        <Label>Alert Name</Label>
        <Input value={form.label} onChange={e => update('label', e.target.value)} placeholder="e.g. Remote Design Gigs" />
      </div>

      <div>
        <Label className="mb-2 block">Categories <span className="text-muted-foreground font-normal">(pick any)</span></Label>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {CATEGORY_NAMES.map(cat => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                form.categories.includes(cat)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Job Types</Label>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => toggleType(k)}
              className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                form.job_types.includes(k)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label>Min Budget ($)</Label><Input type="number" value={form.min_budget} onChange={e => update('min_budget', e.target.value)} placeholder="0" /></div>
        <div><Label>Max Budget ($)</Label><Input type="number" value={form.max_budget} onChange={e => update('max_budget', e.target.value)} placeholder="Any" /></div>
      </div>

      <div><Label>Keywords</Label><Input value={form.keywords} onChange={e => update('keywords', e.target.value)} placeholder="e.g. React, Figma, motion" /></div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Remote only</Label>
          <p className="text-xs text-muted-foreground">Only match remote-friendly jobs</p>
        </div>
        <Switch checked={form.remote_only} onCheckedChange={v => update('remote_only', v)} />
      </div>

      <div>
        <Label>Notification Frequency</Label>
        <Select value={form.digest_frequency} onValueChange={v => update('digest_frequency', v)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="instant">Instant — notify as jobs are posted</SelectItem>
            <SelectItem value="weekly">Weekly digest — one email per week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Alert'}
      </Button>
    </div>
  );
}

export default function JobAlertPanel({ user }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['job-alerts', user?.id],
    queryFn: () => base44.entities.JobAlert.filter({ user_id: user.id }),
    enabled: !!user,
  });

  const handleDelete = async (id) => {
    await base44.entities.JobAlert.delete(id);
    queryClient.invalidateQueries({ queryKey: ['job-alerts', user?.id] });
  };

  const handleToggle = async (alert) => {
    await base44.entities.JobAlert.update(alert.id, { is_active: !alert.is_active });
    queryClient.invalidateQueries({ queryKey: ['job-alerts', user?.id] });
  };

  const handleSaved = () => queryClient.invalidateQueries({ queryKey: ['job-alerts', user?.id] });

  return (
    <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-accent/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Job Alerts</span>
          {alerts.filter(a => a.is_active).length > 0 && (
            <Badge className="bg-primary/10 text-primary border-0 text-xs">{alerts.filter(a => a.is_active).length} active</Badge>
          )}
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> New Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Job Alert</DialogTitle></DialogHeader>
            <AlertForm user={user} onSaved={handleSaved} onClose={() => setShowCreate(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : alerts.length === 0 ? (
        <p className="text-xs text-muted-foreground">No alerts yet. Create one to get notified when matching jobs are posted.</p>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div key={alert.id} className={`flex items-center gap-3 p-2.5 rounded-lg border bg-card ${alert.is_active ? 'border-border' : 'border-dashed border-border opacity-60'}`}>
              <button onClick={() => handleToggle(alert)} className="flex-shrink-0">
                {alert.is_active ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{alert.label || 'Job Alert'}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {alert.categories?.slice(0, 2).map(c => <span key={c} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{c}</span>)}
                  {(alert.categories?.length || 0) > 2 && <span className="text-xs text-muted-foreground">+{alert.categories.length - 2} more</span>}
                  <span className="text-xs text-muted-foreground">{alert.digest_frequency === 'instant' ? '⚡ Instant' : '📅 Weekly'}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(alert.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}