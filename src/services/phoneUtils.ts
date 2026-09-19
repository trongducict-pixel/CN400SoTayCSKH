/**
 * Tiện ích chuẩn hóa và xử lý Số điện thoại / ID Khách hàng
 */

/**
 * Chuẩn hóa số điện thoại:
 * - Loại bỏ các ký tự không phải số (khoảng trắng, dấu gạch ngang, chấm, ngoặc đơn, +)
 * - Xử lý mã quốc gia +84 hoặc 84 ở đầu -> chuyển thành 0
 * - Bổ sung số 0 ở đầu cho bất kỳ số điện thoại nào bị thiếu/mất số 0 (do Google Sheets / Excel tự đổi sang dạng số)
 * - Xử lý cả dạng số mũ khoa học (e.g. 9.43882E+08) từ các ô số
 * - Kết quả là chuỗi số chuẩn hóa luôn luôn có số 0 ở đầu (VD: 0943882109)
 */
export function normalizePhone(rawPhone: string | number | undefined | null): string {
  if (rawPhone === undefined || rawPhone === null) return '';
  let str = String(rawPhone).trim();
  if (!str) return '';

  // Xử lý ký hiệu khoa học nếu từ Google Sheets số học (VD: 9.43882E+08)
  if (str.includes('e') || str.includes('E')) {
    const num = Number(str);
    if (!isNaN(num)) {
      str = num.toLocaleString('fullwide', { useGrouping: false });
    }
  }

  // Giữ lại chỉ các chữ số
  let clean = str.replace(/\D/g, '');
  if (!clean) return '';

  // Xử lý mã quốc gia +84 hoặc 84 ở đầu
  if (clean.startsWith('84') && clean.length >= 10) {
    clean = '0' + clean.slice(2);
  } else if (!clean.startsWith('0')) {
    // Luôn bổ sung số 0 ở đầu cho bất kỳ số điện thoại nào chưa có số 0 ở đầu (khắc phục mất số 0)
    clean = '0' + clean;
  }
  return clean;
}

/**
 * Đảm bảo số điện thoại luôn có số 0 ở đầu (alias trực quan)
 */
export function ensureLeadingZeroPhone(phone: string | number | undefined | null): string {
  return normalizePhone(phone);
}

/**
 * Định dạng hiển thị số điện thoại đẹp mắt nhưng luôn giữ trọn vẹn số 0 ở đầu
 * (VD: 0943 882 109 hoặc 024 3882 1090)
 */
export function formatPhoneDisplay(rawPhone: string | number | undefined | null): string {
  const norm = normalizePhone(rawPhone);
  if (!norm) return rawPhone !== undefined && rawPhone !== null ? String(rawPhone) : '';
  if (norm.length === 10) {
    return `${norm.slice(0, 4)} ${norm.slice(4, 7)} ${norm.slice(7)}`;
  }
  if (norm.length === 11) {
    return `${norm.slice(0, 4)} ${norm.slice(4, 7)} ${norm.slice(7)}`;
  }
  return norm;
}

/**
 * Kiểm tra xem số điện thoại có hợp lệ không (ít nhất 9-11 số và bắt đầu bằng 0)
 */
export function isValidPhone(rawPhone: string | number | undefined | null): boolean {
  const norm = normalizePhone(rawPhone);
  return norm.length >= 10 && norm.length <= 11 && norm.startsWith('0');
}

/**
 * ID Khách hàng được gắn theo Số điện thoại chuẩn hóa luôn có số 0 ở đầu
 * Ví dụ: SĐT 0943882109 -> ID_KH: 0943882109
 */
export function generateCustomerIdFromPhone(rawPhone: string | number | undefined | null): string {
  const norm = normalizePhone(rawPhone);
  if (norm) return norm;
  return 'KH_' + Math.random().toString(36).substring(2, 9).toUpperCase();
}
