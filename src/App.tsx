import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LoginPage } from './components/auth/LoginPage';
import { CitizenDashboard } from './components/citizen/CitizenDashboard';
import { WorkerDashboard } from './components/worker/WorkerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Clock } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F2] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-lg bg-[#285943] text-white flex items-center justify-center font-bold text-xl mb-4 shadow-sm animate-pulse">
          EC
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#252B27]">
          <Clock className="w-4 h-4 text-[#285943] animate-spin" />
          <span>Connecting to EcoCivic Municipal Engine...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (user.role === 'citizen') {
    return <CitizenDashboard />;
  }

  if (user.role === 'worker') {
    return <WorkerDashboard />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  return <LoginPage />;
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainAppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
