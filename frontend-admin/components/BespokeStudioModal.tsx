'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Scissors, Palette, Ruler, CheckCircle2, ArrowRight, ArrowLeft, Upload, FileText } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCommission: (data: any) => void;
}

export const BespokeStudioModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmitCommission,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [silhouette, setSilhouette] = useState('Bridal Peshwas');
  const [fabric, setFabric] = useState('Micro Velvet 9000');
  const [craft, setCraft] = useState('24k Metallic Tilla & Antique Zardozi');
  const [colour, setColour] = useState('Imperial Emerald');
  const [measurements, setMeasurements] = useState({
    chest: '36',
    waist: '30',
    hip: '40',
    shoulder: '14.5',
    sleeve: '22',
    length: '54',
  });
  const [notes, setNotes] = useState('');
  const [clientName, setClientName] = useState(user?.name || '');

  useEffect(() => {
    if (user?.name && !clientName) {
      setClientName(user.name);
    }
  }, [user]);

  if (!isOpen) return null;

  const silhouettes = [
    { name: 'Bridal Peshwas', desc: 'Regal flared silhouette paired with lehenga and silk dupatta' },
    { name: 'Farshi Gharara', desc: 'Traditional royal nawabi trailing gharara with hand-worked border' },
    { name: 'Modern Lehnga Choli', desc: 'Sculpted choli with expansive geometric kalidar skirt' },
    { name: 'Angrakha Ensemble', desc: 'Overlapping asymmetric bodice with metallic dori tassels' },
    { name: 'Pure Raw Silk Kurta', desc: 'Minimalist luxury formal kurta with intricate hand-embroidered neckline' },
  ];

  const fabrics = [
    'Micro Velvet 9000',
    'Pure Loomed Organza Silk',
    'Raw Silk 80g',
    'Chiffon Georgette',
    'Pure Tissue Silk Metallic',
  ];

  const crafts = [
    '24k Metallic Tilla & Antique Zardozi',
    'Hand-Cut Gotapatti & Resham Threadwork',
    'Freshwater Pearls & Fine Dabka Motifs',
    'Mirror Work & French Knots',
  ];

  const colours = [
    'Imperial Emerald (#072A20)',
    'Royal Crimson Ruby',
    'Antique Champagne Gold',
    'Midnight Noir',
    'Pastel Dusty Rose',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitCommission({
      silhouette,
      fabric,
      craft,
      colour,
      measurements,
      notes,
      clientName,
    });
    alert(`Bespoke commission request registered! Our lead designer will formulate an official quotation with fabric swatches.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#051712] border border-[#C5A059]/40 rounded-3xl overflow-hidden shadow-2xl text-[#FCFBF7] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-[#072A20] border-b border-[#C5A059]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">Create Your Own Dress</h3>
              <p className="text-xs text-[#FCFBF7]/60">Step {step} of 4: Custom Made Just For You</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#051712] hover:bg-[#0b3d2e] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex bg-[#040e0b] border-b border-[#C5A059]/20 px-6 py-2.5 text-xs text-center">
          <span className={`flex-1 py-1 font-serif ${step >= 1 ? 'text-[#C5A059] font-bold' : 'text-gray-600'}`}>
            1. Style
          </span>
          <span className={`flex-1 py-1 font-serif ${step >= 2 ? 'text-[#C5A059] font-bold' : 'text-gray-600'}`}>
            2. Fabric &amp; Work
          </span>
          <span className={`flex-1 py-1 font-serif ${step >= 3 ? 'text-[#C5A059] font-bold' : 'text-gray-600'}`}>
            3. Measurements
          </span>
          <span className={`flex-1 py-1 font-serif ${step >= 4 ? 'text-[#C5A059] font-bold' : 'text-gray-600'}`}>
            4. Review &amp; Submit
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="font-serif text-base text-white">Choose Your Dress Style</h4>
              <div className="space-y-2.5">
                {silhouettes.map((s) => (
                  <div
                    key={s.name}
                    onClick={() => setSilhouette(s.name)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      silhouette === s.name
                        ? 'bg-[#072A20] border-[#C5A059] shadow-lg shadow-[#C5A059]/10'
                        : 'bg-[#051712] border-[#C5A059]/20 hover:border-[#C5A059]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="font-serif text-sm text-white">{s.name}</strong>
                      {silhouette === s.name && <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h4 className="font-serif text-sm text-[#C5A059] uppercase tracking-wider mb-2">Choose Fabric</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fabrics.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFabric(f)}
                      className={`p-3 rounded-xl border text-xs font-serif text-left transition-all ${
                        fabric === f
                          ? 'bg-[#072A20] border-[#C5A059] text-white font-bold'
                          : 'bg-[#051712] border-[#C5A059]/20 text-gray-400'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-serif text-sm text-[#C5A059] uppercase tracking-wider mb-2">Choose Embroidery / Handwork</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {crafts.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCraft(c)}
                      className={`p-3 rounded-xl border text-xs font-serif text-left transition-all ${
                        craft === c
                          ? 'bg-[#072A20] border-[#C5A059] text-white font-bold'
                          : 'bg-[#051712] border-[#C5A059]/20 text-gray-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-serif text-sm text-[#C5A059] uppercase tracking-wider mb-2">Choose Color</h4>
                <div className="flex flex-wrap gap-2">
                  {colours.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setColour(col)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-serif transition-all ${
                        colour === col
                          ? 'bg-[#C5A059] text-[#051712] font-bold border-[#C5A059]'
                          : 'bg-[#051712] border-[#C5A059]/20 text-gray-300'
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-base text-white flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-[#C5A059]" /> Your Measurements (Inches)
                </h4>
                <span className="text-[11px] text-[#C5A059] font-mono">Inches (")</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-gray-400 block mb-1">Chest (")</label>
                  <input
                    type="number"
                    value={measurements.chest}
                    onChange={(e) => setMeasurements({ ...measurements, chest: e.target.value })}
                    className="w-full bg-[#072A20] border border-[#C5A059]/30 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Waist (")</label>
                  <input
                    type="number"
                    value={measurements.waist}
                    onChange={(e) => setMeasurements({ ...measurements, waist: e.target.value })}
                    className="w-full bg-[#072A20] border border-[#C5A059]/30 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Hips (")</label>
                  <input
                    type="number"
                    value={measurements.hip}
                    onChange={(e) => setMeasurements({ ...measurements, hip: e.target.value })}
                    className="w-full bg-[#072A20] border border-[#C5A059]/30 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Shoulder Width (")</label>
                  <input
                    type="number"
                    value={measurements.shoulder}
                    onChange={(e) => setMeasurements({ ...measurements, shoulder: e.target.value })}
                    className="w-full bg-[#072A20] border border-[#C5A059]/30 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Sleeve Length (")</label>
                  <input
                    type="number"
                    value={measurements.sleeve}
                    onChange={(e) => setMeasurements({ ...measurements, sleeve: e.target.value })}
                    className="w-full bg-[#072A20] border border-[#C5A059]/30 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Dress Length (")</label>
                  <input
                    type="number"
                    value={measurements.length}
                    onChange={(e) => setMeasurements({ ...measurements, length: e.target.value })}
                    className="w-full bg-[#072A20] border border-[#C5A059]/30 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 block text-xs mb-1">Special Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g., My height is 5 ft 6 in, please make sleeves full length, need delivery before wedding date..."
                  className="w-full bg-[#072A20] border border-[#C5A059]/30 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h4 className="font-serif text-base text-white">Review Your Custom Order</h4>
              <div className="p-4 bg-[#072A20] border border-[#C5A059]/30 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">Dress Style:</span> <strong className="text-white font-serif">{silhouette}</strong></div>
                <div className="flex justify-between"><span className="text-gray-400">Fabric:</span> <strong className="text-white font-serif">{fabric}</strong></div>
                <div className="flex justify-between"><span className="text-gray-400">Handwork:</span> <strong className="text-white font-serif">{craft}</strong></div>
                <div className="flex justify-between"><span className="text-gray-400">Color:</span> <strong className="text-white font-serif">{colour}</strong></div>
                <div className="flex justify-between"><span className="text-gray-400">Measurements:</span> <span className="font-mono text-[#C5A059]">{measurements.chest}" Chest &bull; {measurements.waist}" Waist &bull; {measurements.hip}" Hip &bull; {measurements.length}" Length</span></div>
                {notes && <div className="pt-2 border-t border-[#C5A059]/20 text-gray-300 italic">"{notes}"</div>}
              </div>

              <div>
                <label className="text-xs text-[#C5A059] uppercase font-serif font-bold block mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#072A20] border border-[#C5A059]/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 sm:p-6 bg-[#072A20] border-t border-[#C5A059]/30 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 bg-[#051712] hover:bg-[#0b3d2e] border border-[#C5A059]/30 rounded-xl text-xs text-gray-300 flex items-center gap-1.5 transition-all font-serif"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 bg-[#C5A059] hover:bg-[#dfbc7a] text-[#051712] font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-lg"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-gradient-to-r from-[#C5A059] via-[#dfbc7a] to-amber-600 text-[#051712] font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-xl shadow-[#C5A059]/20 hover:brightness-110"
            >
              <Sparkles className="w-4 h-4 text-[#051712]" /> Submit Custom Order Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
