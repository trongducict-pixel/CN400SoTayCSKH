import React, { useState, useMemo } from 'react';
import { 
  Handshake, 
  Search, 
  MapPin, 
  Calendar, 
  Phone, 
  Video, 
  Mail, 
  Plus, 
  Filter, 
  ExternalLink,
  Clock
} from 'lucide-react';
import { MeetingHistory, Customer, MeetingFormat } from '../types';

interface MeetingHistoryViewProps {
  meetings: MeetingHistory[];
  customers: Customer[];
  onOpenNewMeeting: (customerId?: string) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export const MeetingHistoryView: React.FC<MeetingHistoryViewProps> = ({
  meetings,
  customers,
  onOpenNewMeeting,
  onSelectCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');

  const customerMap = useMemo(() => {
    const map: Record<string, Customer> = {};
    customers.forEach(c => { map[c.idKh] = c; });
    return map;
  }, [customers]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter(m => {
      const cust = customerMap[m.idKh];
      const custName = cust ? cust.hoTen.toLowerCase() : '';
      const q = searchTerm.toLowerCase();

      if (searchTerm.trim()) {
        const matchesName = custName.includes(q);
        const matchesContent = m.noiDungTraoDoi.toLowerCase().includes(q);
        const matchesOfficer = m.canBoThucHien.toLowerCase().includes(q);
        const matchesDemand = m.nhuCauKhachHang.toLowerCase().includes(q);
        if (!matchesName && !matchesContent && !matchesOfficer && !matchesDemand) {
          return false;
        }
      }

      if (selectedFormat !== 'ALL' && m.hinhThucGap !== selectedFormat) {
        return false;
      }

      return true;
    });
  }, [meetings, searchTerm, selectedFormat, customerMap]);

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            NHẬT KÝ TIẾP XÚC KHÁCH HÀNG
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {filteredMeetings.length} cuộc gặp
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Biên bản và dấu mốc chăm sóc thực tế của toàn bộ đội ngũ QHKH
          </p>
        </div>

        <button
          id="meeting-history-btn-add"
          onClick={() => onOpenNewMeeting()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-700/20 active:scale-98 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Ghi nhận gặp</span>
        </button>
      </div>

      {/* Search & Format Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo khách hàng, nội dung trao đổi, cán bộ..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
          />
        </div>

        <select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
        >
          <option value="ALL">Tất cả hình thức</option>
          <option value="Gặp trực tiếp">🤝 Gặp trực tiếp</option>
          <option value="Điện thoại">📞 Điện thoại</option>
          <option value="Video call">📹 Video call</option>
          <option value="Email">✉️ Email</option>
          <option value="Khác">💬 Khác</option>
        </select>
      </div>

      {/* Meeting Cards List */}
      {filteredMeetings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
          <Handshake className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          Không tìm thấy cuộc gặp nào phù hợp với điều kiện tìm kiếm.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMeetings.map((m) => {
            const cust = customerMap[m.idKh];
            return (
              <div
                key={m.idLichSu}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        onClick={() => cust && onSelectCustomer(cust)}
                        className={`font-black text-sm text-slate-900 ${cust ? 'hover:text-blue-700 cursor-pointer' : ''}`}
                      >
                        {cust ? cust.hoTen : m.idKh}
                      </h3>
                      <span className="px-2 py-0.2 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {m.hinhThucGap}
                      </span>
                      <span className="px-2 py-0.2 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
                        {m.tinhTrangSauGap}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span>🕒 {m.thoiGianGap}</span>
                      <span>👤 Cán bộ: <strong>{m.canBoThucHien || 'QHKH'}</strong></span>
                    </div>
                  </div>

                  {m.googleMapUrl && (
                    <a
                      href={m.googleMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-1 transition-colors shrink-0"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Bản đồ</span>
                    </a>
                  )}
                </div>

                {/* Content */}
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 leading-relaxed">
                  <p className="font-medium">{m.noiDungTraoDoi || 'Chưa ghi chi tiết nội dung trao đổi.'}</p>
                  
                  {m.nhuCauKhachHang && (
                    <p className="mt-2 pt-2 border-t border-slate-200/60 text-blue-900 font-semibold">
                      💡 Nhu cầu: {m.nhuCauKhachHang}
                    </p>
                  )}
                </div>

                {/* Follow up task */}
                {m.congViecTiepTheo && (
                  <div className="mt-2 text-xs text-amber-900 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>Việc tiếp theo:</strong> {m.congViecTiepTheo}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
