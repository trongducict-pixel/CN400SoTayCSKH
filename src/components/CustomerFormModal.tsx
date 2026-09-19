import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  UserPlus, 
  MapPin, 
  Navigation, 
  Calendar, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  UserCheck, 
  ShieldCheck, 
  Eye, 
  ArrowRight,
  ArrowLeft,
  Info,
  RefreshCw,
  Building,
  Building2,
  User,
  Briefcase,
  Heart,
  Sparkles
} from 'lucide-react';
import { Customer, CustomerTier, CustomerType, CareMode, AppUser } from '../types';
import { normalizePhone, formatPhoneDisplay } from '../services/phoneUtils';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomer: (customerData: Partial<Customer>, allowUpdateExisting?: boolean) => Promise<void>;
  initialData?: Customer | null;
  currentUserName: string;
  currentUserEmail: string;
  currentUserUsername?: string;
  users?: AppUser[];
  allCustomers?: Customer[];
  currentUser?: AppUser | null;
  onViewExistingCustomer?: (customer: Customer) => void;
}

const COMMON_DEMANDS = [
  'Vay vốn',
  'Tiền gửi',
  'Thẻ',
  'Bảo hiểm',
  'Thanh toán',
  'iPay',
  'Ngoại tệ',
  'Bảo lãnh',
  'Tài trợ thương mại',
  'Khác'
];

const CARE_EVENTS_LIST = [
  'Sinh nhật',
  '8/3',
  '20/10',
  '27/7',
  'Quốc khánh',
  'Tết',
  'Sự kiện khác'
];

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSaveCustomer,
  initialData,
  currentUserName,
  currentUserEmail,
  currentUserUsername,
  users = [],
  allCustomers = [],
  currentUser,
  onViewExistingCustomer
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';

  // 2-Step Stepper: Step 1 (Thông tin khách hàng), Step 2 (Thông tin quan hệ)
  const [formStep, setFormStep] = useState<1 | 2>(1);

  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(initialData?.idKh || null);
  const [isUpdatingExistingFromDuplicate, setIsUpdatingExistingFromDuplicate] = useState(false);

  // Step 1 Fields:
  const [loaiKhachHang, setLoaiKhachHang] = useState<CustomerType>(initialData?.loaiKhachHang || 'Cá nhân');
  const [tenCongTy, setTenCongTy] = useState(initialData?.tenCongTy || '');
  const [chucVu, setChucVu] = useState(initialData?.chucVu || '');
  const [hoTen, setHoTen] = useState(initialData?.hoTen || '');
  const [sdt, setSdt] = useState(initialData?.sdt || '');
  const [ngaySinh, setNgaySinh] = useState(initialData?.ngaySinh || '');
  const [diaChi, setDiaChi] = useState(initialData?.diaChi || '');
  const [nganhNghe, setNganhNghe] = useState(initialData?.nganhNghe || '');
  const [latitude, setLatitude] = useState<number | null>(initialData?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(initialData?.longitude || null);
  const [googleMapUrl, setGoogleMapUrl] = useState<string>(initialData?.googleMapUrl || '');

  // Step 2 Fields:
  const [phanLoai, setPhanLoai] = useState<CustomerTier>(initialData?.phanLoai || 'Đang tiếp thị');
  const [selectedDemands, setSelectedDemands] = useState<string[]>([]);
  const [customDemand, setCustomDemand] = useState<string>('');
  const [ghiChu, setGhiChu] = useState(initialData?.ghiChu || '');
  const [cheDoChamSoc, setCheDoChamSoc] = useState<CareMode>(initialData?.cheDoChamSoc || 'Bật');
  const [selectedCareEvents, setSelectedCareEvents] = useState<string[]>([
    'Sinh nhật', '8/3', '20/10', 'Tết', 'Quốc khánh'
  ]);

  // Assignment fields
  const [canBoPhuTrach, setCanBoPhuTrach] = useState(initialData?.canBoPhuTrach || currentUserName);
  const [userCanBo, setUserCanBo] = useState(initialData?.userCanBo || currentUserUsername || '');
  const [emailCanBo, setEmailCanBo] = useState(initialData?.emailCanBo || currentUserEmail);

  // Creator metadata (Admin can change)
  const [userKhoiTao, setUserKhoiTao] = useState(initialData?.userKhoiTao || currentUserUsername || '');
  const [nguoiKhoiTao, setNguoiKhoiTao] = useState(initialData?.nguoiKhoiTao || currentUserName || '');
  const [phongBanKhoiTao, setPhongBanKhoiTao] = useState(initialData?.phongBanKhoiTao || currentUser?.phongBan || '');

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parse demands from initialData
  useEffect(() => {
    if (initialData?.nhuCau) {
      const parts = initialData.nhuCau.split(',').map(s => s.trim()).filter(Boolean);
      const standard = parts.filter(p => COMMON_DEMANDS.includes(p));
      const extra = parts.filter(p => !COMMON_DEMANDS.includes(p)).join(', ');
      setSelectedDemands(standard);
      setCustomDemand(extra);
    }
    if (initialData?.suKienChamSoc && initialData.suKienChamSoc.length > 0) {
      setSelectedCareEvents(initialData.suKienChamSoc);
    }
  }, [initialData]);

  // Reset or initialize state when initialData changes
  useEffect(() => {
    if (initialData) {
      setActiveCustomerId(initialData.idKh);
      setLoaiKhachHang(initialData.loaiKhachHang || 'Cá nhân');
      setTenCongTy(initialData.tenCongTy || '');
      setChucVu(initialData.chucVu || '');
      setHoTen(initialData.hoTen || '');
      setSdt(initialData.sdt ? normalizePhone(initialData.sdt) : '');
      setNgaySinh(initialData.ngaySinh || '');
      setDiaChi(initialData.diaChi || '');
      setLatitude(initialData.latitude || null);
      setLongitude(initialData.longitude || null);
      setGoogleMapUrl(initialData.googleMapUrl || '');
      setNganhNghe(initialData.nganhNghe || '');
      setGhiChu(initialData.ghiChu || '');
      setPhanLoai(initialData.phanLoai || 'Đang tiếp thị');
      setCheDoChamSoc(initialData.cheDoChamSoc || 'Bật');
      setCanBoPhuTrach(initialData.canBoPhuTrach || currentUserName);
      setUserCanBo(initialData.userCanBo || currentUserUsername || '');
      setEmailCanBo(initialData.emailCanBo || currentUserEmail);
      setUserKhoiTao(initialData.userKhoiTao || currentUserUsername || '');
      setNguoiKhoiTao(initialData.nguoiKhoiTao || currentUserName || '');
      setPhongBanKhoiTao(initialData.phongBanKhoiTao || currentUser?.phongBan || '');
      setIsUpdatingExistingFromDuplicate(false);
      setFormStep(1);
    } else {
      setFormStep(1);
    }
  }, [initialData]);

  const normalizedPhone = useMemo(() => normalizePhone(sdt), [sdt]);

  const detectedDuplicate = useMemo(() => {
    if (!normalizedPhone || normalizedPhone.length < 9) return null;
    const match = allCustomers.find(c => {
      if (activeCustomerId && c.idKh === activeCustomerId) return false;
      const cClean = normalizePhone(c.sdt);
      return (cClean && cClean === normalizedPhone) || (c.idKh === normalizedPhone);
    });
    return match || null;
  }, [normalizedPhone, allCustomers, activeCustomerId]);

  const handleSelectOfficer = (selectedUserUsername: string) => {
    setUserCanBo(selectedUserUsername);
    const targetUser = users.find(u => u.user.toLowerCase() === selectedUserUsername.toLowerCase());
    if (targetUser) {
      setCanBoPhuTrach(targetUser.hoTen);
      setEmailCanBo(targetUser.email);
    }
  };

  const handleLoadExistingCustomer = (existing: Customer) => {
    setActiveCustomerId(existing.idKh);
    setIsUpdatingExistingFromDuplicate(true);
    setLoaiKhachHang(existing.loaiKhachHang || 'Cá nhân');
    setTenCongTy(existing.tenCongTy || '');
    setChucVu(existing.chucVu || '');
    setHoTen(existing.hoTen);
    setSdt(existing.sdt);
    setNgaySinh(existing.ngaySinh || '');
    setDiaChi(existing.diaChi || '');
    setLatitude(existing.latitude || null);
    setLongitude(existing.longitude || null);
    setGoogleMapUrl(existing.googleMapUrl || '');
    setNganhNghe(existing.nganhNghe || '');
    setGhiChu(existing.ghiChu || '');
    setPhanLoai(existing.phanLoai || 'Đang tiếp thị');
    setCheDoChamSoc(existing.cheDoChamSoc || 'Bật');
    setCanBoPhuTrach(existing.canBoPhuTrach);
    setUserCanBo(existing.userCanBo || '');
    setEmailCanBo(existing.emailCanBo || '');
    setUserKhoiTao(existing.userKhoiTao || '');
    setNguoiKhoiTao(existing.nguoiKhoiTao || '');
    setPhongBanKhoiTao(existing.phongBanKhoiTao || '');
    setErrorMessage(null);
  };

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setGpsMessage('Trình duyệt không hỗ trợ GPS');
      return;
    }
    setGpsLoading(true);
    setGpsMessage('Đang lấy tọa độ GPS...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        setGoogleMapUrl(mapUrl);
        setGpsLoading(false);
        setGpsMessage(`Đã lấy GPS (${lat}, ${lng})`);
      },
      (err) => {
        setGpsLoading(false);
        setGpsMessage('Không lấy được GPS. Bạn có thể nhập địa chỉ thủ công.');
      },
      { timeout: 8000 }
    );
  };

  const toggleDemand = (demand: string) => {
    setSelectedDemands(prev => 
      prev.includes(demand) ? prev.filter(d => d !== demand) : [...prev, demand]
    );
  };

  const toggleCareEvent = (event: string) => {
    setSelectedCareEvents(prev => 
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  // Validate Step 1 before proceeding to Step 2
  const handleProceedToStep2 = () => {
    if (!hoTen.trim()) {
      setErrorMessage(loaiKhachHang === 'Tổ chức' ? 'Vui lòng nhập Người đại diện / Đầu mối liên hệ.' : 'Vui lòng nhập Họ tên khách hàng.');
      return;
    }
    if (!sdt.trim()) {
      setErrorMessage('Vui lòng nhập Số điện thoại khách hàng.');
      return;
    }
    if (loaiKhachHang === 'Tổ chức') {
      if (!tenCongTy.trim()) {
        setErrorMessage('Đối với khách hàng Tổ chức, vui lòng nhập Tên Công ty / Doanh nghiệp.');
        return;
      }
      if (!chucVu.trim()) {
        setErrorMessage('Đối với khách hàng Tổ chức, vui lòng nhập Chức vụ của người liên hệ.');
        return;
      }
    }
    if (detectedDuplicate && !isUpdatingExistingFromDuplicate && !activeCustomerId) {
      setErrorMessage(`Số điện thoại ${sdt} đã được đăng ký cho "${detectedDuplicate.hoTen}". Vui lòng chọn "Xem & Cập nhật" bên dưới để bổ sung thay vì tạo mới.`);
      return;
    }
    setErrorMessage(null);
    setFormStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const mapUrl = googleMapUrl || (latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : '');
      const cleanPhone = normalizedPhone || sdt;
      
      // Combine demands
      const allDemandsList = [...selectedDemands];
      if (customDemand.trim() && !allDemandsList.includes(customDemand.trim())) {
        allDemandsList.push(customDemand.trim());
      }
      const combinedDemands = allDemandsList.join(', ');

      const payload: Partial<Customer> = {
        ...(activeCustomerId ? { idKh: activeCustomerId } : { idKh: cleanPhone }),
        hoTen: hoTen.trim(),
        loaiKhachHang,
        tenCongTy: loaiKhachHang === 'Tổ chức' ? tenCongTy.trim() : '',
        chucVu: loaiKhachHang === 'Tổ chức' ? chucVu.trim() : '',
        sdt: cleanPhone,
        ngaySinh,
        diaChi: diaChi.trim(),
        latitude,
        longitude,
        googleMapUrl: mapUrl,
        nganhNghe: nganhNghe.trim(),
        nhuCau: combinedDemands,
        ghiChu: ghiChu.trim(),
        phanLoai,
        cheDoChamSoc,
        suKienChamSoc: cheDoChamSoc === 'Bật' ? selectedCareEvents : [],
        canBoPhuTrach,
        userCanBo,
        emailCanBo,
        userKhoiTao: userKhoiTao || currentUserUsername || '',
        nguoiKhoiTao: nguoiKhoiTao || currentUserName || '',
        phongBanKhoiTao: phongBanKhoiTao || currentUser?.phongBan || '',
        nguoiCapNhatCuoi: currentUser?.hoTen || currentUserName,
        userCapNhatCuoi: currentUser?.user || currentUserUsername
      };

      await onSaveCustomer(payload, isUpdatingExistingFromDuplicate);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu khách hàng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white px-3 sm:px-4 py-3 sm:py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              id="customer-modal-btn-back"
              type="button"
              onClick={() => {
                if (formStep === 2) setFormStep(1);
                else onClose();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer mr-1 shrink-0"
              title="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Trở lại</span>
            </button>
            <div className="p-1.5 rounded-lg bg-white/20 shrink-0 hidden sm:flex">
              <UserPlus className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight truncate">
                {activeCustomerId ? 'CHỈNH SỬA KHÁCH HÀNG' : 'THÊM KHÁCH HÀNG MỚI'}
              </h3>
              <p className="text-[11px] text-blue-200 truncate">
                {formStep === 1 ? 'Bước 1: Thông tin & Liên hệ' : 'Bước 2: Phân loại & Nhu cầu'}
              </p>
            </div>
          </div>
          <button
            id="customer-modal-btn-close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Step Stepper Tabs (Chuẩn Mục 8) */}
        <div className="grid grid-cols-2 border-b border-slate-200 text-xs font-black bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => setFormStep(1)}
            className={`py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              formStep === 1 
                ? 'border-blue-700 text-blue-700 bg-white font-extrabold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center">1</span>
            <span>THÔNG TIN KHÁCH HÀNG</span>
          </button>
          <button
            type="button"
            onClick={handleProceedToStep2}
            className={`py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              formStep === 2 
                ? 'border-blue-700 text-blue-700 bg-white font-extrabold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold flex items-center justify-center">2</span>
            <span>THÔNG TIN QUAN HỆ</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs sm:text-sm flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* DUPLICATE DETECTED BANNER */}
          {detectedDuplicate && !isUpdatingExistingFromDuplicate && (
            <div className="p-3 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-xs text-amber-900 uppercase">
                    Khách hàng đã tồn tại trên hệ thống
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    SĐT <strong>{formatPhoneDisplay(sdt)}</strong> đã thuộc về <strong>{detectedDuplicate.hoTen}</strong> (Cán bộ: {detectedDuplicate.canBoPhuTrach}).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleLoadExistingCustomer(detectedDuplicate)}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Xem & Cập nhật thông tin khách hàng này</span>
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* BƯỚC 1: THÔNG TIN KHÁCH HÀNG (Mục 8) */}
          {/* ======================================================== */}
          {formStep === 1 && (
            <div className="space-y-3">
              
              {/* Loại khách hàng */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLoaiKhachHang('Cá nhân')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    loaiKhachHang === 'Cá nhân' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Khách hàng Cá nhân</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoaiKhachHang('Tổ chức')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    loaiKhachHang === 'Tổ chức' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Doanh nghiệp / Tổ chức</span>
                </button>
              </div>

              {/* Nếu là Tổ chức */}
              {loaiKhachHang === 'Tổ chức' && (
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-2.5">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Tên Công ty / Doanh nghiệp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={tenCongTy}
                      onChange={(e) => setTenCongTy(e.target.value)}
                      placeholder="VD: Công ty Cổ phần Thương mại & Xuất nhập khẩu Á Châu"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Chức vụ người liên hệ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={chucVu}
                      onChange={(e) => setChucVu(e.target.value)}
                      placeholder="VD: Tổng Giám đốc / Kế toán trưởng"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Họ và tên */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  {loaiKhachHang === 'Tổ chức' ? 'Họ tên Người đại diện / Đầu mối' : 'Họ và tên khách hàng'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  id="customer-input-hoten"
                  type="text"
                  value={hoTen}
                  onChange={(e) => setHoTen(e.target.value)}
                  placeholder="VD: Nguyễn Văn An"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              {/* SĐT & Ngày sinh */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="customer-input-sdt"
                    type="tel"
                    value={sdt}
                    onChange={(e) => setSdt(e.target.value)}
                    onBlur={() => {
                      if (sdt.trim()) {
                        const normalized = normalizePhone(sdt);
                        if (normalized) setSdt(normalized);
                      }
                    }}
                    placeholder="VD: 0912345678"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                    required
                  />
                  {sdt.trim() && (
                    <p className="text-[11px] text-blue-700 font-mono mt-1 flex items-center gap-1">
                      <span>Chuẩn hóa có số 0:</span>
                      <strong className="font-bold text-blue-900">{normalizedPhone || normalizePhone(sdt)}</strong>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Ngày sinh (nhắc sinh nhật)
                  </label>
                  <input
                    id="customer-input-dob"
                    type="date"
                    value={ngaySinh}
                    onChange={(e) => setNgaySinh(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Địa chỉ & GPS (Mục 9) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800">
                    Địa chỉ khách hàng
                  </label>
                  <button
                    type="button"
                    onClick={handleGetGps}
                    disabled={gpsLoading}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{gpsLoading ? 'Đang lấy...' : 'Lấy GPS'}</span>
                  </button>
                </div>
                <input
                  id="customer-input-address"
                  type="text"
                  value={diaChi}
                  onChange={(e) => setDiaChi(e.target.value)}
                  placeholder="VD: Số 45 Phố Lý Thường Kiệt, Hoàn Kiếm, Hà Nội"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                {gpsMessage && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">{gpsMessage}</p>
                )}
                {googleMapUrl && (
                  <a
                    href={googleMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 font-semibold underline mt-1 block truncate"
                  >
                    📍 Đã liên kết vị trí trên Google Maps
                  </a>
                )}
              </div>

              {/* Ngành nghề */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Ngành nghề kinh doanh / Nghề nghiệp
                </label>
                <input
                  id="customer-input-industry"
                  type="text"
                  value={nganhNghe}
                  onChange={(e) => setNganhNghe(e.target.value)}
                  placeholder="VD: Bất động sản, Xuất nhập khẩu, Y tế, Xây dựng..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Action: Next Step */}
              <div className="pt-2">
                <button
                  type="button"
                  id="customer-btn-next-step"
                  onClick={handleProceedToStep2}
                  className="w-full py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <span>Tiếp tục: Thông tin quan hệ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* BƯỚC 2: THÔNG TIN QUAN HỆ & CHĂM SÓC (Mục 8) */}
          {/* ======================================================== */}
          {formStep === 2 && (
            <div className="space-y-3.5">
              
              {/* Phân loại khách hàng */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Phân loại khách hàng <span className="text-rose-500">*</span>
                </label>
                <select
                  id="customer-select-tier"
                  value={phanLoai}
                  onChange={(e) => setPhanLoai(e.target.value as CustomerTier)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="Đang tiếp thị">Đang tiếp thị</option>
                  <option value="Đã có quan hệ tín dụng">Đã có quan hệ tín dụng</option>
                  <option value="Khách hàng VIP">⭐ Khách hàng VIP</option>
                  <option value="Khách hàng Siêu VIP">👑 Khách hàng Siêu VIP</option>
                </select>
              </div>

              {/* Nhu cầu khách hàng (Multi-select) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Nhu cầu khách hàng (Chọn nhiều)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_DEMANDS.map(demand => {
                    const isSelected = selectedDemands.includes(demand);
                    return (
                      <button
                        type="button"
                        key={demand}
                        onClick={() => toggleDemand(demand)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-amber-400 text-slate-950 border-amber-500 font-bold shadow-xs' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{demand}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={customDemand}
                  onChange={(e) => setCustomDemand(e.target.value)}
                  placeholder="Hoặc nhập nhu cầu cụ thể khác (VD: Vay dự án 20 tỷ)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs mt-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Ghi chú quan trọng
                </label>
                <textarea
                  id="customer-input-notes"
                  rows={2}
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                  placeholder="Thói quen, phong cách làm việc, lưu ý cá nhân..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Chế độ chăm sóc (Công tắc BẬT/TẮT + Checkboxes sự kiện chuẩn Mục 8) */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-emerald-950 block text-sm">
                      ❤️ Đặt chế độ chăm sóc
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      Tự động nhắc lịch sinh nhật, lễ Tết và chăm sóc định kỳ
                    </span>
                  </div>
                  <button
                    type="button"
                    id="customer-toggle-care"
                    onClick={() => setCheDoChamSoc(cheDoChamSoc === 'Bật' ? 'Tắt' : 'Bật')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                      cheDoChamSoc === 'Bật'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cheDoChamSoc === 'Bật' ? '🟢 BẬT' : '⚪ TẮT'}
                  </button>
                </div>

                {cheDoChamSoc === 'Bật' && (
                  <div className="pt-2 border-t border-emerald-200/80 space-y-1.5">
                    <span className="text-xs font-bold text-emerald-900 block">
                      Các sự kiện chăm sóc:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CARE_EVENTS_LIST.map(event => {
                        const checked = selectedCareEvents.includes(event);
                        return (
                          <label
                            key={event}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                              checked 
                                ? 'bg-white border-emerald-500 text-emerald-900 shadow-xs' 
                                : 'bg-emerald-50/40 border-emerald-200 text-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCareEvent(event)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                            />
                            <span>{event}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Cán bộ phụ trách */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Cán bộ phụ trách & Quản lý
                </label>
                {users.length > 0 ? (
                  <select
                    value={userCanBo}
                    onChange={(e) => handleSelectOfficer(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    {users.map(u => (
                      <option key={u.user} value={u.user}>
                        {u.hoTen} (@{u.user}) - {u.viTri}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={canBoPhuTrach}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700"
                  />
                )}
              </div>

              {/* Action Buttons: Back to Step 1 & Submit */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormStep(1)}
                  className="py-3 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại</span>
                </button>
                <button
                  type="submit"
                  id="customer-btn-save"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                      <span>LƯU KHÁCH HÀNG</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </form>

      </div>
    </div>
  );
};
