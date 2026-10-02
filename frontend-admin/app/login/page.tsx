'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_ACCOUNTS, UserRole } from '../../lib/auth-context';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Crown,
  Scissors,
  Factory,
  Headphones,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

export default function MasterLoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, login, logout } = useAuth();

  const [selectedPortal, setSelectedPortal] = useState<UserRole>('ADMIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectPortal = (role: UserRole) => {
    setSelectedPortal(role);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await login(username.trim(), password, selectedPortal);
    setLoading(false);

    if (res.success) {
      const targetUrl = DEMO_ACCOUNTS[selectedPortal]?.portalUrl || '/admin';
      router.push(targetUrl);
    } else {
      setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const portalsList = [
    {
      role: 'ADMIN' as UserRole,
      title: 'Owner & Admin Control Center',
      icon: Crown,
      color: '#C5A059',
      border: 'border-[#C5A059]/40',
      bg: 'bg-[#C5A059]/10',
      badge: '👑 Executive Clearance',
      target: '/admin',
      desc: 'Financial turnover, live sales, garment launches, campaign video ads, RBAC, and audit trail.',
    },
    {
      role: 'DESIGNER' as UserRole,
      title: 'Haute Designer Atelier',
      icon: Scissors,
      color: '#E0A96D',
      border: 'border-[#E0A96D]/40',
      bg: 'bg-[#E0A96D]/10',
      badge: '✂️ Haute Designer',
      target: '/designer',
      desc: 'Custom commission intake, sketch boards, fabric/craft pricing calculator, and multi-version quotes.',
    },
    {
      role: 'PRODUCTION' as UserRole,
      title: 'Production Floor & QC',
      icon: Factory,
      color: '#10B981',
      border: 'border-[#10B981]/40',
      bg: 'bg-[#10B981]/10',
      badge: '🧵 Master Craftsman',
      target: '/production',
      desc: 'Workshop job cards, cutting, zardozi embroidery, bespoke tailoring, and Quality Check pass/fail.',
    },
    {
      role: 'AGENT' as UserRole,
      title: 'Fashion CRM & Concierge',
      icon: Headphones,
      color: '#38BDF8',
      border: 'border-[#38BDF8]/40',
      bg: 'bg-[#38BDF8]/10',
      badge: '🎧 Client Concierge',
      target: '/agent',
      desc: 'Omnichannel lead pipeline, WhatsApp contact logs, consultation scheduler, and conversion metrics.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#040e0b] text-[#FCFBF7] selection:bg-[#C5A059] selection:text-[#051712]">
      {/* Top Luxury Header */}
      <header className="border-b border-[#C5A059]/20 px-6 py-4 bg-[#072A20]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#C5A059] hover:text-[#FCFBF7] transition-colors text-xs font-serif tracking-widest uppercase"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Customer Atelier
          </Link>
          <div className="text-center">
            <span className="text-[10px] tracking-[0.3em] text-[#C5A059] font-sans font-semibold uppercase block">
              Haute Couture Operations
            </span>
            <span className="font-serif text-lg tracking-wider text-[#FCFBF7]">
              KHADIJAH-TUL-QUBRAH BY Meer&Mus
            </span>
          </div>
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[#FCFBF7]/60">
                Logged in as <strong className="text-[#C5A059]">{user.name}</strong> ({user.role})
              </span>
              <button
                onClick={logout}
                className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded text-[11px]"
              >
                Logout
              </button>
            </div>
          ) : (
            <span className="text-xs text-[#C5A059]/60 font-mono">Role Clearance v2.6</span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Intro Banner */}
        {/* Intro Banner with Authentic Insignia & Slogan */}
        <div className="text-center max-w-2xl mx-auto mb-12 flex flex-col items-center">
          {/* Real Royal Velvet Gold Insignia */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-[#C5A059] via-[#F3E5AB] to-[#99752D] shadow-2xl shadow-[#C5A059]/30 ring-2 ring-[#C5A059]/50 mb-3 overflow-hidden">
            <img
              src="/brand-logo.jpg"
              alt="KHADIJAH-TUL-QUBRAH by Meer&Mus"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/50 text-[#F3E5AB] text-xs font-mono font-black tracking-[0.3em] uppercase mb-2 shadow">
            STAY HONEST , STAND LONG
          </div>

          <h1 className="font-serif text-3xl md:text-4xl text-[#FCFBF7] font-black tracking-wide uppercase">
            KHADIJAH-TUL-<span className="text-[#C5A059]">QUBRAH</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#C5A059] tracking-widest font-serif font-bold uppercase mt-1">
            by Meer&amp;Mus &bull; Department Access Terminal
          </p>

          <p className="text-xs text-[#FCFBF7]/70 mt-3 font-sans leading-relaxed max-w-lg">
            Every department operates with strict role-based access control (RBAC). Please enter your verified username and security password to access your department terminal.
          </p>
        </div>

        {/* Central Split: Direct Login Form + Department Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Left Column: Interactive Form (5 Cols) */}
          <div className="lg:col-span-5 bg-[#072A20]/90 border border-[#C5A059]/40 rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-[#FCFBF7] flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#C5A059]" /> Portal Authentication
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059]">
                RBAC Active
              </span>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#C5A059] font-sans font-semibold mb-1.5">
                  Target Portal
                </label>
                <select
                  value={selectedPortal}
                  onChange={(e) => handleSelectPortal(e.target.value as UserRole)}
                  className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-lg px-3 py-2.5 text-sm text-[#FCFBF7] focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="ADMIN">👑 Owner & Admin Control Center (/admin)</option>
                  <option value="DESIGNER">✂️ Haute Couture Designer Studio (/designer)</option>
                  <option value="PRODUCTION">🧵 Production Floor & QC (/production)</option>
                  <option value="AGENT">🎧 Fashion CRM & Concierge (/agent)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#C5A059] font-sans font-semibold mb-1.5">
                  Username or Department Email
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. admin or designer"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-lg px-3.5 py-2.5 text-sm text-[#FCFBF7] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#C5A059] font-sans font-semibold mb-1.5">
                  Security Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter security password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-lg px-3.5 py-2.5 text-sm text-[#FCFBF7] focus:outline-none focus:border-[#C5A059]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#C5A059]/60 hover:text-[#C5A059]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-[#C5A059] to-[#dfbc7a] text-[#051712] font-black text-xs tracking-widest uppercase rounded-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : `Sign In to ${DEMO_ACCOUNTS[selectedPortal]?.department || 'Department'}`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-[#C5A059]/20 flex items-center justify-between text-xs text-[#FCFBF7]/60">
              <Link href="/register" className="text-[#C5A059] hover:underline font-bold">
                Customer Sign-In &amp; Registration &rarr;
              </Link>
              <Link href="/" className="hover:text-white">
                Storefront &rarr;
              </Link>
            </div>
          </div>

          {/* Right Column: Department Portals Selection (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="font-serif text-lg text-[#C5A059] tracking-wider uppercase mb-2">
              Select Department to Launch
            </h2>

            {portalsList.map((p) => {
              const Icon = p.icon;
              const isSelected = selectedPortal === p.role;

              return (
                <div
                  key={p.role}
                  className={`p-5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-[#072A20] border-[#C5A059] shadow-lg shadow-[#C5A059]/10'
                      : 'bg-[#051712]/70 hover:bg-[#072A20]/60 border-[#C5A059]/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${p.color}15`,
                          borderColor: `${p.color}40`,
                          color: p.color,
                        }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-base text-[#FCFBF7] font-medium">
                            {p.title}
                          </h3>
                          <span
                            className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border"
                            style={{
                              color: p.color,
                              borderColor: `${p.color}40`,
                              backgroundColor: `${p.color}10`,
                            }}
                          >
                            {p.badge}
                          </span>
                        </div>
                        <p className="text-xs text-[#FCFBF7]/60 mt-1 font-sans leading-relaxed">
                          {p.desc}
                        </p>

                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSelectPortal(p.role)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#C5A059] text-[#051712] shadow'
                            : 'bg-[#051712] hover:bg-[#072A20] border border-[#C5A059]/30 text-[#C5A059]'
                        }`}
                      >
                        {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                        {isSelected ? 'Active Portal' : 'Select Portal'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Luxury Footer */}
      <footer className="border-t border-[#C5A059]/20 py-8 px-6 text-center text-xs text-[#FCFBF7]/40 font-serif">
        <p className="tracking-widest uppercase mb-1">
          KHADIJAH-TUL-QUBRAH BY Meer&Mus &bull; Haute Couture Atelier & Fashion House
        </p>
        <p className="font-sans text-[11px] text-[#FCFBF7]/30">
          Strict Multi-Tier Role Clearance &bull; ISO 27001 &bull; 256-Bit Financial Encryption
        </p>
      </footer>
    </div>
  );
}
