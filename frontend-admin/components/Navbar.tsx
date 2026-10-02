'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  MapPin,
  Scissors,
  Palette,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Sparkles,
  User,
  LogOut,
  Headphones,
  Crown,
  Menu,
  X,
  Truck,
  Phone,
  Lock,
} from 'lucide-react';
import { Logo } from './Logo';
import { BranchSelectorModal, AtelierBranch, ATELIER_BRANCHES } from './BranchSelectorModal';
import { useAuth } from '../lib/auth-context';
import { getBrandSettings, BrandSettings, DEFAULT_BRAND_SETTINGS } from '../lib/brand-settings';

interface Props {
  activeBranch?: AtelierBranch;
  onSelectBranch?: (branch: AtelierBranch) => void;
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenBespoke?: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeBranch = ATELIER_BRANCHES[0],
  onSelectBranch,
  cartCount = 0,
  onOpenCart,
  onOpenBespoke,
}) => {
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const [brandSettings, setBrandSettings] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);

  React.useEffect(() => {
    setBrandSettings(getBrandSettings());
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setBrandSettings(e.detail);
      } else {
        setBrandSettings(getBrandSettings());
      }
    };
    window.addEventListener('khadijah_brand_settings_updated', handleUpdate);
    return () => window.removeEventListener('khadijah_brand_settings_updated', handleUpdate);
  }, []);

  const cleanWa = brandSettings.whatsappNumber.replace(/[^0-9]/g, '');
  const waLink = `https://wa.me/${cleanWa || '923359301919'}?text=${encodeURIComponent('Hello KHADIJAH-TUL-QUBRAH By Meer&Mus, I am interested in inquiring about your haute couture and bespoke designs.')}`;

  return (
    <>
      {/* ========================================================================= */}
      {/* SYMMETRIC TOP HEADER (3-PART BALANCED ARCHITECTURE) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#030c09]/95 backdrop-blur-md border-b border-[#C5A059]/30 text-[#FCFBF7] shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 sm:h-24">
            
            {/* ------------------------------------------------------------------- */}
            {/* 1. LEFT WING: Atelier Selector & Quick Links */}
            {/* ------------------------------------------------------------------- */}
            <div className="flex items-center gap-1.5 sm:gap-4 flex-1 justify-start min-w-0">
              {/* Mobile Drawer Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-[#051712] border border-[#C5A059]/40 text-[#C5A059] hover:text-white shrink-0"
                title="Open Navigation Menu"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Store Location Pill (Jampur, Pakistan) */}
              {activeBranch && (
                <button
                  onClick={() => setIsBranchModalOpen(true)}
                  className="flex items-center gap-1.5 sm:gap-2 bg-[#051712] hover:bg-[#072A20] border border-[#C5A059]/30 hover:border-[#C5A059] px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-full transition-all text-left shadow-sm group shrink-0"
                  title="Our Boutique Location: Jampur, Pakistan"
                >
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C5A059] shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="hidden sm:block">
                    <span className="text-[9px] block text-[#C5A059]/70 uppercase tracking-widest font-semibold font-sans">
                      Our Boutique
                    </span>
                    <span className="text-xs font-serif font-bold text-white truncate max-w-[130px] block">
                      Jampur, Pakistan
                    </span>
                  </div>
                  <div className="sm:hidden">
                    <span className="text-[10px] font-serif font-bold text-white">Jampur</span>
                  </div>
                  <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A059]/60 ml-0.5" />
                </button>
              )}

              {/* Desktop Quick Nav Links */}
              <nav className="hidden xl:flex items-center gap-5 text-xs font-serif tracking-wider uppercase ml-3 text-white/80 whitespace-nowrap">
                <a href="#catalog" className="hover:text-[#C5A059] transition-colors py-1">
                  Shop Collection
                </a>
                <Link href="/order-tracking/ORD-2026-KTQ" className="hover:text-[#C5A059] transition-colors py-1 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#C5A059]" /> Track Order
                </Link>
              </nav>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* 2. CENTERPIECE: Perfectly Centered Brand Insignia & Slogan */}
            {/* ------------------------------------------------------------------- */}
            <div className="flex flex-col items-center justify-center shrink-0 text-center px-2 sm:px-4 z-10">
              <Link href="/" className="flex flex-col items-center group">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Real Royal Velvet Insignia Medallion */}
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] via-[#F3E5AB] to-[#99752D] ring-2 ring-[#C5A059]/50 shadow-lg shadow-[#C5A059]/20 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                    <img
                      src="/brand-logo.jpg"
                      alt="KHADIJAH-TUL-QUBRAH by Meer&Mus"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>

                  <div className="text-left sm:text-center whitespace-nowrap">
                    <span className="text-xs sm:text-lg font-serif font-black tracking-widest text-[#FCFBF7] leading-none uppercase block">
                      KHADIJAH-TUL-<span className="text-[#C5A059]">QUBRAH</span>
                    </span>
                    <span className="text-[9px] sm:text-xs block text-[#C5A059] font-serif font-bold tracking-[0.2em] uppercase mt-0.5">
                      by Meer&amp;Mus
                    </span>
                  </div>
                </div>

                {/* Centered Slogan */}
                <span className="hidden sm:block text-[8px] sm:text-[9px] font-mono font-bold tracking-[0.35em] uppercase text-[#dfbc7a] mt-1 whitespace-nowrap">
                  STAY HONEST , STAND LONG
                </span>
              </Link>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* 3. RIGHT WING: Bespoke Studio, Portals Switcher, Account & Cart */}
            {/* ------------------------------------------------------------------- */}
            <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-end min-w-0">
              {/* "Create Your Own" Custom Order CTA */}
              <button
                onClick={onOpenBespoke}
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C5A059]/20 to-[#dfbc7a]/20 border border-[#C5A059]/50 text-[#C5A059] hover:bg-[#C5A059] hover:text-[#051712] font-serif font-bold text-xs uppercase tracking-wider transition-all shadow-md group shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059] group-hover:text-[#051712] transition-colors" />
                <span>Create Your Own</span>
              </button>

              {/* Customer Account */}
              {isAuthenticated && user ? (
                <div className="relative shrink-0">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 bg-[#051712] border border-[#C5A059]/40 hover:border-[#C5A059] px-2 py-1.5 sm:px-2.5 rounded-xl transition-all"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#C5A059]/20 text-[#C5A059] font-bold text-[10px] flex items-center justify-center">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-xs font-serif font-bold text-[#FCFBF7] truncate max-w-[80px] hidden sm:block">
                      {user.name}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-[#072A20] border border-[#C5A059]/40 rounded-xl shadow-2xl p-2 z-50 animate-fadeIn text-xs">
                      <div className="px-3 py-2 border-b border-[#C5A059]/20">
                        <p className="font-serif font-bold text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-[#FCFBF7]/60 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold text-[#C5A059]">
                          {user.role === 'CUSTOMER' ? 'Private Client Account' : `Staff Clearance: ${user.role}`}
                        </span>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/order-tracking/ORD-2026-KTQ"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:text-[#C5A059] hover:bg-[#051712] rounded-lg transition-colors"
                        >
                          <Truck className="w-3.5 h-3.5 text-[#C5A059]" /> My Orders &amp; Tracking
                        </Link>
                        {user.role !== 'CUSTOMER' && (
                          <Link
                            href="/login"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:text-[#C5A059] hover:bg-[#051712] rounded-lg transition-colors"
                          >
                            <Crown className="w-3.5 h-3.5 text-[#C5A059]" /> Department Console
                          </Link>
                        )}
                      </div>
                      <div className="pt-1 border-t border-[#C5A059]/20">
                        <button
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                        >
                          <LogOut className="w-3.5 h-3.5 text-red-400" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/register"
                  className="hidden sm:flex px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C5A059] to-amber-600 hover:brightness-110 text-[#051712] font-serif font-black text-xs items-center gap-1.5 shadow-md shadow-[#C5A059]/20 transition-all uppercase tracking-wider"
                >
                  <User className="w-3.5 h-3.5 text-[#051712]" />
                  <span>Sign In / Register</span>
                </Link>
              )}

              {/* Shopping Cart Button */}
              {onOpenCart && (
                <button
                  onClick={onOpenCart}
                  className="relative bg-gradient-to-r from-[#C5A059] via-[#dfbc7a] to-amber-600 hover:brightness-110 text-[#051712] font-bold px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-[#C5A059]/20 active:scale-95 transition-all text-xs sm:text-sm"
                  title="Open Atelier Cart"
                >
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[#051712]" />
                  <span className="hidden sm:inline font-serif font-black tracking-wider uppercase">Bag</span>
                  {cartCount > 0 && (
                    <span className="w-5 h-5 bg-[#051712] text-[#C5A059] rounded-full text-[10px] font-bold flex items-center justify-center shadow">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE-OUT MENU DRAWER */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative w-4/5 max-w-sm bg-[#040e0b] border-r border-[#C5A059]/40 text-[#FCFBF7] p-6 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
            <div className="space-y-6">
              {/* Header inside Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-[#C5A059]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] via-[#F3E5AB] to-[#99752D] overflow-hidden">
                    <img src="/brand-logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-white uppercase">KHADIJAH-TUL-QUBRAH</h3>
                    <p className="text-[10px] text-[#C5A059] font-mono">STAY HONEST , STAND LONG</p>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active Branch Switcher */}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059] block mb-2 font-mono">
                  Store Branch
                </span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsBranchModalOpen(true);
                  }}
                  className="w-full p-3 rounded-xl bg-[#051712] border border-[#C5A059]/30 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#C5A059]" />
                    <div>
                      <p className="text-xs font-serif font-bold text-white">{activeBranch.name}</p>
                      <p className="text-[10px] text-gray-400">{activeBranch.city}</p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#C5A059]" />
                </button>
              </div>

              {/* Customer Navigation */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059] block mb-2 font-mono">
                  Main Menu
                </span>
                <a
                  href="#catalog"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#072A20] text-xs font-semibold"
                >
                  <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
                  <span>Shop Collection</span>
                </a>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenBespoke) onOpenBespoke();
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#072A20] text-xs font-semibold text-left"
                >
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  <span>Create Your Own Dress</span>
                </button>
                <Link
                  href="/order-tracking/ORD-2026-KTQ"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#072A20] text-xs font-semibold"
                >
                  <Truck className="w-4 h-4 text-[#C5A059]" />
                  <span>Track Order</span>
                </Link>
              </div>

              {/* Customer Account & Support */}
              <div className="space-y-1 pt-4 border-t border-[#C5A059]/20">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059] block mb-2 font-mono">
                  Customer Account
                </span>
                {isAuthenticated && user ? (
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-red-500/10 text-xs text-red-300 text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Sign Out ({user.name})</span>
                  </button>
                ) : (
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-[#C5A059]/20 to-amber-600/20 border border-[#C5A059]/50 text-xs font-bold text-[#C5A059]"
                  >
                    <User className="w-4 h-4 text-[#C5A059]" />
                    <span>Sign In / Register Customer</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Bottom Support */}
            <div className="pt-6 border-t border-[#C5A059]/20 space-y-2">
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow"
              >
                <Phone className="w-4 h-4" /> Chat on WhatsApp ({brandSettings.whatsappNumber})
              </a>
              {brandSettings.storeAddress && (
                <p className="text-[10px] text-gray-400 text-center font-mono">
                  {brandSettings.storeAddress}, {brandSettings.storeCity}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PERSISTENT MOBILE BOTTOM TAB NAVIGATION BAR (APP-LIKE UX) */}
      {/* ========================================================================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#040e0b]/95 backdrop-blur-lg border-t border-[#C5A059]/40 text-white py-1 px-3 flex justify-around items-center shadow-2xl safe-area-bottom">
        <Link
          href="/"
          className="flex flex-col items-center justify-center py-1 px-2 text-center text-[#C5A059] hover:text-white transition-colors min-w-[56px]"
        >
          <Sparkles className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-serif font-bold uppercase tracking-wider">Home</span>
        </Link>

        <a
          href="#catalog"
          className="flex flex-col items-center justify-center py-1 px-2 text-center text-gray-400 hover:text-[#C5A059] transition-colors min-w-[56px]"
        >
          <ShoppingBag className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-serif font-bold uppercase tracking-wider">Shop</span>
        </a>

        {/* Elevated Custom Dress CTA */}
        <button
          onClick={onOpenBespoke}
          className="flex flex-col items-center justify-center -mt-4 group min-w-[60px]"
          title="Create Your Own Custom Garment"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-r from-[#C5A059] via-[#dfbc7a] to-amber-600 text-[#051712] flex items-center justify-center shadow-xl shadow-[#C5A059]/30 ring-3 ring-[#040e0b] group-active:scale-95 transition-transform">
            <Scissors className="w-5 h-5 text-[#051712]" />
          </div>
          <span className="text-[9px] font-serif font-black uppercase text-[#C5A059] tracking-wider mt-0.5">Custom</span>
        </button>

        <Link
          href="/order-tracking/ORD-2026-KTQ"
          className="flex flex-col items-center justify-center py-1 px-2 text-center text-gray-400 hover:text-[#C5A059] transition-colors min-w-[56px]"
        >
          <Truck className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-serif font-bold uppercase tracking-wider">Track</span>
        </Link>

        {onOpenCart && (
          <button
            onClick={onOpenCart}
            className="flex flex-col items-center justify-center py-1 px-2 text-center text-gray-400 hover:text-[#C5A059] transition-colors relative min-w-[56px]"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 mb-0.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-[#C5A059] text-[#051712] rounded-full text-[9px] font-black flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[9px] font-serif font-bold uppercase tracking-wider">Bag</span>
          </button>
        )}
      </nav>


      {/* Atelier Selector Modal */}
      <BranchSelectorModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        activeBranch={activeBranch}
        onSelectBranch={(b) => {
          if (onSelectBranch) onSelectBranch(b);
          setIsBranchModalOpen(false);
        }}
      />
    </>
  );
};
