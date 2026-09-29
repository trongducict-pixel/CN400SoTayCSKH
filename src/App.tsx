import React, { useState, useEffect, useCallback } from 'react';
import { 
  Customer, 
  MeetingHistory, 
  Task, 
  CareEvent, 
  EmailConfig, 
  EmailLog, 
  SystemHealthStatus, 
  UserRole, 
  CareMode, 
  TaskStatus,
  AppUser,
  CareHistory,
  DemandCategory
} from './types';
import { ApiClient } from './services/api';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { CustomerListView } from './components/CustomerListView';
import { MeetingModal } from './components/MeetingModal';
import { QuickActivityModal } from './components/QuickActivityModal';
import { CustomerDetailModal } from './components/CustomerDetailModal';
import { CustomerFormModal } from './components/CustomerFormModal';
import { CustomerMapModal } from './components/CustomerMapModal';
import { CareManagementView } from './components/CareManagementView';
import { MeetingHistoryView } from './components/MeetingHistoryView';
import { ReportsView } from './components/ReportsView';
import { AdminSystemHealthView } from './components/AdminSystemHealthView';
import { UserManagementView } from './components/UserManagementView';
import { LoginModal } from './components/LoginModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Plus, 
  Loader2, 
  Users, 
  ShieldCheck, 
  Crown,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_MEETINGS, 
  INITIAL_TASKS, 
  INITIAL_CARE_EVENTS, 
  INITIAL_EMAIL_CONFIG, 
  INITIAL_EMAIL_LOGS, 
  INITIAL_SYSTEM_HEALTH,
  INITIAL_CARE_HISTORIES,
  INITIAL_DEMAND_CATEGORIES
} from './services/mockData';
import { INITIAL_USERS } from './services/staffData';
import { normalizePhone } from './services/phoneUtils';
import { perf } from './services/perfLogger';
import { CacheEngine } from './services/cacheEngine';

export default function App() {
  // Authentication & Users State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    return ApiClient.getCurrentUser() || INITIAL_USERS.find(u => u.user === 'ducnt4') || INITIAL_USERS[0];
  });
  const [users, setUsers] = useState<AppUser[]>(() => {
    const cached = CacheEngine.get<AppUser[]>('USERS', INITIAL_USERS);
    return (cached.data || INITIAL_USERS).map(u => ApiClient.sanitizeUser(u));
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);

  // Navigation & Role State
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [tabHistory, setTabHistory] = useState<TabType[]>(['home']);
  const [activeRole, setActiveRole] = useState<UserRole>(currentUser?.role || 'QHKH');
  const [adminSubTab, setAdminSubTab] = useState<'menu' | 'users' | 'system'>('menu');

  const handleNavigateTab = (tab: TabType) => {
    if (tab === activeTab) return;
    if (tab === 'admin' && currentUser?.role !== 'ADMIN') {
      setToastMessage({ text: 'Chức năng Quản trị chỉ dành cho tài khoản Admin', type: 'warning' });
      return;
    }
    setTabHistory(prev => [...prev, tab]);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    // 1. Close open modals first
    if (isQuickActivityOpen) {
      setIsQuickActivityOpen(false);
      return;
    }
    if (isCustomerDetailOpen) {
      setIsCustomerDetailOpen(false);
      return;
    }
    if (isCustomerFormOpen) {
      setIsCustomerFormOpen(false);
      return;
    }
    if (isMeetingModalOpen) {
      setIsMeetingModalOpen(false);
      return;
    }
    if (isMapModalOpen) {
      setIsMapModalOpen(false);
      return;
    }
    if (isTaskModalOpen) {
      setIsTaskModalOpen(false);
      return;
    }
    if (isLoginModalOpen) {
      setIsLoginModalOpen(false);
      return;
    }

    // 2. Navigate back to previous tab
    if (tabHistory.length > 1) {
      const newHist = [...tabHistory];
      newHist.pop();
      const prev = newHist[newHist.length - 1] || 'home';
      setTabHistory(newHist);
      setActiveTab(prev);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (activeTab !== 'home') {
      setActiveTab('home');
      setTabHistory(['home']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getTabTitle = (tab: TabType) => {
    switch (tab) {
      case 'home': return 'Trang chủ';
      case 'customers': return 'Khách hàng';
      case 'meetings': return 'Cuộc gặp';
      case 'care': return 'Theo dõi & Chăm sóc';
      case 'reports': return 'Báo cáo hiệu suất';
      case 'admin': return 'Quản trị hệ thống';
      default: return '';
    }
  };

  // Guard: if non-admin user ever attempts to access admin tab, redirect to home
  useEffect(() => {
    if (activeTab === 'admin' && currentUser?.role !== 'ADMIN') {
      setActiveTab('home');
      setTabHistory(['home']);
    }
  }, [activeTab, currentUser]);

  // Core Data State (Loaded instantly from SWR Cache Engine - 0ms UI delay)
  const [customers, setCustomers] = useState<Customer[]>(() => {
    perf.start('initApp');
    perf.start('cacheRead');
    const cached = CacheEngine.get<Customer[]>('CUSTOMERS', INITIAL_CUSTOMERS);
    const deduplicated = ApiClient.deduplicateCustomers(cached.data);
    perf.end('cacheRead', `${deduplicated.length} khách hàng`);
    return deduplicated;
  });
  const [meetings, setMeetings] = useState<MeetingHistory[]>(() => {
    const cached = CacheEngine.get<MeetingHistory[]>('MEETINGS', INITIAL_MEETINGS);
    return ApiClient.deduplicateMeetings(cached.data);
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const cached = CacheEngine.get<Task[]>('TASKS', INITIAL_TASKS);
    return ApiClient.deduplicateTasks(cached.data);
  });
  const [careEvents, setCareEvents] = useState<CareEvent[]>(() => {
    return CacheEngine.get<CareEvent[]>('CARE_EVENTS', INITIAL_CARE_EVENTS).data;
  });
  const [careHistories, setCareHistories] = useState<CareHistory[]>(() => {
    return CacheEngine.get<CareHistory[]>('CARE_HISTORIES', INITIAL_CARE_HISTORIES).data;
  });
  const [demandCategories, setDemandCategories] = useState<DemandCategory[]>(() => {
    return CacheEngine.get<DemandCategory[]>('DEMAND_CATEGORIES', INITIAL_DEMAND_CATEGORIES).data;
  });
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(() => {
    return CacheEngine.get<EmailConfig>('EMAIL_CONFIG', INITIAL_EMAIL_CONFIG).data;
  });
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => {
    return CacheEngine.get<EmailLog[]>('EMAIL_LOGS', INITIAL_EMAIL_LOGS).data;
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealthStatus>(() => {
    return CacheEngine.get<SystemHealthStatus>('SYSTEM_HEALTH', INITIAL_SYSTEM_HEALTH).data;
  });

  // Connection & Async status - App shell renders instantly, syncs in background
  const [isConnected, setIsConnected] = useState<boolean>(ApiClient.isConnected());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    const ts = CacheEngine.getTimestamp('LAST_SYNC_BOOTSTRAP');
    return ts ? CacheEngine.formatTime(ts) : '';
  });
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  // Modals state
  const [isQuickActivityOpen, setIsQuickActivityOpen] = useState(false);
  const [quickActivityPreSelectedKhId, setQuickActivityPreSelectedKhId] = useState<string | undefined>(undefined);

  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingPreSelectedKhId, setMeetingPreSelectedKhId] = useState<string | undefined>(undefined);

  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapCustomer, setMapCustomer] = useState<Customer | null>(null);

  // Quick Task Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTargetKhId, setTaskTargetKhId] = useState<string>('');
  const [taskContentInput, setTaskContentInput] = useState('');
  const [taskDueDateInput, setTaskDueDateInput] = useState('');

  // Toast trigger helper
  const showToast = (text: string, type: 'success' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 1. Initial Data Fetching (SWR: Rapid Bootstrap + Background Parallel Revalidate)
  const loadData = useCallback(async (silent = false) => {
    if (!silent && customers.length === 0) setIsLoading(true);
    setIsRefreshing(true);
    perf.start('backgroundSync');

    try {
      const userEmail = currentUser?.email || 'DUCNT4@VIETINBANK.VN';
      
      // Thử gọi getBootstrapData tối ưu trước, fallback sang getInitialData nếu backend cũ
      let bootstrapRes = await ApiClient.getBootstrapData(userEmail, activeRole, 50);
      let payloadData: any = null;

      if (bootstrapRes.success && bootstrapRes.data) {
        payloadData = bootstrapRes.data;
      } else {
        const fullRes = await ApiClient.apiRequest('getInitialData', {
          userRole: activeRole,
          userEmail
        });
        if (fullRes.success && fullRes.data) {
          payloadData = fullRes.data;
        }
      }

      if (payloadData) {
        const cleanCust = ApiClient.deduplicateCustomers(payloadData.customers || []);
        const cleanMeet = ApiClient.deduplicateMeetings(payloadData.meetings || []);
        const cleanTask = ApiClient.deduplicateTasks(payloadData.tasks || []);
        setCustomers(cleanCust);
        setMeetings(cleanMeet);
        setTasks(cleanTask);
        setCareEvents(payloadData.careEvents || []);
        if (payloadData.demandCategories) {
          setDemandCategories(payloadData.demandCategories);
          CacheEngine.set('DEMAND_CATEGORIES', payloadData.demandCategories);
        }
        if (payloadData.emailConfig) {
          setEmailConfig(payloadData.emailConfig);
          CacheEngine.set('EMAIL_CONFIG', payloadData.emailConfig);
        }
        if (payloadData.emailLogs) {
          setEmailLogs(payloadData.emailLogs);
          CacheEngine.set('EMAIL_LOGS', payloadData.emailLogs);
        }

        // Cập nhật ngay SWR Cache cho giao diện cốt lõi
        CacheEngine.set('CUSTOMERS', cleanCust);
        CacheEngine.set('MEETINGS', cleanMeet);
        CacheEngine.set('TASKS', cleanTask);
        CacheEngine.set('CARE_EVENTS', payloadData.careEvents || []);
        CacheEngine.set('LAST_SYNC_BOOTSTRAP', Date.now());
        setLastSyncTime(CacheEngine.formatTime(Date.now()));
      }

      // Tải song song (Parallel Non-blocking) các dữ liệu phụ trợ
      Promise.allSettled([
        ApiClient.apiRequest<AppUser[]>('getUsers'),
        ApiClient.apiRequest<SystemHealthStatus>('healthCheck'),
        ApiClient.getCareHistories(),
        ApiClient.getDemandCategories()
      ]).then(results => {
        const [usersRes, healthRes, careRes, demRes] = results;

        if (usersRes.status === 'fulfilled' && usersRes.value.success && usersRes.value.data) {
          const cleanUsers = usersRes.value.data.map(u => ApiClient.sanitizeUser(u));
          setUsers(cleanUsers);
          CacheEngine.set('USERS', cleanUsers);
        }

        if (healthRes.status === 'fulfilled' && healthRes.value.success && healthRes.value.data) {
          setSystemHealth(healthRes.value.data);
          CacheEngine.set('SYSTEM_HEALTH', healthRes.value.data);
        }

        if (careRes.status === 'fulfilled' && careRes.value.success && careRes.value.data) {
          setCareHistories(careRes.value.data);
          CacheEngine.set('CARE_HISTORIES', careRes.value.data);
        }

        if (demRes.status === 'fulfilled' && demRes.value.success && demRes.value.data) {
          setDemandCategories(demRes.value.data);
          CacheEngine.set('DEMAND_CATEGORIES', demRes.value.data);
        }
      }).catch(err => {
        console.warn('Background sync secondary data error:', err);
      });

      setIsConnected(ApiClient.isConnected());
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu ban đầu', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      perf.end('backgroundSync');
    }
  }, [activeRole, currentUser?.email, customers.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Login
  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    const res = await ApiClient.login(username, password);
    if (res.success && res.data) {
      setCurrentUser(res.data);
      setActiveRole(res.data.role);
      setIsLoginModalOpen(false);
      showToast(res.message || `Chào mừng ${res.data.hoTen}!`, 'success');
      loadData(true);
      return true;
    }
    showToast(res.message || 'Sai tên đăng nhập hoặc mật khẩu.', 'warning');
    return false;
  };

  // Handle Logout
  const handleLogout = () => {
    ApiClient.logout();
    setCurrentUser(null);
    setIsLoginModalOpen(true);
    showToast('Đã đăng xuất khỏi phiên làm việc.', 'success');
  };

  // User Management Handlers
  const handleUpdateUser = async (user: AppUser) => {
    const cleanUser = ApiClient.sanitizeUser(user);
    const res = await ApiClient.updateUser(cleanUser);
    if (res.success) {
      setUsers(prev => prev.map(u => u.user.toLowerCase() === user.user.toLowerCase() ? { ...u, ...cleanUser } : u));
      if (currentUser && currentUser.user.toLowerCase() === user.user.toLowerCase()) {
        const updated = { ...currentUser, ...cleanUser };
        setCurrentUser(updated);
        ApiClient.setCurrentUser(updated);
      }
      showToast(res.message || 'Cập nhật thông tin cán bộ thành công!', 'success');
    } else {
      showToast('Lỗi cập nhật cán bộ: ' + res.message, 'warning');
    }
  };

  const handleResetPassword = async (username: string, newPassword?: string) => {
    const res = await ApiClient.resetUserPassword(username, newPassword);
    if (res.success) {
      showToast(res.message || 'Đã đặt lại mật khẩu cán bộ thành công!', 'success');
    } else {
      showToast('Lỗi reset mật khẩu: ' + res.message, 'warning');
    }
  };

  const handleAddUser = async (newUser: AppUser) => {
    const cleanUser = ApiClient.sanitizeUser(newUser);
    const res = await ApiClient.addUser(cleanUser);
    if (res.success && res.data) {
      setUsers(prev => [...prev, ApiClient.sanitizeUser(res.data!)]);
      showToast(res.message || 'Đã tạo mới cán bộ thành công!', 'success');
    } else {
      showToast('Lỗi thêm cán bộ: ' + res.message, 'warning');
    }
  };

  const handleDeleteUser = async (username: string) => {
    const res = await ApiClient.deleteUser(username);
    if (res.success) {
      setUsers(prev => prev.filter(u => u.user.toLowerCase() !== username.toLowerCase()));
      showToast(res.message || 'Đã xóa tài khoản cán bộ thành công!', 'success');
    } else {
      showToast('Lỗi xóa cán bộ: ' + res.message, 'warning');
    }
  };

  // 2. Business Handlers
  const handleOpenQuickActivity = (preSelectedCustomerId?: string) => {
    setQuickActivityPreSelectedKhId(preSelectedCustomerId);
    setIsQuickActivityOpen(true);
  };

  const handleSaveQuickActivity = async (payload: {
    activityType: 'MEETING' | 'CARE';
    meetingData?: Partial<MeetingHistory>;
    careData?: Partial<CareHistory>;
    nextTask?: { noiDung: string; ngayHan: string; ghiChu: string; priority?: 'CAO' | 'TRUNG_BINH' | 'THAP' };
  }) => {
    const res = await ApiClient.recordQuickActivity({
      ...payload,
      meetingData: payload.meetingData ? {
        ...payload.meetingData,
        canBoThucHien: payload.meetingData.canBoThucHien || currentUser?.hoTen || 'QHKH'
      } : undefined,
      careData: payload.careData ? {
        ...payload.careData,
        canBo: payload.careData.canBo || currentUser?.hoTen || 'QHKH'
      } : undefined
    });

    if (res.success) {
      showToast(res.message || 'Đã lưu hoạt động thành công!', 'success');
      setIsQuickActivityOpen(false);

      // Cập nhật State & Cache ngay lập tức (Optimistic/Immediate UI) không cần reload toàn bộ Sheet
      if (payload.activityType === 'MEETING' && payload.meetingData) {
        const newM: MeetingHistory = (res.data?.meeting as MeetingHistory) || {
          idLichSu: 'LSG_' + Date.now().toString().slice(-6),
          idKh: payload.meetingData.idKh || '',
          thoiGianGap: payload.meetingData.thoiGianGap || new Date().toISOString(),
          hinhThucGap: payload.meetingData.hinhThucGap || 'Gặp trực tiếp',
          latitude: payload.meetingData.latitude || null,
          longitude: payload.meetingData.longitude || null,
          googleMapUrl: payload.meetingData.googleMapUrl || '',
          noiDungTraoDoi: payload.meetingData.noiDungTraoDoi || '',
          nhuCauKhachHang: payload.meetingData.nhuCauKhachHang || '',
          tinhTrangSauGap: payload.meetingData.tinhTrangSauGap || 'Đã gặp khách hàng',
          congViecTiepTheo: payload.meetingData.congViecTiepTheo || '',
          ngayHenLienHe: payload.meetingData.ngayHenLienHe || '',
          ghiChu: payload.meetingData.ghiChu || '',
          canBoThucHien: payload.meetingData.canBoThucHien || currentUser?.hoTen || 'QHKH',
          thoiGianCapNhat: new Date().toISOString()
        };
        setMeetings(prev => {
          const next = [newM, ...prev];
          CacheEngine.set('MEETINGS', next);
          return next;
        });

        if (payload.meetingData.idKh) {
          setCustomers(prev => {
            const next = prev.map(c => c.idKh === payload.meetingData?.idKh ? {
              ...c,
              ngayCapNhat: new Date().toISOString().split('T')[0]
            } : c);
            CacheEngine.set('CUSTOMERS', next);
            return next;
          });
        }
      } else if (payload.careData) {
        const newC: CareHistory = (res.data?.care as CareHistory) || {
          idChamSoc: 'CS_' + Date.now().toString().slice(-6),
          idKh: payload.careData.idKh || '',
          thoiGian: payload.careData.thoiGian || new Date().toISOString(),
          hinhThuc: payload.careData.hinhThuc || 'Gọi điện',
          suKien: payload.careData.suKien || 'Chăm sóc thường xuyên',
          noiDung: payload.careData.noiDung || '',
          ketQua: payload.careData.ketQua || 'Khách hàng hài lòng',
          canBo: payload.careData.canBo || currentUser?.hoTen || 'QHKH',
          ghiChu: payload.careData.ghiChu || ''
        };
        setCareHistories(prev => {
          const next = [newC, ...prev];
          CacheEngine.set('CARE_HISTORIES', next);
          return next;
        });

        // Đồng thời cập nhật vào meetings để Timeline và danh sách hoạt động hiển thị đầy đủ
        const newMeetingFromCare: MeetingHistory = (res.data?.meeting as MeetingHistory) || {
          idLichSu: 'LSG_' + Date.now().toString().slice(-6),
          idKh: payload.careData.idKh || '',
          thoiGianGap: payload.careData.thoiGian || new Date().toISOString(),
          hinhThucGap: payload.careData.hinhThuc === 'Gọi điện' ? 'Điện thoại' : 'Chăm sóc',
          latitude: null,
          longitude: null,
          googleMapUrl: '',
          noiDungTraoDoi: payload.careData.noiDung || '',
          nhuCauKhachHang: payload.careData.ghiChu || '',
          tinhTrangSauGap: 'Đã gặp khách hàng',
          congViecTiepTheo: payload.nextTask?.noiDung || '',
          ngayHenLienHe: payload.nextTask?.ngayHan || '',
          ghiChu: payload.careData.ghiChu || '',
          canBoThucHien: payload.careData.canBo || currentUser?.hoTen || 'QHKH',
          thoiGianCapNhat: new Date().toISOString()
        };
        setMeetings(prev => {
          const next = [newMeetingFromCare, ...prev];
          CacheEngine.set('MEETINGS', next);
          return next;
        });

        if (payload.careData.idKh) {
          setCustomers(prev => {
            const next = prev.map(c => c.idKh === payload.careData?.idKh ? {
              ...c,
              ngayCapNhat: new Date().toISOString().split('T')[0]
            } : c);
            CacheEngine.set('CUSTOMERS', next);
            return next;
          });
        }
      }

      if (payload.nextTask) {
        const newT: Task = res.data?.task || {
          idCongViec: 'CV_' + Date.now().toString().slice(-6),
          idKh: payload.meetingData?.idKh || payload.careData?.idKh || '',
          noiDung: payload.nextTask.noiDung,
          ngayHan: payload.nextTask.ngayHan,
          canBo: currentUser?.hoTen || 'QHKH',
          trangThai: 'Chưa thực hiện',
          ghiChu: payload.nextTask.ghiChu || '',
          priority: payload.nextTask.priority
        };
        setTasks(prev => {
          const next = [newT, ...prev];
          CacheEngine.set('TASKS', next);
          return next;
        });
      }
    } else {
      throw new Error(res.message || 'Lỗi khi lưu hoạt động nhanh');
    }
  };

  const handleOpenNewMeeting = (preSelectedCustomerId?: string) => {
    setMeetingPreSelectedKhId(preSelectedCustomerId);
    setIsMeetingModalOpen(true);
  };

  const handleSaveMeeting = async (
    meetingData: Partial<MeetingHistory>, 
    newTask?: { noiDung: string; ngayHan: string; ghiChu: string }
  ) => {
    const res = await ApiClient.apiRequest('recordMeeting', {
      meeting: {
        ...meetingData,
        canBoThucHien: meetingData.canBoThucHien || currentUser?.hoTen || 'QHKH'
      },
      newTask
    });

    if (res.success) {
      showToast('Đã ghi nhận cuộc gặp thành công.', 'success');
      const newM: MeetingHistory = (res.data?.meeting as MeetingHistory) || {
        idLichSu: 'LSG_' + Date.now().toString().slice(-6),
        idKh: meetingData.idKh || '',
        thoiGianGap: meetingData.thoiGianGap || new Date().toISOString(),
        hinhThucGap: meetingData.hinhThucGap || 'Gặp trực tiếp',
        latitude: meetingData.latitude || null,
        longitude: meetingData.longitude || null,
        googleMapUrl: meetingData.googleMapUrl || '',
        noiDungTraoDoi: meetingData.noiDungTraoDoi || '',
        nhuCauKhachHang: meetingData.nhuCauKhachHang || '',
        tinhTrangSauGap: meetingData.tinhTrangSauGap || 'Đã gặp khách hàng',
        congViecTiepTheo: meetingData.congViecTiepTheo || '',
        ngayHenLienHe: meetingData.ngayHenLienHe || '',
        ghiChu: meetingData.ghiChu || '',
        canBoThucHien: meetingData.canBoThucHien || currentUser?.hoTen || 'QHKH',
        thoiGianCapNhat: new Date().toISOString()
      };
      setMeetings(prev => {
        const next = [newM, ...prev];
        CacheEngine.set('MEETINGS', next);
        return next;
      });

      if (newTask) {
        const newT: Task = res.data?.task || {
          idCongViec: 'CV_' + Date.now().toString().slice(-6),
          idKh: meetingData.idKh || '',
          noiDung: newTask.noiDung,
          ngayHan: newTask.ngayHan,
          canBo: currentUser?.hoTen || 'QHKH',
          trangThai: 'Chưa thực hiện',
          ghiChu: newTask.ghiChu || ''
        };
        setTasks(prev => {
          const next = [newT, ...prev];
          CacheEngine.set('TASKS', next);
          return next;
        });
      }

      if (meetingData.idKh) {
        setCustomers(prev => {
          const next = prev.map(c => c.idKh === meetingData.idKh ? {
            ...c,
            ngayCapNhat: new Date().toISOString().split('T')[0]
          } : c);
          CacheEngine.set('CUSTOMERS', next);
          return next;
        });
      }
    } else {
      throw new Error(res.message || 'Lỗi khi lưu cuộc gặp');
    }
  };

  const handleSaveCustomer = async (customerData: Partial<Customer>, allowUpdateExisting = false) => {
    const cleanPhone = customerData.sdt ? normalizePhone(customerData.sdt) : '';
    const cleanId = customerData.idKh && !customerData.idKh.startsWith('KH_') && !isNaN(Number(String(customerData.idKh).replace(/\D/g, '')))
      ? normalizePhone(customerData.idKh)
      : (customerData.idKh || cleanPhone);

    const existing = cleanId ? customers.find(c => c.idKh === cleanId || normalizePhone(c.sdt) === cleanPhone) : null;
    const action = existing || allowUpdateExisting ? 'updateCustomer' : 'addCustomer';
    const payload = {
      ...customerData,
      sdt: cleanPhone || customerData.sdt,
      idKh: existing?.idKh || cleanId,
      canBoPhuTrach: customerData.canBoPhuTrach || currentUser?.hoTen || 'Nguyễn Trọng Đức',
      userCanBo: customerData.userCanBo || currentUser?.user || 'ducnt4',
      emailCanBo: customerData.emailCanBo || currentUser?.email || 'DUCNT4@VIETINBANK.VN',
      nguoiKhoiTao: customerData.nguoiKhoiTao || currentUser?.hoTen || 'Nguyễn Trọng Đức',
      userKhoiTao: customerData.userKhoiTao || currentUser?.user || 'ducnt4',
      phongBanKhoiTao: customerData.phongBanKhoiTao || currentUser?.phongBan || '',
      nguoiCapNhatCuoi: currentUser?.hoTen || '',
      userCapNhatCuoi: currentUser?.user || '',
      allowUpdateExisting
    };

    const res = await ApiClient.apiRequest(action, { 
      customer: payload,
      allowUpdateExisting,
      currentUser,
      isAdmin: currentUser?.role === 'ADMIN'
    });

    if (res.success) {
      showToast(action === 'updateCustomer' ? 'Đã cập nhật hồ sơ khách hàng thành công.' : 'Đã thêm khách hàng mới vào sổ tay.', 'success');
      const savedCust: Customer = res.data || (payload as Customer);
      setCustomers(prev => {
        const exists = prev.some(c => c.idKh === savedCust.idKh);
        const next = exists ? prev.map(c => c.idKh === savedCust.idKh ? { ...c, ...savedCust } : c) : [savedCust, ...prev];
        CacheEngine.set('CUSTOMERS', next);
        return next;
      });
    } else {
      throw new Error(res.message || 'Lỗi khi lưu khách hàng');
    }
  };

  const handleReassignCreator = async (
    customerId: string, 
    newCreator: { userKhoiTao: string; nguoiKhoiTao: string; phongBanKhoiTao: string }
  ) => {
    const cust = customers.find(c => c.idKh === customerId);
    if (!cust) return;

    const res = await ApiClient.apiRequest('updateCustomer', {
      customer: {
        ...cust,
        userKhoiTao: newCreator.userKhoiTao,
        nguoiKhoiTao: newCreator.nguoiKhoiTao,
        phongBanKhoiTao: newCreator.phongBanKhoiTao,
        nguoiCapNhatCuoi: currentUser?.hoTen || '',
        userCapNhatCuoi: currentUser?.user || ''
      },
      currentUser,
      isAdmin: currentUser?.role === 'ADMIN'
    });

    if (res.success) {
      showToast(`Đã thay đổi Người khởi tạo sang: ${newCreator.nguoiKhoiTao}`, 'success');
      setCustomers(prev => {
        const next = prev.map(c => c.idKh === customerId ? {
          ...c,
          userKhoiTao: newCreator.userKhoiTao,
          nguoiKhoiTao: newCreator.nguoiKhoiTao,
          phongBanKhoiTao: newCreator.phongBanKhoiTao,
          nguoiCapNhatCuoi: currentUser?.hoTen || '',
          userCapNhatCuoi: currentUser?.user || ''
        } : c);
        CacheEngine.set('CUSTOMERS', next);
        return next;
      });
      if (selectedCustomer && selectedCustomer.idKh === customerId) {
        setSelectedCustomer(prev => prev ? {
          ...prev,
          userKhoiTao: newCreator.userKhoiTao,
          nguoiKhoiTao: newCreator.nguoiKhoiTao,
          phongBanKhoiTao: newCreator.phongBanKhoiTao
        } : null);
      }
    } else {
      throw new Error(res.message || 'Lỗi khi thay đổi người khởi tạo');
    }
  };

  const handleToggleCareMode = async (customerId: string, newMode: CareMode) => {
    const res = await ApiClient.apiRequest('toggleCareMode', {
      idKh: customerId,
      cheDoChamSoc: newMode
    });

    if (res.success) {
      setCustomers(prev => {
        const next = prev.map(c => c.idKh === customerId ? { ...c, cheDoChamSoc: newMode } : c);
        CacheEngine.set('CUSTOMERS', next);
        return next;
      });
      if (selectedCustomer && selectedCustomer.idKh === customerId) {
        setSelectedCustomer(prev => prev ? { ...prev, cheDoChamSoc: newMode } : null);
      }
      showToast(`Đã ${newMode === 'Bật' ? 'BẬT' : 'TẮT'} Chế độ chăm sóc.`, 'success');
    } else {
      showToast('Không thể thay đổi chế độ chăm sóc: ' + res.message, 'warning');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const res = await ApiClient.apiRequest('updateTaskStatus', {
      idCongViec: taskId,
      trangThai: status
    });

    if (res.success) {
      setTasks(prev => {
        const next = prev.map(t => t.idCongViec === taskId ? { ...t, trangThai: status } : t);
        CacheEngine.set('TASKS', next);
        return next;
      });
      showToast(`Đã cập nhật: ${status}`, 'success');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTargetKhId || !taskContentInput.trim()) return;

    const res = await ApiClient.apiRequest('createTask', {
      task: {
        idKh: taskTargetKhId,
        noiDung: taskContentInput,
        ngayHan: taskDueDateInput,
        canBo: currentUser?.hoTen || 'QHKH',
        trangThai: 'Chưa thực hiện',
        ghiChu: ''
      }
    });

    if (res.success) {
      showToast('Đã thêm công việc thành công.', 'success');
      setIsTaskModalOpen(false);
      setTaskContentInput('');
      setTaskDueDateInput('');
      const createdTask: Task = res.data || {
        idCongViec: 'CV_' + Date.now().toString().slice(-6),
        idKh: taskTargetKhId,
        noiDung: taskContentInput,
        ngayHan: taskDueDateInput,
        canBo: currentUser?.hoTen || 'QHKH',
        trangThai: 'Chưa thực hiện',
        ghiChu: ''
      };
      setTasks(prev => {
        const next = [createdTask, ...prev];
        CacheEngine.set('TASKS', next);
        return next;
      });
    }
  };

  const handleSaveCareEvent = async (event: CareEvent) => {
    const res = await ApiClient.apiRequest('saveCareEvent', { careEvent: event });
    if (res.success) {
      showToast('Đã lưu sự kiện chăm sóc.', 'success');
      setCareEvents(prev => {
        const exists = prev.some(e => e.idSuKien === event.idSuKien);
        const next = exists ? prev.map(e => e.idSuKien === event.idSuKien ? event : e) : [event, ...prev];
        CacheEngine.set('CARE_EVENTS', next);
        return next;
      });
    }
  };

  const handleDeleteCareEvent = async (eventId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sự kiện chăm sóc này?')) return;
    const res = await ApiClient.apiRequest('deleteCareEvent', { idSuKien: eventId });
    if (res.success) {
      showToast('Đã xóa sự kiện.', 'success');
      setCareEvents(prev => {
        const next = prev.filter(e => e.idSuKien !== eventId);
        CacheEngine.set('CARE_EVENTS', next);
        return next;
      });
    }
  };

  const handleSaveAppsScriptUrl = (url: string) => {
    ApiClient.setWebappUrl(url);
    setIsConnected(ApiClient.isConnected());
    showToast('Đã cập nhật Web App URL.', 'success');
    loadData(true);
  };

  const handleUpdateEmailConfig = async (newConfig: EmailConfig) => {
    const res = await ApiClient.apiRequest('updateEmailConfig', { config: newConfig });
    if (res.success) {
      setEmailConfig(newConfig);
      showToast('Đã lưu cấu hình email.', 'success');
    }
  };

  const handleSendTestEmail = async (targetEmail: string) => {
    const res = await ApiClient.apiRequest('sendTestEmail', { targetEmail });
    if (res.success) {
      showToast(`Đã gửi email test đến ${targetEmail}!`, 'success');
      loadData(true);
    }
    return res;
  };

  const handleRunCareCheckNow = async () => {
    const res = await ApiClient.apiRequest('manualCheckCareReminders');
    if (res.success) {
      showToast(res.message || 'Đã hoàn thành kiểm tra chăm sóc.', 'success');
      loadData(true);
    }
    return res;
  };

  const handleSetupDatabase = async () => {
    await ApiClient.apiRequest('setupDatabase');
    showToast('Đã đồng bộ 6 Sheets chuẩn.', 'success');
    loadData(true);
  };

  const handleSetupTrigger = async () => {
    await ApiClient.apiRequest('setupTriggers');
    showToast('Đã cấu hình Trigger 07:00 AM hàng ngày.', 'success');
    loadData(true);
  };

  const handleSyncAllToSheets = async () => {
    const res = await ApiClient.syncAllToSheets({
      customers,
      meetings,
      tasks,
      careEvents,
      users,
      emailConfig
    });
    if (res.success) {
      showToast(res.message || 'Đã đồng bộ toàn bộ dữ liệu lên Google Sheets!', 'success');
      loadData(false);
    } else {
      showToast('Lỗi đồng bộ dữ liệu: ' + res.message, 'warning');
    }
    return res;
  };

  const handleFormatDatabaseSheets = async () => {
    const res = await ApiClient.formatDatabaseSheets();
    if (res.success) {
      showToast(res.message || 'Đã định dạng toàn bộ 7 Sheet chuẩn VietinBank!', 'success');
    } else {
      showToast('Lỗi định dạng: ' + res.message, 'warning');
    }
    return res;
  };

  // Badge calculations for Navigation
  const pendingCareCount = customers.filter(c => c.cheDoChamSoc === 'Bật').length;
  const overdueTasksCount = tasks.filter(t => t.trangThai === 'Quá hạn').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* 1. Global Header */}
      <Header
        activeRole={activeRole}
        onRoleChange={(r) => {
          setActiveRole(r);
          showToast(`Đã chuyển sang giao diện: ${r === 'QHKH' ? 'Cán bộ QHKH' : r === 'LANH_DAO' ? 'Lãnh đạo' : 'Quản trị viên'}`, 'success');
        }}
        isConnected={isConnected}
        onOpenSettings={() => {
          setActiveTab('admin');
          setAdminSubTab('system');
        }}
        onRefreshData={() => loadData(false)}
        isRefreshing={isRefreshing}
        lastSyncTime={lastSyncTime}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenUserManagement={() => {
          setActiveTab('admin');
          setAdminSubTab('users');
        }}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* 1.5 SWR Background Sync Micro Indicator */}
      {isRefreshing && (
        <div className="bg-blue-50/95 border-b border-blue-100 text-[#00519E] text-[11px] font-semibold py-1 px-3 flex items-center justify-center gap-2 transition-all">
          <Loader2 className="w-3 h-3 animate-spin shrink-0 text-blue-600" />
          <span>Đang cập nhật dữ liệu ngầm từ Google Sheets...</span>
          {lastSyncTime && (
            <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
              (Bản lưu gần nhất: {lastSyncTime})
            </span>
          )}
        </div>
      )}

      {/* 2. Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className={`px-4 py-2.5 rounded-full shadow-lg border flex items-center gap-2 text-xs sm:text-sm font-bold ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700 shadow-emerald-900/20'
              : 'bg-amber-900 text-white border-amber-700 shadow-amber-900/20'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-1 p-0.5 text-white/70 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2.5 Mobile Navigation Bar with "Trở lại" button */}
      {activeTab !== 'home' && (
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 py-2 flex items-center justify-between sticky top-[53px] sm:top-[61px] z-20 shadow-2xs">
          <button
            id="btn-global-back"
            onClick={handleGoBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm cursor-pointer transition-colors shadow-2xs"
            title="Quay lại màn hình trước"
          >
            <ArrowLeft className="w-4 h-4 text-blue-700" />
            <span>Trở lại</span>
          </button>
          
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
              {getTabTitle(activeTab)}
            </span>
          </div>
        </div>
      )}

      {/* 3. Main Body Content Area - Rendered instantly from SWR Cache */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5">
        {isLoading && customers.length === 0 && meetings.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
            <p className="text-sm font-bold text-slate-700">Đang khởi tạo Sổ tay QHKH...</p>
            <p className="text-xs text-slate-400">Đang đồng bộ dữ liệu lần đầu từ Google Sheets</p>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <DashboardView
                customers={customers}
                meetings={meetings}
                tasks={tasks}
                careEvents={careEvents}
                currentUser={currentUser}
                onOpenNewMeeting={handleOpenNewMeeting}
                onOpenQuickActivity={handleOpenQuickActivity}
                onOpenNewCustomer={() => {
                  setEditingCustomer(null);
                  setIsCustomerFormOpen(true);
                }}
                onSelectCustomer={(c) => {
                  setSelectedCustomer(c);
                  setIsCustomerDetailOpen(true);
                }}
                onNavigateTab={handleNavigateTab}
                onLogout={handleLogout}
              />
            )}

            {activeTab === 'customers' && (
              <CustomerListView
                customers={customers}
                meetings={meetings}
                tasks={tasks}
                onSelectCustomer={(c) => {
                  setSelectedCustomer(c);
                  setIsCustomerDetailOpen(true);
                }}
                onOpenNewMeeting={handleOpenNewMeeting}
                onOpenQuickActivity={handleOpenQuickActivity}
                onOpenNewCustomer={() => {
                  setEditingCustomer(null);
                  setIsCustomerFormOpen(true);
                }}
                onToggleCareMode={handleToggleCareMode}
                onOpenMap={(c) => {
                  setMapCustomer(c);
                  setIsMapModalOpen(true);
                }}
                currentUser={currentUser}
                users={users}
              />
            )}

            {activeTab === 'meetings' && (
              <MeetingHistoryView
                meetings={meetings}
                customers={customers}
                onOpenNewMeeting={handleOpenNewMeeting}
                onSelectCustomer={(c) => {
                  setSelectedCustomer(c);
                  setIsCustomerDetailOpen(true);
                }}
              />
            )}

            {activeTab === 'care' && (
              <CareManagementView
                customers={customers}
                meetings={meetings}
                tasks={tasks}
                careEvents={careEvents}
                emailLogs={emailLogs}
                onManualCheckReminders={handleRunCareCheckNow}
                onToggleCustomerCare={handleToggleCareMode}
                onSaveCareEvent={handleSaveCareEvent}
                onDeleteCareEvent={handleDeleteCareEvent}
                onOpenNewMeeting={handleOpenNewMeeting}
                onSelectCustomer={(c) => {
                  setSelectedCustomer(c);
                  setIsCustomerDetailOpen(true);
                }}
                onOpenMap={(c) => {
                  setSelectedCustomer(c);
                  setIsMapModalOpen(true);
                }}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onAddNewTask={(cId) => {
                  if (cId) setTaskTargetKhId(cId);
                  setIsTaskModalOpen(true);
                }}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                customers={customers}
                meetings={meetings}
                tasks={tasks}
                currentUser={currentUser}
                users={users}
                onSelectCustomer={(c) => {
                  setSelectedCustomer(c);
                  setIsCustomerDetailOpen(true);
                }}
              />
            )}

            {activeTab === 'admin' && currentUser?.role === 'ADMIN' && (
              <div className="space-y-4 pb-20">
                {/* Header khi đã vào chức năng con */}
                {adminSubTab !== 'menu' && (
                  <div className="flex items-center justify-between border-b border-slate-200 bg-white p-3 rounded-2xl shadow-2xs gap-2 flex-wrap">
                    <button
                      id="admin-btn-back-menu"
                      type="button"
                      onClick={() => setAdminSubTab('menu')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-extrabold text-xs sm:text-sm cursor-pointer transition-all active:scale-95 shadow-xs shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4 text-blue-700" />
                      <span>← Menu Quản trị</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setAdminSubTab('users')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          adminSubTab === 'users'
                            ? 'bg-blue-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        1. Quản lý Cán bộ ({users.length})
                      </button>

                      <button
                        onClick={() => setAdminSubTab('system')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          adminSubTab === 'system'
                            ? 'bg-blue-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        2. Hệ thống &amp; Sheets
                      </button>
                    </div>
                  </div>
                )}

                {/* Mobile Hub Menu cho Admin khi adminSubTab === 'menu' */}
                {adminSubTab === 'menu' && (
                  <div className="max-w-xl mx-auto w-full space-y-4 py-2 sm:py-6">
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-5 text-white shadow-md">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                          Trung tâm Quản trị Hệ thống
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                        BẢNG ĐIỀU HÀNH QUẢN TRỊ VIÊN
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1">
                        Chạm chọn chức năng bên dưới để quản lý phân quyền tài khoản hoặc cấu hình kết nối hệ thống.
                      </p>
                    </div>

                    <div className="space-y-3 pt-1">
                      {/* Button 1: Quản lý Cán bộ & User */}
                      <button
                        id="admin-menu-btn-users"
                        type="button"
                        onClick={() => setAdminSubTab('users')}
                        className="group w-full p-4 sm:p-5 bg-white hover:bg-blue-50/60 active:bg-blue-100/50 border-2 border-slate-200/90 hover:border-blue-500 rounded-2xl text-left shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-between gap-3.5"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
                            <Users className="w-6 h-6 sm:w-7 sm:h-7" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm sm:text-base font-black text-slate-900 group-hover:text-blue-800 transition-colors">
                                1. Quản lý Cán bộ &amp; User
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 shrink-0">
                                {users.length} tài khoản
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Thêm mới nhân sự, phân bổ phòng ban, gán quyền Lãnh đạo và cấp lại mật khẩu.
                            </p>
                          </div>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center shrink-0 transition-all">
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>

                      {/* Button 2: Cấu hình Hệ thống & Google Sheets */}
                      <button
                        id="admin-menu-btn-system"
                        type="button"
                        onClick={() => setAdminSubTab('system')}
                        className="group w-full p-4 sm:p-5 bg-white hover:bg-purple-50/60 active:bg-purple-100/50 border-2 border-slate-200/90 hover:border-purple-500 rounded-2xl text-left shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-between gap-3.5"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/20 group-hover:scale-105 transition-transform">
                            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm sm:text-base font-black text-slate-900 group-hover:text-purple-800 transition-colors">
                                2. Hệ thống &amp; Google Sheets
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 shrink-0">
                                Cấu hình
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Kiểm tra trạng thái Cloud Sheets, đồng bộ dữ liệu tự động, cấu hình email gửi báo cáo.
                            </p>
                          </div>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-purple-600 group-hover:text-white text-slate-600 flex items-center justify-center shrink-0 transition-all">
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-tab content */}
                {adminSubTab === 'users' && (
                  <UserManagementView
                    users={users}
                    onUpdateUser={handleUpdateUser}
                    onResetPassword={handleResetPassword}
                    onAddUser={handleAddUser}
                    onDeleteUser={handleDeleteUser}
                    currentUser={currentUser}
                    onOpenChangePassword={() => setIsChangePasswordOpen(true)}
                  />
                )}

                {adminSubTab === 'system' && (
                  <AdminSystemHealthView
                    systemHealth={systemHealth}
                    emailConfig={emailConfig}
                    emailLogs={emailLogs}
                    appsScriptUrl={ApiClient.getWebappUrl()}
                    onSaveAppsScriptUrl={handleSaveAppsScriptUrl}
                    onUpdateEmailConfig={handleUpdateEmailConfig}
                    onSendTestEmail={handleSendTestEmail}
                    onRunCareCheckNow={handleRunCareCheckNow}
                    onRefreshHealth={() => loadData(false)}
                    onSetupDatabase={handleSetupDatabase}
                    onSetupTrigger={handleSetupTrigger}
                    onSyncAllToSheets={handleSyncAllToSheets}
                    onFormatDatabaseSheets={handleFormatDatabaseSheets}
                    stats={{
                      customersCount: customers.length,
                      meetingsCount: meetings.length,
                      tasksCount: tasks.length,
                      careEventsCount: careEvents.length,
                      usersCount: users.length,
                      emailLogsCount: emailLogs.length
                    }}
                  />
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* 4. Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleNavigateTab}
        pendingCareCount={pendingCareCount}
        overdueTasksCount={overdueTasksCount}
        currentUser={currentUser}
        onOpenQuickActivity={() => handleOpenQuickActivity()}
      />

      {/* 5. Modals */}
      {/* Modal 0: Ghi nhận nhanh 3 chạm (V2 Super Feature) */}
      <QuickActivityModal
        isOpen={isQuickActivityOpen}
        onClose={() => setIsQuickActivityOpen(false)}
        customers={customers}
        preSelectedCustomerId={quickActivityPreSelectedKhId}
        demandCategories={demandCategories}
        currentUserName={currentUser?.hoTen || 'Nguyễn Trọng Đức'}
        currentUserEmail={currentUser?.email}
        onSaveActivity={handleSaveQuickActivity}
        onOpenNewCustomer={() => {
          setIsQuickActivityOpen(false);
          setEditingCustomer(null);
          setIsCustomerFormOpen(true);
        }}
      />

      {/* Modal 1: Ghi nhận cuộc gặp (Centerpiece) */}
      <MeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        customers={customers}
        preSelectedCustomerId={meetingPreSelectedKhId}
        onSaveMeeting={handleSaveMeeting}
        currentUserName={currentUser?.hoTen || 'Nguyễn Trọng Đức'}
      />

      {/* Modal 2: Thêm / Sửa khách hàng */}
      <CustomerFormModal
        isOpen={isCustomerFormOpen}
        onClose={() => setIsCustomerFormOpen(false)}
        onSaveCustomer={handleSaveCustomer}
        initialData={editingCustomer}
        currentUserName={currentUser?.hoTen || 'Nguyễn Trọng Đức'}
        currentUserEmail={currentUser?.email || 'DUCNT4@VIETINBANK.VN'}
        currentUserUsername={currentUser?.user || 'ducnt4'}
        users={users}
        allCustomers={customers}
        currentUser={currentUser}
        onViewExistingCustomer={(c) => {
          setSelectedCustomer(c);
          setIsCustomerDetailOpen(true);
        }}
      />

      {/* Modal 3: Hồ sơ chi tiết khách hàng */}
      <CustomerDetailModal
        isOpen={isCustomerDetailOpen}
        onClose={() => setIsCustomerDetailOpen(false)}
        customer={selectedCustomer}
        meetings={meetings}
        tasks={tasks}
        careHistories={careHistories}
        onToggleCareMode={handleToggleCareMode}
        onOpenNewMeeting={(cid) => {
          setIsCustomerDetailOpen(false);
          handleOpenNewMeeting(cid);
        }}
        onOpenQuickActivity={(cid) => {
          setIsCustomerDetailOpen(false);
          handleOpenQuickActivity(cid);
        }}
        onEditCustomer={(c) => {
          setIsCustomerDetailOpen(false);
          setEditingCustomer(c);
          setIsCustomerFormOpen(true);
        }}
        onUpdateTaskStatus={handleUpdateTaskStatus}
        onAddNewTask={(cid) => {
          setTaskTargetKhId(cid);
          setIsTaskModalOpen(true);
        }}
        onOpenMap={(c) => {
          setMapCustomer(c);
          setIsMapModalOpen(true);
        }}
        currentUser={currentUser}
        users={users}
        onReassignCreator={handleReassignCreator}
      />

      {/* Modal 4: Bản đồ & Định vị khách hàng */}
      <CustomerMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        customer={mapCustomer}
        onOpenNewMeeting={(cid) => {
          setIsMapModalOpen(false);
          handleOpenNewMeeting(cid);
        }}
      />

      {/* Modal 5: Thêm công việc nhanh */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-extrabold text-sm text-slate-900">
                Thêm công việc cần làm
              </h4>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung công việc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={taskContentInput}
                  onChange={(e) => setTaskContentInput(e.target.value)}
                  placeholder="VD: Gửi dự thảo hợp đồng tín dụng..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hạn hoàn thành
                </label>
                <input
                  type="date"
                  value={taskDueDateInput}
                  onChange={(e) => setTaskDueDateInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold cursor-pointer"
                >
                  Lưu công việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Đăng nhập & Chuyển tài khoản cán bộ */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={currentUser ? () => setIsLoginModalOpen(false) : undefined}
        onLogin={handleLogin}
        users={users}
      />

      {/* Modal 7: Đổi mật khẩu cá nhân */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentUser={currentUser}
        onSuccess={(msg) => {
          showToast(msg, 'success');
        }}
      />
    </div>
  );
}
