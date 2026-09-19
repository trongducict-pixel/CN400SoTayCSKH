import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Edit, 
  KeyRound, 
  CheckCircle2, 
  X, 
  Plus, 
  ShieldCheck, 
  Building2, 
  Phone, 
  Mail, 
  Crown, 
  Lock, 
  Unlock, 
  RefreshCw,
  UserCheck,
  Trash2
} from 'lucide-react';
import { AppUser, UserRole } from '../types';
import { DEFAULT_PASSWORD, ADMIN_PASSWORD } from '../services/staffData';
import { normalizePhone } from '../services/phoneUtils';

interface UserManagementViewProps {
  users: AppUser[];
  onUpdateUser: (user: AppUser) => Promise<void>;
  onResetPassword: (username: string, newPassword?: string) => Promise<void>;
  onAddUser: (user: AppUser) => Promise<void>;
  onDeleteUser?: (username: string) => Promise<void>;
  currentUser: AppUser | null;
  onOpenChangePassword?: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  onUpdateUser,
  onResetPassword,
  onAddUser,
  onDeleteUser,
  currentUser,
  onOpenChangePassword
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [leaderFilter, setLeaderFilter] = useState('ALL');

  // Edit User Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Reset Password Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<AppUser | null>(null);
  const [customNewPassword, setCustomNewPassword] = useState('');

  // Add User Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState<Partial<AppUser>>({
    hoTen: '',
    maNv: '',
    user: '',
    password: DEFAULT_PASSWORD,
    phongBan: 'Phòng Bán lẻ',
    viTri: 'CB QHKH bán lẻ',
    sdt: '',
    email: '',
    role: 'QHKH',
    isLeader: false,
    trangThai: 'Hoạt động'
  });

  // Extract departments list for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach(u => {
      if (u.phongBan) set.add(u.phongBan);
    });
    return Array.from(set).sort();
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = u.hoTen.toLowerCase().includes(q);
        const matchesUser = u.user.toLowerCase().includes(q);
        const matchesMaNv = u.maNv.toLowerCase().includes(q);
        const matchesDept = u.phongBan.toLowerCase().includes(q);
        const matchesPos = u.viTri.toLowerCase().includes(q);
        const matchesPhone = u.sdt.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        if (!matchesName && !matchesUser && !matchesMaNv && !matchesDept && !matchesPos && !matchesPhone && !matchesEmail) {
          return false;
        }
      }

      // Dept
      if (departmentFilter !== 'ALL' && u.phongBan !== departmentFilter) {
        return false;
      }

      // Role
      if (roleFilter !== 'ALL' && u.role !== roleFilter) {
        return false;
      }

      // Leader
      if (leaderFilter === 'LEADER' && !u.isLeader) return false;
      if (leaderFilter === 'NON_LEADER' && u.isLeader) return false;

      return true;
    });
  }, [users, searchTerm, departmentFilter, roleFilter, leaderFilter]);

  const handleOpenEdit = (u: AppUser) => {
    setEditingUser({ ...u });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const cleanUser = {
      ...editingUser,
      sdt: editingUser.sdt ? normalizePhone(editingUser.sdt) : ''
    };
    await onUpdateUser(cleanUser);
    setIsEditModalOpen(false);
  };

  const handleOpenReset = (u: AppUser) => {
    setResetTargetUser(u);
    setCustomNewPassword(u.user === 'admin' ? ADMIN_PASSWORD : DEFAULT_PASSWORD);
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = async () => {
    if (!resetTargetUser) return;
    await onResetPassword(resetTargetUser.user, customNewPassword || undefined);
    setIsResetModalOpen(false);
  };

  const handleSaveNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.hoTen || !newUserForm.user) {
      alert('Vui lòng nhập họ tên và tên đăng nhập!');
      return;
    }
    const cleanUser: AppUser = {
      ...(newUserForm as AppUser),
      sdt: newUserForm.sdt ? normalizePhone(newUserForm.sdt) : ''
    };
    await onAddUser(cleanUser);
    setIsAddModalOpen(false);
    setNewUserForm({
      hoTen: '',
      maNv: '',
      user: '',
      password: DEFAULT_PASSWORD,
      phongBan: 'Phòng Bán lẻ',
      viTri: 'CB QHKH bán lẻ',
      sdt: '',
      email: '',
      role: 'QHKH',
      isLeader: false,
      trangThai: 'Hoạt động'
    });
  };

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-700" />
            QUẢN TRỊ DANH MỤC CÁN BỘ & NGƯỜI DÙNG
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {filteredUsers.length} / {users.length} cán bộ
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Chỉnh sửa thông tin cán bộ, phân quyền vai trò lãnh đạo phòng và đặt lại mật khẩu
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
          {onOpenChangePassword && (
            <button
              id="btn-open-change-pwd-user-mgmt"
              onClick={onOpenChangePassword}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold active:scale-98 transition-all cursor-pointer"
              title="Đổi mật khẩu tài khoản đang đăng nhập"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Đổi mật khẩu của tôi</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-700/20 active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm cán bộ</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo họ tên, tên đăng nhập (user), mã nhân viên, SĐT, email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Phòng ban / Đơn vị:
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Tất cả phòng ban ({departments.length})</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Vai trò hệ thống:
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="QHKH">Cán bộ QHKH</option>
              <option value="LANH_DAO">Lãnh đạo</option>
              <option value="ADMIN">Quản trị viên (Admin)</option>
            </select>
          </div>

          {/* Leader Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Lãnh đạo phòng:
            </label>
            <select
              value={leaderFilter}
              onChange={(e) => setLeaderFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Tất cả</option>
              <option value="LEADER">⭐ Chỉ Lãnh đạo phòng</option>
              <option value="NON_LEADER">Cán bộ thường</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 text-center w-12">STT</th>
                <th className="py-3 px-3.5">Họ và tên</th>
                <th className="py-3 px-3.5">Mã NV / User</th>
                <th className="py-3 px-3.5">Phòng ban & Vị trí</th>
                <th className="py-3 px-3.5">Liên hệ</th>
                <th className="py-3 px-3.5 text-center">Vai trò</th>
                <th className="py-3 px-3.5 text-center">Lãnh đạo phòng</th>
                <th className="py-3 px-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không tìm thấy cán bộ phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr key={u.user} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3.5 text-center font-mono text-slate-400">
                      {u.stt ?? idx + 1}
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{u.hoTen}</span>
                        {currentUser?.user === u.user && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                            Bạn
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${u.trangThai === 'Khóa' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                        <span>{u.trangThai || 'Hoạt động'}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 font-mono">
                      <div className="font-bold text-blue-700">{u.user}</div>
                      <div className="text-[10px] text-slate-400">{u.maNv}</div>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="font-medium text-slate-800">{u.phongBan}</div>
                      <div className="text-[11px] text-slate-500">{u.viTri}</div>
                    </td>

                    <td className="py-2.5 px-3.5 text-[11px]">
                      {u.sdt && <div className="text-slate-700 font-mono">📞 {normalizePhone(u.sdt) || u.sdt}</div>}
                      <div className="text-slate-500 font-mono truncate max-w-[160px]" title={u.email}>
                        ✉️ {u.email}
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'LANH_DAO'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role === 'ADMIN' ? 'Quản trị viên' : u.role === 'LANH_DAO' ? 'Lãnh đạo' : 'QHKH'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 text-center">
                      {u.isLeader ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                          <Crown className="w-3 h-3 text-amber-600" />
                          Lãnh đạo
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenReset(u)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Reset mật khẩu"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {onDeleteUser && (
                          <button
                            onClick={async () => {
                              if (u.user === currentUser?.user) {
                                alert('Bạn không thể tự xóa tài khoản của chính mình!');
                                return;
                              }
                              if (window.confirm(`Xác nhận xóa tài khoản cán bộ "${u.hoTen}" (${u.user}) khỏi hệ thống và Google Sheet?`)) {
                                await onDeleteUser(u.user);
                              }
                            }}
                            disabled={u.user === currentUser?.user}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              u.user === currentUser?.user 
                                ? 'text-slate-300 cursor-not-allowed' 
                                : 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                            title={u.user === currentUser?.user ? 'Không thể tự xóa' : 'Xóa tài khoản cán bộ'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-600" />
                Chỉnh sửa thông tin cán bộ
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingUser.hoTen}
                    onChange={(e) => setEditingUser({ ...editingUser, hoTen: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã nhân viên
                  </label>
                  <input
                    type="text"
                    value={editingUser.maNv}
                    onChange={(e) => setEditingUser({ ...editingUser, maNv: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên đăng nhập (User)
                  </label>
                  <input
                    type="text"
                    value={editingUser.user}
                    disabled
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-500 font-mono font-bold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editingUser.sdt}
                    onChange={(e) => setEditingUser({ ...editingUser, sdt: e.target.value })}
                    onBlur={() => {
                      if (editingUser.sdt) {
                        setEditingUser({ ...editingUser, sdt: normalizePhone(editingUser.sdt) });
                      }
                    }}
                    placeholder="VD: 0912345678"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email / Tài khoản AD <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Phòng ban
                  </label>
                  <input
                    type="text"
                    value={editingUser.phongBan}
                    onChange={(e) => setEditingUser({ ...editingUser, phongBan: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Vị trí công việc
                  </label>
                  <input
                    type="text"
                    value={editingUser.viTri}
                    onChange={(e) => setEditingUser({ ...editingUser, viTri: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Roles & Leadership Tick */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Vai trò hệ thống:
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="QHKH">Cán bộ QHKH</option>
                    <option value="LANH_DAO">Lãnh đạo chi nhánh / phòng</option>
                    <option value="ADMIN">Quản trị viên (Admin)</option>
                  </select>
                </div>

                {/* Yêu cầu của người dùng: "Với lãnh đạo thì cho thêm thông tin tick vai trò là lãnh đạo phòng" */}
                <label className="flex items-center gap-2.5 p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-950 font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editingUser.isLeader}
                    onChange={(e) => setEditingUser({ ...editingUser, isLeader: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <span>⭐ Tick chọn: Vai trò là Lãnh đạo phòng (Trưởng/Phó phòng ban hoặc PGD)</span>
                </label>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Trạng thái tài khoản:
                  </label>
                  <select
                    value={editingUser.trangThai || 'Hoạt động'}
                    onChange={(e) => setEditingUser({ ...editingUser, trangThai: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Hoạt động">🟢 Hoạt động</option>
                    <option value="Khóa">🔴 Khóa tài khoản</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Reset Password Modal */}
      {isResetModalOpen && resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                Reset mật khẩu cán bộ
              </h3>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Bạn đang đặt lại mật khẩu cho cán bộ: <strong>{resetTargetUser.hoTen}</strong> (User: <span className="font-mono font-bold text-blue-700">{resetTargetUser.user}</span>).
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mật khẩu mới:
                </label>
                <input
                  type="text"
                  value={customNewPassword}
                  onChange={(e) => setCustomNewPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Mặc định cán bộ là: <code>123</code> (Admin là <code>admin123</code>)
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Xác nhận Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Thêm cán bộ mới vào hệ thống
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUserForm.hoTen}
                    onChange={(e) => setNewUserForm({ ...newUserForm, hoTen: e.target.value })}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã nhân viên
                  </label>
                  <input
                    type="text"
                    value={newUserForm.maNv}
                    onChange={(e) => setNewUserForm({ ...newUserForm, maNv: e.target.value })}
                    placeholder="Ví dụ: 00060500"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên đăng nhập (Cột User) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUserForm.user}
                    onChange={(e) => setNewUserForm({ ...newUserForm, user: e.target.value.toLowerCase().trim() })}
                    placeholder="Ví dụ: anv"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={newUserForm.sdt}
                    onChange={(e) => setNewUserForm({ ...newUserForm, sdt: e.target.value })}
                    onBlur={() => {
                      if (newUserForm.sdt) {
                        setNewUserForm({ ...newUserForm, sdt: normalizePhone(newUserForm.sdt) });
                      }
                    }}
                    placeholder="0912345678"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email / AD <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="ANV@VIETINBANK.VN"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Phòng ban
                  </label>
                  <input
                    type="text"
                    value={newUserForm.phongBan}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phongBan: e.target.value })}
                    placeholder="Phòng Bán lẻ"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Vị trí công việc
                  </label>
                  <input
                    type="text"
                    value={newUserForm.viTri}
                    onChange={(e) => setNewUserForm({ ...newUserForm, viTri: e.target.value })}
                    placeholder="CB QHKH bán lẻ"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Roles & Leader Tick */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Vai trò hệ thống:
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="QHKH">Cán bộ QHKH</option>
                    <option value="LANH_DAO">Lãnh đạo chi nhánh / phòng</option>
                    <option value="ADMIN">Quản trị viên (Admin)</option>
                  </select>
                </div>

                <label className="flex items-center gap-2.5 p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-950 font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newUserForm.isLeader}
                    onChange={(e) => setNewUserForm({ ...newUserForm, isLeader: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <span>⭐ Tick chọn: Vai trò là Lãnh đạo phòng (Trưởng/Phó phòng ban hoặc PGD)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold"
                >
                  Thêm mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
