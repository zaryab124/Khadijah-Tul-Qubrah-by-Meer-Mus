'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  MapPin,
  Truck,
  Phone,
  Sparkles,
  Scissors,
  Palette,
  ShieldCheck,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Crown,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ATELIER_BRANCHES } from '@/components/BranchSelectorModal';

import { fetchOrdersFromSupabase } from '@/lib/supabase';

interface OrderTimelineEvent {
  status: string;
  title: string;
  description: string;
  timestamp: string;
  isCompleted: boolean;
  isActive: boolean;
  icon: any;
}

export default function OrderTrackingPage({
  params,
}: {
  params: { orderId: string } | Promise<{ orderId: string }>;
}) {
  const [orderId, setOrderId] = useState<string>('');
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchInput, setSearchInput] = useState<string>('');

  useEffect(() => {
    Promise.resolve(params).then((resolved) => {
      if (resolved?.orderId) {
        const decoded = decodeURIComponent(resolved.orderId);
        setOrderId(decoded);
        setSearchInput(decoded);
        loadOrder(decoded);
      } else {
        setLoading(false);
      }
    });
  }, [params]);

  const loadOrder = async (targetId: string) => {
    setLoading(true);
    let matched: any = null;

    // 1. Search localStorage real orders
    try {
      const local = localStorage.getItem('khadijah_real_orders');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          matched = parsed.find(
            (o: any) =>
              (o.order_number && o.order_number.toLowerCase() === targetId.toLowerCase()) ||
              (o.id && o.id.toLowerCase() === targetId.toLowerCase())
          );
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Search Supabase orders
    if (!matched) {
      try {
        const sbOrders = await fetchOrdersFromSupabase();
        if (sbOrders && Array.isArray(sbOrders)) {
          matched = sbOrders.find(
            (o: any) =>
              (o.order_number && o.order_number.toLowerCase() === targetId.toLowerCase()) ||
              (o.id && o.id.toLowerCase() === targetId.toLowerCase())
          );
        }
      } catch (e) {
        console.error(e);
      }
    }

    setOrderData(matched || null);
    setLoading(false);
  };

  // Build dynamic milestone timeline based on actual order status
  const currentStatus = (orderData?.status || 'SUBMITTED').toUpperCase();
  const timeline: OrderTimelineEvent[] = [
    {
      status: 'SUBMITTED',
      title: 'Order Placed & Confirmed',
      description: 'Your garment specifications and measurements have been registered at our atelier.',
      timestamp: orderData?.created_at ? new Date(orderData.created_at).toLocaleDateString() : 'Confirmed',
      isCompleted: true,
      isActive: currentStatus === 'PENDING' || currentStatus === 'SUBMITTED',
      icon: Clock,
    },
    {
      status: 'DESIGNER_REVIEW',
      title: 'Pattern Making & Fabric Allocation',
      description: 'Master artisan drafts pattern specifications according to requested measurements.',
      timestamp: ['CUTTING', 'STITCHING', 'CRAFTING', 'FINISHING', 'QUALITY_CHECK', 'READY', 'DELIVERED'].includes(currentStatus)
        ? 'Completed'
        : 'In Queue',
      isCompleted: ['CUTTING', 'STITCHING', 'CRAFTING', 'FINISHING', 'QUALITY_CHECK', 'READY', 'DELIVERED'].includes(currentStatus),
      isActive: currentStatus === 'DESIGNER_REVIEW',
      icon: Palette,
    },
    {
      status: 'WORKSHOP',
      title: 'Precision Tailoring & Handcrafting',
      description: 'Artisans hand-stitch the panels, execute delicate zardozi embroidery, and finish seams.',
      timestamp: ['CRAFTING', 'FINISHING', 'QUALITY_CHECK', 'READY', 'DELIVERED'].includes(currentStatus)
        ? 'Completed'
        : currentStatus === 'CUTTING' || currentStatus === 'STITCHING'
        ? 'Active on Cutting & Needle Floor'
        : 'Scheduled',
      isCompleted: ['FINISHING', 'QUALITY_CHECK', 'READY', 'DELIVERED'].includes(currentStatus),
      isActive: ['CUTTING', 'STITCHING', 'CRAFTING'].includes(currentStatus),
      icon: Scissors,
    },
    {
      status: 'QC_PASS',
      title: 'Master Quality Inspection',
      description: 'Rigorous inspection of all motifs, stitching tolerances, and silhouette fit.',
      timestamp: ['READY', 'DELIVERED'].includes(currentStatus) ? 'Passed Inspection' : 'Pending Finishing',
      isCompleted: ['READY', 'DELIVERED'].includes(currentStatus),
      isActive: currentStatus === 'QUALITY_CHECK' || currentStatus === 'FINISHING',
      icon: ShieldCheck,
    },
    {
      status: 'DISPATCH',
      title: 'Insured Delivery & Dispatch',
      description: 'Carefully wrapped in signature atelier dust cover and dispatched for doorstep delivery.',
      timestamp: currentStatus === 'DELIVERED' ? 'Delivered' : currentStatus === 'READY' ? 'Ready for Dispatch' : 'Estimated 7-10 Days',
      isCompleted: currentStatus === 'DELIVERED',
      isActive: currentStatus === 'READY',
      icon: Truck,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#051712] text-[#FCFBF7] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#C5A059] font-bold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin" /> Retrieving Atelier Tracking Log...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#051712] text-[#FCFBF7] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C5A059]/20 pb-6">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs text-[#C5A059] hover:underline mb-2 font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Shop
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] via-[#F3E5AB] to-[#99752D] ring-2 ring-[#C5A059]/40 shrink-0 shadow-lg">
                <img
                  src="/brand-logo.jpg"
                  alt="KHADIJAH-TUL-QUBRAH by Meer&Mus"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold tracking-[0.3em] uppercase text-[#F3E5AB] block mb-0.5">
                  STAY HONEST , STAND LONG
                </span>
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${orderData ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#FCFBF7]">
                    {orderData ? `Tracking Order #${orderData.order_number || orderId}` : `Order Lookup`}
                  </h1>
                </div>
                <p className="text-xs text-[#FCFBF7]/70 mt-0.5 font-light">
                  KHADIJAH-TUL-QUBRAH by Meer&amp;Mus &bull; Handcrafted Garment Delivery Status
                </p>
              </div>
            </div>
          </div>

          {orderData && (
            <div className="flex items-center gap-2 bg-[#072A20] px-4 py-2.5 rounded-2xl border border-[#C5A059]/30">
              <Crown className="w-4 h-4 text-[#C5A059]" />
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-[#C5A059] block font-mono">
                  Order Status
                </span>
                <span className="text-xs font-bold text-white uppercase">
                  {orderData.status || 'CONFIRMED'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* If Order Not Found: Show Clean Search Bar */}
        {!orderData ? (
          <div className="bg-[#072A20] rounded-3xl border border-[#C5A059]/30 p-8 sm:p-12 text-center space-y-5">
            <ShoppingBag className="w-12 h-12 text-[#C5A059] mx-auto opacity-70" />
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-xl font-serif font-bold text-white">Order #{orderId || '...'} Not Found</h2>
              <p className="text-xs text-gray-300">
                We could not locate this order record in our live database. Please verify your Order Number from your confirmation message.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchInput.trim()) {
                  setOrderId(searchInput.trim());
                  loadOrder(searchInput.trim());
                }
              }}
              className="max-w-md mx-auto flex gap-2"
            >
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Order # (e.g. ORD-2026-0001)"
                className="flex-1 bg-[#051712] border border-[#C5A059]/40 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#d4af37] text-[#072A20] rounded-xl text-xs font-bold transition shadow"
              >
                Track Order
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Status Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#072A20] p-5 rounded-2xl border border-[#C5A059]/30 space-y-1">
                <span className="text-[10px] text-[#C5A059] uppercase tracking-widest font-mono">
                  Branch Location
                </span>
                <p className="text-sm font-serif font-bold text-white">Main Boutique &amp; Workshop</p>
                <p className="text-xs text-white/60">Jampur, Punjab, Pakistan</p>
              </div>

              <div className="bg-[#072A20] p-5 rounded-2xl border border-[#C5A059]/30 space-y-1">
                <span className="text-[10px] text-[#C5A059] uppercase tracking-widest font-mono">
                  Patron &amp; Delivery Destination
                </span>
                <p className="text-sm font-serif font-bold text-white">{orderData.customer_name || 'Bespoke Client'}</p>
                <p className="text-xs text-white/60">{orderData.city || orderData.shipping_address || 'Pakistan'}</p>
              </div>

              <div className="bg-[#072A20] p-5 rounded-2xl border border-[#C5A059]/30 space-y-1">
                <span className="text-[10px] text-[#C5A059] uppercase tracking-widest font-mono">
                  Order Total
                </span>
                <p className="text-sm font-serif font-bold text-[#C5A059]">
                  PKR {Number(orderData.total_amount || 0).toLocaleString()}
                </p>
                <p className="text-xs text-white/60">{orderData.items?.length || 1} handcrafted item(s)</p>
              </div>
            </div>

            {/* Milestone Timeline */}
            <div className="bg-[#072A20] rounded-3xl border border-[#C5A059]/30 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#C5A059]/20 pb-4">
                <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C5A059]" /> Production Progress
                </h2>
                <span className="text-xs bg-[#C5A059]/20 text-[#C5A059] px-3 py-1 rounded-full border border-[#C5A059]/40 font-semibold font-mono">
                  Status: {currentStatus}
                </span>
              </div>

              <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#C5A059]/30">
                {timeline.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div key={idx} className="relative flex items-start gap-4">
                      {/* Dot / Icon */}
                      <div
                        className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                          step.isCompleted
                            ? 'bg-[#C5A059] text-[#051712] shadow-md shadow-[#C5A059]/30'
                            : step.isActive
                            ? 'bg-emerald-500 text-white animate-pulse shadow-md shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                            : 'bg-[#051712] border border-[#C5A059]/30 text-white/30'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h3
                            className={`text-sm font-serif font-bold ${
                              step.isActive
                                ? 'text-emerald-400'
                                : step.isCompleted
                                ? 'text-white'
                                : 'text-white/40'
                            }`}
                          >
                            {step.title}
                          </h3>
                          <span className="text-[11px] text-[#C5A059] font-mono">{step.timestamp}</span>
                        </div>
                        <p className="text-xs text-white/70 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary & Customer Support Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Real Order Snapshot */}
              <div className="bg-[#072A20] rounded-2xl border border-[#C5A059]/30 p-6 space-y-4">
                <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#C5A059]" /> Dress Order Details
                </h3>
                <div className="divide-y divide-[#C5A059]/10 text-xs">
                  {orderData.items && orderData.items.length > 0 ? (
                    orderData.items.map((item: any, i: number) => (
                      <div key={i} className="py-2.5 space-y-1">
                        <div className="flex justify-between font-serif font-bold text-white">
                          <span>{item.product_name || item.name || 'Bespoke Garment'}</span>
                          <span className="font-mono text-[#C5A059]">PKR {Number(item.price || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-white/60">
                          <span>Stitching / Finish:</span>
                          <span className="text-emerald-400 font-medium">{item.stitching_option || item.stitchingType || 'STITCHED'}</span>
                        </div>
                        {item.size && (
                          <div className="flex justify-between text-white/60">
                            <span>Size:</span>
                            <span className="text-white font-mono">{item.size}</span>
                          </div>
                        )}
                        {item.fabric && (
                          <div className="flex justify-between text-white/60">
                            <span>Fabric:</span>
                            <span className="text-white">{item.fabric}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-2.5 flex justify-between">
                      <span className="text-white/60">Garment</span>
                      <span className="font-serif font-bold text-white">Handcrafted Bespoke Ensemble</span>
                    </div>
                  )}
                  <div className="py-2.5 flex justify-between font-bold pt-3">
                    <span className="text-white">Total Paid / Payable</span>
                    <span className="text-[#C5A059] font-mono">
                      PKR {Number(orderData.total_amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Support */}
              <div className="bg-[#072A20] rounded-2xl border border-[#C5A059]/30 p-6 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#C5A059]" /> Customer Support &amp; Help
                  </h3>
                  <p className="text-xs text-white/70 mt-2 leading-relaxed">
                    Need to change your delivery address, request rush delivery, or book a private fitting consultation at our Jampur studio? Our concierge is available 24/7.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#C5A059]/20">
                  <a
                    href={`https://wa.me/923002345678?text=${encodeURIComponent(
                      `Salam, I am checking the status of my order #${orderData.order_number || orderId} on KHADIJAH-TUL-QUBRAH by Meer&Mus.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow transition-all"
                  >
                    <Phone className="w-4 h-4" /> Chat with Concierge on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
