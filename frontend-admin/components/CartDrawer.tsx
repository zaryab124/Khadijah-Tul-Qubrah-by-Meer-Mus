'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Sparkles,
  Tag,
  ShieldCheck,
  Scissors,
  PackageCheck,
  User,
  Phone,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { submitOrderToSupabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

export interface CartGarmentItem {
  id: string;
  productId?: string;
  name: string;
  sku: string;
  category: string;
  basePrice: number; // Current effective price
  stitchingOption: 'STITCHED' | 'UNSTITCHED';
  stitchedPrice?: number;
  unstitchedPrice?: number;
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
  onCheckoutSuccess?: (orderNumber?: string) => void;
}

export const CartDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  activeBranchName = 'Main Flagship Boutique (Lahore, Pakistan)',
  onCheckoutSuccess,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  // Checkout form modal state
  const [isCheckoutFormOpen, setIsCheckoutFormOpen] = useState(false);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('Lahore');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutCompleteOrder, setCheckoutCompleteOrder] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerEmail) setCustomerEmail(user.email);
    }
  }, [user]);

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

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please enter your full name and contact phone number.');
      return;
    }

    setIsSubmitting(true);
    const orderNumber = `KTQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrderRecord = {
      id: `ord-${Date.now()}`,
      order_number: orderNumber,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || undefined,
      shipping_address: shippingAddress || 'Boutique Collection',
      city,
      subtotal: rawSubtotal,
      discount: discountAmount,
      total_amount: finalTotal,
      status: 'CONFIRMED',
      notes: `Branch: ${activeBranchName}`,
      created_at: new Date().toISOString(),
    };

    try {
      let existingOrders = [];
      const stored = localStorage.getItem('khadijah_real_orders');
      if (stored) existingOrders = JSON.parse(stored);
      localStorage.setItem('khadijah_real_orders', JSON.stringify([newOrderRecord, ...existingOrders]));
      window.dispatchEvent(new Event('khadijah_catalog_updated'));
    } catch (e) {
      console.warn('Local storage order save error:', e);
    }

    try {
      // Send to Supabase REST
      await submitOrderToSupabase(
        {
          order_number: orderNumber,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || undefined,
          shipping_address: shippingAddress || 'Boutique Collection',
          city,
          subtotal: rawSubtotal,
          discount: discountAmount,
          total_amount: finalTotal,
          status: 'CONFIRMED',
          notes: `Branch: ${activeBranchName}`,
        },
        items.map((it) => ({
          product_name: it.name,
          sku: it.sku,
          stitching_option: it.stitchingOption,
          size: it.size,
          fabric: it.fabric,
          craft: it.craft,
          price: it.basePrice,
          quantity: it.quantity,
          special_notes: it.specialNotes,
        }))
      );
    } catch (err) {
      console.warn('Supabase order submit error (handled with local confirmation):', err);
    }

    setIsSubmitting(false);
    setCheckoutCompleteOrder(orderNumber);
    onClearCart();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-[#051712] border-l border-[#C5A059]/40 text-[#FCFBF7] flex flex-col shadow-2xl">
          
          {/* Drawer Header */}
          <div className="p-6 bg-[#072A20] border-b border-[#C5A059]/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Your Atelier Bag</h3>
                <p className="text-xs text-[#FCFBF7]/60">
                  {activeBranchName} &bull; {items.length} {items.length === 1 ? 'item' : 'items'}
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

          {/* Success Screen after Order Placement */}
          {checkoutCompleteOrder ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-serif text-2xl font-bold text-white">Order Confirmed!</h4>
              <p className="text-xs text-gray-300 max-w-xs">
                Your commission has been registered with our master atelier in Lahore.
              </p>
              <div className="p-3 bg-[#072A20] rounded-xl border border-[#C5A059]/40 font-mono text-xs text-[#C5A059]">
                Order Tracking ID: <strong className="text-white block text-sm mt-0.5">{checkoutCompleteOrder}</strong>
              </div>
              <button
                onClick={() => {
                  setCheckoutCompleteOrder(null);
                  setIsCheckoutFormOpen(false);
                  onClose();
                  if (onCheckoutSuccess) onCheckoutSuccess(checkoutCompleteOrder);
                }}
                className="w-full py-3 bg-[#C5A059] text-[#051712] font-serif font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#d4af37]"
              >
                Track Live Order &rarr;
              </button>
            </div>
          ) : isCheckoutFormOpen ? (
            /* Checkout Details Modal / Form */
            <div className="flex-1 overflow-y-auto p-6 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-[#C5A059]/20">
                <h4 className="font-serif font-bold text-white text-base">Delivery &amp; Client Details</h4>
                <button
                  type="button"
                  onClick={() => setIsCheckoutFormOpen(false)}
                  className="text-xs text-[#C5A059] hover:underline"
                >
                  &larr; Back to Bag
                </button>
              </div>

              <form onSubmit={handleConfirmOrder} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[#C5A059] font-serif font-bold uppercase tracking-wider mb-1">
                    Client Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fatima Zahra"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#072A20] border border-[#C5A059]/30 rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[#C5A059] font-serif font-bold uppercase tracking-wider mb-1">
                    WhatsApp / Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+92 300 1234567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#072A20] border border-[#C5A059]/30 rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[#C5A059] font-serif font-bold uppercase tracking-wider mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="client@luxury.pk"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-[#072A20] border border-[#C5A059]/30 rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[#C5A059] font-serif font-bold uppercase tracking-wider mb-1">
                    City
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#072A20] border border-[#C5A059]/30 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="Lahore">Lahore (Flagship Atelier Pickup)</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Islamabad">Islamabad / Rawalpindi</option>
                    <option value="Multan">Multan</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Dubai / UAE">Dubai / International</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#C5A059] font-serif font-bold uppercase tracking-wider mb-1">
                    Shipping Address
                  </label>
                  <textarea
                    rows={2}
                    placeholder="House/Apartment #, Street, Area..."
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full bg-[#072A20] border border-[#C5A059]/30 rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div className="p-3 bg-[#072A20] rounded-xl border border-[#C5A059]/30 space-y-1">
                  <div className="flex justify-between text-gray-300">
                    <span>Order Total:</span>
                    <strong className="text-[#C5A059] font-mono text-sm">PKR {finalTotal.toLocaleString()}</strong>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Includes {items.filter((i) => i.stitchingOption === 'STITCHED').length} Stitched and{' '}
                    {items.filter((i) => i.stitchingOption === 'UNSTITCHED').length} Non-Stitched garment(s).
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-[#C5A059] via-[#dfbc7a] to-amber-600 text-[#051712] font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#C5A059]/20"
                >
                  <ShieldCheck className="w-4 h-4 text-[#051712]" />
                  <span>{isSubmitting ? 'Registering Order...' : 'Confirm Order & Register Commission'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* Normal Cart Items List */
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-[#C5A059]/40 animate-pulse" />
                  <p className="text-base font-serif text-[#FCFBF7]">Your shopping bag is empty</p>
                  <p className="text-xs text-gray-400 max-w-xs font-sans">
                    Browse our luxury bridal and formal clothing collection and choose stitched or non-stitched garments.
                  </p>
                </div>
              ) : (
                items.map((item, index) => {
                  const totalItemPrice = item.basePrice * item.quantity;
                  const isStitched = item.stitchingOption === 'STITCHED';

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

                        {/* Stitching Option Badge */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px]">
                          {isStitched ? (
                            <span className="inline-flex items-center gap-1 bg-[#051712] text-[#C5A059] px-2 py-0.5 rounded border border-[#C5A059]/40 font-bold">
                              <Scissors className="w-2.5 h-2.5" /> STITCHED &bull; {item.size}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-[#051712] text-amber-400 px-2 py-0.5 rounded border border-amber-500/40 font-bold">
                              <PackageCheck className="w-2.5 h-2.5" /> UNSTITCHED FABRIC
                            </span>
                          )}
                          <span className="bg-[#051712] text-gray-300 px-2 py-0.5 rounded border border-gray-800">
                            {item.fabric}
                          </span>
                        </div>

                        {item.specialNotes && (
                          <p className="text-[11px] italic text-gray-400 mt-1 line-clamp-1">Note: {item.specialNotes}</p>
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
          )}

          {/* Drawer Footer with Promo & Checkout */}
          {items.length > 0 && !isCheckoutFormOpen && !checkoutCompleteOrder && (
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
                  <span className="text-emerald-400 font-medium">Free Boutique Dispatch</span>
                </div>
                <div className="pt-2 border-t border-[#C5A059]/30 flex justify-between items-center text-sm font-bold text-white">
                  <span className="font-serif">Total Payable</span>
                  <span className="font-serif font-black text-lg text-[#C5A059] font-mono">
                    PKR {finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Sign In Enforcement for Checkout */}
              {!isAuthenticated ? (
                <div className="p-4 rounded-xl bg-[#051712] border border-[#C5A059]/50 space-y-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-[#C5A059] font-serif font-bold">
                    <User className="w-4 h-4 text-[#C5A059]" />
                    <span>Customer Sign-In Required</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-tight">
                    Please sign in or create your customer account to confirm your order, secure master karigar slots, and receive your tracking ID.
                  </p>
                  <Link
                    href="/register"
                    onClick={onClose}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[#C5A059] via-[#dfbc7a] to-amber-600 text-[#051712] font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 flex items-center justify-center gap-2 shadow-lg shadow-[#C5A059]/20 transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span>Sign In / Register Customer</span>
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => setIsCheckoutFormOpen(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-[#C5A059] via-[#dfbc7a] to-amber-600 text-[#051712] font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#C5A059]/20"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Genuine Pakistani Handwork &amp; Atelier Direct Delivery</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
