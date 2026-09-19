import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Building2, 
  ArrowRight, 
  Sparkles,
  HelpCircle,
  Loader2,
  CheckCircle2,
  Users
} from 'lucide-react';
import { AppUser } from '../types';
import { DEFAULT_PASSWORD, ADMIN_PASSWORD } from '../services/staffData';

interface LoginModalProps {
  isOpen: boolean;
  onLogin: (username: string, password: string) => Promise<boolean>;
  users: AppUser[];
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLogin,
  users,
  onClose
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Vui lòng nhập tên đăng nhập cán bộ.');
      return;
    }
    if (!password) {
      setErrorMsg('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const success = await onLogin(username.trim(), password);
      if (!success) {
        setErrorMsg('Sai tên đăng nhập hoặc mật khẩu.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (quickUser: string, quickPwd: string) => {
    setUsername(quickUser);
    setPassword(quickPwd);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Banner Header */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6 text-white text-center relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Đóng"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <div className="h-14 px-3 py-1 bg-white rounded-2xl mx-auto mb-3 shadow-md flex items-center justify-center inline-flex">
            <img 
              src="https://raw.githubusercontent.com/giadinhbanker/anh-super-app-bac-phu-tho/main/Logo%20VietinBank.png" 
              alt="VietinBank" 
              className="h-10 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-sm sm:text-base font-black tracking-tight uppercase">
            SỔ TAY CHĂM SÓC KHÁCH HÀNG
          </h2>
          <p className="text-[11px] text-blue-200 mt-0.5 font-medium">
            Quản lý và chăm sóc khách hàng chủ động • CN VietinBank Ninh Bình
          </p>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên đăng nhập (Cột User) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-input-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: ducnt4, thangdx, admin..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật khẩu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-input-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu mặc định: 123"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 text-slate-400 hover:text-slate-600 absolute right-2 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="login-btn-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-700/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>ĐĂNG NHẬP VÀO HỆ THỐNG</span>
            </button>
          </form>

          {/* Quy định mật khẩu & Tài khoản mẫu */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Tài khoản mẫu đăng nhập nhanh để kiểm tra:</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {/* Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', ADMIN_PASSWORD)}
                className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold">Quản trị viên (Admin)</div>
                <div className="text-[10px] text-purple-700 font-mono">user: admin | mk: admin123</div>
              </button>

              {/* Lãnh đạo */}
              <button
                type="button"
                onClick={() => handleQuickLogin('thangdx', DEFAULT_PASSWORD)}
                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold">Giám đốc CN (Lãnh đạo)</div>
                <div className="text-[10px] text-amber-700 font-mono">user: thangdx | mk: 123</div>
              </button>

              {/* Cán bộ QHKH 1 */}
              <button
                type="button"
                onClick={() => handleQuickLogin('ducnt4', DEFAULT_PASSWORD)}
                className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold">Nguyễn Trọng Đức (QHKH)</div>
                <div className="text-[10px] text-blue-700 font-mono">user: ducnt4 | mk: 123</div>
              </button>

              {/* Cán bộ QHKH 2 */}
              <button
                type="button"
                onClick={() => handleQuickLogin('themn', DEFAULT_PASSWORD)}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold">Mai Như Thế (QHKH)</div>
                <div className="text-[10px] text-emerald-700 font-mono">user: themn | mk: 123</div>
              </button>
            </div>

            <p className="text-[10px] text-slate-500 text-center">
              💡 Mật khẩu mặc định tất cả cán bộ: <strong>123</strong>. Tài khoản Admin: <strong>admin123</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
