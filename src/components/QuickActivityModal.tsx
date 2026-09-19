import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  Phone, 
  MessageSquare, 
  Gift, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  Sparkles,
  Loader2,
  Search,
  ChevronRight,
  ArrowLeft,
  Building,
  Target,
  Check
} from 'lucide-react';
import { Customer, MeetingHistory, Task, CareHistory, DemandCategory } from '../types';
import { normalizePhone } from '../services/phoneUtils';

interface QuickActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  preSelectedCustomerId?: string;
  demandCategories?: DemandCategory[];
  currentUserName: string;
  currentUserEmail?: string;
  onSaveActivity: (activity: {
    activityType: 'MEETING' | 'CARE';
    meetingData?: Partial<MeetingHistory>;
    careData?: Partial<CareHistory>;
    nextTask?: { noiDung: string; ngayHan: string; ghiChu: string; priority?: 'CAO' | 'TRUNG_BINH' | 'THAP' };
  }) => Promise<void>;
  onOpenNewCustomer?: () => void;
}

type ActivityType = 'MEETING' | 'CARE_CALL' | 'CARE_MESSAGE' | 'CARE_GIFT';

const QUICK_TAGS_BY_ACTIVITY: Record<ActivityType, string[]> = {
  MEETING: [
    'Tư vấn vay vốn SXKD',
    'Trao đổi hạn mức tín dụng',
    'Tư vấn gói CASA & Tiền gửi',
    'Đàm phán phí bảo lãnh / LC',
    'Thẩm định tài sản / Thực địa',
    'Gặp gỡ duy trì quan hệ'
  ],
  CARE_CALL: [
    'Chúc mừng sinh nhật khách hàng',
    'Hỏi thăm tình hình kinh doanh',
    'Cập nhật lãi suất ưu đãi mới',
    'Nhắc lịch đến hạn khoản vay',
    'Chăm sóc dịp lễ 20/10 - 8/3'
  ],
  CARE_MESSAGE: [
    'Gửi lời chúc mừng sinh nhật',
    'Gửi bảng tỷ giá & lãi suất',
    'Gửi thiệp chúc mừng ngày lễ',
    'Nhắn tin cảm ơn giao dịch',
    'Nhắn hẹn lịch gặp tiếp theo'
  ],
  CARE_GIFT: [
    'Tặng quà sinh nhật khách hàng VIP',
    'Tặng quà Tết Nguyên Đán',
    'Tặng lịch & ấn phẩm ngân hàng',
    'Tặng hoa chúc mừng khai trương',
    'Quà tri ân khách hàng thân thiết'
  ]
};

export const QuickActivityModal: React.FC<QuickActivityModalProps> = ({
  isOpen,
  onClose,
  customers,
  preSelectedCustomerId,
  demandCategories,
  currentUserName,
  currentUserEmail,
  onSaveActivity,
  onOpenNewCustomer
}) => {
  // Step 1: Chọn Khách hàng (bỏ qua nếu preSelectedCustomerId)
  // Step 2: Chọn Loại hoạt động & Thao tác nhanh 3 chạm
  const [selectedKhId, setSelectedKhId] = useState<string>(preSelectedCustomerId || '');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [activityType, setActivityType] = useState<ActivityType>('MEETING');

  // Form states
  const [hinhThucGap, setHinhThucGap] = useState<'Gặp trực tiếp' | 'Gọi điện' | 'Họp trực tuyến'>('Gặp trực tiếp');
  const [noiDungTraoDoi, setNoiDungTraoDoi] = useState<string>('');
  const [tinhTrangSauGap, setTinhTrangSauGap] = useState<string>('Có nhu cầu');
  const [selectedDemands, setSelectedDemands] = useState<string[]>([]);
  
  // Quick Task
  const [hasFollowUpTask, setHasFollowUpTask] = useState<boolean>(false);
  const [taskContent, setTaskContent] = useState<string>('');
  const [taskDueDate, setTaskDueDate] = useState<string>('');
  const [taskPriority, setTaskPriority] = useState<'CAO' | 'TRUNG_BINH' | 'THAP'>('TRUNG_BINH');

  // GPS state for Meeting
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsStatus, setGpsStatus] = useState<'SUCCESS' | 'FAILED' | 'MANUAL' | 'IDLE'>('IDLE');
  const [gpsMessage, setGpsMessage] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize selected customer
  useEffect(() => {
    if (preSelectedCustomerId) {
      setSelectedKhId(preSelectedCustomerId);
    }
  }, [preSelectedCustomerId]);

  const currentCustomer = useMemo(() => {
    return customers.find(c => c.idKh === selectedKhId);
  }, [customers, selectedKhId]);

  // Default next task date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setTaskDueDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Filter customers
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

  // GPS Acquire
  const handleAcquireGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('MANUAL');
      setGpsMessage('Thiết bị không hỗ trợ định vị tự động');
      return;
    }

    setGpsLoading(true);
    setGpsMessage('Đang kết nối GPS vệ tinh...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const acc = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null;
        setLatitude(lat);
        setLongitude(lng);
        setGpsAccuracy(acc);
        setGpsStatus('SUCCESS');
        setGpsLoading(false);
        setGpsMessage(`Đã ghim vị trí (${lat}, ${lng}) ±${acc || 10}m`);
      },
      (err) => {
        setGpsLoading(false);
        setGpsStatus('FAILED');
        setGpsMessage(err.code === 1 ? 'Chưa cấp quyền truy cập vị trí' : 'Không bắt được tín hiệu GPS');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  // Auto GPS when meeting chosen
  useEffect(() => {
    if (activityType === 'MEETING' && hinhThucGap === 'Gặp trực tiếp' && gpsStatus === 'IDLE') {
      handleAcquireGps();
    }
  }, [activityType, hinhThucGap, gpsStatus]);

  // Quick Tags
  const quickTags = QUICK_TAGS_BY_ACTIVITY[activityType] || [];

  const handleApplyTag = (tag: string) => {
    if (!noiDungTraoDoi) {
      setNoiDungTraoDoi(tag);
    } else if (!noiDungTraoDoi.includes(tag)) {
      setNoiDungTraoDoi(prev => `${prev}; ${tag}`);
    }
  };

  const toggleDemand = (name: string) => {
    setSelectedDemands(prev => 
      prev.includes(name) ? prev.filter(d => d !== name) : [...prev, name]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKhId) {
      setErrorMsg('Vui lòng chọn một khách hàng.');
      return;
    }

    if (!noiDungTraoDoi.trim()) {
      setErrorMsg('Vui lòng nhập hoặc chọn nhanh nội dung hoạt động.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    try {
      if (activityType === 'MEETING') {
        const meetingData: Partial<MeetingHistory> = {
          idKh: selectedKhId,
          thoiGianGap: nowStr,
          hinhThucGap: hinhThucGap,
          latitude: latitude,
          longitude: longitude,
          googleMapUrl: latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : '',
          noiDungTraoDoi: noiDungTraoDoi.trim(),
          nhuCauKhachHang: selectedDemands.join(', '),
          tinhTrangSauGap: tinhTrangSauGap,
          congViecTiepTheo: hasFollowUpTask ? taskContent : '',
          ngayHenLienHe: hasFollowUpTask ? taskDueDate : '',
          canBoThucHien: currentUserName,
          checkInTime: nowStr,
          gpsAccuracy: gpsAccuracy,
          checkInStatus: gpsStatus === 'SUCCESS' ? 'SUCCESS' : (latitude ? 'SUCCESS' : 'MANUAL')
        };

        const nextTask = hasFollowUpTask && taskContent.trim() ? {
          noiDung: taskContent.trim(),
          ngayHan: taskDueDate,
          ghiChu: `Tạo nhanh từ cuộc gặp ngày ${nowStr}`,
          priority: taskPriority
        } : undefined;

        await onSaveActivity({
          activityType: 'MEETING',
          meetingData,
          nextTask
        });

      } else {
        // CARE ACTIVITY (Gọi điện, Tin nhắn, Tặng quà)
        const hinhThucMap: Record<string, any> = {
          CARE_CALL: 'Gọi điện',
          CARE_MESSAGE: 'Tin nhắn',
          CARE_GIFT: 'Tặng quà'
        };

        const careData: Partial<CareHistory> = {
          idKh: selectedKhId,
          thoiGian: nowStr,
          hinhThuc: hinhThucMap[activityType] || 'Gọi điện',
          suKien: activityType === 'CARE_GIFT' ? 'Tặng quà tri ân' : 'Chăm sóc thường xuyên',
          noiDung: noiDungTraoDoi.trim(),
          ketQua: 'Đã hoàn thành chăm sóc',
          canBo: currentUserName,
          ghiChu: selectedDemands.length > 0 ? `Nhu cầu quan tâm: ${selectedDemands.join(', ')}` : ''
        };

        const nextTask = hasFollowUpTask && taskContent.trim() ? {
          noiDung: taskContent.trim(),
          ngayHan: taskDueDate,
          ghiChu: `Tạo từ hoạt động chăm sóc ngày ${nowStr}`,
          priority: taskPriority
        } : undefined;

        await onSaveActivity({
          activityType: 'CARE',
          careData,
          nextTask
        });
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi ghi nhận hoạt động. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div 
        id="quick-activity-modal-content"
        className="w-full sm:max-w-xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in fade-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              ⚡
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Ghi nhận nhanh hoạt động (3 chạm)</h2>
              <p className="text-xs text-slate-500">Cán bộ: <span className="font-semibold text-slate-700">{currentUserName}</span></p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* CHẠM 1: CHỌN KHÁCH HÀNG */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">1</span>
                Khách hàng mục tiêu <span className="text-rose-500">*</span>
              </label>
              {selectedKhId && (
                <button 
                  type="button" 
                  onClick={() => setSelectedKhId('')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Đổi khách hàng
                </button>
              )}
            </div>

            {selectedKhId && currentCustomer ? (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">{currentCustomer.hoTen}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      currentCustomer.phanLoai.includes('VIP') ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {currentCustomer.phanLoai}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>📞 {currentCustomer.sdt}</span>
                    {currentCustomer.tenCongTy && (
                      <span className="truncate max-w-[200px]">🏢 {currentCustomer.tenCongTy}</span>
                    )}
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên, SĐT hoặc công ty..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      Không tìm thấy khách hàng.
                    </div>
                  ) : (
                    filteredCustomers.map((c, cIdx) => (
                      <button
                        key={`qa-cust-${c.idKh || c.sdt}-${cIdx}`}
                        type="button"
                        onClick={() => {
                          setSelectedKhId(c.idKh);
                          setCustomerSearch('');
                        }}
                        className="w-full p-2.5 text-left hover:bg-slate-50 flex items-center justify-between transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-slate-900 truncate">{c.hoTen}</p>
                          <p className="text-[11px] text-slate-500">{c.sdt} {c.tenCongTy ? `• ${c.tenCongTy}` : ''}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CHẠM 2: CHỌN LOẠI HOẠT ĐỘNG */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">2</span>
              Loại hoạt động <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActivityType('MEETING')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  activityType === 'MEETING'
                    ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4 mb-1" />
                <span>Cuộc gặp</span>
              </button>

              <button
                type="button"
                onClick={() => setActivityType('CARE_CALL')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  activityType === 'CARE_CALL'
                    ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Phone className="w-4 h-4 mb-1" />
                <span>Gọi điện</span>
              </button>

              <button
                type="button"
                onClick={() => setActivityType('CARE_MESSAGE')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  activityType === 'CARE_MESSAGE'
                    ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-4 h-4 mb-1" />
                <span>Tin nhắn</span>
              </button>

              <button
                type="button"
                onClick={() => setActivityType('CARE_GIFT')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  activityType === 'CARE_GIFT'
                    ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Gift className="w-4 h-4 mb-1" />
                <span>Tặng quà</span>
              </button>
            </div>

            {/* GPS Status nếu là Cuộc gặp */}
            {activityType === 'MEETING' && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className={`w-4 h-4 ${latitude ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-slate-700 font-medium">{gpsMessage || 'Chưa định vị GPS'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleAcquireGps}
                  disabled={gpsLoading}
                  className="px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                >
                  {gpsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Ghim lại GPS'}
                </button>
              </div>
            )}
          </div>

          {/* CHẠM 3: NỘI DUNG NHANH & NHU CẦU */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">3</span>
              Nội dung & Nhãn nhanh <span className="text-rose-500">*</span>
            </label>

            {/* Quick Tag Pills */}
            <div className="flex flex-wrap gap-1.5">
              {quickTags.map((tag, tagIdx) => (
                <button
                  key={`qtag-${tag}-${tagIdx}`}
                  type="button"
                  onClick={() => handleApplyTag(tag)}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded-lg transition-colors text-left"
                >
                  + {tag}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={noiDungTraoDoi}
              onChange={(e) => setNoiDungTraoDoi(e.target.value)}
              placeholder="Nhập chi tiết nội dung trao đổi hoặc bấm chọn nhanh phía trên..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden resize-none"
            />

            {/* Standard Demand Tag Selector */}
            <div className="pt-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Nhu cầu tài chính quan tâm:
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                {(demandCategories && demandCategories.length > 0 ? demandCategories : [
                  { idNhuCau: '1', tenNhuCau: 'Vay vốn SXKD', nhomNhuCau: 'VAY' },
                  { idNhuCau: '2', tenNhuCau: 'Vay mua BĐS/Nhà ở', nhomNhuCau: 'VAY' },
                  { idNhuCau: '3', tenNhuCau: 'Tiền gửi dân cư', nhomNhuCau: 'TIEN_GUI' },
                  { idNhuCau: '4', tenNhuCau: 'Thẻ tín dụng', nhomNhuCau: 'THE' },
                  { idNhuCau: '5', tenNhuCau: 'Ngân hàng số iPay/eFAST', nhomNhuCau: 'NGAN_HANG_SO' },
                  { idNhuCau: '6', tenNhuCau: 'Bảo hiểm VBI/Manulife', nhomNhuCau: 'BAO_HIEM' }
                ]).map((cat: any, catIdx: number) => {
                  const isChecked = selectedDemands.includes(cat.tenNhuCau);
                  return (
                    <button
                      key={`cat-${cat.idNhuCau || cat.tenNhuCau}-${catIdx}`}
                      type="button"
                      onClick={() => toggleDemand(cat.tenNhuCau)}
                      className={`px-2 py-0.8 rounded-md text-xs font-medium transition-all ${
                        isChecked
                          ? 'bg-blue-700 text-white font-bold shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked ? '✓ ' : ''}{cat.tenNhuCau}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TÙY CHỌN: TẠO VIỆC CẦN LÀM TIẾP THEO (FOLLOW-UP) */}
          <div className="pt-1 border-t border-slate-200">
            <div className="flex items-center justify-between py-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasFollowUpTask}
                  onChange={(e) => setHasFollowUpTask(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>Tạo công việc nhắc nhở tiếp theo</span>
              </label>
              {hasFollowUpTask && (
                <span className="text-[11px] font-semibold text-blue-700">Tự động đồng bộ Lịch nhắc</span>
              )}
            </div>

            {hasFollowUpTask && (
              <div className="mt-2 p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                <div>
                  <input
                    type="text"
                    value={taskContent}
                    onChange={(e) => setTaskContent(e.target.value)}
                    placeholder="Ví dụ: Gửi bảng chào lãi suất, soạn tờ trình vay 50 tỷ..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-hidden focus:border-amber-600"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-amber-800 uppercase block mb-0.5">Ngày hạn:</label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-white border border-amber-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-amber-800 uppercase block mb-0.5">Mức ưu tiên:</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="px-2.5 py-1 text-xs bg-white border border-amber-300 rounded-lg font-bold"
                    >
                      <option value="CAO">Ưu tiên Cao</option>
                      <option value="TRUNG_BINH">Trung bình</option>
                      <option value="THAP">Thấp</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 rounded-b-2xl flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang ghi nhận...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Ghi nhận ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
