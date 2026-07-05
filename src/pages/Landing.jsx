import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Music2, Video, Radio, Mic2, Zap, Users, Star, Gift,
  TrendingUp, Briefcase, Globe, ShoppingBag, BookOpen,
  Calendar, Award, Cpu, BarChart2, Play,
  ChevronRight, Clock, Sparkles,
} from 'lucide-react'

const BEEHIIV_URL = 'https://subscribe-forms.beehiiv.com/abb9c94b-7f63-4062-896d-b2128d0ab68b'

function WaitlistForm({ className = '' }) {
  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <iframe
        src={BEEHIIV_URL}
        data-test-id="beehiiv-embed"
        width="100%"
        height="320"
        frameBorder="0"
        scrolling="no"
        style={{
          display: 'block',
          width: '100%',
          borderRadius: '16px',
          border: 'none',
          background: 'transparent',
        }}
        title="Join the Philomni waitlist"
      />
    </div>
  )
}

const FEATURES = [
  {
    icon: <Video className="w-6 h-6" />,
    title: 'Videos, Reels & Stories',
    desc: 'Full video platform with uploads, captions, analytics, and creator monetization.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: <Radio className="w-6 h-6" />,
    title: 'Go Live & Earn',
    desc: 'Stream live, receive real-time gifts, coins, and viewer reactions.',
    color: 'from-red-500 to-rose-600',
  },
  {
    icon: <Music2 className="w-6 h-6" />,
    title: 'Philomni Sounds',
    desc: 'Publish music with ISRC & SOCAN licensing, earn stream royalties.',
    color: 'from-pink-500 to-fuchsia-600',
  },
  {
    icon: <Mic2 className="w-6 h-6" />,
    title: 'Podcasts',
    desc: 'Host, sell, and grow your podcast audience — episodes, subscriptions, reviews.',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: 'Celebrations',
    desc: 'Announce milestones to the world — Featured, Grand, and Spotlight tiers with brand sponsorships.',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    icon: <Gift className="w-6 h-6" />,
    title: 'Gifts & Coins',
    desc: 'Send coins and gems to your favourite creators. Buy, earn, and cash out.',
    color: 'from-emerald-500 to-green-600',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'SmartMatch AI',
    desc: 'AI-powered matching connects you with creators, brands, and collaborators.',
    color: 'from-cyan-500 to-sky-600',
  },
  {
    icon: <Briefcase className="w-6 h-6" />,
    title: 'Brand Briefs & Deals',
    desc: 'Brands post campaigns, creators apply, milestones tracked end-to-end.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Ad Campaign Wizard',
    desc: 'Full advertiser dashboard — creatives, targeting, cost-per-view, approval workflow.',
    color: 'from-violet-500 to-blue-600',
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: 'Courses & Learning',
    desc: 'Create or enroll in courses with modules, certificates, and progress tracking.',
    color: 'from-teal-500 to-cyan-600',
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: 'Consulting & Bookings',
    desc: 'List your services, set availability, accept bookings, collect reviews.',
    color: 'from-indigo-500 to-violet-600',
  },
  {
    icon: <ShoppingBag className="w-6 h-6" />,
    title: 'Shop & Marketplace',
    desc: 'Sell physical, digital products, skills, and gigs. Affiliate commissions included.',
    color: 'from-rose-500 to-pink-600',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Groups & Rooms',
    desc: 'Community groups, audio rooms, and video meetings — all in one place.',
    color: 'from-amber-500 to-yellow-500',
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: 'Spotlight',
    desc: 'Monthly nomination and community voting for featured creators.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Multi-Gateway Payments',
    desc: 'Paystack · Flutterwave · Stripe · PayPal — auto-routed by your country.',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: <Cpu className="w-6 h-6" />,
    title: 'Developer API',
    desc: 'Build on Philomni — API keys, webhooks, and a full developer portal.',
    color: 'from-slate-500 to-zinc-600',
  },
  {
    icon: <BarChart2 className="w-6 h-6" />,
    title: 'Creator Analytics',
    desc: 'Post, video, and earnings analytics so you can grow what works.',
    color: 'from-sky-500 to-blue-600',
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Creator Fund',
    desc: 'Back a creator or list your offering — community-powered creator economy.',
    color: 'from-fuchsia-500 to-purple-600',
  },
]

const TIERS = [
  { name: 'Featured', price: '$4.99', duration: '7 days', badge: '⭐', color: 'border-yellow-400/40 bg-yellow-500/5' },
  { name: 'Grand', price: '$14.99', duration: '14 days', badge: '🏆', color: 'border-purple-400/40 bg-purple-500/5', popular: true },
  { name: 'Spotlight', price: '$49.99', duration: '30 days', badge: '🌟', color: 'border-blue-400/40 bg-blue-500/5' },
]

export default function Landing() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/feed" replace />

  const scrollToWaitlist = (e) => {
    e.preventDefault()
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Philomni
          </span>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Log in
            </Link>
            <a
              href="#waitlist"
              onClick={scrollToWaitlist}
              className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
            >
              Get early access
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-10 left-1/4 w-[300px] h-[300px] bg-pink-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-6">
            <Clock className="w-3 h-3" />
            Launching soon · Join the early access waitlist
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-tight tracking-tight mb-6">
            Create. Connect.{' '}
            <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              Get Paid.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed">
            Philomni combines video, music, podcasts, live streaming, courses, brand deals,
            and a built-in marketplace — everything a modern creator needs in one platform.
          </p>
          <p className="text-sm text-muted-foreground/70 mb-10">
            The platform is built and being refined. We're launching in approximately one month — be among the first in.
          </p>

          {/* Waitlist form in hero */}
          <WaitlistForm />

          <div className="mt-6 flex items-center justify-center">
            <Link
              to="/celebrations"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Browse active Celebrations while you wait
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-muted/20 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '18+', label: 'Revenue streams' },
            { value: '4', label: 'Payment gateways' },
            { value: '100+', label: 'Platform features' },
            { value: '∞', label: 'Creator potential' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Everything you need to build{' '}
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                your creator empire
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Stop stitching together ten different tools. Philomni is the platform that scales with your ambition.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="group p-5 rounded-2xl border border-border hover:border-border/80 bg-card hover:bg-card/80 transition-all"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} text-white flex items-center justify-center mb-4 shadow-sm`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Celebrations spotlight */}
      <section className="py-16 px-4 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-medium mb-6">
            🎉 Available now: Celebrations
          </div>
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Shout your wins to the world
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-12">
            Birthdays, music debuts, graduations, business launches — celebrate any milestone
            with a paid featured post that brands can sponsor. Celebrations are live and open now.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {TIERS.map(t => (
              <div
                key={t.name}
                className={`relative rounded-2xl border p-6 text-left ${t.color} ${t.popular ? 'ring-2 ring-purple-500/40' : ''}`}
              >
                {t.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most popular
                  </span>
                )}
                <div className="text-3xl mb-3">{t.badge}</div>
                <div className="font-bold text-foreground text-lg">{t.name}</div>
                <div className="text-3xl font-black text-foreground my-2">{t.price}</div>
                <div className="text-sm text-muted-foreground">{t.duration} · Brand sponsorships available</div>
              </div>
            ))}
          </div>
          <Link
            to="/celebrations"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            Browse active celebrations <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Payment trust bar */}
      <section className="py-10 px-4 border-t border-border/50 bg-muted/10">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Payments powered by</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground font-semibold text-sm">
            <span>🏦 Paystack</span>
            <span>📱 Flutterwave</span>
            <span>💳 Stripe</span>
            <span>🅿️ PayPal</span>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Payments auto-routed by your country — Nigeria, Ghana, Kenya, South Africa, US, EU and more.
          </p>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section id="waitlist" className="py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-6">
            <Clock className="w-3 h-3" />
            Launching in approximately one month
          </div>
          <h2 className="text-4xl sm:text-5xl font-black mb-5">
            Be among the first{' '}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              on the platform.
            </span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            We're putting the finishing touches on Philomni. Drop your email below and we'll
            notify you the moment early access opens — no spam, just one message when it's ready.
          </p>

          <WaitlistForm />

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span>Free to join the waitlist</span>
            <span className="w-px h-3 bg-border" />
            <span>Early access notification</span>
            <span className="w-px h-3 bg-border" />
            <span>No spam, ever</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="font-black text-sm bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Philomni
          </span>
          <div className="flex items-center gap-6">
            <Link to="/celebrations" className="hover:text-foreground transition-colors">Celebrations</Link>
            <Link to="/learn" className="hover:text-foreground transition-colors">Courses</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Log in</Link>
          </div>
          <span>© {new Date().getFullYear()} Philomni. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
