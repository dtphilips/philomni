import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import {
  Home, Users, Radio, Mic2, Wand2, BarChart2, MessageSquare,
  Music, Palette, Library, Briefcase, Globe, Zap, ShoppingBag,
  Video, LogOut, Menu, X, ChevronRight, Bell, Package,
  GraduationCap, Store, Film, BookOpen, Rss, Building2,
  Newspaper, Award, Target, ClipboardList, Hash,
} from 'lucide-react'

// ─── Creator Mode Navigation ──────────────────────────────────────────────────
const CREATOR_NAV = [
  {
    label: 'Create',
    items: [
      { to: '/',         icon: Home,       label: 'Feed' },
      { to: '/reels',    icon: Film,       label: 'Reels' },
      { to: '/stories',  icon: BookOpen,   label: 'Stories' },
    ],
  },
  {
    label: 'Connect',
    items: [
      { to: '/community',    icon: Users,         label: 'Community' },
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
      { to: '/audio-studio',   icon: Music,   label: 'Audio Studio' },
      { to: '/content',        icon: Rss,     label: 'Content Suite' },
    ],
  },
  {
    label: 'Grow',
    items: [
      { to: '/analytics', icon: BarChart2, label: 'Analytics' },
      { to: '/podcasts',  icon: Mic2,      label: 'Podcasts' },
      { to: '/store',     icon: Store,     label: 'My Store' },
    ],
  },
  {
    label: 'Discover',
    items: [
      { to: '/music-library', icon: Library,    label: 'Music Library' },
      { to: '/marketplace',   icon: ShoppingBag,label: 'Marketplace' },
      { to: '/skills',        icon: Zap,        label: 'Skill Exchange' },
    ],
  },
]

// ─── Pro Mode Navigation ──────────────────────────────────────────────────────
const PRO_NAV = [
  {
    label: 'Network',
    items: [
      { to: '/pro-feed',  icon: Newspaper, label: 'Professional Feed' },
      { to: '/community', icon: Users,     label: 'Community' },
      { to: '/companies', icon: Building2, label: 'Companies' },
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
      { to: '/learning',             icon: GraduationCap, label: 'Learning Hub' },
      { to: '/learning/certificates',icon: Award,         label: 'Certificates' },
    ],
  },
  {
    label: 'Build',
    items: [
      { to: '/rooms',      icon: Radio,    label: 'Rooms' },
      { to: '/meetings',   icon: Video,    label: 'Meetings' },
      { to: '/podcasts',   icon: Mic2,     label: 'Podcasts' },
      { to: '/pitch-vault',icon: Target,   label: 'Pitch Vault' },
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

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-primary/15 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

function SectionHeader({ label }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
      {label}
    </p>
  )
}

function ModeSwitcher({ mode, onSwitch }) {
  const isCreator = mode === 'creator'
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
  const { user, signOut } = useAuth()
  const { mode, switchTo, toast } = useMode()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // FIX 1: When mode changes, redirect to the correct feed
  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return
    switchTo(newMode)
    if (newMode === 'creator') {
      navigate('/')
    } else {
      navigate('/pro-feed')
    }
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

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navSections = mode === 'creator' ? CREATOR_NAV : PRO_NAV

  const Sidebar = ({ onNav }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">P</div>
        <span className="font-bold text-foreground text-lg">Philomni</span>
      </div>

      {/* Mode switcher */}
      <ModeSwitcher mode={mode} onSwitch={handleModeSwitch} />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0">
        {navSections.map((section) => (
          <div key={section.label}>
            <SectionHeader label={section.label} />
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.to + item.label} {...item} onClick={onNav} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <NavLink
          to="/profile"
          onClick={onNav}
          className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-colors mb-1"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0 overflow-hidden">
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              : (user?.full_name?.[0] ?? '?')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.full_name ?? 'Creator'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        </NavLink>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar onNav={() => setMobileOpen(false)} />
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

        {/* Page content */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="max-w-4xl mx-auto px-4 py-6">
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
    </div>
  )
}
