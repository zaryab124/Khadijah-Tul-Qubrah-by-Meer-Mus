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
            <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-start">
              {/* Mobile Drawer Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-[#051712] border border-[#C5A059]/40 text-[#C5A059] hover:text-white"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Store Location Pill (Jampur, Pakistan) */}
              {activeBranch && (
                <button
                  onClick={() => setIsBranchModalOpen(true)}
                  className="flex items-center gap-2 bg-[#051712] hover:bg-[#072A20] border border-[#C5A059]/30 hover:border-[#C5A059] px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-full transition-all text-left shadow-sm group"
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
                    <span className="text-[11px] font-serif font-bold text-white">Jampur, PK</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#C5A059]/60 ml-0.5" />
                </button>
              )}

              {/* Desktop Quick Nav Links */}
              <nav className="hidden lg:flex items-center gap-4 text-xs font-serif tracking-wider uppercase ml-2 text-white/80">
                <a href="#catalog" className="hover:text-[#C5A059] transition-colors py-1">
                  Shop Collection
                </a>
                <Link href="/order-tracking/ORD-2026-KTQ" className="hover:text-[#C5A059] transition-colors py-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#C5A059]" /> Track Order
                </Link>
              </nav>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* 2. CENTERPIECE: Perfectly Centered Brand Insignia & Slogan */}
            {/* ------------------------------------------------------------------- */}
            <div className="flex flex-col items-center justify-center flex-shrink-0 text-center px-2">
              <Link href="/" className="flex flex-col items-center group">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Real Royal Velvet Insignia Medallion */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] via-[#F3E5AB] to-[#99752D] ring-2 ring-[#C5A059]/50 shadow-lg shadow-[#C5A059]/20 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                    <img
                      src="/brand-logo.jpg"
                      alt="KHADIJAH-TUL-QUBRAH by Meer&Mus"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>

                  <div className="text-left sm:text-center">
                    <span className="text-sm sm:text-lg font-serif font-black tracking-widest text-[#FCFBF7] leading-none uppercase block">
                      KHADIJAH-TUL-<span className="text-[#C5A059]">QUBRAH</span>
                    </span>
                    <span className="text-[10px] sm:text-xs block text-[#C5A059] font-serif font-bold tracking-[0.2em] uppercase mt-0.5">
                      by Meer&amp;Mus
                    </span>
                  </div>
                </div>

                {/* Centered Slogan */}
                <span className="hidden sm:block text-[8px] sm:text-[9px] font-mono font-bold tracking-[0.35em] uppercase text-[#dfbc7a] mt-1">
                  STAY HONEST , STAND LONG
                </span>
              </Link>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* 3. RIGHT WING: Bespoke Studio, Portals Switcher, Account & Cart */}
            {/* ------------------------------------------------------------------- */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
              {/* "Create Your Own" Custom Order CTA */}
              <button
                onClick={onOpenBespoke}
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C5A059]/20 to-[#dfbc7a]/20 border border-[#C5A059]/50 text-[#C5A059] hover:bg-[#C5A059] hover:text-[#051712] font-serif font-bold text-xs uppercase tracking-wider transition-all shadow-md group"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059] group-hover:text-[#051712] transition-colors" />
                <span>Create Your Own</span>
              </button>

              {/* Department Portals Login Menu */}
              <div className="hidden xl:flex items-center gap-1 border-l border-r border-[#C5A059]/20 px-2.5">
                <Link
                  href="/admin/login"
                  className="px-2 py-1 rounded-lg text-[11px] font-medium text-[#FCFBF7]/70 hover:text-[#C5A059] hover:bg-[#072A20] flex items-center gap-1 transition-colors"
                  title="Admin Portal"
                >
                  <UserCheck className="w-3 h-3 text-[#C5A059]" /> Admin
                </Link>
                <Link
                  href="/designer/login"
                  className="px-2 py-1 rounded-lg text-[11px] font-medium text-[#FCFBF7]/70 hover:text-[#C5A059] hover:bg-[#072A20] flex items-center gap-1 transition-colors"
                  title="Designer Studio"
                >
                  <Palette className="w-3 h-3 text-[#E0A96D]" /> Designer
                </Link>
                <Link
                  href="/production/login"
                  className="px-2 py-1 rounded-lg text-[11px] font-medium text-[#FCFBF7]/70 hover:text-[#C5A059] hover:bg-[#072A20] flex items-center gap-1 transition-colors"
                  title="Workshop & QC"
                >
                  <Scissors className="w-3 h-3 text-[#10B981]" /> Workshop
                </Link>
                <Link
                  href="/agent/login"
                  className="px-2 py-1 rounded-lg text-[11px] font-medium text-[#FCFBF7]/70 hover:text-[#C5A059] hover:bg-[#072A20] flex items-center gap-1 transition-colors"
                  title="VIP Concierge CRM"
                >
                  <Headphones className="w-3 h-3 text-[#38BDF8]" /> Agent
                </Link>
                <Link
                  href="/login"
                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-[#C5A059] bg-[#C5A059]/15 hover:bg-[#C5A059]/25 border border-[#C5A059]/40 flex items-center gap-1 transition-colors"
                  title="Central Gateway"
                >
                  <Lock className="w-3 h-3" /> Staff
                </Link>
              </div>

              {/* VIP Client Account */}
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 bg-[#051712] border border-[#C5A059]/40 hover:border-[#C5A059] px-2.5 py-1.5 rounded-xl transition-all"
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
                          Role: {user.role}
                        </span>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/login"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:text-[#C5A059] hover:bg-[#051712] rounded-lg transition-colors"
                        >
                          <Crown className="w-3.5 h-3.5 text-[#C5A059]" /> Switch Role Portal
                        </Link>
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
                  href="/login"
                  className="hidden sm:flex px-3 py-2 rounded-xl bg-[#051712] hover:bg-[#072A20] text-gray-300 hover:text-white font-bold text-xs items-center gap-1.5 border border-[#C5A059]/30 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Account</span>
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

              {/* Staff Department Portals */}
              <div className="space-y-1 pt-4 border-t border-[#C5A059]/20">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059] block mb-2 font-mono">
                  Staff Logins
                </span>
                <Link
                  href="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#072A20] text-xs"
                >
                  <Crown className="w-4 h-4 text-[#C5A059]" />
                  <span>Owner &amp; Admin</span>
                </Link>
                <Link
                  href="/designer/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#072A20] text-xs"
                >
                  <Palette className="w-4 h-4 text-[#E0A96D]" />
                  <span>Designer Studio</span>
                </Link>
                <Link
                  href="/production/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#072A20] text-xs"
                >
                  <Scissors className="w-4 h-4 text-[#10B981]" />
                  <span>Workshop &amp; Quality Check</span>
                </Link>
                <Link
                  href="/agent/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#072A20] text-xs"
                >
                  <Headphones className="w-4 h-4 text-[#38BDF8]" />
                  <span>Customer Support &amp; CRM</span>
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/40 text-xs text-[#C5A059] font-bold"
                >
                  <Lock className="w-4 h-4" />
                  <span>All Staff Logins</span>
                </Link>
              </div>
            </div>

            {/* Bottom Support */}
            <div className="pt-6 border-t border-[#C5A059]/20">
              <a
                href="https://wa.me/923000000000"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow"
              >
                <Phone className="w-4 h-4" /> Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PERSISTENT MOBILE BOTTOM TAB NAVIGATION BAR (APP-LIKE UX) */}
      {/* ========================================================================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#040e0b]/95 backdrop-blur-lg border-t border-[#C5A059]/30 text-white py-1.5 px-2 flex justify-around items-center shadow-2xl">
        <Link
          href="/"
          className="flex flex-col items-center gap-1 py-1 px-2 text-center text-[#C5A059] hover:text-white"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[9px] font-serif font-bold uppercase">Home</span>
        </Link>

        <a
          href="#catalog"
          className="flex flex-col items-center gap-1 py-1 px-2 text-center text-gray-400 hover:text-[#C5A059]"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-[9px] font-serif font-bold uppercase">Shop</span>
        </a>

        <button
          onClick={onOpenBespoke}
          className="flex flex-col items-center gap-1 py-1 px-2 text-center text-[#C5A059] hover:scale-105 transition-transform"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#C5A059] to-amber-600 text-[#051712] flex items-center justify-center shadow-lg -mt-3 ring-2 ring-[#040e0b]">
            <Scissors className="w-4 h-4 text-[#051712]" />
          </div>
          <span className="text-[9px] font-serif font-black uppercase text-[#C5A059]">Custom</span>
        </button>

        <Link
          href="/order-tracking/ORD-2026-KTQ"
          className="flex flex-col items-center gap-1 py-1 px-2 text-center text-gray-400 hover:text-[#C5A059]"
        >
          <Truck className="w-4 h-4" />
          <span className="text-[9px] font-serif font-bold uppercase">Track</span>
        </Link>

        <Link
          href="/login"
          className="flex flex-col items-center gap-1 py-1 px-2 text-center text-gray-400 hover:text-[#C5A059]"
        >
          <Crown className="w-4 h-4" />
          <span className="text-[9px] font-serif font-bold uppercase">Staff</span>
        </Link>

        {onOpenCart && (
          <button
            onClick={onOpenCart}
            className="flex flex-col items-center gap-1 py-1 px-2 text-center text-gray-400 hover:text-[#C5A059] relative"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[9px] font-serif font-bold uppercase">Bag</span>
            {cartCount > 0 && (
              <span className="absolute top-0 right-1 w-4 h-4 bg-[#C5A059] text-[#051712] rounded-full text-[9px] font-black flex items-center justify-center">
                {cartCount}
              </span>
            )}
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
