import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Building2, 
  Calendar, 
  User, 
  CheckCircle2, 
  Briefcase, 
  TrendingUp, 
  ArrowLeft,
  Sparkles,
  Edit3
} from 'lucide-react';
import { Customer, MeetingHistory, Task, CareEvent, AppUser } from '../types';
import { normalizePhone } from '../services/phoneUtils';

interface DashboardReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  customers: Customer[];
  meetings: MeetingHistory[];
  tasks: Task[];
  careEvents?: CareEvent[];
}

export const DashboardReportExportModal: React.FC<DashboardReportExportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  customers,
  meetings,
  tasks
}) => {
  const [reportDate] = useState(() => {
    const d = new Date();
    return `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
  });

  const [customProposal, setCustomProposal] = useState(
    'Kính trình Lãnh đạo phòng xem xét, phê duyệt chính sách lãi suất ưu đãi cho nhóm khách hàng VIP và hỗ trợ đẩy nhanh thẩm định các khoản vay phục vụ SXKD trong tháng.'
  );
  const [isEditingProposal, setIsEditingProposal] = useState(false);

  // Filter data according to user role
  const isLeader = currentUser?.role === 'LANH_DAO' || currentUser?.isLeader;
  const isAdmin = currentUser?.role === 'ADMIN';

  const relevantCustomers = useMemo(() => {
    if (isAdmin) return customers;
    if (isLeader) {
      return customers.filter(c => 
        !c.phongBanKhoiTao || 
        c.phongBanKhoiTao.toLowerCase() === (currentUser?.phongBan || '').toLowerCase()
      );
    }
    // RM officer
    return customers.filter(c => 
      c.userCanBo === currentUser?.user || 
      c.canBoPhuTrach === currentUser?.hoTen ||
      (currentUser?.email && c.emailCanBo?.toLowerCase() === currentUser.email.toLowerCase())
    );
  }, [customers, currentUser, isAdmin, isLeader]);

  const relevantMeetings = useMemo(() => {
    const custIdSet = new Set(relevantCustomers.map(c => c.idKh));
    return meetings.filter(m => custIdSet.has(m.idKh) || (currentUser && m.nguoiTao === currentUser.hoTen));
  }, [meetings, relevantCustomers, currentUser]);

  const relevantTasks = useMemo(() => {
    const custIdSet = new Set(relevantCustomers.map(c => c.idKh));
    return tasks.filter(t => custIdSet.has(t.idKh) || (currentUser && t.canBo === currentUser.hoTen));
  }, [tasks, relevantCustomers, currentUser]);

  // Calculations
  const totalCust = relevantCustomers.length;
  const enterpriseCount = relevantCustomers.filter(c => c.loaiKhachHang === 'Tổ chức').length;
  const individualCount = relevantCustomers.filter(c => c.loaiKhachHang !== 'Tổ chức').length;
  const activeCareCount = relevantCustomers.filter(c => c.cheDoChamSoc === 'Bật').length;

  const vipCount = relevantCustomers.filter(c => c.phanLoai && c.phanLoai.toLowerCase().includes('vip')).length;
  const creditCount = relevantCustomers.filter(c => c.phanLoai && c.phanLoai.toLowerCase().includes('tín dụng')).length;
  const prospectCount = relevantCustomers.filter(c => c.phanLoai && c.phanLoai.toLowerCase().includes('tiềm năng')).length;

  const totalMeetings = relevantMeetings.length;
  const recentMeetings = useMemo(() => {
    return [...relevantMeetings]
      .sort((a, b) => new Date(b.thoiGianGap).getTime() - new Date(a.thoiGianGap).getTime())
      .slice(0, 10);
  }, [relevantMeetings]);

  const completedTasks = relevantTasks.filter(t => t.trangThai === 'Hoàn thành').length;
  const pendingTasks = relevantTasks.filter(t => t.trangThai === 'Chưa thực hiện' || t.trangThai === 'Đang thực hiện').length;
  const overdueTasks = relevantTasks.filter(t => t.trangThai === 'Quá hạn').length;

  if (!isOpen) return null;

  // Handle CSV / Excel Export
  const handleExportCSV = () => {
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel

    csvContent += `NGÂN HÀNG TMCP CÔNG THƯƠNG VIỆT NAM - CHI NHÁNH NINH BÌNH\n`;
    csvContent += `BÁO CÁO KẾT QUẢ QUẢN LÝ VÀ CHĂM SÓC KHÁCH HÀNG CHỦ ĐỘNG\n`;
    csvContent += `Thời điểm xuất báo cáo: ${d.toLocaleString('vi-VN')}\n`;
    csvContent += `Cán bộ lập báo cáo: ${currentUser?.hoTen || 'Cán bộ QHKH'} (@${currentUser?.user || ''})\n`;
    csvContent += `Phòng ban: ${currentUser?.phongBan || 'Ngân hàng'}\n`;
    csvContent += `Chức vụ: ${currentUser?.viTri || 'Cán bộ QHKH'}\n\n`;

    // Part 1: KPIs
    csvContent += `I. TỔNG HỢP CHỈ TIÊU HOẠT ĐỘNG CHĂM SÓC KHÁCH HÀNG\n`;
    csvContent += `Chỉ tiêu,Số lượng,Ghi chú\n`;
    csvContent += `Tổng số khách hàng quản lý,${totalCust},Doanh nghiệp: ${enterpriseCount} | Cá nhân: ${individualCount}\n`;
    csvContent += `Khách hàng đang bật chăm sóc chủ động,${activeCareCount},Tỷ lệ: ${totalCust > 0 ? Math.round((activeCareCount / totalCust) * 100) : 0}%\n`;
    csvContent += `Khách hàng VIP / Siêu VIP,${vipCount},\n`;
    csvContent += `Khách hàng quan hệ tín dụng,${creditCount},\n`;
    csvContent += `Tổng số lượt gặp gỡ / tiếp xúc,${totalMeetings},Ghi nhận trực tiếp kèm định vị GPS\n`;
    csvContent += `Công việc phát sinh sau cuộc gặp,${relevantTasks.length},Hoàn thành: ${completedTasks} | Đang làm: ${pendingTasks} | Quá hạn: ${overdueTasks}\n\n`;

    // Part 2: Customer List
    csvContent += `II. DANH SÁCH KHÁCH HÀNG QUẢN LÝ\n`;
    csvContent += `STT,Mã KH (SĐT),Họ tên / Đơn vị,Loại KH,Chức vụ / Người đại diện,Phân loại,Chế độ chăm sóc,Nhu cầu trọng tâm,Cán bộ phụ trách\n`;
    relevantCustomers.forEach((c, idx) => {
      const name = `"${(c.hoTen || '').replace(/"/g, '""')}"`;
      const company = `"${(c.tenCongTy || '').replace(/"/g, '""')}"`;
      const demand = `"${(c.nhuCau || '').replace(/"/g, '""')}"`;
      const manager = `"${(c.canBoPhuTrach || '').replace(/"/g, '""')}"`;
      const cleanPhone = normalizePhone(c.sdt) || (c.idKh && !c.idKh.startsWith('KH_') ? normalizePhone(c.idKh) : c.idKh) || '';
      csvContent += `${idx + 1},="${cleanPhone}",${name},${c.loaiKhachHang},${company},${c.phanLoai},${c.cheDoChamSoc},${demand},${manager}\n`;
    });
    csvContent += `\n`;

    // Part 3: Meeting History
    csvContent += `III. LỊCH SỬ TIẾP XÚC & CUỘC GẶP GẦN NHẤT\n`;
    csvContent += `STT,Thời gian,Khách hàng,Hình thức,Nội dung trao đổi,Kết quả cuộc gặp,Đánh giá tiềm năng,Người ghi nhận\n`;
    recentMeetings.forEach((m, idx) => {
      const cust = relevantCustomers.find(c => c.idKh === m.idKh);
      const custName = `"${(cust?.hoTen || m.idKh).replace(/"/g, '""')}"`;
      const content = `"${(m.noiDungTraoDoi || '').replace(/"/g, '""')}"`;
      const result = `"${(m.ketQuaCuocGap || '').replace(/"/g, '""')}"`;
      const creator = `"${(m.nguoiTao || '').replace(/"/g, '""')}"`;
      csvContent += `${idx + 1},${m.thoiGianGap},${custName},${m.hinhThucGap},${content},${result},${m.danhGiaTiemNang},${creator}\n`;
    });
    csvContent += `\n`;

    // Part 4: Proposals
    csvContent += `IV. ĐỀ XUẤT Ý KIẾN VỚI LÃNH ĐẠO PHÒNG\n`;
    csvContent += `"${customProposal.replace(/"/g, '""')}"\n\n`;

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Cao_QHKH_VietinBank_NinhBinh_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Print / Save to PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      
      {/* Container */}
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full">
        
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white px-4 py-3.5 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer mr-1"
              title="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Trở lại</span>
            </button>
            <div className="p-1.5 rounded-xl bg-white/20">
              <FileText className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
                XUẤT BÁO CÁO DASHBOARD NỘP LÃNH ĐẠO
              </h3>
              <p className="text-[11px] text-blue-200">
                Mẫu báo cáo chuẩn VietinBank Ninh Bình • Hỗ trợ In/Lưu PDF và Tải file Excel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
              title="In hoặc Lưu thành file PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">In / Lưu PDF</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              title="Tải bảng tính Excel CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action bar for small screens (Hidden in Print) */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-2 sm:hidden print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs"
          >
            <Printer className="w-4 h-4" />
            <span>In / Lưu PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
        </div>

        {/* Report Content Body (Styled for both Screen Reading & Print A4) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-white print:p-0 print:overflow-visible print:space-y-4 text-slate-800">
          
          {/* Header standard */}
          <div className="flex items-start justify-between border-b-2 border-blue-900 pb-4 gap-4 flex-col sm:flex-row print:flex-row print:border-b-2">
            <div className="flex items-center gap-3">
              <div className="h-14 w-auto p-1 bg-white flex items-center justify-center shrink-0">
                <img 
                  src="https://raw.githubusercontent.com/giadinhbanker/anh-super-app-bac-phu-tho/main/Logo%20VietinBank.png" 
                  alt="VietinBank" 
                  className="h-12 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  NGÂN HÀNG TMCP CÔNG THƯƠNG VIỆT NAM
                </p>
                <h4 className="text-sm font-black text-[#00519E] uppercase tracking-tight">
                  CHI NHÁNH NINH BÌNH
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {currentUser?.phongBan || 'Phòng Khách hàng'}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right print:text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </p>
              <p className="text-[11px] font-semibold text-slate-700 italic border-b border-slate-300 inline-block pb-0.5 mb-1">
                Độc lập - Tự do - Hạnh phúc
              </p>
              <p className="text-[11px] text-slate-500 italic mt-0.5">
                Ninh Bình, {reportDate}
              </p>
            </div>
          </div>

          {/* Title Document */}
          <div className="text-center py-2">
            <h2 className="text-lg sm:text-2xl font-black text-[#00519E] uppercase tracking-tight">
              BÁO CÁO KẾT QUẢ QUẢN LÝ VÀ CHĂM SÓC KHÁCH HÀNG
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1 uppercase">
              CHƯƠNG TRÌNH: SỔ TAY CHĂM SÓC KHÁCH HÀNG CHỦ ĐỘNG
            </p>
            <p className="text-xs text-slate-500 italic mt-0.5">
              (Kính gửi: Lãnh đạo Phòng {currentUser?.phongBan || 'Khách hàng'} - Ban Giám đốc Chi nhánh)
            </p>
          </div>

          {/* Reporter Info Box */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm grid grid-cols-1 sm:grid-cols-3 gap-2.5 print:bg-transparent print:border print:border-slate-300">
            <div>
              <span className="text-slate-500">Cán bộ báo cáo:</span>{' '}
              <strong className="text-slate-900 font-bold">{currentUser?.hoTen || 'Cán bộ QHKH'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Mã cán bộ:</span>{' '}
              <strong className="text-blue-700 font-mono font-bold">{currentUser?.maNv || currentUser?.user || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Chức vụ:</span>{' '}
              <strong className="text-slate-900 font-bold">{currentUser?.viTri || 'Cán bộ QHKH'}</strong>
            </div>
          </div>

          {/* Section I: Key Performance Indicators */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <span>I. TỔNG HỢP CHỈ SỐ QUẢN LÝ VÀ CHĂM SÓC KHÁCH HÀNG</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 print:grid-cols-4">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 print:bg-white text-center">
                <p className="text-[11px] text-slate-500 uppercase font-bold">Tổng khách hàng</p>
                <p className="text-xl font-black text-blue-800 mt-1">{totalCust}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">DN: {enterpriseCount} | CN: {individualCount}</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 print:bg-white text-center">
                <p className="text-[11px] text-slate-500 uppercase font-bold">Đang chăm sóc</p>
                <p className="text-xl font-black text-rose-600 mt-1">{activeCareCount}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Tỷ lệ: {totalCust > 0 ? Math.round((activeCareCount / totalCust) * 100) : 0}%</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 print:bg-white text-center">
                <p className="text-[11px] text-slate-500 uppercase font-bold">Cuộc gặp đã thực hiện</p>
                <p className="text-xl font-black text-indigo-700 mt-1">{totalMeetings}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Định vị GPS: 100%</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 print:bg-white text-center">
                <p className="text-[11px] text-slate-500 uppercase font-bold">Việc cần làm</p>
                <p className="text-xl font-black text-emerald-700 mt-1">{completedTasks}/{relevantTasks.length}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Đang làm: {pendingTasks} {overdueTasks > 0 ? `| Quá hạn: ${overdueTasks}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Section II: Customer Classification */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <span>II. CƠ CẤU KHÁCH HÀNG & PHÂN LOẠI TIỀM NĂNG</span>
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-2 border-r border-slate-200">Nhóm phân loại</th>
                    <th className="p-2 text-center border-r border-slate-200">Số lượng</th>
                    <th className="p-2 text-center border-r border-slate-200">Tỷ trọng</th>
                    <th className="p-2">Đặc điểm & Nhu cầu trọng tâm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 font-bold text-amber-900 bg-amber-50/30 border-r border-slate-200">
                      Khách hàng VIP / Siêu VIP
                    </td>
                    <td className="p-2 text-center font-bold border-r border-slate-200">{vipCount}</td>
                    <td className="p-2 text-center border-r border-slate-200">
                      {totalCust > 0 ? Math.round((vipCount / totalCust) * 100) : 0}%
                    </td>
                    <td className="p-2 text-slate-600">
                      Gửi tiết kiệm số dư lớn, Hạn mức tín dụng SXKD, Thẻ tín dụng cao cấp, Private Banking
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-blue-900 bg-blue-50/30 border-r border-slate-200">
                      Khách hàng quan hệ tín dụng
                    </td>
                    <td className="p-2 text-center font-bold border-r border-slate-200">{creditCount}</td>
                    <td className="p-2 text-center border-r border-slate-200">
                      {totalCust > 0 ? Math.round((creditCount / totalCust) * 100) : 0}%
                    </td>
                    <td className="p-2 text-slate-600">
                      Vay trung dài hạn mở rộng nhà xưởng, Vay vốn lưu động, Bảo lãnh L/C, Tài trợ thương mại
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-emerald-900 bg-emerald-50/30 border-r border-slate-200">
                      Khách hàng tiềm năng & tiếp thị mới
                    </td>
                    <td className="p-2 text-center font-bold border-r border-slate-200">
                      {Math.max(0, totalCust - vipCount - creditCount)}
                    </td>
                    <td className="p-2 text-center border-r border-slate-200">
                      {totalCust > 0 ? Math.round((Math.max(0, totalCust - vipCount - creditCount) / totalCust) * 100) : 0}%
                    </td>
                    <td className="p-2 text-slate-600">
                      Mở tài khoản số đẹp, trả lương qua VietinBank (Payroll), POS/VietQR, bảo hiểm VietinBank Aviva
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section III: Recent Meetings Sample */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <span>III. CHI TIẾT CÁC CUỘC GẶP & KẾT QUẢ TIẾP XÚC GẦN ĐÂY</span>
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-2 border-r border-slate-200 w-10 text-center">STT</th>
                    <th className="p-2 border-r border-slate-200 w-24">Thời gian</th>
                    <th className="p-2 border-r border-slate-200 w-36">Khách hàng</th>
                    <th className="p-2 border-r border-slate-200">Nội dung trao đổi & Kết quả</th>
                    <th className="p-2 w-28 text-center">Tiềm năng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentMeetings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                        Chưa có lịch sử cuộc gặp được ghi nhận.
                      </td>
                    </tr>
                  ) : (
                    recentMeetings.map((m, idx) => {
                      const cust = relevantCustomers.find(c => c.idKh === m.idKh);
                      return (
                        <tr key={m.idLichSu || idx} className="hover:bg-slate-50/50">
                          <td className="p-2 text-center font-mono border-r border-slate-200">{idx + 1}</td>
                          <td className="p-2 font-mono text-[11px] text-slate-600 border-r border-slate-200">
                            {m.thoiGianGap ? m.thoiGianGap.split(' ')[0] : 'N/A'}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                            <div>{cust?.hoTen || m.idKh}</div>
                            {cust?.tenCongTy && (
                              <div className="text-[10px] text-slate-500 font-normal truncate max-w-[140px]">
                                {cust.tenCongTy}
                              </div>
                            )}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-slate-700">
                            <div><strong>Nội dung:</strong> {m.noiDungTraoDoi || 'Trao đổi định kỳ'}</div>
                            {m.ketQuaCuocGap && (
                              <div className="text-emerald-700 mt-0.5"><strong>Kết quả:</strong> {m.ketQuaCuocGap}</div>
                            )}
                          </td>
                          <td className="p-2 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                              m.danhGiaTiemNang === 'Rất cao' ? 'bg-rose-100 text-rose-800' :
                              m.danhGiaTiemNang === 'Cao' ? 'bg-amber-100 text-amber-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {m.danhGiaTiemNang || 'Trung bình'}
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

          {/* Section IV: Proposals to Leadership */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <h3 className="text-sm font-black text-blue-900 uppercase tracking-wide">
                IV. KIẾN NGHỊ & ĐỀ XUẤT Ý KIẾN VỚI LÃNH ĐẠO PHÒNG
              </h3>
              <button
                onClick={() => setIsEditingProposal(!isEditingProposal)}
                className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 print:hidden cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingProposal ? 'Xong' : 'Chỉnh sửa'}</span>
              </button>
            </div>

            {isEditingProposal ? (
              <textarea
                value={customProposal}
                onChange={(e) => setCustomProposal(e.target.value)}
                rows={3}
                className="w-full p-3 text-xs sm:text-sm rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-600 outline-hidden print:hidden"
                placeholder="Nhập kiến nghị đề xuất gửi lãnh đạo..."
              />
            ) : null}

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 italic leading-relaxed print:bg-white print:border-slate-300">
              "{customProposal}"
            </div>
          </div>

          {/* Signature Block */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs sm:text-sm print:pt-8">
            <div className="space-y-1">
              <p className="font-bold text-slate-800 uppercase tracking-wider">
                LÃNH ĐẠO PHÒNG DUYỆT
              </p>
              <p className="text-[11px] text-slate-500 italic">(Ký, ghi rõ họ tên và ý kiến)</p>
              <div className="h-20 sm:h-24"></div>
              <p className="font-semibold text-slate-700 border-t border-dashed border-slate-300 pt-1 inline-block min-w-[160px]">
                ............................................................
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-slate-800 uppercase tracking-wider">
                CÁN BỘ LẬP BÁO CÁO
              </p>
              <p className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
              <div className="h-20 sm:h-24"></div>
              <p className="font-bold text-slate-900 border-t border-slate-200 pt-1 inline-block min-w-[160px]">
                {currentUser?.hoTen || 'Cán bộ QHKH'}
              </p>
            </div>
          </div>

        </div>

        {/* Footer actions for screen viewing (Hidden in print) */}
        <div className="bg-slate-100 border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <p className="text-xs text-slate-500">
            💡 <em>Mẹo:</em> Bấm <strong>In / Lưu PDF</strong> để tạo bản in A4 hoặc lưu thành tệp PDF gửi qua Email/Zalo cho Lãnh đạo.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In / Lưu PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Tải Excel (CSV)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
