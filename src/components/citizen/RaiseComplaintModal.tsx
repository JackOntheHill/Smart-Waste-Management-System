import React, { useState } from 'react';
import { ReportItem } from '../../types';
import { ImageUploader } from '../common/ImageUploader';
import { AlertCircle, FileText, X, CheckCircle2 } from 'lucide-react';
import { authFetch } from '../../utils/api';

interface RaiseComplaintModalProps {
  report: ReportItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const RaiseComplaintModal: React.FC<RaiseComplaintModalProps> = ({
  report,
  onClose,
  onSuccess,
}) => {
  const [category, setCategory] = useState<string>(
    'Garbage not collected within expected timeframe'
  );
  const [description, setDescription] = useState<string>('');
  const [supportingImages, setSupportingImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const citizenCategories = [
    'Garbage not collected within expected timeframe',
    'Report incorrectly marked as resolved',
    'Garbage only partially removed',
    'Incorrect collection or handling',
    'Worker conduct or service quality',
    'Incorrect status update',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!description.trim() || description.trim().length < 10) {
      setErrorMsg('Please provide a descriptive explanation of at least 10 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await authFetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: report.reportId,
          category,
          description: description.trim(),
          supportingImages,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
      } else {
        setErrorMsg(data.message || 'Failed to submit complaint.');
      }
    } catch (err) {
      setErrorMsg('Network error while lodging complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full my-8 border border-[#E1E5DF] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E1E5DF] bg-[#F7F7F2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#C53030]" />
            <h3 className="text-base font-bold text-[#252B27]">Lodge Civic Grievance</h3>
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
              <span className="text-[#69716B]">Linked Report:</span>
              <span className="font-mono font-bold text-[#285943]">#{report.reportId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#69716B]">Current Status:</span>
              <span className="font-semibold text-[#252B27]">{report.status}</span>
            </div>
            <div className="text-[11px] text-[#69716B] truncate">
              {report.locationAddress}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-[#C53030]/10 border border-[#C53030]/20 rounded-md text-xs text-[#C53030] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#252B27] uppercase tracking-wider mb-1">
              Grievance Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E1E5DF] rounded-md focus:outline-none focus:border-[#285943] text-[#252B27]"
            >
              {citizenCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#252B27] uppercase tracking-wider mb-1">
              Detailed Description *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the issue clearly (e.g. Garbage was left on the curb, worker cleared only plastic bags, truck skipped scheduled time)..."
              className="w-full px-3 py-2 text-xs bg-white border border-[#E1E5DF] rounded-md focus:outline-none focus:border-[#285943] text-[#252B27]"
            />
          </div>

          <div>
            <ImageUploader
              images={supportingImages}
              onChange={setSupportingImages}
              minImages={0}
              maxImages={3}
              label="Supporting Photographs (Optional)"
              helperText="Upload any additional photos substantiating this grievance."
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
              className="px-5 py-2 text-xs font-semibold text-white bg-[#C53030] hover:bg-[#a52828] rounded-md transition-colors shadow-xs cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Submitting Grievance...' : 'Submit to Municipal Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
