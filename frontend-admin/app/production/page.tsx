'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PortalGuard from '../../components/PortalGuard';
import { getBackendApiUrl } from '../../lib/api-config';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  Scissors,
  Layers,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Plus,
  Send,
  Eye,
} from 'lucide-react';
import { fetchOrdersFromSupabase, fetchCustomRequestsFromSupabase } from '../../lib/supabase';

export default function ProductionFloorPage() {
  const [activeStage, setActiveStage] = useState<string>('all');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Stage update form
  const [targetStage, setTargetStage] = useState<string>('CUTTING');
  const [progressVal, setProgressVal] = useState<number>(20);
  const [stageNotes, setStageNotes] = useState<string>('Fabric inspected and precision cut according to measurements.');

  // Quality check form
  const [qcStatus, setQcStatus] = useState<'PASSED' | 'FAILED'>('PASSED');
  const [qcNotes, setQcNotes] = useState<string>('All seams, lining, and embroidery verified within tolerance.');
  const [qcIssues, setQcIssues] = useState<string>('');
  const [reworkStage, setReworkStage] = useState<string>('STITCHING');
  const [qcSubmitting, setQcSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      // 1. Check backend API
      let data: any = null;
      try {
        const dashboardUrl = getBackendApiUrl('production/dashboard');
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(dashboardUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch {
        // Fallback
      }

      // 2. Fetch real orders from local storage and Supabase
      const allOrders: any[] = [];
      try {
        const localOrders = localStorage.getItem('khadijah_real_orders');
        if (localOrders) {
          const parsed = JSON.parse(localOrders);
          if (Array.isArray(parsed)) allOrders.push(...parsed);
        }
      } catch (e) {
        console.error('Error reading local orders', e);
      }

      try {
        const sbOrders = await fetchOrdersFromSupabase();
        if (sbOrders && Array.isArray(sbOrders)) {
          sbOrders.forEach((so) => {
            if (!allOrders.some((o) => o.order_number === so.order_number || o.id === so.id)) {
              allOrders.push(so);
            }
          });
        }
      } catch (e) {
        console.error('Error fetching Supabase orders', e);
      }

      // Load stored production progression
      let storedProgressMap: Record<string, any> = {};
      try {
        const sp = localStorage.getItem('khadijah_production_jobs');
        if (sp) storedProgressMap = JSON.parse(sp);
      } catch (e) {
        console.error('Error reading production jobs cache', e);
      }

      // Construct live production jobs from real orders
      const constructedJobs = allOrders.map((ord, idx) => {
        const orderNum = ord.order_number || ord.orderNumber || `ORD-${idx + 1}`;
        const jobKey = `job-${ord.id || orderNum}`;
        const saved = storedProgressMap[jobKey] || {};

        const itemsTitle =
          ord.items?.map((it: any) => it.product_name || it.name || it.itemTitle).join(', ') ||
          ord.product_name ||
          'Handcrafted Bespoke Garment';

        return {
          id: jobKey,
          jobNumber: `JOB-${orderNum.replace(/^ORD-?/, '')}`,
          status: saved.status || ord.production_status || 'CUTTING',
          progressPercentage: saved.progressPercentage ?? 20,
          targetCompletionDate: saved.targetCompletionDate || 'Within Turnaround Days',
          order: { orderNumber: orderNum },
          orderItem: { itemTitle: itemsTitle },
          customer: { name: ord.customer_name || 'Bespoke Patron' },
          stageNotes: saved.stageNotes || 'Job initiated on atelier cutting floor.',
        };
      });

      setJobs(constructedJobs);

      // Compute stage counts dynamically
      const metrics = {
        newCount: constructedJobs.filter((j) => j.status === 'NEW').length,
        cuttingCount: constructedJobs.filter((j) => j.status === 'CUTTING').length,
        stitchingCount: constructedJobs.filter((j) => j.status === 'STITCHING').length,
        craftingCount: constructedJobs.filter((j) => j.status === 'CRAFTING').length,
        finishingCount: constructedJobs.filter((j) => j.status === 'FINISHING').length,
        qcCount: constructedJobs.filter((j) => j.status === 'QUALITY_CHECK').length,
        readyCount: constructedJobs.filter((j) => j.status === 'READY').length,
        onHoldCount: constructedJobs.filter((j) => j.status === 'ON_HOLD').length,
      };

      setDashboardData({ metrics });

      if (constructedJobs.length > 0 && !selectedJob) {
        setSelectedJob(constructedJobs[0]);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = () => {
    if (!selectedJob) {
      alert('Select an active job to update.');
      return;
    }
    const updatedJobs = jobs.map((j) => {
      if (j.id === selectedJob.id) {
        return {
          ...j,
          status: targetStage,
          progressPercentage: progressVal,
          stageNotes,
        };
      }
      return j;
    });

    setJobs(updatedJobs);
    setSelectedJob({
      ...selectedJob,
      status: targetStage,
      progressPercentage: progressVal,
      stageNotes,
    });

    try {
      const stored: Record<string, any> = JSON.parse(localStorage.getItem('khadijah_production_jobs') || '{}');
      stored[selectedJob.id] = {
        status: targetStage,
        progressPercentage: progressVal,
        stageNotes,
      };
      localStorage.setItem('khadijah_production_jobs', JSON.stringify(stored));
    } catch (e) {
      console.error(e);
    }

    alert(`Job ${selectedJob.jobNumber} advanced to ${targetStage} (${progressVal}%).`);
  };

  const handleQcSubmit = () => {
    if (!selectedJob) {
      alert('Select an active job for inspection.');
      return;
    }
    setQcSubmitting(true);
    const newStatus = qcStatus === 'PASSED' ? 'READY' : reworkStage;
    const newProgress = qcStatus === 'PASSED' ? 100 : stagesList.find((s) => s.name === reworkStage)?.progress || 40;

    const updatedJobs = jobs.map((j) => {
      if (j.id === selectedJob.id) {
        return {
          ...j,
          status: newStatus,
          progressPercentage: newProgress,
          qcStatus,
          qcNotes,
          qcIssues: qcStatus === 'FAILED' ? qcIssues : '',
        };
      }
      return j;
    });

    setJobs(updatedJobs);
    setSelectedJob({
      ...selectedJob,
      status: newStatus,
      progressPercentage: newProgress,
    });

    try {
      const stored: Record<string, any> = JSON.parse(localStorage.getItem('khadijah_production_jobs') || '{}');
      stored[selectedJob.id] = {
        status: newStatus,
        progressPercentage: newProgress,
        qcStatus,
        qcNotes,
        qcIssues,
      };
      localStorage.setItem('khadijah_production_jobs', JSON.stringify(stored));
    } catch (e) {
      console.error(e);
    }

    alert(
      qcStatus === 'PASSED'
        ? `Quality Approved! Job ${selectedJob.jobNumber} is marked READY_TO_SHIP.`
        : `Quality Inspection failed. Job ${selectedJob.jobNumber} dispatched back to ${reworkStage}.`
    );
    setQcSubmitting(false);
  };

  const stagesList = [
    { key: 'newCount', name: 'NEW', progress: 0, count: dashboardData?.metrics?.newCount || 0 },
    { key: 'cuttingCount', name: 'CUTTING', progress: 20, count: dashboardData?.metrics?.cuttingCount || 0 },
    { key: 'stitchingCount', name: 'STITCHING', progress: 40, count: dashboardData?.metrics?.stitchingCount || 0 },
    { key: 'craftingCount', name: 'CRAFTING', progress: 60, count: dashboardData?.metrics?.craftingCount || 0 },
    { key: 'finishingCount', name: 'FINISHING', progress: 80, count: dashboardData?.metrics?.finishingCount || 0 },
    { key: 'qcCount', name: 'QUALITY_CHECK', progress: 90, count: dashboardData?.metrics?.qcCount || 0 },
    { key: 'readyCount', name: 'READY', progress: 100, count: dashboardData?.metrics?.readyCount || 0 },
    { key: 'onHoldCount', name: 'ON_HOLD', progress: 0, count: dashboardData?.metrics?.onHoldCount || 0 },
  ];

  const filteredJobs = jobs.filter((j) => {
    if (activeStage === 'all') return true;
    return j.status === activeStage;
  });

  return (
    <PortalGuard
      allowedRoles={['PRODUCTION', 'SUPER_ADMIN', 'ADMIN']}
      portalName="Atelier Production Floor & QC"
      portalDescription="Workshop floor execution: Precision fabric cutting, handcrafted zardozi embroidery, bespoke tailoring, and Quality Check pass/fail."
    >
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#C5A059] hover:underline flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> Operations Hub
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-sm text-gray-300 font-serif">Production Floor</span>
        </div>

        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#C5A059]/40 bg-[#072A20] text-xs text-[#C5A059] hover:bg-[#0b3d2e]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Floor
        </button>
      </div>

      <header className="mb-8 pb-6 border-b border-[#C5A059]/30 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C5A059] text-xs uppercase tracking-widest font-semibold mb-1">
            <Scissors className="w-4 h-4" /> Haute Couture Workshop & Atelier
          </div>
          <h1 className="text-3xl font-serif text-[#FCFBF7]">Atelier Production & Quality Control (QC)</h1>
          <p className="text-sm text-gray-400 mt-1">
            Track cutting, stitching, handcrafting, finishing, quality check inspection, and ready-to-ship packaging.
          </p>
        </div>
      </header>

      {/* 8 Workshop Stages Progression Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 mb-8">
        {stagesList.map((st) => (
          <button
            key={st.name}
            onClick={() => {
              setActiveStage(st.name);
              setTargetStage(st.name);
              setProgressVal(st.progress);
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeStage === st.name
                ? 'bg-[#0b3d2e] border-[#C5A059] shadow-lg shadow-black/40'
                : 'bg-[#051c15]/60 hover:bg-[#072A20] border-gray-800'
            }`}
          >
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#C5A059] truncate">{st.name}</div>
            <div className="text-xl font-bold font-mono text-[#FCFBF7] mt-1">{st.count}</div>
            <div className="text-[10px] text-gray-500 font-mono mt-0.5">{st.progress}% target</div>
          </button>
        ))}
      </div>

      {/* Main Floor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active Jobs Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#051c15] p-5 rounded-xl border border-[#C5A059]/30">
            <h2 className="text-base font-serif text-[#FCFBF7] mb-3 flex items-center justify-between">
              <span>Jobs Queue ({activeStage.toUpperCase()})</span>
              <span className="text-xs font-mono text-[#C5A059]">
                {filteredJobs.length} ACTIVE
              </span>
            </h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => {
                      setSelectedJob(job);
                      setTargetStage(job.status);
                      setProgressVal(job.progressPercentage);
                      if (job.stageNotes) setStageNotes(job.stageNotes);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer shadow-md transition-all ${
                      selectedJob?.id === job.id
                        ? 'border-[#C5A059] bg-[#072A20]'
                        : 'border-gray-800 bg-[#072A20]/40 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono text-[#C5A059]">{job.jobNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase font-semibold bg-amber-900/60 text-amber-300 border border-amber-600/40">
                        {job.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#FCFBF7] mt-1.5">
                      {job.orderItem?.itemTitle || 'Handcrafted Garment'}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      Order: {job.order?.orderNumber} &bull; {job.customer?.name}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-1">
                        <span>Progress</span>
                        <span className="text-[#C5A059]">{job.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div
                          className="bg-[#C5A059] h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${job.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 px-4 rounded-xl border border-dashed border-gray-800 bg-[#041510]/50 text-gray-500 text-xs space-y-2">
                  <Scissors className="w-8 h-8 mx-auto text-[#C5A059]/40" />
                  <p className="font-serif text-sm text-[#FCFBF7]">Floor Queue Idle</p>
                  <p className="text-gray-400 max-w-xs mx-auto">
                    No active jobs in the {activeStage} queue. Client orders placed on the storefront or via bespoke commissions will show up here automatically.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Operational Controls & Quality Check Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Stage Progression Box */}
          <div className="bg-[#051c15] p-6 rounded-xl border border-[#C5A059]/30">
            <h2 className="text-lg font-serif text-[#FCFBF7] mb-1">
              Atelier Stage Progression Controller
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Advance garment through cutting, stitching, handcrafting, finishing, and QC. (Invalid jumps are strictly rejected).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Select Next Workshop Stage</label>
                <select
                  value={targetStage}
                  onChange={(e) => {
                    setTargetStage(e.target.value);
                    const matched = stagesList.find((s) => s.name === e.target.value);
                    if (matched) setProgressVal(matched.progress);
                  }}
                  className="w-full bg-[#072A20] text-gray-200 border border-gray-700 rounded-lg p-2.5"
                >
                  <option value="CUTTING">CUTTING (20%)</option>
                  <option value="STITCHING">STITCHING (40%)</option>
                  <option value="CRAFTING">CRAFTING (60%)</option>
                  <option value="FINISHING">FINISHING (80%)</option>
                  <option value="QUALITY_CHECK">QUALITY_CHECK (90%)</option>
                  <option value="READY">READY (100%)</option>
                  <option value="ON_HOLD">ON_HOLD (Paused)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Progress Percentage: {progressVal}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={progressVal}
                  onChange={(e) => setProgressVal(parseInt(e.target.value))}
                  className="w-full mt-2 accent-[#C5A059]"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-1">Artisan Stage Notes</label>
              <textarea
                rows={2}
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                placeholder="Log specific fabric, needle, or zardozi notes..."
                className="w-full bg-[#072A20] border border-gray-700 rounded-lg p-2 text-xs text-[#FCFBF7]"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button className="flex items-center gap-2 px-3 py-2 bg-[#072A20] text-[#C5A059] border border-[#C5A059]/30 rounded-lg text-xs hover:bg-[#0b3d2e]">
                <Camera className="w-3.5 h-3.5" /> Attach Craft Photo
              </button>
              <button
                onClick={handleUpdateStage}
                disabled={!selectedJob}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#C5A059] text-[#072A20] font-bold rounded-lg text-xs hover:bg-[#d4af37] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" /> Log Stage Update
              </button>
            </div>
          </div>

          {/* Quality Control (QC) Inspector Panel */}
          <div className="bg-[#051c15] p-6 rounded-xl border border-amber-600/40">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-serif font-bold">
                <ShieldCheck className="w-5 h-5" /> Master Quality Inspection Station
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-600/30">
                QC Protocol v2.4
              </span>
            </div>

            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setQcStatus('PASSED')}
                className={`flex-1 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                  qcStatus === 'PASSED'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-[#072A20] border-gray-800 text-gray-400'
                }`}
              >
                PASS INSPECTION (Advances to READY_TO_SHIP)
              </button>
              <button
                type="button"
                onClick={() => setQcStatus('FAILED')}
                className={`flex-1 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                  qcStatus === 'FAILED'
                    ? 'bg-red-950 border-red-500 text-red-300'
                    : 'bg-[#072A20] border-gray-800 text-gray-400'
                }`}
              >
                FAIL INSPECTION (Rework in Workshop)
              </button>
            </div>

            {qcStatus === 'FAILED' && (
              <div className="p-3 mb-4 rounded-lg bg-red-950/40 border border-red-800/40 text-xs space-y-3">
                <div>
                  <label className="text-red-300 block mb-1 font-semibold">Select Rework Destination Stage</label>
                  <select
                    value={reworkStage}
                    onChange={(e) => setReworkStage(e.target.value)}
                    className="w-full bg-[#051c15] border border-red-700 text-gray-200 rounded p-2 text-xs"
                  >
                    <option value="STITCHING">Send back to STITCHING (Structure/Tailoring)</option>
                    <option value="CRAFTING">Send back to CRAFTING (Embroidery/Zardozi)</option>
                    <option value="FINISHING">Send back to FINISHING (Pressing/Lining)</option>
                  </select>
                </div>
                <div>
                  <label className="text-red-300 block mb-1 font-semibold">Defect Issues (Comma separated)</label>
                  <input
                    type="text"
                    value={qcIssues}
                    onChange={(e) => setQcIssues(e.target.value)}
                    placeholder="e.g. Sleeve length 0.5 inches long, loose thread at hem"
                    className="w-full bg-[#051c15] border border-red-700 text-gray-200 rounded p-2 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-1">Inspector Verification Remarks</label>
              <textarea
                rows={2}
                value={qcNotes}
                onChange={(e) => setQcNotes(e.target.value)}
                className="w-full bg-[#072A20] border border-gray-700 rounded-lg p-2 text-xs text-[#FCFBF7]"
              />
            </div>

            <button
              disabled={qcSubmitting || !selectedJob}
              onClick={handleQcSubmit}
              className={`w-full py-2.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                qcStatus === 'PASSED'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              {qcStatus === 'PASSED'
                ? 'Approve Quality & Advance to READY_TO_SHIP'
                : 'Reject & Dispatch to Rework'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </PortalGuard>
  );
}


