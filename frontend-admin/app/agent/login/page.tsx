'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Headphones, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth, DEMO_ACCOUNTS } from '@/lib/auth-context';

export default function AgentLoginPage() {
  const router = useRouter();
  const { login, quickLoginAs } = useAuth();
  const [username, setUsername] = useState(DEMO_ACCOUNTS.AGENT.username);
  const [password, setPassword] = useState(DEMO_ACCOUNTS.AGENT.password);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(username, password, 'AGENT');
    setLoading(false);

    if (res.success) {
      router.push('/agent');
    } else {
      setError(res.error || 'Invalid concierge agent credentials');
    }
  };

  const handleQuickDemo = () => {
    quickLoginAs('AGENT');
    router.push('/agent');
  };

  return (
    <div className="min-h-screen bg-[#040e0b] text-[#FCFBF7] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#38BDF8] hover:text-white text-xs font-bold transition-colors font-serif uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customer Storefront
        </Link>

        <div className="bg-[#072A20]/90 border border-[#38BDF8]/40 rounded-3xl p-8 space-y-6 shadow-2xl backdrop-blur-xl">
          <div className="text-center space-y-3">
            <Logo size="lg" variant="badge" className="mx-auto" />
            <h1 className="text-lg font-serif font-black text-white pt-2 border-t border-[#38BDF8]/20 flex items-center justify-center gap-2">
              <Headphones className="w-5 h-5 text-[#38BDF8]" /> VIP CONCIERGE &amp; CRM
            </h1>
            <p className="text-xs text-[#FCFBF7]/60">
              High-touch luxury clienteling: Omnichannel leads, WhatsApp follow-ups, and bespoke consultations.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#38BDF8] uppercase tracking-wider font-sans">
                Agent Username / Email
              </label>
              <input
                type="text"
                placeholder="agent or agent@khadijah.couture"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#051712] border border-[#38BDF8]/30 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#38BDF8] focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#38BDF8] uppercase tracking-wider font-sans">
                Security Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#051712] border border-[#38BDF8]/30 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#38BDF8] focus:outline-none"
                required
              />
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#38BDF8] to-[#0284C7] text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-[#38BDF8]/20 hover:brightness-110"
              >
                {loading ? 'Authenticating...' : 'Sign In as VIP Concierge'}
              </button>

              <button
                type="button"
                onClick={handleQuickDemo}
                className="w-full py-2 bg-[#051712] hover:bg-[#0a3e30] border border-[#38BDF8]/40 text-[#38BDF8] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" /> 1-Click Demo Login (Agent)
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-[#38BDF8]/20 text-center text-[11px] text-gray-400">
            <span>Need another department? </span>
            <Link href="/login" className="text-[#38BDF8] hover:underline font-bold">
              View All Portals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
