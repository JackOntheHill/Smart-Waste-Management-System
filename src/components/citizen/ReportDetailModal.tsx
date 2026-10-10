import React, { useState, useEffect } from 'react';
import { ReportItem } from '../../types';
import { MapPicker } from '../common/MapPicker';
import {
  X,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  AlertTriangle,
  Star,
  FileQuestion,
  Edit2,
  Phone,
} from 'lucide-react';
import { authFetch } from '../../utils/api';

interface ReportDetailModalProps {
  reportId: string;
  onClose: () => void;
  onRaiseComplaint: (report: ReportItem) => void;
  onRefresh: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  reportId,
  onClose,
  onRaiseComplaint,
  onRefresh,
}) => {
  const [report, setReport] = useState<ReportItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Editing state (for Pending reports)
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editAddress, setEditAddress] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Feedback state (for Resolved reports)
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackCleared, setFeedbackCleared] = useState<boolean>(true);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string>('');

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/reports/${reportId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setReport(data.report);
        setEditTitle(data.report.title);
        setEditDescription(data.report.description || '');
        setEditAddress(data.report.locationAddress);
      } else {
        setErrorMsg(data.message || 'Report details could not be retrieved.');
      }
    } catch (err) {
      setErrorMsg('Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [reportId]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;

    try {
      setSavingEdit(true);
      const res = await authFetch(`/api/reports/${report.reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          locationAddress: editAddress,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsEditing(false);
        fetchDetail();
        onRefresh();
      } else {
        alert(data.message || 'Failed to edit report.');
      }
    } catch (err) {
      alert('Network error while editing report.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;

    try {
      setSubmittingFeedback(true);
      const res = await authFetch(`/api/reports/${report.reportId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: feedbackRating,
          satisfied: feedbackCleared,
          comment: feedbackComment,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackSuccess('Thank you! Your feedback has been recorded in the municipal audit.');
        fetchDetail();
        onRefresh();
      } else {
        alert(data.message || 'Failed to submit feedback.');
      }
    } catch (err) {
      alert('Error submitting feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center">
          <Clock className="w-8 h-8 text-[#285943] animate-spin mx-auto mb-2" />
          <p className="text-xs text-[#69716B]">Loading official report dossier...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center space-y-4">
          <AlertTriangle className="w-8 h-8 text-[#C53030] mx-auto" />
          <p className="text-xs text-[#252B27]">{errorMsg || 'Report not found'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#285943] text-white text-xs rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const canEdit = report.status === 'Pending' || report.status === 'Requires Clarification';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full my-8 border border-[#E1E5DF] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-[#E1E5DF] bg-[#F7F7F2] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-[#285943] bg-white px-2.5 py-1 rounded border border-[#E1E5DF]">
              #{report.reportId}
            </span>
            <span className="text-xs font-semibold text-[#252B27]">{report.wasteType}</span>
            <span className="text-xs text-[#69716B]">·</span>
            <span className="text-xs text-[#69716B] font-mono tabular-nums">
              {new Date(report.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#285943] hover:bg-[#285943]/10 border border-[#285943]/30 rounded transition-colors cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Pending Details</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#69716B] hover:text-[#252B27] rounded-md hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Progression Banner */}
          <div className="bg-[#F7F7F2] p-4 rounded-xl border border-[#E1E5DF]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#252B27] uppercase tracking-wider">
                Civic Resolution Progress
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white border border-[#E1E5DF] text-[#285943]">
                Current: {report.status}
              </span>
            </div>

            {/* Stepper Steps */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {[
                { title: '1. Lodged', active: true },
                {
                  title: '2. Assigned',
                  active: ['Assigned', 'In Progress', 'Resolved'].includes(report.status),
                },
                {
                  title: '3. In Progress',
                  active: ['In Progress', 'Resolved'].includes(report.status),
                },
                {
                  title: '4. Resolved',
                  active: report.status === 'Resolved',
                },
              ].map((step, idx) => (
                <div key={idx} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full ${
                      step.active ? 'bg-[#285943]' : 'bg-[#E1E5DF]'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-medium block ${
                      step.active ? 'text-[#285943] font-semibold' : 'text-[#69716B]'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Form if citizen is correcting details */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="p-4 bg-neutral-50 rounded-lg border border-[#E1E5DF] space-y-3">
              <h4 className="text-xs font-bold text-[#252B27] uppercase">Edit Report Details</h4>
              <div>
                <label className="text-xs font-medium text-[#69716B] block mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#E1E5DF] rounded"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#69716B] block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#E1E5DF] rounded"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#69716B] block mb-1">Street Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#E1E5DF] rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs border border-[#E1E5DF] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1 text-xs bg-[#285943] text-white rounded font-medium"
                >
                  {savingEdit ? 'Saving...' : 'Save Amendments'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <h3 className="text-base font-bold text-[#252B27] mb-1">{report.title}</h3>
              <p className="text-xs text-[#69716B] leading-relaxed">
                {report.description || 'No additional landmark description provided.'}
              </p>
            </div>
          )}

          {/* Section: Original Citizen Evidence Gallery */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#252B27] uppercase tracking-wider">
                Original Photographic Evidence ({report.images.length} Verified Photos)
              </h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {report.images.map((img, i) => (
                <div
                  key={i}
                  className="aspect-4/3 rounded-lg overflow-hidden border border-[#E1E5DF] bg-neutral-100 relative group"
                >
                  <img
                    src={img}
                    alt={`Evidence angle #${i + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                  />
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/75 text-white text-[10px] font-mono rounded">
                    Angle {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Interactive OpenStreetMap Location */}
          <div>
            <h4 className="text-xs font-bold text-[#252B27] uppercase tracking-wider mb-2">
              Location Map Preview
            </h4>
            <MapPicker
              latitude={report.locationCoordinates.coordinates[1]}
              longitude={report.locationCoordinates.coordinates[0]}
              address={report.locationAddress}
              locationMethod={report.locationMethod}
              onChange={() => {}}
              readOnly={true}
              height="240px"
            />
          </div>

          {/* Section: Assigned Worker Information */}
          {report.assignedWorker && (
            <div className="p-4 bg-white border border-[#E1E5DF] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#285943]/10 text-[#285943] flex items-center justify-center font-bold text-sm">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#252B27]">
                    Assigned Worker: {report.assignedWorker.name}
                  </div>
                  <div className="text-[11px] text-[#69716B]">
                    {report.assignedWorker.workerDetails?.employeeId || 'Municipal Staff'} · {report.assignedWorker.workerDetails?.vehicleType || 'Tipper Truck'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-[#285943] font-medium bg-[#285943]/10 px-2.5 py-1 rounded">
                <Phone className="w-3.5 h-3.5" />
                <span>{report.assignedWorker.phone}</span>
              </div>
            </div>
          )}

          {/* Section: Completion Evidence (Visible When Resolved) */}
          {report.status === 'Resolved' && report.completionEvidence && (
            <div className="p-5 bg-[#2E7D32]/5 border border-[#2E7D32]/20 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-[#2E7D32]">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="text-sm font-bold">Official Field Completion Evidence</h4>
              </div>

              <div className="text-xs text-[#252B27] space-y-1">
                <div>
                  <span className="font-semibold">Worker Notes:</span>{' '}
                  <span className="text-[#69716B]">{report.completionEvidence.completionNotes}</span>
                </div>
                <div>
                  <span className="font-semibold">Waste Quantity Cleared:</span>{' '}
                  <span className="text-[#69716B] font-mono">{report.completionEvidence.wasteQuantityEstimate}</span>
                </div>
                <div>
                  <span className="font-semibold">Server-Confirmed Completion:</span>{' '}
                  <span className="text-[#69716B] font-mono">
                    {new Date(report.completionEvidence.serverRecordedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Verified Clear Photos */}
              <div>
                <span className="text-[11px] font-bold text-[#252B27] uppercase tracking-wider block mb-2">
                  Cleared Site Photographs (3 Views)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {report.completionEvidence.collectionImages.map((img, i) => (
                    <div key={i} className="aspect-4/3 rounded border border-[#E1E5DF] overflow-hidden bg-white">
                      <img
                        src={img}
                        alt={`Cleared site #${i + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Worker On-Site Verification Photo */}
              <div>
                <span className="text-[11px] font-bold text-[#252B27] uppercase tracking-wider block mb-1">
                  Worker On-Site Verification Record
                </span>
                <div className="w-40 aspect-4/3 rounded border border-[#E1E5DF] overflow-hidden bg-white">
                  <img
                    src={report.completionEvidence.workerVerificationImage}
                    alt="Worker verification on site"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Citizen Feedback Form (For Resolved Reports) */}
          {report.status === 'Resolved' && (
            <div className="p-4 bg-white border border-[#E1E5DF] rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-[#252B27] uppercase tracking-wider">
                Citizen Satisfaction Feedback
              </h4>

              {report.citizenFeedback ? (
                <div className="p-3 bg-[#F7F7F2] rounded-lg text-xs space-y-1 border border-[#E1E5DF]">
                  <div className="flex items-center gap-1 text-[#D97706]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= report.citizenFeedback!.rating ? 'fill-current' : 'text-neutral-300'
                        }`}
                      />
                    ))}
                    <span className="text-[#252B27] font-semibold ml-2">
                      {report.citizenFeedback.rating} / 5 Stars
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-[#252B27]">Site Cleared Confirmed:</span>{' '}
                    <span className="text-[#2E7D32] font-semibold">
                      {report.citizenFeedback.satisfied ? 'Yes (100% Cleared)' : 'No (Deficient)'}
                    </span>
                  </div>
                  {report.citizenFeedback.comment && (
                    <p className="text-[#69716B] italic mt-1">"{report.citizenFeedback.comment}"</p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-3 text-xs">
                  {feedbackSuccess && (
                    <div className="p-2 bg-[#2E7D32]/10 text-[#2E7D32] rounded">
                      {feedbackSuccess}
                    </div>
                  )}

                  <div>
                    <label className="block text-[#69716B] mb-1 font-medium">Rate Service Quality:</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setFeedbackRating(s)}
                          className="p-1 text-[#D97706] hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${s <= feedbackRating ? 'fill-current' : 'text-neutral-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feedbackCleared}
                      onChange={(e) => setFeedbackCleared(e.target.checked)}
                      className="rounded text-[#285943] focus:ring-[#285943]"
                    />
                    <span className="text-[#252B27]">I confirm that garbage at this site has been satisfactorily cleared.</span>
                  </label>

                  <textarea
                    rows={2}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Optional feedback comment for the municipal commissioner..."
                    className="w-full p-2 bg-[#F7F7F2] border border-[#E1E5DF] rounded"
                  />

                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="px-4 py-1.5 bg-[#285943] text-white rounded font-semibold hover:bg-[#1e4533] transition-colors cursor-pointer"
                  >
                    {submittingFeedback ? 'Submitting...' : 'Submit Citizen Rating'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Section: Status Timeline & Audit Trail */}
          <div>
            <h4 className="text-xs font-bold text-[#252B27] uppercase tracking-wider mb-3">
              Municipal Audit History &amp; Chronology
            </h4>
            <div className="space-y-3 border-l-2 border-[#E1E5DF] ml-2 pl-4 text-xs">
              {report.auditHistory.map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#285943] ring-4 ring-white" />
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-[#252B27]">{item.action}</span>
                    <span className="font-mono text-[10px] text-[#69716B] tabular-nums">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#69716B] mb-0.5">
                    By {item.changerName} ({item.changerRole.toUpperCase()})
                  </div>
                  <p className="text-xs text-[#252B27] bg-[#F7F7F2] p-2 rounded border border-[#E1E5DF]/60 mt-1">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E1E5DF] bg-[#F7F7F2] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onRaiseComplaint(report);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#C53030] bg-[#C53030]/10 hover:bg-[#C53030]/15 rounded-md transition-colors cursor-pointer"
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span>Raise Civic Grievance / Complaint</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[#252B27] bg-white border border-[#E1E5DF] rounded-md hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
