import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  Search, 
  Filter, 
  Download, 
  Building2, 
  Phone, 
  Mail, 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ArrowUpRight, 
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Briefcase,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Customer, MeetingHistory, Task, AppUser } from '../../types';
import { normalizePhone } from '../../services/phoneUtils';

interface CustomerByOfficerReportProps {
  customers: Customer[];
  meetings: MeetingHistory[];
  tasks: Task[];
  users: AppUser[];
  currentUser?: AppUser | null;
  isAdmin: boolean;
  isLeader: boolean;
  isOfficer: boolean;
  userDept: string;
  onSelectCustomer?: (customer: Customer) => void;
}

export const CustomerByOfficerReport: React.FC<CustomerByOfficerReportProps> = ({
  customers,
  meetings,
  tasks,
  users,
  currentUser,
  isAdmin,
  isLeader,
  isOfficer,
  userDept,
  onSelectCustomer
}) => {
  // 1. Danh sách các cán bộ khả dụng theo phân quyền
  const availableOfficers = useMemo(() => {
    if (isOfficer && currentUser) {
      return [currentUser];
    }
    if (isLeader && !isAdmin) {
      // Lãnh đạo xem cán bộ thuộc phòng mình
      const deptUsers = users.filter(u => 
        u.phongBan && u.phongBan.toLowerCase().trim() === userDept.toLowerCase().trim()
      );
      return deptUsers.length > 0 ? deptUsers : users;
    }
    // Admin xem toàn bộ
    return users.filter(u => u.user.toLowerCase() !== 'admin');
  }, [isOfficer, isLeader, isAdmin, currentUser, users, userDept]);

  // Cán bộ được chọn mặc định
  const [selectedOfficerUser, setSelectedOfficerUser] = useState<string>(() => {
    if (isOfficer && currentUser) return currentUser.user;
    if (availableOfficers.length > 0) return availableOfficers[0].user;
    return '';
  });

  // Tìm kiếm & Bộ lọc danh sách KH của cán bộ
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [careFilter, setCareFilter] = useState('ALL');
  const [demandFilter, setDemandFilter] = useState('ALL');

  // Lấy thông tin AppUser của cán bộ đang chọn
  const activeOfficer = useMemo(() => {
    return availableOfficers.find(u => u.user.toLowerCase() === selectedOfficerUser.toLowerCase()) ||
           users.find(u => u.user.toLowerCase() === selectedOfficerUser.toLowerCase()) ||
           (currentUser && currentUser.user.toLowerCase() === selectedOfficerUser.toLowerCase() ? currentUser : null);
  }, [availableOfficers, users, currentUser, selectedOfficerUser]);

  const activeOfficerName = activeOfficer?.hoTen || selectedOfficerUser;

  // Lấy toàn bộ khách hàng được phân công cho cán bộ này
  const officerCustomers = useMemo(() => {
    const targetUsername = (activeOfficer?.user || selectedOfficerUser || '').toLowerCase().trim();
    const targetFullName = (activeOfficer?.hoTen || '').toLowerCase().trim();
    const targetEmail = (activeOfficer?.email || '').toLowerCase().trim();

    return customers.filter(c => {
      const cUser = (c.userCanBo || '').toLowerCase().trim();
      const cName = (c.canBoPhuTrach || '').toLowerCase().trim();
      const cEmail = (c.emailCanBo || '').toLowerCase().trim();

      return (
        (targetUsername && cUser === targetUsername) ||
        (targetFullName && cName === targetFullName) ||
        (targetEmail && cEmail === targetEmail)
      );
    });
  }, [customers, activeOfficer, selectedOfficerUser]);

  // Thống kê nhanh của cán bộ
  const officerStats = useMemo(() => {
    const total = officerCustomers.length;
    const vipCount = officerCustomers.filter(c => c.phanLoai.includes('VIP')).length;
    const activeCareCount = officerCustomers.filter(c => c.cheDoChamSoc === 'Bật').length;
    
    // Cuộc gặp của cán bộ
    const targetFullName = (activeOfficer?.hoTen || '').toLowerCase().trim();
    const officerMeetings = meetings.filter(m => 
      (m.canBoThucHien || '').toLowerCase().trim() === targetFullName ||
      officerCustomers.some(c => c.idKh === m.idKh)
    );

    // Nhiệm vụ của cán bộ
    const officerTasks = tasks.filter(t => 
      (t.canBo || '').toLowerCase().trim() === targetFullName ||
      officerCustomers.some(c => c.idKh === t.idKh)
    );

    const completedTasks = officerTasks.filter(t => t.trangThai === 'Hoàn thành').length;
    const pendingTasks = officerTasks.filter(t => t.trangThai === 'Chưa thực hiện' || t.trangThai === 'Đang thực hiện').length;
    const overdueTasks = officerTasks.filter(t => t.trangThai === 'Quá hạn').length;

    return {
      totalCustomers: total,
      vipCount,
      activeCareCount,
      totalMeetings: officerMeetings.length,
      totalTasks: officerTasks.length,
      completedTasks,
      pendingTasks,
      overdueTasks
    };
  }, [officerCustomers, meetings, tasks, activeOfficer]);

  // Lọc danh sách KH hiển thị
  const filteredCustomers = useMemo(() => {
    const list = officerCustomers.filter(c => {
      // Tìm kiếm từ khóa
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchName = (c.hoTen || '').toLowerCase().includes(term);
        const matchPhone = (c.sdt || '').includes(term);
        const matchCompany = (c.tenCongTy || '').toLowerCase().includes(term);
        const matchAddress = (c.diaChi || '').toLowerCase().includes(term);
        if (!matchName && !matchPhone && !matchCompany && !matchAddress) return false;
      }

      // Lọc phân loại
      if (tierFilter !== 'ALL' && c.phanLoai !== tierFilter) {
        return false;
      }

      // Lọc chế độ chăm sóc
      if (careFilter !== 'ALL' && c.cheDoChamSoc !== careFilter) {
        return false;
      }

      // Lọc nhu cầu
      if (demandFilter !== 'ALL') {
        const demand = (c.nhuCau || '').toLowerCase();
        if (demandFilter === 'VAY' && !demand.includes('vay') && !demand.includes('tín dụng')) return false;
        if (demandFilter === 'GUI' && !demand.includes('gửi') && !demand.includes('tiết kiệm') && !demand.includes('huy động')) return false;
        if (demandFilter === 'THE' && !demand.includes('thẻ') && !demand.includes('card')) return false;
      }

      return true;
    });

    const seen = new Set<string>();
    const unique: Customer[] = [];
    for (const c of list) {
      const key = (c.idKh || c.sdt || '').trim();
      if (!key) continue;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
    }
    return unique;
  }, [officerCustomers, searchTerm, tierFilter, careFilter, demandFilter]);

  // Tìm cuộc gặp gần nhất của từng khách hàng
  const getCustomerLastMeeting = (customerId: string) => {
    const custMeetings = meetings
      .filter(m => m.idKh === customerId)
      .sort((a, b) => new Date(b.thoiGianGap).getTime() - new Date(a.thoiGianGap).getTime());
    return custMeetings.length > 0 ? custMeetings[0] : null;
  };

  // Xuất file CSV danh sách khách hàng của cán bộ
  const handleExportOfficerCustomersCSV = () => {
    if (filteredCustomers.length === 0) {
      alert('Không có dữ liệu khách hàng để xuất file.');
      return;
    }

    const d = new Date();
    const dateStr = `${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
    const safeOfficerName = (activeOfficerName || 'CanBo').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');

    let csv = '\uFEFF'; // BOM UTF-8 for Excel Vietnamese support
    csv += `BÁO CÁO DANH MỤC KHÁCH HÀNG THEO CÁN BỘ QUẢN LÝ\n`;
    csv += `Cán bộ phụ trách:,"${activeOfficerName}"\n`;
    csv += `Phòng ban:,"${activeOfficer?.phongBan || userDept || 'Chi nhánh'}"\n`;
    csv += `Chức vụ:,"${activeOfficer?.viTri || 'QHKH'}"\n`;
    csv += `Ngày xuất báo cáo:,"${d.toLocaleDateString('vi-VN')}"\n`;
    csv += `Tổng số khách hàng phụ trách:,${officerCustomers.length}\n`;
    csv += `Số khách hàng theo bộ lọc:,${filteredCustomers.length}\n\n`;

    csv += `STT,Mã KH (SĐT),Họ tên Khách hàng,Loại KH,Tên công ty / Cơ quan,Chức vụ,Phân loại,Chế độ CSKH,Nhu cầu trọng tâm,Lần gặp gần nhất,Tình trạng sau gặp,Lịch hẹn tiếp theo,Địa chỉ\n`;

    filteredCustomers.forEach((c, idx) => {
      const lastM = getCustomerLastMeeting(c.idKh);
      const name = `"${(c.hoTen || '').replace(/"/g, '""')}"`;
      const company = `"${(c.tenCongTy || '').replace(/"/g, '""')}"`;
      const position = `"${(c.chucVu || '').replace(/"/g, '""')}"`;
      const demand = `"${(c.nhuCau || '').replace(/"/g, '""')}"`;
      const lastMeetDate = lastM?.thoiGianGap || 'Chưa gặp';
      const lastMeetStatus = lastM ? `"${lastM.tinhTrangSauGap.replace(/"/g, '""')}"` : '';
      const nextAppointment = lastM?.ngayHenLienHe || '';
      const address = `"${(c.diaChi || '').replace(/"/g, '""')}"`;
      const cleanPhone = normalizePhone(c.sdt) || (c.idKh && !c.idKh.startsWith('KH_') ? normalizePhone(c.idKh) : c.idKh) || '';

      csv += `${idx + 1},="${cleanPhone}",${name},${c.loaiKhachHang || 'Cá nhân'},${company},${position},${c.phanLoai},${c.cheDoChamSoc},${demand},${lastMeetDate},${lastMeetStatus},${nextAppointment},${address}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Bao_Cao_KH_${safeOfficerName}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Header & Officer Selection Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> Phân bổ QHKH
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Theo dõi chi tiết theo từng nhân sự
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              BÁO CÁO KHÁCH HÀNG THEO TỪNG CÁN BỘ QUẢN LÝ
            </h3>
            <p className="text-xs text-slate-500">
              Chi tiết danh mục khách hàng được giao phụ trách, phân loại mức độ tiềm năng và tiến độ tiếp cận.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-export-officer-customers-csv"
              onClick={handleExportOfficerCustomersCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm active:scale-98 transition-all cursor-pointer"
              title="Xuất bảng tính Excel danh sách KH của cán bộ"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel Cán bộ</span>
            </button>
          </div>
        </div>

        {/* Cán bộ Selector (Chỉ cho phép Admin hoặc Lãnh đạo chọn cán bộ khác) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Cán bộ đang xem:
            </span>
            {isOfficer ? (
              <div className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-blue-900 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                  {currentUser?.hoTen.charAt(0) || 'U'}
                </div>
                <span>{currentUser?.hoTen} (@{currentUser?.user})</span>
                <span className="text-[10px] text-slate-400 font-normal">● Tài khoản của bạn</span>
              </div>
            ) : (
              <select
                id="select-report-officer"
                value={selectedOfficerUser}
                onChange={(e) => setSelectedOfficerUser(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-hidden cursor-pointer min-w-[240px]"
              >
                {availableOfficers.map(u => {
                  const custCount = customers.filter(c => 
                    (c.userCanBo || '').toLowerCase() === u.user.toLowerCase() ||
                    (c.canBoPhuTrach || '').toLowerCase() === u.hoTen.toLowerCase()
                  ).length;
                  return (
                    <option key={u.user} value={u.user}>
                      {u.hoTen} ({u.phongBan}) • {custCount} KH
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Thuộc đơn vị: <strong className="text-slate-800">{activeOfficer?.phongBan || userDept || 'Chi nhánh'}</strong> • 
            Vị trí: <strong className="text-slate-800">{activeOfficer?.viTri || 'QHKH'}</strong>
          </div>
        </div>
      </div>

      {/* 2. Profile Card & Thống kê của Cán bộ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Officer Info Card */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center font-black text-lg text-amber-300 shadow-inner">
              {activeOfficerName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h4 className="text-base font-extrabold truncate text-white">
                {activeOfficerName}
              </h4>
              <p className="text-xs text-blue-200 truncate">
                {activeOfficer?.viTri || 'Cán bộ Quản lý Khách hàng'}
              </p>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-white/10 text-[10px] text-blue-100 font-mono">
                User: @{activeOfficer?.user || selectedOfficerUser}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/15 space-y-1.5 text-xs text-blue-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-blue-300 shrink-0" />
              <span className="truncate">{activeOfficer?.phongBan || userDept || 'Chi nhánh'}</span>
            </div>
            {activeOfficer?.sdt && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <a href={`tel:${activeOfficer.sdt}`} className="hover:underline text-white font-mono">
                  {activeOfficer.sdt}
                </a>
              </div>
            )}
            {activeOfficer?.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="truncate">{activeOfficer.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* 4 Chỉ số tóm tắt của Cán bộ */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Box 1: Tổng khách hàng */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">KH Phụ trách</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{officerStats.totalCustomers}</p>
            <p className="text-[10px] text-slate-400">Khách hàng được giao</p>
          </div>

          {/* Box 2: VIP / Siêu VIP */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Khách VIP</span>
              <Crown className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-600">{officerStats.vipCount}</p>
            <p className="text-[10px] text-slate-400">Ưu tiên chăm sóc</p>
          </div>

          {/* Box 3: Bật chăm sóc */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Bật CSKH</span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-600">{officerStats.activeCareCount}</p>
            <p className="text-[10px] text-slate-400">Nhắc việc tự động</p>
          </div>

          {/* Box 4: Cuộc gặp đã làm */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Cuộc gặp</span>
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-indigo-700">{officerStats.totalMeetings}</p>
            <p className="text-[10px] text-slate-400">Đã tiếp xúc & tư vấn</p>
          </div>
        </div>
      </div>

      {/* 3. Danh sách Khách hàng của Cán bộ (Kèm bộ lọc) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
              Danh mục khách hàng của {activeOfficerName} ({filteredCustomers.length}/{officerCustomers.length} KH)
            </h4>
            <p className="text-xs text-slate-500">
              Bấm vào tên khách hàng để xem chi tiết hồ sơ hoặc lịch sử giao dịch
            </p>
          </div>

          {/* Bộ lọc nhanh */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên, SĐT, công ty..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 outline-hidden"
              />
            </div>

            {/* Phân loại */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 outline-hidden cursor-pointer"
            >
              <option value="ALL">Tất cả phân loại</option>
              <option value="Đang tiếp thị">Đang tiếp thị</option>
              <option value="Đã có quan hệ tín dụng">Đã có QHTD</option>
              <option value="Khách hàng VIP">Khách VIP</option>
              <option value="Khách hàng Siêu VIP">Khách Siêu VIP</option>
            </select>

            {/* Chế độ CSKH */}
            <select
              value={careFilter}
              onChange={(e) => setCareFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 outline-hidden cursor-pointer"
            >
              <option value="ALL">CSKH: Tất cả</option>
              <option value="Bật">Đang Bật CSKH</option>
              <option value="Tắt">Đang Tắt CSKH</option>
            </select>

            {/* Nhu cầu */}
            <select
              value={demandFilter}
              onChange={(e) => setDemandFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 outline-hidden cursor-pointer"
            >
              <option value="ALL">Nhu cầu: Tất cả</option>
              <option value="VAY">Vay vốn</option>
              <option value="GUI">Tiền gửi / Tiết kiệm</option>
              <option value="THE">Thẻ tín dụng</option>
            </select>
          </div>
        </div>

        {/* Mobile View: Dạng thẻ Card cho màn hình điện thoại */}
        <div className="block md:hidden space-y-2.5">
          {filteredCustomers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl p-4">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
              <p className="font-bold text-slate-600">Không tìm thấy khách hàng nào</p>
              <p className="text-[11px] text-slate-400">
                {officerCustomers.length === 0 
                  ? `Cán bộ ${activeOfficerName} chưa được phân công khách hàng nào.` 
                  : 'Không có khách hàng phù hợp với điều kiện lọc.'}
              </p>
            </div>
          ) : (
            filteredCustomers.map((c, idx) => {
              const lastMeeting = getCustomerLastMeeting(c.idKh);
              const isVip = c.phanLoai.includes('VIP');

              return (
                <div 
                  key={`off-cust-card-${c.idKh || c.sdt}-${idx}`}
                  className="bg-slate-50 hover:bg-blue-50/50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{c.hoTen}</span>
                        {isVip && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      </div>
                      {c.tenCongTy && (
                        <p className="text-xs text-slate-600 mt-0.5 truncate">
                          {c.tenCongTy} {c.chucVu ? `• ${c.chucVu}` : ''}
                        </p>
                      )}
                      <p className="text-xs font-mono text-slate-500 mt-0.5">{c.sdt}</p>
                    </div>

                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                      c.phanLoai === 'Khách hàng Siêu VIP'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : c.phanLoai === 'Khách hàng VIP'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : c.phanLoai === 'Đã có quan hệ tín dụng'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {c.phanLoai}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/70">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Chế độ CSKH:</span>
                      <span className={`inline-flex items-center gap-1 font-bold ${c.cheDoChamSoc === 'Bật' ? 'text-emerald-700' : 'text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.cheDoChamSoc === 'Bật' ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                        {c.cheDoChamSoc === 'Bật' ? 'Đang bật CSKH' : 'Tắt CSKH'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Nhu cầu chính:</span>
                      <span className="font-semibold text-slate-700 truncate block">
                        {c.nhuCau || 'Chưa ghi nhận'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Gặp gần nhất:</span>
                      <span className="font-medium text-slate-800 block truncate">
                        {lastMeeting ? `${lastMeeting.thoiGianGap.split(' ')[0]} (${lastMeeting.tinhTrangSauGap})` : 'Chưa gặp'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Hẹn tiếp theo:</span>
                      <span className="font-bold text-amber-800 block truncate">
                        {lastMeeting?.ngayHenLienHe || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/70">
                    <button
                      type="button"
                      onClick={() => onSelectCustomer && onSelectCustomer(c)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-700 text-white text-xs font-bold active:scale-98 transition-transform cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Xem hồ sơ</span>
                    </button>
                    <a
                      href={`tel:${c.sdt}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold active:scale-98 transition-transform cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Gọi điện</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Table representation */}
        <div className="hidden md:block overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-10 text-center">STT</th>
                <th className="py-3 px-3">Khách hàng / Đơn vị</th>
                <th className="py-3 px-3">Phân loại</th>
                <th className="py-3 px-3 text-center">Chế độ CSKH</th>
                <th className="py-3 px-3">Nhu cầu chính</th>
                <th className="py-3 px-3">Lần gặp gần nhất</th>
                <th className="py-3 px-3">Hẹn tiếp theo</th>
                <th className="py-3 px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                    <p className="font-bold text-slate-600">Không tìm thấy khách hàng nào</p>
                    <p className="text-[11px] text-slate-400">
                      {officerCustomers.length === 0 
                        ? `Cán bộ ${activeOfficerName} chưa được phân công khách hàng nào.` 
                        : 'Không có khách hàng phù hợp với điều kiện tìm kiếm/lọc.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c, idx) => {
                  const lastMeeting = getCustomerLastMeeting(c.idKh);
                  const isVip = c.phanLoai.includes('VIP');

                  return (
                    <tr 
                      key={`off-cust-row-${c.idKh || c.sdt}-${idx}`} 
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>

                      {/* Khách hàng / Đơn vị */}
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => onSelectCustomer && onSelectCustomer(c)}
                          className="text-left group-hover:text-blue-700 transition-colors cursor-pointer"
                        >
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span>{c.hoTen}</span>
                            {isVip && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          </div>
                          {c.tenCongTy && (
                            <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                              {c.tenCongTy} {c.chucVu ? `(${c.chucVu})` : ''}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {normalizePhone(c.sdt) || c.sdt}
                          </div>
                        </button>
                      </td>

                      {/* Phân loại */}
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          c.phanLoai === 'Khách hàng Siêu VIP'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : c.phanLoai === 'Khách hàng VIP'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : c.phanLoai === 'Đã có quan hệ tín dụng'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {c.phanLoai}
                        </span>
                      </td>

                      {/* Chế độ CSKH */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.cheDoChamSoc === 'Bật'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.cheDoChamSoc === 'Bật' ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                          {c.cheDoChamSoc === 'Bật' ? 'Đang bật' : 'Tắt'}
                        </span>
                      </td>

                      {/* Nhu cầu chính */}
                      <td className="py-3 px-3 max-w-[180px]">
                        <p className="truncate text-slate-700 font-medium" title={c.nhuCau || 'Chưa ghi nhận'}>
                          {c.nhuCau || <span className="text-slate-400 italic">Chưa ghi nhận</span>}
                        </p>
                      </td>

                      {/* Lần gặp gần nhất */}
                      <td className="py-3 px-3">
                        {lastMeeting ? (
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-indigo-600" />
                              <span>{lastMeeting.thoiGianGap.split(' ')[0]}</span>
                            </div>
                            <span className="text-[10px] text-blue-700 block truncate max-w-[130px]" title={lastMeeting.tinhTrangSauGap}>
                              {lastMeeting.tinhTrangSauGap}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Chưa có lịch sử</span>
                        )}
                      </td>

                      {/* Hẹn tiếp theo */}
                      <td className="py-3 px-3">
                        {lastMeeting?.ngayHenLienHe ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-mono font-bold text-[11px]">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {lastMeeting.ngayHenLienHe}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectCustomer && onSelectCustomer(c)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                            title="Xem chi tiết hồ sơ khách hàng"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`tel:${normalizePhone(c.sdt) || c.sdt}`}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                            title={`Gọi điện cho ${c.hoTen}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
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
