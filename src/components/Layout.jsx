import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Home, Users, Radio, Mic2, Wand2, BarChart2, MessageSquare,
  Music, Palette, Library, Briefcase, Globe, Zap, ShoppingBag,
  Video, LogOut, Menu, X, ChevronRight, Bell, Package,
  GraduationCap, Store, Film, BookOpen, Rss,
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    label: 'Creator',
    items: [
      { to: '/',         icon: Home,           label: 'Feed' },
      { to: '/reels',    icon: Film,           label: 'Reels' },
      { to: '/stories',  icon: BookOpen,       label: 'Stories' },
    ],
  },
  {
    label: 'Connect',
    items: [
      { to: '/community', icon: Users,         label: 'Community' },
      { to: '/messages',  icon: MessageSquare, label: 'Messages' },
      { to: '/notifications', icon: Bell,      label: 'Notifications' },
    ],
  },
  {
    label: 'Studio',
    items: [
      { to: '/creator-studio',  icon: Wand2,   label: 'Creator Studio' },
      { to: '/audio-studio',    icon: Music,   label: 'Audio Studio' },
      { to: '/creative-studio', icon: Palette, label: 'Creative Studio' },
      { to: '/content',         icon: Rss,     label: 'Content Suite' },
    ],
  },
  {
    label: 'Grow',
    items: [
      { to: '/analytics', icon: BarChart2,     label: 'Analytics' },
      { to: '/podcasts',  icon: Mic2,          label: 'Podcasts' },
      { to: '/store',     icon: Store,         label: 'My Store' },
      { to: '/learning',  icon: GraduationCap, label: 'Learning' },
    ],
  },
  {
    label: 'Work',
    items: [
      { to: '/jobs',        icon: Briefcase,  label: 'Jobs' },
      { to: '/skills',      icon: Zap,        label: 'Skill Exchange' },
      { to: '/marketplace', icon: ShoppingBag,label: 'Marketplace' },
      { to: '/my-orders',   icon: Package,    label: 'My Orders' },
    ],
  },
  {
    label: 'Network',
    items: [
      { to: '/rooms',      icon: Radio,    label: 'Rooms' },
      { to: '/meetings',   icon: Video,    label: 'Meetings' },
      { to: '/pitch-vault',icon: Briefcase,label: 'Pitch Vault' },
      { to: '/directory',  icon: Globe,    label: 'Directory' },
    ],
  },
  {
    label: 'Discover',
    items: [
      { to: '/music-library', icon: Library, label: 'Music Library' },
      { to: '/stores',        icon: Store,   label: 'Stores' },
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

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const Sidebar = ({ onNav }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">P</div>
        <span className="font-bold text-foreground text-lg">Philomni</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <SectionHeader label={section.label} />
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.to} {...item} onClick={onNav} />
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
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
