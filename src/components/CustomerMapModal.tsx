import React from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  Phone, 
  Handshake, 
  ExternalLink, 
  Building, 
  Star, 
  Compass,
  AlertCircle
} from 'lucide-react';
import { Customer } from '../types';
import { normalizePhone } from '../services/phoneUtils';

interface CustomerMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onOpenNewMeeting: (customerId: string) => void;
}

export const CustomerMapModal: React.FC<CustomerMapModalProps> = ({
  isOpen,
  onClose,
  customer,
  onOpenNewMeeting
}) => {
  if (!isOpen || !customer) return null;

  const hasCoords = customer.latitude && customer.longitude;
  const mapQuery = hasCoords 
    ? `${customer.latitude},${customer.longitude}` 
    : encodeURIComponent(customer.diaChi || customer.hoTen);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const embedUrl = hasCoords
    ? `https://maps.google.com/maps?q=${customer.latitude},${customer.longitude}&hl=vi&z=15&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(customer.diaChi || 'Hà Nội')}&hl=vi&z=14&output=embed`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-4 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/20">
              <Compass className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight truncate max-w-xs sm:max-w-sm">
                VỊ TRÍ: {customer.hoTen}
              </h3>
              <p className="text-[11px] text-emerald-100 truncate">
                {customer.diaChi || 'Chưa cập nhật địa chỉ chi tiết'}
              </p>
            </div>
          </div>
          <button
            id="map-modal-btn-close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Map Embed */}
        <div className="w-full h-64 sm:h-72 bg-slate-100 relative">
          <iframe
            title={`Bản đồ ${customer.hoTen}`}
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full"
          />

          {!hasCoords && (
            <div className="absolute top-2 left-2 right-2 bg-amber-50/95 border border-amber-200 p-2 rounded-xl text-xs text-amber-900 shadow-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Khách hàng chưa có tọa độ GPS chính xác. Đang hiển thị vị trí ước tính theo địa chỉ.</span>
            </div>
          )}
        </div>

        {/* Customer Info Card & Actions */}
        <div className="p-4 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">ĐỊA ĐIỂM TIẾP XÚC</span>
              <p className="font-bold text-sm text-slate-900 mt-0.5">
                {customer.diaChi || 'Chưa có địa chỉ văn phòng/nhà riêng'}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {customer.phanLoai}
            </span>
          </div>

          {hasCoords && (
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>Tọa độ GPS: <strong>{customer.latitude}, {customer.longitude}</strong></span>
            </div>
          )}

          {/* Buttons Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            {/* Open Google Maps App for Navigation */}
            <a
              id="map-modal-btn-open-google-maps"
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Navigation className="w-4 h-4" />
              <span>Chỉ đường (Maps)</span>
            </a>

            {/* Quick Call */}
            <a
              id="map-modal-btn-call"
              href={`tel:${normalizePhone(customer.sdt) || customer.sdt}`}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs border border-slate-200 transition-colors"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span className="font-mono">Gọi ({normalizePhone(customer.sdt) || customer.sdt})</span>
            </a>

            {/* Record Meeting */}
            <button
              id="map-modal-btn-record-meeting"
              onClick={() => {
                onClose();
                onOpenNewMeeting(customer.idKh);
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Handshake className="w-4 h-4" />
              <span>Ghi nhận gặp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
