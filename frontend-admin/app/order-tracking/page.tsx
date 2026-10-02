'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Truck,
  Phone,
  Search,
  CheckCircle2,
  Clock,
  Scissors,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { fetchOrdersFromSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function OrderTrackingLookupPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    // Load customer's real orders from local storage
    try {
      const stored = localStorage.getItem('khadijah_real_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentOrders(parsed);
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);

    // Navigate to order details
    router.push(`/order-tracking/${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-[#051712] text-[#FCFBF7] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-28 lg:py-10 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="border-b border-[#C5A059]/20 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-[#C5A059] hover:underline mb-2 font-serif uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Boutique Collection
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#072A20] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shadow-lg shrink-0">
              <Truck className="w-5 h-5 text-[#C5A059]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#FCFBF7]">
                Track Your Garment Order
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                KHADIJAH-TUL-QUBRAH by Meer&amp;Mus &bull; Real-time atelier craftsmanship &amp; dispatch tracking
              </p>
            </div>
          </div>
        </div>

        {/* Main Search Box */}
        <div className="bg-[#072A20] rounded-3xl border border-[#C5A059]/40 p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="max-w-xl mx-auto text-center space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C5A059] block">
              STAY HONEST , STAND LONG
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
              Order Status &amp; Milestone Lookup
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Enter your Order Number from your confirmation message or receipt to verify live cutting, artisan handwork, and shipment dispatch.
            </p>
          </div>

          <form onSubmit={handleTrackSubmit} className="max-w-lg mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Order # (e.g. KTQ-ORD-1001)"
                className="w-full bg-[#051712] border border-[#C5A059]/50 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A059] shadow-inner font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-3 bg-[#C5A059] hover:bg-[#d4af37] text-[#051712] rounded-xl text-xs sm:text-sm font-serif font-bold uppercase tracking-wider transition shadow-lg shrink-0 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Track Order</span>
            </button>
          </form>

          {searchError && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center font-mono max-w-lg mx-auto">
              {searchError}
            </div>
          )}

          {/* Need Assistance Bar */}
          <div className="pt-4 border-t border-[#C5A059]/20 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#C5A059]" /> Flagship Lahore Boutique Concierge
            </span>
            <a
              href="https://wa.me/923359301919?text=Assalam-o-Alaikum%20Khadijah-Tul-Qubrah%20Boutique%2C%20I%20would%20like%20to%20inquire%20about%20my%20order."
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 fill-emerald-400" /> WhatsApp Direct (+92 335 9301919)
            </a>
          </div>
        </div>

        {/* Recent Client Orders (if customer placed orders on this device) */}
        {recentOrders.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#FCFBF7] flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#C5A059]" /> Your Recent Orders
              </h3>
              <span className="text-xs text-gray-400 font-mono">
                {recentOrders.length} {recentOrders.length === 1 ? 'Order' : 'Orders'} Recorded
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentOrders.map((ord: any) => (
                <Link
                  key={ord.id || ord.order_number}
                  href={`/order-tracking/${encodeURIComponent(ord.order_number || ord.id)}`}
                  className="p-5 rounded-2xl bg-[#072A20] border border-[#C5A059]/30 hover:border-[#C5A059] transition-all group shadow-lg flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#C5A059] text-sm group-hover:underline">
                        #{ord.order_number || ord.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {ord.status || 'CONFIRMED'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300">
                      Client: {ord.customer_name || 'Boutique Client'}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono">
                      Total: PKR {(ord.total_amount || 0).toLocaleString()} &bull; {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#C5A059] group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
