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
  const [orderId, setOrderId] = useState<string>('ORD-2026-KTQ');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    Promise.resolve(params).then((resolved) => {
      if (resolved?.orderId) {
        setOrderId(resolved.orderId);
      }
    });
  }, [params]);

  // Order Progress Steps
  const timeline: OrderTimelineEvent[] = [
    {
      status: 'SUBMITTED',
      title: 'Order Placed',
      description: 'Your custom dress order and measurements have been received.',
      timestamp: 'Today, 11:30 AM',
      isCompleted: true,
      isActive: false,
      icon: Clock,
    },
    {
      status: 'DESIGNER_REVIEW',
      title: 'Designer Review & Pattern Making',
      description: 'Our lead designer reviewed your measurements and prepared the dress pattern.',
      timestamp: 'Today, 01:15 PM',
      isCompleted: true,
      isActive: false,
      icon: Palette,
    },
    {
      status: 'WORKSHOP',
      title: 'Hand Embroidery & Tailoring',
      description: 'Our master artisans are working on cutting the fabric and hand-embroidering the dress.',
      timestamp: 'In Progress (Expected 7 days)',
      isCompleted: false,
      isActive: true,
      icon: Scissors,
    },
    {
      status: 'QC_PASS',
      title: 'Quality Check',
      description: 'Checking all measurements, stitching, and embroidery details for quality.',
      timestamp: 'Pending Handwork Completion',
      isCompleted: false,
      isActive: false,
      icon: ShieldCheck,
    },
    {
      status: 'DISPATCH',
      title: 'Packing & Delivery',
      description: 'Carefully packed and dispatched for delivery to your doorstep.',
      timestamp: 'Estimated Delivery in 10-12 Days',
      isCompleted: false,
      isActive: false,
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
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#FCFBF7]">
                    Tracking Order #{orderId}
                  </h1>
                </div>
                <p className="text-xs text-[#FCFBF7]/70 mt-0.5 font-light">
                  KHADIJAH-TUL-QUBRAH by Meer&amp;Mus &bull; Handcrafted Garment Delivery Status
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#072A20] px-4 py-2.5 rounded-2xl border border-[#C5A059]/30">
            <Crown className="w-4 h-4 text-[#C5A059]" />
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#C5A059] block font-mono">
                Order Status
              </span>
              <span className="text-xs font-bold text-white uppercase">
                IN PRODUCTION
              </span>
            </div>
          </div>
        </div>

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
              Lead Designer
            </span>
            <p className="text-sm font-serif font-bold text-white">Ustad Meer Alam</p>
            <p className="text-xs text-white/60">Pattern & Embroidery Master</p>
          </div>

          <div className="bg-[#072A20] p-5 rounded-2xl border border-[#C5A059]/30 space-y-1">
            <span className="text-[10px] text-[#C5A059] uppercase tracking-widest font-mono">
              Estimated Delivery
            </span>
            <p className="text-sm font-serif font-bold text-[#C5A059]">7 Working Days</p>
            <p className="text-xs text-white/60">Finishing touches & quality check</p>
          </div>
        </div>

        {/* Milestone Timeline */}
        <div className="bg-[#072A20] rounded-3xl border border-[#C5A059]/30 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#C5A059]/20 pb-4">
            <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C5A059]" /> Production Progress
            </h2>
            <span className="text-xs bg-[#C5A059]/20 text-[#C5A059] px-3 py-1 rounded-full border border-[#C5A059]/40 font-semibold font-mono">
              Step 3 of 5
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
          {/* Order Snapshot */}
          <div className="bg-[#072A20] rounded-2xl border border-[#C5A059]/30 p-6 space-y-4">
            <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#C5A059]" /> Dress Order Details
            </h3>
            <div className="divide-y divide-[#C5A059]/10 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-white/60">Dress Name</span>
                <span className="font-serif font-bold text-white">The Emerald Zardozi Peshwas</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-white/60">Item Code</span>
                <span className="font-mono text-[#C5A059]">KTQ-PESH-001</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-white/60">Fabric</span>
                <span className="text-white">Micro Velvet 9000 & Silk</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-white/60">Size & Measurements</span>
                <span className="text-white font-mono">Custom Fit (Chest: 36&quot;, Waist: 28&quot;, Length: 56&quot;)</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-white/60">Packaging</span>
                <span className="text-emerald-400 font-medium">Standard Protective Packaging</span>
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
                Need to change your measurements, request faster delivery, or visit our shop for a trial fitting? We are always here to help you.
              </p>
            </div>

            <div className="pt-4 border-t border-[#C5A059]/20">
              <a
                href="https://wa.me/923000000000"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow transition-all"
              >
                <Phone className="w-4 h-4" /> Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
