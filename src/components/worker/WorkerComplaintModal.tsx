import React, { useState } from 'react';
import { ReportItem } from '../../types';
import { ImageUploader } from '../common/ImageUploader';
import { AlertTriangle, FileWarning, X, CheckCircle2 } from 'lucide-react';
import { authFetch } from '../../utils/api';

interface WorkerComplaintModalProps {
  task: ReportItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const WorkerComplaintModal: React.FC<WorkerComplaintModalProps> = ({
  task,
  onClose,
  onSuccess,
}) => {
  const [category, setCategory] = useState<string>('Incorrect waste type');
  const [description, setDescription] = useState<string>('');
  const [supportingImages, setSupportingImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const workerCategories = [
    'Incorrect waste type',
    'Incorrect or inaccessible location',
    'Duplicate report',
    'Garbage already removed',
    'Hazardous waste incorrectly categorized',
    'Insufficient or misleading images',
    'Unsafe collection conditions',
    'Reporter-provided information is inaccurate',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!description.trim() || description.trim().length < 10) {
      setErrorMsg('Please explain the operational discrepancy or safety issue (at least 10 characters).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await authFetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: task.reportId,
          category,
          description: description.trim(),
          supportingImages,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
      } else {
        setErrorMsg(data.message || 'Failed to submit worker grievance.');
      }
    } catch (err) {
      setErrorMsg('Network error while lodging report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full my-8 border border-[#E1E5DF] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E1E5DF] bg-[#D97706]/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#D97706]">
            <FileWarning className="w-5 h-5" />
            <h3 className="text-base font-bold text-[#252B27]">File Field Discrepancy / Worker Grievance</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#69716B] hover:text-[#252B27] rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-[#F7F7F2] rounded-lg border border-[#E1E5DF] text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[#69716B]">Task Reference:</span>
              <span className="font-mono font-bold text-[#285943]">#{task.reportId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#69716B]">Reported Category:</span>
              <span className="font-semibold text-[#252B27]">{task.wasteType}</span>
            </div>
            <div className="text-[11px] text-[#69716B] truncate">
              {task.locationAddress}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-[#C53030]/10 border border-[#C53030]/20 rounded-md text-xs text-[#C53030] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#252B27] uppercase tracking-wider mb-1">
              Discrepancy Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E1E5DF] rounded-md focus:outline-none focus:border-[#285943] text-[#252B27]"
            >
              {workerCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#252B27] uppercase tracking-wider mb-1">
              Field Report &amp; Safety Explanation *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Site contains hazardous chemical drums needing specialized gear; or pile was already cleared by commercial building staff; or GPS pin is 500m off..."
              className="w-full px-3 py-2 text-xs bg-white border border-[#E1E5DF] rounded-md focus:outline-none focus:border-[#285943] text-[#252B27]"
            />
          </div>

          <div>
            <ImageUploader
              images={supportingImages}
              onChange={setSupportingImages}
              minImages={0}
              maxImages={3}
              label="Field Photographic Evidence (Optional)"
              helperText="Attach photos proving mismatch or safety concern."
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E1E5DF]">
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
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#D97706] hover:bg-[#b86505] rounded-md transition-colors shadow-xs cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Submitting Discrepancy...' : 'File Worker Grievance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
