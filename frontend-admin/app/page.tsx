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
  Phone,
  MessageCircle,
  Instagram,
  Facebook,
  Youtube,
  Share2,
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS, UserRole } from '../lib/auth-context';
import { Navbar } from '../components/Navbar';
import { CartDrawer, CartGarmentItem } from '../components/CartDrawer';
import { ItemModal, GarmentProduct } from '../components/ItemModal';
import { BespokeStudioModal } from '../components/BespokeStudioModal';
import { BranchSelectorModal, AtelierBranch, ATELIER_BRANCHES } from '../components/BranchSelectorModal';
import { Logo } from '../components/Logo';
import { fetchProductsFromSupabase, submitCustomRequestToSupabase } from '../lib/supabase';
import { getBrandSettings, BrandSettings, DEFAULT_BRAND_SETTINGS } from '../lib/brand-settings';

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
  const { user, isAuthenticated, login, registerCustomer, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  
  // Login form state
  const [authUsername, setAuthUsername] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  
  // Registration form state
  const [regName, setRegName] = useState<string>('');
  const [regEmailOrPhone, setRegEmailOrPhone] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regCity, setRegCity] = useState<string>('Lahore');
  const [regAddress, setRegAddress] = useState<string>('');

  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
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

  // Products Catalog (Live real data only, populated via Admin Center / Supabase)
  const [products, setProducts] = useState<Product[]>([]);

  // Brand & Social Media Configuration (Dynamic from Admin Center)
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);

  useEffect(() => {
    setBrandSettings(getBrandSettings());
    const handleBrandUpdate = (e: any) => {
      if (e.detail) {
        setBrandSettings(e.detail);
      } else {
        setBrandSettings(getBrandSettings());
      }
    };
    const handleCategorySelect = (e: any) => {
      if (e.detail) {
        setSelectedCategory(e.detail);
      }
    };
    window.addEventListener('khadijah_brand_settings_updated', handleBrandUpdate);
    window.addEventListener('khadijah_select_category', handleCategorySelect);
    return () => {
      window.removeEventListener('khadijah_brand_settings_updated', handleBrandUpdate);
      window.removeEventListener('khadijah_select_category', handleCategorySelect);
    };
  }, []);

  const cleanWa = brandSettings.whatsappNumber.replace(/[^0-9]/g, '');
  const waLink = `https://wa.me/${cleanWa || '923359301919'}?text=${encodeURIComponent('Hello KHADIJAH-TUL-QUBRAH By Meer&Mus, I am interested in inquiring about your haute couture and bespoke designs.')}`;

  // Video Deals & Campaigns (Real base only, defaults to empty)
  const [videoDeals, setVideoDeals] = useState<VideoDeal[]>([]);

  // Bespoke Custom Design Commissions (Clean live state, populated by actual customer submissions)
  const [commissions, setCommissions] = useState<CustomCommission[]>([]);

  // Selected Handcraft Showcase Item for Magnified Inspection
  const [selectedHandcraftModal, setSelectedHandcraftModal] = useState<any | null>(null);

  // Master Handcrafted Designs Showcase (Pure Needlework & Artisan Embroidery, loaded dynamically)
  const [handcraftItems, setHandcraftItems] = useState<any[]>([]);

  // Connect & Fetch Live Catalog from Supabase & Admin Local Storage with Real-Time Event Sync
  useEffect(() => {
    async function loadCatalog() {
      // 1. Read locally stored custom/camera products created or edited in Admin
      let localProducts: any[] = [];
      try {
        const stored = localStorage.getItem('khadijah_custom_products');
        if (stored) {
          localProducts = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Could not read custom products from local storage:', e);
      }

      try {
        const remoteProducts = await fetchProductsFromSupabase();
        if (remoteProducts && remoteProducts.length > 0) {
          const formattedRemote = remoteProducts.map((rp) => ({
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
          }));

          // Merge: Put local admin items with custom photos first, deduplicated by SKU
          const remoteSkus = new Set(formattedRemote.map((p) => p.sku));
          const localFormatted = localProducts
            .filter((lp) => lp.isActive !== false && !remoteSkus.has(lp.sku))
            .map((lp) => ({
              id: lp.id || lp.sku,
              name: lp.name,
              sku: lp.sku,
              category: lp.category,
              basePrice: Number(lp.stitchedPrice || lp.price),
              stitchedPrice: Number(lp.stitchedPrice || lp.price),
              unstitchedPrice: Number(lp.unstitchedPrice || Math.round((lp.stitchedPrice || lp.price) * 0.72)),
              fabric: lp.fabric,
              craft: lp.craft,
              imageUrl: lp.imageUrl,
              description: lp.description || '',
              isCustomizable: true,
              turnaroundDays: '14 - 28 Days',
            }));

          setProducts([...localFormatted, ...formattedRemote]);
        } else if (localProducts.length > 0) {
          setProducts(
            localProducts
              .filter((lp) => lp.isActive !== false)
              .map((lp) => ({
                id: lp.id || lp.sku,
                name: lp.name,
                sku: lp.sku,
                category: lp.category,
                basePrice: Number(lp.stitchedPrice || lp.price),
                stitchedPrice: Number(lp.stitchedPrice || lp.price),
                unstitchedPrice: Number(lp.unstitchedPrice || Math.round((lp.stitchedPrice || lp.price) * 0.72)),
                fabric: lp.fabric,
                craft: lp.craft,
                imageUrl: lp.imageUrl,
                description: lp.description || '',
                isCustomizable: true,
                turnaroundDays: '14 - 28 Days',
              }))
          );
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.warn('Supabase storefront fetch (falling back to local):', err);
        if (localProducts.length > 0) {
          setProducts(
            localProducts.map((lp) => ({
              id: lp.id || lp.sku,
              name: lp.name,
              sku: lp.sku,
              category: lp.category,
              basePrice: Number(lp.stitchedPrice || lp.price),
              stitchedPrice: Number(lp.stitchedPrice || lp.price),
              unstitchedPrice: Number(lp.unstitchedPrice || Math.round((lp.stitchedPrice || lp.price) * 0.72)),
              fabric: lp.fabric,
              craft: lp.craft,
              imageUrl: lp.imageUrl,
              description: lp.description || '',
              isCustomizable: true,
              turnaroundDays: '14 - 28 Days',
            }))
          );
        } else {
          setProducts([]);
        }
      }

      // 2. Read real custom commissions submitted by clients (No dummy data)
      try {
        const storedCommissions = localStorage.getItem('khadijah_custom_requests');
        if (storedCommissions) {
          const parsed = JSON.parse(storedCommissions);
          if (Array.isArray(parsed)) {
            setCommissions(parsed);
          }
        }
      } catch (e) {
        console.warn('Error reading stored commissions:', e);
      }

      // 3. Read video deals if configured by boutique admin
      try {
        const storedDeals = localStorage.getItem('khadijah_video_deals');
        if (storedDeals) {
          const parsedDeals = JSON.parse(storedDeals);
          if (Array.isArray(parsedDeals)) {
            setVideoDeals(parsedDeals);
          }
        }
      } catch (e) {
        console.warn('Error reading video deals:', e);
      }

      // 4. Read handcrafted showcase items if saved
      try {
        const storedShowcase = localStorage.getItem('khadijah_handcraft_showcase');
        if (storedShowcase) {
          const parsedShowcase = JSON.parse(storedShowcase);
          if (Array.isArray(parsedShowcase)) {
            setHandcraftItems(parsedShowcase);
          }
        }
      } catch (e) {
        console.warn('Error reading handcraft showcase:', e);
      }
    }

    loadCatalog();

    // Listen for immediate catalog updates dispatched from the Admin portal or other browser tabs
    const handleCatalogSync = () => {
      loadCatalog();
    };

    window.addEventListener('khadijah_catalog_updated', handleCatalogSync);
    window.addEventListener('storage', handleCatalogSync);

    return () => {
      window.removeEventListener('khadijah_catalog_updated', handleCatalogSync);
      window.removeEventListener('storage', handleCatalogSync);
    };
  }, []);

  // "Create Your Own" Studio Form State
  const [customForm, setCustomForm] = useState({
    silhouette: 'Peshwas & Dupatta',
    colour: 'Royal Emerald Green',
    fabric: 'Cotton',
    craft: 'Hand Embroidery & Motif',
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
    if (!isAuthenticated) {
      setAuthMessage('Please sign in or register your VIP customer account to add garments to your bag and select stitching.');
      setAuthMode('LOGIN');
      setIsAuthModalOpen(true);
      return;
    }
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

  const handleOpenBespoke = () => {
    if (!isAuthenticated) {
      setAuthMessage('Please sign in or register your VIP customer account to create your custom bespoke garment.');
      setAuthMode('LOGIN');
      setIsAuthModalOpen(true);
      return;
    }
    setIsBespokeModalOpen(true);
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
    if (!isAuthenticated) {
      setAuthMessage('Please sign in or register your VIP customer account to submit a custom dress commission.');
      setAuthMode('LOGIN');
      setIsAuthModalOpen(true);
      return;
    }
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

    const updatedCommissions = [newCommission, ...commissions];
    setCommissions(updatedCommissions);

    try {
      localStorage.setItem('khadijah_custom_requests', JSON.stringify(updatedCommissions));
      window.dispatchEvent(new Event('khadijah_catalog_updated'));
    } catch (e) {
      console.warn('Local custom requests save error:', e);
    }

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
        onOpenBespoke={handleOpenBespoke}
      />

      {/* Atelier Physical Salon Fitting Notification (Symmetric Banner) */}
      <div className="bg-gradient-to-r from-[#030e0b] via-[#C5A059]/20 to-[#030e0b] border-b border-[#C5A059]/30 text-[#FCFBF7] py-2 px-4 text-center font-serif text-xs flex items-center justify-center gap-2 shadow-inner">
        <Sparkles className="w-3.5 h-3.5 text-[#C5A059] animate-spin" />
        <span className="text-[11px] sm:text-xs">
          <strong className="text-[#C5A059] font-bold">Atelier Fitting Active:</strong> {activeBranch.name} &bull; Private Haute Couture Suite #3
        </span>
      </div>

      {/* VIP Patron Clearance Status & Sign-In Bar */}
      <div className="bg-[#051712]/95 border-b border-[#C5A059]/25 py-2 px-4 text-xs font-serif shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/40 animate-pulse"></span>
              <span className="text-[#C5A059] font-bold uppercase tracking-wider text-[11px]">Active Client Session:</span>
              <span className="font-semibold text-white">{user.name}</span>
              <span className="text-gray-400 text-[10px] bg-[#072A20] px-2 py-0.5 rounded-full border border-[#C5A059]/20">
                {user.role === 'CUSTOMER' ? 'Customer' : `Staff (${user.role})`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-300 text-[11px] sm:text-xs text-center sm:text-left">
              <Lock className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
              <span>
                <strong className="text-[#C5A059]">Client Authentication:</strong> Please sign in with your username/password or register a new customer account to place orders.
              </span>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="text-xs text-red-300 hover:text-red-200 underline font-sans"
              >
                Sign Out
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthMode('LOGIN');
                    setAuthMessage(null);
                    setAuthError(null);
                    setIsAuthModalOpen(true);
                  }}
                  className="px-3 py-1 rounded-lg bg-[#072A20] border border-[#C5A059]/50 hover:border-[#C5A059] text-[#C5A059] font-bold text-xs uppercase transition-all shadow-sm"
                >
                  Sign In
                </button>
                <Link
                  href="/register"
                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#C5A059] to-amber-600 text-[#051712] font-black text-xs uppercase tracking-wider transition-all shadow hover:brightness-110"
                >
                  Register Customer &rarr;
                </Link>
              </>
            )}
          </div>
        </div>
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
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <button
                      onClick={() => setIsBespokeModalOpen(true)}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#C5A059] via-[#dfbc7a] to-amber-600 text-[#051712] font-serif font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[#C5A059]/25 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" /> Create Your Own Dress
                    </button>
                    <a
                      href="#catalog"
                      className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-[#051712] hover:bg-[#072A20] border border-[#C5A059]/50 text-[#C5A059] hover:text-white font-serif font-bold text-xs uppercase tracking-wider transition-all shadow text-center"
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

                  {videoDeals.length > 0 ? (
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
                  ) : (
                    <div className="p-5 rounded-2xl border border-[#C5A059]/40 bg-[#030e0b]/90 backdrop-blur-md space-y-3.5 shadow-xl">
                      <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#C5A059] uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-[#C5A059]" />
                        <span>Runway &amp; Video Campaigns</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed font-light">
                        Exclusive video showcases and master artisan demonstrations are scheduled directly by our atelier. Connect directly with our concierge for private VIP appointments.
                      </p>
                      <div className="pt-2 border-t border-[#C5A059]/20 flex flex-col sm:flex-row items-center gap-2">
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition"
                        >
                          <Phone className="w-3.5 h-3.5" /> WhatsApp Concierge
                        </a>
                        <Link
                          href="/login"
                          className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-[#051712] border border-[#C5A059]/30 text-gray-400 hover:text-white text-xs flex items-center justify-center gap-1.5"
                        >
                          <Crown className="w-3.5 h-3.5 text-[#C5A059]" /> Staff Management
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* MASTER HANDCRAFTED DESIGNS SHOWCASE BOX (PURE ARTISAN NEEDLEWORK) */}
          {/* ========================================================================= */}
          <section className="relative rounded-3xl border-2 border-[#C5A059] bg-gradient-to-br from-[#06241b] via-[#041712] to-[#072a20] p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden">
            {/* Ambient Gold Radial Accents */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_70%_30%,rgba(197,160,89,0.18),transparent_70%)] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[radial-gradient(circle_at_30%_70%,rgba(7,42,32,0.7),transparent_70%)] pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Showcase Box Header */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#C5A059]/30 pb-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/50 text-[#C5A059] text-[11px] font-mono font-bold tracking-[0.25em] uppercase shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059] animate-pulse" />
                    <span>MASTER KARIGAR ATELIER • 100% ARTISAN HANDCRAFTED</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white tracking-wide">
                    Handcrafted Designs Showcase
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-300 font-light max-w-2xl leading-relaxed">
                    Centuries-old royal South Asian needlework: 24k metallic tilla, antique zardozi, kora dabka wirework, marori threadwork, and hand-pleated kalis crafted by master karigars.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="#bespoke-studio"
                    className="px-5 py-2.5 rounded-xl bg-[#C5A059] text-[#051712] font-serif font-bold text-xs uppercase tracking-wider hover:bg-[#d4af37] transition-all shadow-lg shadow-[#C5A059]/20 flex items-center gap-1.5"
                  >
                    <Scissors className="w-4 h-4" /> Commission Custom Handcraft
                  </a>
                  <a
                    href="#catalog"
                    className="px-4 py-2.5 rounded-xl bg-[#051712] border border-[#C5A059]/40 text-[#C5A059] hover:bg-[#072A20] text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    Explore Ready Dresses &darr;
                  </a>
                </div>
              </div>

              {/* Showcase Cards Grid */}
              {handcraftItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {handcraftItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-2xl overflow-hidden border border-[#C5A059]/40 bg-[#051712]/90 hover:border-[#C5A059] transition-all duration-300 shadow-xl flex flex-col justify-between"
                    >
                      {/* Handcraft Photo with Magnify / Zoom Effect */}
                      <div
                        className="relative aspect-[4/5] overflow-hidden bg-black cursor-pointer"
                        onClick={() => setSelectedHandcraftModal(item)}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020b08] via-transparent to-black/30" />

                        {/* Craft Badge */}
                        <div className="absolute top-3 left-3 bg-[#051712]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#C5A059]/60 text-[9px] font-bold text-[#C5A059] tracking-wider uppercase">
                          {item.craftBadge}
                        </div>

                        {/* Karigar Hours Badge */}
                        <div className="absolute bottom-3 left-3 bg-[#072A20]/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-[#C5A059]/40 text-[10px] font-mono text-gray-200">
                          {item.karigarHours || '100+'} Karigar Hours
                        </div>

                        {/* Zoom Indicator */}
                        <div className="absolute bottom-3 right-3 p-2 rounded-full bg-[#051712]/80 border border-[#C5A059]/40 text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-[#051712] transition-colors shadow">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-gray-400 font-mono block mb-1">{item.fabric}</span>
                          <h4 className="text-sm font-serif font-bold text-white group-hover:text-[#C5A059] transition-colors leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-gray-300 mt-1 line-clamp-2 leading-relaxed font-light">
                            {item.techniqueDescription}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[#C5A059]/20 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCustomForm((prev) => ({
                                ...prev,
                                craft: item.craftBadge,
                                fabric: item.fabric ? item.fabric.split('&')[0].trim() : 'Cotton',
                              }));
                              const el = document.getElementById('bespoke-studio');
                              el?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="flex-1 py-2 rounded-lg bg-[#072A20] hover:bg-[#C5A059] text-[#C5A059] hover:text-[#051712] border border-[#C5A059]/40 hover:border-[#C5A059] font-serif font-bold text-[11px] tracking-wider transition-all flex items-center justify-center gap-1.5 shadow"
                          >
                            <Sparkles className="w-3 h-3" /> Select for Bespoke
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedHandcraftModal(item)}
                            className="p-2 rounded-lg border border-[#C5A059]/40 text-[#C5A059] hover:bg-[#072A20]"
                            title="Inspect Needlework Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 sm:p-12 rounded-2xl border border-[#C5A059]/30 bg-[#051712]/80 text-center space-y-4 max-w-2xl mx-auto shadow-xl">
                  <div className="w-14 h-14 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/40 flex items-center justify-center mx-auto text-[#C5A059]">
                    <Scissors className="w-7 h-7 text-[#C5A059]" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                    Master Karigar Showcase in Curation
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed">
                    Our atelier needlework pieces (24k Metallic Tilla, Antique Zardozi, Kora Dabka wirework, and Marori) are being hand-photographed directly from our workshop in Lahore. You can commission any custom handcraft embroidery on your choice of fabric right now.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => setIsBespokeModalOpen(true)}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-amber-600 text-[#051712] font-serif font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg transition"
                    >
                      Commission Bespoke Handcraft
                    </button>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-3 rounded-xl bg-[#072A20] border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" /> Chat with Master Artisan
                    </a>
                  </div>
                </div>
              )}
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

            {/* Category Filter Pills with Icons (Smooth horizontal touch swipe) */}
            <div className="flex overflow-x-auto no-scrollbar scroll-smooth gap-2.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {[
                { id: 'ALL', label: 'All Collection', icon: Sparkles },
                { id: 'Cotton', label: 'Cotton', icon: Scissors },
                { id: 'Khaddar', label: 'Khaddar', icon: Palette },
                { id: 'Bin Saeed Lawn', label: 'Bin Saeed Lawn', icon: Crown },
                { id: 'Linen', label: 'Linen', icon: Sparkles },
                { id: 'Embroidery', label: 'Embroidery', icon: Sparkles },
                { id: 'Karandi', label: 'Karandi', icon: Palette },
                { id: 'Gents Suits', label: 'Gents Suits (Wool & Washing Wear)', icon: ShoppingBag },
              ].map((cat) => {
                const CatIcon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold tracking-wider whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-[#C5A059] text-[#051712] border-[#C5A059] font-bold shadow-lg shadow-[#C5A059]/20 scale-105'
                        : 'bg-[#072A20]/80 text-[#FCFBF7]/80 border-[#C5A059]/30 hover:border-[#C5A059] hover:text-white'
                    }`}
                  >
                    <CatIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#051712]' : 'text-[#C5A059]'}`} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Garment Grid */}
            {filteredProducts.length > 0 ? (
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
            ) : (
              <div className="p-10 sm:p-14 rounded-3xl border border-[#C5A059]/30 bg-[#072A20]/60 text-center space-y-4 max-w-2xl mx-auto shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center mx-auto text-[#C5A059]">
                  <ShoppingBag className="w-8 h-8 text-[#C5A059]" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-white">
                  Real Atelier Catalog is Being Updated
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed">
                  We are uploading real boutique designs, camera photos, and unstitched/stitched pricing directly from our physical store in Lahore. Place a custom bespoke order or contact our hotline directly.
                </p>
                <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setIsBespokeModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-[#C5A059] text-[#051712] font-serif font-bold text-xs uppercase tracking-wider hover:bg-[#d4af37] shadow-lg flex items-center gap-2 transition"
                  >
                    <Sparkles className="w-4 h-4" /> Create Your Own Dress
                  </button>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" /> WhatsApp Hotline
                  </a>
                  <Link
                    href="/admin"
                    className="px-4 py-3 rounded-xl bg-[#051712] border border-[#C5A059]/30 text-gray-400 hover:text-[#C5A059] text-xs font-medium transition"
                  >
                    Admin Center: Add Products &rarr;
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* ========================================================================= */}
          {/* 3. "CREATE YOUR OWN" BESPOKE STUDIO (STEP-BY-STEP CUSTOM COMMISSION) */}
          {/* ========================================================================= */}
          <section id="bespoke-studio" className="scroll-mt-24 rounded-3xl border-2 border-[#C5A059] bg-gradient-to-br from-[#072A20] via-[#051712] to-[#072A20] p-8 md:p-12 shadow-2xl relative overflow-hidden">
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
                    <option value="Cotton">Cotton</option>
                    <option value="Khaddar">Khaddar</option>
                    <option value="Bin Saeed Lawn">Bin Saeed Lawn</option>
                    <option value="Linen">Linen</option>
                    <option value="Embroidery">Embroidery</option>
                    <option value="Karandi">Karandi</option>
                    <option value="Gents Suits (Wool & Washing Wear)">Gents Suits (Wool &amp; Washing Wear)</option>
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
      {/* HANDCRAFTED DESIGN LIGHTBOX INSPECTION MODAL */}
      {/* ========================================================================= */}
      {selectedHandcraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#051712] border-2 border-[#C5A059] p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedHandcraftModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#072A20] text-gray-400 hover:text-white border border-[#C5A059]/30"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] tracking-widest text-[#C5A059] font-bold uppercase block font-mono">
                ARTISAN NEEDLEWORK INSPECTION
              </span>
              <h3 className="text-2xl font-serif font-bold text-white mt-1">
                {selectedHandcraftModal.title}
              </h3>
              <p className="text-xs text-[#C5A059] mt-0.5">
                Technique: {selectedHandcraftModal.craftBadge} &bull; {selectedHandcraftModal.karigarHours} Karigar Crafting Hours
              </p>
            </div>

            <div className="rounded-xl overflow-hidden border border-[#C5A059]/40 aspect-[4/3] bg-black">
              <img
                src={selectedHandcraftModal.imageUrl}
                alt={selectedHandcraftModal.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[#072A20] border border-[#C5A059]/30 text-xs text-gray-300 space-y-2">
              <div className="flex items-center justify-between text-[#C5A059] font-mono text-[11px]">
                <span>Base Fabric: {selectedHandcraftModal.fabric}</span>
                <span className="font-bold">100% Genuine Handwork</span>
              </div>
              <p className="leading-relaxed font-light text-gray-200">
                {selectedHandcraftModal.techniqueDescription}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#C5A059]/20">
              <button
                type="button"
                onClick={() => setSelectedHandcraftModal(null)}
                className="px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 text-xs"
              >
                Close View
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomForm((prev) => ({
                    ...prev,
                    craft: selectedHandcraftModal.craftBadge,
                    fabric: selectedHandcraftModal.fabric.split('&')[0].trim(),
                  }));
                  setSelectedHandcraftModal(null);
                  const el = document.getElementById('bespoke-studio');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#d4af37] text-[#051712] font-serif font-bold text-xs uppercase tracking-wider shadow"
              >
                Commission This Handcraft
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
          router.push('/order-tracking');
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
      {/* 12. VIP CLIENT & CUSTOMER REGISTRATION / SIGN IN MODAL */}
      {/* ========================================================================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#072A20] border-2 border-[#C5A059]/60 p-6 md:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsAuthModalOpen(false);
                setAuthMessage(null);
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#051712] text-gray-400 hover:text-white border border-[#C5A059]/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header & Insignia */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#C5A059] text-[10px] font-bold uppercase tracking-widest">
                <User className="w-3 h-3 text-[#C5A059]" /> Customer Account Access
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#FCFBF7]">
                Customer Account Portal
              </h3>
              <p className="text-xs text-[#FCFBF7]/70">
                Sign in or register to place stitched &amp; unstitched orders and access live atelier tracking.
              </p>
            </div>

            {/* Trigger Message (if prompted by Add to Bag / Checkout / Bespoke) */}
            {authMessage && (
              <div className="p-3 rounded-xl bg-[#051712] border border-[#C5A059]/50 text-xs text-[#dfbc7a] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>{authMessage}</span>
              </div>
            )}

            {/* Error & Success Messages */}
            {authError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                {authError}
              </div>
            )}

            {authSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Tab Switcher: Sign In vs Register */}
            <div className="grid grid-cols-2 p-1 bg-[#051712] rounded-xl border border-[#C5A059]/30 text-xs font-serif font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setAuthError(null);
                }}
                className={`py-2 rounded-lg transition-all text-center ${
                  authMode === 'LOGIN'
                    ? 'bg-[#C5A059] text-[#051712] shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('REGISTER');
                  setAuthError(null);
                }}
                className={`py-2 rounded-lg transition-all text-center ${
                  authMode === 'REGISTER'
                    ? 'bg-[#C5A059] text-[#051712] shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Register Customer
              </button>
            </div>

            {/* Mode 1: Sign In */}
            {authMode === 'LOGIN' ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setAuthSubmitting(true);
                  setAuthError(null);
                  const res = await login(authUsername, authPassword, 'CUSTOMER');
                  setAuthSubmitting(false);
                  if (res.success) {
                    setAuthSuccess('Signed in successfully! Welcome back.');
                    setTimeout(() => {
                      setIsAuthModalOpen(false);
                      setAuthSuccess(null);
                      setAuthMessage(null);
                    }, 600);
                  } else {
                    setAuthError(res.error || 'Authentication failed. Please verify credentials.');
                  }
                }}
                className="space-y-3.5"
              >
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#C5A059] font-sans font-semibold mb-1">
                    Phone, Email or Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +92 300 1234567 or customer"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FCFBF7] placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#C5A059] font-sans font-semibold mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your customer password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#FCFBF7] placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-[#C5A059] via-[#dfbc7a] to-amber-600 hover:brightness-110 text-[#051712] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <User className="w-4 h-4" /> {authSubmitting ? 'Verifying...' : 'Sign In as Customer'}
                  </button>
                </div>
              </form>
            ) : (
              /* Mode 2: Customer Registration */
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!regName.trim() || !regEmailOrPhone.trim() || !regPassword) {
                    setAuthError('Please complete all required fields.');
                    return;
                  }
                  if (regPassword.length < 6) {
                    setAuthError('Password must be at least 6 characters.');
                    return;
                  }

                  setAuthSubmitting(true);
                  setAuthError(null);
                  const res = await registerCustomer(
                    regName.trim(),
                    regEmailOrPhone.trim(),
                    regPassword,
                    regCity,
                    regAddress.trim() || undefined
                  );
                  setAuthSubmitting(false);

                  if (res.success) {
                    setAuthSuccess('Account registered & signed in! Welcome to Khadijah-Tul-Qubrah.');
                    setTimeout(() => {
                      setIsAuthModalOpen(false);
                      setAuthSuccess(null);
                      setAuthMessage(null);
                    }, 700);
                  } else {
                    setAuthError(res.error || 'Failed to complete registration.');
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#C5A059] font-sans font-semibold mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ayesha Khan"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-xl px-3.5 py-2 text-xs text-[#FCFBF7] placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#C5A059] font-sans font-semibold mb-1">
                      WhatsApp / Phone / Email *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+92 300 0000000"
                      value={regEmailOrPhone}
                      onChange={(e) => setRegEmailOrPhone(e.target.value)}
                      className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-xl px-3.5 py-2 text-xs text-[#FCFBF7] placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#C5A059] font-sans font-semibold mb-1">
                      City
                    </label>
                    <select
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-xl px-3.5 py-2 text-xs text-[#FCFBF7] focus:outline-none focus:border-[#C5A059]"
                    >
                      <option value="Lahore">Lahore (Flagship Atelier)</option>
                      <option value="Karachi">Karachi</option>
                      <option value="Islamabad">Islamabad</option>
                      <option value="Rawalpindi">Rawalpindi</option>
                      <option value="Multan">Multan</option>
                      <option value="Faisalabad">Faisalabad</option>
                      <option value="Dera Ghazi Khan">Dera Ghazi Khan</option>
                      <option value="International">Overseas Client (UK / USA / UAE)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#C5A059] font-sans font-semibold mb-1">
                    Password (Min 6 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Create a secure password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-[#051712] border border-[#C5A059]/30 rounded-xl px-3.5 py-2 text-xs text-[#FCFBF7] placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-[#C5A059] via-[#dfbc7a] to-amber-600 hover:brightness-110 text-[#051712] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> {authSubmitting ? 'Registering...' : 'Complete Customer Registration'}
                  </button>
                </div>
              </form>
            )}

            {/* Bottom Links */}
            <div className="pt-3 border-t border-[#C5A059]/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-400">
              <Link
                href="/register"
                onClick={() => setIsAuthModalOpen(false)}
                className="text-[#C5A059] hover:underline flex items-center gap-1 font-semibold"
              >
                Full Registration Portal &rarr;
              </Link>
              <Link
                href="/login"
                onClick={() => setIsAuthModalOpen(false)}
                className="text-gray-400 hover:text-white flex items-center gap-1"
              >
                <Crown className="w-3 h-3 text-[#C5A059]" /> Staff Department Portals &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING WHATSAPP CONCIERGE BUTTON (FIXED BOTTOM-RIGHT) */}
      {/* ========================================================================= */}
      <a
        href={waLink}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-20 lg:bottom-6 right-3 sm:right-6 z-40 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-2xl shadow-emerald-900/60 border border-emerald-300/40 flex items-center gap-2.5 group transition-all transform hover:scale-105 active:scale-95"
        title={`Chat directly with Atelier on WhatsApp: ${brandSettings.whatsappNumber}`}
      >
        <div className="relative">
          <Phone className="w-5 h-5 fill-white text-white" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-300 animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
        </div>
        <div className="text-left hidden sm:block">
          <span className="text-[10px] uppercase tracking-wider block text-emerald-100 font-sans font-bold leading-none">
            Atelier WhatsApp
          </span>
          <span className="text-xs font-serif font-bold text-white leading-tight">
            {brandSettings.whatsappNumber}
          </span>
        </div>
      </a>

      {/* ========================================================================= */}
      {/* LUXURY FOOTER WITH TWO-WAY SOCIAL INTEGRATION & PHYSICAL BOUTIQUE INFO */}
      {/* ========================================================================= */}
      <footer className="border-t border-[#C5A059]/30 bg-[#030c09] text-gray-300 mt-20 pt-12 pb-24 lg:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Col 1: Brand & Slogan */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] via-[#F3E5AB] to-[#99752D] overflow-hidden shrink-0">
                  <img src="/brand-logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-full" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-white text-sm uppercase tracking-wider">
                    {brandSettings.primaryDisplay}
                  </h4>
                  <p className="text-[10px] text-[#C5A059] font-mono tracking-widest uppercase">
                    {brandSettings.secondarySignature}
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#dfbc7a] font-mono tracking-[0.2em] font-semibold">
                &ldquo;{brandSettings.tagline}&rdquo;
              </p>
              <p className="text-xs text-gray-400 leading-relaxed font-light">
                Bridging imperial heritage couture and modern digital commerce. Handcrafted by master karigars in South Punjab, shipped worldwide.
              </p>
            </div>

            {/* Col 2: Physical Store & Atelier (Shifting to Digital) */}
            <div className="space-y-3">
              <span className="text-xs font-serif font-bold uppercase tracking-widest text-[#C5A059] block border-b border-[#C5A059]/20 pb-1">
                Physical Boutique &amp; Atelier
              </span>
              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">{brandSettings.storeAddress}</span>
                    <span className="text-gray-400">{brandSettings.storeCity}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-300 pt-1">
                  <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>{brandSettings.supportPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <ExternalLink className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>{brandSettings.supportEmail}</span>
                </div>
              </div>
            </div>

            {/* Col 3: Two-Way Social Media Channels */}
            <div className="space-y-3">
              <span className="text-xs font-serif font-bold uppercase tracking-widest text-[#C5A059] block border-b border-[#C5A059]/20 pb-1">
                Connect on Social Media
              </span>
              <p className="text-xs text-gray-400 leading-relaxed font-light">
                Follow our official channels for behind-the-scenes karigar videos, real bride showcases, and new design releases.
              </p>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {brandSettings.instagramUrl && (
                  <a
                    href={brandSettings.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-[#051712] border border-[#C5A059]/40 hover:border-[#C5A059] text-pink-400 hover:scale-110 transition-all shadow"
                    title="Follow on Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {brandSettings.facebookUrl && (
                  <a
                    href={brandSettings.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-[#051712] border border-[#C5A059]/40 hover:border-[#C5A059] text-blue-400 hover:scale-110 transition-all shadow"
                    title="Follow on Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {brandSettings.youtubeUrl && (
                  <a
                    href={brandSettings.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-[#051712] border border-[#C5A059]/40 hover:border-[#C5A059] text-red-400 hover:scale-110 transition-all shadow"
                    title="Watch on YouTube"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-[#051712] border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 hover:scale-110 transition-all shadow"
                  title={`Chat on WhatsApp: ${brandSettings.whatsappNumber}`}
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Col 4: Reciprocal Web & Store Link */}
            <div className="space-y-3">
              <span className="text-xs font-serif font-bold uppercase tracking-widest text-[#C5A059] block border-b border-[#C5A059]/20 pb-1">
                From Physical to Digital
              </span>
              <p className="text-xs text-gray-400 leading-relaxed font-light">
                Share our official website on your social profiles so your clients can place custom stitched &amp; unstitched orders online with real-time tracking.
              </p>
              <div className="p-3 rounded-xl bg-[#051712] border border-[#C5A059]/30 text-xs text-[#C5A059] space-y-1">
                <span className="font-mono text-[10px] text-gray-400 block uppercase">WhatsApp Direct Hotline</span>
                <a href={waLink} target="_blank" rel="noreferrer" className="font-mono font-bold text-emerald-400 hover:underline block">
                  {brandSettings.whatsappNumber}
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Department Links */}
          <div className="border-t border-[#C5A059]/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div>
              {brandSettings.officialName} &copy; {new Date().getFullYear()} — All Rights Reserved. Physical Boutique &amp; Digital Atelier.
            </div>
            <div className="flex items-center gap-4 text-gray-400">
              <Link href="/admin" className="hover:text-[#C5A059] transition-colors">
                Admin Management
              </Link>
              <span>&bull;</span>
              <Link href="/designer" className="hover:text-[#C5A059] transition-colors">
                Designer Portal
              </Link>
              <span>&bull;</span>
              <Link href="/production" className="hover:text-[#C5A059] transition-colors">
                Production Floor
              </Link>
              <span>&bull;</span>
              <Link href="/register" className="hover:text-[#C5A059] transition-colors">
                VIP Client Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
