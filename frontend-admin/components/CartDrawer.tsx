'use client';

import React, { useState } from 'react';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, Sparkles, Tag, ShieldCheck } from 'lucide-react';

export interface CartGarmentItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  basePrice: number;
  imageUrl: string;
  size: string;
  fabric: string;
  craft: string;
  quantity: number;
  specialNotes?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: CartGarmentItem[];
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  activeBranchName?: string;
  onCheckoutSuccess?: () => void;
}

export const CartDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  activeBranchName = 'Main Boutique (Jampur, Pakistan)',
  onCheckoutSuccess,
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const rawSubtotal = items.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
  const discountAmount = Math.round((rawSubtotal * discountPercent) / 100);
  const finalTotal = Math.max(0, rawSubtotal - discountAmount);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoCode.trim().toUpperCase();
    if (cleanCode === 'SUMMER26') {
      setDiscountPercent(20);
      setPromoMessage('20% Summer Runway privilege applied!');
    } else if (cleanCode === 'ROYAL10') {
      setDiscountPercent(10);
      setPromoMessage('10% Royal patron privilege applied!');
    } else {
      setPromoMessage('Invalid or expired promo code.');
    }
  };

  const handleCheckout = () => {
    alert(`Commission Order confirmed for PKR ${finalTotal.toLocaleString()}! We have registered your handcrafted garments with ${activeBranchName}.`);
    onClearCart();
    if (onCheckoutSuccess) onCheckoutSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#051712] border-l border-[#C5A059]/40 text-[#FCFBF7] flex flex-col shadow-2xl">
          
          {/* Drawer Header */}
          <div className="p-6 bg-[#072A20] border-b border-[#C5A059]/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Your Shopping Bag</h3>
                <p className="text-xs text-[#FCFBF7]/60">
                  {activeBranchName} &bull; Fast Delivery
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#051712] hover:bg-[#0b3d2e] flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-[#C5A059]/20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-3">
                <ShoppingBag className="w-12 h-12 text-[#C5A059]/40 animate-pulse" />
                <p className="text-base font-serif text-[#FCFBF7]">Your shopping bag is empty</p>
                <p className="text-xs text-gray-400 max-w-xs font-sans">
                  Browse our bridal and formal clothing collection and add items to your bag.
                </p>
              </div>
            ) : (
              items.map((item, index) => {
                const totalItemPrice = item.basePrice * item.quantity;

                return (
                  <div
                    key={`${item.id}-${index}`}
                    className="p-4 rounded-2xl bg-[#072A20]/60 border border-[#C5A059]/20 flex items-start gap-4 hover:border-[#C5A059]/40 transition-colors"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-20 object-cover rounded-xl border border-[#C5A059]/30 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-serif font-bold text-sm text-white truncate">{item.name}</h4>
                        <span className="font-mono font-bold text-xs text-[#C5A059] shrink-0">
                          PKR {totalItemPrice.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px]">
                        <span className="bg-[#051712] text-[#C5A059] px-2 py-0.5 rounded border border-[#C5A059]/30 font-semibold">
                          Size: {item.size}
                        </span>
                        <span className="bg-[#051712] text-gray-300 px-2 py-0.5 rounded border border-gray-800">
                          {item.fabric}
                        </span>
                      </div>

                      {item.specialNotes && (
                        <p className="text-[11px] italic text-gray-400 mt-1">Note: {item.specialNotes}</p>
                      )}

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#C5A059]/10">
                        <div className="flex items-center gap-2 bg-[#051712] rounded-lg p-1 border border-[#C5A059]/20">
                          <button
                            onClick={() => onUpdateQuantity(index, -1)}
                            className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#072A20]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-bold px-1.5">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(index, 1)}
                            className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#072A20]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(index)}
                          className="text-gray-400 hover:text-red-400 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer with Promo & Checkout */}
          {items.length > 0 && (
            <div className="p-6 bg-[#072A20] border-t border-[#C5A059]/30 space-y-4">
              {/* Promo Code Form */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code (e.g. SUMMER26)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 bg-[#051712] border border-[#C5A059]/30 rounded-xl px-3 py-2 text-xs text-white uppercase placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-[#051712] hover:bg-[#0a3e30] border border-[#C5A059]/50 text-[#C5A059] text-xs font-bold rounded-xl transition-all"
                >
                  Apply
                </button>
              </form>

              {promoMessage && (
                <p className={`text-xs ${discountPercent > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {promoMessage}
                </p>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">PKR {rawSubtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({discountPercent}%)</span>
                    <span className="font-mono">- PKR {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="text-emerald-400 font-medium">Free</span>
                </div>
                <div className="pt-2 border-t border-[#C5A059]/30 flex justify-between items-center text-sm font-bold text-white">
                  <span className="font-serif">Total</span>
                  <span className="font-serif font-black text-lg text-[#C5A059] font-mono">
                    PKR {finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full py-3.5 bg-gradient-to-r from-[#C5A059] via-[#dfbc7a] to-amber-600 text-[#051712] font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#C5A059]/20"
              >
                <span>Place Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Genuine Handwork &amp; Tracked Delivery</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
