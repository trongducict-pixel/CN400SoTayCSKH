import React from 'react';
import { 
  Home, 
  Users, 
  Handshake, 
  BellRing, 
  BarChart3, 
  Settings,
  Plus
} from 'lucide-react';

import { UserRole, AppUser } from '../types';

export type TabType = 'home' | 'customers' | 'meetings' | 'care' | 'reports' | 'admin';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingCareCount: number;
  overdueTasksCount: number;
  currentUser?: AppUser | null;
  onOpenQuickActivity?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  pendingCareCount,
  overdueTasksCount,
  currentUser,
  onOpenQuickActivity
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';

  const navItems = [
    { id: 'home' as TabType, label: 'Trang chủ', icon: Home, badge: 0 },
    { id: 'customers' as TabType, label: 'Khách hàng', icon: Users, badge: 0 },
    { id: 'meetings' as TabType, label: 'Cuộc gặp', icon: Handshake, badge: 0 },
    { id: 'care' as TabType, label: 'Chăm sóc', icon: BellRing, badge: pendingCareCount },
    { id: 'reports' as TabType, label: 'Báo cáo', icon: BarChart3, badge: overdueTasksCount },
    ...(isAdmin ? [{ id: 'admin' as TabType, label: 'Quản trị', icon: Settings, badge: 0 }] : []),
  ];

  return (
    <>
      {/* Desktop Navigation Sub-bar */}
      <nav aria-label="Desktop Navigation" className="hidden md:block bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`desktop-tab-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all relative ${
                    isActive
                      ? 'text-blue-700 border-blue-700 bg-blue-50/40'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {onOpenQuickActivity && (
            <button
              id="desktop-quick-activity-btn"
              type="button"
              onClick={onOpenQuickActivity}
              className="my-1.5 flex items-center gap-2 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi nhận nhanh (3 chạm)</span>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile-First Bottom Navigation Bar with Central Floating Action Button */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 pb-safe pt-1 shadow-lg">
        <div className="flex items-center justify-around px-1">
          {/* First 2 tabs */}
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-tab-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-all ${
                  isActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-blue-100 text-blue-800' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold bg-rose-500 text-white flex items-center justify-center border border-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium tracking-tight mt-0.5 truncate max-w-[54px] ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Central Quick Action Button [+] */}
          {onOpenQuickActivity && (
            <div className="flex flex-col items-center justify-center px-1 -mt-4">
              <button
                id="mobile-quick-action-fab"
                type="button"
                onClick={onOpenQuickActivity}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-700 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 border-2 border-white hover:scale-105 active:scale-95 transition-transform"
                title="Ghi nhận nhanh (3 chạm)"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
              <span className="text-[10px] font-bold text-blue-700 mt-0.5 tracking-tight">
                Ghi nhanh
              </span>
            </div>
          )}

          {/* Remaining tabs */}
          {navItems.slice(2).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-tab-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-all ${
                  isActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-blue-100 text-blue-800' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold bg-rose-500 text-white flex items-center justify-center border border-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium tracking-tight mt-0.5 truncate max-w-[54px] ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
