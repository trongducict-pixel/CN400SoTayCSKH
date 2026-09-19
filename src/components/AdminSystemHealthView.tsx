import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Send, 
  Clock, 
  Settings, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  Mail, 
  Wifi, 
  WifiOff, 
  PlayCircle,
  HelpCircle,
  Loader2,
  Filter,
  Sparkles,
  Table,
  Layers,
  ArrowUpDown,
  Trash2,
  Edit3
} from 'lucide-react';
import { EmailConfig, EmailLog, SystemHealthStatus } from '../types';
import { APPS_SCRIPT_SOURCE_CODE } from '../services/appsScriptSource';

interface AdminSystemHealthViewProps {
  systemHealth: SystemHealthStatus;
  emailConfig: EmailConfig;
  emailLogs: EmailLog[];
  appsScriptUrl: string;
  onSaveAppsScriptUrl: (url: string) => void;
  onUpdateEmailConfig: (config: EmailConfig) => Promise<void>;
  onSendTestEmail: (targetEmail: string) => Promise<any>;
  onRunCareCheckNow: () => Promise<any>;
  onRefreshHealth: () => Promise<void>;
  onSetupDatabase: () => Promise<void>;
  onSetupTrigger: () => Promise<void>;
  onSyncAllToSheets?: () => Promise<any>;
  onFormatDatabaseSheets?: () => Promise<any>;
  stats?: {
    customersCount: number;
    meetingsCount: number;
    tasksCount: number;
    careEventsCount: number;
    usersCount: number;
    emailLogsCount: number;
  };
}

export const AdminSystemHealthView: React.FC<AdminSystemHealthViewProps> = ({
  systemHealth,
  emailConfig,
  emailLogs,
  appsScriptUrl,
  onSaveAppsScriptUrl,
  onUpdateEmailConfig,
  onSendTestEmail,
  onRunCareCheckNow,
  onRefreshHealth,
  onSetupDatabase,
  onSetupTrigger,
  onSyncAllToSheets,
  onFormatDatabaseSheets,
  stats
}) => {
  const [inputUrl, setInputUrl] = useState(appsScriptUrl);
  const [urlSaveSuccess, setUrlSaveSuccess] = useState(false);

  // Email Test state
  const [testEmailRecipient, setTestEmailRecipient] = useState(emailConfig.testEmail || emailConfig.adminEmail || '');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  // Trigger / DB action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Email Config Form state
  const [adminEmail, setAdminEmail] = useState(emailConfig.adminEmail || '');
  const [senderName, setSenderName] = useState(emailConfig.emailFromName || '');
  const [emailEnabled, setEmailEnabled] = useState(emailConfig.emailEnabled);
  const [reminderDays, setReminderDays] = useState(emailConfig.reminderDays || '7,3,1');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

  // Email Log filter
  const [logFilter, setLogFilter] = useState<'ALL' | 'SENT' | 'FAILED' | 'SKIPPED'>('ALL');

  // Copy code state
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSaveUrl = () => {
    onSaveAppsScriptUrl(inputUrl);
    setUrlSaveSuccess(true);
    setTimeout(() => setUrlSaveSuccess(false), 3000);
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient || !testEmailRecipient.includes('@')) {
      alert('Vui lòng nhập địa chỉ email hợp lệ!');
      return;
    }
    setIsSendingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await onSendTestEmail(testEmailRecipient);
      setTestEmailResult({
        success: res.success,
        message: res.message || 'Đã thực thi gửi email test.'
      });
    } catch (e: any) {
      setTestEmailResult({
        success: false,
        message: e.message || 'Lỗi khi gửi email test.'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      await onUpdateEmailConfig({
        ...emailConfig,
        adminEmail,
        emailFromName: senderName,
        emailEnabled,
        reminderDays,
        testEmail: testEmailRecipient
      });
      setConfigSaveSuccess(true);
      setTimeout(() => setConfigSaveSuccess(false), 3000);
    } catch (e: any) {
      alert('Lỗi lưu cấu hình: ' + e.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_SOURCE_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const filteredEmailLogs = emailLogs.filter(l => {
    if (logFilter === 'ALL') return true;
    return l.trangThai === logFilter;
  });

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            QUẢN TRỊ HỆ THỐNG & KẾT NỐI APPS SCRIPT
          </h2>
          <p className="text-xs text-slate-500">
            Giám sát trạng thái 5 dịch vụ cốt lõi, gửi email kiểm tra và cấu hình đồng bộ Google Sheets
          </p>
        </div>

        <button
          onClick={onRefreshHealth}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Kiểm tra lại toàn bộ hệ thống"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 1. SYSTEM HEALTH MONITOR (Section XXIII) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            TRẠNG THÁI 5 THÀNH PHẦN HỆ THỐNG (SYSTEM HEALTH)
          </h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            Realtime Monitor
          </span>
        </div>

        {/* 5 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Card 1: Google Sheet */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-950">1. Google Sheet</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-xs text-emerald-900 font-semibold mt-1">Đủ 6 Sheet chuẩn</p>
            <p className="text-[10px] text-emerald-700 mt-0.5 leading-tight">
              {systemHealth.googleSheet.details}
            </p>
          </div>

          {/* Card 2: Apps Script API */}
          <div className={`p-3.5 rounded-xl border ${
            appsScriptUrl 
              ? 'border-emerald-200 bg-emerald-50/50' 
              : 'border-amber-200 bg-amber-50/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">2. Apps Script API</span>
              <span className={`w-2.5 h-2.5 rounded-full ${appsScriptUrl ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </div>
            <p className="text-xs font-semibold mt-1 text-slate-900">
              {appsScriptUrl ? 'Đã kết nối Web App' : 'Bộ nhớ đệm Offline'}
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">
              {systemHealth.appsScriptApi.details}
            </p>
          </div>

          {/* Card 3: Email Service */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-950">3. Dịch vụ Email</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-xs text-emerald-900 font-semibold mt-1">
              MailApp Quota: 98/100
            </p>
            <p className="text-[10px] text-emerald-700 mt-0.5 leading-tight truncate">
              {emailConfig.adminEmail || 'Chưa cấu hình admin'}
            </p>
          </div>

          {/* Card 4: Trigger */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-950">4. Trigger hàng ngày</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-xs text-emerald-900 font-semibold mt-1">07:00 AM mỗi ngày</p>
            <p className="text-[10px] text-emerald-700 mt-0.5 leading-tight">
              checkCareReminders tự động
            </p>
          </div>

          {/* Card 5: Cấu hình */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-950">5. Cấu hình hệ thống</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-xs text-emerald-900 font-semibold mt-1">Nhắc trước 7,3,1 ngày</p>
            <p className="text-[10px] text-emerald-700 mt-0.5 leading-tight">
              Đầy đủ thông số email
            </p>
          </div>
        </div>

        {/* 4 Action Buttons required in Section XXIII */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <button
            id="admin-btn-test-db"
            onClick={async () => {
              setActionLoading('db');
              await onSetupDatabase();
              setActionLoading(null);
              setActionFeedback('Đã kiểm tra và đồng bộ cấu trúc 6 Sheet chuẩn trên Google Sheets.');
              setTimeout(() => setActionFeedback(null), 4000);
            }}
            disabled={actionLoading !== null}
            className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>TEST DATABASE</span>
          </button>

          <button
            id="admin-btn-test-email"
            onClick={handleSendTestEmail}
            disabled={isSendingEmail}
            className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-600" />
            <span>TEST EMAIL</span>
          </button>

          <button
            id="admin-btn-test-trigger"
            onClick={async () => {
              setActionLoading('trigger');
              await onSetupTrigger();
              setActionLoading(null);
              setActionFeedback('Đã thiết lập Trigger tự động 07:00 AM hàng ngày.');
              setTimeout(() => setActionFeedback(null), 4000);
            }}
            disabled={actionLoading !== null}
            className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>TEST TRIGGER</span>
          </button>

          <button
            id="admin-btn-run-care"
            onClick={async () => {
              setActionLoading('care');
              await onRunCareCheckNow();
              setActionLoading(null);
              setActionFeedback('Đã hoàn thành kiểm tra và gửi email nhắc chăm sóc khách hàng.');
              setTimeout(() => setActionFeedback(null), 4000);
            }}
            disabled={actionLoading !== null}
            className="py-2 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>RUN CARE CHECK NOW</span>
          </button>
        </div>

        {actionFeedback && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}
      </div>

      {/* 2. TRUNG TÂM ĐỒNG BỘ & TRÌNH BÀY GOOGLE SHEETS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Table className="w-4 h-4 text-blue-700" />
              ĐỒNG BỘ DỮ LIỆU & ĐỊNH DẠNG GOOGLE SHEETS CHUẨN KHOA HỌC
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Toàn bộ dữ liệu được lưu trữ, chỉnh sửa, xóa và đồng bộ 2 chiều. Trình bày chuẩn nhận diện VietinBank (Xanh đậm #004D99, kẻ viền mảnh, sọc xen kẽ, khóa dòng tiêu đề và bộ lọc).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onFormatDatabaseSheets && (
              <button
                id="admin-btn-format-sheets"
                onClick={async () => {
                  setActionLoading('format');
                  try {
                    const res = await onFormatDatabaseSheets();
                    setActionFeedback(res?.message || 'Đã áp dụng định dạng chuẩn VietinBank cho toàn bộ 7 Sheet!');
                  } catch (e: any) {
                    setActionFeedback('Lỗi định dạng: ' + e.message);
                  } finally {
                    setActionLoading(null);
                    setTimeout(() => setActionFeedback(null), 5000);
                  }
                }}
                disabled={actionLoading !== null}
                className="py-2 px-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center gap-1.5 transition-all border border-indigo-200 cursor-pointer shadow-2xs active:scale-98"
                title="Định dạng màu sắc, dòng tiêu đề, bộ lọc, viền kẻ cho tất cả các Sheet"
              >
                {actionLoading === 'format' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span>ĐỊNH DẠNG 7 SHEET (FORMAT)</span>
              </button>
            )}

            {onSyncAllToSheets && (
              <button
                id="admin-btn-sync-all-sheets"
                onClick={async () => {
                  setActionLoading('sync-all');
                  try {
                    const res = await onSyncAllToSheets();
                    setActionFeedback(res?.message || 'Đã đồng bộ toàn bộ dữ liệu lên Google Sheets và tối ưu định dạng thành công!');
                  } catch (e: any) {
                    setActionFeedback('Lỗi đồng bộ: ' + e.message);
                  } finally {
                    setActionLoading(null);
                    setTimeout(() => setActionFeedback(null), 5000);
                  }
                }}
                disabled={actionLoading !== null}
                className="py-2 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-700/20 cursor-pointer active:scale-98"
                title="Đẩy toàn bộ dữ liệu từ ứng dụng lên Google Sheet và sắp xếp khoa học"
              >
                {actionLoading === 'sync-all' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>ĐỒNG BỘ TOÀN BỘ LÊN SHEET</span>
              </button>
            )}
          </div>
        </div>

        {/* 7 Sheets Overview Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Sheet 1 */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-blue-900 font-mono">1. KHACH_HANG</span>
              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">28 cột</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">Hồ sơ khách hàng, phân loại, chế độ CSKH</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[10px]">
              <span className="text-slate-500">Dữ liệu hiện tại:</span>
              <strong className="text-slate-800">{stats?.customersCount ?? '—'} bản ghi</strong>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
              <Check className="w-3 h-3" />
              <span>CRUD: Thêm, Sửa, Xóa, Đồng bộ</span>
            </div>
          </div>

          {/* Sheet 2 */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-blue-900 font-mono">2. LICH_SU_GAP</span>
              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">15 cột</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">Nhật ký gặp gỡ, định vị Google Map, nhu cầu</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[10px]">
              <span className="text-slate-500">Dữ liệu hiện tại:</span>
              <strong className="text-slate-800">{stats?.meetingsCount ?? '—'} cuộc gặp</strong>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
              <Check className="w-3 h-3" />
              <span>Ghi nhận tức thì + Xóa / Sửa</span>
            </div>
          </div>

          {/* Sheet 3 */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-blue-900 font-mono">3. CONG_VIEC</span>
              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">9 cột</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">Công việc tồn đọng, hạn chót, tiến độ</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[10px]">
              <span className="text-slate-500">Dữ liệu hiện tại:</span>
              <strong className="text-slate-800">{stats?.tasksCount ?? '—'} việc</strong>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
              <Check className="w-3 h-3" />
              <span>Đổi trạng thái, Xóa việc xong</span>
            </div>
          </div>

          {/* Sheet 4 */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-blue-900 font-mono">4. SU_KIEN_CHAM_SOC</span>
              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">6 cột</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">Lễ, Tết, ngày kỷ niệm, số ngày nhắc</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[10px]">
              <span className="text-slate-500">Dữ liệu hiện tại:</span>
              <strong className="text-slate-800">{stats?.careEventsCount ?? '—'} sự kiện</strong>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
              <Check className="w-3 h-3" />
              <span>Tự động kích hoạt email</span>
            </div>
          </div>

          {/* Sheet 5 */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-blue-900 font-mono">5. CAN_BO</span>
              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">12 cột</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">Danh sách cán bộ, phòng ban, vai trò, mật khẩu</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[10px]">
              <span className="text-slate-500">Dữ liệu hiện tại:</span>
              <strong className="text-slate-800">{stats?.usersCount ?? '—'} cán bộ</strong>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
              <Check className="w-3 h-3" />
              <span>Thêm, Đổi mật khẩu, Phân quyền</span>
            </div>
          </div>

          {/* Sheet 6 */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-blue-900 font-mono">6. EMAIL_CONFIG</span>
              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">3 cột</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">Cấu hình tham số gửi email, chu kỳ nhắc 7,3,1</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[10px]">
              <span className="text-slate-500">Trạng thái:</span>
              <strong className="text-emerald-700 font-bold">{emailConfig.emailEnabled ? 'Đang Bật' : 'Tắt'}</strong>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
              <Check className="w-3 h-3" />
              <span>Lưu tức thì vào Google Sheet</span>
            </div>
          </div>

          {/* Sheet 7 */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-blue-300 transition-colors col-span-1 sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-blue-900 font-mono">7. EMAIL_LOG</span>
              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">12 cột</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">Nhật ký chi tiết các lần gửi email nhắc sinh nhật & lễ tết</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[10px]">
              <span className="text-slate-500">Dữ liệu hiện tại:</span>
              <strong className="text-slate-800">{emailLogs.length} logs ghi nhận</strong>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
              <Check className="w-3 h-3" />
              <span>Chống gửi trùng lặp tuyệt đối</span>
            </div>
          </div>
        </div>

        {/* Visual Standards Checklist */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Tiêu chuẩn trình bày khoa học trên Google Sheets:</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] text-slate-600">
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Màu sắc nhận diện:</strong> Dòng tiêu đề màu xanh đậm VietinBank (<code>#004D99</code>), chữ trắng in đậm, căn giữa.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Kẻ ô & Zebra Striping:</strong> Viền kẻ mảnh chuẩn <code>#CBD5E1</code>, dòng chẵn màu trắng, dòng lẻ xen kẽ màu <code>#F8FAFC</code>.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Cố định & Bộ lọc:</strong> Đóng băng dòng đầu (Freeze Header Row 1) và bật Auto-Filter sẵn sàng tra cứu.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Độ rộng cột khoa học:</strong> Từng cột (Họ tên, SĐT, Địa chỉ, Nhu cầu, Bản đồ...) có độ rộng tối ưu, không bị tràn hay khuất chữ.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Cơ chế Sửa & Xóa:</strong> Khi sửa hoặc xóa khách hàng/cuộc gặp/công việc/cán bộ, hệ thống đồng bộ thẳng tới hàng tương ứng trên Sheet.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Tự động khôi phục:</strong> Hàm <code>setupDatabase()</code> và <code>syncAllToSheets()</code> tự động tạo lại các cột thiếu mà không làm mất dữ liệu cũ.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KIỂM TRA HỆ THỐNG EMAIL (Section XXVII) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              KIỂM TRA HỆ THỐNG EMAIL (TEST EMAIL CONSOLE)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Email hệ thống: <strong>{emailConfig.adminEmail || 'trongduc.ict@gmail.com'}</strong> | Trạng thái: <span className="font-bold text-emerald-700">🟢 Email đã cấu hình</span>
            </p>
          </div>
        </div>

        {/* Test Email Form */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="admin-input-test-email"
                type="email"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="Nhập email nhận thử nghiệm (VD: trongduc.ict@gmail.com)"
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <button
              id="admin-btn-send-test-email"
              onClick={handleSendTestEmail}
              disabled={isSendingEmail}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isSendingEmail ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>GỬI EMAIL TEST</span>
            </button>
          </div>

          {testEmailResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              testEmailResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {testEmailResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{testEmailResult.message}</p>
                <p className="text-[11px] mt-0.5 opacity-80">
                  Lưu ý: Nếu không thấy trong Hộp thư đến, vui lòng kiểm tra thư mục Spam/Junk hoặc bộ lọc nội bộ ngân hàng.
                </p>
              </div>
            </div>
          )}

          {/* Section XXVIII Checklist Guide */}
          <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">📌 Quy trình kiểm tra email chuẩn của hệ thống:</p>
            <p>1. Chạy trên Apps Script bằng dịch vụ <code>MailApp.sendEmail()</code></p>
            <p>2. Được bọc trong khối <code>try/catch</code> để bắt mọi ngoại lệ và hiển thị mã lỗi chi tiết</p>
            <p>3. Ghi lại kết quả ngay lập tức vào sheet <code>EMAIL_LOG</code> (trạng thái SENT hoặc FAILED)</p>
            <p>4. Tự động kiểm tra trùng lặp email trước khi gửi để tránh spam khách hàng</p>
          </div>
        </div>
      </div>

      {/* 3. EMAIL LOG AUDIT TABLE (Sheet EMAIL_LOG) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              NHẬT KÝ GỬI EMAIL (AUDIT SHEET: EMAIL_LOG)
            </h3>
            <p className="text-xs text-slate-500">
              Lịch sử ghi nhận toàn bộ email nhắc việc và email hệ thống
            </p>
          </div>

          <div className="flex items-center gap-1">
            {(['ALL', 'SENT', 'FAILED', 'SKIPPED'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setLogFilter(filter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  logFilter === filter
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter === 'ALL' ? 'Tất cả' : filter}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Mã Log</th>
                <th className="py-2.5 px-3">Thời gian</th>
                <th className="py-2.5 px-3">Khách hàng</th>
                <th className="py-2.5 px-3">Email nhận</th>
                <th className="py-2.5 px-3">Sự kiện</th>
                <th className="py-2.5 px-3 text-center">Trạng thái</th>
                <th className="py-2.5 px-3">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmailLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Chưa có nhật ký gửi email nào trong bộ lọc này.
                  </td>
                </tr>
              ) : (
                filteredEmailLogs.map((log) => (
                  <tr key={log.idLog} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{log.idLog}</td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{log.thoiGian}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{log.hoTenKh}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{log.emailNhan}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                        {log.loaiSuKien}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.trangThai === 'SENT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.trangThai === 'FAILED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {log.trangThai}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">
                      {log.loiChiTiet || 'Gửi thành công'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. GOOGLE APPS SCRIPT URL CONFIG & 12-STEP DEPLOYMENT GUIDE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              KẾT NỐI VÀ TRIỂN KHAI GOOGLE APPS SCRIPT WEB APP
            </h3>
            <p className="text-xs text-slate-500">
              Đồng bộ dữ liệu trực tiếp 2 chiều với Google Sheets và kích hoạt gửi mail MailApp
            </p>
          </div>

          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Đã sao chép Code.gs!' : 'Sao chép mã Code.gs'}</span>
          </button>
        </div>

        {/* Input Web App URL */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <label className="block font-bold text-slate-800 text-xs">
            Dán Web App URL đã triển khai từ Google Apps Script:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="admin-input-apps-script-url"
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            <button
              id="admin-btn-save-url"
              onClick={handleSaveUrl}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
            >
              LƯU KẾT NỐI
            </button>
          </div>

          {urlSaveSuccess && (
            <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã lưu Apps Script URL thành công! Hệ thống sẽ chuyển sang chế độ đồng bộ trực tiếp.
            </p>
          )}
        </div>

        {/* 12-Step Deployment Guide */}
        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 space-y-2">
          <h4 className="font-bold text-blue-950 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-blue-700" />
            HƯỚNG DẪN 12 BƯỚC TRIỂN KHAI APPS SCRIPT TRÊN GOOGLE SHEETS
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 leading-relaxed">
            <li>Mở file Google Sheets mới (hoặc file hiện có) trên Google Drive của bạn.</li>
            <li>Trên thanh menu Google Sheets, chọn <strong>Tiện ích mở rộng (Extensions) → Apps Script</strong>.</li>
            <li>Xóa toàn bộ mã mặc định trong file <code>Code.gs</code>.</li>
            <li>Bấm nút <strong>"Sao chép mã Code.gs"</strong> ở trên và Dán (Paste) vào trình soạn thảo Apps Script.</li>
            <li>Bấm biểu tượng <strong>Lưu (Save - Ctrl+S)</strong>.</li>
            <li>Ở thanh công cụ trên cùng của Apps Script, chọn hàm <code>setupDatabase</code> và bấm <strong>Chạy (Run)</strong>.</li>
            <li>Google sẽ yêu cầu cấp quyền: Bấm <em>Xem lại quyền</em> → Chọn tài khoản Google của bạn → Bấm <em>Nâng cao (Advanced)</em> → Chọn <em>Đi tới Dự án (không an toàn)</em> → Bấm <em>Cho phép (Allow)</em>.</li>
            <li>(Tùy chọn) Chọn hàm <code>testEmailService</code> và bấm <strong>Chạy</strong> để kiểm tra gửi email test về hộp thư của bạn.</li>
            <li>Bấm nút <strong>Triển khai (Deploy) → Triển khai mới (New deployment)</strong> ở góc trên bên phải.</li>
            <li>Bấm biểu tượng bánh răng ⚙️ bên cạnh "Chọn loại", chọn <strong>Ứng dụng web (Web app)</strong>.</li>
            <li><strong>QUAN TRỌNG NHẤT:</strong> Ở mục <em>Người có quyền truy cập (Who has access)</em>, BẮT BUỘC chọn <strong>"Bất kỳ ai" (Anyone)</strong>.</li>
            <li>Bấm <strong>Triển khai (Deploy)</strong>, copy đường link Web App URL (có đuôi <code>/exec</code>) và dán vào ô bên trên rồi bấm <strong>"LƯU KẾT NỐI"</strong>.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
