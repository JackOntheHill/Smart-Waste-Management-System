import React, { useState, useEffect } from 'react';
import { ComplaintItem } from '../../types';
import { FileText, Clock, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { authFetch } from '../../utils/api';

export const CitizenComplaintsList: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/complaints');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setComplaints(data.complaints || []);
        }
      }
    } catch (err) {
      // quiet catch
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Submitted':
        return 'text-[#D97706] bg-[#D97706]/10 border-[#D97706]/20';
      case 'Under Review':
        return 'text-[#1E40AF] bg-[#DBEAFE] border-[#BFDBFE]';
      case 'Action Required':
        return 'text-[#C53030] bg-[#C53030]/10 border-[#C53030]/20';
      case 'Resolved':
        return 'text-[#2E7D32] bg-[#2E7D32]/10 border-[#2E7D32]/20';
      default:
        return 'text-[#69716B] bg-neutral-100 border-[#E1E5DF]';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 border border-[#E1E5DF] rounded-xl shadow-xs">
        <h2 className="text-xl font-bold text-[#252B27]">Civic Grievance &amp; Complaint Registry</h2>
        <p className="text-xs text-[#69716B] mt-1">
          Track official escalations filed on unresolved or disputed waste management reports.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white p-6 border border-[#E1E5DF] rounded-xl animate-pulse h-28" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white p-12 text-center border border-[#E1E5DF] rounded-xl shadow-xs space-y-2">
          <FileText className="w-8 h-8 text-[#69716B] mx-auto" />
          <h3 className="text-sm font-bold text-[#252B27]">No Grievances Filed</h3>
          <p className="text-xs text-[#69716B]">
            You have not lodged any formal complaints. If you experience an issue with collection quality or delays, you can file a complaint from any report dossier.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((item) => (
            <div
              key={item._id}
              className="bg-white p-5 border border-[#E1E5DF] rounded-xl shadow-xs space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E1E5DF] pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#C53030] bg-[#C53030]/10 px-2 py-0.5 rounded">
                    #{item.complaintId}
                  </span>
                  <span className="text-xs text-[#69716B]">·</span>
                  <span className="text-xs font-semibold text-[#252B27]">{item.category}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                  <span className="text-[11px] font-mono text-[#69716B]">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="text-xs text-[#69716B] space-y-1">
                <div>
                  <span className="font-medium text-[#252B27]">Linked Report:</span>{' '}
                  <span className="font-mono text-[#285943]">#{item.reportId}</span>
                </div>
                <p className="text-[#252B27] leading-relaxed pt-1">{item.description}</p>
              </div>

              {/* Administrative Resolution Notes */}
              {item.resolutionNotes && (
                <div className="p-3 bg-[#F7F7F2] rounded-lg border border-[#E1E5DF] text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-[#285943] mb-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Municipal Administration Decision &amp; Notes</span>
                  </div>
                  <p className="text-[#252B27]">{item.resolutionNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
