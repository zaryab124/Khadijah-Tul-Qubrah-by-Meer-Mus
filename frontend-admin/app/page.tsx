'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ShoppingBag,
  Scissors,
  Palette,
  ShieldCheck,
  TrendingUp,
  Tag,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
  Eye,
  Plus,
  Play,
  RotateCcw,
  Percent,
  Search,
  SlidersHorizontal,
  X,
  CreditCard,
  Ruler,
  AlertCircle,
  User,
  LogOut,
  Lock,
  Headphones,
  ExternalLink,
  Crown,
  MapPin,
  Check,
  PackageCheck,
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS, UserRole } from '../lib/auth-context';
import { Navbar } from '../components/Navbar';
import { CartDrawer, CartGarmentItem } from '../components/CartDrawer';
import { ItemModal, GarmentProduct } from '../components/ItemModal';
import { BespokeStudioModal } from '../components/BespokeStudioModal';
import { BranchSelectorModal, AtelierBranch, ATELIER_BRANCHES } from '../components/BranchSelectorModal';
import { Logo } from '../components/Logo';
import { fetchProductsFromSupabase, submitCustomRequestToSupabase } from '../lib/supabase';

// Product Interface with Stitched vs Unstitched Pricing
interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  basePrice: number;
  stitchedPrice: number;
  unstitchedPrice: number;
  fabric: string;
  craft: string;
  imageUrl: string;
  description: string;
  isCustomizable: boolean;
  turnaroundDays?: string;
}

// Video Deal Campaign Interface
interface VideoDeal {
  id: string;
  title: string;
  tagline: string;
  promoCode: string;
  discountPercent: number;
  videoPoster: string;
  videoUrl: string;
  expiresIn: string;
}

// Quotation & Order Item Interface
interface CustomCommission {
  id: string;
  requestNumber: string;
  customerName: string;
  productType: string;
  fabric: string;
  craft: string;
  colour: string;
  measurements: {
    chest: string;
    waist: string;
    hip: string;
    length: string;
  };
  notes: string;
  status: 'PENDING_QUOTE' | 'QUOTE_SENT' | 'REVISION_REQUESTED' | 'ACCEPTED' | 'IN_PRODUCTION' | 'QC_PASSED' | 'SHIPPED';
  quotationVersion?: string;
  basePrice?: number;
  customizationFee?: number;
  deliveryFee?: number;
  discount?: number;
  totalAmount?: number;
  designerNotes?: string;
  productionStage?: string;
  progressPercentage?: number;
  trackingNumber?: string;
}

export default function HauteCoutureApp() {
  // Authentication Context & Customer Account Modal State
  const { user, isAuthenticated, login, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authUsername, setAuthUsername] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);

  // Customer Shopping & Atelier State
  const router = useRouter();
  const [activeBranch, setActiveBranch] = useState<AtelierBranch>(ATELIER_BRANCHES[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartGarmentItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState<GarmentProduct | null>(null);
  const [isBespokeModalOpen, setIsBespokeModalOpen] = useState<boolean>(false);
  const [showSizeChart, setShowSizeChart] = useState<boolean>(false);
  const [selectedVideoDeal, setSelectedVideoDeal] = useState<VideoDeal | null>(null);

  // Products Catalog (with Stitched & Unstitched Pricing Criteria)
  const [products, setProducts] = useState<Product[]>([
    {
      id: 'p-1',
      name: 'The Emerald Zardozi Peshwas',
      sku: 'KTQ-PESH-001',
      category: 'Bridal Couture',
      basePrice: 485000,
      stitchedPrice: 485000,
      unstitchedPrice: 345000,
      fabric: 'Micro Velvet 9000 & Loomed Silk',
      craft: '24k Metallic Tilla & Antique Zardozi',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
      description: 'Sculpted from imperial Micro Velvet 9000 in jewel-toned emerald. Hand-embellished by master karigars with gold needlework, dabka, and antique zardozi. Paired with pure silk organza dupatta.',
      isCustomizable: true,
      turnaroundDays: '14 - 28 Days',
    },
    {
      id: 'p-2',
      name: 'Bespoke Tilla Silk Anarkali',
      sku: 'KTQ-ANAR-002',
      category: 'Haute Couture',
      basePrice: 340000,
      stitchedPrice: 340000,
      unstitchedPrice: 240000,
      fabric: 'Pure Katan Silk (32 Kalis)',
      craft: 'Marori Threadwork & Dabka Cuffs',
      imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
      description: 'Flowing pure Katan silk silhouette with 32 hand-pleated kalis. Bodice embellished with floral Mughal jaal and finished with scalloped border embroidery.',
      isCustomizable: true,
      turnaroundDays: '14 - 21 Days',
    },
    {
      id: 'p-3',
      name: 'Marori Raw Silk Lehenga Set',
      sku: 'KTQ-LEH-003',
      category: 'Bridal Couture',
      basePrice: 620000,
      stitchedPrice: 620000,
      unstitchedPrice: 440000,
      fabric: '80g Hand-Loomed Raw Silk',
      craft: 'Heavy Cutwork & Kora Dabka Zardozi',
      imageUrl: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=80',
      description: 'Regal bridal lehenga set crafted on hand-loomed 80g raw silk. Adorned with geometric Mughal motifs executed in heavy cutwork and French knots.',
      isCustomizable: true,
      turnaroundDays: '21 - 35 Days',
    },
    {
      id: 'p-4',
      name: 'Handcrafted Tissue Organza Dupatta & Kurta',
      sku: 'KTQ-DUP-004',
      category: 'Luxury Pret',
      basePrice: 115000,
      stitchedPrice: 115000,
      unstitchedPrice: 75000,
      fabric: 'French Pure Silk Organza',
      craft: 'Silk Ribbon Appliqué & Gota Spray',
      imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80',
      description: 'Featherlight sheer French silk organza shirt and dupatta featuring hand-appliqued tissue borders, scalloped edging, and dispersed gota spray.',
      isCustomizable: false,
      turnaroundDays: '7 - 14 Days',
    },
  ]);

  // Connect & Fetch Live Catalog from Supabase
  useEffect(() => {
    async function loadCatalog() {
      try {
        const remoteProducts = await fetchProductsFromSupabase();
        if (remoteProducts && remoteProducts.length > 0) {
          setProducts(
            remoteProducts.map((rp) => ({
              id: rp.id || rp.sku,
              name: rp.name,
              sku: rp.sku,
              category: rp.category,
              basePrice: Number(rp.stitched_price),
              stitchedPrice: Number(rp.stitched_price),
              unstitchedPrice: Number(rp.unstitched_price),
              fabric: rp.fabric,
              craft: rp.craft,
              imageUrl: rp.image_url,
              description: rp.description || '',
              isCustomizable: rp.is_customizable ?? true,
              turnaroundDays: rp.turnaround_days || '14 - 28 Days',
            }))
          );
        }
      } catch (err) {
        console.warn('Supabase storefront fetch (using built-in catalog):', err);
      }
    }
    loadCatalog();
  }, []);

  // Video Deals & Campaigns
  const [videoDeals, setVideoDeals] = useState<VideoDeal[]>([
    {
      id: 'vd-1',
      title: 'Royal Heirloom Winter Collection',
      tagline: 'Exclusive Velvet & 24k Zardozi Edition',
      promoCode: 'SUMMER26',
      discountPercent: 20,
      videoPoster: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-an-orange-dress-41584-large.mp4',
      expiresIn: 'Ends in 3 days',
    },
    {
      id: 'vd-2',
      title: 'Bespoke Bridal Atelier Preview',
      tagline: 'Behind the Scenes with Master Karigars',
      promoCode: 'BRIDALVIP',
      discountPercent: 15,
      videoPoster: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-glamorous-woman-in-a-golden-dress-42503-large.mp4',
      expiresIn: 'Limited Slots',
    },
  ]);

  // Bespoke Custom Design Commissions (shared between Customer, Designer, Production)
  const [commissions, setCommissions] = useState<CustomCommission[]>([
    {
      id: 'comm-101',
      requestNumber: 'CDR-202609-001',
      customerName: 'Begum Sophia Al-Rashid',
      productType: 'Peshwas & Dupatta',
      fabric: 'Micro Velvet 9000',
      craft: 'Zardozi Handwork (Metallic Gold)',
      colour: 'Royal Emerald Green',
      measurements: { chest: '36"', waist: '28"', hip: '38"', length: '56"' },
      notes: 'Please add heavier border embroidery with gold pearls and scalloped sleeves.',
      status: 'QUOTE_SENT',
      quotationVersion: 'V2',
      basePrice: 380000,
      customizationFee: 95000,
      deliveryFee: 15000,
      discount: 25000,
      totalAmount: 465000,
      designerNotes: 'V2 updated with requested pearl scallop border and calibrated karigar hours.',
      productionStage: 'CRAFTING',
      progressPercentage: 60,
      trackingNumber: 'TCS-9847291-PK',
    },
  ]);

  // "Create Your Own" Studio Form State
  const [customForm, setCustomForm] = useState({
    silhouette: 'Peshwas & Dupatta',
    colour: 'Royal Emerald Green',
    fabric: 'Micro Velvet 9000',
    craft: 'Zardozi Handwork (Metallic Gold)',
    chest: '36',
    waist: '28',
    hip: '38',
    length: '56',
    notes: '',
  });

  // Currency Formatter
  const formatPKR = (amt: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  // Cart Functions (Integrated with Atelier Cart Drawer)
  const handleAddToCart = (item: CartGarmentItem) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (ci) => ci.id === item.id && ci.size === item.size && ci.fabric === item.fabric
      );
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += item.quantity;
        return next;
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (index: number, delta: number) => {
    setCartItems((prev) => {
      const next = [...prev];
      const newQty = next[index].quantity + delta;
      if (newQty <= 0) {
        next.splice(index, 1);
      } else {
        next[index] = { ...next[index], quantity: newQty };
      }
      return next;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleQuickAdd = (product: Product, stitchingOption: 'STITCHED' | 'UNSTITCHED' = 'STITCHED') => {
    const unitPrice = stitchingOption === 'STITCHED' ? product.stitchedPrice : product.unstitchedPrice;
    handleAddToCart({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      basePrice: unitPrice,
      stitchingOption,
      stitchedPrice: product.stitchedPrice,
      unstitchedPrice: product.unstitchedPrice,
      imageUrl: product.imageUrl,
      size: stitchingOption === 'STITCHED' ? 'M (36" Bust)' : 'Unstitched Fabric (3-Piece)',
      fabric: product.fabric,
      craft: product.craft,
      quantity: 1,
    });
  };

  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.basePrice * item.quantity, 0);

  // Handle Create Your Own Submission
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reqNum = `CDR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCommission: CustomCommission = {
      id: `comm-${Date.now()}`,
      requestNumber: reqNum,
      customerName: user?.name || 'Valued Couture Client',
      productType: customForm.silhouette,
      fabric: customForm.fabric,
      craft: customForm.craft,
      colour: customForm.colour,
      measurements: {
        chest: `${customForm.chest}"`,
        waist: `${customForm.waist}"`,
        hip: `${customForm.hip}"`,
        length: `${customForm.length}"`,
      },
      notes: customForm.notes,
      status: 'PENDING_QUOTE',
    };

    setCommissions([newCommission, ...commissions]);

    // Asynchronously submit to Supabase
    submitCustomRequestToSupabase({
      request_number: reqNum,
      customer_name: user?.name || 'Valued Couture Client',
      silhouette: customForm.silhouette,
      fabric: customForm.fabric,
      craft: customForm.craft,
      colour: customForm.colour,
      stitching_type: 'STITCHED',
      chest: customForm.chest,
      waist: customForm.waist,
      hip: customForm.hip,
      length: customForm.length,
      special_notes: customForm.notes,
      status: 'PENDING_QUOTE',
    }).catch((err) => console.warn('Supabase custom order submit:', err));

    alert(`Custom Commission Request ${reqNum} registered with our Senior Designer! We will prepare your measurement quote shortly.`);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.craft.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.fabric.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#051712] text-[#FCFBF7] font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP LUXURY NAVIGATION (OK-RESTUERENT STYLE WITH ATELIER SELECTOR) */}
      {/* ========================================================================= */}
      <Navbar
        activeBranch={activeBranch}
        onSelectBranch={(b) => setActiveBranch(b)}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenBespoke={() => setIsBespokeModalOpen(true)}
      />

      {/* Atelier Physical Salon Fitting Notification (Symmetric Banner) */}
      <div className="bg-gradient-to-r from-[#030e0b] via-[#C5A059]/20 to-[#030e0b] border-b border-[#C5A059]/30 text-[#FCFBF7] py-2 px-4 text-center font-serif text-xs flex items-center justify-center gap-2 shadow-inner">
        <Sparkles className="w-3.5 h-3.5 text-[#C5A059] animate-spin" />
        <span className="text-[11px] sm:text-xs">
          <strong className="text-[#C5A059] font-bold">Atelier Fitting Active:</strong> {activeBranch.name} &bull; Private Haute Couture Suite #3
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 2. CUSTOMER ATELIER STOREFRONT (MAIN SALES & SHOWCASE EXPERIENCE) */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 lg:pb-16 space-y-16">
          {/* Hero Banner with Featured Deals (Authentic Emerald Velvet & Gold Heritage) */}
          <section className="relative overflow-hidden rounded-3xl border-2 border-[#C5A059]/40 shadow-2xl bg-[#04130e]">
            {/* Background Texture: Deep Emerald Crushed Velvet with Luxurious Vignette */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105"
              style={{ backgroundImage: `url('/brand-hero.jpg')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#030e0b] via-[#051712]/95 to-[#04130e]/90" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(197,160,89,0.18),transparent_50%)]" />

            <div className="relative z-10 p-6 sm:p-10 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left Column (7 cols): Royal Emblem, Brand Title, Official Slogan & Atelier Info */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Official Slogan Badge */}
                  <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#C5A059]/20 via-[#dfbc7a]/20 to-[#C5A059]/20 border border-[#C5A059]/60 text-[#F3E5AB] text-xs font-mono font-black tracking-[0.3em] uppercase shadow-lg shadow-[#C5A059]/10">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059] animate-pulse" />
                    <span>STAY HONEST , STAND LONG</span>
                  </div>

                  {/* Brand Title & Insignia Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    {/* Floating Royal Gold Insignia Medallion */}
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-[#C5A059] via-[#F3E5AB] to-[#99752D] shadow-2xl shadow-[#C5A059]/30 ring-2 ring-[#C5A059]/50 group-hover:scale-105 transition-transform duration-500">
                        <img
                          src="/brand-logo.jpg"
                          alt="KHADIJAH-TUL-QUBRAH by Meer&Mus Royal Insignia"
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <div className="absolute -inset-1 rounded-full bg-[#C5A059]/20 blur-md -z-10 group-hover:bg-[#C5A059]/40 transition-colors" />
                    </div>

                    <div>
                      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none uppercase font-serif">
                        KHADIJAH-TUL-<span className="text-[#C5A059]">QUBRAH</span>
                      </h1>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="h-px w-8 bg-[#C5A059]" />
                        <span className="text-sm sm:text-base font-serif font-bold text-[#dfbc7a] tracking-widest uppercase">
                          by Meer&amp;Mus
                        </span>
                        <div className="h-px w-8 bg-[#C5A059]" />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed font-light">
                    Handmade luxury bridal and formal clothing made with pure velvet, silk, and gold hand embroidery. Custom fitted to your exact size.
                  </p>

                  {/* Atelier Capabilities Info Card */}
                  {activeBranch && (
                    <div className="p-4 rounded-2xl bg-[#030e0b]/90 border border-[#C5A059]/40 backdrop-blur-md flex items-center justify-between text-xs max-w-lg shadow-xl">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-[#C5A059] shrink-0" />
                        <div>
                          <span className="font-serif font-bold text-white block text-sm">{activeBranch.name}</span>
                          <span className="text-[11px] text-gray-400">{activeBranch.address}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full font-bold text-[10px] uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {activeBranch.capabilities?.international_shipping ? 'Worldwide Delivery Available' : 'Store Pickup Only'}
                      </span>
                    </div>
                  )}

                  {/* Action CTA Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => setIsBespokeModalOpen(true)}
                      className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#C5A059] via-[#dfbc7a] to-amber-600 text-[#051712] font-serif font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[#C5A059]/25 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" /> Create Your Own Dress
                    </button>
                    <a
                      href="#catalog"
                      className="px-5 py-3.5 rounded-xl bg-[#051712] hover:bg-[#072A20] border border-[#C5A059]/50 text-[#C5A059] hover:text-white font-serif font-bold text-xs uppercase tracking-wider transition-all shadow"
                    >
                      Shop Collection &rarr;
                    </a>
                  </div>
                </div>

                {/* Right Column (5 cols): Hot Runway Video Deals */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#C5A059]/20 pb-2">
                    <span className="text-xs text-[#C5A059] font-bold uppercase tracking-wider flex items-center gap-1.5 font-serif">
                      <Play className="w-3.5 h-3.5 fill-[#C5A059]" /> Video Deals &amp; Discounts
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
                    {videoDeals.map((deal) => (
                      <div
                        key={deal.id}
                        onClick={() => setSelectedVideoDeal(deal)}
                        className="relative rounded-2xl overflow-hidden border border-[#C5A059]/50 bg-[#030e0b] group shadow-xl h-40 flex flex-col justify-end p-4 cursor-pointer hover:border-[#F3E5AB] transition-all"
                      >
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                          style={{ backgroundImage: `url(${deal.videoPoster})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020b08] via-[#020b08]/65 to-transparent" />

                        <div className="absolute top-3 right-3 bg-[#030e0b]/80 backdrop-blur-md p-2.5 rounded-full border border-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-[#051712] transition-colors shadow-lg">
                          <Play className="w-4 h-4 text-[#C5A059] group-hover:text-[#051712] fill-current" />
                        </div>

                        <div className="relative z-10 space-y-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C5A059] text-[#051712] text-[10px] font-black font-mono shadow">
                            <Percent className="w-2.5 h-2.5" /> {deal.discountPercent}% OFF • {deal.promoCode}
                          </div>
                          <h4 className="text-base font-serif font-bold text-white line-clamp-1">{deal.title}</h4>
                          <p className="text-[11px] text-gray-300 line-clamp-1 font-light">{deal.tagline}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Couture Menu / Category Navigation Filter */}
          <section id="catalog" className="space-y-6 pt-4 scroll-mt-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#C5A059]/20 pb-4">
              <div>
                <span className="text-[#C5A059] text-xs font-bold tracking-[0.25em] uppercase">
                  OUR CLOTHING COLLECTION
                </span>
                <h2 className="text-3xl font-serif text-[#FCFBF7] font-semibold mt-1">
                  Bridal &amp; Formal Wear
                </h2>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-3 w-4 h-4 text-[#C5A059]" />
                <input
                  type="text"
                  placeholder="Search clothes, fabrics, styles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#051712] border border-[#C5A059]/40 rounded-full text-xs text-[#FCFBF7] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            {/* Category Filter Pills with Icons (Matching ok-restuerent category scroll) */}
            <div className="flex overflow-x-auto gap-3 pb-2">
              {[
                { id: 'ALL', label: 'All Clothes', icon: Sparkles },
                { id: 'Bridal Couture', label: 'Bridal Wear', icon: Crown },
                { id: 'Haute Couture', label: 'Party Wear', icon: Scissors },
                { id: 'Luxury Pret', label: 'Ready to Wear', icon: ShoppingBag },
                { id: 'Raw Silk & Velvet', label: 'Silk & Velvet', icon: Palette },
              ].map((cat) => {
                const CatIcon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold tracking-wider whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-[#C5A059] text-[#051712] border-[#C5A059] font-bold shadow-lg shadow-[#C5A059]/20'
                        : 'bg-[#072A20]/80 text-[#FCFBF7]/80 border-[#C5A059]/30 hover:border-[#C5A059]'
                    }`}
                  >
                    <CatIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#051712]' : 'text-[#C5A059]'}`} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Garment Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-[#C5A059]/30 bg-[#072A20] overflow-hidden flex flex-col justify-between hover:border-[#C5A059] transition-all duration-300 shadow-xl group"
                >
                  {/* Image Container */}
                  <div className="relative h-72 overflow-hidden bg-black cursor-pointer" onClick={() => setSelectedItemForModal(product)}>
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 bg-[#051712]/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#C5A059]/50 text-[10px] font-bold text-[#C5A059] tracking-wider uppercase">
                      {product.category}
                    </div>
                    {product.isCustomizable && (
                      <div className="absolute top-3 right-3 bg-[#C5A059] text-[#051712] px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase flex items-center gap-1 shadow">
                        <Sparkles className="w-2.5 h-2.5" /> CUSTOM MADE
                      </div>
                    )}
                  </div>

                  {/* Garment Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] text-[#C5A059] tracking-widest font-mono uppercase">{product.sku}</span>
                      <h3 className="text-lg font-serif font-bold text-[#FCFBF7] group-hover:text-[#C5A059] transition-colors leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-300 line-clamp-2 mt-1 font-light leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#C5A059]/20 space-y-2.5">
                      {/* Dual Price Criteria: Stitched vs Unstitched */}
                      <div className="grid grid-cols-2 gap-2 bg-[#051712]/80 p-2 rounded-xl border border-[#C5A059]/20">
                        <div>
                          <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <PackageCheck className="w-2.5 h-2.5" /> Unstitched
                          </span>
                          <span className="text-xs font-bold text-amber-300 font-mono block">
                            {formatPKR(product.unstitchedPrice)}
                          </span>
                        </div>
                        <div className="border-l border-[#C5A059]/20 pl-2">
                          <span className="text-[9px] text-[#C5A059] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Scissors className="w-2.5 h-2.5" /> Stitched
                          </span>
                          <span className="text-xs font-bold text-[#C5A059] font-mono block">
                            {formatPKR(product.stitchedPrice)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                          onClick={() => setSelectedItemForModal(product)}
                          className="py-2 text-[11px] font-semibold tracking-wider rounded-lg border border-[#C5A059]/50 text-[#C5A059] hover:bg-[#C5A059]/10 transition-colors flex items-center justify-center gap-1"
                          title="View Sizing (Inches), Fabrics & Details"
                        >
                          <Ruler className="w-3 h-3" /> Size &amp; Chart
                        </button>
                        <button
                          onClick={() => setSelectedItemForModal(product)}
                          className="py-2 text-[11px] font-bold tracking-wider rounded-lg bg-[#C5A059] text-[#051712] hover:bg-[#d4af37] transition-colors flex items-center justify-center gap-1 shadow"
                          title="Choose Stitched or Unstitched & Add to Bag"
                        >
                          <ShoppingBag className="w-3 h-3" /> Select &amp; Buy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 3. "CREATE YOUR OWN" BESPOKE STUDIO (STEP-BY-STEP CUSTOM COMMISSION) */}
          {/* ========================================================================= */}
          <section className="rounded-3xl border-2 border-[#C5A059] bg-gradient-to-br from-[#072A20] via-[#051712] to-[#072A20] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/40 text-xs font-bold tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5" /> CUSTOM MADE CLOTHING
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#FCFBF7]">
                Create Your Own Dress
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed font-light">
                Design your dream dress with your choice of fabric, color, and hand embroidery. Stitched to your exact measurements with a custom price quote from our designer.
              </p>
            </div>

            <form onSubmit={handleCustomSubmit} className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#C5A059]/30">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#C5A059] tracking-wider uppercase mb-1">
                    1. Choose Dress Style
                  </label>
                  <select
                    value={customForm.silhouette}
                    onChange={(e) => setCustomForm({ ...customForm, silhouette: e.target.value })}
                    className="w-full bg-[#051712] border border-[#C5A059]/40 rounded-lg p-2.5 text-xs text-[#FCFBF7] focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="Peshwas & Dupatta">Peshwas & Dupatta</option>
                    <option value="Bridal Lehenga Choli">Bridal Lehenga Choli</option>
                    <option value="Bespoke Anarkali">Anarkali Dress</option>
                    <option value="Farshi Gharara Suit">Gharara Suit</option>
                    <option value="Royal Sherwani">Sherwani</option>
                    <option value="Tissue Saree">Saree</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#C5A059] tracking-wider uppercase mb-1">
                    2. Choose Color
                  </label>
                  <select
                    value={customForm.colour}
                    onChange={(e) => setCustomForm({ ...customForm, colour: e.target.value })}
                    className="w-full bg-[#051712] border border-[#C5A059]/40 rounded-lg p-2.5 text-xs text-[#FCFBF7] focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="Royal Emerald Green">Emerald Green</option>
                    <option value="Antique Gold">Antique Gold</option>
                    <option value="Deep Crimson Velvet">Red Velvet</option>
                    <option value="Pristine Ivory">Ivory White</option>
                    <option value="Midnight Navy">Navy Blue</option>
                    <option value="Imperial Plum">Plum Purple</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#C5A059] tracking-wider uppercase mb-1">
                    3. Choose Fabric
                  </label>
                  <select
                    value={customForm.fabric}
                    onChange={(e) => setCustomForm({ ...customForm, fabric: e.target.value })}
                    className="w-full bg-[#051712] border border-[#C5A059]/40 rounded-lg p-2.5 text-xs text-[#FCFBF7] focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="Micro Velvet 9000">Pure Velvet (Micro 9000)</option>
                    <option value="Pure Katan Silk">Pure Silk</option>
                    <option value="Hand-loomed 80g Raw Silk">Raw Silk</option>
                    <option value="Pure French Silk Organza">Organza Silk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#C5A059] tracking-wider uppercase mb-1">
                    4. Choose Handwork Style
                  </label>
                  <select
                    value={customForm.craft}
                    onChange={(e) => setCustomForm({ ...customForm, craft: e.target.value })}
                    className="w-full bg-[#051712] border border-[#C5A059]/40 rounded-lg p-2.5 text-xs text-[#FCFBF7] focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="Zardozi Handwork (Metallic Gold)">Gold Zardozi Embroidery</option>
                    <option value="Tilla & Marori Stitching">Tilla & Thread Work</option>
                    <option value="Handwork Dabka & Naqshi">Dabka & Pearl Handwork</option>
                    <option value="Silk Ribbon Appliqué">Gotapatti & Ribbon Work</option>
                  </select>
                </div>
              </div>

              {/* Sizing & Custom Measurements */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#C5A059] tracking-wider uppercase">
                      5. Your Measurements (Inches)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSizeChart(true)}
                      className="text-[11px] text-[#C5A059] underline font-semibold flex items-center gap-1"
                    >
                      <Ruler className="w-3 h-3" /> View Size Chart
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-gray-400">Chest</span>
                      <input
                        type="text"
                        value={customForm.chest}
                        onChange={(e) => setCustomForm({ ...customForm, chest: e.target.value })}
                        className="w-full bg-[#051712] border border-[#C5A059]/40 rounded-lg p-2 text-xs text-[#FCFBF7]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400">Waist</span>
                      <input
                        type="text"
                        value={customForm.waist}
                        onChange={(e) => setCustomForm({ ...customForm, waist: e.target.value })}
                        className="w-full bg-[#051712] border border-[#C5A059]/40 rounded-lg p-2 text-xs text-[#FCFBF7]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400">Hip</span>
                      <input
                        type="text"
                        value={customForm.hip}
                        onChange={(e) => setCustomForm({ ...customForm, hip: e.target.value })}
                        className="w-full bg-[#051712] border border-[#C5A059]/40 rounded-lg p-2 text-xs text-[#FCFBF7]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400">Length</span>
                      <input
                        type="text"
                        value={customForm.length}
                        onChange={(e) => setCustomForm({ ...customForm, length: e.target.value })}
                        className="w-full bg-[#051712] border border-[#C5A059]/40 rounded-lg p-2 text-xs text-[#FCFBF7]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#C5A059] tracking-wider uppercase mb-1">
                    6. Special Notes / Requests
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us any special requests, sleeve length, neckline style, or your event date..."
                    value={customForm.notes}
                    onChange={(e) => setCustomForm({ ...customForm, notes: e.target.value })}
                    className="w-full bg-[#051712] border border-[#C5A059]/40 rounded-lg p-2.5 text-xs text-[#FCFBF7] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#C5A059] text-[#051712] font-serif font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-[#d4af37] transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Submit Custom Order Request
                </button>
              </div>
            </form>
          </section>

          {/* ========================================================================= */}
          {/* 4. CUSTOMER LIVE COMMISSION & QUOTATION TRACKER */}
          {/* ========================================================================= */}
          <section className="space-y-6 pt-6">
            <div className="border-b border-[#C5A059]/20 pb-4">
              <span className="text-[#C5A059] text-xs font-bold tracking-[0.25em] uppercase">
                LIVE ORDER STATUS
              </span>
              <h2 className="text-3xl font-serif text-[#FCFBF7] font-semibold mt-1">
                Your Orders &amp; Price Quotes
              </h2>
            </div>

            <div className="space-y-6">
              {commissions.map((comm) => (
                <div
                  key={comm.id}
                  className="rounded-2xl border border-[#C5A059]/40 bg-[#072A20] p-6 shadow-xl space-y-6"
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C5A059]/20 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#C5A059]">{comm.requestNumber}</span>
                        {comm.quotationVersion && (
                          <span className="px-2 py-0.5 rounded bg-[#C5A059] text-[#051712] text-[10px] font-bold">
                            QUOTE {comm.quotationVersion}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-serif font-bold text-[#FCFBF7] mt-0.5">{comm.productType}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Status:</span>
                      <span className="px-3 py-1 rounded-full bg-[#051712] border border-[#C5A059] text-[#C5A059] text-xs font-bold uppercase tracking-wider">
                        {comm.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Summary Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block">Base Fabric</span>
                      <strong className="text-[#FCFBF7]">{comm.fabric}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Handwork</span>
                      <strong className="text-[#FCFBF7]">{comm.craft}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Color</span>
                      <strong className="text-[#C5A059]">{comm.colour}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Measurements</span>
                      <strong className="text-[#FCFBF7]">Chest {comm.measurements.chest}" • Waist {comm.measurements.waist}"</strong>
                    </div>
                  </div>

                  {/* Quotation Breakdown (if sent) */}
                  {comm.totalAmount && (
                    <div className="p-4 rounded-xl bg-[#051712] border border-[#C5A059]/30 space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-300">
                        <span>Dress Price:</span>
                        <span>{formatPKR(comm.basePrice || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-300">
                        <span>Custom Embroidery &amp; Stitching:</span>
                        <span>{formatPKR(comm.customizationFee || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-300">
                        <span>Delivery &amp; Packaging:</span>
                        <span>{formatPKR(comm.deliveryFee || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-emerald-400">
                        <span>Special Discount:</span>
                        <span>- {formatPKR(comm.discount || 0)}</span>
                      </div>
                      <div className="pt-2 border-t border-[#C5A059]/30 flex items-center justify-between">
                        <strong className="text-sm font-serif text-[#FCFBF7]">Total Price:</strong>
                        <strong className="text-lg font-bold text-[#C5A059]">{formatPKR(comm.totalAmount)}</strong>
                      </div>
                      {comm.designerNotes && (
                        <p className="text-[11px] text-gray-400 italic pt-1">
                          Designer Note: &ldquo;{comm.designerNotes}&rdquo;
                        </p>
                      )}

                      {/* Customer Actions */}
                      {comm.status === 'QUOTE_SENT' && (
                        <div className="flex flex-wrap gap-3 pt-3">
                          <button
                            onClick={() => {
                              setCommissions(
                                commissions.map((c) =>
                                  c.id === comm.id ? { ...c, status: 'ACCEPTED', productionStage: 'CUTTING', progressPercentage: 20 } : c
                                )
                              );
                              alert('Quotation accepted! Transferred to tailoring floor.');
                            }}
                            className="px-5 py-2 rounded-lg bg-[#C5A059] text-[#051712] font-bold text-xs hover:bg-[#d4af37] transition-all flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accept Quote &amp; Start Making
                          </button>
                          <button
                            onClick={() => {
                              const note = prompt('Enter your requested adjustments for the designer:');
                              if (note) {
                                setCommissions(
                                  commissions.map((c) =>
                                    c.id === comm.id ? { ...c, status: 'REVISION_REQUESTED', notes: note } : c
                                  )
                                );
                                alert('Revision request sent to Designer Studio.');
                              }
                            }}
                            className="px-4 py-2 rounded-lg border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10 text-xs font-semibold"
                          >
                            Ask for Changes
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Production Timeline Progress Bar */}
                  {comm.progressPercentage && comm.progressPercentage > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#C5A059] font-bold tracking-wider uppercase flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5" /> Current Stage: {comm.productionStage}
                        </span>
                        <span className="font-bold text-[#FCFBF7]">{comm.progressPercentage}% Completed</span>
                      </div>
                      <div className="h-2 w-full bg-[#051712] rounded-full overflow-hidden border border-[#C5A059]/30">
                        <div
                          className="h-full bg-gradient-to-r from-[#C5A059] to-[#d4af37] transition-all duration-500"
                          style={{ width: `${comm.progressPercentage}%` }}
                        />
                      </div>
                      {comm.trackingNumber && (
                        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3 text-[#C5A059]" /> Courier: TCS Express Prime
                          </span>
                          <span className="text-[#C5A059] font-mono font-bold">{comm.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>
      {/* ========================================================================= */}
      {/* 9. SIZE MATRIX MODAL (INCHES) */}
      {/* ========================================================================= */}
      {showSizeChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl bg-[#072A20] border border-[#C5A059] p-6 shadow-2xl">
            <button
              onClick={() => setShowSizeChart(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#051712] text-gray-400 hover:text-white border border-[#C5A059]/30"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-serif font-bold text-[#FCFBF7] mb-1">Atelier Size Matrix</h3>
            <p className="text-xs text-gray-300 font-light mb-4">
              All measurements are in inches. Custom tailoring guarantees fitting within 0.1&ldquo; tolerance.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-[#C5A059]/30">
                <thead className="bg-[#051712] text-[#C5A059]">
                  <tr>
                    <th className="p-2.5 border-b border-[#C5A059]/30">Size</th>
                    <th className="p-2.5 border-b border-[#C5A059]/30">Chest</th>
                    <th className="p-2.5 border-b border-[#C5A059]/30">Waist</th>
                    <th className="p-2.5 border-b border-[#C5A059]/30">Hip</th>
                    <th className="p-2.5 border-b border-[#C5A059]/30">Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C5A059]/10 text-gray-300">
                  <tr>
                    <td className="p-2.5 font-bold text-[#FCFBF7]">XS (34)</td>
                    <td className="p-2.5">34&ldquo;</td>
                    <td className="p-2.5">26&ldquo;</td>
                    <td className="p-2.5">36&ldquo;</td>
                    <td className="p-2.5">56&ldquo;</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-[#FCFBF7]">S (36)</td>
                    <td className="p-2.5">36&ldquo;</td>
                    <td className="p-2.5">28&ldquo;</td>
                    <td className="p-2.5">38&ldquo;</td>
                    <td className="p-2.5">57&ldquo;</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-[#FCFBF7]">M (38)</td>
                    <td className="p-2.5">38&ldquo;</td>
                    <td className="p-2.5">30&ldquo;</td>
                    <td className="p-2.5">40&ldquo;</td>
                    <td className="p-2.5">58&ldquo;</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-[#FCFBF7]">L (40)</td>
                    <td className="p-2.5">40&ldquo;</td>
                    <td className="p-2.5">32&ldquo;</td>
                    <td className="p-2.5">42&ldquo;</td>
                    <td className="p-2.5">59&ldquo;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. RUNWAY VIDEO PREVIEW MODAL */}
      {/* ========================================================================= */}
      {selectedVideoDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-3xl rounded-2xl bg-[#051712] border border-[#C5A059] p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedVideoDeal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#072A20] text-gray-400 hover:text-white border border-[#C5A059]/30"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059] text-[#051712] text-xs font-bold">
                {selectedVideoDeal.discountPercent}% OFF • CODE: {selectedVideoDeal.promoCode}
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#FCFBF7] mt-2">{selectedVideoDeal.title}</h3>
              <p className="text-xs text-gray-300">{selectedVideoDeal.tagline}</p>
            </div>

            <div className="rounded-xl overflow-hidden border border-[#C5A059]/30 aspect-video bg-black flex items-center justify-center">
              <video
                src={selectedVideoDeal.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
                poster={selectedVideoDeal.videoPoster}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#C5A059] font-medium">{selectedVideoDeal.expiresIn}</span>
              <button
                onClick={() => {
                  alert(`Promo code ${selectedVideoDeal.promoCode} applied to your atelier bag!`);
                  setSelectedVideoDeal(null);
                }}
                className="px-6 py-2.5 bg-[#C5A059] text-[#051712] font-bold text-xs rounded-lg hover:bg-[#d4af37]"
              >
                Claim Exclusive Privilege
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. SLIDE-OVER CHECKOUT BAG & MODALS (OK-RESTUERENT STYLE) */}
      {/* ========================================================================= */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        activeBranchName={activeBranch.name}
        onCheckoutSuccess={() => {
          router.push('/order-tracking/ORD-2026-KTQ');
        }}
      />

      {/* Garment Details & Imperial Sizing Inspection Modal */}
      <ItemModal
        item={selectedItemForModal}
        onClose={() => setSelectedItemForModal(null)}
        onAddToCart={handleAddToCart}
      />

      {/* "Create Your Own" Bespoke Studio 6-Step Modal */}
      <BespokeStudioModal
        isOpen={isBespokeModalOpen}
        onClose={() => setIsBespokeModalOpen(false)}
        onSubmitCommission={handleCustomSubmit}
      />

      {/* ========================================================================= */}
      {/* 12. VIP CLIENT & PORTAL CREDENTIALS AUTHENTICATION MODAL */}
      {/* ========================================================================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#072A20] border border-[#C5A059]/40 p-6 md:p-8 shadow-2xl space-y-6">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#051712] text-gray-400 hover:text-white border border-[#C5A059]/30"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1.5">
              <span className="text-[10px] tracking-[0.25em] text-[#C5A059] font-sans font-bold uppercase block">
                Customer Account
              </span>
              <h3 className="text-2xl font-serif text-[#FCFBF7]">
                Customer Sign In
              </h3>
              <p className="text-xs text-[#FCFBF7]/60">
                Sign in to check your order status, custom orders, and saved sizes.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                {authError}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAuthSubmitting(true);
                setAuthError(null);
                const res = await login(authUsername, authPassword, 'CUSTOMER');
                setAuthSubmitting(false);
                if (res.success) {
                  setIsAuthModalOpen(false);
                } else {
                  setAuthError(res.error || 'Authentication failed');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#C5A059] font-sans font-semibold mb-1">
                  Username or Email
                </label>
                <input
                  type="text"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-lg px-3.5 py-2.5 text-sm text-[#FCFBF7] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#C5A059] font-sans font-semibold mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-lg px-3.5 py-2.5 text-sm text-[#FCFBF7] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-3 bg-[#C5A059] hover:bg-[#dfbc7a] text-[#051712] font-bold text-xs uppercase tracking-widest rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" /> {authSubmitting ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#C5A059]/20 py-8 text-center text-xs text-gray-400 max-w-7xl mx-auto px-4">
        KHADIJAH-TUL-QUBRAH BY Meer&Mus &copy; {new Date().getFullYear()} — Haute Couture Commerce, Bespoke Quotations & Atelier Management Engine.
      </footer>
    </div>
  );
}
