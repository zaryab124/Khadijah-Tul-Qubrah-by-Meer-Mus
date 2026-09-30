'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, UserRole, DEMO_ACCOUNTS } from '../lib/auth-context';
import {
  Lock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  LogOut,
  User,
  KeyRound,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

interface PortalGuardProps {
  allowedRoles: UserRole[];
  portalName: string;
  portalDescription?: string;
  children: React.ReactNode;
}

export default function PortalGuard({
  allowedRoles,
  portalName,
  portalDescription,
  children,
}: PortalGuardProps) {
  const { user, isAuthenticated, isLoading, login, quickLoginAs, logout, hasRole } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Identify the primary required role for demo info
  const primaryRole = allowedRoles[0] || 'ADMIN';
  const targetDemo = DEMO_ACCOUNTS[primaryRole] || DEMO_ACCOUNTS.ADMIN;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await login(username, password, primaryRole);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Access denied.');
    }
  };

  const handleAutofillDemo = () => {
    setUsername(targetDemo.username);
    setPassword(targetDemo.password);
    setErrorMessage(null);
  };

  const handleInstantQuickLogin = () => {
    quickLoginAs(primaryRole);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#051712] flex items-center justify-center text-[#C5A059]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
          <p className="font-serif tracking-widest text-sm uppercase">Verifying Atelier Credentials...</p>
        </div>
      </div>
    );
  }

  // CASE 1: Not authenticated OR authenticated with insufficient role
  const isAuthorized = isAuthenticated && hasRole(allowedRoles);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#040e0b] text-[#FCFBF7] flex flex-col justify-between selection:bg-[#C5A059] selection:text-[#051712]">
        {/* Top Minimal Bar */}
        <header className="border-b border-[#C5A059]/20 px-6 py-4 flex items-center justify-between bg-[#072A20]/60 backdrop-blur-md">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#C5A059] hover:text-[#FCFBF7] transition-colors text-xs font-serif tracking-widest uppercase"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Customer Atelier
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-[0.25em] text-[#C5A059]/70 uppercase font-sans">
              KHADIJAH-TUL-QUBRAH BY Meer&Mus
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
          </div>
        </header>

        {/* Center Authentication Card */}
        <main className="flex-1 flex items-center justify-center p-6 my-8">
          <div className="w-full max-w-md bg-[#072A20]/90 border border-[#C5A059]/40 rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl relative overflow-hidden">
            {/* Ambient Gold Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#0a3e30]/40 rounded-full blur-3xl pointer-events-none" />

            {/* Real Royal Velvet Insignia & Slogan */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#C5A059] via-[#F3E5AB] to-[#99752D] shadow-xl shadow-[#C5A059]/25 ring-2 ring-[#C5A059]/40 mb-3 overflow-hidden">
                <img
                  src="/brand-logo.jpg"
                  alt="KHADIJAH-TUL-QUBRAH by Meer&Mus"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              <span className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase text-[#F3E5AB] mb-1">
                STAY HONEST , STAND LONG
              </span>

              <h2 className="text-xs text-[#C5A059] tracking-widest uppercase font-serif font-bold">
                KHADIJAH-TUL-QUBRAH by Meer&amp;Mus
              </h2>

              <div className="mt-3">
                <span
                  className="text-[11px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full border inline-block mb-1.5"
                  style={{
                    color: targetDemo.accentColor,
                    borderColor: `${targetDemo.accentColor}40`,
                    backgroundColor: `${targetDemo.accentColor}10`,
                  }}
                >
                  {targetDemo.badge}
                </span>

                <h1 className="font-serif text-2xl text-[#FCFBF7] font-normal tracking-wide">
                  {portalName}
                </h1>

                <p className="text-xs text-[#FCFBF7]/60 mt-1 max-w-xs font-sans leading-relaxed">
                  {portalDescription || targetDemo.description}
                </p>
              </div>
            </div>

            {/* Incompatible Role Warning if already logged in as wrong role */}
            {isAuthenticated && user && !hasRole(allowedRoles) && (
              <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-amber-300">Role Clearance Required</p>
                  <p className="text-amber-200/70 mt-0.5">
                    Currently signed in as <span className="font-medium underline">{user.name}</span> ({user.role}). This console requires <span className="text-amber-300 font-bold">{targetDemo.badge}</span> credentials.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-300 text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#C5A059] font-sans font-semibold mb-1.5">
                  Username or Staff Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={`e.g. ${targetDemo.username}`}
                    className="w-full bg-[#051712]/80 border border-[#C5A059]/30 rounded-lg px-4 py-2.5 text-sm text-[#FCFBF7] placeholder-[#FCFBF7]/30 focus:outline-none focus:border-[#C5A059] transition-all"
                  />
                  <User className="w-4 h-4 text-[#C5A059]/50 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#C5A059] font-sans font-semibold mb-1.5">
                  Security Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter clearance password"
                    className="w-full bg-[#051712]/80 border border-[#C5A059]/30 rounded-lg px-4 py-2.5 text-sm text-[#FCFBF7] placeholder-[#FCFBF7]/30 focus:outline-none focus:border-[#C5A059] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#C5A059]/60 hover:text-[#C5A059] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 bg-gradient-to-r from-[#C5A059] to-[#dfbc7a] text-[#051712] font-semibold text-xs tracking-widest uppercase rounded-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Enter {portalName}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-[#C5A059]/20 py-3 text-center text-[10px] text-[#FCFBF7]/40 tracking-widest uppercase font-serif">
          Haute Couture Security Protocol &bull; 256-Bit Role Clearance &bull; All Actions Audited
        </footer>
      </div>
    );
  }

  // CASE 2: User is fully authorized — show portal with luxury staff bar
  return (
    <div className="min-h-screen bg-[#071612] text-[#FCFBF7]">
      {/* Top Persistent Staff Clearance Bar */}
      <div className="bg-[#051712] border-b border-[#C5A059]/30 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs text-[#FCFBF7]/80 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <span
            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border"
            style={{
              color: targetDemo.accentColor,
              borderColor: `${targetDemo.accentColor}50`,
              backgroundColor: `${targetDemo.accentColor}15`,
            }}
          >
            {user?.role === 'SUPER_ADMIN' ? '👑 SUPER ADMIN' : targetDemo.badge}
          </span>
          <span className="font-serif text-[#FCFBF7] font-medium hidden sm:inline">
            {portalName}
          </span>
          <span className="text-[#C5A059]/40 hidden md:inline">|</span>
          <span className="text-[#FCFBF7]/60 text-[11px] hidden md:inline">
            Active Staff: <strong className="text-[#FCFBF7]">{user?.name}</strong> ({user?.email})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-[11px] text-[#C5A059] hover:text-[#FCFBF7] transition-colors flex items-center gap-1 font-serif uppercase tracking-wider"
          >
            <ArrowLeft className="w-3 h-3" /> Customer Storefront
          </Link>

          <Link
            href="/login"
            className="text-[11px] text-[#FCFBF7]/70 hover:text-[#C5A059] transition-colors hidden sm:inline"
          >
            Switch Portal
          </Link>

          <button
            onClick={logout}
            className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded text-[11px] font-sans flex items-center gap-1 transition-all"
            title="Log out from current portal"
          >
            <LogOut className="w-3 h-3" /> Logout
          </button>
        </div>
      </div>

      {/* Actual Portal Content */}
      {children}
    </div>
  );
}
