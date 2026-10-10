import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

export const Footer: React.FC = () => {
  const [resetting, setResetting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleResetSeed = async () => {
    if (!window.confirm('Reset database with clean demonstration data? This refreshes all sample reports and users.')) {
      return;
    }
    try {
      setResetting(true);
      const res = await fetch('/api/seed/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('Database reset to demonstration baseline.');
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      setStatusMsg('Failed to reset seed data.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <footer className="bg-white border-t border-[#E1E5DF] mt-auto py-6 text-xs text-[#69716B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#252B27]">EcoCivic Platform</span>
            <span>·</span>
            <span>Department of Municipal Solid Waste Management</span>
            <span>·</span>
            <span>Civic Helpline: 1916</span>
          </div>

          <div className="flex items-center gap-4">
            {statusMsg && <span className="text-[#285943] font-medium">{statusMsg}</span>}
            <button
              onClick={handleResetSeed}
              disabled={resetting}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#69716B] hover:text-[#252B27] bg-[#F7F7F2] hover:bg-neutral-200 border border-[#E1E5DF] rounded transition-colors cursor-pointer"
              title="Reset demonstration data"
            >
              <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
              <span>Reset Demo Records</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
