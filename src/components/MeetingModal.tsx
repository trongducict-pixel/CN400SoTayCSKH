import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  Handshake, 
  Phone, 
  Video, 
  Mail, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Navigation, 
  PlusCircle, 
  Sparkles,
  Loader2,
  Search,
  ChevronRight,
  ArrowLeft,
  UserCheck,
  Star,
  Building,
  UserPlus
} from 'lucide-react';
import { Customer, MeetingFormat, MeetingStatus, MeetingHistory, Task } from '../types';
import { normalizePhone } from '../services/phoneUtils';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  preSelectedCustomerId?: string;
  onSaveMeeting: (meeting: Partial<MeetingHistory>, newTask?: { noiDung: string; ngayHan: string; ghiChu: string }) => Promise<void>;
  onOpenNewCustomer?: () => void;
  currentUserName: string;
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

const MEETING_STATUS_OPTIONS: MeetingStatus[] = [
  'Đang tiếp cận',
  'Đang tư vấn',
  'Có nhu cầu',
  'Đang xử lý',
  'Chưa thành công',
  'Không còn nhu cầu',
  'Đã phát sinh giao dịch'
];

const MEETING_FORMATS: MeetingFormat[] = [
  'Gặp trực tiếp',
  'Điện thoại',
  'Video call',
  'Email',
  'Khác'
];

export const MeetingModal: React.FC<MeetingModalProps> = ({
  isOpen,
  onClose,
  customers,
  preSelectedCustomerId,
  onSaveMeeting,
  onOpenNewCustomer,
  currentUserName
}) => {
  const now = new Date();
  const defaultDateStr = now.toISOString().slice(0, 16).replace('T', ' '); // YYYY-MM-DD HH:mm

  // Step state: 'SELECT_CUSTOMER' or 'RECORD_FORM'
  const [step, setStep] = useState<'SELECT_CUSTOMER' | 'RECORD_FORM'>(() => {
    return preSelectedCustomerId ? 'RECORD_FORM' : 'SELECT_CUSTOMER';
  });

  const [selectedKhId, setSelectedKhId] = useState<string>(preSelectedCustomerId || '');
  const [customerSearch, setCustomerSearch] = useState<string>('');

  // Meeting form fields
  const [meetingTime, setMeetingTime] = useState<string>(defaultDateStr);
  const [format, setFormat] = useState<MeetingFormat>('Gặp trực tiếp');
  const [exchangeContent, setExchangeContent] = useState<string>('');
  const [selectedDemands, setSelectedDemands] = useState<string[]>([]);
  const [meetingStatus, setMeetingStatus] = useState<MeetingStatus>('Đang tư vấn');
  const [followUpTask, setFollowUpTask] = useState<string>('');
  const [nextAppointmentDate, setNextAppointmentDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // GPS state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [googleMapUrl, setGoogleMapUrl] = useState<string>('');
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsMessage, setGpsMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset or setup when preSelectedCustomerId or isOpen changes
  useEffect(() => {
    if (isOpen) {
      if (preSelectedCustomerId) {
        setSelectedKhId(preSelectedCustomerId);
        setStep('RECORD_FORM');
      } else {
        setSelectedKhId('');
        setStep('SELECT_CUSTOMER');
      }
      setSubmitError(null);
    }
  }, [isOpen, preSelectedCustomerId]);

  const currentCustomer = useMemo(() => {
    return customers.find(c => c.idKh === selectedKhId);
  }, [customers, selectedKhId]);

  // Pre-fill demands from customer if previously empty
  useEffect(() => {
    if (currentCustomer && selectedDemands.length === 0 && currentCustomer.nhuCau) {
      const parts = currentCustomer.nhuCau.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        setSelectedDemands(parts);
      }
    }
  }, [currentCustomer]);

  // Filter customers for Step 1
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    const raw = !q ? customers : customers.filter(c => 
      (c.hoTen || '').toLowerCase().includes(q) || 
      (c.sdt || '').includes(q) ||
      ((c.tenCongTy || '') && (c.tenCongTy || '').toLowerCase().includes(q))
    );
    const seen = new Set<string>();
    const unique: Customer[] = [];
    for (const c of raw) {
      const key = (c.idKh || c.sdt || '').trim();
      if (!key) continue;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
      if (unique.length >= (!q ? 15 : 30)) break;
    }
    return unique;
  }, [customers, customerSearch]);

  // Auto request GPS when entering Step 2
  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setGpsMessage({
        text: 'Trình duyệt không hỗ trợ GPS. Bạn có thể nhập vị trí thủ công.',
        type: 'warning'
      });
      return;
    }

    setGpsLoading(true);
    setGpsMessage({ text: 'Đang lấy tọa độ GPS...', type: 'info' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        setGoogleMapUrl(mapUrl);
        setGpsLoading(false);
        setGpsMessage({
          text: `Đã ghim vị trí GPS (${lat}, ${lng})`,
          type: 'success'
        });
      },
      (error) => {
        setGpsLoading(false);
        let msg = 'Không lấy được vị trí GPS. Bạn có thể nhập vị trí thủ công.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Chưa cấp quyền GPS. Bạn có thể tiếp tục mà không cần GPS.';
        }
        setGpsMessage({ text: msg, type: 'warning' });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleSelectCustomer = (kh: Customer) => {
    setSelectedKhId(kh.idKh);
    setStep('RECORD_FORM');
    // Attempt GPS automatically
    handleGetGps();
  };

  const toggleDemand = (demand: string) => {
    setSelectedDemands(prev => 
      prev.includes(demand) 
        ? prev.filter(d => d !== demand)
        : [...prev, demand]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKhId) {
      setSubmitError('Vui lòng chọn khách hàng.');
      setStep('SELECT_CUSTOMER');
      return;
    }
    if (!exchangeContent.trim()) {
      setSubmitError('Vui lòng nhập tóm tắt nội dung trao đổi.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const demandString = selectedDemands.join(', ');
      const meetingData: Partial<MeetingHistory> = {
        idKh: selectedKhId,
        thoiGianGap: meetingTime,
        hinhThucGap: format,
        latitude: latitude,
        longitude: longitude,
        googleMapUrl: googleMapUrl,
        noiDungTraoDoi: exchangeContent.trim(),
        nhuCauKhachHang: demandString,
        tinhTrangSauGap: meetingStatus,
        congViecTiepTheo: followUpTask.trim(),
        ngayHenLienHe: nextAppointmentDate,
        ghiChu: notes.trim(),
        canBoThucHien: currentUserName
      };

      const newTask = followUpTask.trim() ? {
        noiDung: followUpTask.trim(),
        ngayHan: nextAppointmentDate || '',
        ghiChu: `Tạo từ cuộc gặp ngày ${meetingTime}`
      } : undefined;

      await onSaveMeeting(meetingData, newTask);
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'Lỗi khi lưu cuộc gặp. Vui lòng thử lại.');
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
              type="button"
              id="meeting-modal-btn-back"
              onClick={() => {
                if (step === 'RECORD_FORM' && !preSelectedCustomerId) {
                  setStep('SELECT_CUSTOMER');
                } else {
                  onClose();
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all mr-1 cursor-pointer shrink-0"
              title="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Trở lại</span>
            </button>
            <div className="p-1.5 rounded-lg bg-white/20 shrink-0 hidden sm:flex">
              <Handshake className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight truncate">
                {step === 'SELECT_CUSTOMER' ? 'CHỌN KHÁCH HÀNG' : 'GHI NHẬN CUỘC GẶP'}
              </h3>
              <p className="text-[11px] text-blue-200 truncate">
                {step === 'SELECT_CUSTOMER' 
                  ? 'Bước 1: Tìm và chọn khách hàng đã gặp' 
                  : 'Bước 2: Cập nhật nội dung & kết quả trao đổi'}
              </p>
            </div>
          </div>
          <button
            id="meeting-modal-btn-close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: CHỌN KHÁCH HÀNG (Yêu cầu rõ tại Mục 7) */}
        {/* ------------------------------------------------------------- */}
        {step === 'SELECT_CUSTOMER' && (
          <div className="p-4 overflow-y-auto space-y-3 flex-1 flex flex-col">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                id="meeting-search-customer"
                type="text"
                placeholder="🔎 Tìm theo tên hoặc SĐT..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                autoFocus
              />
            </div>

            {/* Customer Cards List */}
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[60vh] pr-0.5">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <p className="text-sm font-semibold text-slate-700">Không tìm thấy khách hàng phù hợp</p>
                  <p className="text-xs text-slate-500 mt-1">Bạn có thể tạo mới hồ sơ khách hàng ngay tại đây.</p>
                  {onOpenNewCustomer && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenNewCustomer();
                      }}
                      className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 mx-auto hover:bg-emerald-700 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>+ Thêm khách hàng mới</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredCustomers.map((kh, khIdx) => (
                  <div
                    key={`meet-cust-${kh.idKh || kh.sdt}-${khIdx}`}
                    onClick={() => handleSelectCustomer(kh)}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/40 active:scale-[0.99] transition-all flex items-center justify-between gap-3 shadow-xs cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-blue-700 transition-colors">
                          {kh.hoTen}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          kh.phanLoai === 'Khách hàng Siêu VIP' ? 'bg-purple-100 text-purple-800' :
                          kh.phanLoai === 'Khách hàng VIP' ? 'bg-amber-100 text-amber-800' :
                          kh.phanLoai === 'Đã có quan hệ tín dụng' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {kh.phanLoai === 'Khách hàng VIP' || kh.phanLoai === 'Khách hàng Siêu VIP' ? '⭐ ' : ''}
                          {kh.phanLoai}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-2">
                        <span className="font-mono font-semibold">📞 {normalizePhone(kh.sdt) || kh.sdt}</span>
                        {kh.tenCongTy && <span>• 🏢 {kh.tenCongTy}</span>}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCustomer(kh);
                      }}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>Ghi nhận</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Quick add customer action */}
            {onOpenNewCustomer && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNewCustomer();
                  }}
                  className="w-full py-2.5 rounded-xl border border-dashed border-emerald-500 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Khách hàng chưa có trong danh sách? Thêm mới</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: FORM GHI NHẬN CUỘC GẶP (Chuẩn Mục 7) */}
        {/* ------------------------------------------------------------- */}
        {step === 'RECORD_FORM' && (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Customer summary card + change button */}
            {currentCustomer && (
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-blue-900">{currentCustomer.hoTen}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-200 text-blue-800">
                      {currentCustomer.phanLoai}
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 font-medium font-mono">📞 {normalizePhone(currentCustomer.sdt) || currentCustomer.sdt}</p>
                </div>
                {!preSelectedCustomerId && (
                  <button
                    type="button"
                    onClick={() => setStep('SELECT_CUSTOMER')}
                    className="text-xs text-blue-700 hover:text-blue-900 font-bold underline px-2 py-1 cursor-pointer"
                  >
                    Đổi khách hàng
                  </button>
                )}
              </div>
            )}

            {/* Auto Fields: Date/Time + Officer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Thời gian gặp <span className="text-rose-500">*</span>
                </label>
                <input
                  id="meeting-input-time"
                  type="text"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Cán bộ thực hiện
                </label>
                <input
                  type="text"
                  value={currentUserName}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            {/* Hình thức gặp (5 options) */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Hình thức gặp <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {MEETING_FORMATS.map((f, fIdx) => (
                  <button
                    type="button"
                    key={`fmt-${f}-${fIdx}`}
                    onClick={() => setFormat(f)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      format === f 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Nội dung trao đổi */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Nội dung trao đổi <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="meeting-input-content"
                rows={3}
                value={exchangeContent}
                onChange={(e) => setExchangeContent(e.target.value)}
                placeholder="Tóm tắt nội dung trao đổi, tình hình hoạt động, dự định của khách hàng..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>

            {/* Nhu cầu khách hàng (Multi-select) */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Nhu cầu khách hàng (Chọn nhiều)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_DEMANDS.map((demand, dIdx) => {
                  const isSelected = selectedDemands.includes(demand);
                  return (
                    <button
                      type="button"
                      key={`demand-${demand}-${dIdx}`}
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
            </div>

            {/* Tình trạng sau cuộc gặp */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Tình trạng sau cuộc gặp <span className="text-rose-500">*</span>
              </label>
              <select
                id="meeting-input-status"
                value={meetingStatus}
                onChange={(e) => setMeetingStatus(e.target.value as MeetingStatus)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {MEETING_STATUS_OPTIONS.map((opt, oIdx) => (
                  <option key={`opt-${opt}-${oIdx}`} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Việc cần làm tiếp theo & Ngày hẹn */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Việc cần làm tiếp theo (Nếu có)
                </label>
                <input
                  id="meeting-input-next-task"
                  type="text"
                  value={followUpTask}
                  onChange={(e) => setFollowUpTask(e.target.value)}
                  placeholder="Ví dụ: Gửi bảng chào lãi suất vay, thu thập hồ sơ pháp lý..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Ngày hẹn liên hệ lại
                </label>
                <input
                  id="meeting-input-next-date"
                  type="date"
                  value={nextAppointmentDate}
                  onChange={(e) => setNextAppointmentDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Vị trí GPS hiện tại (Không bắt buộc, có fallback an toàn) */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Vị trí cuộc gặp (GPS)
                </span>
                <button
                  type="button"
                  id="meeting-btn-refresh-gps"
                  onClick={handleGetGps}
                  disabled={gpsLoading}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {gpsLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Navigation className="w-3 h-3" />
                  )}
                  <span>Lấy GPS</span>
                </button>
              </div>

              {gpsMessage && (
                <p className={`text-[11px] mb-2 ${
                  gpsMessage.type === 'success' 
                    ? 'text-emerald-700 font-medium' 
                    : gpsMessage.type === 'warning'
                    ? 'text-amber-700'
                    : 'text-slate-500'
                }`}>
                  {gpsMessage.text}
                </p>
              )}

              {googleMapUrl && (
                <a 
                  href={googleMapUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 font-semibold underline block truncate"
                >
                  📍 Xem tọa độ ({latitude}, {longitude}) trên Google Maps
                </a>
              )}
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Ghi chú thêm
              </label>
              <textarea
                id="meeting-input-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú thêm (thông tin nội bộ, tính cách khách hàng...)"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 sticky bottom-0 bg-white/95 backdrop-blur-xs">
              <button
                type="submit"
                id="meeting-btn-submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-[0.99] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang lưu vào Sổ tay...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                    <span>LƯU CUỘC GẶP</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
