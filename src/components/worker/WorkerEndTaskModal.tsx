import React, { useState } from 'react';
import { ReportItem } from '../../types';
import { ImageUploader } from '../common/ImageUploader';
import { CheckCircle2, AlertCircle, X, ShieldCheck, Camera, Truck, Clock } from 'lucide-react';
import { authFetch } from '../../utils/api';

interface WorkerEndTaskModalProps {
  task: ReportItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const WorkerEndTaskModal: React.FC<WorkerEndTaskModalProps> = ({
  task,
  onClose,
  onSuccess,
}) => {
  // Form state
  const [collectionImages, setCollectionImages] = useState<string[]>([]);
  const [workerVerificationImage, setWorkerVerificationImage] = useState<string>('');
  const [completionNotes, setCompletionNotes] = useState<string>(
    'Curb thoroughly swept and disinfected with chlorine powder. Rubbish loaded onto tipper truck.'
  );
  const [wasteQuantityEstimate, setWasteQuantityEstimate] = useState<string>(
    'Approx. 150-250 kg (Standard Tipper Load)'
  );
  const [consentGiven, setConsentGiven] = useState<boolean>(true);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleAddSampleWorkerVerification = () => {
    const sampleWorkerPhoto = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="40" y="80" width="520" height="260" rx="12" fill="%23e2e8f0"/><circle cx="300" cy="180" r="50" fill="%23285943"/><path d="M220 290 C220 230 380 230 380 290 Z" fill="%231e4533"/><rect x="270" y="235" width="60" height="40" rx="4" fill="%23fbbf24"/><text x="282" y="260" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23000">VEST</text><text x="50" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23334155">Worker On-Site Clearance Verification Photo</text><text x="50" y="370" font-family="monospace" font-size="14" fill="%23475569">Timestamp: ${new Date().toLocaleTimeString()} · Site: Cleared</text></svg>`;
    setWorkerVerificationImage(sampleWorkerPhoto);
  };

  const handleAddSampleClearedPhotos = () => {
    const c1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23f0fdf4"/><rect x="40" y="80" width="520" height="260" rx="12" fill="%23dcfce7"/><circle cx="120" cy="140" r="40" fill="%2386efac"/><path d="M160 220 L240 280 L440 140" stroke="%2316a34a" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="50" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23166534">Cleared Angle 1: Sidewalk Swept Clean</text><text x="50" y="370" font-family="monospace" font-size="14" fill="%2315803d">100% Debris Removed</text></svg>`;
    const c2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23f0fdf4"/><rect x="40" y="80" width="520" height="260" rx="12" fill="%23bbf7d0"/><path d="M60 300 L220 240 L380 290 L540 230" stroke="%2322c55e" stroke-width="12" fill="none"/><text x="50" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23166534">Cleared Angle 2: Wide Curb Perspective</text><text x="50" y="370" font-family="monospace" font-size="14" fill="%2315803d">Site Inspection Passed</text></svg>`;
    const c3 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23f0fdf4"/><rect x="40" y="80" width="520" height="260" rx="12" fill="%23dcfce7"/><rect x="180" y="140" width="240" height="140" rx="10" fill="%23285943"/><text x="230" y="220" font-family="sans-serif" font-size="22" font-weight="bold" fill="%23ffffff">TRUCK LOADED</text><text x="50" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23166534">Cleared Angle 3: Tipper Truck Container Filled</text><text x="50" y="370" font-family="monospace" font-size="14" fill="%2315803d">Disposal Batch Confirmed</text></svg>`;
    setCollectionImages([c1, c2, c3]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Strict validation requirement A: At least 3 collection photographs
    if (collectionImages.length < 3) {
      setErrorMsg('Strict Requirement: Exactly or at least three (3) distinct photographs of the cleared site are required.');
      return;
    }

    // Strict validation requirement B: 1 Worker Verification Photograph
    if (!workerVerificationImage) {
      setErrorMsg('Strict Requirement: One (1) worker verification photograph at the cleared site is required.');
      return;
    }

    if (!consentGiven) {
      setErrorMsg('Please confirm worker consent for administrative verification photo record.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await authFetch(`/api/worker/tasks/${task.reportId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionImages,
          workerVerificationImage,
          completionNotes,
          wasteQuantityEstimate,
          consentGiven,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
      } else {
        setErrorMsg(data.message || 'Validation failed on server.');
      }
    } catch (err) {
      setErrorMsg('Network error while completing task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full my-8 border border-[#E1E5DF] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E1E5DF] bg-[#285943] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#A8B9A1]" />
            <h3 className="text-base font-bold">End Task: Verified Collection Clearance</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          <div className="p-3 bg-[#F7F7F2] rounded-lg border border-[#E1E5DF] text-xs flex items-center justify-between">
            <div>
              <span className="font-mono font-bold text-[#285943]">#{task.reportId}</span> · {task.wasteType}
              <div className="text-[11px] text-[#69716B] truncate max-w-md">{task.locationAddress}</div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#69716B]">Started At:</span>
              <div className="font-mono text-[#252B27]">
                {task.startedAt ? new Date(task.startedAt).toLocaleTimeString() : 'In Progress'}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-[#C53030]/10 border border-[#C53030]/20 rounded-md text-xs text-[#C53030] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section A: 3 Collection Photographs */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#252B27] uppercase tracking-wider">
                A. Three (3) Cleared Area Photographs *
              </span>
              {collectionImages.length === 0 && (
                <button
                  type="button"
                  onClick={handleAddSampleClearedPhotos}
                  className="text-[11px] text-[#285943] hover:underline font-medium cursor-pointer"
                >
                  Load 3 Sample Cleared Photos
                </button>
              )}
            </div>
            <p className="text-xs text-[#69716B] mb-3">
              Photographs showing: 1) the swept collection area, 2) the cleared perimeter from a wider angle, and 3) the loaded collection vehicle.
            </p>

            <ImageUploader
              images={collectionImages}
              onChange={setCollectionImages}
              minImages={3}
              maxImages={5}
              label="Collection Verification Photos (Min 3)"
              helperText="Upload exactly or at least 3 distinct photos demonstrating complete site clearance."
            />
          </div>

          {/* Section B: 1 Worker Verification Photograph at Site */}
          <div className="border-t border-[#E1E5DF] pt-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#252B27] uppercase tracking-wider">
                B. One (1) Worker-at-Site Verification Photograph *
              </span>
              {!workerVerificationImage && (
                <button
                  type="button"
                  onClick={handleAddSampleWorkerVerification}
                  className="text-[11px] text-[#285943] hover:underline font-medium cursor-pointer"
                >
                  Load Sample Worker Verification
                </button>
              )}
            </div>
            <p className="text-xs text-[#69716B] mb-3">
              One photograph showing the authorized sanitation worker on site following clearance.
            </p>

            {workerVerificationImage ? (
              <div className="relative w-44 aspect-4/3 rounded-lg border border-[#E1E5DF] overflow-hidden group">
                <img
                  src={workerVerificationImage}
                  alt="Worker at site"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setWorkerVerificationImage('')}
                  className="absolute top-1 right-1 p-1 bg-[#C53030] text-white rounded cursor-pointer"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/75 text-white text-[10px] rounded font-mono">
                  Worker Verified
                </div>
              </div>
            ) : (
              <div
                onClick={handleAddSampleWorkerVerification}
                className="w-44 aspect-4/3 border-2 border-dashed border-[#E1E5DF] hover:border-[#285943] rounded-lg flex flex-col items-center justify-center p-3 text-center cursor-pointer bg-[#F7F7F2]"
              >
                <Camera className="w-5 h-5 text-[#285943] mb-1" />
                <span className="text-xs font-semibold text-[#252B27]">Capture Worker</span>
                <span className="text-[10px] text-[#69716B]">On-site verification</span>
              </div>
            )}

            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="rounded text-[#285943] focus:ring-[#285943]"
              />
              <span className="text-xs text-[#252B27]">
                Worker consents to photographic site verification for municipal sanitation audit.
              </span>
            </label>
          </div>

          {/* Section C: Optional Notes & Quantity */}
          <div className="border-t border-[#E1E5DF] pt-5 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#252B27] uppercase tracking-wider mb-1">
                Estimated Waste Quantity Cleared
              </label>
              <input
                type="text"
                value={wasteQuantityEstimate}
                onChange={(e) => setWasteQuantityEstimate(e.target.value)}
                placeholder="e.g. Approx. 200 kg in tipper truck"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E1E5DF] rounded-md focus:outline-none focus:border-[#285943] text-[#252B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B27] uppercase tracking-wider mb-1">
                Field Clearance &amp; Sanitation Notes
              </label>
              <textarea
                rows={2}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Describe sanitation measures applied, remaining conditions, or disposal destination..."
                className="w-full px-3 py-2 text-xs bg-white border border-[#E1E5DF] rounded-md focus:outline-none focus:border-[#285943] text-[#252B27]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-[#E1E5DF] pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-[#69716B] bg-[#F7F7F2] border border-[#E1E5DF] rounded-md hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || collectionImages.length < 3 || !workerVerificationImage}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#256628] rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Validating Evidence with Server...' : 'End Task & Mark Resolved'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
