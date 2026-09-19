import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Phone, 
  UserCheck, 
  Handshake, 
  MapPin, 
  Calendar, 
  BellRing, 
  Building, 
  Building2,
  User,
  UserPlus, 
  Check, 
  Clock, 
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Briefcase,
  Users,
  Award,
  Sparkles,
  Info
} from 'lucide-react';
import { Customer, MeetingHistory, Task, CustomerTier, CareMode, AppUser } from '../types';
import { normalizePhone, formatPhoneDisplay } from '../services/phoneUtils';

interface CustomerListViewProps {
  customers: Customer[];
  meetings: MeetingHistory[];
  tasks: Task[];
  onSelectCustomer: (customer: Customer) => void;
  onOpenNewMeeting: (customerId: string) => void;
  onOpenQuickActivity?: (customerId: string) => void;
  onOpenNewCustomer: () => void;
  onToggleCareMode: (customerId: string, newMode: CareMode) => void;
  onOpenMap: (customer: Customer) => void;
  currentUser?: AppUser | null;
  users?: AppUser[];
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({
  customers,
  meetings,
  tasks,
  onSelectCustomer,
  onOpenNewMeeting,
  onOpenQuickActivity,
  onOpenNewCustomer,
  onToggleCareMode,
  onOpenMap,
  currentUser,
  users = []
}) => {
  const isLeader = currentUser?.isLeader || currentUser?.role === 'LANH_DAO';
  const isAdmin = currentUser?.role === 'ADMIN';
  const userDept = currentUser?.phongBan || '';
  const isDeptLeader = isLeader && userDept && userDept !== 'Ban Giám đốc';

  // State: Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | 'Cá nhân' | 'Tổ chức'>('ALL');
  
  // Scope: 'DEPARTMENT' (default for dept leaders), 'MINE', or 'ALL' (for admin or general)
  const [scope, setScope] = useState<'DEPARTMENT' | 'MINE' | 'ALL'>(() => {
    if (isDeptLeader) return 'DEPARTMENT';
    return 'ALL';
  });

  // Selected specific officer username (for filtering)
  const [selectedOfficerUser, setSelectedOfficerUser] = useState<string>('ALL');

  // Map meeting and task info for fast lookup
  const latestMeetingsByCustomer = useMemo(() => {
    const map: Record<string, MeetingHistory> = {};
    meetings.forEach((m) => {
      if (!map[m.idKh] || new Date(m.thoiGianGap) > new Date(map[m.idKh].thoiGianGap)) {
        map[m.idKh] = m;
      }
    });
    return map;
  }, [meetings]);

  const tasksByCustomer = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (!map[t.idKh]) map[t.idKh] = [];
      map[t.idKh].push(t);
    });
    return map;
  }, [tasks]);

  // Department users and usernames set
  const deptUsers = useMemo(() => {
    if (!userDept) return [];
    return users.filter(u => u.phongBan === userDept);
  }, [users, userDept]);

  const deptUserUsernames = useMemo(() => {
    return new Set(deptUsers.map(u => u.user.toLowerCase()));
  }, [deptUsers]);

  // Filtering logic with Department RBAC
  const filteredCustomers = useMemo(() => {
    const list = customers.filter((cust) => {
      // 1. Scope filter (Department vs Mine vs All)
      if (scope === 'MINE' && currentUser) {
        const isMine = (cust.userCanBo || '').toLowerCase() === currentUser.user.toLowerCase() ||
                       (cust.userKhoiTao || '').toLowerCase() === currentUser.user.toLowerCase();
        if (!isMine) return false;
      } else if (scope === 'DEPARTMENT' && userDept) {
        // Customer belongs to this department if:
        // - phongBanKhoiTao matches userDept
        // - OR userKhoiTao belongs to userDept
        // - OR userCanBo belongs to userDept
        const createdInDept = (cust.phongBanKhoiTao || '').toLowerCase() === userDept.toLowerCase();
        const creatorInDept = deptUserUsernames.has((cust.userKhoiTao || '').toLowerCase());
        const managerInDept = deptUserUsernames.has((cust.userCanBo || '').toLowerCase());
        if (!createdInDept && !creatorInDept && !managerInDept) return false;
      }

      // 2. Specific Officer filter
      if (selectedOfficerUser !== 'ALL') {
        const matchesOfficer = (cust.userCanBo || '').toLowerCase() === selectedOfficerUser.toLowerCase() ||
                               (cust.userKhoiTao || '').toLowerCase() === selectedOfficerUser.toLowerCase();
        if (!matchesOfficer) return false;
      }

      // 3. Text Search (Name, Phone, ID, Industry, Demand, Officer, Creator, Company, Position)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesId = (cust.idKh || '').toLowerCase().includes(q);
        const matchesName = (cust.hoTen || '').toLowerCase().includes(q);
        const matchesPhone = (cust.sdt || '').toLowerCase().includes(q);
        const matchesIndustry = (cust.nganhNghe || '').toLowerCase().includes(q);
        const matchesDemand = (cust.nhuCau || '').toLowerCase().includes(q);
        const matchesOfficer = (cust.canBoPhuTrach || '').toLowerCase().includes(q);
        const matchesUser = (cust.userCanBo || '').toLowerCase().includes(q);
        const matchesCreator = (cust.nguoiKhoiTao || '').toLowerCase().includes(q) || (cust.userKhoiTao || '').toLowerCase().includes(q);
        const matchesDept = (cust.phongBanKhoiTao || '').toLowerCase().includes(q);
        const matchesTier = (cust.phanLoai || '').toLowerCase().includes(q);
        const matchesCompany = (cust.tenCongTy || '').toLowerCase().includes(q);
        const matchesPosition = (cust.chucVu || '').toLowerCase().includes(q);

        if (!matchesId && !matchesName && !matchesPhone && !matchesIndustry && !matchesDemand && !matchesOfficer && !matchesUser && !matchesCreator && !matchesDept && !matchesTier && !matchesCompany && !matchesPosition) {
          return false;
        }
      }

      // 4. Customer Type Filter (Cá nhân vs Tổ chức)
      if (selectedTypeFilter !== 'ALL') {
        const currentType = cust.loaiKhachHang || 'Cá nhân';
        if (currentType !== selectedTypeFilter) return false;
      }

      // 5. Care & Task status filter
      if (selectedFilter === 'CARE_ON' && cust.cheDoChamSoc !== 'Bật') return false;
      if (selectedFilter === 'CARE_OFF' && cust.cheDoChamSoc !== 'Tắt') return false;
      
      if (selectedFilter === 'HAS_TASKS') {
        const custTasks = tasksByCustomer[cust.idKh] || [];
        const hasPending = custTasks.some(t => t.trangThai === 'Chưa thực hiện' || t.trangThai === 'Đang thực hiện');
        if (!hasPending) return false;
      }

      if (selectedFilter === 'OVERDUE') {
        const custTasks = tasksByCustomer[cust.idKh] || [];
        const now = new Date();
        const hasOverdue = custTasks.some(t => {
          if (t.trangThai === 'Hoàn thành' || !t.ngayHan) return false;
          return new Date(t.ngayHan) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
        });
        if (!hasOverdue) return false;
      }

      // 6. Tier Filter
      if (selectedTier !== 'ALL' && cust.phanLoai !== selectedTier) {
        return false;
      }

      return true;
    });

    // Deduplicate to guarantee absolute uniqueness
    const seen = new Set<string>();
    const unique: Customer[] = [];
    for (const cust of list) {
      const key = (cust.idKh || cust.sdt || '').trim();
      if (!key) continue;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(cust);
      }
    }
    return unique;
  }, [customers, scope, selectedOfficerUser, searchTerm, selectedFilter, selectedTier, selectedTypeFilter, currentUser, userDept, deptUserUsernames, tasksByCustomer]);

  // Counts for scope buttons
  const myCustomersCount = useMemo(() => {
    if (!currentUser) return 0;
    const cur = currentUser.user.toLowerCase();
    return customers.filter(c => (c.userCanBo || '').toLowerCase() === cur || (c.userKhoiTao || '').toLowerCase() === cur).length;
  }, [customers, currentUser]);

  const deptCustomersCount = useMemo(() => {
    if (!userDept) return 0;
    return customers.filter(c => {
      return (c.phongBanKhoiTao || '').toLowerCase() === userDept.toLowerCase() ||
             deptUserUsernames.has((c.userKhoiTao || '').toLowerCase()) ||
             deptUserUsernames.has((c.userCanBo || '').toLowerCase());
    }).length;
  }, [customers, userDept, deptUserUsernames]);

  return (
    <div className="space-y-3.5 pb-24 md:pb-8">
      {/* Header & New Customer Button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            SỔ TAY KHÁCH HÀNG
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {filteredCustomers.length}/{customers.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            {isDeptLeader 
              ? `Chế độ Lãnh đạo: Theo dõi khách hàng do cán bộ ${userDept} khởi tạo & quản lý`
              : 'Danh bạ hồ sơ và lịch sử tiếp xúc thực địa'}
          </p>
        </div>

        <button
          id="customer-list-btn-add-customer"
          onClick={onOpenNewCustomer}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-700/20 active:scale-98 transition-all shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Thêm khách hàng</span>
        </button>
      </div>

      {/* Department Leader Informational Banner */}
      {isDeptLeader && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15 text-amber-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs tracking-wide uppercase text-amber-300">
                  Vai trò: Lãnh đạo {userDept}
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-white/20 font-mono">
                  {deptUsers.length} cán bộ
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Bạn có toàn quyền xem và đồng hành chăm sóc toàn bộ khách hàng do cán bộ trong phòng khởi tạo.
              </p>
            </div>
          </div>
          
          <div className="hidden sm:block text-right shrink-0">
            <span className="text-xs text-blue-200 block">Tổng KH của phòng</span>
            <span className="font-extrabold text-lg text-white">{deptCustomersCount}</span>
          </div>
        </div>
      )}

      {/* Scope Switch Bar (Phòng ban vs Của tôi vs Tất cả) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white rounded-2xl border border-slate-200 text-xs shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 font-bold text-[11px] uppercase mr-1">
            Phạm vi xem:
          </span>

          {/* Department button (especially highlighted for leaders) */}
          {userDept && (
            <button
              id="scope-btn-department"
              onClick={() => {
                setScope('DEPARTMENT');
                setSelectedOfficerUser('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                scope === 'DEPARTMENT'
                  ? 'bg-blue-800 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>{isDeptLeader ? `Phòng ${userDept}` : `Cùng phòng (${userDept})`}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                scope === 'DEPARTMENT' ? 'bg-white/25 text-white' : 'bg-blue-200 text-blue-900'
              }`}>
                {deptCustomersCount}
              </span>
            </button>
          )}

          {/* Mine button */}
          {currentUser && (
            <button
              id="scope-btn-mine"
              onClick={() => {
                setScope('MINE');
                setSelectedOfficerUser('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                scope === 'MINE'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Của tôi (@{currentUser.user})</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                scope === 'MINE' ? 'bg-white/25 text-white' : 'bg-emerald-200 text-emerald-900'
              }`}>
                {myCustomersCount}
              </span>
            </button>
          )}

          {/* All button (Available for Admin or all) */}
          <button
            id="scope-btn-all"
            onClick={() => {
              setScope('ALL');
              setSelectedOfficerUser('ALL');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              scope === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả chi nhánh ({customers.length})
          </button>
        </div>

        {/* Dropdown for selecting specific officer in current scope */}
        {users.length > 0 && (
          <div className="flex items-center gap-1.5 ml-auto">
            <label className="text-[11px] text-slate-500 hidden sm:inline font-semibold">
              {scope === 'DEPARTMENT' ? 'Lọc cán bộ trong phòng:' : 'Lọc theo cán bộ:'}
            </label>
            <select
              id="customer-list-select-officer"
              value={selectedOfficerUser}
              onChange={(e) => setSelectedOfficerUser(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">
                {scope === 'DEPARTMENT' ? `-- Toàn bộ cán bộ ${userDept} --` : `-- Tất cả cán bộ (${users.length}) --`}
              </option>
              {(scope === 'DEPARTMENT' && deptUsers.length > 0 ? deptUsers : users).map((u, uIdx) => (
                <option key={`officer-${u.user}-${uIdx}`} value={u.user}>
                  {u.hoTen} (@{u.user}) - {u.viTri} {u.isLeader ? '★ Lãnh đạo' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          id="customer-list-search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm theo Tên KH, Số điện thoại (ID), Ngành nghề, Nhu cầu, Cán bộ quản lý hoặc Người khởi tạo..."
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs font-medium"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips & Tier Select */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-400 uppercase">Lọc:</span>
        </div>

        {/* Tier Select */}
        <select
          id="customer-list-select-tier"
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
        >
          <option value="ALL">Tất cả phân loại</option>
          <option value="Khách hàng Siêu VIP">Siêu VIP</option>
          <option value="Khách hàng VIP">VIP</option>
          <option value="Đã có quan hệ tín dụng">Quan hệ tín dụng</option>
          <option value="Đang tiếp thị">Đang tiếp thị</option>
        </select>

        {/* Customer Type Select (Cá nhân vs Tổ chức) */}
        <select
          id="customer-list-select-type"
          value={selectedTypeFilter}
          onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600"
        >
          <option value="ALL">Tất cả đối tượng</option>
          <option value="Cá nhân">👤 Khách hàng Cá nhân</option>
          <option value="Tổ chức">🏢 Khách hàng Tổ chức</option>
        </select>

        {/* Quick Filter Chips */}
        <button
          id="filter-chip-all"
          onClick={() => setSelectedFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            selectedFilter === 'ALL'
              ? 'bg-blue-700 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          Tất cả trạng thái
        </button>

        <button
          id="filter-chip-care-on"
          onClick={() => setSelectedFilter(selectedFilter === 'CARE_ON' ? 'ALL' : 'CARE_ON')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
            selectedFilter === 'CARE_ON'
              ? 'bg-emerald-700 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <BellRing className="w-3 h-3" />
          Đang bật chăm sóc
        </button>

        <button
          id="filter-chip-has-tasks"
          onClick={() => setSelectedFilter(selectedFilter === 'HAS_TASKS' ? 'ALL' : 'HAS_TASKS')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            selectedFilter === 'HAS_TASKS'
              ? 'bg-indigo-700 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          Có việc cần làm
        </button>

        <button
          id="filter-chip-overdue"
          onClick={() => setSelectedFilter(selectedFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            selectedFilter === 'OVERDUE'
              ? 'bg-rose-700 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          Quá hạn
        </button>
      </div>

      {/* Customer Cards List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          <Building className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-sm">Không tìm thấy khách hàng nào</p>
          <p className="text-xs text-slate-400 mt-1">Thử thay đổi phạm vi xem, từ khóa hoặc bộ lọc tìm kiếm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCustomers.map((cust, custIdx) => {
            const lastMeeting = latestMeetingsByCustomer[cust.idKh];
            const custTasks = tasksByCustomer[cust.idKh] || [];
            const activeTasksCount = custTasks.filter(t => t.trangThai !== 'Hoàn thành').length;

            return (
              <div
                key={`cust-${cust.idKh || cust.sdt}-${custIdx}`}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                {/* Card Top: Name, Tier Badge, Care Mode Toggle */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 
                          onClick={() => onSelectCustomer(cust)}
                          className="font-black text-base text-slate-900 hover:text-blue-700 transition-colors cursor-pointer truncate"
                        >
                          {cust.hoTen}
                        </h3>

                        {/* Customer Type Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight flex items-center gap-1 ${
                          cust.loaiKhachHang === 'Tổ chức'
                            ? 'bg-indigo-100 text-indigo-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {cust.loaiKhachHang === 'Tổ chức' ? (
                            <>
                              <Building2 className="w-3 h-3" />
                              <span>Tổ chức</span>
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3" />
                              <span>Cá nhân</span>
                            </>
                          )}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight ${
                          cust.phanLoai === 'Khách hàng Siêu VIP'
                            ? 'bg-purple-100 text-purple-800'
                            : cust.phanLoai === 'Khách hàng VIP'
                            ? 'bg-amber-100 text-amber-800'
                            : cust.phanLoai === 'Đã có quan hệ tín dụng'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}>
                          {cust.phanLoai}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          ID: {cust.idKh}
                        </span>
                      </div>

                      {/* Organization Info (if Tổ chức) */}
                      {cust.loaiKhachHang === 'Tổ chức' && (cust.tenCongTy || cust.chucVu) && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-indigo-900 font-semibold bg-indigo-50/80 px-2 py-0.5 rounded-md flex-wrap">
                          {cust.tenCongTy && (
                            <span className="truncate max-w-[200px]" title={cust.tenCongTy}>
                              🏢 {cust.tenCongTy}
                            </span>
                          )}
                          {cust.chucVu && (
                            <span className="text-[11px] text-indigo-700 font-medium">
                              • {cust.chucVu}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Phone & Industry */}
                      <div className="flex items-center gap-2.5 text-xs text-slate-600 mt-1 flex-wrap">
                        <span className="font-bold text-blue-900 font-mono">
                          📞 {normalizePhone(cust.sdt) || cust.sdt}
                        </span>
                        {cust.nganhNghe && (
                          <span className="text-slate-500 truncate">
                            🏢 {cust.nganhNghe}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Care Mode Quick Toggle */}
                    <button
                      id={`customer-toggle-care-${cust.idKh}`}
                      onClick={() => onToggleCareMode(cust.idKh, cust.cheDoChamSoc === 'Bật' ? 'Tắt' : 'Bật')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                        cust.cheDoChamSoc === 'Bật'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                      title={cust.cheDoChamSoc === 'Bật' ? 'Đang BẬT theo dõi chăm sóc (Bấm để Tắt)' : 'Đang TẮT (Bấm để Bật)'}
                    >
                      <span className={`w-2 h-2 rounded-full ${cust.cheDoChamSoc === 'Bật' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      <span>Chăm sóc: {cust.cheDoChamSoc}</span>
                    </button>
                  </div>

                  {/* Cán bộ quản lý & Người khởi tạo */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] space-y-1">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-slate-600">
                        👔 <strong>Quản lý:</strong> {cust.canBoPhuTrach}
                        {cust.userCanBo && (
                          <span className="font-mono text-[10px] text-blue-700 ml-1 font-semibold">
                            @{cust.userCanBo}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 flex-wrap text-[10.5px] text-purple-900 bg-purple-50/70 px-2 py-1 rounded-lg">
                      <span>
                        🌱 <strong>Khởi tạo:</strong> {cust.nguoiKhoiTao || cust.canBoPhuTrach}
                        {(cust.userKhoiTao || cust.userCanBo) && (
                          <span className="font-mono text-purple-700 ml-1 font-medium">
                            @{cust.userKhoiTao || cust.userCanBo}
                          </span>
                        )}
                        {cust.phongBanKhoiTao && (
                          <span className="text-purple-700 font-semibold"> • {cust.phongBanKhoiTao}</span>
                        )}
                      </span>
                      {cust.ngayTao && (
                        <span className="text-[10px] text-purple-600">
                          {cust.ngayTao.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nhu cầu */}
                  {cust.nhuCau && (
                    <div className="mt-2 p-2 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-slate-700">
                      <span className="font-bold text-blue-900">Nhu cầu: </span>
                      <span className="line-clamp-2">{cust.nhuCau}</span>
                    </div>
                  )}

                  {/* Interaction Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <div>
                      <span className="text-slate-400 block text-[10px]">LẦN GẶP GẦN NHẤT</span>
                      <span className="font-semibold text-slate-700">
                        {lastMeeting ? `${lastMeeting.thoiGianGap.split(' ')[0]} (${lastMeeting.hinhThucGap})` : 'Chưa ghi nhận'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">VIỆC CẦN LÀM</span>
                      <span className={`font-semibold ${activeTasksCount > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                        {activeTasksCount > 0 ? `${activeTasksCount} công việc tồn` : 'Đã hoàn thành'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                  {/* Nút 1: Gọi */}
                  <a
                    id={`customer-card-call-${cust.idKh}`}
                    href={`tel:${normalizePhone(cust.sdt) || cust.sdt}`}
                    className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Gọi</span>
                  </a>

                  {/* Nút 2: Xem hồ sơ */}
                  <button
                    id={`customer-card-view-${cust.idKh}`}
                    onClick={() => onSelectCustomer(cust)}
                    className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Hồ sơ</span>
                  </button>

                  {/* Nút 3: Ghi nhận nhanh (3 chạm) */}
                  <button
                    id={`customer-card-quick-activity-${cust.idKh}`}
                    onClick={() => onOpenQuickActivity ? onOpenQuickActivity(cust.idKh) : onOpenNewMeeting(cust.idKh)}
                    className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    title="Ghi nhận nhanh (3 chạm) hoặc gặp gỡ"
                  >
                    <Handshake className="w-3.5 h-3.5" />
                    <span>Ghi nhận</span>
                  </button>

                  {/* Nút 4: Bản đồ */}
                  <button
                    id={`customer-card-map-${cust.idKh}`}
                    onClick={() => onOpenMap(cust)}
                    className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Bản đồ</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
