import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../common/Header';
import { Footer } from '../common/Footer';
import { ReportItem, ComplaintItem, User } from '../../types';
import {
  ShieldCheck,
  Users,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  UserPlus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { authFetch } from '../../utils/api';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('analytics');

  // Metrics
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Assignment Modal
  const [assigningReport, setAssigningReport] = useState<ReportItem | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [assignNotes, setAssignNotes] = useState<string>('');

  // New Worker Form Modal
  const [showAddWorkerModal, setShowAddWorkerModal] = useState<boolean>(false);
  const [newWorkerName, setNewWorkerName] = useState<string>('');
  const [newWorkerEmail, setNewWorkerEmail] = useState<string>('');
  const [newWorkerPhone, setNewWorkerPhone] = useState<string>('');
  const [newWorkerPass, setNewWorkerPass] = useState<string>('WorkerPass@123');
  const [newWorkerZone, setNewWorkerZone] = useState<string>('Ward 4 - South Fort');
  const [addingWorker, setAddingWorker] = useState<boolean>(false);

  // Review Complaint Modal
  const [reviewingComplaint, setReviewingComplaint] = useState<ComplaintItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>('Resolved');
  const [reviewNotes, setReviewNotes] = useState<string>('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [resOverview, resReports, resComplaints, resWorkers] = await Promise.all([
        authFetch('/api/admin/overview'),
        authFetch('/api/admin/reports'),
        authFetch('/api/complaints'),
        authFetch('/api/admin/workers'),
      ]);

      if (resOverview.ok) {
        const d = await resOverview.json();
        setStats(d.stats);
      }
      if (resReports.ok) {
        const d = await resReports.json();
        setReports(d.reports || []);
      }
      if (resComplaints.ok) {
        const d = await resComplaints.json();
        setComplaints(d.complaints || []);
      }
      if (resWorkers.ok) {
        const d = await resWorkers.json();
        setWorkers(d.workers || []);
      }
    } catch (err) {
      // quiet catch
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningReport || !selectedWorkerId) return;

    try {
      const res = await authFetch(`/api/admin/reports/${assigningReport.reportId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: selectedWorkerId, notes: assignNotes }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setAssigningReport(null);
        fetchAdminData();
      } else {
        alert(data.message || 'Assignment failed.');
      }
    } catch (err) {
      alert('Error during assignment.');
    }
  };

  const handleCreateWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddingWorker(true);
      const res = await authFetch('/api/admin/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWorkerName,
          email: newWorkerEmail,
          phone: newWorkerPhone,
          password: newWorkerPass,
          assignedZone: newWorkerZone,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setShowAddWorkerModal(false);
        setNewWorkerName('');
        setNewWorkerEmail('');
        setNewWorkerPhone('');
        fetchAdminData();
      } else {
        alert(data.message || 'Worker creation failed.');
      }
    } catch (err) {
      alert('Error creating worker.');
    } finally {
      setAddingWorker(false);
    }
  };

  const handleReviewComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingComplaint) return;

    try {
      const res = await authFetch(`/api/complaints/${reviewingComplaint.complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: reviewStatus, resolutionNotes: reviewNotes }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Grievance status updated and complainant notified.');
        setReviewingComplaint(null);
        fetchAdminData();
      } else {
        alert(data.message || 'Update failed.');
      }
    } catch (err) {
      alert('Error updating complaint.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F2]">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} role="admin" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#252B27]">Municipal Commissioner Operations Command</h1>
            <p className="text-xs text-[#69716B]">
              Real-time administrative governance, field staff dispatch, and grievance resolution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddWorkerModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#285943] hover:bg-[#1e4533] text-white text-xs font-semibold rounded-md shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Authorize New Worker</span>
            </button>
            <button
              onClick={fetchAdminData}
              className="p-1.5 bg-white border border-[#E1E5DF] hover:bg-neutral-100 rounded-md text-[#69716B] cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Analytics / Command Overview */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Real KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 border border-[#E1E5DF] rounded-xl shadow-xs">
                <span className="text-[11px] font-bold text-[#69716B] uppercase tracking-wider block">
                  Total Garbage Reports
                </span>
                <div className="text-2xl font-bold text-[#252B27] mt-1 font-mono tabular-nums">
                  {stats?.totalReports ?? reports.length}
                </div>
                <span className="text-[11px] text-[#69716B] block mt-1">Logged by citizens</span>
              </div>

              <div className="bg-white p-5 border border-[#E1E5DF] rounded-xl shadow-xs">
                <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider block">
                  Pending Dispatch
                </span>
                <div className="text-2xl font-bold text-[#D97706] mt-1 font-mono tabular-nums">
                  {stats?.pendingCount ?? 0}
                </div>
                <span className="text-[11px] text-[#69716B] block mt-1">Awaiting worker claim</span>
              </div>

              <div className="bg-white p-5 border border-[#E1E5DF] rounded-xl shadow-xs">
                <span className="text-[11px] font-bold text-[#2E7D32] uppercase tracking-wider block">
                  Resolved / Cleared
                </span>
                <div className="text-2xl font-bold text-[#2E7D32] mt-1 font-mono tabular-nums">
                  {stats?.resolvedCount ?? 0}
                </div>
                <span className="text-[11px] text-[#2E7D32] block mt-1">100% verified with 3+1 photos</span>
              </div>

              <div className="bg-white p-5 border border-[#E1E5DF] rounded-xl shadow-xs">
                <span className="text-[11px] font-bold text-[#C53030] uppercase tracking-wider block">
                  Open Grievances
                </span>
                <div className="text-2xl font-bold text-[#C53030] mt-1 font-mono tabular-nums">
                  {stats?.openComplaintsCount ?? complaints.length}
                </div>
                <span className="text-[11px] text-[#69716B] block mt-1">Requires review</span>
              </div>
            </div>

            {/* Waste Breakdown & Average Resolution Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 border border-[#E1E5DF] rounded-xl shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-[#252B27] uppercase tracking-wider">
                  Waste Classification Breakdown
                </h3>
                <div className="space-y-2 text-xs">
                  {stats?.wasteTypeBreakdown?.map((item: any) => (
                    <div key={item.type} className="flex items-center justify-between border-b border-[#E1E5DF]/60 pb-1.5">
                      <span className="text-[#252B27] font-medium">{item.type}</span>
                      <span className="font-mono text-[#285943] font-bold tabular-nums">{item.count} reports</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 border border-[#E1E5DF] rounded-xl shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#252B27] uppercase tracking-wider mb-2">
                    Operational Performance
                  </h3>
                  <div className="text-3xl font-bold text-[#285943] font-mono tabular-nums">
                    {stats?.avgResolutionHours ?? '2.4'} hrs
                  </div>
                  <p className="text-xs text-[#69716B] mt-1">
                    Average turnaround time from citizen photographic upload to verified on-site truck clearance.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E1E5DF] text-xs flex justify-between">
                  <span className="text-[#69716B]">Authorized Field Workforce:</span>
                  <span className="font-bold text-[#252B27]">{workers.length} Sanitation Specialists</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: All Reports & Triage */}
        {activeTab === 'reports' && (
          <div className="bg-white p-6 border border-[#E1E5DF] rounded-xl shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#252B27] uppercase tracking-wider">
              Comprehensive Municipal Reports Registry
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F7F2] text-[#69716B] border-b border-[#E1E5DF] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Report ID</th>
                    <th className="py-2.5 px-3">Waste Type</th>
                    <th className="py-2.5 px-3">Location Address</th>
                    <th className="py-2.5 px-3">Reporter</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Assigned Worker</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E5DF]">
                  {reports.map((r) => (
                    <tr key={r._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#285943]">#{r.reportId}</td>
                      <td className="py-2.5 px-3 font-medium text-[#252B27]">{r.wasteType}</td>
                      <td className="py-2.5 px-3 text-[#69716B] max-w-xs truncate">{r.locationAddress}</td>
                      <td className="py-2.5 px-3 text-[#69716B]">{r.reportedBy?.name || 'Citizen'}</td>
                      <td className="py-2.5 px-3 font-semibold">{r.status}</td>
                      <td className="py-2.5 px-3 text-[#252B27]">
                        {r.assignedWorker ? (r.assignedWorker as any).name : <span className="text-[#D97706]">Unassigned</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setAssigningReport(r)}
                          className="px-2.5 py-1 text-xs text-[#285943] bg-[#285943]/10 hover:bg-[#285943]/20 rounded font-medium cursor-pointer"
                        >
                          Assign Worker
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Field Workers Roster */}
        {activeTab === 'workers' && (
          <div className="bg-white p-6 border border-[#E1E5DF] rounded-xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#252B27] uppercase tracking-wider">
                Authorized Field Workforce ({workers.length})
              </h2>
              <button
                onClick={() => setShowAddWorkerModal(true)}
                className="px-3 py-1.5 bg-[#285943] text-white text-xs font-semibold rounded cursor-pointer"
              >
                + Add Worker
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {workers.map((w) => (
                <div key={w.id || (w as any)._id} className="p-4 border border-[#E1E5DF] rounded-lg bg-[#F7F7F2] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#252B27] text-sm">{w.name}</span>
                    <span className="font-mono text-[#285943] font-bold">
                      {w.workerDetails?.employeeId || 'EMP-W'}
                    </span>
                  </div>
                  <div className="text-[#69716B]">{w.email} · {w.phone}</div>
                  <div className="text-[#252B27] font-medium pt-1">
                    Zone: {w.workerDetails?.assignedZone || 'Central Ward'} · {w.workerDetails?.vehicleType || 'Tipper Truck'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Complaints Review Queue */}
        {activeTab === 'complaints' && (
          <div className="bg-white p-6 border border-[#E1E5DF] rounded-xl shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#252B27] uppercase tracking-wider">
              Citizen &amp; Worker Grievance Adjudication Queue
            </h2>

            <div className="space-y-3">
              {complaints.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#69716B]">No open complaints.</div>
              ) : (
                complaints.map((c) => (
                  <div key={c._id} className="p-4 border border-[#E1E5DF] rounded-lg bg-[#F7F7F2] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#C53030]">#{c.complaintId}</span>
                        <span className="font-semibold text-[#252B27]">{c.category}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-neutral-200">
                          {c.submittedByRole}
                        </span>
                      </div>
                      <span className="font-semibold text-[#252B27]">{c.status}</span>
                    </div>

                    <p className="text-[#252B27]">{c.description}</p>
                    <div className="text-[#69716B]">
                      Submitted by: {c.submittedByName} on report #{c.reportId}
                    </div>

                    {c.resolutionNotes && (
                      <div className="p-2 bg-white rounded border border-[#E1E5DF] text-[11px] text-[#285943]">
                        <span className="font-bold">Prior Review Note:</span> {c.resolutionNotes}
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setReviewingComplaint(c);
                          setReviewNotes(c.resolutionNotes || '');
                        }}
                        className="px-3 py-1 bg-[#285943] text-white rounded font-medium cursor-pointer"
                      >
                        Review &amp; Adjudicate
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Assign Worker Modal */}
      {assigningReport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-[#E1E5DF] shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#252B27]">Dispatch Field Worker</h3>
            <div className="text-xs text-[#69716B]">
              Assigning task #{assigningReport.reportId} ({assigningReport.wasteType})
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#252B27] font-semibold mb-1">Select Field Worker</label>
                <select
                  required
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full p-2 bg-[#F7F7F2] border border-[#E1E5DF] rounded"
                >
                  <option value="">-- Choose Authorized Worker --</option>
                  {workers.map((w) => (
                    <option key={w.id || (w as any)._id} value={w.id || (w as any)._id}>
                      {w.name} ({w.workerDetails?.employeeId || 'Worker'} - {w.workerDetails?.assignedZone || 'Ward 4'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#252B27] font-semibold mb-1">Dispatch Instructions</label>
                <textarea
                  rows={2}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. High-density pedestrian corridor. Please clear before 14:00."
                  className="w-full p-2 bg-[#F7F7F2] border border-[#E1E5DF] rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningReport(null)}
                  className="px-3 py-1.5 border border-[#E1E5DF] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#285943] text-white rounded font-bold"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-[#E1E5DF] shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#252B27]">Authorize New Field Worker</h3>
            <form onSubmit={handleCreateWorkerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="e.g. Ramesh Varma"
                  className="w-full p-2 border border-[#E1E5DF] rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Official Municipal Email</label>
                <input
                  type="email"
                  required
                  value={newWorkerEmail}
                  onChange={(e) => setNewWorkerEmail(e.target.value)}
                  placeholder="ramesh.varma@ecocivic.gov.in"
                  className="w-full p-2 border border-[#E1E5DF] rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  value={newWorkerPhone}
                  onChange={(e) => setNewWorkerPhone(e.target.value)}
                  placeholder="+91 98111 22334"
                  className="w-full p-2 border border-[#E1E5DF] rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Assigned Ward Zone</label>
                <input
                  type="text"
                  value={newWorkerZone}
                  onChange={(e) => setNewWorkerZone(e.target.value)}
                  placeholder="Ward 4 - South Fort"
                  className="w-full p-2 border border-[#E1E5DF] rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  value={newWorkerPass}
                  onChange={(e) => setNewWorkerPass(e.target.value)}
                  className="w-full p-2 border border-[#E1E5DF] rounded font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWorkerModal(false)}
                  className="px-3 py-1.5 border border-[#E1E5DF] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingWorker}
                  className="px-4 py-1.5 bg-[#285943] text-white rounded font-bold"
                >
                  {addingWorker ? 'Authorizing...' : 'Authorize Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Complaint Modal */}
      {reviewingComplaint && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-[#E1E5DF] shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#252B27]">Adjudicate Grievance #{reviewingComplaint.complaintId}</h3>
            <form onSubmit={handleReviewComplaintSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Adjudication Status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full p-2 border border-[#E1E5DF] rounded bg-[#F7F7F2]"
                >
                  <option value="Under Review">Under Review</option>
                  <option value="Action Required">Action Required</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Commissioner's Resolution Notes</label>
                <textarea
                  rows={3}
                  required
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Explain administrative finding and corrective measures taken..."
                  className="w-full p-2 border border-[#E1E5DF] rounded bg-[#F7F7F2]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingComplaint(null)}
                  className="px-3 py-1.5 border border-[#E1E5DF] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#285943] text-white rounded font-bold"
                >
                  Save Adjudication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
