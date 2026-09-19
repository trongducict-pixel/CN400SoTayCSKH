import React from 'react';
import { 
  Handshake, 
  UserPlus, 
  Heart, 
  BarChart3, 
  Settings, 
  LogOut, 
  Users, 
  Calendar, 
  BellRing, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  Clock
} from 'lucide-react';
import { Customer, MeetingHistory, Task, CareEvent, AppUser, UserRole } from '../types';
import { TabType } from './BottomNav';

interface DashboardViewProps {
  customers: Customer[];
  meetings: MeetingHistory[];
  tasks: Task[];
  careEvents: CareEvent[];
  currentUser: AppUser | null;
  onOpenNewMeeting: (preSelectedCustomerId?: string) => void;
  onOpenQuickActivity?: (preSelectedCustomerId?: string) => void;
  onOpenNewCustomer: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onNavigateTab: (tab: TabType) => void;
  onLogout?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  customers,
  meetings,
  tasks,
  careEvents,
  currentUser,
  onOpenNewMeeting,
  onOpenQuickActivity,
  onOpenNewCustomer,
  onNavigateTab,
  onLogout
}) => {
  const role: UserRole = currentUser?.role || 'QHKH';
  const isLeader = role === 'LANH_DAO' || currentUser?.isLeader;
  const isAdmin = role === 'ADMIN';

  // Brief stats calculation
  const totalCustomers = customers.length;
  const careActiveCount = customers.filter(c => c.cheDoChamSoc === 'Bật').length;
  const totalMeetings = meetings.length;
  const pendingTasks = tasks.filter(t => t.trangThai === 'Chưa thực hiện' || t.trangThai === 'Đang thực hiện').length;

  // Role display label
  const roleDisplay = isAdmin 
    ? { title: 'Quản trị viên (Admin)', color: 'bg-rose-100 text-rose-800 border-rose-200' }
    : isLeader 
    ? { title: 'Lãnh đạo phòng', color: 'bg-amber-100 text-amber-800 border-amber-200' }
    : { title: 'Cán bộ QHKH', color: 'bg-blue-100 text-blue-800 border-blue-200' };

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 pb-12 pt-2 px-1">
      
      {/* 1. Header Chào cán bộ (Tối giản, chuẩn Mobile) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleDisplay.color} mb-1.5`}>
              <ShieldCheck className="w-3 h-3" />
              {roleDisplay.title}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Xin chào, {currentUser?.hoTen || 'Cán bộ QHKH'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser?.phongBan || 'Ngân hàng'} • {currentUser?.email || ''}
            </p>
          </div>
        </div>

        {/* Quick summary chips */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
          <div 
            onClick={() => onNavigateTab('customers')}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-98 transition-all cursor-pointer"
          >
            <p className="text-base font-black text-blue-700">{totalCustomers}</p>
            <p className="text-[11px] text-slate-600 font-medium">Khách hàng</p>
          </div>
          <div 
            onClick={() => onNavigateTab('meetings')}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-98 transition-all cursor-pointer"
          >
            <p className="text-base font-black text-indigo-700">{totalMeetings}</p>
            <p className="text-[11px] text-slate-600 font-medium">Cuộc gặp</p>
          </div>
          <div 
            onClick={() => onNavigateTab('care')}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-98 transition-all cursor-pointer"
          >
            <p className="text-base font-black text-emerald-700">{careActiveCount}</p>
            <p className="text-[11px] text-slate-600 font-medium">Đang chăm sóc</p>
          </div>
        </div>
      </div>

      {/* 2. Các ô chức năng lớn theo đúng yêu cầu Mục 6 & Mục 33 */}
      <div className="space-y-3">
        
        {/* CHỨC NĂNG 0: Ghi nhận nhanh 3 chạm (V2 Siêu tốc) */}
        <button
          id="home-btn-quick-activity"
          onClick={() => onOpenQuickActivity ? onOpenQuickActivity() : onOpenNewMeeting()}
          className="w-full text-left bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 hover:from-blue-800 hover:to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-between gap-3 group cursor-pointer border border-blue-600/50"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center text-2xl font-black shrink-0 shadow-md group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  GHI NHẬN NHANH (3 CHẠM)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-blue-950 shadow-xs uppercase tracking-wider">
                  Mới V2
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                Lưu cuộc gặp / gọi điện / quà tặng + GPS chỉ trong 10 giây
              </p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
        </button>

        {/* CHỨC NĂNG 1: Ghi nhận cuộc gặp chi tiết */}
        <button
          id="home-btn-record-meeting"
          onClick={() => onOpenNewMeeting()}
          className="w-full text-left bg-white hover:bg-slate-50 text-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-between gap-3 group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
              🤝
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                GHI NHẬN CUỘC GẶP ĐẦY ĐỦ
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Nhập chi tiết biên bản, định vị GPS, nhu cầu & phân công
              </p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all shrink-0" />
        </button>

        {/* CHỨC NĂNG 2: Thêm khách hàng mới */}
        <button
          id="home-btn-add-customer"
          onClick={onOpenNewCustomer}
          className="w-full text-left bg-white hover:bg-slate-50 text-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-between gap-3 group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
              ➕
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                THÊM KHÁCH HÀNG MỚI
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Tạo hồ sơ khách hàng mới (Cá nhân hoặc Tổ chức)
              </p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all shrink-0" />
        </button>

        {/* CHỨC NĂNG 3: Theo dõi & Chăm sóc */}
        <button
          id="home-btn-care-management"
          onClick={() => onNavigateTab('care')}
          className="w-full text-left bg-white hover:bg-slate-50 text-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-between gap-3 group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
              ❤️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  THEO DÕI & CHĂM SÓC
                </h2>
                {careActiveCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                    {careActiveCount} Bật
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Tra cứu, sự kiện sinh nhật, ngày lễ & việc cần làm
              </p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all shrink-0" />
        </button>

        {/* CHỨC NĂNG 4: Báo cáo (Phân quyền theo Cán bộ / Lãnh đạo / Admin) */}
        <button
          id="home-btn-reports"
          onClick={() => onNavigateTab('reports')}
          className="w-full text-left bg-white hover:bg-slate-50 text-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-between gap-3 group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
              📊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  BÁO CÁO
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isAdmin 
                    ? 'bg-purple-100 text-purple-800' 
                    : isLeader 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {isAdmin ? 'Toàn chi nhánh' : isLeader ? 'Phòng ban' : 'Cán bộ'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {isAdmin 
                  ? 'Theo dõi toàn bộ chi nhánh và tất cả phòng ban' 
                  : isLeader 
                  ? `Theo dõi toàn bộ khách hàng & cán bộ ${currentUser?.phongBan || 'phòng'}` 
                  : 'Theo dõi khách hàng & công việc do mình trực tiếp quản lý'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all shrink-0" />
        </button>

        {/* CHỨC NĂNG 5: Quản trị (Chỉ dành cho Admin) */}
        {isAdmin && (
          <button
            id="home-btn-admin"
            onClick={() => onNavigateTab('admin')}
            className="w-full text-left bg-white hover:bg-slate-50 text-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                ⚙️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    QUẢN TRỊ
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                    Admin
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Quản lý cán bộ, phân quyền, email & hệ thống
                </p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all shrink-0" />
          </button>
        )}

      </div>

      {/* 3. Nút Đăng xuất thoáng đãng ở cuối trang chủ */}
      {onLogout && (
        <div className="pt-2">
          <button
            id="home-btn-logout"
            onClick={onLogout}
            className="w-full py-3.5 px-4 rounded-xl border border-slate-300/80 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất khỏi phiên làm việc</span>
          </button>
        </div>
      )}

    </div>
  );
};
