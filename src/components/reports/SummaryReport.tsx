import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  Users, 
  CheckCircle2, 
  Handshake, 
  TrendingUp,
  UserPlus,
  Download,
  ShieldCheck,
  Crown,
  UserCheck
} from 'lucide-react';
import { Customer, MeetingHistory, Task, AppUser } from '../../types';

interface SummaryReportProps {
  scopedCustomers: Customer[];
  scopedMeetings: MeetingHistory[];
  scopedTasks: Task[];
  currentUser?: AppUser | null;
  users?: AppUser[];
  onOpenExportModal: () => void;
  isAdmin: boolean;
  isLeader: boolean;
  isOfficer: boolean;
  userDept: string;
}

export const SummaryReport: React.FC<SummaryReportProps> = ({
  scopedCustomers,
  scopedMeetings,
  scopedTasks,
  currentUser,
  users = [],
  onOpenExportModal,
  isAdmin,
  isLeader,
  isOfficer,
  userDept
}) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. KPI Cards from Scoped Data
  const totalCustomers = scopedCustomers.length;

  const newCustomersThisMonth = scopedCustomers.filter(c => {
    if (!c.ngayTao) return false;
    const d = new Date(c.ngayTao);
    if (isNaN(d.getTime())) return false;
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const totalMeetings = scopedMeetings.length;

  const completedTasksCount = scopedTasks.filter(t => t.trangThai === 'Hoàn thành').length;
  const taskCompletionRate = scopedTasks.length > 0 
    ? Math.round((completedTasksCount / scopedTasks.length) * 100) 
    : 100;

  // 2. Khách hàng theo phân loại
  const classificationStats = React.useMemo(() => {
    let tiepThi = 0;
    let qhtd = 0;
    let vip = 0;
    let sieuVip = 0;

    scopedCustomers.forEach(c => {
      if (c.phanLoai.includes('Siêu VIP')) {
        sieuVip++;
      } else if (c.phanLoai.includes('VIP')) {
        vip++;
      } else if (c.phanLoai.includes('quan hệ tín dụng')) {
        qhtd++;
      } else {
        tiepThi++;
      }
    });

    return [
      { name: 'Đang tiếp thị', count: tiepThi, color: '#0284c7' },
      { name: 'Đã có QHTD', count: qhtd, color: '#059669' },
      { name: 'Khách hàng VIP', count: vip, color: '#d97706' },
      { name: 'Khách hàng Siêu VIP', count: sieuVip, color: '#7e22ce' },
    ];
  }, [scopedCustomers]);

  const pieDataClassification = classificationStats.map(item => ({
    name: item.name,
    value: item.count
  }));

  // 3. Khách hàng theo nhu cầu tài chính
  const demandStats = React.useMemo(() => {
    let vay = 0;
    let tienGui = 0;
    let the = 0;
    let dichVuKhac = 0;

    scopedCustomers.forEach(c => {
      const demandText = (c.nhuCau || '').toLowerCase();
      let matched = false;

      if (demandText.includes('vay') || demandText.includes('tín dụng') || demandText.includes('thế chấp') || demandText.includes('vốn')) {
        vay++;
        matched = true;
      }
      if (demandText.includes('gửi') || demandText.includes('tiết kiệm') || demandText.includes('tiền gửi') || demandText.includes('huy động')) {
        tienGui++;
        matched = true;
      }
      if (demandText.includes('thẻ') || demandText.includes('card') || demandText.includes('visa') || demandText.includes('master')) {
        the++;
        matched = true;
      }
      if (!matched && demandText.trim().length > 0) {
        dichVuKhac++;
      }
    });

    return [
      { category: 'Nhu cầu Vay', count: vay, fill: '#2563eb' },
      { category: 'Nhu cầu Tiền gửi', count: tienGui, fill: '#059669' },
      { category: 'Nhu cầu Thẻ', count: the, fill: '#ea580c' },
      { category: 'Dịch vụ khác', count: dichVuKhac, fill: '#8b5cf6' },
    ];
  }, [scopedCustomers]);

  // 4. Báo cáo năng suất theo từng Cán bộ trong phạm vi phân quyền
  const officerStats = React.useMemo(() => {
    const stats: Record<string, { officer: string; customers: number; meetings: number; completedTasks: number; totalTasks: number }> = {};

    if (isOfficer && currentUser) {
      stats[currentUser.hoTen] = {
        officer: currentUser.hoTen,
        customers: 0,
        meetings: 0,
        completedTasks: 0,
        totalTasks: 0
      };
    }

    scopedCustomers.forEach(c => {
      const off = c.canBoPhuTrach || 'Chưa phân công';
      if (!stats[off]) {
        stats[off] = { officer: off, customers: 0, meetings: 0, completedTasks: 0, totalTasks: 0 };
      }
      stats[off].customers++;
    });

    scopedMeetings.forEach(m => {
      const off = m.canBoThucHien || 'QHKH';
      if (!stats[off]) {
        stats[off] = { officer: off, customers: 0, meetings: 0, completedTasks: 0, totalTasks: 0 };
      }
      stats[off].meetings++;
    });

    scopedTasks.forEach(t => {
      const off = t.canBo || 'QHKH';
      if (!stats[off]) {
        stats[off] = { officer: off, customers: 0, meetings: 0, completedTasks: 0, totalTasks: 0 };
      }
      stats[off].totalTasks++;
      if (t.trangThai === 'Hoàn thành') {
        stats[off].completedTasks++;
      }
    });

    return Object.values(stats).sort((a, b) => b.customers - a.customers);
  }, [scopedCustomers, scopedMeetings, scopedTasks, isOfficer, currentUser]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Action Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
              Báo cáo định kỳ
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Kỳ thống kê: Tháng {currentMonth + 1}/{currentYear}
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            BÁO CÁO TỔNG HỢP HOẠT ĐỘNG & DANH MỤC KHÁCH HÀNG
          </h3>
          <p className="text-xs text-slate-500">
            Tổng quan các chỉ tiêu KPI tiếp thị, cơ cấu phân loại khách hàng, nhu cầu tài chính và năng suất chung.
          </p>
        </div>

        <button
          id="btn-summary-export-leadership"
          onClick={onOpenExportModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-sm shadow-amber-500/20 active:scale-98 transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Báo cáo nộp Lãnh đạo</span>
        </button>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Card 1: Tổng số khách hàng */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isOfficer ? 'KH của tôi' : 'Tổng khách hàng'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalCustomers}</p>
          <p className="text-[11px] text-slate-400">
            {isOfficer ? 'Bạn đang quản lý' : isLeader ? `Thuộc ${userDept}` : 'Trên toàn hệ thống'}
          </p>
        </div>

        {/* Card 2: Khách hàng mới trong tháng */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mới trong tháng</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700">+{newCustomersThisMonth}</p>
          <p className="text-[11px] text-slate-400">Khách hàng phát triển mới</p>
        </div>

        {/* Card 3: Số cuộc gặp đã thực hiện */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cuộc gặp gỡ</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Handshake className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-900">{totalMeetings}</p>
          <p className="text-[11px] text-slate-400">Đã ghi nhận tiếp xúc</p>
        </div>

        {/* Card 4: Tỷ lệ hoàn thành công việc */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hoàn thành việc</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-700">{taskCompletionRate}%</p>
          <p className="text-[11px] text-slate-400">{completedTasksCount} / {scopedTasks.length} nhiệm vụ đã xong</p>
        </div>
      </div>

      {/* 2 Biểu đồ chính: Phân loại KH & Nhu cầu KH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Biểu đồ 1: Khách hàng theo phân loại */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-700" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Cơ cấu phân loại khách hàng
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {totalCustomers} KH
            </span>
          </div>

          {totalCustomers === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center p-4">
              <Users className="w-8 h-8 text-slate-300 mb-1" />
              <p className="text-xs font-bold text-slate-600">Chưa có dữ liệu khách hàng</p>
              <p className="text-[11px] text-slate-400">Danh mục khách hàng chưa phát sinh trong phạm vi này</p>
            </div>
          ) : (
            <>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieDataClassification}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }: { name: string; percent: number }) => percent > 0 ? `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%` : ''}
                    >
                      {classificationStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                {classificationStats.map(stat => (
                  <div key={stat.name} className="p-2 rounded-xl bg-slate-50 text-center">
                    <span className="block text-[11px] font-bold text-slate-500 truncate">{stat.name}</span>
                    <strong className="text-sm font-black" style={{ color: stat.color }}>{stat.count} KH</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Biểu đồ 2: Khách hàng theo nhu cầu tài chính */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-700" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Khách hàng theo nhu cầu tài chính
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Đã ghi nhận
            </span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Số khách hàng" radius={[6, 6, 0, 0]}>
                  {demandStats.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-900 text-center">
              <span className="block text-[11px] font-bold">Vay vốn</span>
              <strong className="text-sm font-black">{demandStats[0].count} KH</strong>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-900 text-center">
              <span className="block text-[11px] font-bold">Tiền gửi</span>
              <strong className="text-sm font-black">{demandStats[1].count} KH</strong>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-900 text-center">
              <span className="block text-[11px] font-bold">Thẻ tín dụng</span>
              <strong className="text-sm font-black">{demandStats[2].count} KH</strong>
            </div>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-900 text-center">
              <span className="block text-[11px] font-bold">DV khác</span>
              <strong className="text-sm font-black">{demandStats[3].count} KH</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng Năng suất tổng quan */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-700" />
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Tổng hợp năng suất Cán bộ Quản lý
            </h3>
            <p className="text-xs text-slate-500">
              Số lượng khách hàng quản lý, số cuộc tiếp xúc đã thực hiện và tỷ lệ hoàn thành công việc
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Cán bộ QHKH</th>
                <th className="py-3 px-3 text-center">Khách hàng quản lý</th>
                <th className="py-3 px-3 text-center">Cuộc gặp đã làm</th>
                <th className="py-3 px-3 text-center">Việc đã hoàn thành</th>
                <th className="py-3 px-3 text-right">Tỷ lệ hoàn thành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {officerStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">
                    Chưa có số liệu phát sinh trong phạm vi này.
                  </td>
                </tr>
              ) : (
                officerStats.map((item, idx) => {
                  const completionRate = item.totalTasks > 0
                    ? Math.round((item.completedTasks / item.totalTasks) * 100)
                    : 100;
                  const isCurrentLoggedIn = currentUser && item.officer.toLowerCase().trim() === currentUser.hoTen.toLowerCase().trim();

                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrentLoggedIn ? 'bg-blue-50/50 font-bold' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                          isCurrentLoggedIn ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.officer.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="truncate block">{item.officer}</span>
                          {isCurrentLoggedIn && (
                            <span className="text-[10px] text-blue-700 font-bold">● Bạn (Đang đăng nhập)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-extrabold text-slate-800">
                        {item.customers} KH
                      </td>
                      <td className="py-3 px-3 text-center font-extrabold text-blue-700">
                        {item.meetings} cuộc gặp
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {item.completedTasks} / {item.totalTasks} việc
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2.5 py-1 rounded-full font-black text-[11px] ${
                          completionRate >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : completionRate >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {completionRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
