'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Scissors, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth, DEMO_ACCOUNTS } from '@/lib/auth-context';

export default function ProductionLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both craftsman username/email and password.');
      return;
    }
    setError(null);
    setLoading(true);

    const res = await login(username.trim(), password, 'PRODUCTION');
    setLoading(false);

    if (res.success) {
      router.push('/production');
    } else {
      setError(res.error || 'Invalid workshop craftsman credentials');
    }
  };

  return (
    <div className="min-h-screen bg-[#040e0b] text-[#FCFBF7] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#10B981] hover:text-white text-xs font-bold transition-colors font-serif uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customer Storefront
        </Link>

        <div className="bg-[#072A20]/90 border border-[#10B981]/40 rounded-3xl p-8 space-y-6 shadow-2xl backdrop-blur-xl">
          <div className="text-center space-y-3">
            <Logo size="lg" variant="badge" className="mx-auto" />
            <h1 className="text-lg font-serif font-black text-white pt-2 border-t border-[#10B981]/20 flex items-center justify-center gap-2">
              <Scissors className="w-5 h-5 text-[#10B981]" /> WORKSHOP FLOOR &amp; QC
            </h1>
            <p className="text-xs text-[#FCFBF7]/60">
              Workshop execution terminal: Fabric cutting, zardozi embroidery, bespoke tailoring, and Quality Check approvals.
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
              <label className="text-xs font-semibold text-[#10B981] uppercase tracking-wider font-sans">
                Craftsman Username / Email
              </label>
              <input
                type="text"
                placeholder="production or production@khadijah.couture"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#051712] border border-[#10B981]/30 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#10B981] focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#10B981] uppercase tracking-wider font-sans">
                Security Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#051712] border border-[#10B981]/30 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#10B981] focus:outline-none"
                required
              />
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#10B981] to-[#34D399] text-[#051712] font-black rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-[#10B981]/20 hover:brightness-110"
              >
                {loading ? 'Authenticating...' : 'Sign In to Production Floor'}
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-[#10B981]/20 text-center text-[11px] text-gray-400">
            <span>Need another department? </span>
            <Link href="/login" className="text-[#10B981] hover:underline font-bold">
              View All Portals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
