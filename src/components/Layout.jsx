import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import {
  Home, Users, Radio, Mic2, Wand2, BarChart2, MessageSquare,
  Music, Palette, Library, Briefcase, Globe, Zap, ShoppingBag,
  Video, LogOut, LogIn, Menu, X, ChevronRight, ChevronLeft, Bell, Package,
  GraduationCap, Store, Film, BookOpen, Rss, Building2,
  Newspaper, Award, Target, ClipboardList, Hash, Sparkles, DollarSign,
  Wallet, TrendingUp, BookMarked, Megaphone, Shield,
} from 'lucide-react'
import PhiloDrawer from './PhiloDrawer'
import FloatingMusicPlayer from './FloatingMusicPlayer'
import { useMusic } from '../context/MusicContext'

// ─── Creator Mode Navigation ──────────────────────────────────────────────────
const CREATOR_NAV = [
  {
    label: 'AI',
    items: [
      { to: '/ai', icon: Sparkles, label: 'Philo AI', badge: '✨' },
    ],
  },
  {
    label: 'Create',
    items: [
      { to: '/',         icon: Home,       label: 'Feed' },
      { to: '/reels',    icon: Film,       label: 'Reels' },
      { to: '/stories',  icon: BookOpen,   label: 'Stories' },
      { to: '/live/start',    icon: Radio,        label: 'Go Live',       badge: '🔴' },
      { to: '/celebrations', icon: Sparkles,  label: 'Celebrations',  badge: '🎉' },
    ],
  },
  {
    label: 'Connect',
    items: [
      { to: '/match',        icon: Sparkles,      label: 'SmartMatch', badge: 'NEW' },
      { to: '/community',    icon: Users,         label: 'Community' },
      { to: '/groups',       icon: Hash,   label: 'Groups', badge: '💬' },
      { to: '/messages',     icon: MessageSquare, label: 'Messages' },
      { to: '/rooms',        icon: Radio,         label: 'Rooms' },
      { to: '/meetings',     icon: Video,         label: 'Meetings' },
      { to: '/notifications',icon: Bell,          label: 'Notifications' },
    ],
  },
  {
    label: 'Studio',
    items: [
      { to: '/creator-studio', icon: Wand2,   label: 'Creator Studio' },
      { to: '/content',        icon: Rss,     label: 'Content Suite' },
    ],
  },
  {
    label: 'Music',
    items: [
      { to: '/music',        icon: Music, label: 'Philomni Sounds', badge: '🎵' },
      { to: '/audio-studio', icon: Music, label: 'Audio Studio' },
    ],
  },
  {
    label: 'Grow',
    items: [
      { to: '/analytics', icon: BarChart2,   label: 'Analytics' },
      { to: '/monetize',  icon: DollarSign,  label: 'Monetize', badge: '💰' },
      { to: '/podcasts',  icon: Mic2,        label: 'Podcasts' },
      { to: '/store',     icon: Store,       label: 'My Store' },
    ],
  },
  {
    label: 'Earn',
    items: [
      { to: '/wallet',          icon: Wallet,      label: 'My Wallet' },
      { to: '/affiliate',       icon: ShoppingBag, label: 'Affiliate Market', badge: '💰' },
      { to: '/seller-dashboard',icon: Store,       label: 'Seller Dashboard' },
      { to: '/coins',           icon: DollarSign,  label: 'Buy Coins',  badge: '🪙' },
      { to: '/consulting/offer',icon: Briefcase,   label: 'Consulting' },
      { to: '/sell',            icon: Package,     label: 'Sell Products' },
      { to: '/teach',           icon: GraduationCap, label: 'Teach' },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { to: '/shop',            icon: ShoppingBag, label: 'Shop', badge: '🛍️' },
      { to: '/learn',           icon: BookOpen,    label: 'Courses' },
      { to: '/consulting',      icon: Users,       label: 'Consulting' },
      { to: '/skills',          icon: Zap,         label: 'Skill Exchange' },
    ],
  },
]

// ─── Pro Mode Navigation ──────────────────────────────────────────────────────
const PRO_NAV = [
  {
    label: 'AI',
    items: [
      { to: '/ai', icon: Sparkles, label: 'Philo AI', badge: '✨' },
    ],
  },
  {
    label: 'Network',
    items: [
      { to: '/pro-feed',  icon: Newspaper,    label: 'Professional Feed' },
      { to: '/match',     icon: Sparkles,     label: 'SmartMatch', badge: 'NEW' },
      { to: '/community', icon: Users,        label: 'Community' },
      { to: '/groups',    icon: Hash,  label: 'Groups', badge: '💬' },
      { to: '/companies', icon: Building2,    label: 'Companies' },
      { to: '/directory', icon: Globe,     label: 'Directory' },
    ],
  },
  {
    label: 'Career',
    items: [
      { to: '/jobs',             icon: Briefcase,    label: 'Jobs' },
      { to: '/my-orders',        icon: ClipboardList,label: 'My Applications' },
      { to: '/company/dashboard',icon: Building2,    label: 'My Company' },
      { to: '/skills',           icon: Zap,          label: 'Consulting Exchange' },
    ],
  },
  {
    label: 'Learn',
    items: [
      { to: '/learn',                icon: BookOpen,      label: 'Learn Hub' },
      { to: '/teach',                icon: GraduationCap, label: 'Teach', badge: '💡' },
      { to: '/learning/certificates',icon: Award,         label: 'Certificates' },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { to: '/shop',            icon: ShoppingBag, label: 'Shop', badge: '🛍️' },
      { to: '/sell',            icon: Package,     label: 'Sell Products' },
      { to: '/consulting',      icon: Briefcase,   label: 'Find Consultants' },
    ],
  },
  {
    label: 'Music',
    items: [
      { to: '/music', icon: Music, label: 'Philomni Sounds', badge: '🎵' },
    ],
  },
  {
    label: 'Earn',
    items: [
      { to: '/wallet',          icon: Wallet,      label: 'My Wallet' },
      { to: '/affiliate',       icon: ShoppingBag, label: 'Affiliate Market', badge: '💰' },
      { to: '/seller-dashboard',icon: Store,       label: 'Seller Dashboard' },
      { to: '/coins',           icon: Wallet,      label: 'Buy Coins',  badge: '🪙' },
      { to: '/monetize',        icon: DollarSign,  label: 'Monetize' },
      { to: '/consulting/offer',icon: Users,       label: 'Offer Consulting' },
    ],
  },
  {
    label: 'Invest',
    items: [
      { to: '/pitch-vault', icon: Target,      label: 'Pitch Vault' },
      { to: '/investors',   icon: TrendingUp,  label: 'Investor Access', badge: 'PRO' },
    ],
  },
  {
    label: 'Build',
    items: [
      { to: '/live/start',   icon: Radio,       label: 'Go Live',      badge: '🔴' },
      { to: '/celebrations', icon: Sparkles, label: 'Celebrations', badge: '🎉' },
      { to: '/rooms',        icon: Radio,       label: 'Rooms' },
      { to: '/meetings',   icon: Video,    label: 'Meetings' },
      { to: '/podcasts',   icon: Mic2,     label: 'Podcasts' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/analytics',    icon: BarChart2,     label: 'Analytics' },
      { to: '/messages',     icon: MessageSquare, label: 'Messages' },
      { to: '/notifications',icon: Bell,          label: 'Notifications' },
    ],
  },
]

function NavItem({ to, icon: Icon, label, badge, onClick, collapsed }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      end={to === '/'}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 py-2 rounded-xl text-sm font-medium transition-all ${
          collapsed ? 'justify-center px-0' : 'px-3'
        } ${
          isActive
            ? 'bg-primary/15 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && <span className="truncate flex-1">{label}</span>}
      {!collapsed && badge && (
        <span className="text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full leading-none flex-shrink-0">
          {badge}
        </span>
      )}
    </NavLink>
  )
}

function SectionHeader({ label, collapsed }) {
  if (collapsed) {
    // Thin divider stands in for the section label when collapsed
    return <div className="my-2 mx-2 border-t border-border/40" />
  }
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
      {label}
    </p>
  )
}

// ─── Sidebar (defined outside Layout to prevent re-creation on every render) ─
// collapsed         — desktop icon-only mode (mobile is always expanded)
// onToggleCollapse  — desktop: collapse/expand toggle
// onClose           — mobile: close the overlay (X button). undefined on desktop.
function Sidebar({ user, profile, authLoading, mode, navSections, onModeSwitch, onSignOut, onNav, collapsed, onToggleCollapse, onClose }) {
  const planBadge = (() => {
    const isAdmin = profile?.is_admin ?? user?.is_admin
    const plan    = profile?.plan    ?? user?.plan
    const label   = isAdmin || plan === 'promax' ? 'Pro Max' : plan === 'pro' ? 'Pro' : 'Free'
    const color   = isAdmin || plan === 'promax' ? 'text-yellow-400' : plan === 'pro' ? 'text-purple-400' : 'text-muted-foreground'
    return { label, color }
  })()

  const displayName = profile?.full_name || user?.full_name || user?.email || 'User'
  const avatarUrl   = profile?.avatar_url || user?.avatar_url
  const avatarInner = avatarUrl
    ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
    : (displayName?.[0]?.toUpperCase() ?? '?')

  return (
    <div className="flex flex-col h-full">
      {/* Logo + toggle/close */}
      <div className={`border-b border-border flex-shrink-0 ${
        collapsed ? 'flex flex-col items-center gap-1.5 py-3' : 'flex items-center gap-2.5 px-4 py-4'
      }`}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">P</div>
        {!collapsed && <span className="font-bold text-foreground text-lg flex-1">Philomni</span>}
        {onClose ? (
          /* Mobile: X close button */
          <button onClick={onClose} title="Close menu" aria-label="Close menu"
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        ) : (
          /* Desktop: collapse/expand toggle */
          <button onClick={onToggleCollapse} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Mode switcher */}
      <ModeSwitcher mode={mode} onSwitch={onModeSwitch} collapsed={collapsed} />

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto py-2 space-y-0 ${collapsed ? 'px-2' : 'px-3'}`}>
        {navSections.map((section) => (
          <div key={section.label}>
            <SectionHeader label={section.label} collapsed={collapsed} />
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.to + item.label} {...item} onClick={onNav} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className={`border-t border-border flex-shrink-0 ${collapsed ? 'p-2' : 'p-3'}`}>
        {authLoading ? (
          collapsed ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse mx-auto" />
          ) : (
            <div className="flex items-center gap-3 px-2 py-2 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-muted rounded w-24" />
                <div className="h-2.5 bg-muted rounded w-16" />
              </div>
            </div>
          )
        ) : user ? (
          collapsed ? (
            /* Collapsed: avatar + sign-out icon, stacked & centered */
            <div className="flex flex-col items-center gap-2">
              <NavLink to="/profile" onClick={onNav} title={`${displayName} · ${planBadge.label}`}
                className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all">
                {avatarInner}
              </NavLink>
              <button onClick={onSignOut} title="Sign out"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <NavLink to="/profile" onClick={onNav}
                className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-colors mb-1">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0 overflow-hidden">
                  {avatarInner}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                  <p className={`text-[10px] font-semibold truncate ${planBadge.color}`}>{planBadge.label}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              </NavLink>
              <button onClick={onSignOut}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </>
          )
        ) : (
          <NavLink to="/login" onClick={onNav} title={collapsed ? 'Sign in' : undefined}
            className={`w-full flex items-center gap-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors ${
              collapsed ? 'justify-center px-0' : 'px-2'
            }`}>
            <LogIn className="w-4 h-4" />
            {!collapsed && 'Sign in'}
          </NavLink>
        )}

        {/* Company footer links — hidden when collapsed */}
        {!collapsed && (
          <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap gap-x-3 gap-y-1 px-1">
            {[
              { to: '/advertise', label: 'Advertise' },
              { to: '/settings', label: 'About' },
              { to: '/settings', label: 'Privacy' },
              { to: '/settings', label: 'Terms' },
            ].map(link => (
              <NavLink
                key={link.label}
                to={link.to}
                onClick={onNav}
                className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ModeSwitcher({ mode, onSwitch, collapsed }) {
  const isCreator = mode === 'creator'
  if (collapsed) {
    return (
      <div className="px-2 py-3 border-b border-border flex flex-col items-center gap-1.5">
        <button
          onClick={() => onSwitch('creator')}
          title="Creator mode"
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all ${
            isCreator ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          🎨
        </button>
        <button
          onClick={() => onSwitch('pro')}
          title="Pro mode"
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all ${
            !isCreator ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          💼
        </button>
      </div>
    )
  }
  return (
    <div className="px-3 py-3 border-b border-border">
      <div className="flex items-center bg-muted rounded-full p-1 gap-1">
        <button
          onClick={() => onSwitch('creator')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            isCreator
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>🎨</span>
          <span>Creator</span>
        </button>
        <button
          onClick={() => onSwitch('pro')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            !isCreator
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>💼</span>
          <span>Pro</span>
        </button>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const { mode, switchTo, toast } = useMode()
  const { currentTrack } = useMusic()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [transition, setTransition] = useState(null) // { to: 'pro'|'creator', phase: 'in'|'out' }

  // Collapsible sidebar (desktop) — persisted across refreshes
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  )
  const toggleCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  // Player is visible when a track is loaded — used to pad content + lift Philo button
  const playerVisible = !!currentTrack

  // FIX 9: Mode switch with full-screen transition overlay
  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return
    // Phase 1 — fade in overlay
    setTransition({ to: newMode, phase: 'in' })
    setTimeout(() => {
      // Phase 2 — perform the switch while overlay is visible
      switchTo(newMode)
      if (newMode === 'creator') navigate('/')
      else navigate('/pro-feed')
      // Phase 3 — fade out
      setTransition({ to: newMode, phase: 'out' })
      setTimeout(() => setTransition(null), 350)
    }, 500)
  }

  // FIX 1: On initial load, enforce correct feed for stored mode
  useEffect(() => {
    const isRootOrFeed = location.pathname === '/' || location.pathname === '/feed'
    const isProFeed = location.pathname === '/pro-feed'
    if (isRootOrFeed && mode === 'pro') {
      navigate('/pro-feed', { replace: true })
    } else if (isProFeed && mode === 'creator') {
      navigate('/', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const handleSignOut = () => signOut() // signOut in AuthContext clears storage + hard redirects

  const baseNav = mode === 'creator' ? CREATOR_NAV : PRO_NAV
  const navSections = profile?.is_admin === true
    ? [
        ...baseNav,
        {
          label: 'Admin',
          items: [
            { to: '/admin',                icon: Shield,       label: 'Dashboard'          },
            { to: '/admin/celebrations',  icon: Sparkles,  label: 'Celebrations',      badge: '🎉' },
            { to: '/admin/music',         icon: Music,        label: 'Music Management',  badge: '🎵' },
            { to: '/admin/spotlight',     icon: Award,        label: 'Spotlight',         badge: '⭐' },
            { to: '/admin/badges',        icon: Award,        label: 'Badge Applications' },
            { to: '/admin/monetize',      icon: DollarSign,   label: 'Monetize Queue'     },
            { to: '/admin/ads',           icon: Megaphone,    label: 'Ad Review'          },
            { to: '/admin/brands',        icon: Building2,    label: 'Brand Inquiries'    },
          ],
        },
      ]
    : baseNav

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col border-r border-border bg-card flex-shrink-0 transition-[width] duration-200 ${
        sidebarCollapsed ? 'w-14' : 'w-60'
      }`}>
        <Sidebar
          user={user}
          profile={profile}
          authLoading={authLoading}
          mode={mode}
          navSections={navSections}
          onModeSwitch={handleModeSwitch}
          onSignOut={handleSignOut}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* Mobile sidebar overlay — tap backdrop OR header X to close */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border flex flex-col">
            <Sidebar
              user={user}
              profile={profile}
              authLoading={authLoading}
              mode={mode}
              navSections={navSections}
              onModeSwitch={handleModeSwitch}
              onSignOut={handleSignOut}
              onNav={() => setMobileOpen(false)}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-foreground">Philomni</span>
          <div className="w-9" />
        </header>

        {/* Page content — extra bottom padding when the music player is visible
            so the last items are never hidden behind the 72px player bar */}
        <main className="flex-1 overflow-y-auto relative">
          <div className={`max-w-4xl mx-auto px-4 py-6 ${playerVisible ? 'pb-28' : ''}`}>
            {children}
          </div>

          {/* Mode-switch toast */}
          {toast && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="bg-foreground text-background text-sm font-medium px-4 py-2.5 rounded-full shadow-lg">
                {toast}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* FIX 9: Mode transition overlay */}
      {transition && (
        <div
          className="fixed inset-0 z-[500] flex flex-col items-center justify-center transition-opacity duration-350"
          style={{
            background: transition.to === 'pro'
              ? 'linear-gradient(135deg, #1e3a5f 0%, #0f2340 100%)'
              : 'linear-gradient(135deg, #4c1d95 0%, #2e1065 100%)',
            opacity: transition.phase === 'in' ? 1 : 0,
          }}
        >
          <div className="text-center space-y-3">
            <div className="text-5xl mb-2 animate-bounce">
              {transition.to === 'pro' ? '💼' : '🎨'}
            </div>
            <p className="text-white text-2xl font-bold tracking-tight">
              {transition.to === 'pro' ? 'Pro Mode' : 'Creator Mode'}
            </p>
            <p className="text-white/60 text-sm">
              {transition.to === 'pro' ? 'Switching to professional experience…' : 'Switching to creative experience…'}
            </p>
          </div>
        </div>
      )}

      {/* Floating Philo AI drawer — hidden on live/rooms/meetings pages */}
      {!location.pathname.startsWith('/live') &&
       !location.pathname.startsWith('/rooms') &&
       !location.pathname.startsWith('/meetings') && (
        <PhiloDrawer />
      )}

      {/* Floating music player — persists across routes */}
      <FloatingMusicPlayer />
    </div>
  )
}
