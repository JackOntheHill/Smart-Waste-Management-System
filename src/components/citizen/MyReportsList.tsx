import React, { useState, useEffect } from 'react';
import { ReportItem, ReportStatus } from '../../types';
import { Search, Filter, Calendar, MapPin, UserCheck, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { authFetch } from '../../utils/api';

interface MyReportsListProps {
  onSelectReport: (reportId: string) => void;
  onNewReport: () => void;
}

export const MyReportsList: React.FC<MyReportsListProps> = ({ onSelectReport, onNewReport }) => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('page', String(page));
      params.append('limit', '8');

      const res = await authFetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReports(data.reports || []);
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages || 1);
          }
        }
      }
    } catch (err) {
      // quiet catch
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  const getStatusBadgeClass = (status: ReportStatus) => {
    switch (status) {
      case 'Pending':
        return 'text-[#D97706] bg-[#D97706]/10 border-[#D97706]/20';
      case 'Assigned':
        return 'text-[#252B27] bg-[#A8B9A1]/20 border-[#A8B9A1]/30';
      case 'In Progress':
        return 'text-[#1E40AF] bg-[#DBEAFE] border-[#BFDBFE]';
      case 'Resolved':
        return 'text-[#2E7D32] bg-[#2E7D32]/10 border-[#2E7D32]/20';
      case 'Rejected':
        return 'text-[#C53030] bg-[#C53030]/10 border-[#C53030]/20';
      default:
        return 'text-[#69716B] bg-neutral-100 border-[#E1E5DF]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-white p-4 border border-[#E1E5DF] rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Report ID or street..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#F7F7F2] border border-[#E1E5DF] rounded-md focus:outline-none focus:border-[#285943] text-[#252B27]"
            />
            <Search className="w-4 h-4 text-[#69716B] absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          {/* Interactive filter segmented control */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-[#F7F7F2] rounded-lg border border-[#E1E5DF] text-xs">
            {['All', 'Pending', 'Assigned', 'In Progress', 'Resolved'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-[#285943] font-semibold shadow-xs'
                    : 'text-[#69716B] hover:text-[#252B27]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Grid / Card List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white p-4 border border-[#E1E5DF] rounded-xl animate-pulse flex flex-col sm:flex-row gap-4 h-36"
            />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white p-12 text-center border border-[#E1E5DF] rounded-xl shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#285943]/10 text-[#285943] flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#252B27]">No Reports Found</h3>
          <p className="text-xs text-[#69716B] max-w-sm mx-auto">
            {statusFilter !== 'All'
              ? `There are no reports currently in "${statusFilter}" status.`
              : 'You have not submitted any garbage accumulation reports yet.'}
          </p>
          <button
            onClick={onNewReport}
            className="inline-flex items-center gap-1 px-4 py-2 bg-[#285943] text-white text-xs font-semibold rounded-md hover:bg-[#1e4533] transition-colors cursor-pointer"
          >
            Lodge Your First Report
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report._id}
              onClick={() => onSelectReport(report.reportId)}
              className="group bg-white border border-[#E1E5DF] hover:border-[#285943]/60 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row"
            >
              {/* Left Image Thumbnail */}
              <div className="sm:w-56 md:w-64 h-48 sm:h-auto shrink-0 relative bg-neutral-100 overflow-hidden">
                <img
                  src={report.images[0]}
                  alt={`Report ${report.reportId}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 text-white text-[11px] font-mono rounded">
                  {report.images.length} Photos
                </div>
              </div>

              {/* Right Report Details */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#285943]">
                        #{report.reportId}
                      </span>
                      <span className="text-xs text-[#69716B]">·</span>
                      <span className="text-xs font-medium text-[#252B27]">
                        {report.wasteType}
                      </span>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getStatusBadgeClass(
                        report.status
                      )}`}
                    >
                      {report.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#252B27] group-hover:text-[#285943] transition-colors line-clamp-1 mb-2">
                    {report.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-[#69716B]">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#285943] shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{report.locationAddress}</span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-mono tabular-nums">
                          {new Date(report.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {report.assignedWorker && (
                        <div className="flex items-center gap-1 text-[#285943]">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Worker: {report.assignedWorker.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Bottom Progress & Action Indicator */}
                <div className="mt-4 pt-3 border-t border-[#E1E5DF] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#69716B]">Status Stage:</span>
                    <span className="font-semibold text-[#252B27]">
                      {report.status === 'Pending'
                        ? '1/4 Awaiting Worker Dispatch'
                        : report.status === 'Assigned'
                        ? '2/4 Assigned to Worker'
                        : report.status === 'In Progress'
                        ? '3/4 Active Collection on Site'
                        : report.status === 'Resolved'
                        ? '4/4 Cleared & Verified'
                        : report.status}
                    </span>
                  </div>

                  <span className="text-[#285943] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>View Full Dossier</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-xs bg-white border border-[#E1E5DF] rounded-md disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs font-mono text-[#69716B]">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-xs bg-white border border-[#E1E5DF] rounded-md disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
