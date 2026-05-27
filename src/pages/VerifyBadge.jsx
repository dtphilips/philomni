import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  Shield, CheckCircle2, XCircle, Clock, Upload, AlertCircle,
  BadgeCheck, Loader2, ExternalLink,
} from 'lucide-react'

const BADGE_CONFIG = {
  blue: {
    color:       'blue',
    bgClass:     'from-blue-500/10 to-card',
    borderClass: 'border-blue-500/40',
    iconColor:   'text-blue-400',
    badgeColor:  '#3b82f6',
    label:       'Blue Tick',
    subtitle:    'Identity Verified',
    emoji:       '🔵',
    description: 'Confirm your real identity with a government-issued ID. Builds trust with your audience.',
    requirements: [
      'Any Philomni user can apply',
      'Upload a valid government-issued photo ID',
      'Manual review by Philomni team (1–3 business days)',
    ],
    requiresDoc:    true,
    docLabel:       'Government ID (passport, national ID, driver\'s licence)',
    autoApprove:    false,
  },
  gold: {
    color:       'gold',
    bgClass:     'from-yellow-500/10 to-card',
    borderClass: 'border-yellow-500/40',
    iconColor:   'text-yellow-400',
    badgeColor:  '#f59e0b',
    label:       'Gold Tick',
    subtitle:    'Pro Verified',
    emoji:       '🟡',
    description: 'Reserved for Pro/Pro Max subscribers who have also verified their identity.',
    requirements: [
      'Must already hold a Blue Tick',
      'Active Pro or Pro Max subscription',
      'Account at least 30 days old',
      'No policy violations',
      'Auto-approved if all criteria are met',
    ],
    requiresDoc:    false,
    autoApprove:    true,
  },
  purple: {
    color:       'purple',
    bgClass:     'from-purple-500/10 to-card',
    borderClass: 'border-purple-500/40',
    iconColor:   'text-purple-400',
    badgeColor:  '#a855f7',
    label:       'Purple Tick',
    subtitle:    'Business Verified',
    emoji:       '🟣',
    description: 'For businesses and organisations operating on Philomni.',
    requirements: [
      'Must be on Pro Max plan',
      'Upload official business registration document',
      'Manual review required (2–5 business days)',
    ],
    requiresDoc:    true,
    docLabel:       'Business registration certificate / CAC document',
    autoApprove:    false,
  },
}

function BadgeStatusChip({ status }) {
  if (!status) return null
  const cfg = {
    pending:  { label: 'Under Review', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
    approved: { label: 'Approved',     color: 'text-green-400 bg-green-400/10 border-green-400/20'  },
    rejected: { label: 'Rejected',     color: 'text-red-400 bg-red-400/10 border-red-400/20'        },
  }[status] || { label: status, color: 'text-muted-foreground' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cfg.color}`}>
      {status === 'pending'  && <Clock className="w-3 h-3" />}
      {status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'rejected' && <XCircle className="w-3 h-3" />}
      {cfg.label}
    </span>
  )
}

async function uploadDoc(file) {
  const ext  = file.name.split('.').pop() || 'bin'
  const path = `badge-docs/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`
  const { data, error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
  return publicUrl
}

export default function VerifyBadge() {
  const { user, refreshProfile } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [applying,     setApplying]     = useState(null)  // badge type currently being submitted
  const [docFile,      setDocFile]      = useState({})    // { blue: File, purple: File }

  const accountAgeDays = user?.created_at
    ? Math.floor((Date.now() - new Date(user.created_at)) / 86400000)
    : 0

  const isPaidPlan  = ['pro', 'promax'].includes(user?.plan)
  const isProMax    = user?.plan === 'promax'
  const hasBlue     = user?.badge_type === 'blue'  && user?.badge_status === 'approved'
  const pendingBlue = user?.badge_type === 'blue'  && user?.badge_status === 'pending'

  // Load this user's existing applications
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('badge_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setApplications(data || []); setLoading(false) })
  }, [user?.id])

  const latestApp = (type) => applications.find(a => a.badge_type === type)

  // Gold eligibility check
  const goldEligibility = {
    hasBlue:      hasBlue,
    isPaid:       isPaidPlan,
    accountAge:   accountAgeDays >= 30,
    noViolations: true, // placeholder — would check policy_violations column
  }
  const goldEligible = Object.values(goldEligibility).every(Boolean)

  const handleApply = async (type) => {
    if (!user?.id) return
    setApplying(type)
    try {
      const cfg = BADGE_CONFIG[type]
      let docUrl = null

      // Upload document if required
      if (cfg.requiresDoc) {
        const file = docFile[type]
        if (!file) { toast.error('Please attach the required document.'); setApplying(null); return }
        toast.loading('Uploading document…', { id: 'doc-upload' })
        docUrl = await uploadDoc(file)
        toast.dismiss('doc-upload')
      }

      // Insert application
      const { error: appErr } = await supabase.from('badge_applications').insert({
        user_id:      user.id,
        badge_type:   type,
        document_url: docUrl,
        status:       'pending',
      })
      if (appErr) throw appErr

      // Update users table
      await supabase.from('users').update({
        badge_type:         type,
        badge_status:       cfg.autoApprove && goldEligible ? 'approved' : 'pending',
        badge_submitted_at: new Date().toISOString(),
        badge_document_url: docUrl,
      }).eq('id', user.id)

      if (cfg.autoApprove && goldEligible) {
        // Auto-approve gold — also update application row
        await supabase.from('badge_applications')
          .update({ status: 'approved', reviewed_at: new Date().toISOString() })
          .eq('user_id', user.id).eq('badge_type', type).eq('status', 'pending')
        toast.success('🟡 Gold Tick approved automatically!')
      } else {
        toast.success('Application submitted! We\'ll review it shortly.')
      }

      refreshProfile?.()
      // Refresh applications list
      const { data } = await supabase.from('badge_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setApplications(data || [])
      setDocFile(prev => ({ ...prev, [type]: null }))
    } catch (err) {
      toast.error(err.message || 'Something went wrong.')
    } finally {
      setApplying(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BadgeCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Verification Badges</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Build trust with your audience. Verified accounts get a badge next to their name everywhere on Philomni.
        </p>
      </div>

      {/* Current badge status */}
      {user?.badge_type && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
          <Shield className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Current badge: <span className="capitalize">{user.badge_type} Tick</span>
            </p>
            {user.badge_submitted_at && (
              <p className="text-xs text-muted-foreground">
                Applied {new Date(user.badge_submitted_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <BadgeStatusChip status={user.badge_status} />
        </div>
      )}

      {/* Badge cards */}
      <div className="space-y-5">
        {['blue', 'gold', 'purple'].map((type) => {
          const cfg = BADGE_CONFIG[type]
          const app = latestApp(type)
          const isCurrentApproved = user?.badge_type === type && user?.badge_status === 'approved'
          const isApplied = !!app

          // Disable conditions
          let disableReason = ''
          if (type === 'gold') {
            if (!hasBlue)     disableReason = 'Blue Tick required first'
            else if (!isPaidPlan) disableReason = 'Pro or Pro Max plan required'
            else if (accountAgeDays < 30) disableReason = `${30 - accountAgeDays} more days needed`
          }
          if (type === 'purple' && !isProMax) disableReason = 'Pro Max plan required'

          const canApply = !disableReason && !isCurrentApproved && (!app || app.status === 'rejected')

          return (
            <div
              key={type}
              className={`rounded-2xl border bg-gradient-to-br p-6 ${cfg.bgClass} ${cfg.borderClass}`}
            >
              <div className="flex items-start gap-4">
                {/* Badge icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-card/60`}>
                  {cfg.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className={`font-bold text-foreground`}>{cfg.label}</h3>
                    <span className={`text-xs font-medium ${cfg.iconColor}`}>{cfg.subtitle}</span>
                    {isCurrentApproved && <BadgeStatusChip status="approved" />}
                    {app && !isCurrentApproved && <BadgeStatusChip status={app.status} />}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{cfg.description}</p>

                  {/* Requirements */}
                  <ul className="space-y-1 mb-4">
                    {cfg.requirements.map((req, i) => {
                      // For gold, colour by eligibility
                      let ok = true
                      if (type === 'gold') {
                        ok = [hasBlue, isPaidPlan, accountAgeDays >= 30, true][i] ?? true
                      }
                      return (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          {type === 'gold'
                            ? ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                                 : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                            : <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          }
                          <span className={type === 'gold' ? (ok ? 'text-foreground' : 'text-muted-foreground') : 'text-muted-foreground'}>
                            {req}
                            {type === 'gold' && i === 2 && accountAgeDays < 30 && (
                              <span className="text-yellow-400 ml-1">({accountAgeDays}/30 days)</span>
                            )}
                          </span>
                        </li>
                      )
                    })}
                  </ul>

                  {/* Document upload */}
                  {cfg.requiresDoc && canApply && (
                    <div className="mb-4">
                      <label className="block text-xs text-muted-foreground mb-1.5">{cfg.docLabel}</label>
                      <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/50 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors bg-card/40">
                        <Upload className="w-3.5 h-3.5" />
                        {docFile[type] ? docFile[type].name : 'Click to attach document (PDF, JPG, PNG)'}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={e => setDocFile(prev => ({ ...prev, [type]: e.target.files?.[0] || null }))}
                        />
                      </label>
                    </div>
                  )}

                  {/* Rejection reason */}
                  {app?.status === 'rejected' && app.rejection_reason && (
                    <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-300">{app.rejection_reason}</p>
                    </div>
                  )}

                  {/* CTA */}
                  {!isCurrentApproved && (
                    disableReason ? (
                      <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <XCircle className="w-3.5 h-3.5" />
                        {disableReason}
                      </div>
                    ) : app?.status === 'pending' ? (
                      <div className="inline-flex items-center gap-1.5 text-xs text-yellow-400">
                        <Clock className="w-3.5 h-3.5" />
                        Application under review…
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApply(type)}
                        disabled={applying === type}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60
                          ${type === 'blue'   ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30' : ''}
                          ${type === 'gold'   ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30' : ''}
                          ${type === 'purple' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30' : ''}
                        `}
                      >
                        {applying === type ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        {app?.status === 'rejected' ? 'Re-apply' : type === 'gold' && goldEligible ? 'Auto-apply (eligible)' : 'Apply Now'}
                      </button>
                    )
                  )}

                  {isCurrentApproved && (
                    <p className="text-xs text-green-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Badge active on your profile
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info footer */}
      <div className="flex items-start gap-2 p-4 rounded-xl bg-muted/30 border border-border">
        <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Badge reviews are conducted by the Philomni team. Submitting false documents will result in a permanent account ban.
          For questions contact <span className="text-primary">support@philomni.app</span>.
        </p>
      </div>
    </div>
  )
}
