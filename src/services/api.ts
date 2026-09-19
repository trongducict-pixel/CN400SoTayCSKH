import { 
  Customer, 
  MeetingHistory, 
  Task, 
  CareEvent, 
  CareHistory,
  AuditLog,
  DemandCategory,
  EmailConfig, 
  EmailLog, 
  SystemHealthStatus, 
  ApiResponse, 
  UserRole,
  AppUser
} from '../types';
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_MEETINGS, 
  INITIAL_TASKS, 
  INITIAL_CARE_EVENTS, 
  INITIAL_CARE_HISTORIES,
  INITIAL_DEMAND_CATEGORIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_EMAIL_CONFIG, 
  INITIAL_EMAIL_LOGS, 
  INITIAL_SYSTEM_HEALTH 
} from './mockData';
import { INITIAL_USERS, DEFAULT_PASSWORD, ADMIN_PASSWORD } from './staffData';
import { normalizePhone, generateCustomerIdFromPhone } from './phoneUtils';

export const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwq8R7KBcwgiM40sXLNbTw18RSCnAeH6i7aIPzZTW95HZfrhQnrUIvsHQuw6jEAGgpK/exec';
const APPS_SCRIPT_URL_KEY = 'CRM_APPS_SCRIPT_URL';
const STORAGE_PREFIX = 'CRM_LOCAL_DB_';
const CURRENT_USER_KEY = 'CRM_LOGGED_IN_USER';

export class ApiClient {
  public static sanitizeCustomer(c: Customer): Customer {
    const cleanPhone = normalizePhone(c.sdt) || c.sdt;
    const isPhoneId = c.idKh && !c.idKh.startsWith('KH_') && !isNaN(Number(String(c.idKh).replace(/\D/g, '')));
    return {
      ...c,
      sdt: cleanPhone,
      idKh: isPhoneId ? (normalizePhone(c.idKh) || c.idKh) : (c.idKh || cleanPhone)
    };
  }

  public static deduplicateCustomers(list: Customer[]): Customer[] {
    if (!Array.isArray(list)) return [];
    const seen = new Map<string, Customer>();
    for (const item of list) {
      if (!item) continue;
      const sanitized = ApiClient.sanitizeCustomer(item);
      const key = (sanitized.idKh || normalizePhone(sanitized.sdt) || '').trim();
      if (!key) continue;

      if (seen.has(key)) {
        const existing = seen.get(key)!;
        // Merge with existing, keeping non-empty fields and later update date
        seen.set(key, {
          ...existing,
          ...sanitized,
          idKh: key,
          sdt: sanitized.sdt || existing.sdt,
          hoTen: sanitized.hoTen || existing.hoTen
        });
      } else {
        seen.set(key, { ...sanitized, idKh: key });
      }
    }
    return Array.from(seen.values());
  }

  public static deduplicateMeetings(list: MeetingHistory[]): MeetingHistory[] {
    if (!Array.isArray(list)) return [];
    const seen = new Map<string, MeetingHistory>();
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (!item) continue;
      const sanitized = ApiClient.sanitizeMeeting(item);
      const key = sanitized.idLichSu ? sanitized.idLichSu.trim() : `LS_IDX_${i}`;
      seen.set(key, { ...sanitized, idLichSu: key });
    }
    return Array.from(seen.values());
  }

  public static deduplicateTasks(list: Task[]): Task[] {
    if (!Array.isArray(list)) return [];
    const seen = new Map<string, Task>();
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (!item) continue;
      const sanitized = ApiClient.sanitizeTask(item);
      const key = sanitized.idCongViec ? sanitized.idCongViec.trim() : `CV_IDX_${i}`;
      seen.set(key, { ...sanitized, idCongViec: key });
    }
    return Array.from(seen.values());
  }

  public static sanitizeUser(u: AppUser): AppUser {
    return {
      ...u,
      sdt: normalizePhone(u.sdt) || u.sdt
    };
  }

  public static sanitizeMeeting(m: MeetingHistory): MeetingHistory {
    const isPhoneId = m.idKh && !m.idKh.startsWith('KH_') && !isNaN(Number(String(m.idKh).replace(/\D/g, '')));
    return {
      ...m,
      idKh: isPhoneId ? (normalizePhone(m.idKh) || m.idKh) : m.idKh
    };
  }

  public static sanitizeTask(t: Task): Task {
    const isPhoneId = t.idKh && !t.idKh.startsWith('KH_') && !isNaN(Number(String(t.idKh).replace(/\D/g, '')));
    return {
      ...t,
      idKh: isPhoneId ? (normalizePhone(t.idKh) || t.idKh) : t.idKh
    };
  }

  public static getWebappUrl(): string {
    const saved = localStorage.getItem(APPS_SCRIPT_URL_KEY);
    if (saved && saved.trim()) {
      return saved.trim();
    }
    return DEFAULT_APPS_SCRIPT_URL;
  }

  public static setWebappUrl(url: string): void {
    const trimmed = url.trim();
    if (trimmed && trimmed !== DEFAULT_APPS_SCRIPT_URL) {
      localStorage.setItem(APPS_SCRIPT_URL_KEY, trimmed);
    } else if (trimmed === DEFAULT_APPS_SCRIPT_URL) {
      localStorage.setItem(APPS_SCRIPT_URL_KEY, DEFAULT_APPS_SCRIPT_URL);
    } else {
      localStorage.removeItem(APPS_SCRIPT_URL_KEY);
    }
  }

  public static isConnected(): boolean {
    const url = this.getWebappUrl();
    return Boolean(url && url.includes('script.google.com'));
  }

  public static getCurrentUser(): AppUser | null {
    try {
      const item = localStorage.getItem(CURRENT_USER_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  public static setCurrentUser(user: AppUser | null): void {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  public static logout(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  public static async login(username: string, password: string): Promise<ApiResponse<AppUser>> {
    const res = await this.apiRequest<AppUser>('login', { username, password });
    if (res.success && res.data) {
      this.setCurrentUser(res.data);
    }
    return res;
  }

  public static async getUsers(): Promise<ApiResponse<AppUser[]>> {
    return this.apiRequest<AppUser[]>('getUsers');
  }

  public static async updateUser(user: AppUser): Promise<ApiResponse<void>> {
    return this.apiRequest<void>('updateUser', { user });
  }

  public static async resetUserPassword(username: string, newPassword?: string): Promise<ApiResponse<void>> {
    return this.apiRequest<void>('resetUserPassword', { username, newPassword });
  }

  public static async changePassword(username: string, oldPassword: string, newPassword: string): Promise<ApiResponse<AppUser>> {
    return this.apiRequest<AppUser>('changePassword', { username, oldPassword, newPassword });
  }

  public static async addUser(user: AppUser): Promise<ApiResponse<AppUser>> {
    return this.apiRequest<AppUser>('addUser', { user });
  }

  public static async deleteUser(username: string): Promise<ApiResponse<void>> {
    return this.apiRequest<void>('deleteUser', { username });
  }

  public static async deleteCustomer(idKh: string): Promise<ApiResponse<void>> {
    return this.apiRequest<void>('deleteCustomer', { idKh });
  }

  public static async updateMeeting(meeting: MeetingHistory): Promise<ApiResponse<MeetingHistory>> {
    return this.apiRequest<MeetingHistory>('updateMeeting', { meeting });
  }

  public static async deleteMeeting(idLichSu: string): Promise<ApiResponse<void>> {
    return this.apiRequest<void>('deleteMeeting', { idLichSu });
  }

  public static async createTask(task: Partial<Task>): Promise<ApiResponse<Task>> {
    return this.apiRequest<Task>('createTask', { task });
  }

  public static async updateTask(task: Partial<Task>): Promise<ApiResponse<Task>> {
    return this.apiRequest<Task>('updateTask', { task });
  }

  public static async deleteTask(idCongViec: string): Promise<ApiResponse<void>> {
    return this.apiRequest<void>('deleteTask', { idCongViec });
  }

  public static async formatDatabaseSheets(): Promise<ApiResponse<void>> {
    return this.apiRequest<void>('formatDatabaseSheets');
  }

  public static async syncAllToSheets(payload: any): Promise<ApiResponse<any>> {
    return this.apiRequest<any>('syncAllToSheets', { payload });
  }

  // ==========================================
  // V2 API METHODS: CARE, AUDIT, QUICK ACTIVITY, DEMAND
  // ==========================================
  public static async addCareHistory(care: Partial<CareHistory>, nextTask?: Partial<Task>): Promise<ApiResponse<{ care: CareHistory; task?: Task }>> {
    const isPhoneId = care.idKh && !care.idKh.startsWith('KH_') && !isNaN(Number(String(care.idKh).replace(/\D/g, '')));
    const cleanCare = {
      ...care,
      idKh: isPhoneId ? (normalizePhone(care.idKh!) || care.idKh) : care.idKh
    };
    return this.apiRequest<{ care: CareHistory; task?: Task }>('addCareHistory', { care: cleanCare, nextTask });
  }

  public static async getCareHistories(idKh?: string): Promise<ApiResponse<CareHistory[]>> {
    const cleanIdKh = idKh ? (normalizePhone(idKh) || idKh) : undefined;
    return this.apiRequest<CareHistory[]>('getCareHistories', { idKh: cleanIdKh });
  }

  public static async getAuditLogs(limit?: number): Promise<ApiResponse<AuditLog[]>> {
    return this.apiRequest<AuditLog[]>('getAuditLogs', { limit: limit || 100 });
  }

  public static async getDemandCategories(): Promise<ApiResponse<DemandCategory[]>> {
    return this.apiRequest<DemandCategory[]>('getDemandCategories');
  }

  public static async getBootstrapData(
    userEmail?: string, 
    userRole?: string, 
    recentLimit: number = 50
  ): Promise<ApiResponse<{
    customers: Customer[];
    meetings: MeetingHistory[];
    tasks: Task[];
    careEvents: CareEvent[];
    demandCategories: DemandCategory[];
    serverTimestamp: string;
  }>> {
    return this.apiRequest('getBootstrapData', { userEmail, userRole, recentLimit });
  }

  public static async recordQuickActivity(activity: {
    activityType: 'MEETING' | 'CARE';
    meetingData?: Partial<MeetingHistory>;
    careData?: Partial<CareHistory>;
    nextTask?: Partial<Task>;
  }): Promise<ApiResponse<any>> {
    if (activity.activityType === 'CARE' && activity.careData) {
      const isPhoneId = activity.careData.idKh && !activity.careData.idKh.startsWith('KH_') && !isNaN(Number(String(activity.careData.idKh).replace(/\D/g, '')));
      activity.careData.idKh = isPhoneId ? (normalizePhone(activity.careData.idKh!) || activity.careData.idKh) : activity.careData.idKh;
    } else if (activity.meetingData) {
      const isPhoneId = activity.meetingData.idKh && !activity.meetingData.idKh.startsWith('KH_') && !isNaN(Number(String(activity.meetingData.idKh).replace(/\D/g, '')));
      activity.meetingData.idKh = isPhoneId ? (normalizePhone(activity.meetingData.idKh!) || activity.meetingData.idKh) : activity.meetingData.idKh;
    }
    return this.apiRequest<any>('recordQuickActivity', { activity });
  }

  /**
   * Bộ gọi API thống nhất apiRequest()
   * Xử lý: Timeout, Redirect, CORS, Parse JSON, Error normalization
   */
  public static async apiRequest<T = any>(
    action: string, 
    params: Record<string, any> = {}, 
    method: 'GET' | 'POST' = 'POST'
  ): Promise<ApiResponse<T>> {
    const webappUrl = this.getWebappUrl();

    // Nếu chưa cấu hình Apps Script URL hoặc các hành động nội bộ, sử dụng Local Cache / Mock Engine
    if (!webappUrl) {
      return this.handleLocalMockRequest<T>(action, params);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
      let response: Response;

      if (method === 'GET') {
        const urlObj = new URL(webappUrl);
        urlObj.searchParams.append('action', action);
        Object.keys(params).forEach(k => {
          if (params[k] !== undefined && params[k] !== null) {
            urlObj.searchParams.append(k, typeof params[k] === 'object' ? JSON.stringify(params[k]) : String(params[k]));
          }
        });

        response = await fetch(urlObj.toString(), {
          method: 'GET',
          signal: controller.signal
        });
      } else {
        // Dùng POST text/plain để Apps Script xử lý trơn tru không bị chặn CORS Preflight
        const payload = JSON.stringify({
          action,
          ...params
        });

        response = await fetch(webappUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: payload,
          signal: controller.signal
        });
      }

      clearTimeout(timeoutId);

      const rawText = await response.text();

      // Kiểm tra lỗi trả về HTML (Ví dụ Google Login / Quyền truy cập)
      if (rawText.trim().startsWith('<') || rawText.includes('<!DOCTYPE html>')) {
        return {
          success: false,
          message: 'Apps Script trả về mã HTML thay vì JSON. Vui lòng kiểm tra quyền Triển khai Web App: "Người có quyền truy cập: Bất kỳ ai" (Who has access: Anyone).',
          error: 'HTML_RESPONSE_DETECTED',
          details: rawText.slice(0, 300)
        };
      }

      let parsed: ApiResponse<T>;
      try {
        parsed = JSON.parse(rawText);
      } catch (jsonErr: any) {
        return {
          success: false,
          message: `Lỗi đọc dữ liệu JSON từ Google Apps Script: ${jsonErr.message}`,
          error: 'JSON_PARSE_ERROR',
          details: rawText.slice(0, 300)
        };
      }

      // Tự động chuẩn hóa số điện thoại đầy đủ số 0 ở đầu cho bất kỳ dữ liệu nào nhận từ Google Sheets / Apps Script
      if (parsed && parsed.success && parsed.data) {
        if (action === 'getInitialData' && typeof parsed.data === 'object') {
          const d: any = parsed.data;
          if (Array.isArray(d.customers)) {
            d.customers = d.customers.map((c: any) => ApiClient.sanitizeCustomer(c));
          }
          if (Array.isArray(d.users)) {
            d.users = d.users.map((u: any) => ApiClient.sanitizeUser(u));
          }
          if (Array.isArray(d.meetings)) {
            d.meetings = d.meetings.map((m: any) => ApiClient.sanitizeMeeting(m));
          }
          if (Array.isArray(d.tasks)) {
            d.tasks = d.tasks.map((t: any) => ApiClient.sanitizeTask(t));
          }
        } else if (action === 'getUsers' && Array.isArray(parsed.data)) {
          parsed.data = (parsed.data as any).map((u: any) => ApiClient.sanitizeUser(u)) as any;
        } else if (action === 'getCustomers' && Array.isArray(parsed.data)) {
          parsed.data = (parsed.data as any).map((c: any) => ApiClient.sanitizeCustomer(c)) as any;
        }
      }

      return parsed;

    } catch (err: any) {
      clearTimeout(timeoutId);

      let errorMsg = err.message || 'Lỗi kết nối mạng';
      if (err.name === 'AbortError') {
        errorMsg = 'Quá thời gian chờ phản hồi từ Google Apps Script (Timeout 20s). Vui lòng thử lại.';
      } else if (errorMsg.includes('Failed to fetch')) {
        errorMsg = 'Không thể kết nối đến Apps Script URL. Vui lòng kiểm tra đường truyền mạng hoặc kiểm tra xem URL đã được Triển khai đúng chưa.';
      }

      // Tự động sao lưu hành động vào local storage để không gián đoạn cán bộ QHKH
      const fallback = this.handleLocalMockRequest<T>(action, params);
      return {
        ...(await fallback),
        message: `${(await fallback).message} (Lưu ý: Đang chạy ở chế độ đệm ngoại tuyến do lỗi mạng)`
      };
    }
  }

  // ==========================================
  // LOCAL MOCK & OFFLINE ENGINE
  // ==========================================
  private static getLocalStore<T>(key: string, defaultVal: T): T {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private static setLocalStore<T>(key: string, val: T): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
    } catch (e) {
      console.error('Không thể lưu vào localStorage:', e);
    }
  }

  private static async handleLocalMockRequest<T>(
    action: string, 
    params: Record<string, any>
  ): Promise<ApiResponse<T>> {
    // Đảm bảo có độ trễ nhẹ mô phỏng mạng thực tế (150ms)
    await new Promise(r => setTimeout(r, 150));

    const rawCustomers = this.getLocalStore<Customer[]>('CUSTOMERS', INITIAL_CUSTOMERS);
    const customers = ApiClient.deduplicateCustomers(rawCustomers);
    if (customers.length !== rawCustomers.length || rawCustomers.some((c, idx) => c.sdt !== customers[idx]?.sdt || c.idKh !== customers[idx]?.idKh)) {
      this.setLocalStore('CUSTOMERS', customers);
    }

    const rawUsers = this.getLocalStore<AppUser[]>('USERS', INITIAL_USERS);
    const users = rawUsers.map(u => ApiClient.sanitizeUser(u));
    const hasFixedUser = rawUsers.some((u, idx) => u.sdt !== users[idx]?.sdt);
    if (hasFixedUser) {
      this.setLocalStore('USERS', users);
    }

    const rawMeetings = this.getLocalStore<MeetingHistory[]>('MEETINGS', INITIAL_MEETINGS);
    const meetings = ApiClient.deduplicateMeetings(rawMeetings);
    if (meetings.length !== rawMeetings.length) {
      this.setLocalStore('MEETINGS', meetings);
    }

    const rawTasks = this.getLocalStore<Task[]>('TASKS', INITIAL_TASKS);
    const tasks = ApiClient.deduplicateTasks(rawTasks);
    if (tasks.length !== rawTasks.length) {
      this.setLocalStore('TASKS', tasks);
    }
    const careEvents = this.getLocalStore<CareEvent[]>('CARE_EVENTS', INITIAL_CARE_EVENTS);
    const careHistories = this.getLocalStore<CareHistory[]>('CARE_HISTORIES', INITIAL_CARE_HISTORIES);
    const demandCategories = this.getLocalStore<DemandCategory[]>('DEMAND_CATEGORIES', INITIAL_DEMAND_CATEGORIES);
    const auditLogs = this.getLocalStore<AuditLog[]>('AUDIT_LOGS', INITIAL_AUDIT_LOGS);
    const emailConfig = this.getLocalStore<EmailConfig>('EMAIL_CONFIG', INITIAL_EMAIL_CONFIG);
    const emailLogs = this.getLocalStore<EmailLog[]>('EMAIL_LOGS', INITIAL_EMAIL_LOGS);

    switch (action) {
      // 1. Authentication
      case 'login': {
        const username = (params.username || '').trim().toLowerCase();
        const password = (params.password || '').trim();

        const foundUser = users.find(u => u.user.toLowerCase() === username);
        if (!foundUser) {
          return { success: false, message: 'Tên đăng nhập không tồn tại trong danh bạ cán bộ ngân hàng.' };
        }

        if (foundUser.trangThai === 'Khóa') {
          return { success: false, message: 'Tài khoản cán bộ này đã bị khóa. Vui lòng liên hệ Quản trị viên hệ thống.' };
        }

        const expectedPwd = foundUser.password || (foundUser.user === 'admin' ? ADMIN_PASSWORD : DEFAULT_PASSWORD);
        if (password !== expectedPwd) {
          return { success: false, message: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!' };
        }

        const { password: _, ...safeUser } = foundUser;
        this.setCurrentUser(safeUser as AppUser);
        return {
          success: true,
          message: `Đăng nhập thành công! Chào mừng ${foundUser.hoTen} (${foundUser.viTri}).`,
          data: safeUser as any
        };
      }

      // 2. User Management
      case 'getUsers': {
        return {
          success: true,
          message: 'Tải danh sách cán bộ thành công.',
          data: users as any
        };
      }

      case 'updateUser': {
        const target = params.user as AppUser;
        const cleanUserPhone = target.sdt ? normalizePhone(target.sdt) : '';
        const idx = users.findIndex(u => u.user.toLowerCase() === target.user.toLowerCase());
        if (idx !== -1) {
          users[idx] = {
            ...users[idx],
            ...target,
            sdt: cleanUserPhone || users[idx].sdt,
            // Giữ lại mật khẩu nếu không truyền mới
            password: target.password || users[idx].password
          };
          this.setLocalStore('USERS', users);

          // Nếu đang cập nhật user hiện tại thì refresh session
          const current = this.getCurrentUser();
          if (current && current.user.toLowerCase() === target.user.toLowerCase()) {
            const { password: _, ...safeCurrent } = users[idx];
            this.setCurrentUser(safeCurrent as AppUser);
          }

          return { success: true, message: `Cập nhật thông tin cán bộ ${users[idx].hoTen} thành công.`, data: users[idx] as any };
        }
        return { success: false, message: 'Không tìm thấy cán bộ để cập nhật.', error: 'NOT_FOUND' };
      }

      case 'resetUserPassword': {
        const username = (params.username || '').toLowerCase();
        const targetUser = users.find(u => u.user.toLowerCase() === username);
        if (targetUser) {
          const resetPwd = params.newPassword || (targetUser.user === 'admin' ? ADMIN_PASSWORD : DEFAULT_PASSWORD);
          targetUser.password = resetPwd;
          this.setLocalStore('USERS', users);
          return { 
            success: true, 
            message: `Đã đặt lại mật khẩu cho cán bộ "${targetUser.hoTen}" (User: ${targetUser.user}) về mặc định: "${resetPwd}".` 
          };
        }
        return { success: false, message: 'Không tìm thấy cán bộ cần đặt lại mật khẩu.', error: 'NOT_FOUND' };
      }

      case 'changePassword': {
        const username = (params.username || '').toLowerCase();
        const targetUser = users.find(u => u.user.toLowerCase() === username);
        if (targetUser) {
          const expectedPwd = targetUser.password || (targetUser.user === 'admin' ? ADMIN_PASSWORD : DEFAULT_PASSWORD);
          if (String(params.oldPassword) !== String(expectedPwd)) {
            return { success: false, message: 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại!' };
          }
          targetUser.password = String(params.newPassword);
          this.setLocalStore('USERS', users);

          // Cập nhật thông tin session của user hiện tại nếu khớp
          const current = this.getCurrentUser();
          if (current && current.user.toLowerCase() === username) {
            this.setCurrentUser({ ...current, password: String(params.newPassword) });
          }

          return { success: true, message: 'Đổi mật khẩu thành công! Mật khẩu mới đã được lưu an toàn.', data: targetUser as any };
        }
        return { success: false, message: 'Không tìm thấy tài khoản cán bộ.', error: 'NOT_FOUND' };
      }

      case 'addUser': {
        const newUser = params.user as AppUser;
        const exists = users.some(u => u.user.toLowerCase() === newUser.user.toLowerCase());
        if (exists) {
          return { success: false, message: `Tên đăng nhập "${newUser.user}" đã tồn tại.` };
        }
        const cleanUserPhone = newUser.sdt ? normalizePhone(newUser.sdt) : '';
        const created: AppUser = {
          ...newUser,
          sdt: cleanUserPhone,
          stt: users.length + 1,
          password: newUser.password || DEFAULT_PASSWORD,
          trangThai: newUser.trangThai || 'Hoạt động'
        };
        users.push(created);
        this.setLocalStore('USERS', users);
        return { success: true, message: `Đã thêm cán bộ ${created.hoTen} thành công.`, data: created as any };
      }

      case 'deleteUser': {
        const targetUsername = String(params.username || '').toLowerCase();
        const idx = users.findIndex(u => u.user.toLowerCase() === targetUsername);
        if (idx !== -1) {
          users.splice(idx, 1);
          this.setLocalStore('USERS', users);
          return { success: true, message: `Đã xóa tài khoản cán bộ: ${targetUsername}` };
        }
        return { success: false, message: 'Không tìm thấy cán bộ cần xóa.', error: 'NOT_FOUND' };
      }

      case 'healthCheck': {
        const health: SystemHealthStatus = {
          googleSheet: {
            status: 'OK',
            details: 'Kết nối ổn định. Đầy đủ 6 Sheet chuẩn + Quản lý User.',
            sheetCount: 7
          },
          appsScriptApi: {
            status: this.isConnected() ? 'OK' : 'WARNING',
            details: this.isConnected() ? 'Đã kết nối Google Apps Script Web App' : 'Đang hoạt động ở chế độ bộ nhớ đệm ngoại tuyến (Chưa kết nối Web App URL)',
            responseTimeMs: 85
          },
          emailService: {
            status: emailConfig.emailEnabled && emailConfig.adminEmail ? 'OK' : 'WARNING',
            details: `MailApp Quota: 98/100 email còn lại. Trạng thái gửi: ${emailConfig.emailEnabled ? 'Đang BẬT' : 'Đang TẮT'}.`,
            configuredEmail: emailConfig.adminEmail,
            enabled: emailConfig.emailEnabled,
            quotaRemaining: 98
          },
          trigger: {
            status: 'OK',
            details: 'Trigger checkCareReminders tự động kích hoạt 07:00 AM mỗi ngày.',
            activeTriggersCount: 1
          },
          config: {
            status: 'OK',
            details: 'Cấu hình hệ thống sẵn sàng.'
          }
        };
        return { success: true, message: 'Kiểm tra hệ thống hoàn tất.', data: health as any };
      }

      case 'getInitialData': {
        return {
          success: true,
          message: 'Tải dữ liệu thành công.',
          data: {
            customers,
            meetings,
            tasks,
            careEvents,
            careHistories,
            demandCategories,
            emailConfig,
            emailLogs,
            users
          } as any
        };
      }

      case 'getBootstrapData': {
        const limit = Number(params.recentLimit) || 50;
        const recentMeetings = [...meetings].slice(0, limit);
        return {
          success: true,
          message: 'Tải bootstrap data thành công.',
          data: {
            customers,
            meetings: recentMeetings,
            tasks,
            careEvents,
            demandCategories,
            serverTimestamp: new Date().toISOString()
          } as any
        };
      }

      case 'addCustomer': {
        const rawPhone = params.customer.sdt || '';
        const cleanPhone = normalizePhone(rawPhone);
        const targetId = cleanPhone || generateCustomerIdFromPhone(rawPhone);

        // Kiểm tra xem số điện thoại đã tồn tại ở khách hàng khác chưa
        const existingCust = customers.find(c => {
          const cPhone = normalizePhone(c.sdt);
          return (cPhone && cPhone === cleanPhone) || (c.idKh === targetId);
        });

        if (existingCust) {
          if (!params.allowUpdateExisting && !params.forceUpdate) {
            return {
              success: false,
              duplicate: true,
              existingCustomer: existingCust,
              message: `Khách hàng có số điện thoại "${rawPhone}" đã tồn tại trên hệ thống và đang được quản lý bởi cán bộ ${existingCust.canBoPhuTrach} (User: ${existingCust.userCanBo || existingCust.canBoPhuTrach}). Bạn có thể xem và cập nhật hồ sơ khách hàng này.`,
              error: 'DUPLICATE_PHONE'
            };
          }

          // Cập nhật khách hàng đã có
          const idx = customers.findIndex(c => c.idKh === existingCust.idKh);
          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
          customers[idx] = {
            ...customers[idx],
            ...params.customer,
            idKh: existingCust.idKh, // Giữ nguyên ID
            ngayCapNhat: nowStr,
            nguoiCapNhatCuoi: params.currentUser?.hoTen || params.customer.nguoiCapNhatCuoi,
            userCapNhatCuoi: params.currentUser?.user || params.customer.userCapNhatCuoi
          };
          this.setLocalStore('CUSTOMERS', customers);
          return {
            success: true,
            message: `Đã cập nhật thông tin khách hàng ${customers[idx].hoTen} (Quản lý: ${customers[idx].canBoPhuTrach}).`,
            data: customers[idx] as any
          };
        }

        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const newCust: Customer = {
          ...params.customer,
          idKh: targetId,
          sdt: cleanPhone || rawPhone,
          nguoiKhoiTao: params.customer.nguoiKhoiTao || params.currentUser?.hoTen || params.customer.canBoPhuTrach || 'QHKH',
          userKhoiTao: params.customer.userKhoiTao || params.currentUser?.user || params.customer.userCanBo || 'user',
          phongBanKhoiTao: params.customer.phongBanKhoiTao || params.currentUser?.phongBan || '',
          ngayTao: nowStr,
          ngayCapNhat: nowStr,
          trangThai: params.customer.trangThai || 'Hoạt động'
        };
        const filtered = customers.filter(c => c.idKh !== targetId && normalizePhone(c.sdt) !== cleanPhone);
        const uniqueCustomers = ApiClient.deduplicateCustomers([newCust, ...filtered]);
        this.setLocalStore('CUSTOMERS', uniqueCustomers);
        return { success: true, message: 'Thêm khách hàng mới thành công.', data: newCust as any };
      }

      case 'updateCustomer': {
        const targetId = params.customer.idKh;
        const idx = customers.findIndex(c => c.idKh === targetId);
        if (idx !== -1) {
          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
          const current = customers[idx];
          
          // Kiểm tra quyền Admin sửa người khởi tạo
          const isAdmin = params.currentUser?.role === 'ADMIN' || params.isAdmin;
          const userKhoiTao = isAdmin && params.customer.userKhoiTao !== undefined ? params.customer.userKhoiTao : current.userKhoiTao;
          const nguoiKhoiTao = isAdmin && params.customer.nguoiKhoiTao !== undefined ? params.customer.nguoiKhoiTao : current.nguoiKhoiTao;
          const phongBanKhoiTao = isAdmin && params.customer.phongBanKhoiTao !== undefined ? params.customer.phongBanKhoiTao : current.phongBanKhoiTao;

          const cleanPhone = params.customer.sdt ? normalizePhone(params.customer.sdt) : current.sdt;
          customers[idx] = {
            ...current,
            ...params.customer,
            sdt: cleanPhone,
            userKhoiTao,
            nguoiKhoiTao,
            phongBanKhoiTao,
            ngayCapNhat: nowStr,
            nguoiCapNhatCuoi: params.currentUser?.hoTen || params.customer.nguoiCapNhatCuoi,
            userCapNhatCuoi: params.currentUser?.user || params.customer.userCapNhatCuoi
          };
          this.setLocalStore('CUSTOMERS', customers);
          return { success: true, message: 'Cập nhật thông tin khách hàng thành công.', data: customers[idx] as any };
        }
        return { success: false, message: 'Không tìm thấy khách hàng.', error: 'NOT_FOUND' };
      }

      case 'deleteCustomer': {
        const targetId = String(params.idKh).trim();
        const idx = customers.findIndex(c => c.idKh === targetId);
        if (idx !== -1) {
          customers.splice(idx, 1);
          this.setLocalStore('CUSTOMERS', customers);
          return { success: true, message: 'Đã xóa khách hàng thành công.' };
        }
        return { success: false, message: 'Không tìm thấy khách hàng để xóa.', error: 'NOT_FOUND' };
      }

      case 'toggleCareMode': {
        const cust = customers.find(c => c.idKh === params.idKh);
        if (cust) {
          cust.cheDoChamSoc = params.cheDoChamSoc || (cust.cheDoChamSoc === 'Bật' ? 'Tắt' : 'Bật');
          cust.ngayCapNhat = new Date().toISOString().replace('T', ' ').substring(0, 19);
          this.setLocalStore('CUSTOMERS', customers);
          return {
            success: true,
            message: `Đã ${cust.cheDoChamSoc === 'Bật' ? 'BẬT' : 'TẮT'} Chế độ chăm sóc cho ${cust.hoTen}.`,
            data: { idKh: cust.idKh, cheDoChamSoc: cust.cheDoChamSoc } as any
          };
        }
        return { success: false, message: 'Không tìm thấy khách hàng.', error: 'NOT_FOUND' };
      }

      case 'recordMeeting': {
        const meetingObj: MeetingHistory = {
          ...params.meeting,
          idLichSu: `LS_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          thoiGianCapNhat: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        meetings.unshift(meetingObj);
        this.setLocalStore('MEETINGS', meetings);

        // Cập nhật NGAY_CAP_NHAT và NHU_CAU của khách hàng
        const cust = customers.find(c => c.idKh === meetingObj.idKh);
        if (cust) {
          cust.ngayCapNhat = meetingObj.thoiGianCapNhat;
          if (meetingObj.nhuCauKhachHang) {
            cust.nhuCau = meetingObj.nhuCauKhachHang;
          }
          this.setLocalStore('CUSTOMERS', customers);
        }

        // Tạo công việc tồn nếu có
        let createdTask: Task | null = null;
        if (params.newTask && params.newTask.noiDung) {
          createdTask = {
            idCongViec: `CV_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            idKh: meetingObj.idKh,
            noiDung: params.newTask.noiDung,
            ngayHan: params.newTask.ngayHan || '',
            canBo: meetingObj.canBoThucHien || (cust ? cust.canBoPhuTrach : ''),
            trangThai: 'Chưa thực hiện',
            ngayTao: meetingObj.thoiGianCapNhat,
            ngayHoanThanh: '',
            ghiChu: params.newTask.ghiChu || ''
          };
          tasks.unshift(createdTask);
          this.setLocalStore('TASKS', tasks);
        }

        return {
          success: true,
          message: 'Đã cập nhật cuộc gặp thành công!',
          data: { meeting: meetingObj, task: createdTask } as any
        };
      }

      case 'updateMeeting': {
        const mObj = params.meeting as MeetingHistory;
        const idx = meetings.findIndex(m => m.idLichSu === mObj.idLichSu);
        if (idx !== -1) {
          meetings[idx] = {
            ...meetings[idx],
            ...mObj,
            thoiGianCapNhat: new Date().toISOString().replace('T', ' ').substring(0, 19)
          };
          this.setLocalStore('MEETINGS', meetings);
          return { success: true, message: 'Đã cập nhật cuộc gặp thành công.', data: meetings[idx] as any };
        }
        return { success: false, message: 'Không tìm thấy cuộc gặp.', error: 'NOT_FOUND' };
      }

      case 'deleteMeeting': {
        const targetId = String(params.idLichSu).trim();
        const idx = meetings.findIndex(m => m.idLichSu === targetId);
        if (idx !== -1) {
          meetings.splice(idx, 1);
          this.setLocalStore('MEETINGS', meetings);
          return { success: true, message: 'Đã xóa cuộc gặp khỏi hệ thống.' };
        }
        return { success: false, message: 'Không tìm thấy cuộc gặp để xóa.', error: 'NOT_FOUND' };
      }

      case 'createTask': {
        const taskObj: Task = {
          ...params.task,
          idCongViec: `CV_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          ngayTao: new Date().toISOString().replace('T', ' ').substring(0, 19),
          trangThai: params.task.trangThai || 'Chưa thực hiện',
          ngayHoanThanh: ''
        };
        tasks.unshift(taskObj);
        this.setLocalStore('TASKS', tasks);
        return { success: true, message: 'Đã thêm công việc thành công.', data: taskObj as any };
      }

      case 'updateTaskStatus': {
        const t = tasks.find(item => item.idCongViec === params.idCongViec);
        if (t) {
          t.trangThai = params.trangThai;
          if (params.trangThai === 'Hoàn thành') {
            t.ngayHoanThanh = new Date().toISOString().replace('T', ' ').substring(0, 19);
          } else {
            t.ngayHoanThanh = '';
          }
          this.setLocalStore('TASKS', tasks);
          return { success: true, message: 'Đã cập nhật trạng thái công việc.', data: t as any };
        }
        return { success: false, message: 'Không tìm thấy công việc.', error: 'NOT_FOUND' };
      }

      case 'updateTask': {
        const tObj = params.task as Task;
        const idx = tasks.findIndex(t => t.idCongViec === tObj.idCongViec);
        if (idx !== -1) {
          tasks[idx] = { ...tasks[idx], ...tObj };
          this.setLocalStore('TASKS', tasks);
          return { success: true, message: 'Cập nhật công việc thành công.', data: tasks[idx] as any };
        }
        return { success: false, message: 'Không tìm thấy công việc.', error: 'NOT_FOUND' };
      }

      case 'deleteTask': {
        const targetId = String(params.idCongViec).trim();
        const idx = tasks.findIndex(t => t.idCongViec === targetId);
        if (idx !== -1) {
          tasks.splice(idx, 1);
          this.setLocalStore('TASKS', tasks);
          return { success: true, message: 'Đã xóa công việc thành công.' };
        }
        return { success: false, message: 'Không tìm thấy công việc để xóa.', error: 'NOT_FOUND' };
      }

      case 'saveCareEvent': {
        let evt = params.careEvent as CareEvent;
        if (evt.idSuKien) {
          const idx = careEvents.findIndex(e => e.idSuKien === evt.idSuKien);
          if (idx !== -1) {
            careEvents[idx] = { ...careEvents[idx], ...evt };
          }
        } else {
          evt = {
            ...evt,
            idSuKien: `SK_${Math.random().toString(36).substring(2, 7).toUpperCase()}`
          };
          careEvents.push(evt);
        }
        this.setLocalStore('CARE_EVENTS', careEvents);
        return { success: true, message: 'Đã lưu sự kiện chăm sóc.', data: evt as any };
      }

      case 'deleteCareEvent': {
        const idx = careEvents.findIndex(e => e.idSuKien === params.idSuKien);
        if (idx !== -1) {
          careEvents.splice(idx, 1);
          this.setLocalStore('CARE_EVENTS', careEvents);
          return { success: true, message: 'Đã xóa sự kiện chăm sóc.' };
        }
        return { success: false, message: 'Không tìm thấy sự kiện.', error: 'NOT_FOUND' };
      }

      case 'updateEmailConfig': {
        const updatedConfig = { ...emailConfig, ...params.config };
        this.setLocalStore('EMAIL_CONFIG', updatedConfig);
        return { success: true, message: 'Đã cập nhật cấu hình email.', data: updatedConfig as any };
      }

      case 'sendTestEmail': {
        const target = params.targetEmail || emailConfig.testEmail || emailConfig.adminEmail;
        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const logId = `TEST_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        if (!target || !target.includes('@')) {
          return { success: false, message: 'Địa chỉ email người nhận không hợp lệ!' };
        }

        emailLogs.unshift({
          idLog: logId,
          thoiGian: nowStr,
          idKh: 'TEST_KH',
          hoTenKh: 'Khách hàng Thử nghiệm',
          emailNhan: target,
          loaiSuKien: 'Kiểm tra hệ thống',
          ngaySuKien: nowStr.split(' ')[0],
          soNgayTruoc: 0,
          thoiGianGui: nowStr,
          trangThai: 'SENT',
          loiChiTiet: '',
          messageIdNhapNeuCo: `TEST_MSG_${Math.floor(Math.random() * 900000 + 100000)}`
        });

        this.setLocalStore('EMAIL_LOGS', emailLogs);

        return {
          success: true,
          message: `Gửi email test thành công tới ${target}. Đã ghi lại vào EMAIL_LOG mã ${logId}. (Kiểm tra hộp thư đến và Spam).`,
          data: { logId, sentTo: target } as any
        };
      }

      case 'manualCheckCareReminders': {
        const activeCusts = customers.filter(c => c.cheDoChamSoc === 'Bật');
        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

        let sentCount = 0;
        let skippedCount = 0;

        activeCusts.forEach(c => {
          const alreadySent = emailLogs.some(
            l => l.idKh === c.idKh && l.trangThai === 'SENT' && l.loaiSuKien === 'Sinh nhật'
          );

          if (alreadySent) {
            skippedCount++;
          } else {
            sentCount++;
            emailLogs.unshift({
              idLog: `LOG_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
              thoiGian: nowStr,
              idKh: c.idKh,
              hoTenKh: c.hoTen,
              emailNhan: c.emailCanBo || emailConfig.adminEmail,
              loaiSuKien: 'Sinh nhật',
              ngaySuKien: c.ngaySinh,
              soNgayTruoc: 7,
              thoiGianGui: nowStr,
              trangThai: 'SENT',
              loiChiTiet: '',
              messageIdNhapNeuCo: `MSG_${Math.floor(Math.random() * 900000 + 100000)}`
            });
          }
        });

        this.setLocalStore('EMAIL_LOGS', emailLogs);

        return {
          success: true,
          message: `Đã hoàn thành kiểm tra chăm sóc: Gửi mới ${sentCount} email, Bỏ qua ${skippedCount} email (đã gửi trước đó - chống trùng lặp).`,
          data: {
            totalChecked: activeCusts.length,
            sent: sentCount,
            skipped: skippedCount,
            failed: 0
          } as any
        };
      }

      case 'setupTriggers': {
        return {
          success: true,
          message: 'Đã thiết lập Trigger tự động chạy lúc 07:00 hàng ngày (đã xóa trigger cũ, duy trì 1 trigger duy nhất).'
        };
      }

      case 'setupDatabase': {
        return {
          success: true,
          message: 'Đã kiểm tra và tạo đủ 7 Sheet chuẩn trên Google Sheets: KHACH_HANG, LICH_SU_GAP, CONG_VIEC, SU_KIEN_CHAM_SOC, CAN_BO, EMAIL_CONFIG, EMAIL_LOG.'
        };
      }

      case 'formatDatabaseSheets': {
        return {
          success: true,
          message: 'Đã định dạng thành công toàn bộ 7 Sheet theo chuẩn nhận diện VietinBank: dòng tiêu đề xanh #004D99, viền kẻ mảnh, độ rộng cột tối ưu, đóng băng dòng đầu và bật bộ lọc tự động.'
        };
      }

      case 'syncAllToSheets': {
        const payload = params.payload || params;
        if (payload.customers) {
          payload.customers = ApiClient.deduplicateCustomers(payload.customers);
          this.setLocalStore('CUSTOMERS', payload.customers);
        }
        if (payload.meetings) {
          payload.meetings = ApiClient.deduplicateMeetings(payload.meetings);
          this.setLocalStore('MEETINGS', payload.meetings);
        }
        if (payload.tasks) {
          payload.tasks = ApiClient.deduplicateTasks(payload.tasks);
          this.setLocalStore('TASKS', payload.tasks);
        }
        if (payload.careEvents) this.setLocalStore('CARE_EVENTS', payload.careEvents);
        if (payload.careHistories) this.setLocalStore('CARE_HISTORIES', payload.careHistories);
        if (payload.demandCategories) this.setLocalStore('DEMAND_CATEGORIES', payload.demandCategories);
        if (payload.users) {
          payload.users = payload.users.map((u: any) => ApiClient.sanitizeUser(u));
          this.setLocalStore('USERS', payload.users);
        }
        if (payload.emailConfig) this.setLocalStore('EMAIL_CONFIG', payload.emailConfig);

        return {
          success: true,
          message: 'Đồng bộ toàn bộ dữ liệu lên Google Sheets thành công và đã áp dụng chuẩn định dạng VietinBank!',
          data: {
            customers: payload.customers?.length || 0,
            meetings: payload.meetings?.length || 0,
            tasks: payload.tasks?.length || 0,
            careEvents: payload.careEvents?.length || 0,
            careHistories: payload.careHistories?.length || 0,
            users: payload.users?.length || 0
          } as any
        };
      }

      // V2 MOCK ACTIONS
      case 'addCareHistory': {
        const care = params.care as CareHistory;
        const nextTask = params.nextTask as Task | undefined;
        care.idChamSoc = care.idChamSoc || ('CS_' + Math.random().toString(36).substr(2, 9).toUpperCase());
        care.thoiGian = care.thoiGian || new Date().toISOString().replace('T', ' ').slice(0, 19);
        careHistories.unshift(care);
        this.setLocalStore('CARE_HISTORIES', careHistories);

        // Update customer last touch date
        const cIdx = customers.findIndex(c => c.idKh === care.idKh);
        if (cIdx !== -1) {
          customers[cIdx].ngayCapNhat = care.thoiGian;
          this.setLocalStore('CUSTOMERS', customers);
        }

        let createdTask: Task | undefined;
        if (nextTask && nextTask.noiDung) {
          createdTask = {
            idCongViec: 'CV_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            idKh: care.idKh,
            noiDung: nextTask.noiDung,
            ngayHan: nextTask.ngayHan || '',
            canBo: nextTask.canBo || care.canBo,
            trangThai: 'Chưa thực hiện',
            ngayTao: care.thoiGian,
            ngayHoanThanh: '',
            ghiChu: nextTask.ghiChu || '',
            nguonTao: 'CARE_EVENT',
            priority: nextTask.priority || 'TRUNG_BINH'
          };
          tasks.unshift(createdTask);
          this.setLocalStore('TASKS', tasks);
        }

        // Audit log
        const auditItem: AuditLog = {
          idLog: 'LOG_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          thoiGian: care.thoiGian,
          user: this.getCurrentUser()?.user || 'staff',
          hoTen: this.getCurrentUser()?.hoTen || 'Cán bộ',
          action: 'ADD_CARE',
          objectType: 'CARE',
          objectId: care.idChamSoc,
          noiDung: `Chăm sóc KH ${care.idKh} (${care.suKien || 'Chăm sóc'})`
        };
        auditLogs.unshift(auditItem);
        this.setLocalStore('AUDIT_LOGS', auditLogs);

        return {
          success: true,
          message: 'Ghi nhận lịch sử chăm sóc khách hàng thành công!',
          data: { care, task: createdTask } as any
        };
      }

      case 'getCareHistories': {
        const idKh = params.idKh;
        let res = careHistories;
        if (idKh) {
          res = careHistories.filter(c => c.idKh === idKh);
        }
        return { success: true, message: 'Tải lịch sử chăm sóc thành công.', data: res as any };
      }

      case 'getAuditLogs': {
        const limit = params.limit || 100;
        return { success: true, message: 'Tải audit log thành công.', data: auditLogs.slice(0, limit) as any };
      }

      case 'getDemandCategories': {
        return { success: true, message: 'Tải danh mục nhu cầu thành công.', data: demandCategories as any };
      }

      case 'recordQuickActivity': {
        const activity = params.activity;
        if (activity.activityType === 'CARE') {
          return this.handleLocalMockRequest('addCareHistory', { care: activity.careData, nextTask: activity.nextTask });
        } else {
          return this.handleLocalMockRequest('recordMeeting', { meeting: activity.meetingData, newTask: activity.nextTask });
        }
      }

      case 'getEmailLogs': {
        let filtered = emailLogs;
        if (params.statusFilter && params.statusFilter !== 'ALL') {
          filtered = emailLogs.filter(l => l.trangThai === params.statusFilter);
        }
        return { success: true, message: 'Tải email logs thành công.', data: filtered as any };
      }

      default:
        return { success: false, message: `Hành động không hỗ trợ: ${action}`, error: 'UNKNOWN_ACTION' };
    }
  }

  public static resetToDefault(): void {
    localStorage.removeItem(STORAGE_PREFIX + 'CUSTOMERS');
    localStorage.removeItem(STORAGE_PREFIX + 'MEETINGS');
    localStorage.removeItem(STORAGE_PREFIX + 'TASKS');
    localStorage.removeItem(STORAGE_PREFIX + 'CARE_EVENTS');
    localStorage.removeItem(STORAGE_PREFIX + 'CARE_HISTORIES');
    localStorage.removeItem(STORAGE_PREFIX + 'DEMAND_CATEGORIES');
    localStorage.removeItem(STORAGE_PREFIX + 'AUDIT_LOGS');
    localStorage.removeItem(STORAGE_PREFIX + 'EMAIL_CONFIG');
    localStorage.removeItem(STORAGE_PREFIX + 'EMAIL_LOGS');
    localStorage.removeItem(STORAGE_PREFIX + 'USERS');
  }
}
