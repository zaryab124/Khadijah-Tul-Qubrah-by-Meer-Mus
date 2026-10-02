'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Palette, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth, DEMO_ACCOUNTS } from '@/lib/auth-context';

export default function DesignerLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both designer username/email and password.');
      return;
    }
    setError(null);
    setLoading(true);

    const res = await login(username.trim(), password, 'DESIGNER');
    setLoading(false);

    if (res.success) {
      router.push('/designer');
    } else {
      setError(res.error || 'Invalid couturier credentials');
    }
  };

  return (
    <div className="min-h-screen bg-[#040e0b] text-[#FCFBF7] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#E0A96D] hover:text-white text-xs font-bold transition-colors font-serif uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customer Storefront
        </Link>

        <div className="bg-[#072A20]/90 border border-[#E0A96D]/40 rounded-3xl p-8 space-y-6 shadow-2xl backdrop-blur-xl">
          <div className="text-center space-y-3">
            <Logo size="lg" variant="badge" className="mx-auto" />
            <h1 className="text-lg font-serif font-black text-white pt-2 border-t border-[#E0A96D]/20 flex items-center justify-center gap-2">
              <Palette className="w-5 h-5 text-[#E0A96D]" /> HAUTE DESIGNER STUDIO
            </h1>
            <p className="text-xs text-[#FCFBF7]/60">
              Formulate bespoke quotations (V1, V2), calculate fabric &amp; hand-craft pricing, and review customer measurements.
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
              <label className="text-xs font-semibold text-[#E0A96D] uppercase tracking-wider font-sans">
                Designer Username / Email
              </label>
              <input
                type="text"
                placeholder="designer or designer@khadijah.couture"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#051712] border border-[#E0A96D]/30 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#E0A96D] focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#E0A96D] uppercase tracking-wider font-sans">
                Security Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#051712] border border-[#E0A96D]/30 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#E0A96D] focus:outline-none"
                required
              />
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#E0A96D] to-[#dfbc7a] text-[#051712] font-black rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-[#E0A96D]/20 hover:brightness-110"
              >
                {loading ? 'Authenticating...' : 'Sign In to Designer Studio'}
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-[#E0A96D]/20 text-center text-[11px] text-gray-400">
            <span>Need another department? </span>
            <Link href="/login" className="text-[#E0A96D] hover:underline font-bold">
              View All Portals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
