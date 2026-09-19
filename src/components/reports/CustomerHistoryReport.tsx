import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Handshake, 
  Phone, 
  Video, 
  Mail, 
  MapPin, 
  FileText, 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  ArrowUpRight, 
  UserCheck, 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  ListFilter,
  Layers,
  Table as TableIcon
} from 'lucide-react';
import { Customer, MeetingHistory, MeetingFormat, MeetingStatus, AppUser } from '../../types';
import { normalizePhone } from '../../services/phoneUtils';

interface CustomerHistoryReportProps {
  customers: Customer[];
  meetings: MeetingHistory[];
  currentUser?: AppUser | null;
  isAdmin: boolean;
  isLeader: boolean;
  isOfficer: boolean;
  userDept: string;
  onSelectCustomer?: (customer: Customer) => void;
}

export const CustomerHistoryReport: React.FC<CustomerHistoryReportProps> = ({
  customers,
  meetings,
  currentUser,
  isAdmin,
  isLeader,
  isOfficer,
  userDept,
  onSelectCustomer
}) => {
  // 1. Chế độ xem: Timeline (Dòng thời gian) hoặc Table (Bảng dữ liệu)
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  // 2. Bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [selectedOfficer, setSelectedOfficer] = useState<string>('ALL');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<string>('ALL'); // ALL, 7DAYS, THIS_MONTH, LAST_MONTH, THIS_QUARTER

  // Danh sách các cán bộ có trong lịch sử cuộc gặp
  const availableOfficers = useMemo(() => {
    const set = new Set<string>();
    meetings.forEach(m => {
      if (m.canBoThucHien) set.add(m.canBoThucHien);
    });
    return Array.from(set).sort();
  }, [meetings]);

  // Map nhanh ID_KH -> Customer object
  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach(c => map.set(c.idKh, c));
    return map;
  }, [customers]);

  // 3. Lọc danh sách cuộc gặp
  const filteredMeetings = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return meetings.filter(m => {
      // Lọc theo Khách hàng
      if (selectedCustomerId !== 'ALL' && m.idKh !== selectedCustomerId) {
        return false;
      }

      // Lọc theo Cán bộ thực hiện
      if (selectedOfficer !== 'ALL' && m.canBoThucHien !== selectedOfficer) {
        return false;
      }

      // Lọc theo Hình thức
      if (selectedFormat !== 'ALL' && m.hinhThucGap !== selectedFormat) {
        return false;
      }

      // Lọc theo Tình trạng sau gặp
      if (selectedStatus !== 'ALL' && m.tinhTrangSauGap !== selectedStatus) {
        return false;
      }

      // Lọc theo Khoảng thời gian
      if (timeRange !== 'ALL') {
        const mDate = new Date(m.thoiGianGap);
        if (isNaN(mDate.getTime())) return true;

        if (timeRange === '7DAYS') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (mDate < sevenDaysAgo) return false;
        } else if (timeRange === 'THIS_MONTH') {
          if (mDate.getMonth() !== currentMonth || mDate.getFullYear() !== currentYear) return false;
        } else if (timeRange === 'LAST_MONTH') {
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          if (mDate.getMonth() !== prevMonth || mDate.getFullYear() !== prevYear) return false;
        } else if (timeRange === 'THIS_QUARTER') {
          const currentQuarter = Math.floor(currentMonth / 3);
          const mQuarter = Math.floor(mDate.getMonth() / 3);
          if (mQuarter !== currentQuarter || mDate.getFullYear() !== currentYear) return false;
        }
      }

      // Tìm kiếm từ khóa (Tên KH, SĐT, Nội dung, Kết quả)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const cust = customerMap.get(m.idKh);
        const matchCustName = cust && cust.hoTen.toLowerCase().includes(term);
        const matchCustPhone = cust && cust.sdt.includes(term);
        const matchCompany = cust && (cust.tenCongTy || '').toLowerCase().includes(term);
        const matchContent = (m.noiDungTraoDoi || '').toLowerCase().includes(term);
        const matchNeed = (m.nhuCauKhachHang || '').toLowerCase().includes(term);
        const matchNext = (m.congViecTiepTheo || '').toLowerCase().includes(term);
        const matchOfficer = (m.canBoThucHien || '').toLowerCase().includes(term);

        if (!matchCustName && !matchCustPhone && !matchCompany && !matchContent && !matchNeed && !matchNext && !matchOfficer) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.thoiGianGap).getTime() - new Date(a.thoiGianGap).getTime());
  }, [meetings, selectedCustomerId, selectedOfficer, selectedFormat, selectedStatus, timeRange, searchTerm, customerMap]);

  // 4. Thống kê KPI Tiếp cận
  const historyStats = useMemo(() => {
    const totalCount = filteredMeetings.length;
    const uniqueCustomerIds = new Set(filteredMeetings.map(m => m.idKh));
    const demandCount = filteredMeetings.filter(m => 
      m.tinhTrangSauGap === 'Có nhu cầu' || 
      m.tinhTrangSauGap === 'Đang xử lý' || 
      m.tinhTrangSauGap === 'Đã phát sinh giao dịch'
    ).length;
    const upcomingAppointments = filteredMeetings.filter(m => {
      if (!m.ngayHenLienHe) return false;
      const d = new Date(m.ngayHenLienHe);
      return !isNaN(d.getTime()) && d >= new Date();
    }).length;

    return {
      totalMeetings: totalCount,
      uniqueCustomers: uniqueCustomerIds.size,
      successOrDemandMeetings: demandCount,
      upcomingAppointments
    };
  }, [filteredMeetings]);

  // Xuất file CSV báo cáo lịch sử tiếp cận
  const handleExportHistoryCSV = () => {
    if (filteredMeetings.length === 0) {
      alert('Không có dữ liệu cuộc gặp để xuất file.');
      return;
    }

    const d = new Date();
    const dateStr = `${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;

    let csv = '\uFEFF'; // BOM UTF-8 for Excel Vietnamese support
    csv += `BÁO CÁO CHI TIẾT LỊCH SỬ TIẾP CẬN & GẶP GỠ KHÁCH HÀNG\n`;
    csv += `Đơn vị:,"VietinBank - ${userDept || 'Chi nhánh'}"\n`;
    csv += `Người trích xuất:,"${currentUser?.hoTen || 'QHKH'}"\n`;
    csv += `Ngày xuất:,"${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN')}"\n`;
    csv += `Tổng số cuộc tiếp xúc trích xuất:,${filteredMeetings.length}\n\n`;

    csv += `STT,Thời gian gặp,Mã KH (SĐT),Họ tên Khách hàng,Loại KH / Doanh nghiệp,Phân loại,Cán bộ thực hiện,Hình thức tiếp xúc,Nội dung trao đổi,Nhu cầu ghi nhận,Tình trạng sau gặp,Công việc tiếp theo,Ngày hẹn liên hệ lại,Ghi chú\n`;

    filteredMeetings.forEach((m, idx) => {
      const cust = customerMap.get(m.idKh);
      const custName = `"${(cust?.hoTen || m.idKh).replace(/"/g, '""')}"`;
      const custCompany = `"${(cust?.tenCongTy || cust?.loaiKhachHang || 'Cá nhân').replace(/"/g, '""')}"`;
      const custTier = `"${(cust?.phanLoai || 'Đang tiếp thị').replace(/"/g, '""')}"`;
      const officer = `"${(m.canBoThucHien || '').replace(/"/g, '""')}"`;
      const content = `"${(m.noiDungTraoDoi || '').replace(/"/g, '""')}"`;
      const need = `"${(m.nhuCauKhachHang || '').replace(/"/g, '""')}"`;
      const status = `"${(m.tinhTrangSauGap || '').replace(/"/g, '""')}"`;
      const nextTask = `"${(m.congViecTiepTheo || '').replace(/"/g, '""')}"`;
      const nextDate = m.ngayHenLienHe || '';
      const notes = `"${(m.ghiChu || '').replace(/"/g, '""')}"`;
      const cleanPhone = cust?.sdt ? normalizePhone(cust.sdt) : (normalizePhone(m.idKh) || m.idKh);

      csv += `${idx + 1},${m.thoiGianGap},="${cleanPhone}",${custName},${custCompany},${custTier},${officer},${m.hinhThucGap},${content},${need},${status},${nextTask},${nextDate},${notes}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Bao_Cao_Lich_Su_Tiep_Can_KH_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFormatBadge = (format: MeetingFormat) => {
    switch (format) {
      case 'Gặp trực tiếp':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
            <MapPin className="w-3 h-3 text-blue-600" /> Trực tiếp
          </span>
        );
      case 'Điện thoại':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
            <Phone className="w-3 h-3 text-emerald-600" /> Điện thoại
          </span>
        );
      case 'Video call':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">
            <Video className="w-3 h-3 text-purple-600" /> Video call
          </span>
        );
      case 'Email':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
            <Mail className="w-3 h-3 text-amber-600" /> Email
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
            {format}
          </span>
        );
    }
  };

  const getStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case 'Đã phát sinh giao dịch':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Có nhu cầu':
      case 'Đang xử lý':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Đang tư vấn':
      case 'Đang tiếp cận':
      case 'Đã gặp khách hàng':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Chưa thành công':
      case 'Không còn nhu cầu':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Header & Quick Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1">
                <Handshake className="w-3.5 h-3.5" /> Nhật ký quan hệ khách hàng
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Dòng thời gian tương tác & tiếp xúc
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              BÁO CÁO CHI TIẾT LỊCH SỬ TIẾP CẬN & GẶP GỠ KHÁCH HÀNG
            </h3>
            <p className="text-xs text-slate-500">
              Theo dõi chi tiết tiến trình gặp gỡ, tư vấn sản phẩm, kết quả sau gặp và kế hoạch tái tiếp xúc của từng khách hàng.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Xem dạng Dòng thời gian trực quan"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Xem dạng Bảng dữ liệu chi tiết"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Bảng dữ liệu</span>
              </button>
            </div>

            {/* Export CSV */}
            <button
              id="btn-export-history-csv"
              onClick={handleExportHistoryCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm active:scale-98 transition-all cursor-pointer"
              title="Xuất bảng tính Excel lịch sử tiếp xúc"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>

        {/* 4 Chỉ số KPI tiếp cận */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Tổng lượt tiếp xúc</span>
            <p className="text-xl sm:text-2xl font-black text-slate-900">{historyStats.totalMeetings}</p>
            <p className="text-[10px] text-slate-400">Gặp mặt, gọi điện, trao đổi</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">KH được tiếp cận</span>
            <p className="text-xl sm:text-2xl font-black text-blue-700">{historyStats.uniqueCustomers} KH</p>
            <p className="text-[10px] text-slate-400">Khách hàng duy nhất</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Có nhu cầu / Giao dịch</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-700">{historyStats.successOrDemandMeetings}</p>
            <p className="text-[10px] text-slate-400">Đạt hiệu quả tích cực</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Lịch hẹn tương lai</span>
            <p className="text-xl sm:text-2xl font-black text-amber-600">{historyStats.upcomingAppointments}</p>
            <p className="text-[10px] text-slate-400">Cần tái tiếp xúc</p>
          </div>
        </div>

        {/* Thanh lọc đa chiều */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* 1. Tìm kiếm */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm KH, nội dung, cán bộ..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 outline-hidden"
            />
          </div>

          {/* 2. Chọn Khách hàng cụ thể */}
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 outline-hidden cursor-pointer"
          >
            <option value="ALL">Tất cả khách hàng ({customers.length})</option>
            {customers.map((c, cIdx) => (
              <option key={`hist-cust-opt-${c.idKh || c.sdt}-${cIdx}`} value={c.idKh}>
                {c.hoTen} ({normalizePhone(c.sdt) || c.sdt})
              </option>
            ))}
          </select>

          {/* 3. Lọc theo Cán bộ thực hiện */}
          <select
            value={selectedOfficer}
            onChange={(e) => setSelectedOfficer(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 outline-hidden cursor-pointer"
          >
            <option value="ALL">Tất cả cán bộ thực hiện</option>
            {availableOfficers.map((off, oIdx) => (
              <option key={`hist-off-opt-${off}-${oIdx}`} value={off}>{off}</option>
            ))}
          </select>

          {/* 4. Lọc theo Khoảng thời gian */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 outline-hidden cursor-pointer"
          >
            <option value="ALL">Thời gian: Toàn bộ</option>
            <option value="7DAYS">7 ngày gần nhất</option>
            <option value="THIS_MONTH">Trong tháng này</option>
            <option value="LAST_MONTH">Tháng trước</option>
            <option value="THIS_QUARTER">Trong quý này</option>
          </select>

          {/* 5. Lọc theo Tình trạng sau gặp */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 outline-hidden cursor-pointer"
          >
            <option value="ALL">Tất cả tình trạng</option>
            <option value="Đang tiếp cận">Đang tiếp cận</option>
            <option value="Đã gặp khách hàng">Đã gặp khách hàng</option>
            <option value="Đang tư vấn">Đang tư vấn</option>
            <option value="Có nhu cầu">Có nhu cầu</option>
            <option value="Đang xử lý">Đang xử lý</option>
            <option value="Đã phát sinh giao dịch">Đã phát sinh giao dịch</option>
            <option value="Chưa thành công">Chưa thành công</option>
            <option value="Không còn nhu cầu">Không còn nhu cầu</option>
          </select>
        </div>
      </div>

      {/* 2. Hiển thị nội dung theo View Mode */}
      {filteredMeetings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs space-y-2">
          <Handshake className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-700">Không tìm thấy lịch sử tiếp cận nào</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Không có cuộc gặp hoặc tương tác nào phù hợp với bộ lọc tìm kiếm hiện tại. Bạn có thể chọn khoảng thời gian rộng hơn hoặc xóa bớt tiêu chí lọc.
          </p>
        </div>
      ) : viewMode === 'timeline' ? (
        /* TIMELINE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Dòng thời gian tương tác gần nhất ({filteredMeetings.length} cuộc gặp)
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Sắp xếp: Mới nhất trước
            </span>
          </div>

          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-100">
            {filteredMeetings.map((m, idx) => {
              const cust = customerMap.get(m.idKh);
              const isVip = cust?.phanLoai.includes('VIP');

              return (
                <div key={m.idLichSu || idx} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full bg-white border-4 border-blue-600 shadow-xs group-hover:scale-110 transition-transform"></div>

                  <div className="bg-slate-50 hover:bg-blue-50/40 border border-slate-200 rounded-2xl p-4 sm:p-5 transition-all shadow-2xs space-y-3">
                    {/* Header line: Date, Format, Officer, Customer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-700" />
                          {m.thoiGianGap}
                        </span>
                        {getFormatBadge(m.hinhThucGap)}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusBadge(m.tinhTrangSauGap)}`}>
                          {m.tinhTrangSauGap}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Cán bộ: <strong className="text-slate-800">{m.canBoThucHien || 'QHKH'}</strong></span>
                      </div>
                    </div>

                    {/* Customer Target Info */}
                    <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 truncate">
                            {cust?.hoTen || `Khách hàng #${m.idKh}`}
                          </span>
                          {isVip && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          {cust?.phanLoai && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                              {cust.phanLoai}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                          {cust?.tenCongTy && <span className="font-medium text-slate-700">{cust.tenCongTy}</span>}
                          <span className="font-mono text-slate-400">SĐT: {cust?.sdt ? normalizePhone(cust.sdt) : (normalizePhone(m.idKh) || m.idKh)}</span>
                          {cust?.diaChi && <span className="truncate max-w-[250px]">{cust.diaChi}</span>}
                        </div>
                      </div>

                      {cust && onSelectCustomer && (
                        <button
                          type="button"
                          onClick={() => onSelectCustomer(cust)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                        >
                          <span>Hồ sơ KH</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Content / Nhu cầu / Kế hoạch */}
                    <div className="space-y-2 text-xs">
                      {/* Nội dung trao đổi */}
                      <div>
                        <span className="font-bold text-slate-700 block mb-0.5">Nội dung cuộc gặp:</span>
                        <p className="text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed">
                          {m.noiDungTraoDoi || 'Chưa ghi nhận chi tiết nội dung.'}
                        </p>
                      </div>

                      {/* Nhu cầu & Việc tiếp theo */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {m.nhuCauKhachHang && (
                          <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
                            <span className="font-bold text-blue-900 block text-[11px] mb-0.5">
                              Nhu cầu phát hiện:
                            </span>
                            <span className="text-blue-800 font-medium">{m.nhuCauKhachHang}</span>
                          </div>
                        )}

                        {m.congViecTiepTheo && (
                          <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100">
                            <span className="font-bold text-amber-900 block text-[11px] mb-0.5">
                              Công việc tiếp theo:
                            </span>
                            <span className="text-amber-800 font-medium">{m.congViecTiepTheo}</span>
                          </div>
                        )}
                      </div>

                      {/* Hẹn tái tiếp xúc */}
                      {m.ngayHenLienHe && (
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-100/60 px-3 py-1.5 rounded-xl border border-amber-200 w-fit">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Hẹn liên hệ lại vào: {m.ngayHenLienHe}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Bảng dữ liệu chi tiết ({filteredMeetings.length} bản ghi)
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase font-extrabold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">STT</th>
                  <th className="py-3 px-3">Thời gian</th>
                  <th className="py-3 px-3">Khách hàng</th>
                  <th className="py-3 px-3">Cán bộ</th>
                  <th className="py-3 px-3">Hình thức</th>
                  <th className="py-3 px-3">Nội dung trao đổi</th>
                  <th className="py-3 px-3">Tình trạng sau gặp</th>
                  <th className="py-3 px-3">Hẹn tiếp theo</th>
                  <th className="py-3 px-3 text-center">Hồ sơ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMeetings.map((m, idx) => {
                  const cust = customerMap.get(m.idKh);
                  return (
                    <tr key={m.idLichSu || idx} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-900">
                        {m.thoiGianGap}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-slate-900">
                          {cust?.hoTen || m.idKh}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {cust?.sdt ? normalizePhone(cust.sdt) : (normalizePhone(m.idKh) || m.idKh)}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                        {m.canBoThucHien || 'QHKH'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getFormatBadge(m.hinhThucGap)}
                      </td>
                      <td className="py-3 px-3 max-w-[220px]">
                        <p className="truncate text-slate-700" title={m.noiDungTraoDoi}>
                          {m.noiDungTraoDoi}
                        </p>
                        {m.nhuCauKhachHang && (
                          <span className="text-[10px] text-blue-700 block truncate" title={m.nhuCauKhachHang}>
                            Nhu cầu: {m.nhuCauKhachHang}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusBadge(m.tinhTrangSauGap)}`}>
                          {m.tinhTrangSauGap}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {m.ngayHenLienHe ? (
                          <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                            {m.ngayHenLienHe}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {cust && onSelectCustomer && (
                          <button
                            type="button"
                            onClick={() => onSelectCustomer(cust)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                            title="Xem chi tiết hồ sơ khách hàng"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
