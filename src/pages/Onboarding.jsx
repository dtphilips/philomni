import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/categories';
import { Music2, Briefcase, TrendingUp, Building2, Users, ArrowRight, Check } from 'lucide-react';

const PUBLIC_ROLES = ['creator', 'professional', 'investor', 'business', 'member'];

const ROLE_ICONS = {
  creator: Music2,
  professional: Briefcase,
  investor: TrendingUp,
  business: Building2,
  member: Users,
};

const ROLE_GRADIENTS = {
  creator: 'from-purple-500/10 via-pink-500/5 to-rose-500/10 border-purple-200 hover:border-purple-400',
  professional: 'from-blue-500/10 via-cyan-500/5 to-sky-500/10 border-blue-200 hover:border-blue-400',
  investor: 'from-emerald-500/10 via-teal-500/5 to-green-500/10 border-emerald-200 hover:border-emerald-400',
  business: 'from-orange-500/10 via-amber-500/5 to-yellow-500/10 border-orange-200 hover:border-orange-400',
  member: 'from-slate-500/10 via-gray-500/5 to-zinc-500/10 border-slate-200 hover:border-slate-400',
};

const ROLE_ICON_COLORS = {
  creator: 'text-purple-500',
  professional: 'text-blue-500',
  investor: 'text-emerald-500',
  business: 'text-orange-500',
  member: 'text-slate-500',
};

const ROLE_SELECTED_RING = {
  creator: 'ring-purple-400 border-purple-400',
  professional: 'ring-blue-400 border-blue-400',
  investor: 'ring-emerald-400 border-emerald-400',
  business: 'ring-orange-400 border-orange-400',
  member: 'ring-slate-400 border-slate-400',
};

const ROLE_CHECK_BG = {
  creator: 'bg-purple-500',
  professional: 'bg-blue-500',
  investor: 'bg-emerald-500',
  business: 'bg-orange-500',
  member: 'bg-slate-500',
};

export default function Onboarding() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      await base44.auth.updateMe({ role: selectedRole });
      navigate('/onboarding/profile');
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5 shadow-lg">
            <span className="text-primary-foreground font-bold text-2xl font-display">P</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Welcome to Philomni
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Brilliance Deserves a Home. Tell us who you are so we can tailor your experience.
          </p>
        </div>

        {/* Role Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {PUBLIC_ROLES.map((key, i) => {
            const Icon = ROLE_ICONS[key];
            const isSelected = selectedRole === key;
            return (
              <motion.button
                key={key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => setSelectedRole(key)}
                className={`relative p-5 rounded-xl border-2 text-left transition-all duration-200 bg-gradient-to-br ${ROLE_GRADIENTS[key]} ${
                  isSelected ? `ring-2 ${ROLE_SELECTED_RING[key]} ring-offset-2` : ''
                }`}
              >
                {isSelected && (
                  <div className={`absolute top-3 right-3 w-6 h-6 rounded-full ${ROLE_CHECK_BG[key]} flex items-center justify-center`}>
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <Icon className={`w-7 h-7 mb-3 ${ROLE_ICON_COLORS[key]}`} />
                <h3 className="font-semibold text-foreground text-base mb-1.5">
                  {ROLE_LABELS[key]}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {ROLE_DESCRIPTIONS[key]}
                </p>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={handleContinue}
            disabled={!selectedRole || loading}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-4">
            You can change your role later in Settings
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
