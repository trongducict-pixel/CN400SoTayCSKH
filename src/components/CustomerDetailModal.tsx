import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  MapPin, 
  Calendar, 
  BellRing, 
  Handshake, 
  CheckSquare, 
  Plus, 
  Clock, 
  Edit3, 
  ExternalLink, 
  Award, 
  Building, 
  Building2,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  User,
  ArrowRight,
  ArrowLeft,
  Check,
  Trash2
} from 'lucide-react';
import { Customer, MeetingHistory, Task, CareMode, TaskStatus, AppUser, CareHistory } from '../types';
import { normalizePhone } from '../services/phoneUtils';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  meetings: MeetingHistory[];
  tasks: Task[];
  careHistories?: CareHistory[];
  onToggleCareMode: (customerId: string, newMode: CareMode) => void;
  onOpenNewMeeting: (customerId: string) => void;
  onOpenQuickActivity?: (customerId: string) => void;
  onEditCustomer: (customer: Customer) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onAddNewTask: (customerId: string) => void;
  onOpenMap: (customer: Customer) => void;
  currentUser?: AppUser | null;
  users?: AppUser[];
  onReassignCreator?: (customerId: string, newCreator: { userKhoiTao: string; nguoiKhoiTao: string; phongBanKhoiTao: string }) => Promise<void>;
  onDeleteCustomer?: (customerId: string) => Promise<void>;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  meetings,
  tasks,
  careHistories = [],
  onToggleCareMode,
  onOpenNewMeeting,
  onOpenQuickActivity,
  onEditCustomer,
  onUpdateTaskStatus,
  onAddNewTask,
  onOpenMap,
  currentUser,
  users = [],
  onReassignCreator,
  onDeleteCustomer
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<'info' | 'demand' | 'care' | 'timeline' | 'tasks'>('info');

  // Admin creator override states
  const [isEditingCreator, setIsEditingCreator] = useState(false);
  const [selectedCreatorUser, setSelectedCreatorUser] = useState(customer?.userKhoiTao || '');
  const [isSavingCreator, setIsSavingCreator] = useState(false);

  // Sync selectedCreatorUser when customer changes
  React.useEffect(() => {
    if (customer) {
      setSelectedCreatorUser(customer.userKhoiTao || '');
      setIsEditingCreator(false);
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  // Customer meetings sorted by newest first
  const customerMeetings = meetings
    .filter(m => m.idKh === customer.idKh)
    .sort((a, b) => new Date(b.thoiGianGap).getTime() - new Date(a.thoiGianGap).getTime());

  // Customer care histories sorted by newest first
  const customerCareHistories = careHistories
    .filter(c => c.idKh === customer.idKh)
    .sort((a, b) => new Date(b.thoiGian).getTime() - new Date(a.thoiGian).getTime());

  // Customer tasks
  const customerTasks = tasks
    .filter(t => t.idKh === customer.idKh)
    .sort((a, b) => (a.trangThai === 'Hoàn thành' ? 1 : -1));

  // Combined 360° Timeline (Cuộc gặp + Chăm sóc)
  const combinedTimeline = [
    ...customerMeetings.map(m => ({
      id: m.idLichSu,
      type: 'MEETING' as const,
      thoiGian: m.thoiGianGap,
      title: `Cuộc gặp (${m.hinhThucGap})`,
      content: m.noiDungTraoDoi,
      demand: m.nhuCauKhachHang,
      nextAction: m.congViecTiepTheo,
      officer: m.canBoThucHien,
      googleMapUrl: m.googleMapUrl,
      gpsAccuracy: m.gpsAccuracy
    })),
    ...customerCareHistories.map(c => ({
      id: c.idChamSoc,
      type: 'CARE' as const,
      thoiGian: c.thoiGian,
      title: `Chăm sóc: ${c.hinhThuc} (${c.suKien || 'Thường xuyên'})`,
      content: c.noiDung,
      result: c.ketQua,
      note: c.ghiChu,
      officer: c.canBo
    }))
  ].sort((a, b) => new Date(b.thoiGian).getTime() - new Date(a.thoiGian).getTime());

  const handleSaveReassignCreator = async () => {
    if (!onReassignCreator || !selectedCreatorUser) return;
    const targetUser = users.find(u => u.user.toLowerCase() === selectedCreatorUser.toLowerCase());
    if (!targetUser) return;

    setIsSavingCreator(true);
    try {
      await onReassignCreator(customer.idKh, {
        userKhoiTao: targetUser.user,
        nguoiKhoiTao: targetUser.hoTen,
        phongBanKhoiTao: targetUser.phongBan || ''
      });
      setIsEditingCreator(false);
    } catch (err: any) {
      alert('Lỗi khi cập nhật người khởi tạo: ' + err.message);
    } finally {
      setIsSavingCreator(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header with Tier color */}
        <div className={`p-4 sm:p-5 text-white shrink-0 relative overflow-hidden ${
          customer.phanLoai.includes('Siêu VIP')
            ? 'bg-gradient-to-r from-purple-900 to-indigo-900'
            : customer.phanLoai.includes('VIP')
            ? 'bg-gradient-to-r from-amber-800 to-orange-900'
            : customer.phanLoai.includes('quan hệ tín dụng')
            ? 'bg-gradient-to-r from-emerald-800 to-teal-900'
            : 'bg-gradient-to-r from-blue-900 to-indigo-900'
        }`}>
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <button
                  id="customer-detail-btn-back"
                  onClick={onClose}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="Quay lại"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Trở lại</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight truncate">
                  {customer.hoTen}
                </h2>
                
                {/* Customer Type Badge */}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold backdrop-blur-xs flex items-center gap-1 ${
                  customer.loaiKhachHang === 'Tổ chức'
                    ? 'bg-amber-400 text-amber-950 shadow-xs'
                    : 'bg-white/20 text-white'
                }`}>
                  {customer.loaiKhachHang === 'Tổ chức' ? (
                    <>
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Khách hàng Tổ chức</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5" />
                      <span>Cá nhân</span>
                    </>
                  )}
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-xs text-white">
                  {customer.phanLoai}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white/90 border border-white/20">
                  ID: {customer.idKh}
                </span>
              </div>

              {/* Thông tin Tổ chức (nếu là Tổ chức) */}
              {customer.loaiKhachHang === 'Tổ chức' && (customer.tenCongTy || customer.chucVu) && (
                <div className="mt-1 flex items-center gap-2 flex-wrap bg-white/15 px-2.5 py-1 rounded-lg text-xs font-medium text-white">
                  {customer.tenCongTy && (
                    <span className="font-bold flex items-center gap-1">
                      🏢 {customer.tenCongTy}
                    </span>
                  )}
                  {customer.chucVu && (
                    <span className="px-1.5 py-0.2 rounded bg-white/25 text-[11px] font-semibold">
                      Chức vụ: {customer.chucVu}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 text-xs sm:text-sm text-white/90 mt-1 flex-wrap">
                <a href={`tel:${normalizePhone(customer.sdt) || customer.sdt}`} className="hover:underline flex items-center gap-1 font-semibold font-mono">
                  📞 {normalizePhone(customer.sdt) || customer.sdt}
                </a>
                {customer.nganhNghe && (
                  <span className="text-white/80">🏢 {customer.nganhNghe}</span>
                )}
                <span className="text-white/80 flex items-center gap-1">
                  👤 Quản lý: <strong className="text-white">{customer.canBoPhuTrach}</strong>
                  {customer.userCanBo && <span className="text-[11px] font-mono text-white/90">(@{customer.userCanBo})</span>}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                id="customer-detail-btn-edit"
                onClick={() => onEditCustomer(customer)}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                title="Chỉnh sửa thông tin"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                id="customer-detail-btn-close"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Action Strip */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15 flex-wrap">
            {onOpenQuickActivity && (
              <button
                id="customer-detail-btn-quick-activity"
                onClick={() => onOpenQuickActivity(customer.idKh)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>⚡ Ghi nhận nhanh (3 chạm)</span>
              </button>
            )}

            <button
              id="customer-detail-btn-record-meeting"
              onClick={() => onOpenNewMeeting(customer.idKh)}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Handshake className="w-4 h-4" />
              <span>Ghi nhận cuộc gặp</span>
            </button>

            <button
              id="customer-detail-btn-toggle-care"
              onClick={() => onToggleCareMode(customer.idKh, customer.cheDoChamSoc === 'Bật' ? 'Tắt' : 'Bật')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                customer.cheDoChamSoc === 'Bật'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Chăm sóc: {customer.cheDoChamSoc}</span>
            </button>

            <button
              id="customer-detail-btn-map"
              onClick={() => onOpenMap(customer)}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Định vị vị trí</span>
            </button>

            {onDeleteCustomer && (isAdmin || currentUser?.user === customer.userKhoiTao) && (
              <button
                id="customer-detail-btn-delete"
                onClick={async () => {
                  const confirmMsg = `Bạn có chắc chắn muốn xóa khách hàng "${customer.hoTen}" (${customer.sdt}) khỏi hệ thống và đồng bộ xóa trên Google Sheet? Hành động này không thể hoàn tác.`;
                  if (window.confirm(confirmMsg)) {
                    await onDeleteCustomer(customer.idKh);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer sm:ml-auto"
                title="Xóa khách hàng này"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa khách hàng</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation (5 nhóm chuẩn Mục 12) */}
        <div className="flex items-center border-b border-slate-200 px-2 sm:px-4 bg-slate-50 text-xs font-bold text-slate-600 overflow-x-auto no-scrollbar">
          <button
            id="customer-detail-tab-info"
            onClick={() => setActiveTab('info')}
            className={`py-3 px-2.5 sm:px-3 border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'info'
                ? 'border-blue-700 text-blue-800 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span>👤 Thông tin</span>
          </button>
          <button
            id="customer-detail-tab-demand"
            onClick={() => setActiveTab('demand')}
            className={`py-3 px-2.5 sm:px-3 border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'demand'
                ? 'border-blue-700 text-blue-800 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span>💰 Nhu cầu</span>
          </button>
          <button
            id="customer-detail-tab-care"
            onClick={() => setActiveTab('care')}
            className={`py-3 px-2.5 sm:px-3 border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'care'
                ? 'border-blue-700 text-blue-800 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span>❤️ Chăm sóc</span>
          </button>
          <button
            id="customer-detail-tab-timeline"
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-2.5 sm:px-3 border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'timeline'
                ? 'border-blue-700 text-blue-800 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span>⏱️ Dòng thời gian 360° ({combinedTimeline.length})</span>
          </button>
          <button
            id="customer-detail-tab-tasks"
            onClick={() => setActiveTab('tasks')}
            className={`py-3 px-2.5 sm:px-3 border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'tasks'
                ? 'border-blue-700 text-blue-800 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span>📌 Việc làm ({customerTasks.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: THÔNG TIN KHÁCH HÀNG */}
          {activeTab === 'info' && (
            <div className="space-y-3.5 text-xs sm:text-sm">
              {/* Phân loại Khách hàng: Cá nhân vs Tổ chức */}
              <div className={`p-3.5 rounded-xl border space-y-2 ${
                customer.loaiKhachHang === 'Tổ chức'
                  ? 'bg-indigo-50/70 border-indigo-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-xs uppercase flex items-center gap-1.5 text-slate-800">
                    {customer.loaiKhachHang === 'Tổ chức' ? (
                      <>
                        <Building2 className="w-4 h-4 text-indigo-700" />
                        <span className="text-indigo-950">THÔNG TIN DOANH NGHIỆP / TỔ CHỨC</span>
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 text-blue-700" />
                        <span>LOẠI HÌNH KHÁCH HÀNG</span>
                      </>
                    )}
                  </h5>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    customer.loaiKhachHang === 'Tổ chức'
                      ? 'bg-indigo-200 text-indigo-900'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {customer.loaiKhachHang || 'Cá nhân'}
                  </span>
                </div>

                {customer.loaiKhachHang === 'Tổ chức' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[11px]">TÊN CÔNG TY / DOANH NGHIỆP</span>
                      <span className="font-bold text-indigo-950 text-sm">{customer.tenCongTy || 'Chưa cập nhật'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">CHỨC VỤ NGƯỜI ĐẠI DIỆN / ĐẦU MỐI</span>
                      <span className="font-bold text-slate-900">{customer.chucVu || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[11px]">NGƯỜI LIÊN HỆ / ĐẠI DIỆN PHÁP LUẬT</span>
                      <span className="font-semibold text-slate-800">{customer.hoTen}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Thông tin cá nhân & Liên hệ */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h5 className="font-extrabold text-slate-700 text-xs uppercase mb-2">
                  👤 THÔNG TIN CHI TIẾT & LIÊN HỆ
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      {customer.loaiKhachHang === 'Tổ chức' ? 'NGƯỜI LIÊN HỆ / ĐẠI DIỆN' : 'HỌ VÀ TÊN'}
                    </span>
                    <span className="font-bold text-slate-900">{customer.hoTen}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">SỐ ĐIỆN THOẠI (ID KHÁCH HÀNG)</span>
                    <span className="font-bold text-blue-900 font-mono">
                      {normalizePhone(customer.sdt) || customer.sdt} <span className="font-mono text-[11px] text-slate-500 font-normal">[{customer.idKh && !customer.idKh.startsWith('KH_') ? (normalizePhone(customer.idKh) || customer.idKh) : customer.idKh}]</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">NGÀY SINH / THÀNH LẬP</span>
                    <span className="font-semibold">{customer.ngaySinh || 'Chưa cập nhật'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">NGÀNH NGHỀ KINH DOANH</span>
                    <span className="font-semibold">{customer.nganhNghe || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">ĐỊA CHỈ TRỤ SỞ / NHÀ Ở</span>
                    <span className="font-semibold">{customer.diaChi || 'Chưa cập nhật'}</span>
                  </div>
                  {customer.googleMapUrl && (
                    <div className="sm:col-span-2 pt-1">
                      <a
                        href={customer.googleMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-700 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mở vị trí khách hàng trên Google Maps ↗</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Cán bộ phụ trách & Lịch sử khởi tạo */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h5 className="font-extrabold text-slate-700 text-xs uppercase mb-2">
                  👔 CÁN BỘ PHỤ TRÁCH & LỊCH SỬ KHỞI TẠO
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[11px]">CÁN BỘ QUẢN LÝ HIỆN TẠI</span>
                    <span className="font-bold text-blue-900">
                      {customer.canBoPhuTrach || 'QHKH'}
                      {customer.userCanBo && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[10px] font-bold">
                          @{customer.userCanBo}
                        </span>
                      )}
                    </span>
                    <span className="text-slate-500 block text-xs mt-0.5">{customer.emailCanBo}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">NGƯỜI KHỞI TẠO HỒ SƠ</span>
                    <span className="font-bold text-slate-800">
                      {customer.nguoiKhoiTao || customer.canBoPhuTrach || 'Hệ thống'}
                      {customer.userKhoiTao && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-mono text-[10px] font-bold">
                          @{customer.userKhoiTao}
                        </span>
                      )}
                    </span>
                    <span className="text-slate-500 block text-xs mt-0.5">
                      {customer.phongBanKhoiTao || 'Khối KHDN / Bán lẻ'} • Tạo ngày: {customer.ngayTao?.slice(0, 10) || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Admin override creator */}
                {isAdmin && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-purple-900 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                        Admin: Điều chỉnh người khởi tạo
                      </span>
                      {!isEditingCreator ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCreatorUser(customer.userKhoiTao || customer.userCanBo || '');
                            setIsEditingCreator(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Thay đổi</span>
                        </button>
                      ) : null}
                    </div>

                    {isEditingCreator && (
                      <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-2">
                        <select
                          value={selectedCreatorUser}
                          onChange={(e) => setSelectedCreatorUser(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                        >
                          <option value="">-- Chọn cán bộ từ danh sách --</option>
                          {users.map((u, uIdx) => (
                            <option key={`u-opt-${u.user}-${uIdx}`} value={u.user}>
                              {u.hoTen} (@{u.user}) - {u.viTri} [{u.phongBan}]
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setIsEditingCreator(false)}
                            className="px-3 py-1.5 rounded-lg border text-slate-700 text-xs font-bold"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveReassignCreator}
                            disabled={isSavingCreator || !selectedCreatorUser}
                            className="px-3.5 py-1.5 rounded-lg bg-purple-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                          >
                            {isSavingCreator ? 'Đang lưu...' : 'Lưu thay đổi'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NHU CẦU KHÁCH HÀNG (Mục 12) */}
          {activeTab === 'demand' && (
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2">
                <h5 className="font-extrabold text-blue-950 text-xs uppercase flex items-center gap-1.5">
                  <span>💰 NHU CẦU TÀI CHÍNH HIỆN TẠI</span>
                </h5>
                <p className="text-slate-800 text-sm font-semibold leading-relaxed">
                  {customer.nhuCau || 'Chưa ghi nhận nhu cầu cụ thể.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
                <h5 className="font-extrabold text-amber-950 text-xs uppercase flex items-center gap-1.5">
                  <span>📌 GHI CHÚ ĐẶC BIỆT & THÓI QUEN</span>
                </h5>
                <p className="text-slate-800 leading-relaxed">
                  {customer.ghiChu || 'Chưa có ghi chú đặc biệt.'}
                </p>
              </div>

              {/* Nhu cầu qua các cuộc gặp gần nhất */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h5 className="font-extrabold text-slate-700 text-xs uppercase">
                  Lịch sử nhu cầu qua các cuộc gặp
                </h5>
                {customerMeetings.filter(m => m.nhuCauKhachHang).length === 0 ? (
                  <p className="text-xs text-slate-500">Chưa có nhu cầu bổ sung từ các cuộc gặp gần đây.</p>
                ) : (
                  <div className="space-y-1.5">
                    {customerMeetings.filter(m => m.nhuCauKhachHang).map((m, mIdx) => (
                      <div key={`m-demand-${m.idLichSu || mIdx}-${mIdx}`} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">{m.nhuCauKhachHang}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{m.thoiGianGap?.slice(0, 10)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CHĂM SÓC KHÁCH HÀNG (Mục 12) */}
          {activeTab === 'care' && (
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-black text-rose-950 text-sm flex items-center gap-1.5">
                      <span>❤️ Chế độ chăm sóc khách hàng</span>
                    </h5>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Tự động nhắc sinh nhật, lễ Tết và định kỳ
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleCareMode(customer.idKh, customer.cheDoChamSoc === 'Bật' ? 'Tắt' : 'Bật')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
                      customer.cheDoChamSoc === 'Bật' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {customer.cheDoChamSoc === 'Bật' ? '🟢 BẬT' : '⚪ TẮT'}
                  </button>
                </div>

                {customer.cheDoChamSoc === 'Bật' && (
                  <div className="pt-2 border-t border-rose-200 text-xs space-y-2">
                    <span className="font-bold text-slate-800 block">Sự kiện áp dụng:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(customer.suKienChamSoc && customer.suKienChamSoc.length > 0
                        ? customer.suKienChamSoc
                        : ['Sinh nhật', '8/3', '20/10', 'Tết', 'Quốc khánh']
                      ).map((ev, evIdx) => (
                        <span key={`ev-${ev}-${evIdx}`} className="px-2.5 py-1 rounded-full bg-white border border-rose-300 text-rose-800 font-semibold text-xs shadow-2xs">
                          ✓ {ev}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500 pt-1">
                      Email nhắc việc sẽ được tự động gửi đến <strong>{customer.emailCanBo}</strong> trước 7, 3 và 1 ngày.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* TAB 4: DÒNG THỜI GIAN 360° (CUỘC GẶP & CHĂM SÓC) */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Dòng thời gian tương tác khách hàng 360°
                </h4>
                <div className="flex items-center gap-2">
                  {onOpenQuickActivity && (
                    <button
                      id="customer-timeline-btn-quick"
                      onClick={() => onOpenQuickActivity(customer.idKh)}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200"
                    >
                      ⚡ Ghi nhanh 3 chạm
                    </button>
                  )}
                  <button
                    id="customer-timeline-btn-add"
                    onClick={() => onOpenNewMeeting(customer.idKh)}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm cuộc gặp
                  </button>
                </div>
              </div>

              {combinedTimeline.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Handshake className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                  Chưa có hoạt động tiếp xúc hoặc chăm sóc nào được ghi nhận cho khách hàng này.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {combinedTimeline.map((item, tlIdx) => {
                    const isMeeting = item.type === 'MEETING';
                    return (
                      <div key={`tl-${item.id || item.type}-${tlIdx}`} className="relative group">
                        <div className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs group-hover:scale-125 transition-transform ${
                          isMeeting ? 'bg-blue-600' : 'bg-rose-500'
                        }`} />
                        
                        <div className={`bg-white border rounded-xl p-3 shadow-2xs transition-all ${
                          isMeeting ? 'border-slate-200 hover:border-blue-300' : 'border-rose-100 hover:border-rose-300 bg-rose-50/20'
                        }`}>
                          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Calendar className={`w-3.5 h-3.5 ${isMeeting ? 'text-blue-600' : 'text-rose-500'}`} />
                              {item.thoiGian}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isMeeting ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {item.title}
                            </span>
                          </div>

                          {item.content && (
                            <div className="mt-2 text-xs text-slate-700 bg-slate-50/80 p-2 rounded-lg">
                              <strong>Nội dung:</strong> {item.content}
                            </div>
                          )}

                          {isMeeting && (item as any).demand && (
                            <div className="mt-2 text-[11px] text-blue-900 bg-blue-50/70 p-2 rounded-lg">
                              <strong>Nhu cầu ghi nhận:</strong> {(item as any).demand}
                            </div>
                          )}

                          {!isMeeting && (item as any).result && (
                            <div className="mt-2 text-[11px] text-emerald-900 bg-emerald-50/70 p-2 rounded-lg">
                              <strong>Kết quả:</strong> {(item as any).result}
                            </div>
                          )}

                          {isMeeting && (item as any).nextAction && (
                            <div className="mt-2 text-[11px] text-amber-900 bg-amber-50/70 p-2 rounded-lg flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              <span><strong>Việc tiếp theo:</strong> {(item as any).nextAction}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                            <span>Cán bộ: {item.officer || 'QHKH'}</span>
                            {isMeeting && (item as any).googleMapUrl && (
                              <a
                                href={(item as any).googleMapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 hover:underline flex items-center gap-0.5 font-medium"
                              >
                                <MapPin className="w-3 h-3" /> Tọa độ GPS
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CÔNG VIỆC CẦN LÀM */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Nhiệm vụ & Hạn hoàn thành
                </h4>
                <button
                  id="customer-tasks-btn-add"
                  onClick={() => onAddNewTask(customer.idKh)}
                  className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm công việc
                </button>
              </div>

              {customerTasks.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckSquare className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                  Chưa có công việc nào cần làm cho khách hàng này.
                </div>
              ) : (
                <div className="space-y-2">
                  {customerTasks.map((t, tIdx) => (
                    <div
                      key={`cust-task-${t.idCongViec || tIdx}-${tIdx}`}
                      className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        t.trangThai === 'Hoàn thành'
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : t.trangThai === 'Quá hạn'
                          ? 'bg-rose-50/70 border-rose-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          id={`task-toggle-${t.idCongViec}`}
                          onClick={() => onUpdateTaskStatus(t.idCongViec, t.trangThai === 'Hoàn thành' ? 'Chưa thực hiện' : 'Hoàn thành')}
                          className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                            t.trangThai === 'Hoàn thành'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 hover:border-blue-600 bg-white'
                          }`}
                        >
                          {t.trangThai === 'Hoàn thành' && <Check className="w-3 h-3" />}
                        </button>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold text-slate-900 ${t.trangThai === 'Hoàn thành' ? 'line-through text-slate-500' : ''}`}>
                            {t.noiDung}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                            <span>Hạn: {t.ngayHan || 'Không có'}</span>
                            <span>• Cán bộ: {t.canBo}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        t.trangThai === 'Hoàn thành'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.trangThai === 'Quá hạn'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.trangThai}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
