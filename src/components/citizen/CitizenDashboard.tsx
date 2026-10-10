import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../common/Header';
import { Footer } from '../common/Footer';
import { ReportGarbageForm } from './ReportGarbageForm';
import { MyReportsList } from './MyReportsList';
import { ReportDetailModal } from './ReportDetailModal';
import { RaiseComplaintModal } from './RaiseComplaintModal';
import { CitizenComplaintsList } from './CitizenComplaintsList';
import { ReportItem } from '../../types';
import { PlusCircle, FileText, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('my-reports');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [complaintTargetReport, setComplaintTargetReport] = useState<ReportItem | null>(null);

  const handleReportCreated = (newReportId: string) => {
    setSelectedReportId(newReportId);
    setActiveTab('my-reports');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F2]">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} role="citizen" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation & Context Banner */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#252B27]">Citizen Waste Reporting Portal</h1>
            <p className="text-xs text-[#69716B]">
              Welcome back, <span className="font-semibold text-[#252B27]">{user?.name}</span> · Ward Residence: Fort &amp; South Municipal District
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('report')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#285943] hover:bg-[#1e4533] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Garbage Accumulation</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setActiveTab('report')}
                className="bg-white p-6 border border-[#E1E5DF] hover:border-[#285943] rounded-xl shadow-xs transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#285943]/10 text-[#285943] flex items-center justify-center mb-3">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#252B27] group-hover:text-[#285943] transition-colors">
                  Report New Garbage
                </h3>
                <p className="text-xs text-[#69716B] mt-1 mb-4">
                  Take at least 3 photos, pinpoint on the map, and lodge a formal collection dispatch request.
                </p>
                <span className="text-xs font-semibold text-[#285943] flex items-center gap-1">
                  <span>Start Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>

              <div
                onClick={() => setActiveTab('my-reports')}
                className="bg-white p-6 border border-[#E1E5DF] hover:border-[#285943] rounded-xl shadow-xs transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#A8B9A1]/20 text-[#285943] flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#252B27] group-hover:text-[#285943] transition-colors">
                  Track My Reports
                </h3>
                <p className="text-xs text-[#69716B] mt-1 mb-4">
                  View real-time status progressions, worker vehicle assignments, and verified clearance photos.
                </p>
                <span className="text-xs font-semibold text-[#285943] flex items-center gap-1">
                  <span>View Reports</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>

              <div
                onClick={() => setActiveTab('complaints')}
                className="bg-white p-6 border border-[#E1E5DF] hover:border-[#285943] rounded-xl shadow-xs transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#C53030]/10 text-[#C53030] flex items-center justify-center mb-3">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#252B27] group-hover:text-[#C53030] transition-colors">
                  Civic Grievances
                </h3>
                <p className="text-xs text-[#69716B] mt-1 mb-4">
                  Report uncollected rubbish, delayed workers, or inaccurate resolution claims directly to the commissioner.
                </p>
                <span className="text-xs font-semibold text-[#C53030] flex items-center gap-1">
                  <span>Check Grievances</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Recent Reports Preview */}
            <div className="bg-white p-6 border border-[#E1E5DF] rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-4 border-b border-[#E1E5DF] pb-3">
                <h3 className="text-sm font-bold text-[#252B27]">My Recent Garbage Reports</h3>
                <button
                  onClick={() => setActiveTab('my-reports')}
                  className="text-xs font-semibold text-[#285943] hover:underline cursor-pointer"
                >
                  View All →
                </button>
              </div>
              <MyReportsList
                onSelectReport={(id) => setSelectedReportId(id)}
                onNewReport={() => setActiveTab('report')}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Report Garbage */}
        {activeTab === 'report' && (
          <ReportGarbageForm onSuccess={handleReportCreated} />
        )}

        {/* Tab 3: My Reports */}
        {activeTab === 'my-reports' && (
          <MyReportsList
            onSelectReport={(id) => setSelectedReportId(id)}
            onNewReport={() => setActiveTab('report')}
          />
        )}

        {/* Tab 4: Complaints */}
        {activeTab === 'complaints' && <CitizenComplaintsList />}
      </main>

      {/* Report Details Modal */}
      {selectedReportId && (
        <ReportDetailModal
          reportId={selectedReportId}
          onClose={() => setSelectedReportId(null)}
          onRaiseComplaint={(rep) => setComplaintTargetReport(rep)}
          onRefresh={() => {}}
        />
      )}

      {/* Raise Complaint Modal */}
      {complaintTargetReport && (
        <RaiseComplaintModal
          report={complaintTargetReport}
          onClose={() => setComplaintTargetReport(null)}
          onSuccess={() => {
            setComplaintTargetReport(null);
            setActiveTab('complaints');
          }}
        />
      )}

      <Footer />
    </div>
  );
};
