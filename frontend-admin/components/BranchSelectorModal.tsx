'use client';

import React from 'react';
import { MapPin, X, Check, Globe, Sparkles } from 'lucide-react';

export interface AtelierBranch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  isFlagship?: boolean;
  capabilities: {
    bespoke_fittings: boolean;
    ready_to_wear: boolean;
    international_shipping: boolean;
  };
}

export const ATELIER_BRANCHES: AtelierBranch[] = [
  {
    id: 'b-jampur',
    name: 'Main Boutique & Workshop',
    city: 'Jampur, Pakistan',
    address: 'Circular Road, Jampur, District Rajanpur, Punjab, Pakistan',
    phone: '+92 300 0000000',
    isFlagship: true,
    capabilities: {
      bespoke_fittings: true,
      ready_to_wear: true,
      international_shipping: true,
    },
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeBranch: AtelierBranch;
  onSelectBranch: (branch: AtelierBranch) => void;
}

export const BranchSelectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeBranch,
  onSelectBranch,
}) => {
  if (!isOpen) return null;

  const branch = ATELIER_BRANCHES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#051712] border border-[#C5A059]/40 p-6 sm:p-8 shadow-2xl text-[#FCFBF7] space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#C5A059]/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">Our Store Location</h3>
              <p className="text-xs text-[#FCFBF7]/60">Sole Official Branch in Jampur, Pakistan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#072A20] hover:bg-[#0b3d2e] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Branch Info Card */}
        <div className="p-5 rounded-2xl border border-[#C5A059] bg-[#072A20] shadow-xl space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base text-white">{branch.name}</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#C5A059] text-[#051712] uppercase tracking-wider">
                  Main Branch
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">{branch.address}</p>
              <div className="flex items-center gap-2 pt-2 text-xs text-[#C5A059] font-medium">
                <MapPin className="w-3.5 h-3.5" />
                <span>Jampur, Punjab, Pakistan</span>
              </div>
            </div>

            <div className="w-7 h-7 rounded-full bg-[#C5A059] text-[#051712] flex items-center justify-center font-bold shrink-0">
              <Check className="w-4 h-4" />
            </div>
          </div>

          <div className="pt-3 border-t border-[#C5A059]/20 grid grid-cols-2 gap-2 text-[11px] text-gray-300">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Check className="w-3.5 h-3.5" /> In-Store Trial Fittings
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Check className="w-3.5 h-3.5" /> Ready-to-Wear Clothes
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Check className="w-3.5 h-3.5" /> Custom Tailoring
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Check className="w-3.5 h-3.5" /> Worldwide &amp; Nationwide Delivery
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#051712] border border-[#C5A059]/30 text-xs text-gray-300 space-y-1">
          <p className="font-semibold text-[#C5A059]">Visiting Our Boutique:</p>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            You are warmly welcome to visit our boutique in Jampur for bridal measurements and fittings. We also deliver all orders safely to your doorstep anywhere in Pakistan and internationally.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#d4af37] text-[#051712] font-bold text-xs uppercase tracking-wider transition-colors shadow"
        >
          Confirm Location (Jampur)
        </button>
      </div>
    </div>
  );
};
