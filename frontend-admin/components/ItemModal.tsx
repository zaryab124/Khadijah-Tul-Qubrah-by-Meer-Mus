'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  Check,
  Ruler,
  Info,
  ShieldCheck,
  Scissors,
  PackageCheck,
  Clock,
  CheckCircle2,
  Lock,
  User,
} from 'lucide-react';
import { CartGarmentItem } from './CartDrawer';
import { useAuth } from '../lib/auth-context';

export interface GarmentProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  basePrice?: number;
  stitchedPrice: number;
  unstitchedPrice: number;
  fabric: string;
  craft: string;
  imageUrl: string;
  gallery?: string[];
  description: string;
  turnaroundDays?: string;
  isAvailable?: boolean;
}

interface Props {
  item: GarmentProduct | null;
  onClose: () => void;
  onAddToCart: (item: CartGarmentItem) => void;
}

export const ItemModal: React.FC<Props> = ({ item, onClose, onAddToCart }) => {
  const { isAuthenticated } = useAuth();
  const [stitchingOption, setStitchingOption] = useState<'STITCHED' | 'UNSTITCHED'>('STITCHED');
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeGuide, setShowSizeGuide] = useState<boolean>(false);

  if (!item) return null;

  // Determine current active prices
  const currentStitchedPrice = item.stitchedPrice || item.basePrice || 12500;
  const currentUnstitchedPrice = item.unstitchedPrice || Math.round(currentStitchedPrice * 0.72);
  const unitPrice = stitchingOption === 'STITCHED' ? currentStitchedPrice : currentUnstitchedPrice;
  const totalPrice = unitPrice * quantity;

  const currentFabric = item.fabric || item.category;
  const currentCraft = item.craft || 'Artisan Handcrafted';

  const sizes = [
    { label: 'XS', bust: '32"', waist: '26"', hip: '36"' },
    { label: 'S', bust: '34"', waist: '28"', hip: '38"' },
    { label: 'M', bust: '36"', waist: '30"', hip: '40"' },
    { label: 'L', bust: '38"', waist: '33"', hip: '43"' },
    { label: 'XL', bust: '41"', waist: '36"', hip: '46"' },
    { label: 'XXL', bust: '44"', waist: '39"', hip: '49"' },
    { label: 'Custom Fit', bust: 'Bespoke', waist: 'Bespoke', hip: 'Bespoke' },
  ];

  const handleAdd = () => {
    onAddToCart({
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category,
      basePrice: unitPrice,
      stitchingOption,
      stitchedPrice: currentStitchedPrice,
      unstitchedPrice: currentUnstitchedPrice,
      imageUrl: item.imageUrl,
      size: stitchingOption === 'STITCHED' ? selectedSize : 'Unstitched Fabric (3-Piece)',
      fabric: currentFabric,
      craft: currentCraft,
      quantity,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#051712] border border-[#C5A059]/40 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl text-[#FCFBF7] max-h-[90dvh] sm:max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[#040e0b]/80 border border-[#C5A059]/30 text-gray-400 hover:text-white flex items-center justify-center transition-colors shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1">
          {/* Header Image Gallery */}
          <div className="relative h-64 sm:h-72 w-full bg-[#040e0b]">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#051712] via-[#051712]/30 to-transparent flex flex-col justify-end p-6">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-[#C5A059] text-[#051712] px-2.5 py-0.5 rounded-full w-fit">
                {item.category}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-1.5">
                {item.name}
              </h2>
              <p className="text-xs text-[#C5A059] font-mono mt-0.5">
                SKU: {item.sku} &bull; {stitchingOption === 'STITCHED' ? `Tailored in ${item.turnaroundDays || '14 - 28 Days'}` : 'Unstitched: Ready to Dispatch (2-3 Days)'}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
              {item.description}
            </p>

            {/* ================================================================= */}
            {/* STITCHING VS NON-STITCHING TOGGLE (PRIMARY WORKFLOW REQUIREMENT) */}
            {/* ================================================================= */}
            <div className="p-4 rounded-2xl bg-[#072A20] border-2 border-[#C5A059]/60 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-serif font-bold text-[#C5A059] tracking-wider flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-[#C5A059]" /> Select Stitching Preference
                </span>
                <span className="text-[11px] text-gray-400 font-mono">
                  {stitchingOption === 'STITCHED' ? 'Complete Tailored Garment' : 'Unstitched Fabric Package'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Stitched */}
                <button
                  type="button"
                  onClick={() => setStitchingOption('STITCHED')}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    stitchingOption === 'STITCHED'
                      ? 'bg-[#051712] border-[#C5A059] ring-2 ring-[#C5A059]/50 shadow-lg'
                      : 'bg-[#051712]/50 border-gray-800 hover:border-[#C5A059]/40 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-serif font-bold text-white flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-[#C5A059]" /> Stitched (Ready to Wear)
                    </span>
                    {stitchingOption === 'STITCHED' && (
                      <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-tight">
                    Custom fitted or Standard (XS-XXL). Pure lining &amp; hand-finishing included.
                  </p>
                  <div className="mt-2 text-sm font-bold text-[#C5A059] font-mono">
                    PKR {currentStitchedPrice.toLocaleString()}
                  </div>
                </button>

                {/* Option 2: Non-Stitching (Unstitched) */}
                <button
                  type="button"
                  onClick={() => setStitchingOption('UNSTITCHED')}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    stitchingOption === 'UNSTITCHED'
                      ? 'bg-[#051712] border-[#C5A059] ring-2 ring-[#C5A059]/50 shadow-lg'
                      : 'bg-[#051712]/50 border-gray-800 hover:border-[#C5A059]/40 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-serif font-bold text-white flex items-center gap-1.5">
                      <PackageCheck className="w-3.5 h-3.5 text-amber-400" /> Non-Stitching (Unstitched)
                    </span>
                    {stitchingOption === 'UNSTITCHED' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-tight">
                    Full fabric yardage, embroidered borders &amp; dupatta. Fast 2-day dispatch.
                  </p>
                  <div className="mt-2 text-sm font-bold text-amber-400 font-mono flex items-center gap-2">
                    <span>PKR {currentUnstitchedPrice.toLocaleString()}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-sans font-bold">
                      SAVE PKR {(currentStitchedPrice - currentUnstitchedPrice).toLocaleString()}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Sizing Selection (Active only when Stitched is selected) */}
            {stitchingOption === 'STITCHED' ? (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase font-serif font-bold text-[#C5A059] tracking-wider flex items-center gap-1.5">
                    <Ruler className="w-4 h-4" /> 1. Choose Size
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide(!showSizeGuide)}
                    className="text-xs text-[#C5A059] hover:underline flex items-center gap-1 font-serif"
                  >
                    <Info className="w-3.5 h-3.5" /> {showSizeGuide ? 'Hide Size Chart' : 'View Size Chart (Inches)'}
                  </button>
                </div>

                {/* Size Matrix Table if Toggled */}
                {showSizeGuide && (
                  <div className="p-3 bg-[#072A20] rounded-xl border border-[#C5A059]/30 text-xs animate-fadeIn overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#C5A059]/20 text-[#C5A059] font-mono text-[11px]">
                          <th className="py-1.5 px-2">Size</th>
                          <th className="py-1.5 px-2">Bust</th>
                          <th className="py-1.5 px-2">Waist</th>
                          <th className="py-1.5 px-2">Hips</th>
                          <th className="py-1.5 px-2">Shirt Length</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#C5A059]/10 text-gray-300 font-mono text-[11px]">
                        <tr><td className="py-1 px-2 font-bold text-white">XS</td><td className="py-1 px-2">32"</td><td className="py-1 px-2">26"</td><td className="py-1 px-2">36"</td><td className="py-1 px-2">48"</td></tr>
                        <tr><td className="py-1 px-2 font-bold text-white">S</td><td className="py-1 px-2">34"</td><td className="py-1 px-2">28"</td><td className="py-1 px-2">38"</td><td className="py-1 px-2">50"</td></tr>
                        <tr><td className="py-1 px-2 font-bold text-white">M</td><td className="py-1 px-2">36"</td><td className="py-1 px-2">30"</td><td className="py-1 px-2">40"</td><td className="py-1 px-2">52"</td></tr>
                        <tr><td className="py-1 px-2 font-bold text-white">L</td><td className="py-1 px-2">38"</td><td className="py-1 px-2">33"</td><td className="py-1 px-2">43"</td><td className="py-1 px-2">54"</td></tr>
                        <tr><td className="py-1 px-2 font-bold text-white">XL</td><td className="py-1 px-2">41"</td><td className="py-1 px-2">36"</td><td className="py-1 px-2">46"</td><td className="py-1 px-2">55"</td></tr>
                        <tr><td className="py-1 px-2 font-bold text-white">XXL</td><td className="py-1 px-2">44"</td><td className="py-1 px-2">39"</td><td className="py-1 px-2">49"</td><td className="py-1 px-2">55"</td></tr>
                        <tr><td className="py-1 px-2 font-bold text-white">Custom</td><td className="py-1 px-2" colSpan={4}>Custom fitted to your exact size</td></tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Sizing Chips */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {sizes.map((s) => {
                    const isSelected = selectedSize === s.label;
                    return (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setSelectedSize(s.label)}
                        className={`py-2 px-2 rounded-xl text-xs font-serif font-bold text-center border transition-all ${
                          isSelected
                            ? 'bg-[#C5A059] text-[#051712] border-[#C5A059] shadow-lg shadow-[#C5A059]/20 scale-105'
                            : 'bg-[#072A20] text-gray-300 border-[#C5A059]/20 hover:border-[#C5A059]/60 hover:text-white'
                        }`}
                      >
                        <div>{s.label}</div>
                        <span className="text-[9px] block font-mono font-normal opacity-75">{s.bust}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#051712] border border-amber-500/30 flex items-center gap-3 animate-fadeIn">
                <PackageCheck className="w-6 h-6 text-amber-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-serif font-bold text-white block">Standard 3-Piece Unstitched Package</span>
                  <p className="text-gray-400 text-[11px]">
                    No sizing needed. Package includes generous fabric yardage for shirt, trousers, inner slip, and finished pure dupatta with organza motifs.
                  </p>
                </div>
              </div>
            )}

            {/* Atelier Verified Specifications (Added Exclusively by Admin) */}
            <div className="p-4 rounded-2xl bg-[#072A20]/80 border border-[#C5A059]/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-serif font-bold text-[#C5A059] tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#C5A059]" /> Authentic Garment Details
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  Verified Atelier Specification
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#051712] border border-[#C5A059]/20">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-serif">Fabric</span>
                  <span className="font-serif font-bold text-white text-sm mt-0.5 block">
                    {item.fabric || item.category}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#051712] border border-[#C5A059]/20">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-serif">Craft &amp; Embellishment</span>
                  <span className="font-serif font-bold text-white text-sm mt-0.5 block">
                    {item.craft || 'Artisan Handcrafted'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#051712] border border-[#C5A059]/20">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-serif">Package Type</span>
                  <span className="font-mono text-gray-200 text-xs mt-0.5 block">
                    {stitchingOption === 'STITCHED' ? 'Complete Tailored Garment' : '3-Piece Unstitched Suit'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#051712] border border-[#C5A059]/20">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-serif">Dispatch &amp; Delivery</span>
                  <span className="font-mono text-gray-200 text-xs mt-0.5 block">
                    {stitchingOption === 'STITCHED'
                      ? (item.turnaroundDays || 'Tailored in 14 - 21 Days')
                      : 'Ready to Dispatch (2-3 Days)'}
                  </span>
                </div>
              </div>

              {/* Inclusions & Buyer Notes from Admin */}
              {item.description && (
                <div className="pt-2.5 border-t border-[#C5A059]/20 text-xs text-gray-300 font-sans leading-relaxed">
                  <span className="text-[#C5A059] font-serif font-bold block mb-1">Garment Notes &amp; Specifications:</span>
                  <p>{item.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar with Quantity & Add to Cart */}
        <div className="p-4 sm:p-6 bg-[#072A20] border-t border-[#C5A059]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto gap-6">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase tracking-wider font-serif">
                <span>Total</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-[#051712] border border-[#C5A059]/30 text-[#C5A059]">
                  {stitchingOption}
                </span>
              </div>
              <span className="font-serif font-black text-xl text-[#C5A059] font-mono">
                PKR {totalPrice.toLocaleString()}
              </span>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center gap-2 bg-[#051712] rounded-xl p-1 border border-[#C5A059]/30">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#072A20]"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-mono font-bold text-sm">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#072A20]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="w-full sm:w-auto sm:max-w-xs flex-1 py-3.5 px-6 bg-gradient-to-r from-[#C5A059] via-[#dfbc7a] to-amber-600 text-[#051712] font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#C5A059]/20"
          >
            {isAuthenticated ? (
              <>
                <ShoppingBag className="w-4 h-4 text-[#051712]" />
                <span>Add to Bag ({stitchingOption === 'STITCHED' ? 'Stitched' : 'Unstitched'})</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-[#051712]" />
                <span>Sign In to Order ({stitchingOption === 'STITCHED' ? 'Stitched' : 'Unstitched'})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
