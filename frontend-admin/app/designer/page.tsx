'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PortalGuard from '../../components/PortalGuard';
import { getBackendApiUrl } from '../../lib/api-config';
import {
  ArrowLeft,
  Palette,
  FileText,
  Image as ImageIcon,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  HelpCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';

import { fetchCustomRequestsFromSupabase } from '../../lib/supabase';

interface QuotationItemInput {
  itemTitle: string;
  itemType: string;
  quantity: number;
  unitPrice: number;
}

export default function DesignerStudioPage() {
  const [activeTab, setActiveTab] = useState<
    | 'newRequests'
    | 'assignedRequests'
    | 'clarificationRequests'
    | 'quotationPreparation'
    | 'revisionRequests'
    | 'completedQuotes'
  >('newRequests');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Quotation form state
  const [items, setItems] = useState<QuotationItemInput[]>([
    { itemTitle: 'Pure Silk / Velvet Base Fabric', itemType: 'FABRIC', quantity: 1, unitPrice: 45000 },
    { itemTitle: 'Handcrafted Zardozi & Resham Embroidery', itemType: 'CRAFT', quantity: 1, unitPrice: 65000 },
    { itemTitle: 'Bespoke Atelier Tailoring & Finishing', itemType: 'STITCHING', quantity: 1, unitPrice: 25000 },
  ]);
  const [customizationFee, setCustomizationFee] = useState<number>(10000);
  const [deliveryFee, setDeliveryFee] = useState<number>(3000);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [estimatedMinDays, setEstimatedMinDays] = useState<number>(14);
  const [estimatedMaxDays, setEstimatedMaxDays] = useState<number>(28);
  const [designerNotes, setDesignerNotes] = useState<string>(
    'Haute couture handcrafted piece with genuine gold-plated dabka and freshwater pearl motifs.',
  );
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Server-like calculation for display preview
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const total = Math.max(0, subtotal + Number(customizationFee || 0) + Number(deliveryFee || 0) - Number(discountAmount || 0));

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      // 1. Try backend API first
      let data: any = null;
      try {
        const dashboardUrl = getBackendApiUrl('designer/dashboard');
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(dashboardUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch {
        // Fallback to client data
      }

      // If backend has no requests, load real requests from localStorage and Supabase
      const allRealRequests: any[] = [];
      try {
        const localReqs = localStorage.getItem('khadijah_custom_requests');
        if (localReqs) {
          const parsed = JSON.parse(localReqs);
          if (Array.isArray(parsed)) allRealRequests.push(...parsed);
        }
      } catch (e) {
        console.error('Error loading local custom requests', e);
      }

      try {
        const sbReqs = await fetchCustomRequestsFromSupabase();
        if (sbReqs && Array.isArray(sbReqs)) {
          sbReqs.forEach((r) => {
            if (!allRealRequests.some((x) => x.request_number === r.request_number || x.id === r.id)) {
              allRealRequests.push(r);
            }
          });
        }
      } catch (e) {
        console.error('Error loading Supabase custom requests', e);
      }

      // Map raw custom requests into designer studio format
      const formatted = allRealRequests.map((r, i) => {
        const [fName, ...lParts] = (r.customer_name || 'Bespoke Patron').split(' ');
        return {
          id: r.id || `req-${i}`,
          requestNumber: r.request_number || `REQ-${i + 1}`,
          status: r.status || 'NEW',
          customer: {
            firstName: fName || 'Bespoke',
            lastName: lParts.join(' ') || 'Client',
            email: r.customer_email || '',
            phone: r.customer_phone || '',
          },
          sizingMode: r.stitching_type || 'CUSTOM',
          customerBudget: r.total_amount || 0,
          designNotes: `${r.silhouette || 'Bespoke'} garment in ${r.fabric || 'Fabric'}, Craft: ${r.craft || 'Handwork'}. ${r.special_notes || ''}`,
          silhouette: r.silhouette,
          fabric: r.fabric,
          craft: r.craft,
          colour: r.colour,
        };
      });

      const newReqs = formatted.filter((r) => r.status === 'NEW' || r.status === 'SUBMITTED' || !r.status);
      const assignedReqs = formatted.filter((r) => r.status === 'ASSIGNED');
      const clarificationReqs = formatted.filter((r) => r.status === 'CLARIFICATION');
      const prepReqs = formatted.filter((r) => r.status === 'PREPARING_QUOTE');
      const revisionReqs = formatted.filter((r) => r.status === 'REVISION');
      const completedReqs = formatted.filter((r) => r.status === 'QUOTED' || r.status === 'ACCEPTED');

      const builtData = {
        metrics: {
          newRequestsCount: data?.metrics?.newRequestsCount ?? newReqs.length,
          assignedRequestsCount: data?.metrics?.assignedRequestsCount ?? assignedReqs.length,
          clarificationRequestsCount: data?.metrics?.clarificationRequestsCount ?? clarificationReqs.length,
          quotationPreparationCount: data?.metrics?.quotationPreparationCount ?? prepReqs.length,
          revisionRequestsCount: data?.metrics?.revisionRequestsCount ?? revisionReqs.length,
          completedQuotesCount: data?.metrics?.completedQuotesCount ?? completedReqs.length,
        },
        queues: {
          newRequests: (data?.queues?.newRequests?.length ? data.queues.newRequests : newReqs),
          assignedRequests: (data?.queues?.assignedRequests?.length ? data.queues.assignedRequests : assignedReqs),
          clarificationRequests: (data?.queues?.clarificationRequests?.length ? data.queues.clarificationRequests : clarificationReqs),
          quotationPreparation: (data?.queues?.quotationPreparation?.length ? data.queues.quotationPreparation : prepReqs),
          revisionRequests: (data?.queues?.revisionRequests?.length ? data.queues.revisionRequests : revisionReqs),
          completedQuotes: (data?.queues?.completedQuotes?.length ? data.queues.completedQuotes : completedReqs),
        },
      };

      setDashboardData(builtData);
      if (builtData.queues.newRequests?.length > 0 && !selectedRequest) {
        setSelectedRequest(builtData.queues.newRequests[0]);
      }
    } catch (err) {
      console.error('Failed to load designer dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  const addItemRow = () => {
    setItems([...items, { itemTitle: 'Additional Haute Craft', itemType: 'CRAFT', quantity: 1, unitPrice: 15000 }]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const updateItemField = (idx: number, field: keyof QuotationItemInput, val: any) => {
    const updated = [...items];
    (updated[idx] as any)[field] = val;
    setItems(updated);
  };

  return (
    <PortalGuard
      allowedRoles={['DESIGNER', 'SUPER_ADMIN', 'ADMIN']}
      portalName="Haute Couture Designer Studio"
      portalDescription="Bespoke commission queue, sketch analysis, fabric & craft pricing, and multi-version quotation formulation (V1, V2)."
    >
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#C5A059] hover:underline flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> Operations Hub
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-sm text-gray-300 font-serif">Designer Studio</span>
        </div>

        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#C5A059]/40 bg-[#072A20] text-xs text-[#C5A059] hover:bg-[#0b3d2e]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Queues
        </button>
      </div>

      <header className="mb-8 pb-6 border-b border-[#C5A059]/30 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C5A059] text-xs uppercase tracking-widest font-semibold mb-1">
            <Palette className="w-4 h-4" /> Bespoke Haute Couture Management
          </div>
          <h1 className="text-3xl font-serif text-[#FCFBF7]">Designer Dashboard & Quotation Engine</h1>
          <p className="text-sm text-gray-400 mt-1">
            Review bespoke requests, communicate clarifications, and formulate multi-version quotations (V1, V2, V3...).
          </p>
        </div>
      </header>

      {/* 6 Core Designer Metric Badges */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        {[
          { key: 'newRequests', label: 'New Requests', count: dashboardData?.metrics?.newRequestsCount || 0, icon: AlertCircle, color: 'text-emerald-400 border-emerald-500/30' },
          { key: 'assignedRequests', label: 'Assigned', count: dashboardData?.metrics?.assignedRequestsCount || 0, icon: Palette, color: 'text-amber-400 border-amber-500/30' },
          { key: 'clarificationRequests', label: 'Clarifications', count: dashboardData?.metrics?.clarificationRequestsCount || 0, icon: HelpCircle, color: 'text-blue-400 border-blue-500/30' },
          { key: 'quotationPreparation', label: 'Quote Prep', count: dashboardData?.metrics?.quotationPreparationCount || 0, icon: FileText, color: 'text-yellow-400 border-yellow-500/30' },
          { key: 'revisionRequests', label: 'Revisions (V2+)', count: dashboardData?.metrics?.revisionRequestsCount || 0, icon: RefreshCw, color: 'text-purple-400 border-purple-500/30' },
          { key: 'completedQuotes', label: 'Accepted Quotes', count: dashboardData?.metrics?.completedQuotesCount || 0, icon: CheckCircle2, color: 'text-emerald-400 border-emerald-500/30' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-[#0b3d2e] border-[#C5A059] shadow-lg shadow-black/40'
                  : 'bg-[#051c15]/60 hover:bg-[#072A20] ' + tab.color
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-4 h-4 opacity-80" />
                <span className="text-base font-bold font-mono text-[#FCFBF7]">{tab.count}</span>
              </div>
              <div className="text-xs font-serif text-[#FCFBF7] truncate">{tab.label}</div>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active Requests Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#051c15] p-5 rounded-xl border border-[#C5A059]/30">
            <h2 className="text-base font-serif text-[#FCFBF7] mb-3 flex items-center justify-between">
              <span>Queue: {activeTab.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
              <span className="text-xs font-mono text-[#C5A059]">
                {dashboardData?.queues?.[activeTab]?.length || 0} ITEMS
              </span>
            </h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {dashboardData?.queues?.[activeTab]?.length > 0 ? (
                dashboardData.queues[activeTab].map((req: any) => (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedRequest?.id === req.id
                        ? 'border-[#C5A059] bg-[#072A20] shadow-md'
                        : 'border-gray-800 bg-[#072A20]/40 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono text-[#C5A059]">
                        {req.requestNumber || req.quoteNumber || 'REQ-ITEM'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30">
                        {req.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-[#FCFBF7] mt-1.5">
                      {req.customer?.firstName} {req.customer?.lastName}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {req.designNotes || req.designerNotes || 'No notes attached.'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 text-xs">
                  No requests currently in this stage.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quotation Drafting Workbench & Request Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#051c15] p-6 rounded-xl border border-[#C5A059]/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-800 gap-3">
              <div>
                <h2 className="text-lg font-serif text-[#FCFBF7]">
                  Quotation Engine Workbench
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Target Request: <strong className="text-[#C5A059] font-mono">{selectedRequest?.requestNumber || 'No Commission Selected'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={submitting || !selectedRequest}
                  onClick={() => {
                    if (!selectedRequest) {
                      alert('Please select an active bespoke request from the queue to publish a quotation.');
                      return;
                    }
                    try {
                      const localReqs = localStorage.getItem('khadijah_custom_requests');
                      if (localReqs) {
                        const parsed = JSON.parse(localReqs);
                        const updated = parsed.map((r: any) => {
                          if (r.id === selectedRequest.id || r.request_number === selectedRequest.requestNumber) {
                            return { ...r, status: 'QUOTED', total_amount: total };
                          }
                          return r;
                        });
                        localStorage.setItem('khadijah_custom_requests', JSON.stringify(updated));
                      }
                      alert(`Quotation published for ${selectedRequest.requestNumber}. Total: PKR ${total.toLocaleString()}`);
                      fetchDashboard();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                    !selectedRequest
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-[#C5A059] text-[#072A20] hover:bg-[#d4af37]'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" /> Publish Quotation
                </button>
              </div>
            </div>

            {/* Selected Request Specifications Overview */}
            {selectedRequest && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 p-3.5 rounded-lg bg-[#072A20]/50 border border-gray-800 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-mono">Customer</span>
                  <span className="text-[#FCFBF7] font-medium">{selectedRequest.customer?.firstName} {selectedRequest.customer?.lastName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-mono">Sizing</span>
                  <span className="text-[#FCFBF7] font-medium">{selectedRequest.sizingMode || 'STANDARD'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-mono">Budget</span>
                  <span className="text-[#C5A059] font-mono">PKR {selectedRequest.customerBudget ? Number(selectedRequest.customerBudget).toLocaleString() : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-mono">Current Status</span>
                  <span className="text-emerald-400 font-semibold">{selectedRequest.status}</span>
                </div>
              </div>
            )}

            {/* Dynamic Quotation Items Editor */}
            <div className="space-y-4 my-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#C5A059]">
                  1. Itemized Costing Items (Fabric, Crafts, Tailoring)
                </h3>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="flex items-center gap-1 text-xs text-[#C5A059] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Line Item
                </button>
              </div>

              <div className="space-y-2">
                {items.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded bg-[#072A20]/40 border border-gray-800 text-xs">
                    <input
                      type="text"
                      value={row.itemTitle}
                      onChange={(e) => updateItemField(idx, 'itemTitle', e.target.value)}
                      placeholder="Item Title"
                      className="flex-1 bg-transparent border-b border-gray-700 px-2 py-1 text-[#FCFBF7] focus:outline-none focus:border-[#C5A059]"
                    />
                    <select
                      value={row.itemType}
                      onChange={(e) => updateItemField(idx, 'itemType', e.target.value)}
                      className="bg-[#051c15] text-gray-300 border border-gray-700 rounded px-2 py-1 text-xs"
                    >
                      <option value="FABRIC">Fabric</option>
                      <option value="CRAFT">Craft</option>
                      <option value="STITCHING">Stitching</option>
                      <option value="CUSTOMIZATION">Customization</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => updateItemField(idx, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-14 bg-transparent border-b border-gray-700 px-2 py-1 text-center text-[#FCFBF7]"
                    />
                    <div className="flex items-center gap-1 text-[#C5A059]">
                      <span className="text-[10px]">PKR</span>
                      <input
                        type="number"
                        min="0"
                        value={row.unitPrice}
                        onChange={(e) => updateItemField(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-24 bg-transparent border-b border-gray-700 px-2 py-1 font-mono text-right text-[#FCFBF7]"
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Fees & Discounts Form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5 p-4 rounded-lg bg-[#072A20]/30 border border-gray-800 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Customization Fee (PKR)</label>
                <input
                  type="number"
                  min="0"
                  value={customizationFee}
                  onChange={(e) => setCustomizationFee(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#051c15] border border-gray-700 rounded px-3 py-1.5 text-[#FCFBF7] font-mono"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Delivery / Courier Fee (PKR)</label>
                <input
                  type="number"
                  min="0"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#051c15] border border-gray-700 rounded px-3 py-1.5 text-[#FCFBF7] font-mono"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Discount Amount (PKR)</label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#051c15] border border-gray-700 rounded px-3 py-1.5 text-[#FCFBF7] font-mono"
                />
              </div>
            </div>

            {/* Turnaround Days & Designer Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Estimated Turnaround (Min - Max Days)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={estimatedMinDays}
                    onChange={(e) => setEstimatedMinDays(parseInt(e.target.value) || 7)}
                    className="w-full bg-[#051c15] border border-gray-700 rounded px-3 py-1.5 text-[#FCFBF7] text-center"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    min="1"
                    value={estimatedMaxDays}
                    onChange={(e) => setEstimatedMaxDays(parseInt(e.target.value) || 21)}
                    className="w-full bg-[#051c15] border border-gray-700 rounded px-3 py-1.5 text-[#FCFBF7] text-center"
                  />
                  <span className="text-gray-500">Days</span>
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Designer Notes & Atelier Instructions</label>
                <textarea
                  rows={2}
                  value={designerNotes}
                  onChange={(e) => setDesignerNotes(e.target.value)}
                  className="w-full bg-[#051c15] border border-gray-700 rounded p-2 text-[#FCFBF7] text-xs"
                />
              </div>
            </div>

            {/* Server-Side Calculated Totals Summary Preview */}
            <div className="p-4 rounded-xl bg-[#072A20] border border-[#C5A059]/40 text-xs space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Items Subtotal (Server sum):</span>
                <span className="font-mono text-gray-200">PKR {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Customization & Pattern Fee:</span>
                <span className="font-mono text-gray-200">+ PKR {customizationFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Insured Courier Delivery Fee:</span>
                <span className="font-mono text-gray-200">+ PKR {deliveryFee.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Courtesy Discount:</span>
                  <span className="font-mono">- PKR {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#C5A059]/30 flex justify-between items-center">
                <span className="font-serif text-sm font-bold text-[#FCFBF7]">Total Quotation Amount</span>
                <span className="font-serif text-lg font-bold text-[#C5A059] font-mono">
                  PKR {total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </PortalGuard>
  );
}




