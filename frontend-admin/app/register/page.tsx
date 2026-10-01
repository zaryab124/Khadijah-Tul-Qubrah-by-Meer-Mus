'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  User,
  ShoppingBag,
  Phone,
  Mail,
  MapPin,
  HeartHandshake,
} from 'lucide-react';

export default function CustomerRegistrationPortal() {
  const router = useRouter();
  const { user, isAuthenticated, login, registerCustomer, logout } = useAuth();

  const [mode, setMode] = useState<'REGISTER' | 'LOGIN'>('REGISTER');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmailOrPhone, setRegEmailOrPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regCity, setRegCity] = useState('Lahore');
  const [regAddress, setRegAddress] = useState('');
  const [regTerms, setRegTerms] = useState(true);

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regEmailOrPhone.trim() || !regPassword) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const res = await registerCustomer(
      regName.trim(),
      regEmailOrPhone.trim(),
      regPassword,
      regCity,
      regAddress.trim() || undefined
    );
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Account registered successfully! Welcome to Khadijah-Tul-Qubrah.');
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } else {
      setErrorMsg(res.error || 'Failed to register account.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMsg('Please enter your email, phone, or username and password.');
      return;
    }

    setLoading(true);
    const res = await login(loginIdentifier.trim(), loginPassword, 'CUSTOMER');
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Signed in successfully! Redirecting to Atelier...');
      setTimeout(() => {
        router.push('/');
      }, 800);
    } else {
      setErrorMsg(res.error || 'Invalid credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#040e0b] text-[#FCFBF7] selection:bg-[#C5A059] selection:text-[#051712]">
      {/* Top Header */}
      <header className="border-b border-[#C5A059]/20 px-6 py-4 bg-[#072A20]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#C5A059] hover:text-[#FCFBF7] transition-colors text-xs font-serif tracking-widest uppercase"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Storefront
          </Link>
          <div className="text-center">
            <span className="text-[10px] tracking-[0.3em] text-[#C5A059] font-sans font-semibold uppercase block">
              Private Client Suite
            </span>
            <span className="font-serif text-lg tracking-wider text-[#FCFBF7]">
              KHADIJAH-TUL-QUBRAH BY Meer&Mus
            </span>
          </div>
          <Link
            href="/login"
            className="text-xs text-[#C5A059]/80 hover:text-white font-serif tracking-wider uppercase"
          >
            Staff Portal &rarr;
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Brand Medallion & Title */}
        <div className="text-center max-w-xl mx-auto mb-8 flex flex-col items-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-[#C5A059] via-[#F3E5AB] to-[#99752D] shadow-2xl shadow-[#C5A059]/30 ring-2 ring-[#C5A059]/50 mb-3 overflow-hidden">
            <img
              src="/brand-logo.jpg"
              alt="KHADIJAH-TUL-QUBRAH by Meer&Mus"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/50 text-[#F3E5AB] text-[10px] font-mono font-black tracking-[0.25em] uppercase mb-2 shadow">
            STAY HONEST , STAND LONG
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl text-[#FCFBF7] font-black tracking-wide uppercase">
            Customer <span className="text-[#C5A059]">Registration &amp; Sign In</span>
          </h1>
          <p className="text-xs text-[#C5A059] tracking-widest font-serif font-bold uppercase mt-0.5">
            Haute Couture Atelier Client Suite
          </p>
          <p className="text-xs text-gray-300 mt-2 font-light max-w-md">
            Create your private client account to save sizing measurements, request custom bespoke bridal quotations, and track orders.
          </p>
        </div>

        {/* Auth Box with Mode Switcher */}
        <div className="bg-[#072A20]/90 border border-[#C5A059]/40 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative max-w-xl mx-auto">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-[#051712] p-1.5 rounded-2xl border border-[#C5A059]/30 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-serif font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                mode === 'REGISTER'
                  ? 'bg-[#C5A059] text-[#051712] shadow-lg shadow-[#C5A059]/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Register New Client</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-serif font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                mode === 'LOGIN'
                  ? 'bg-[#C5A059] text-[#051712] shadow-lg shadow-[#C5A059]/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 animate-fadeIn">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: REGISTRATION FORM */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#C5A059] font-bold uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Begum Fatima Zahra"
                    className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-xl p-3 pl-9 text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                  />
                  <User className="w-4 h-4 text-[#C5A059] absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-[#C5A059] font-bold uppercase tracking-wider mb-1">
                  Email Address or WhatsApp / Phone *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={regEmailOrPhone}
                    onChange={(e) => setRegEmailOrPhone(e.target.value)}
                    placeholder="e.g. client@luxury.pk or +92 300 1234567"
                    className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-xl p-3 pl-9 text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                  />
                  <Mail className="w-4 h-4 text-[#C5A059] absolute left-3 top-3.5" />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Used for order tracking notifications and order verification.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#C5A059] font-bold uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <select
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-xl p-3 text-white focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Jampur">Jampur (Atelier)</option>
                    <option value="Multan">Multan</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Dubai / UAE">Dubai / UAE</option>
                    <option value="London / UK">London / UK</option>
                    <option value="International">Other International</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#C5A059] font-bold uppercase tracking-wider mb-1">
                    Delivery Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="House/Apt #, Street, Area"
                    className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#C5A059] font-bold uppercase tracking-wider mb-1">
                    Create Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-xl p-3 pr-9 text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[#C5A059] font-bold uppercase tracking-wider mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={regTerms}
                  onChange={(e) => setRegTerms(e.target.checked)}
                  className="rounded border-[#C5A059] text-[#C5A059] focus:ring-0"
                />
                <label htmlFor="terms" className="text-[11px] text-gray-300">
                  I agree to the Haute Couture atelier private client privacy &amp; tailoring guidelines.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#C5A059] via-[#dfbc7a] to-amber-600 text-[#051712] font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#C5A059]/20"
              >
                <Sparkles className="w-4 h-4 text-[#051712]" />
                <span>{loading ? 'Creating Client Account...' : 'Register Client Account & Enter'}</span>
              </button>
            </form>
          )}

          {/* MODE 2: SIGN IN FORM */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs animate-fadeIn">
              <div>
                <label className="block text-[#C5A059] font-bold uppercase tracking-wider mb-1">
                  Email, WhatsApp/Phone, or Username *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. client@luxury.pk or +92 300 1234567"
                    className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-xl p-3 pl-9 text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                  />
                  <User className="w-4 h-4 text-[#C5A059] absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-[#C5A059] font-bold uppercase tracking-wider mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Your account password"
                    className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-xl p-3 pr-9 text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#C5A059] via-[#dfbc7a] to-amber-600 text-[#051712] font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#C5A059]/20"
              >
                <Lock className="w-4 h-4 text-[#051712]" />
                <span>{loading ? 'Authenticating...' : 'Sign In to Client Account'}</span>
              </button>
            </form>
          )}

          {/* Secure Trust Badge */}
          <div className="mt-6 pt-4 border-t border-[#C5A059]/20 flex items-center justify-center gap-2 text-[11px] text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>256-Bit SSL Client Encryption &bull; Private Measurements Guaranteed</span>
          </div>
        </div>
      </main>
    </div>
  );
}
