'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PortalGuard from '../../components/PortalGuard';
import {
  ArrowLeft,
  PhoneCall,
  MessageCircle,
  Calendar,
  Plus,
  Clock,
  Sparkles,
  CheckCircle,
  TrendingUp,
  FileText,
  User,
  ShieldCheck,
  Mail,
  Send,
  ExternalLink,
} from 'lucide-react';

interface LeadItem {
  id: string;
  leadNumber: string;
  firstName: string;
  lastName: string;
  contactPhone: string;
  contactEmail?: string;
  leadSource: string;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'VIP';
  inquiryMessage?: string;
  estimatedValue?: number;
  lastContactedAt?: string;
  scheduledAt?: string;
  activitiesCount: number;
}

export default function AgentCrmPage() {
  const [activeTab, setActiveTab] = useState<
    'TODAY' | 'NEW' | 'FOLLOW_UPS' | 'INTERESTED' | 'CUSTOM' | 'QUOTES' | 'CONVERTED'
  >('TODAY');

  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState('WHATSAPP');
  const [activitySummary, setActivitySummary] = useState('');
  const [activityNotes, setActivityNotes] = useState('');

  // Sample production-aligned state for active Concierge Agent
  const [leads, setLeads] = useState<LeadItem[]>([
    {
      id: 'lead-01',
      leadNumber: 'LED-202609-0012',
      firstName: 'Amina',
      lastName: 'Tariq',
      contactPhone: '+923001234567',
      contactEmail: 'amina.t@example.com',
      leadSource: 'WhatsApp',
      status: 'NEW',
      priority: 'VIP',
      inquiryMessage: 'Interested in bespoke bridal lehenga with zardozi embroidery for December wedding.',
      estimatedValue: 450000,
      activitiesCount: 2,
    },
    {
      id: 'lead-02',
      leadNumber: 'LED-202609-0008',
      firstName: 'Zoya',
      lastName: 'Rehman',
      contactPhone: '+923219876543',
      contactEmail: 'zoya.r@example.com',
      leadSource: 'Instagram',
      status: 'CONTACTED',
      priority: 'HIGH',
      inquiryMessage: 'Requested velvet formal peshwas customization details and fabric swatches.',
      estimatedValue: 185000,
      scheduledAt: 'Today, 4:00 PM',
      activitiesCount: 4,
    },
    {
      id: 'lead-03',
      leadNumber: 'LED-202609-0004',
      firstName: 'Sarah',
      lastName: 'Khan',
      contactPhone: '+923335551234',
      contactEmail: 'sarah.k@example.com',
      leadSource: 'Website',
      status: 'CUSTOM_REQUEST',
      priority: 'VIP',
      inquiryMessage: 'Submitted custom design request CYO-202609-0001 with 3 moodboard inspiration images.',
      estimatedValue: 320000,
      activitiesCount: 6,
    },
    {
      id: 'lead-04',
      leadNumber: 'LED-202609-0002',
      firstName: 'Hira',
      lastName: 'Mansoor',
      contactPhone: '+923451122334',
      contactEmail: 'hira.m@example.com',
      leadSource: 'Referral',
      status: 'CONVERTED',
      priority: 'VIP',
      inquiryMessage: 'Quotation V2 accepted. Converted to Order ORD-202609-0001.',
      estimatedValue: 280000,
      activitiesCount: 9,
    },
  ]);

  const metrics = {
    todaysLeadsCount: 5,
    newLeadsCount: 3,
    followUpsCount: 4,
    interestedCount: 6,
    customRequestsCount: 2,
    quotesCount: 3,
    conversionsCount: 8,
  };

  const handleLogActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    alert(`Activity logged: [${activityType}] ${activitySummary} for ${selectedLead.firstName} ${selectedLead.lastName}`);
    setActivityModalOpen(false);
    setActivitySummary('');
    setActivityNotes('');
  };

  return (
    <PortalGuard
      allowedRoles={['AGENT', 'SUPER_ADMIN', 'ADMIN']}
      portalName="Fashion CRM & Concierge Agent Hub"
      portalDescription="Omnichannel lead management, high-touch WhatsApp contact logs, consultation scheduling, and custom design conversions."
    >
      <div className="min-h-screen p-8 max-w-7xl mx-auto text-[#FCFBF7]">
      {/* Navigation */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="text-[#C5A059] hover:underline flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Operations Hub
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-sm text-gray-400">Luxury Clienteling CRM & Agent Pipeline</span>
      </div>

      {/* Header */}
      <header className="mb-8 pb-6 border-b border-[#C5A059]/30 flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-medium">Bespoke Sales & Concierge</span>
          <h1 className="text-3xl font-serif text-[#FCFBF7] mt-1">High-Touch Client Pipeline</h1>
          <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Agent: Fatima Bibi (Concierge)
            </span>
            <span>•</span>
            <span className="text-[#C5A059]">Active Workload: 8 / 30 Capacity</span>
            <span>•</span>
            <span className="text-blue-400">Conversion Rate: 34.8%</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('New Lead submission drawer opening...')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#C5A059] text-[#072A20] rounded-lg text-sm font-semibold hover:bg-[#d4af37] transition shadow-lg shadow-[#C5A059]/20"
          >
            <Plus className="w-4 h-4" /> Quick Ingest Lead
          </button>
        </div>
      </header>

      {/* Agent 7 Pipeline Queues / Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {[
          { key: 'TODAY', label: "Today's Inquiries", count: metrics.todaysLeadsCount, icon: Clock, color: 'text-amber-400' },
          { key: 'NEW', label: 'New Uncontacted', count: metrics.newLeadsCount, icon: Sparkles, color: 'text-blue-400' },
          { key: 'FOLLOW_UPS', label: 'Follow-ups Due', count: metrics.followUpsCount, icon: Calendar, color: 'text-purple-400' },
          { key: 'INTERESTED', label: 'High Interest', count: metrics.interestedCount, icon: TrendingUp, color: 'text-orange-400' },
          { key: 'CUSTOM', label: 'Custom Requests', count: metrics.customRequestsCount, icon: FileText, color: 'text-yellow-400' },
          { key: 'QUOTES', label: 'Quotes / Neg.', count: metrics.quotesCount, icon: Send, color: 'text-indigo-400' },
          { key: 'CONVERTED', label: 'Conversions', count: metrics.conversionsCount, icon: CheckCircle, color: 'text-emerald-400' },
        ].map((queue) => {
          const Icon = queue.icon;
          const isActive = activeTab === queue.key;
          return (
            <button
              key={queue.key}
              onClick={() => setActiveTab(queue.key as any)}
              className={`p-3.5 rounded-xl border text-left transition ${
                isActive
                  ? 'bg-[#072A20] border-[#C5A059] shadow-md shadow-[#C5A059]/20'
                  : 'bg-[#051c15] border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${queue.color}`} />
                <span className="text-lg font-bold text-[#FCFBF7] font-serif">{queue.count}</span>
              </div>
              <div className="text-[11px] font-medium text-gray-400 mt-2 truncate">{queue.label}</div>
            </button>
          );
        })}
      </div>

      {/* Main Workspace: Leads Table & Detail Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Lead List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#051c15] p-5 rounded-2xl border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-serif text-[#FCFBF7]">Active Client Inquiries</h2>
              <span className="text-xs text-[#C5A059] bg-[#C5A059]/10 px-3 py-1 rounded-full border border-[#C5A059]/30">
                Agent Isolation Active: Showing Only Assigned Clients
              </span>
            </div>

            <div className="space-y-3">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    selectedLead?.id === lead.id
                      ? 'bg-[#072A20] border-[#C5A059]'
                      : 'bg-[#041510] border-gray-800/80 hover:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#C5A059]">{lead.leadNumber}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                          {lead.leadSource}
                        </span>
                        {lead.priority === 'VIP' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50">
                            VIP
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-medium text-[#FCFBF7] mt-1">
                        {lead.firstName} {lead.lastName}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{lead.inquiryMessage}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-[#C5A059]">
                        PKR {lead.estimatedValue ? (lead.estimatedValue / 1000).toFixed(0) + 'k' : 'Custom'}
                      </div>
                      <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 uppercase tracking-wider">
                        {lead.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800/60 text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <span>{lead.contactPhone}</span>
                      {lead.scheduledAt && (
                        <span className="text-purple-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {lead.scheduledAt}
                        </span>
                      )}
                    </div>
                    <span>{lead.activitiesCount} interactions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Lead Detail & Quick Concierge Actions */}
        <div className="space-y-4">
          {selectedLead ? (
            <div className="bg-[#051c15] p-5 rounded-2xl border border-gray-800 sticky top-8">
              <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                <div>
                  <span className="text-xs font-mono text-[#C5A059]">{selectedLead.leadNumber}</span>
                  <h2 className="text-xl font-serif text-[#FCFBF7] mt-1">
                    {selectedLead.firstName} {selectedLead.lastName}
                  </h2>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                  {selectedLead.status}
                </span>
              </div>

              {/* Direct Outreach Integration Buttons */}
              <div className="grid grid-cols-2 gap-2 my-4">
                <a
                  href={`https://wa.me/${selectedLead.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Salam ${selectedLead.firstName}, this is Fatima from KHADIJAH-TUL-QUBRAH BY Meer&Mus atelier. We received your bespoke design inquiry!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-semibold transition"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp Client
                </a>

                <a
                  href={`tel:${selectedLead.contactPhone}`}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-semibold transition"
                >
                  <PhoneCall className="w-4 h-4" /> Direct Phone
                </a>
              </div>

              {/* Lead Details */}
              <div className="space-y-3 text-xs text-gray-300 py-3 border-y border-gray-800">
                <div className="flex justify-between">
                  <span className="text-gray-500">Source:</span>
                  <span className="text-[#FCFBF7] font-medium">{selectedLead.leadSource}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-[#FCFBF7]">{selectedLead.contactEmail || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Estimated Value:</span>
                  <span className="text-[#C5A059] font-bold">
                    PKR {selectedLead.estimatedValue ? selectedLead.estimatedValue.toLocaleString() : 'Pending Quote'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Inquiry Brief:</span>
                  <p className="bg-[#041510] p-3 rounded-lg border border-gray-800/80 text-gray-300 italic">
                    "{selectedLead.inquiryMessage}"
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setActivityModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 p-2.5 bg-[#C5A059] text-[#072A20] rounded-xl text-xs font-semibold hover:bg-[#d4af37] transition shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Interaction Activity
                </button>

                <button
                  onClick={() => alert(`Advancing ${selectedLead.leadNumber} to Custom Request / Quote Creation`)}
                  className="w-full flex items-center justify-center gap-2 p-2.5 bg-[#072A20] text-[#C5A059] border border-[#C5A059]/40 rounded-xl text-xs font-semibold hover:bg-[#09372a] transition"
                >
                  <FileText className="w-3.5 h-3.5" /> Create Custom Design Request
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#051c15] p-8 rounded-2xl border border-gray-800 text-center text-gray-400">
              <User className="w-8 h-8 mx-auto text-gray-600 mb-2" />
              <p className="text-sm">Select a client inquiry from the left to view notes and log contact activities.</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Logging Modal */}
      {activityModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#051c15] border border-[#C5A059]/40 p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-serif text-[#FCFBF7] mb-1">Log Client Interaction</h3>
            <p className="text-xs text-gray-400 mb-4">
              Recording audit trail for {selectedLead.firstName} {selectedLead.lastName} ({selectedLead.leadNumber})
            </p>

            <form onSubmit={handleLogActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Interaction Type</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full bg-[#041510] border border-gray-700 rounded-lg p-2.5 text-xs text-[#FCFBF7] focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="WHATSAPP">WhatsApp Message / Audio Note</option>
                  <option value="CALL">Phone Call</option>
                  <option value="EMAIL">Email Correspondence</option>
                  <option value="MEETING">Atelier In-Person Consultation</option>
                  <option value="NOTE">Internal Observation Note</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Summary Heading</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discussed pure silk fabric choices & zardozi border"
                  value={activitySummary}
                  onChange={(e) => setActivitySummary(e.target.value)}
                  className="w-full bg-[#041510] border border-gray-700 rounded-lg p-2.5 text-xs text-[#FCFBF7] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Detailed Discussion Notes</label>
                <textarea
                  rows={3}
                  placeholder="Client confirmed event date is 24th December. Preferred emerald green base..."
                  value={activityNotes}
                  onChange={(e) => setActivityNotes(e.target.value)}
                  className="w-full bg-[#041510] border border-gray-700 rounded-lg p-2.5 text-xs text-[#FCFBF7] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActivityModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#C5A059] text-[#072A20] hover:bg-[#d4af37]"
                >
                  Save Activity Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </PortalGuard>
  );
}

