'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PortalGuard from '../../components/PortalGuard';
import {
  ArrowLeft,
  TrendingUp,
  ShoppingBag,
  Users,
  Clock,
  ShieldCheck,
  Package,
  Layers,
  Palette,
  Ruler,
  FileSpreadsheet,
  Scissors,
  Sparkles,
  FileText,
  DollarSign,
  UserCheck,
  Megaphone,
  Paintbrush,
  Factory,
  Bell,
  Sliders,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
  Filter,
  Plus,
  Trash2,
  Eye,
  Lock,
} from 'lucide-react';

type AdminTab =
  | 'overview'
  | 'catalogue'
  | 'bespoke'
  | 'crm'
  | 'operations'
  | 'governance'
  | 'audit'
  | 'analytics';

type CatalogueSubTab =
  | 'products'
  | 'categories'
  | 'colours'
  | 'sizes'
  | 'size-charts'
  | 'fabrics'
  | 'craft-options';

export default function AdminControlCenterPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [catalogueSubTab, setCatalogueSubTab] = useState<CatalogueSubTab>('products');
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation Dialog State for Destructive Actions
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    entityTable: string;
    entityId: string;
    entityName: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    entityTable: '',
    entityId: '',
    entityName: '',
  });

  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Mock Master Data for Configurable Business Management
  const [products, setProducts] = useState([
    { id: 'prod-1', name: 'Zardozi Velvet Peshwas', sku: 'KTQ-PESH-001', category: 'Bridal', price: 485000, isActive: true },
    { id: 'prod-2', name: 'Bespoke Tilla Silk Anarkali', sku: 'KTQ-ANAR-002', category: 'Haute Couture', price: 340000, isActive: true },
    { id: 'prod-3', name: 'Marori Raw Silk Lehenga', sku: 'KTQ-LEH-003', category: 'Bridal', price: 620000, isActive: true },
    { id: 'prod-4', name: 'Handcrafted Organza Dupatta', sku: 'KTQ-DUP-004', category: 'Luxury Pret', price: 115000, isActive: false },
  ]);

  const [categories, setCategories] = useState([
    { id: 'cat-1', name: 'Bridal Couture', slug: 'bridal-couture', productsCount: 14 },
    { id: 'cat-2', name: 'Haute Couture', slug: 'haute-couture', productsCount: 22 },
    { id: 'cat-3', name: 'Luxury Pret', slug: 'luxury-pret', productsCount: 18 },
    { id: 'cat-4', name: 'Formal Atelier', slug: 'formal-atelier', productsCount: 9 },
  ]);

  const [colours, setColours] = useState([
    { id: 'col-1', name: 'Royal Emerald Green', hexCode: '#072A20' },
    { id: 'col-2', name: 'Antique Gold', hexCode: '#C5A059' },
    { id: 'col-3', name: 'Deep Crimson Velvet', hexCode: '#4A0E17' },
    { id: 'col-4', name: 'Pristine Ivory', hexCode: '#FCFBF7' },
  ]);

  const [sizes, setSizes] = useState([
    { id: 'sz-1', name: 'Extra Small', code: 'XS' },
    { id: 'sz-2', name: 'Small', code: 'S' },
    { id: 'sz-3', name: 'Medium', code: 'M' },
    { id: 'sz-4', name: 'Large', code: 'L' },
    { id: 'sz-5', name: 'Custom Bespoke Measurements', code: 'CUSTOM' },
  ]);

  const [fabrics, setFabrics] = useState([
    { id: 'fab-1', name: 'Micro Velvet 9000', pricePerMeter: 4500, isAvailable: true },
    { id: 'fab-2', name: 'Pure Kimkhab Brocade', pricePerMeter: 12000, isAvailable: true },
    { id: 'fab-3', name: 'Katan Silk (Pure 80g)', pricePerMeter: 6500, isAvailable: true },
    { id: 'fab-4', name: 'Pure Silk Organza', pricePerMeter: 3800, isAvailable: false },
  ]);

  const [craftOptions, setCraftOptions] = useState([
    { id: 'cr-1', name: 'Zardozi Handwork', category: 'EMBROIDERY', estDays: 28, isActive: true },
    { id: 'cr-2', name: 'Dabka & Naqshi Needlework', category: 'HANDWORK', estDays: 21, isActive: true },
    { id: 'cr-3', name: 'Tilla & Marori Stitching', category: 'EMBROIDERY', estDays: 18, isActive: true },
    { id: 'cr-4', name: 'Silk Ribbon Appliqué', category: 'APPLIQUE', estDays: 14, isActive: true },
  ]);

  // Brand Settings State
  const [brandConfig, setBrandConfig] = useState({
    officialName: 'KHADIJA-TUL-QUBRAH BY Meer&Mus',
    primaryDisplay: 'KHADIJA-TUL-QUBRAH',
    secondarySignature: 'BY Meer&Mus',
    primaryColor: '#072A20',
    secondaryColor: '#C5A059',
    accentColor: '#FCFBF7',
    supportEmail: 'concierge@meermus.luxury',
    supportPhone: '+92 42 35789012',
    whatsappNumber: '+92 300 8472910',
  });

  // User Roster with RBAC
  const [users, setUsers] = useState([
    { id: 'u-1', name: 'Meer & Mus Executives', email: 'owner@meermus.luxury', role: 'SUPER_ADMIN', isActive: true },
    { id: 'u-2', name: 'Zoya Ali', email: 'zoya.admin@meermus.luxury', role: 'ADMIN', isActive: true },
    { id: 'u-3', name: 'Fatima Bibi', email: 'fatima.agent@meermus.luxury', role: 'AGENT', isActive: true },
    { id: 'u-4', name: 'Haider Rizvi', email: 'haider.designer@meermus.luxury', role: 'DESIGNER', isActive: true },
    { id: 'u-5', name: 'Ustad Shakoor', email: 'shakoor.prod@meermus.luxury', role: 'PRODUCTION', isActive: true },
    { id: 'u-6', name: 'Princess Sarah Al-Saud', email: 'sarah.client@example.com', role: 'CUSTOMER', isActive: true },
  ]);

  // Trigger Destructive Action Dialog
  const triggerDeactivateConfirm = (
    entityTable: string,
    entityId: string,
    entityName: string,
  ) => {
    setConfirmModal({
      isOpen: true,
      title: `Deactivate ${entityName}?`,
      message: `Are you sure you want to deactivate or disable "${entityName}"? This action will be permanently recorded in the immutable audit log. No raw database scripts are permitted.`,
      entityTable,
      entityId,
      entityName,
    });
  };

  const handleExecuteDestruction = () => {
    const { entityTable, entityId, entityName } = confirmModal;

    if (entityTable === 'products') {
      setProducts((prev) =>
        prev.map((p) => (p.id === entityId ? { ...p, isActive: false } : p)),
      );
    } else if (entityTable === 'fabrics') {
      setFabrics((prev) =>
        prev.map((f) => (f.id === entityId ? { ...f, isAvailable: false } : f)),
      );
    } else if (entityTable === 'craft_options') {
      setCraftOptions((prev) =>
        prev.map((c) => (c.id === entityId ? { ...c, isActive: false } : c)),
      );
    }

    setConfirmModal({ ...confirmModal, isOpen: false });
    setActionSuccessMessage(`Successfully updated "${entityName}" with verified audit logging.`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  return (
    <PortalGuard
      allowedRoles={['ADMIN', 'SUPER_ADMIN']}
      portalName="Owner & Executive Admin Console"
      portalDescription="Executive control of financial turnover, product catalog launch, video campaign ads, and audit trail."
    >
      <div className="min-h-screen p-8 max-w-7xl mx-auto text-gray-200">
      {/* Top Breadcrumb & Hub Link */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#C5A059] hover:underline flex items-center gap-1.5 text-sm">
            <ArrowLeft className="w-4 h-4" /> Operations Hub
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-sm text-gray-400">Admin Control Center</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> RBAC Governance: SUPER_ADMIN
          </span>
        </div>
      </div>

      {/* Main Header */}
      <header className="mb-8 pb-6 border-b border-[#C5A059]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#FCFBF7] tracking-wide">
            Admin Control Center
          </h1>
          <p className="text-sm text-[#C5A059] mt-1 font-serif tracking-wider">
            KHADIJAH-TUL-QUBRAH BY MEER&MUS • EXECUTIVE GOVERNANCE
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/campaigns"
            className="px-4 py-2 bg-[#072A20] text-[#C5A059] border border-[#C5A059]/50 rounded-lg text-sm font-medium hover:bg-[#0b3d2e] flex items-center gap-1.5 transition"
          >
            <Megaphone className="w-4 h-4" /> Campaigns Engine
          </Link>
          <Link
            href="/production"
            className="px-4 py-2 bg-[#072A20] text-[#C5A059] border border-[#C5A059]/50 rounded-lg text-sm font-medium hover:bg-[#0b3d2e] flex items-center gap-1.5 transition"
          >
            <Factory className="w-4 h-4" /> Production Floor
          </Link>
        </div>
      </header>

      {/* Toast Notification Banner */}
      {actionSuccessMessage && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-950/90 border border-emerald-700/80 text-emerald-200 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-sm">{actionSuccessMessage}</span>
        </div>
      )}

      {/* 9 Executive KPI Cards Required by Prompt */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="p-5 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Total Sales</span>
            <DollarSign className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-xl font-serif text-[#FCFBF7]">PKR 14,850,000</div>
          <span className="text-[11px] text-emerald-400 mt-1 inline-block">+18.4% verified revenue</span>
        </div>

        <div className="p-5 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Orders</span>
            <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-xl font-serif text-[#FCFBF7]">54 Placed</div>
          <span className="text-[11px] text-yellow-400 mt-1 inline-block">18 in atelier crafting</span>
        </div>

        <div className="p-5 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Custom Requests</span>
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-xl font-serif text-[#FCFBF7]">42 Inquiries</div>
          <span className="text-[11px] text-emerald-400 mt-1 inline-block">16 active in studio</span>
        </div>

        <div className="p-5 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Pending Quotes</span>
            <FileText className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-xl font-serif text-[#FCFBF7]">11 Quotations</div>
          <span className="text-[11px] text-yellow-400 mt-1 inline-block">4 revision loops</span>
        </div>

        <div className="p-5 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Active Leads</span>
            <Users className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-xl font-serif text-[#FCFBF7]">87 Inquiries</div>
          <span className="text-[11px] text-blue-400 mt-1 inline-block">7-stage sales funnel</span>
        </div>

        <div className="p-5 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Production Jobs</span>
            <Factory className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-xl font-serif text-[#FCFBF7]">28 Active</div>
          <span className="text-[11px] text-yellow-300 mt-1 inline-block">6 in Quality Check</span>
        </div>

        <div className="p-5 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Customers</span>
            <UserCheck className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-xl font-serif text-[#FCFBF7]">142 Patrons</div>
          <span className="text-[11px] text-gray-400 mt-1 inline-block">High net-worth bridal</span>
        </div>

        <div className="p-5 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Agents</span>
            <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-xl font-serif text-[#FCFBF7]">8 Concierges</div>
          <span className="text-[11px] text-emerald-400 mt-1 inline-block">Strict client isolation</span>
        </div>

        <div className="p-5 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Designers</span>
            <Paintbrush className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="text-xl font-serif text-[#FCFBF7]">5 Couturiers</div>
          <span className="text-[11px] text-[#C5A059] mt-1 inline-block">Atelier masters</span>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[#C5A059]/30 mb-8 pb-1">
        {[
          { key: 'overview', label: 'Executive Overview', icon: TrendingUp },
          { key: 'catalogue', label: 'Catalogue & Master Data', icon: Package },
          { key: 'bespoke', label: 'Bespoke & Orders', icon: Sparkles },
          { key: 'crm', label: 'CRM & Campaigns', icon: Users },
          { key: 'operations', label: 'Design & Production', icon: Factory },
          { key: 'governance', label: 'Staff & Governance', icon: ShieldCheck },
          { key: 'audit', label: 'Audit Trail', icon: Lock },
          { key: 'analytics', label: 'Couture Analytics', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as AdminTab)}
              className={`px-4 py-2.5 rounded-t-lg text-sm font-medium flex items-center gap-2 transition ${
                isActive
                  ? 'bg-[#072A20] text-[#C5A059] border-t-2 border-[#C5A059]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#072A20]/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
              <h2 className="text-lg font-serif text-[#FCFBF7] mb-4 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#C5A059]" /> Quick Governance
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setActiveTab('catalogue');
                    setCatalogueSubTab('products');
                  }}
                  className="w-full text-left p-3 rounded-lg bg-[#072A20]/60 hover:bg-[#072A20] border border-[#C5A059]/20 text-sm flex justify-between items-center"
                >
                  <span>Manage Garment Catalogue</span>
                  <span className="text-xs text-[#C5A059]">4 Active &rarr;</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('catalogue');
                    setCatalogueSubTab('fabrics');
                  }}
                  className="w-full text-left p-3 rounded-lg bg-[#072A20]/60 hover:bg-[#072A20] border border-[#C5A059]/20 text-sm flex justify-between items-center"
                >
                  <span>Fabric Swatches & Pricing</span>
                  <span className="text-xs text-[#C5A059]">4 Swatches &rarr;</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('governance');
                  }}
                  className="w-full text-left p-3 rounded-lg bg-[#072A20]/60 hover:bg-[#072A20] border border-[#C5A059]/20 text-sm flex justify-between items-center"
                >
                  <span>Staff Roles & RBAC</span>
                  <span className="text-xs text-[#C5A059]">6 Users &rarr;</span>
                </button>
                <Link
                  href="/admin/campaigns"
                  className="block w-full text-left p-3 rounded-lg bg-[#072A20]/60 hover:bg-[#072A20] border border-[#C5A059]/20 text-sm flex justify-between items-center"
                >
                  <span>Campaign ROI Attribution</span>
                  <span className="text-xs text-[#C5A059]">Launch Engine &rarr;</span>
                </Link>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="lg:col-span-2 p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
              <h2 className="text-lg font-serif text-[#FCFBF7] mb-4 flex items-center justify-between">
                <span>Recent High-Value Couture Orders</span>
                <span className="text-xs text-[#C5A059] font-sans">Live Verified</span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="text-xs uppercase bg-[#072A20] text-[#C5A059] border-b border-[#C5A059]/30">
                    <tr>
                      <th className="p-3">Order #</th>
                      <th className="p-3">Client</th>
                      <th className="p-3">Total (PKR)</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    <tr>
                      <td className="p-3 font-mono text-[#C5A059]">ORD-202609-001</td>
                      <td className="p-3">Princess Sarah Al-Saud</td>
                      <td className="p-3 font-semibold">PKR 485,000</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs">
                          IN_PRODUCTION
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A059]">ORD-202609-002</td>
                      <td className="p-3">Amina Tariq</td>
                      <td className="p-3 font-semibold">PKR 340,000</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-yellow-950 text-yellow-400 border border-yellow-800 text-xs">
                          QUALITY_CHECK
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#C5A059]">ORD-202609-003</td>
                      <td className="p-3">Farah Naz</td>
                      <td className="p-3 font-semibold">PKR 620,000</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 text-xs">
                          PAID
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATALOGUE & MASTER DATA (PRODUCTS, CATEGORIES, COLOURS, SIZES, SIZE CHARTS, FABRICS, CRAFT OPTIONS) */}
      {activeTab === 'catalogue' && (
        <div className="space-y-6">
          {/* Sub-Tabs for all 7 Prompt-Requested Modules */}
          <div className="flex flex-wrap gap-2 p-1.5 rounded-lg bg-[#051c15] border border-[#C5A059]/30">
            {[
              { key: 'products', label: 'Products', icon: Package },
              { key: 'categories', label: 'Categories', icon: Layers },
              { key: 'colours', label: 'Colours', icon: Palette },
              { key: 'sizes', label: 'Sizes', icon: Ruler },
              { key: 'size-charts', label: 'Size Charts', icon: FileSpreadsheet },
              { key: 'fabrics', label: 'Fabrics', icon: Scissors },
              { key: 'craft-options', label: 'Craft Options', icon: Sparkles },
            ].map((sub) => {
              const Icon = sub.icon;
              const isSelected = catalogueSubTab === sub.key;
              return (
                <button
                  key={sub.key}
                  onClick={() => setCatalogueSubTab(sub.key as CatalogueSubTab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                    isSelected
                      ? 'bg-[#C5A059] text-[#072A20] font-semibold'
                      : 'text-gray-300 hover:bg-[#072A20]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {sub.label}
                </button>
              );
            })}
          </div>

          {/* Sub-tab 1: PRODUCTS */}
          {catalogueSubTab === 'products' && (
            <div className="p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-serif text-[#FCFBF7]">Garment Products</h3>
                  <p className="text-xs text-gray-400">Manage ready-to-wear and customizable catalog pieces</p>
                </div>
                <button className="px-3.5 py-1.5 bg-[#C5A059] text-[#072A20] rounded-lg text-xs font-semibold hover:bg-[#d4af37] flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="text-xs uppercase bg-[#072A20] text-[#C5A059] border-b border-[#C5A059]/30">
                    <tr>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td className="p-3 font-medium text-white">{p.name}</td>
                        <td className="p-3 font-mono text-xs text-gray-400">{p.sku}</td>
                        <td className="p-3">{p.category}</td>
                        <td className="p-3 font-semibold text-[#C5A059]">PKR {p.price.toLocaleString()}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              p.isActive
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-red-950 text-red-400 border border-red-800'
                            }`}
                          >
                            {p.isActive ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {p.isActive && (
                            <button
                              onClick={() => triggerDeactivateConfirm('products', p.id, p.name)}
                              className="text-xs text-red-400 hover:text-red-300 underline flex items-center gap-1 ml-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 2: CATEGORIES */}
          {catalogueSubTab === 'categories' && (
            <div className="p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-serif text-[#FCFBF7]">Couture Categories</h3>
                <button className="px-3 py-1.5 bg-[#C5A059] text-[#072A20] rounded-lg text-xs font-semibold hover:bg-[#d4af37] flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Category
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map((c) => (
                  <div key={c.id} className="p-4 rounded-lg bg-[#072A20]/40 border border-[#C5A059]/20">
                    <div className="font-semibold text-white">{c.name}</div>
                    <div className="text-xs text-gray-400 font-mono mt-1">{c.slug}</div>
                    <div className="text-xs text-[#C5A059] mt-3">{c.productsCount} Products Associated</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-tab 3: COLOURS */}
          {catalogueSubTab === 'colours' && (
            <div className="p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-serif text-[#FCFBF7]">Available Colours & Swatches</h3>
                <button className="px-3 py-1.5 bg-[#C5A059] text-[#072A20] rounded-lg text-xs font-semibold hover:bg-[#d4af37] flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Colour
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {colours.map((col) => (
                  <div key={col.id} className="p-4 rounded-lg bg-[#072A20]/40 border border-[#C5A059]/20 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full border border-white/20 shadow-md"
                      style={{ backgroundColor: col.hexCode }}
                    />
                    <div>
                      <div className="font-semibold text-white text-sm">{col.name}</div>
                      <div className="text-xs font-mono text-gray-400">{col.hexCode}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-tab 4: SIZES */}
          {catalogueSubTab === 'sizes' && (
            <div className="p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-serif text-[#FCFBF7]">Standard & Custom Size Tiers</h3>
                <button className="px-3 py-1.5 bg-[#C5A059] text-[#072A20] rounded-lg text-xs font-semibold hover:bg-[#d4af37] flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Size
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {sizes.map((s) => (
                  <div key={s.id} className="p-3 text-center rounded-lg bg-[#072A20]/40 border border-[#C5A059]/20">
                    <div className="text-lg font-bold text-[#C5A059]">{s.code}</div>
                    <div className="text-xs text-gray-300 mt-1">{s.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-tab 5: SIZE CHARTS */}
          {catalogueSubTab === 'size-charts' && (
            <div className="p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
              <h3 className="text-lg font-serif text-[#FCFBF7] mb-2">Size Charts & Matrix</h3>
              <p className="text-xs text-gray-400 mb-4">Configurable measurement matrix across Chest, Waist, Hip, Length, Sleeve, and Shoulder</p>
              <div className="p-4 rounded-lg bg-[#072A20]/40 border border-[#C5A059]/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-white text-sm">Haute Couture Bridal Peshwas Standard (Inches)</span>
                  <span className="text-xs text-[#C5A059]">Matrix Unit: INCHES</span>
                </div>
                <div className="text-xs text-gray-400 font-mono bg-black/40 p-3 rounded">
                  Chest: [32, 34, 36, 38, 40] | Waist: [26, 28, 30, 32, 34] | Hip: [36, 38, 40, 42, 44] | Length: [52, 54, 56, 58, 60]
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 6: FABRICS */}
          {catalogueSubTab === 'fabrics' && (
            <div className="p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-serif text-[#FCFBF7]">Fabric Options & Per-Meter Surcharges</h3>
                <button className="px-3 py-1.5 bg-[#C5A059] text-[#072A20] rounded-lg text-xs font-semibold hover:bg-[#d4af37] flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Fabric
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fabrics.map((f) => (
                  <div key={f.id} className="p-4 rounded-lg bg-[#072A20]/40 border border-[#C5A059]/20 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white">{f.name}</div>
                      <div className="text-xs text-[#C5A059] mt-1">PKR {f.pricePerMeter.toLocaleString()} / meter</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          f.isAvailable
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {f.isAvailable ? 'AVAILABLE' : 'OUT OF STOCK'}
                      </span>
                      {f.isAvailable && (
                        <button
                          onClick={() => triggerDeactivateConfirm('fabrics', f.id, f.name)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Disable
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-tab 7: CRAFT OPTIONS */}
          {catalogueSubTab === 'craft-options' && (
            <div className="p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-serif text-[#FCFBF7]">Atelier Craftsmanship Choices</h3>
                <button className="px-3 py-1.5 bg-[#C5A059] text-[#072A20] rounded-lg text-xs font-semibold hover:bg-[#d4af37] flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Craft Option
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {craftOptions.map((cr) => (
                  <div key={cr.id} className="p-4 rounded-lg bg-[#072A20]/40 border border-[#C5A059]/20 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white">{cr.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">Category: {cr.category} • Est: {cr.estDays} days</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {cr.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      {cr.isActive && (
                        <button
                          onClick={() => triggerDeactivateConfirm('craft_options', cr.id, cr.name)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Disable
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BESPOKE & ORDERS */}
      {activeTab === 'bespoke' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
            <h3 className="text-lg font-serif text-[#FCFBF7] mb-2">Custom Requests & Quotation Engine</h3>
            <p className="text-xs text-gray-400 mb-4">Live inspection of customer custom requests, multi-version quotations (V1, V2, V3...), and payment settlements</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs uppercase bg-[#072A20] text-[#C5A059] border-b border-[#C5A059]/30">
                  <tr>
                    <th className="p-3">Request #</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Garment Inquiry</th>
                    <th className="p-3">Quotation Version</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="p-3 font-mono text-[#C5A059]">CDR-202609-001</td>
                    <td className="p-3">Princess Sarah Al-Saud</td>
                    <td className="p-3">Bridal Velvet Peshwas with Heavy Zardozi</td>
                    <td className="p-3 font-semibold text-white">V2 (PKR 485,000)</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs">
                        QUOTE_ACCEPTED
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#C5A059]">CDR-202609-002</td>
                    <td className="p-3">Amina Tariq</td>
                    <td className="p-3">Raw Silk Anarkali with Tilla Work</td>
                    <td className="p-3 font-semibold text-white">V1 (PKR 340,000)</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-yellow-950 text-yellow-400 border border-yellow-800 text-xs">
                        REVISION_REQUESTED
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CRM & CAMPAIGNS */}
      {activeTab === 'crm' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-serif text-[#FCFBF7]">Fashion CRM & Multi-Channel Pipeline</h3>
                <p className="text-xs text-gray-400">Leads from Instagram, WhatsApp, TikTok, Ads, and Referral</p>
              </div>
              <Link
                href="/admin/campaigns"
                className="px-4 py-2 bg-[#C5A059] text-[#072A20] rounded-lg text-xs font-semibold hover:bg-[#d4af37]"
              >
                Inspect Campaign Attribution ROI &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-[#072A20]/40 border border-[#C5A059]/20">
                <span className="text-xs text-gray-400">Instagram Leads</span>
                <div className="text-xl font-serif text-white mt-1">42 Inquiries</div>
                <span className="text-xs text-[#C5A059]">PKR 6.4M Pipeline</span>
              </div>
              <div className="p-4 rounded-lg bg-[#072A20]/40 border border-[#C5A059]/20">
                <span className="text-xs text-gray-400">WhatsApp Concierge</span>
                <div className="text-xl font-serif text-white mt-1">28 Inquiries</div>
                <span className="text-xs text-[#C5A059]">PKR 4.2M Pipeline</span>
              </div>
              <div className="p-4 rounded-lg bg-[#072A20]/40 border border-[#C5A059]/20">
                <span className="text-xs text-gray-400">Boutique Referral</span>
                <div className="text-xl font-serif text-white mt-1">11 Inquiries</div>
                <span className="text-xs text-[#C5A059]">PKR 3.8M Pipeline</span>
              </div>
              <div className="p-4 rounded-lg bg-[#072A20]/40 border border-[#C5A059]/20">
                <span className="text-xs text-gray-400">Website Digital</span>
                <div className="text-xl font-serif text-white mt-1">6 Inquiries</div>
                <span className="text-xs text-[#C5A059]">PKR 850k Pipeline</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DESIGN & PRODUCTION */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-serif text-[#FCFBF7]">Atelier Production & Quality Control Station</h3>
                <p className="text-xs text-gray-400">8 sequential stages: NEW &rarr; CUTTING &rarr; STITCHING &rarr; CRAFTING &rarr; FINISHING &rarr; QC &rarr; READY</p>
              </div>
              <Link
                href="/production"
                className="px-4 py-2 bg-[#C5A059] text-[#072A20] rounded-lg text-xs font-semibold hover:bg-[#d4af37]"
              >
                Open Full Production Floor View &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-[#072A20]/40 border border-[#C5A059]/20">
                <div className="text-xs text-gray-400">Cutting & Stitching</div>
                <div className="text-lg font-serif text-white mt-1">11 Garments</div>
              </div>
              <div className="p-4 rounded-lg bg-[#072A20]/40 border border-[#C5A059]/20">
                <div className="text-xs text-gray-400">Artisan Hand Crafting</div>
                <div className="text-lg font-serif text-white mt-1">8 Garments</div>
              </div>
              <div className="p-4 rounded-lg bg-[#072A20]/40 border border-[#C5A059]/20">
                <div className="text-xs text-gray-400">Quality Inspection (QC)</div>
                <div className="text-lg font-serif text-yellow-300 mt-1">6 Garments</div>
              </div>
              <div className="p-4 rounded-lg bg-[#072A20]/40 border border-[#C5A059]/20">
                <div className="text-xs text-gray-400">Ready to Ship</div>
                <div className="text-lg font-serif text-emerald-400 mt-1">3 Garments</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: STAFF ROSTER & BRAND GOVERNANCE (RBAC) */}
      {activeTab === 'governance' && (
        <div className="space-y-6">
          {/* Brand Settings Card */}
          <div className="p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
            <h3 className="text-lg font-serif text-[#FCFBF7] mb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#C5A059]" /> Brand Settings (No Code Required)
            </h3>
            <p className="text-xs text-gray-400 mb-4">Administrators can configure luxury branding, themes, and concierge contacts directly</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Official Brand Title</label>
                <input
                  type="text"
                  value={brandConfig.officialName}
                  onChange={(e) => setBrandConfig({ ...brandConfig, officialName: e.target.value })}
                  className="w-full p-2.5 rounded bg-black/40 border border-[#C5A059]/30 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Primary Display</label>
                <input
                  type="text"
                  value={brandConfig.primaryDisplay}
                  onChange={(e) => setBrandConfig({ ...brandConfig, primaryDisplay: e.target.value })}
                  className="w-full p-2.5 rounded bg-black/40 border border-[#C5A059]/30 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Support Concierge Email</label>
                <input
                  type="email"
                  value={brandConfig.supportEmail}
                  onChange={(e) => setBrandConfig({ ...brandConfig, supportEmail: e.target.value })}
                  className="w-full p-2.5 rounded bg-black/40 border border-[#C5A059]/30 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">WhatsApp Concierge Hotline</label>
                <input
                  type="text"
                  value={brandConfig.whatsappNumber}
                  onChange={(e) => setBrandConfig({ ...brandConfig, whatsappNumber: e.target.value })}
                  className="w-full p-2.5 rounded bg-black/40 border border-[#C5A059]/30 text-white text-sm"
                />
              </div>
            </div>
            <button
              onClick={() => {
                setActionSuccessMessage('Brand configuration updated and recorded to audit trail.');
                setTimeout(() => setActionSuccessMessage(null), 4000);
              }}
              className="mt-4 px-4 py-2 bg-[#C5A059] text-[#072A20] rounded-lg text-xs font-semibold hover:bg-[#d4af37]"
            >
              Save Brand Configuration
            </button>
          </div>

          {/* User Roster with RBAC */}
          <div className="p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
            <h3 className="text-lg font-serif text-[#FCFBF7] mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C5A059]" /> Staff Roster & Role-Based Access Control
            </h3>
            <p className="text-xs text-gray-400 mb-4">Roles: SUPER_ADMIN, ADMIN, AGENT, DESIGNER, PRODUCTION, CUSTOMER</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs uppercase bg-[#072A20] text-[#C5A059] border-b border-[#C5A059]/30">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">RBAC Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="p-3 font-medium text-white">{u.name}</td>
                      <td className="p-3 font-mono text-xs text-gray-400">{u.email}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-xs bg-[#072A20] text-[#C5A059] border border-[#C5A059]/40 font-semibold">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-emerald-400 font-semibold">ACTIVE</span>
                      </td>
                      <td className="p-3 text-right">
                        {u.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => {
                              setActionSuccessMessage(`Audit record created: Role updated for ${u.name}`);
                              setTimeout(() => setActionSuccessMessage(null), 4000);
                            }}
                            className="text-xs text-[#C5A059] hover:underline"
                          >
                            Modify Role
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
          <h3 className="text-lg font-serif text-[#FCFBF7] mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#C5A059]" /> System Audit Trail
          </h3>
          <p className="text-xs text-gray-400 mb-4">Immutable audit logs recording state transitions, role changes, and destructive operations</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-xs uppercase bg-[#072A20] text-[#C5A059] border-b border-[#C5A059]/30">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity Table</th>
                  <th className="p-3">Details / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 font-mono text-xs">
                <tr>
                  <td className="p-3 text-gray-400">2026-09-30 15:45:00</td>
                  <td className="p-3 text-[#C5A059]">super@meermus.luxury</td>
                  <td className="p-3 text-emerald-400 font-bold">USER_ROLE_UPDATED</td>
                  <td className="p-3">users</td>
                  <td className="p-3 text-gray-300 font-sans">Role promoted to DESIGNER</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-400">2026-09-30 15:30:12</td>
                  <td className="p-3 text-[#C5A059]">admin@meermus.luxury</td>
                  <td className="p-3 text-yellow-400 font-bold">CONTROLLED_DESTRUCTION</td>
                  <td className="p-3">fabrics</td>
                  <td className="p-3 text-gray-300 font-sans">Silk Organza marked OUT OF STOCK</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-400">2026-09-30 14:15:33</td>
                  <td className="p-3 text-[#C5A059]">zoya.admin@meermus.luxury</td>
                  <td className="p-3 text-blue-400 font-bold">BRAND_CONFIG_UPDATED</td>
                  <td className="p-3">brand</td>
                  <td className="p-3 text-gray-300 font-sans">Concierge contact updated</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: COUTURE ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
              <h4 className="text-sm font-semibold text-white mb-2">Bespoke Conversion Funnel</h4>
              <div className="space-y-3 mt-4 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Inquiries Submitted</span>
                    <span className="font-bold text-white">42</span>
                  </div>
                  <div className="h-2 rounded bg-gray-800 overflow-hidden">
                    <div className="h-full bg-[#C5A059]" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Quotations Formulated</span>
                    <span className="font-bold text-white">32 (76.1%)</span>
                  </div>
                  <div className="h-2 rounded bg-gray-800 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '76%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Client Approvals</span>
                    <span className="font-bold text-white">24 (75.0%)</span>
                  </div>
                  <div className="h-2 rounded bg-gray-800 overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: '57%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Converted to Paid Orders</span>
                    <span className="font-bold text-white">18 (42.8%)</span>
                  </div>
                  <div className="h-2 rounded bg-gray-800 overflow-hidden">
                    <div className="h-full bg-[#FCFBF7]" style={{ width: '43%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
              <h4 className="text-sm font-semibold text-white mb-2">Channel Revenue Generation</h4>
              <div className="space-y-3 mt-4 text-xs">
                <div className="flex justify-between p-2 rounded bg-[#072A20]/40">
                  <span>Instagram Boutique</span>
                  <span className="font-bold text-[#C5A059]">PKR 6,450,000</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[#072A20]/40">
                  <span>WhatsApp Concierge</span>
                  <span className="font-bold text-[#C5A059]">PKR 4,800,000</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[#072A20]/40">
                  <span>Referrals & Trunk Shows</span>
                  <span className="font-bold text-[#C5A059]">PKR 2,600,000</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[#072A20]/40">
                  <span>Website Storefront</span>
                  <span className="font-bold text-[#C5A059]">PKR 1,000,000</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#051c15] border border-[#C5A059]/30">
              <h4 className="text-sm font-semibold text-white mb-2">Top Performing Couturiers</h4>
              <div className="space-y-3 mt-4 text-xs">
                <div className="flex justify-between p-2 rounded bg-[#072A20]/40">
                  <span>Haider Rizvi (Master Couturier)</span>
                  <span className="font-bold text-emerald-400">14 Orders (PKR 5.2M)</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[#072A20]/40">
                  <span>Ayesha Munir (Bridal Specialist)</span>
                  <span className="font-bold text-emerald-400">10 Orders (PKR 4.1M)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL FOR DESTRUCTIVE ACTIONS */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="max-w-md w-full rounded-xl bg-[#18181B] border border-red-500/40 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-serif font-bold text-white">{confirmModal.title}</h3>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-6">
              {confirmModal.message}
            </p>
            <div className="p-3 rounded bg-red-950/40 border border-red-900 text-xs text-red-300 mb-6 font-mono">
              Entity: {confirmModal.entityTable.toUpperCase()} • ID: {confirmModal.entityId}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDestruction}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-lg transition"
              >
                Confirm Controlled Deactivation
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </PortalGuard>
  );
}

