import React, { useState, useMemo } from 'react';
import { 
  Search,
  BellRing, 
  Calendar, 
  Gift, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Trash2, 
  Phone, 
  Handshake, 
  Sparkles,
  Loader2,
  Users,
  Star,
  MapPin,
  CheckSquare,
  ChevronRight,
  ArrowLeft,
  Filter,
  Check,
  ExternalLink,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Customer, MeetingHistory, Task, CareEvent, EmailLog, TaskStatus } from '../types';
import { normalizePhone } from '../services/phoneUtils';

interface CareManagementViewProps {
  customers: Customer[];
  meetings?: MeetingHistory[];
  tasks?: Task[];
  careEvents: CareEvent[];
  emailLogs: EmailLog[];
  onManualCheckReminders: () => Promise<any>;
  onToggleCustomerCare: (customerId: string, newMode: 'Bật' | 'Tắt') => void;
  onSaveCareEvent: (event: CareEvent) => Promise<void>;
  onDeleteCareEvent: (eventId: string) => Promise<void>;
  onOpenNewMeeting: (customerId?: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onOpenMap?: (customer: Customer) => void;
  onUpdateTaskStatus?: (taskId: string, status: TaskStatus) => Promise<void>;
  onAddNewTask?: (customerId?: string) => void;
}

type CareSection = 'menu' | 'search' | 'need_care' | 'schedule' | 'meetings' | 'tasks' | 'vip';

export const CareManagementView: React.FC<CareManagementViewProps> = ({
  customers,
  meetings = [],
  tasks = [],
  careEvents,
  emailLogs,
  onManualCheckReminders,
  onToggleCustomerCare,
  onSaveCareEvent,
  onDeleteCareEvent,
  onOpenNewMeeting,
  onSelectCustomer,
  onOpenMap,
  onUpdateTaskStatus,
  onAddNewTask
}) => {
  // Current active sub-section (starts at menu as required by Section 10)
  const [activeSection, setActiveSection] = useState<CareSection>('menu');

  // Sub-section 1: Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<
    'all' | 'tiep_thi' | 'qhtd' | 'vip' | 'sieu_vip' | 'care_on' | 'care_off'
  >('all');

  // Sub-section 2: Need Care Filter State
  const [needCareFilter, setNeedCareFilter] = useState<'all' | 'birthday' | 'events' | 'overdue_meeting'>('all');

  // Sub-section 4: Meeting filter
  const [meetingSearch, setMeetingSearch] = useState('');
  const [meetingTypeFilter, setMeetingTypeFilter] = useState('all');

  // Sub-section 5: Task filter
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');

  // Manual reminder trigger states
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [checkResult, setCheckResult] = useState<{ message: string; details?: any } | null>(null);

  // New Event Modal state
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState<'SinhNhat' | 'NgayLe' | 'Tet' | 'DacBiet'>('NgayLe');
  const [daysBefore, setDaysBefore] = useState(3);

  const now = useMemo(() => new Date(), []);
  const todayMidnight = useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()), [now]);

  // Map of last meeting date by customerId
  const lastMeetingMap = useMemo(() => {
    const map = new Map<string, { date: string; daysAgo: number }>();
    meetings.forEach(m => {
      const mDate = new Date(m.thoiGianGap);
      if (!isNaN(mDate.getTime())) {
        const diffMs = todayMidnight.getTime() - mDate.getTime();
        const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const existing = map.get(m.idKh);
        if (!existing || daysAgo < existing.daysAgo) {
          map.set(m.idKh, { date: m.thoiGianGap, daysAgo });
        }
      }
    });
    return map;
  }, [meetings, todayMidnight]);

  // Upcoming care calculation (Birthday & Events in 15-30 days)
  const birthdayUpcoming = useMemo(() => {
    const list: Array<{ customer: Customer; daysRemaining: number; dateStr: string }> = [];
    customers.forEach(cust => {
      if (cust.ngaySinh) {
        const parts = cust.ngaySinh.split('-');
        if (parts.length === 3) {
          const bDay = parseInt(parts[2], 10);
          const bMonth = parseInt(parts[1], 10);
          const thisYearDate = new Date(now.getFullYear(), bMonth - 1, bDay);
          let diffMs = thisYearDate.getTime() - todayMidnight.getTime();
          let diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            const nextYearDate = new Date(now.getFullYear() + 1, bMonth - 1, bDay);
            diffDays = Math.round((nextYearDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
          }
          if (diffDays >= 0 && diffDays <= 30) {
            list.push({ customer: cust, daysRemaining: diffDays, dateStr: `${bDay}/${bMonth}` });
          }
        }
      }
    });
    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [customers, now, todayMidnight]);

  // Customers not met for > 30 days
  const overdueMeetingCustomers = useMemo(() => {
    return customers.filter(c => {
      const last = lastMeetingMap.get(c.idKh);
      if (!last) return true; // Chưa từng gặp
      return last.daysAgo > 30;
    });
  }, [customers, lastMeetingMap]);

  // VIP & Super VIP customers
  const vipCustomers = useMemo(() => {
    return customers.filter(c => c.phanLoai.includes('VIP') || c.phanLoai.includes('Siêu VIP'));
  }, [customers]);

  // Filtered customers for Sub-section 1: Tìm khách hàng
  const searchFilteredCustomers = useMemo(() => {
    const list = customers.filter(c => {
      const query = searchTerm.toLowerCase().trim();
      const matchSearch = !query || 
        c.hoTen.toLowerCase().includes(query) ||
        c.sdt.toLowerCase().includes(query) ||
        (c.nganhNghe && c.nganhNghe.toLowerCase().includes(query)) ||
        (c.tenCongTy && c.tenCongTy.toLowerCase().includes(query));

      if (!matchSearch) return false;

      if (filterType === 'tiep_thi') return c.phanLoai.includes('tiếp thị');
      if (filterType === 'qhtd') return c.phanLoai.includes('quan hệ tín dụng');
      if (filterType === 'vip') return c.phanLoai.includes('VIP') && !c.phanLoai.includes('Siêu VIP');
      if (filterType === 'sieu_vip') return c.phanLoai.includes('Siêu VIP');
      if (filterType === 'care_on') return c.cheDoChamSoc === 'Bật';
      if (filterType === 'care_off') return c.cheDoChamSoc === 'Tắt';

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
  }, [customers, searchTerm, filterType]);

  const handleRunManualCheck = async () => {
    setIsRunningCheck(true);
    setCheckResult(null);
    try {
      const res = await onManualCheckReminders();
      setCheckResult({
        message: res.message || 'Đã kiểm tra xong.',
        details: res.data
      });
    } catch (e: any) {
      setCheckResult({
        message: 'Lỗi: ' + (e.message || 'Không thể chạy kiểm tra.')
      });
    } finally {
      setIsRunningCheck(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDate.trim()) return;

    await onSaveCareEvent({
      idSuKien: '',
      tenSuKien: eventName,
      ngay: eventDate,
      loai: eventType,
      soNgayNhacTruoc: Number(daysBefore),
      trangThai: 'Bật'
    });

    setEventName('');
    setEventDate('');
    setShowAddEventModal(false);
  };

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      {/* Navigation Header if inside a sub-section */}
      {activeSection !== 'menu' && (
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
          <button
            id="care-btn-back-menu"
            onClick={() => setActiveSection('menu')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-blue-700" />
            <span>Quay lại Menu Chăm sóc</span>
          </button>

          {/* Quick Sub-section Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveSection('search')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'search' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              🔎 Tìm kiếm
            </button>
            <button
              onClick={() => setActiveSection('need_care')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'need_care' ? 'bg-rose-700 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              🔔 Cần chăm sóc ({birthdayUpcoming.length + overdueMeetingCustomers.length})
            </button>
            <button
              onClick={() => setActiveSection('schedule')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'schedule' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              📅 Lịch sự kiện
            </button>
            <button
              onClick={() => setActiveSection('meetings')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'meetings' ? 'bg-indigo-700 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              📖 Lịch sử ({meetings.length})
            </button>
            <button
              onClick={() => setActiveSection('tasks')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'tasks' ? 'bg-amber-700 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              📌 Việc làm ({tasks.filter(t => t.trangThai !== 'Hoàn thành').length})
            </button>
            <button
              onClick={() => setActiveSection('vip')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'vip' ? 'bg-purple-700 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ⭐ VIP ({vipCustomers.length})
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 10. MENU HUB: 6 LỰA CHỌN CHUẨN MỤC 10                 */}
      {/* ---------------------------------------------------- */}
      {activeSection === 'menu' && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-indigo-950 rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-center gap-2 mb-1 text-rose-200 text-xs font-bold uppercase tracking-wider">
              <Gift className="w-4 h-4 text-rose-300" />
              <span>Chức năng 3 • Sổ tay QHKH</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              THEO DÕI & CHĂM SÓC KHÁCH HÀNG
            </h2>
            <p className="text-xs sm:text-sm text-rose-100/90 mt-1 max-w-2xl">
              Chọn nội dung cần xem bên dưới để mở giao diện chi tiết, tra cứu khách hàng, lịch sử gặp gỡ và nhiệm vụ chăm sóc.
            </p>
          </div>

          {/* 6 Category Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* 1. 🔎 Tìm khách hàng */}
            <button
              id="care-menu-btn-search"
              onClick={() => setActiveSection('search')}
              className="group p-4 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-400 rounded-2xl text-left shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                  <Search className="w-6 h-6 text-blue-700" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  {customers.length} KH
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-800 transition-colors">
                  🔎 Tìm khách hàng
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tra cứu theo Tên, SĐT, Ngành nghề; lọc Tiếp thị, QHTD, VIP, Chế độ chăm sóc.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
                <span>Mở tìm kiếm</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 2. 🔔 Khách hàng cần chăm sóc */}
            <button
              id="care-menu-btn-need-care"
              onClick={() => setActiveSection('need_care')}
              className="group p-4 bg-white hover:bg-rose-50/50 border border-slate-200 hover:border-rose-400 rounded-2xl text-left shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                  <BellRing className="w-6 h-6 text-rose-700" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 animate-pulse">
                  {birthdayUpcoming.length + overdueMeetingCustomers.length} cần chú ý
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-rose-800 transition-colors">
                  🔔 Khách hàng cần chăm sóc
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sắp đến sinh nhật (15–30 ngày), sự kiện tri ân hoặc đã lâu chưa gặp (&gt;30 ngày).
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-700">
                <span>Xem danh sách</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 3. 📅 Lịch chăm sóc */}
            <button
              id="care-menu-btn-schedule"
              onClick={() => setActiveSection('schedule')}
              className="group p-4 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 rounded-2xl text-left shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-emerald-700" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {careEvents.length} Sự kiện
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors">
                  📅 Lịch chăm sóc
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Lịch tri ân Sinh nhật, 8/3, 20/10, Tết; kiểm tra và gửi email nhắc việc tự động.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>Quản lý lịch</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 4. 📖 Lịch sử gặp khách hàng */}
            <button
              id="care-menu-btn-meetings"
              onClick={() => setActiveSection('meetings')}
              className="group p-4 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-400 rounded-2xl text-left shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                  <Handshake className="w-6 h-6 text-indigo-700" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  {meetings.length} Cuộc gặp
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-800 transition-colors">
                  📖 Lịch sử gặp khách hàng
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Xem toàn bộ nhật ký tiếp xúc khách hàng, nội dung trao đổi, nhu cầu và tọa độ GPS.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700">
                <span>Xem lịch sử</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 5. 📌 Việc cần thực hiện */}
            <button
              id="care-menu-btn-tasks"
              onClick={() => setActiveSection('tasks')}
              className="group p-4 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-400 rounded-2xl text-left shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                  <CheckSquare className="w-6 h-6 text-amber-700" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {tasks.filter(t => t.trangThai !== 'Hoàn thành').length} Chưa xong
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-800 transition-colors">
                  📌 Việc cần thực hiện
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Theo dõi danh sách công việc, hạn hoàn thành và đánh dấu đã xong chỉ với một chạm.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                <span>Xem việc cần làm</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 6. ⭐ VIP & Siêu VIP */}
            <button
              id="care-menu-btn-vip"
              onClick={() => setActiveSection('vip')}
              className="group p-4 bg-white hover:bg-purple-50/50 border border-slate-200 hover:border-purple-400 rounded-2xl text-left shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                  <Star className="w-6 h-6 text-purple-700" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                  {vipCustomers.length} VIP
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-purple-800 transition-colors">
                  ⭐ VIP & Siêu VIP
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Chăm sóc đặc biệt các khách hàng VIP & Siêu VIP, đối tác trọng yếu của chi nhánh.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
                <span>Xem danh sách VIP</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 11. SUB-VIEW: 🔎 TÌM KHÁCH HÀNG (Mục 11)              */}
      {/* ---------------------------------------------------- */}
      {activeSection === 'search' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-700" />
              <span>Tìm kiếm & Bộ lọc khách hàng</span>
            </h3>

            {/* Input tìm kiếm */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="care-search-input"
                type="text"
                placeholder="Tìm theo: Họ tên, Số điện thoại, Ngành nghề..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-bold">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                  filterType === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Tất cả ({customers.length})
              </button>
              <button
                onClick={() => setFilterType('tiep_thi')}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                  filterType === 'tiep_thi' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Đang tiếp thị
              </button>
              <button
                onClick={() => setFilterType('qhtd')}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                  filterType === 'qhtd' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Đã có QHTD
              </button>
              <button
                onClick={() => setFilterType('vip')}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                  filterType === 'vip' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                VIP
              </button>
              <button
                onClick={() => setFilterType('sieu_vip')}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                  filterType === 'sieu_vip' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Siêu VIP
              </button>
              <button
                onClick={() => setFilterType('care_on')}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                  filterType === 'care_on' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Chăm sóc: Bật
              </button>
              <button
                onClick={() => setFilterType('care_off')}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                  filterType === 'care_off' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Chăm sóc: Tắt
              </button>
            </div>
          </div>

          {/* Customer Cards list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
              <span>KẾT QUẢ TÌM KIẾM ({searchFilteredCustomers.length})</span>
            </div>

            {searchFilteredCustomers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-dashed border-slate-200">
                <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">Không tìm thấy khách hàng phù hợp</p>
                <p className="text-xs mt-1">Thử thay đổi từ khóa hoặc điều kiện lọc</p>
              </div>
            ) : (
              searchFilteredCustomers.map((customer, cIdx) => {
                const lastMeeting = lastMeetingMap.get(customer.idKh);
                return (
                  <div
                    key={`care-cust-${customer.idKh || customer.sdt}-${cIdx}`}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-blue-300 transition-all space-y-3"
                  >
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-slate-900 text-base">
                            {customer.hoTen}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                            customer.phanLoai.includes('Siêu VIP')
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : customer.phanLoai.includes('VIP')
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : customer.phanLoai.includes('quan hệ tín dụng')
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}>
                            {customer.phanLoai}
                          </span>
                        </div>
                        {customer.tenCongTy && (
                          <p className="text-xs font-bold text-indigo-900 mt-0.5">
                            {customer.tenCongTy} {customer.chucVu ? `• ${customer.chucVu}` : ''}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-0.5">
                          SĐT: <strong className="text-blue-900 font-bold font-mono">{normalizePhone(customer.sdt) || customer.sdt}</strong> • Ngành: {customer.nganhNghe || 'Chưa cập nhật'}
                        </p>
                      </div>

                      {/* Care Mode Toggle */}
                      <button
                        type="button"
                        onClick={() => onToggleCustomerCare(customer.idKh, customer.cheDoChamSoc === 'Bật' ? 'Tắt' : 'Bật')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors ${
                          customer.cheDoChamSoc === 'Bật'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {customer.cheDoChamSoc === 'Bật' ? '🟢 Chăm sóc: Bật' : '⚪ Chăm sóc: Tắt'}
                      </button>
                    </div>

                    {/* Last meeting date */}
                    <div className="text-xs bg-slate-50 p-2.5 rounded-xl flex items-center justify-between text-slate-600">
                      <span>Lần gặp gần nhất:</span>
                      <strong className="text-slate-900">
                        {lastMeeting ? `${lastMeeting.date} (${lastMeeting.daysAgo} ngày trước)` : 'Chưa có cuộc gặp'}
                      </strong>
                    </div>

                    {/* 4 Standard Action Buttons (Mục 11) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onSelectCustomer(customer)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-blue-700" />
                        <span>Xem hồ sơ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenNewMeeting(customer.idKh)}
                        className="px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Handshake className="w-3.5 h-3.5" />
                        <span>Ghi cuộc gặp</span>
                      </button>

                      <a
                        href={`tel:${normalizePhone(customer.sdt) || customer.sdt}`}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Gọi điện</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => onOpenMap ? onOpenMap(customer) : null}
                        className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-teal-700" />
                        <span>Bản đồ</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 13. SUB-VIEW: 🔔 KHÁCH HÀNG CẦN CHĂM SÓC (Mục 13)    */}
      {/* ---------------------------------------------------- */}
      {activeSection === 'need_care' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-gradient-to-r from-rose-800 to-rose-950 rounded-2xl p-4 text-white shadow-md">
            <h3 className="text-lg font-black flex items-center gap-2">
              <BellRing className="w-5 h-5 text-rose-300" />
              <span>Khách hàng cần chăm sóc</span>
            </h3>
            <p className="text-xs text-rose-100/90 mt-0.5">
              Tổng hợp khách hàng sắp đến sinh nhật (15–30 ngày), sự kiện tri ân hoặc đã lâu chưa gặp (&gt;30 ngày).
            </p>

            {/* Sub-filter tabs */}
            <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar text-xs font-bold">
              <button
                onClick={() => setNeedCareFilter('all')}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                  needCareFilter === 'all' ? 'bg-white text-rose-900 shadow-xs' : 'bg-rose-900/60 text-white'
                }`}
              >
                Tất cả ({birthdayUpcoming.length + overdueMeetingCustomers.length})
              </button>
              <button
                onClick={() => setNeedCareFilter('birthday')}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                  needCareFilter === 'birthday' ? 'bg-white text-rose-900 shadow-xs' : 'bg-rose-900/60 text-white'
                }`}
              >
                🎂 Sắp sinh nhật ({birthdayUpcoming.length})
              </button>
              <button
                onClick={() => setNeedCareFilter('overdue_meeting')}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                  needCareFilter === 'overdue_meeting' ? 'bg-white text-rose-900 shadow-xs' : 'bg-rose-900/60 text-white'
                }`}
              >
                ⏳ &gt;30 ngày chưa gặp ({overdueMeetingCustomers.length})
              </button>
            </div>
          </div>

          {/* List 1: Sắp đến sinh nhật (trong vòng 15-30 ngày) */}
          {(needCareFilter === 'all' || needCareFilter === 'birthday') && (
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 px-1">
                <Gift className="w-4 h-4 text-rose-600" />
                <span>Khách hàng sắp đến sinh nhật (trong 30 ngày tới: {birthdayUpcoming.length})</span>
              </h4>

              {birthdayUpcoming.length === 0 ? (
                <div className="bg-white rounded-xl p-5 text-center text-xs text-slate-400 border border-slate-200">
                  Không có khách hàng nào có sinh nhật trong 30 ngày tới.
                </div>
              ) : (
                birthdayUpcoming.map(({ customer, daysRemaining, dateStr }, bIdx) => (
                  <div
                    key={`bday-${customer.idKh || customer.sdt}-${bIdx}`}
                    className="bg-white rounded-2xl p-4 border border-rose-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{customer.hoTen}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                          {daysRemaining === 0 ? 'HÔM NAY' : `Còn ${daysRemaining} ngày`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Ngày sinh: <strong className="text-slate-800">{dateStr}</strong> • SĐT: <span className="font-mono font-bold text-slate-800">{normalizePhone(customer.sdt) || customer.sdt}</span> • Cán bộ: {customer.canBoPhuTrach}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${normalizePhone(customer.sdt) || customer.sdt}`}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Gọi chúc mừng</span>
                      </a>
                      <button
                        onClick={() => onOpenNewMeeting(customer.idKh)}
                        className="px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1"
                      >
                        <Handshake className="w-3.5 h-3.5" />
                        <span>Ghi cuộc gặp</span>
                      </button>
                      <button
                        onClick={() => onSelectCustomer(customer)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                      >
                        Hồ sơ
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* List 2: Đã lâu chưa gặp (>30 ngày) */}
          {(needCareFilter === 'all' || needCareFilter === 'overdue_meeting') && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 px-1">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Khách hàng đã lâu chưa gặp (&gt; 30 ngày: {overdueMeetingCustomers.length})</span>
              </h4>

              {overdueMeetingCustomers.length === 0 ? (
                <div className="bg-white rounded-xl p-5 text-center text-xs text-slate-400 border border-slate-200">
                  Tất cả khách hàng đều được gặp gỡ trong vòng 30 ngày qua.
                </div>
              ) : (
                overdueMeetingCustomers.slice(0, 20).map((customer, oIdx) => {
                  const last = lastMeetingMap.get(customer.idKh);
                  return (
                    <div
                      key={`overdue-${customer.idKh || customer.sdt}-${oIdx}`}
                      className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{customer.hoTen}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                            {last ? `${last.daysAgo} ngày chưa gặp` : 'Chưa từng gặp'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          SĐT: <span className="font-mono font-bold text-slate-800">{normalizePhone(customer.sdt) || customer.sdt}</span> • Phân loại: {customer.phanLoai} • Cán bộ: {customer.canBoPhuTrach}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onOpenNewMeeting(customer.idKh)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
                        >
                          <Handshake className="w-3.5 h-3.5" />
                          <span>Lên lịch gặp ngay</span>
                        </button>
                        <a
                          href={`tel:${normalizePhone(customer.sdt) || customer.sdt}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Gọi</span>
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. SUB-VIEW: 📅 LỊCH CHĂM SÓC & SỰ KIỆN               */}
      {/* ---------------------------------------------------- */}
      {activeSection === 'schedule' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-700" />
                  <span>Sự kiện chăm sóc định kỳ & Cấu hình</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Các ngày lễ, sự kiện văn hóa và sinh nhật khách hàng được hệ thống tự động quét mỗi sáng.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="schedule-btn-manual-check"
                  onClick={handleRunManualCheck}
                  disabled={isRunningCheck}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isRunningCheck ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Kiểm tra & Gửi nhắc việc ngay</span>
                </button>

                <button
                  onClick={() => setShowAddEventModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm sự kiện</span>
                </button>
              </div>
            </div>

            {checkResult && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{checkResult.message}</p>
                  {checkResult.details && (
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Tổng quét: {checkResult.details.totalChecked || 0} KH | Đã gửi: {checkResult.details.sent || 0} email | Bỏ qua trùng lặp: {checkResult.details.skipped || 0}.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* List of care events */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {careEvents.map(ev => (
                <div key={ev.idSuKien} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm">{ev.tenSuKien}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {ev.loai}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center justify-between">
                    <span>Ngày: <strong>{ev.ngay}</strong></span>
                    <span>Nhắc trước: <strong>{ev.soNgayNhacTruoc || 3} ngày</strong></span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-bold">● Đang hoạt động</span>
                    <button
                      onClick={() => onDeleteCareEvent(ev.idSuKien)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                      title="Xóa sự kiện"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email logs table */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
              Nhật ký email nhắc việc gần nhất ({emailLogs.length})
            </h4>
            {emailLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">Chưa có nhật ký gửi email nào.</p>
            ) : (
              <div className="space-y-2">
                {emailLogs.slice(0, 10).map((log, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 text-xs flex items-center justify-between gap-2">
                    <div>
                      <strong className="text-slate-900">{log.tenKh}</strong>
                      <span className="text-slate-500"> • {log.loaiSuKien}</span>
                      <span className="text-slate-400 block text-[11px] mt-0.5">Gửi tới: {log.emailNhan}</span>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {log.trangThai}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">{log.thoiGianGui?.slice(0, 10)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. SUB-VIEW: 📖 LỊCH SỬ GẶP KHÁCH HÀNG (Mục 10)       */}
      {/* ---------------------------------------------------- */}
      {activeSection === 'meetings' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-indigo-700" />
                  <span>Lịch sử tiếp xúc & Gặp gỡ ({meetings.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toàn bộ biên bản ghi nhận cuộc gặp của cán bộ QHKH với khách hàng.
                </p>
              </div>

              <button
                id="history-btn-new-meeting"
                onClick={() => onOpenNewMeeting()}
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Ghi nhận cuộc gặp mới</span>
              </button>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <input
                type="text"
                placeholder="Tìm theo tên khách hàng hoặc cán bộ..."
                value={meetingSearch}
                onChange={(e) => setMeetingSearch(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <select
                value={meetingTypeFilter}
                onChange={(e) => setMeetingTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
              >
                <option value="all">Tất cả hình thức</option>
                <option value="Trực tiếp">Trực tiếp</option>
                <option value="Điện thoại">Điện thoại / Zalo</option>
                <option value="Tại quầy">Tại quầy giao dịch</option>
              </select>
            </div>
          </div>

          {/* Timeline of meetings */}
          <div className="space-y-3">
            {meetings
              .filter(m => {
                const matchSearch = !meetingSearch || 
                  m.tenKh.toLowerCase().includes(meetingSearch.toLowerCase()) ||
                  (m.canBoThucHien && m.canBoThucHien.toLowerCase().includes(meetingSearch.toLowerCase()));
                const matchType = meetingTypeFilter === 'all' || m.hinhThucGap?.includes(meetingTypeFilter);
                return matchSearch && matchType;
              })
              .map(m => (
                <div key={m.idLichSu} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <span>{m.tenKh}</span>
                        <span className="font-mono text-xs text-slate-400 font-normal">[{m.idKh}]</span>
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-blue-900 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          {m.thoiGianGap}
                        </span>
                        <span>• Cán bộ: <strong>{m.canBoThucHien}</strong></span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      {m.hinhThucGap}
                    </span>
                  </div>

                  {m.noiDungTraoDoi && (
                    <div className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-xl">
                      <strong>Nội dung:</strong> {m.noiDungTraoDoi}
                    </div>
                  )}

                  {m.nhuCauKhachHang && (
                    <div className="text-xs text-blue-900 bg-blue-50/70 p-2.5 rounded-xl">
                      <strong>Nhu cầu ghi nhận:</strong> {m.nhuCauKhachHang}
                    </div>
                  )}

                  {m.congViecTiepTheo && (
                    <div className="text-xs text-amber-900 bg-amber-50/70 p-2.5 rounded-xl flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span><strong>Việc tiếp theo:</strong> {m.congViecTiepTheo}</span>
                    </div>
                  )}

                  {m.googleMapUrl && (
                    <div className="pt-1">
                      <a
                        href={m.googleMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Xem vị trí gặp gỡ trên Google Maps ↗</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 14. SUB-VIEW: 📌 VIỆC CẦN THỰC HIỆN (Mục 14)          */}
      {/* ---------------------------------------------------- */}
      {activeSection === 'tasks' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-amber-600" />
                  <span>Danh sách việc cần thực hiện</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhiệm vụ theo dõi, hoàn thiện hồ sơ và cam kết với khách hàng.
                </p>
              </div>

              {onAddNewTask && (
                <button
                  id="tasks-btn-create-new"
                  onClick={() => onAddNewTask()}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm công việc mới</span>
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-xs font-bold">
              <button
                onClick={() => setTaskFilter('all')}
                className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                  taskFilter === 'all' ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Tất cả ({tasks.length})
              </button>
              <button
                onClick={() => setTaskFilter('pending')}
                className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                  taskFilter === 'pending' ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Chưa xong ({tasks.filter(t => t.trangThai !== 'Hoàn thành').length})
              </button>
              <button
                onClick={() => setTaskFilter('completed')}
                className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                  taskFilter === 'completed' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Đã xong ({tasks.filter(t => t.trangThai === 'Hoàn thành').length})
              </button>
              <button
                onClick={() => setTaskFilter('overdue')}
                className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                  taskFilter === 'overdue' ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Quá hạn ({tasks.filter(t => t.trangThai === 'Quá hạn').length})
              </button>
            </div>
          </div>

          {/* Task list */}
          <div className="space-y-2.5">
            {tasks
              .filter(t => {
                if (taskFilter === 'pending') return t.trangThai !== 'Hoàn thành';
                if (taskFilter === 'completed') return t.trangThai === 'Hoàn thành';
                if (taskFilter === 'overdue') return t.trangThai === 'Quá hạn';
                return true;
              })
              .map(t => {
                const customer = customers.find(c => c.idKh === t.idKh);
                const isCompleted = t.trangThai === 'Hoàn thành';
                return (
                  <div
                    key={t.idCongViec}
                    className={`bg-white rounded-2xl p-4 border transition-all flex items-start justify-between gap-3 ${
                      isCompleted ? 'border-slate-200 bg-slate-50/60 opacity-70' : 'border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Checkbox button */}
                      <button
                        id={`task-toggle-${t.idCongViec}`}
                        type="button"
                        onClick={() => onUpdateTaskStatus && onUpdateTaskStatus(t.idCongViec, isCompleted ? 'Chưa thực hiện' : 'Hoàn thành')}
                        className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-blue-600 bg-white'
                        }`}
                      >
                        {isCompleted && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="min-w-0">
                        <p className={`text-xs sm:text-sm font-bold text-slate-900 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                          {t.noiDung}
                        </p>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                          {customer && (
                            <span className="text-blue-900 font-bold">
                              KH: {customer.hoTen}
                            </span>
                          )}
                          <span>Hạn: <strong className="text-slate-800">{t.ngayHan || 'Không có'}</strong></span>
                          <span>• Cán bộ: {t.canBo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.trangThai === 'Quá hạn'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.trangThai}
                      </span>
                      {customer && (
                        <button
                          onClick={() => onSelectCustomer(customer)}
                          className="text-xs text-blue-700 hover:underline font-bold"
                        >
                          Hồ sơ
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. SUB-VIEW: ⭐ VIP & SIÊU VIP (Mục 10)               */}
      {/* ---------------------------------------------------- */}
      {activeSection === 'vip' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-purple-200 mb-1">
                  <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> Phân khúc cao cấp
                </span>
                <h3 className="text-xl font-black">
                  DANH SÁCH KHÁCH HÀNG VIP & SIÊU VIP
                </h3>
                <p className="text-xs text-purple-200/90 mt-0.5">
                  Chế độ chăm sóc ưu tiên cao cấp nhất theo quy chế tiếp thị quan hệ khách hàng.
                </p>
              </div>

              <span className="text-2xl sm:text-3xl font-black text-amber-300 bg-white/10 px-4 py-2 rounded-2xl border border-white/20">
                {vipCustomers.length} KH
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {vipCustomers.map((customer, vIdx) => {
              const lastMeeting = lastMeetingMap.get(customer.idKh);
              return (
                <div
                  key={`vip-${customer.idKh || customer.sdt}-${vIdx}`}
                  className="bg-white rounded-2xl p-4 border border-purple-200 shadow-2xs hover:border-purple-400 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 text-base">
                          {customer.hoTen}
                        </h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                          customer.phanLoai.includes('Siêu VIP')
                            ? 'bg-purple-700 text-white'
                            : 'bg-amber-500 text-slate-950'
                        }`}>
                          ⭐ {customer.phanLoai}
                        </span>
                      </div>
                      {customer.tenCongTy && (
                        <p className="text-xs font-bold text-indigo-900 mt-0.5">
                          {customer.tenCongTy} {customer.chucVu ? `• ${customer.chucVu}` : ''}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-0.5">
                        SĐT: <strong className="text-blue-900 font-bold font-mono">{normalizePhone(customer.sdt) || customer.sdt}</strong> • Ngành: {customer.nganhNghe || 'N/A'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleCustomerCare(customer.idKh, customer.cheDoChamSoc === 'Bật' ? 'Tắt' : 'Bật')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors ${
                        customer.cheDoChamSoc === 'Bật' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {customer.cheDoChamSoc === 'Bật' ? '🟢 Chăm sóc: Bật' : '⚪ Tắt'}
                    </button>
                  </div>

                  {customer.nhuCau && (
                    <div className="text-xs text-blue-900 bg-blue-50/70 p-2.5 rounded-xl">
                      <strong>Nhu cầu VIP:</strong> {customer.nhuCau}
                    </div>
                  )}

                  <div className="text-xs bg-slate-50 p-2.5 rounded-xl flex items-center justify-between text-slate-600">
                    <span>Lần gặp gần nhất:</span>
                    <strong className="text-slate-900">
                      {lastMeeting ? `${lastMeeting.date} (${lastMeeting.daysAgo} ngày trước)` : 'Chưa có cuộc gặp'}
                    </strong>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectCustomer(customer)}
                      className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-purple-200"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Xem hồ sơ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenNewMeeting(customer.idKh)}
                      className="px-3 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Handshake className="w-3.5 h-3.5" />
                      <span>Ghi cuộc gặp</span>
                    </button>

                    <a
                      href={`tel:${normalizePhone(customer.sdt) || customer.sdt}`}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Gọi điện</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onOpenMap ? onOpenMap(customer) : null}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-teal-700" />
                      <span>Bản đồ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add New Care Event */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl border border-slate-200">
            <h4 className="font-black text-slate-900 text-base">Thêm sự kiện chăm sóc mới</h4>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên sự kiện</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ngày Nhà giáo Việt Nam 20/11"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ngày (DD/MM)</label>
                  <input
                    type="text"
                    placeholder="20/11"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Loại sự kiện</label>
                  <select
                    value={eventType}
                    onChange={(e: any) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="NgayLe">Ngày Lễ</option>
                    <option value="Tet">Tết</option>
                    <option value="SinhNhat">Sinh nhật</option>
                    <option value="DacBiet">Đặc biệt</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Số ngày nhắc trước</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={daysBefore}
                  onChange={(e) => setDaysBefore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  Lưu sự kiện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
