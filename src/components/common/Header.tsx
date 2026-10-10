import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, LogOut, CheckCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: 'citizen' | 'worker' | 'admin';
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, role }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const getNavLinks = () => {
    if (role === 'citizen') {
      return [
        { id: 'overview', label: 'Overview' },
        { id: 'report', label: 'Report Garbage' },
        { id: 'my-reports', label: 'My Reports' },
        { id: 'complaints', label: 'Grievances' },
      ];
    }
    if (role === 'worker') {
      return [
        { id: 'nearby', label: 'Nearby Reports' },
        { id: 'active', label: 'Active Collection' },
        { id: 'tasks', label: 'Task History' },
        { id: 'complaints', label: 'Worker Grievances' },
      ];
    }
    return [
      { id: 'analytics', label: 'Command Overview' },
      { id: 'reports', label: 'All Reports' },
      { id: 'workers', label: 'Field Staff' },
      { id: 'complaints', label: 'Grievance Review' },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E1E5DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab(navLinks[0].id)}
              className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-8 h-8 rounded bg-[#285943] text-white flex items-center justify-center font-bold text-base shadow-xs">
                EC
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-[#252B27] whitespace-nowrap block leading-tight">
                  EcoCivic
                </span>
                <span className="text-[11px] font-medium text-[#69716B] tracking-wide block uppercase">
                  Municipal Waste Portal
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-5 single-line clean navigation links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-4 text-sm font-medium text-[#69716B]">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`px-3 py-1.5 transition-colors whitespace-nowrap shrink-0 rounded-md text-sm cursor-pointer ${
                    isActive
                      ? 'text-[#285943] font-semibold bg-[#285943]/8'
                      : 'hover:text-[#252B27] hover:bg-neutral-100'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Notification, User & Primary Logout action */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Menu */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-[#69716B] hover:text-[#252B27] rounded-md hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C53030]" />
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E1E5DF] rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-[#F7F7F2] border-b border-[#E1E5DF] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#252B27] uppercase tracking-wider">
                      Civic Notifications ({unreadCount} new)
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-[#285943] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E1E5DF]">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#69716B]">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => {
                            if (!notif.readAt) markAsRead(notif._id);
                          }}
                          className={`p-3 text-left transition-colors cursor-pointer ${
                            notif.readAt ? 'bg-white opacity-80' : 'bg-[#285943]/5'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-[#252B27] truncate">
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-[#69716B] font-mono whitespace-nowrap ml-2">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-[#69716B] leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Details */}
            {user && (
              <div className="hidden sm:flex flex-col text-right leading-tight">
                <span className="text-xs font-semibold text-[#252B27] truncate max-w-[120px]">
                  {user.name}
                </span>
                <span className="text-[11px] text-[#69716B] capitalize">
                  {user.role} {user.workerDetails?.employeeId ? `· ${user.workerDetails.employeeId}` : ''}
                </span>
              </div>
            )}

            {/* Logout Action */}
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#252B27] bg-[#F7F7F2] hover:bg-neutral-200 border border-[#E1E5DF] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-[#69716B]" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Subnav */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto py-2 border-t border-[#E1E5DF] text-xs">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`px-2.5 py-1 rounded whitespace-nowrap cursor-pointer ${
                activeTab === link.id
                  ? 'bg-[#285943] text-white font-medium'
                  : 'text-[#69716B] bg-[#F7F7F2]'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
