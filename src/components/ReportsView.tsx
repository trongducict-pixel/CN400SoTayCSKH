import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Users, 
  Handshake, 
  Download, 
  Filter, 
  ShieldCheck, 
  Crown, 
  UserCheck, 
  User,
  History,
  FileSpreadsheet,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  Calendar
} from 'lucide-react';
import { Customer, MeetingHistory, Task, AppUser } from '../types';
import { DashboardReportExportModal } from './DashboardReportExportModal';
import { SummaryReport } from './reports/SummaryReport';
import { CustomerByOfficerReport } from './reports/CustomerByOfficerReport';
import { CustomerHistoryReport } from './reports/CustomerHistoryReport';

export type ReportSubTab = 'menu' | 'by_officer' | 'summary' | 'history';

interface ReportsViewProps {
  customers: Customer[];
  meetings: MeetingHistory[];
  tasks: Task[];
  currentUser?: AppUser | null;
  users?: AppUser[];
  onSelectCustomer?: (customer: Customer) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  customers,
  meetings,
  tasks,
  currentUser,
  users = [],
  onSelectCustomer
}) => {
  // Determine Role & Scope
  const isAdmin = currentUser?.role === 'ADMIN';
  const isLeader = !isAdmin && (currentUser?.role === 'LANH_DAO' || currentUser?.isLeader === true);
  const isOfficer = !isAdmin && !isLeader;

  const userDept = currentUser?.phongBan || '';
  const isBranchLeader = isLeader && (userDept.toLowerCase().includes('giám đốc') || userDept.toLowerCase().includes('chi nhánh'));

  // Active Report Screen: Mặc định là 'menu' (Mobile-first Button Hub)
  const [activeReportTab, setActiveReportTab] = useState<ReportSubTab>('menu');

  // Filter States
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // 1. Phân quyền dữ liệu (RBAC Data Filtering)
  const scopedData = useMemo(() => {
    let baseCustomers = customers;

    if (isOfficer) {
      // Cán bộ QHKH: Chỉ lấy khách hàng do mình quản lý
      const myUsername = (currentUser?.user || '').toLowerCase().trim();
      const myFullName = (currentUser?.hoTen || '').toLowerCase().trim();
      const myEmail = (currentUser?.email || '').toLowerCase().trim();

      baseCustomers = customers.filter(c => {
        const cUser = (c.userCanBo || '').toLowerCase().trim();
        const cName = (c.canBoPhuTrach || '').toLowerCase().trim();
        const cEmail = (c.emailCanBo || '').toLowerCase().trim();

        return (
          (myUsername && cUser === myUsername) ||
          (myFullName && cName === myFullName) ||
          (myEmail && cEmail === myEmail)
        );
      });
    } else if (isLeader && !isBranchLeader) {
      // Lãnh đạo phòng: Xem toàn bộ khách hàng của phòng mình
      const deptUsers = users.filter(u => u.phongBan.toLowerCase().trim() === userDept.toLowerCase().trim());
      const deptUsernames = new Set(deptUsers.map(u => u.user.toLowerCase().trim()));
      const deptFullnames = new Set(deptUsers.map(u => u.hoTen.toLowerCase().trim()));

      baseCustomers = customers.filter(c => {
        const cDept = (c.phongBanKhoiTao || '').toLowerCase().trim();
        if (cDept && cDept === userDept.toLowerCase().trim()) return true;

        const cUser = (c.userCanBo || '').toLowerCase().trim();
        const cName = (c.canBoPhuTrach || '').toLowerCase().trim();

        if (cUser && deptUsernames.has(cUser)) return true;
        if (cName && deptFullnames.has(cName)) return true;

        return false;
      });
    } else if (isAdmin || isBranchLeader) {
      // Admin hoặc Ban Giám đốc: Nếu có chọn phòng ban thì lọc theo phòng
      if (selectedDeptFilter !== 'all') {
        const deptUsers = users.filter(u => u.phongBan === selectedDeptFilter);
        const deptUsernames = new Set(deptUsers.map(u => u.user.toLowerCase().trim()));
        const deptFullnames = new Set(deptUsers.map(u => u.hoTen.toLowerCase().trim()));

        baseCustomers = customers.filter(c => {
          if (c.phongBanKhoiTao === selectedDeptFilter) return true;
          const cUser = (c.userCanBo || '').toLowerCase().trim();
          const cName = (c.canBoPhuTrach || '').toLowerCase().trim();
          if (cUser && deptUsernames.has(cUser)) return true;
          if (cName && deptFullnames.has(cName)) return true;
          return false;
        });
      }
    }

    // Set of scoped customer IDs
    const allowedCustomerIds = new Set(baseCustomers.map(c => c.idKh));

    // Scoped Meetings
    const baseMeetings = meetings.filter(m => {
      if (allowedCustomerIds.has(m.idKh)) return true;
      if (isOfficer && currentUser) {
        return (m.canBoThucHien || '').toLowerCase().trim() === currentUser.hoTen.toLowerCase().trim();
      }
      return false;
    });

    // Scoped Tasks
    const baseTasks = tasks.filter(t => {
      if (allowedCustomerIds.has(t.idKh)) return true;
      if (isOfficer && currentUser) {
        return (t.canBo || '').toLowerCase().trim() === currentUser.hoTen.toLowerCase().trim();
      }
      return false;
    });

    return {
      customers: baseCustomers,
      meetings: baseMeetings,
      tasks: baseTasks
    };
  }, [customers, meetings, tasks, currentUser, isOfficer, isLeader, isBranchLeader, isAdmin, userDept, users, selectedDeptFilter]);

  // List of unique departments for Admin / Ban Giám đốc filter
  const allDepartments = useMemo(() => {
    const set = new Set<string>();
    users.forEach(u => {
      if (u.phongBan && u.phongBan !== 'Quản trị hệ thống') set.add(u.phongBan);
    });
    customers.forEach(c => {
      if (c.phongBanKhoiTao) set.add(c.phongBanKhoiTao);
    });
    return Array.from(set).sort();
  }, [users, customers]);

  // Đếm số lượng cán bộ trong phạm vi
  const scopedOfficersCount = useMemo(() => {
    if (isOfficer) return 1;
    if (isLeader && !isAdmin) {
      return users.filter(u => u.phongBan.toLowerCase().trim() === userDept.toLowerCase().trim()).length;
    }
    if (selectedDeptFilter !== 'all') {
      return users.filter(u => u.phongBan === selectedDeptFilter).length;
    }
    return users.length;
  }, [isOfficer, isLeader, isAdmin, users, userDept, selectedDeptFilter]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      {/* ---------------------------------------------------- */}
      {/* NAVIGATION HEADER KHI ĐANG TRONG 1 BÁO CÁO CỤ THỂ    */}
      {/* ---------------------------------------------------- */}
      {activeReportTab !== 'menu' && (
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* Nút quay lại Menu chính chuẩn Mobile */}
            <button
              id="report-btn-back-menu"
              type="button"
              onClick={() => setActiveReportTab('menu')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-extrabold text-xs sm:text-sm cursor-pointer transition-all active:scale-95 shadow-xs shrink-0"
              title="Quay lại màn hình lựa chọn 3 báo cáo"
            >
              <ArrowLeft className="w-4 h-4 text-blue-700" />
              <span>← Menu Báo cáo</span>
            </button>

            {/* Tiêu đề báo cáo hiện tại */}
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Đang xem
              </span>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                {activeReportTab === 'by_officer' && '1. Báo cáo KH theo từng cán bộ'}
                {activeReportTab === 'summary' && '2. Báo cáo tổng hợp'}
                {activeReportTab === 'history' && '3. Lịch sử tiếp cận & gặp gỡ'}
              </h3>
            </div>
          </div>

          {/* Các nút chuyển nhanh báo cáo khác trên thanh điều hướng */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setActiveReportTab('by_officer')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeReportTab === 'by_officer'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              1. KH Cán bộ
            </button>
            <button
              type="button"
              onClick={() => setActiveReportTab('summary')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeReportTab === 'summary'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              2. Tổng hợp
            </button>
            <button
              type="button"
              onClick={() => setActiveReportTab('history')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeReportTab === 'history'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              3. Lịch sử tiếp cận
            </button>

            {/* Nút xuất file Lãnh đạo */}
            <button
              id="report-quick-export"
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="p-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all cursor-pointer shrink-0"
              title="Xuất file nộp Lãnh đạo"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 10. GIAO DIỆN MOBILE HUB: HIỂN THỊ CÁC BUTTON CHÍNH GIỮA */}
      {/* ---------------------------------------------------- */}
      {activeReportTab === 'menu' && (
        <div className="max-w-xl mx-auto w-full space-y-4 py-1 sm:py-4">
          {/* Header Banner Phân quyền chuẩn sắc đẹp */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <div className="flex items-center gap-1.5">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                    Quản trị Toàn chi nhánh
                  </span>
                ) : isLeader ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/30 text-amber-200 border border-amber-400/30">
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    Lãnh đạo • {userDept || 'Phòng ban'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    <UserCheck className="w-3.5 h-3.5 text-blue-300" />
                    Cán bộ • {currentUser?.hoTen || 'QHKH'}
                  </span>
                )}
              </div>

              <div className="text-[11px] font-bold text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                Tháng {currentMonth + 1}/{currentYear}
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              TRUNG TÂM BÁO CÁO & THỐNG KÊ
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
              Chạm chọn 1 trong 3 nội dung báo cáo bên dưới để xem số liệu chi tiết và tiến độ tiếp cận khách hàng.
            </p>

            {/* Filter phòng ban nếu là Admin */}
            {(isAdmin || isBranchLeader) && (
              <div className="mt-3 pt-3 border-t border-white/15 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-blue-200 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Lọc phòng:
                </span>
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="bg-white/15 border border-white/25 text-white text-xs rounded-xl px-2.5 py-1 focus:outline-none font-semibold cursor-pointer"
                >
                  <option value="all" className="text-slate-900">Tất cả phòng ban ({allDepartments.length})</option>
                  {allDepartments.map(dept => (
                    <option key={dept} value={dept} className="text-slate-900">{dept}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Ghi chú phạm vi dữ liệu cho cán bộ */}
          {isOfficer && (
            <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-3 flex items-center gap-2.5 text-xs text-blue-900 shadow-2xs">
              <User className="w-4 h-4 text-blue-700 shrink-0" />
              <span>
                Đang xem danh mục của cán bộ <strong>{currentUser?.hoTen}</strong> (@{currentUser?.user}).
              </span>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* 3 BUTTON LỰA CHỌN CHÍNH Ở CHÍNH GIỮA (CHUẨN GIAO DIỆN MOBILE)      */}
          {/* ------------------------------------------------------------------ */}
          <div className="space-y-3 pt-1">
            {/* 1. NÚT: BÁO CÁO KH THEO TỪNG CÁN BỘ */}
            <button
              id="mobile-btn-report-by-officer"
              type="button"
              onClick={() => setActiveReportTab('by_officer')}
              className="group w-full p-4 sm:p-5 bg-white hover:bg-blue-50/60 active:bg-blue-100/50 border-2 border-slate-200/90 hover:border-blue-500 rounded-2xl text-left shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-between gap-3.5"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-black text-slate-900 group-hover:text-blue-800 transition-colors">
                      1. Báo cáo KH theo từng cán bộ
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 shrink-0">
                      {scopedOfficersCount} Cán bộ
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    Danh mục khách hàng phụ trách, phân loại VIP, tình trạng CSKH và tiến độ tiếp cận của từng cán bộ.
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] font-bold text-blue-700">
                    <span>• {scopedData.customers.length} khách hàng trong danh mục</span>
                  </div>
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center shrink-0 transition-all">
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* 2. NÚT: BÁO CÁO TỔNG HỢP */}
            <button
              id="mobile-btn-report-summary"
              type="button"
              onClick={() => setActiveReportTab('summary')}
              className="group w-full p-4 sm:p-5 bg-white hover:bg-indigo-50/60 active:bg-indigo-100/50 border-2 border-slate-200/90 hover:border-indigo-500 rounded-2xl text-left shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-between gap-3.5"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-black text-slate-900 group-hover:text-indigo-800 transition-colors">
                      2. Báo cáo tổng hợp
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 shrink-0">
                      Toàn cảnh KPI
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    Toàn cảnh KPI phát triển KH mới, cơ cấu phân loại, cơ cấu nhu cầu tài chính và bảng tổng hợp năng suất.
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] font-bold text-indigo-700">
                    <span>• Biểu đồ phân loại &amp; nhu cầu tài chính</span>
                  </div>
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 flex items-center justify-center shrink-0 transition-all">
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* 3. NÚT: LỊCH SỬ TIẾP CẬN VÀ GẶP GỠ */}
            <button
              id="mobile-btn-report-history"
              type="button"
              onClick={() => setActiveReportTab('history')}
              className="group w-full p-4 sm:p-5 bg-white hover:bg-emerald-50/60 active:bg-emerald-100/50 border-2 border-slate-200/90 hover:border-emerald-500 rounded-2xl text-left shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-between gap-3.5"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                  <History className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                      3. Lịch sử tiếp cận & gặp gỡ
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                      {scopedData.meetings.length} Cuộc gặp
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    Nhật ký chi tiết các cuộc gặp, gọi điện, nhu cầu phát hiện, tình trạng sau gặp và lịch hẹn chăm sóc lại.
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] font-bold text-emerald-700">
                    <span>• Xem dạng Timeline hoặc Bảng dữ liệu</span>
                  </div>
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-600 flex items-center justify-center shrink-0 transition-all">
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>

          {/* Nút xuất file báo cáo nộp Lãnh đạo chuẩn mực */}
          <div className="pt-2">
            <button
              id="mobile-btn-export-leadership"
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-sm shadow-md cursor-pointer transition-all active:scale-98"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Xuất file Báo cáo nộp Lãnh đạo (In / Excel)</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* HIỂN THỊ NỘI DUNG BÁO CÁO ĐÃ CHỌN                   */}
      {/* ---------------------------------------------------- */}
      {activeReportTab === 'by_officer' && (
        <CustomerByOfficerReport
          customers={scopedData.customers}
          meetings={scopedData.meetings}
          tasks={scopedData.tasks}
          users={users}
          currentUser={currentUser}
          isAdmin={isAdmin}
          isLeader={isLeader}
          isOfficer={isOfficer}
          userDept={userDept}
          onSelectCustomer={onSelectCustomer}
        />
      )}

      {activeReportTab === 'summary' && (
        <SummaryReport
          scopedCustomers={scopedData.customers}
          scopedMeetings={scopedData.meetings}
          scopedTasks={scopedData.tasks}
          currentUser={currentUser}
          users={users}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          isAdmin={isAdmin}
          isLeader={isLeader}
          isOfficer={isOfficer}
          userDept={userDept}
        />
      )}

      {activeReportTab === 'history' && (
        <CustomerHistoryReport
          customers={scopedData.customers}
          meetings={scopedData.meetings}
          currentUser={currentUser}
          isAdmin={isAdmin}
          isLeader={isLeader}
          isOfficer={isOfficer}
          userDept={userDept}
          onSelectCustomer={onSelectCustomer}
        />
      )}

      {/* Export Report Modal */}
      {isExportModalOpen && (
        <DashboardReportExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          currentUser={currentUser || null}
          customers={customers}
          meetings={meetings}
          tasks={tasks}
        />
      )}
    </div>
  );
};
