import React, { useState } from 'react';
import { 
  Building2, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  Settings, 
  Users, 
  UserCheck, 
  RefreshCw, 
  Crown,
  LogOut,
  LogIn,
  ChevronDown,
  User,
  KeyRound
} from 'lucide-react';
import { UserRole, AppUser } from '../types';

interface HeaderProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isConnected: boolean;
  onOpenSettings: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  lastSyncTime?: string;
  currentUser: AppUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenUserManagement?: () => void;
  onOpenChangePassword?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  onRoleChange,
  isConnected,
  onOpenSettings,
  onRefreshData,
  isRefreshing,
  lastSyncTime,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenUserManagement,
  onOpenChangePassword
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Logo & App Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="h-10 sm:h-11 px-1.5 py-0.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center shrink-0">
            <img 
              src="https://raw.githubusercontent.com/giadinhbanker/anh-super-app-bac-phu-tho/main/Logo%20VietinBank.png" 
              alt="Logo VietinBank" 
              className="h-7 sm:h-8 w-auto object-contain max-w-[120px]"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-xs sm:text-sm md:text-base font-black text-[#00519E] tracking-tight truncate uppercase">
                SỔ TAY CHĂM SÓC KHÁCH HÀNG
              </h1>
              <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-wider bg-blue-50 text-[#00519E] border border-blue-200/60 uppercase">
                CN VietinBank Ninh Bình
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium truncate">
              Quản lý và chăm sóc khách hàng chủ động <span className="md:hidden font-bold text-[#00519E]">• CN Ninh Bình</span>
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Connection Status Pill */}
          <button
            id="header-btn-connection-status"
            onClick={onOpenSettings}
            className={`hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
              isConnected 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title="Nhấp để cấu hình Google Apps Script URL"
          >
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Google Sheets OK</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Bộ nhớ đệm</span>
              </>
            )}
          </button>

          {/* SWR Sync Status Indicator */}
          {isRefreshing ? (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-semibold text-blue-700 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-600 shrink-0" />
              <span>Đang cập nhật...</span>
            </div>
          ) : lastSyncTime ? (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-500" title="Dữ liệu đồng bộ lúc">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Cập nhật: {lastSyncTime}</span>
            </div>
          ) : null}

          {/* Refresh Button */}
          <button
            id="header-btn-refresh-data"
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Current User Badge & Dropdown */}
          {currentUser ? (
            <div className="relative">
              <button
                id="header-btn-user-profile"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 bg-slate-50 transition-all cursor-pointer text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                  {currentUser.hoTen.split(' ').pop()?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block min-w-0 max-w-[140px]">
                  <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                    <span>{currentUser.hoTen}</span>
                    {currentUser.isLeader && (
                      <Crown className="w-3 h-3 text-amber-500 shrink-0" title="Lãnh đạo phòng" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate font-mono">
                    @{currentUser.user} • {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95 duration-100 text-xs">
                    <div className="p-2.5 border-b border-slate-100">
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{currentUser.hoTen}</span>
                        {currentUser.isLeader && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5 text-amber-600" />
                            Lãnh đạo
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        User: <strong className="text-blue-700">{currentUser.user}</strong> | {currentUser.maNv}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        🏢 {currentUser.phongBan}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        💼 {currentUser.viTri}
                      </div>
                    </div>

                    {/* Quick role switch for convenience - Only visible for Admin */}
                    {isAdmin && (
                      <div className="p-2 border-b border-slate-100 space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Chế độ xem (Admin test):
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            onClick={() => {
                              onRoleChange('QHKH');
                              setShowUserMenu(false);
                            }}
                            className={`py-1 px-1.5 rounded-lg text-center font-bold text-[11px] ${
                              activeRole === 'QHKH' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            QHKH
                          </button>
                          <button
                            onClick={() => {
                              onRoleChange('LANH_DAO');
                              setShowUserMenu(false);
                            }}
                            className={`py-1 px-1.5 rounded-lg text-center font-bold text-[11px] ${
                              activeRole === 'LANH_DAO' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Lãnh đạo
                          </button>
                          <button
                            onClick={() => {
                              onRoleChange('ADMIN');
                              setShowUserMenu(false);
                            }}
                            className={`py-1 px-1.5 rounded-lg text-center font-bold text-[11px] ${
                              activeRole === 'ADMIN' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Admin
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Links */}
                    <div className="p-1 space-y-0.5">
                      {isAdmin && onOpenUserManagement && (
                        <button
                          onClick={() => {
                            onOpenUserManagement();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium text-left cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>Quản trị cán bộ & người dùng</span>
                        </button>
                      )}

                      {onOpenChangePassword && (
                        <button
                          id="header-btn-change-password"
                          onClick={() => {
                            onOpenChangePassword();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-xl text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors font-medium text-left cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4 text-amber-600" />
                          <span>Đổi mật khẩu cá nhân</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onOpenLogin();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors font-medium text-left cursor-pointer"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        <span>Chuyển đổi tài khoản</span>
                      </button>

                      <button
                        onClick={() => {
                          onLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-700 hover:bg-rose-50 transition-colors font-bold text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm shadow-blue-700/20 active:scale-98 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </button>
          )}

          {/* Setup / Settings Icon - Only for Admin */}
          {isAdmin && (
            <button
              id="header-btn-settings"
              onClick={onOpenSettings}
              className="p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Cài đặt & Hướng dẫn Apps Script"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
