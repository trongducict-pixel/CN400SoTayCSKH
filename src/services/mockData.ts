import { Customer, MeetingHistory, Task, CareEvent, EmailConfig, EmailLog, SystemHealthStatus } from '../types';

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    idKh: '0912345678',
    hoTen: 'Nguyễn Văn Hùng',
    loaiKhachHang: 'Tổ chức',
    tenCongTy: 'Công ty CP Xuất Nhập Khẩu Nông sản An Thái',
    chucVu: 'Tổng Giám đốc',
    sdt: '0912345678',
    ngaySinh: '1982-09-15', // Sắp đến sinh nhật (tháng 9)
    diaChi: 'Số 45 Phố Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',
    latitude: 21.0234,
    longitude: 105.8521,
    googleMapUrl: 'https://maps.google.com/?q=21.0234,105.8521',
    nganhNghe: 'Tổng Giám đốc - XNK Nông sản & Thực phẩm An Thái',
    nhuCau: 'Hạn mức tín dụng tài trợ XNK 50 tỷ, Thẻ tín dụng Infinite, Bảo lãnh thanh toán LC',
    ghiChu: 'Khách hàng uy tín 10 năm, doanh thu 300 tỷ/năm, quan tâm lãi suất USD và tỷ giá ưu đãi.',
    phanLoai: 'Khách hàng Siêu VIP',
    cheDoChamSoc: 'Bật',
    canBoPhuTrach: 'Nguyễn Trọng Đức',
    userCanBo: 'ducnt4',
    emailCanBo: 'DUCNT4@VIETINBANK.VN',
    nguoiKhoiTao: 'Nguyễn Trọng Đức',
    userKhoiTao: 'ducnt4',
    phongBanKhoiTao: 'Phòng Khách hàng Doanh nghiệp',
    ngayTao: '2026-01-10 09:30:00',
    ngayCapNhat: '2026-09-05 14:20:00',
    trangThai: 'Hoạt động'
  },
  {
    idKh: '0988765432',
    hoTen: 'Phạm Thị Thu Trang',
    loaiKhachHang: 'Cá nhân',
    tenCongTy: '',
    chucVu: '',
    sdt: '0988765432',
    ngaySinh: '1990-10-20', // Trùng ngày Phụ nữ VN 20/10
    diaChi: 'Biệt thự B6-12 Vinhomes Riverside, Long Biên, Hà Nội',
    latitude: 21.0482,
    longitude: 105.9084,
    googleMapUrl: 'https://maps.google.com/?q=21.0482,105.9084',
    nganhNghe: 'Chủ chuỗi Spa & Thẩm mỹ viện Lavender Beauty',
    nhuCau: 'Gửi tiết kiệm 15 tỷ kỳ hạn 12 tháng, gói quản lý tài sản Private Banking',
    ghiChu: 'Thích phong cách phục vụ chu đáo, hay đi công tác Hàn Quốc, sinh nhật trùng 20/10.',
    phanLoai: 'Khách hàng VIP',
    cheDoChamSoc: 'Bật',
    canBoPhuTrach: 'Nguyễn Trọng Đức',
    userCanBo: 'ducnt4',
    emailCanBo: 'DUCNT4@VIETINBANK.VN',
    nguoiKhoiTao: 'Nguyễn Trọng Đức',
    userKhoiTao: 'ducnt4',
    phongBanKhoiTao: 'Phòng Khách hàng Doanh nghiệp',
    ngayTao: '2026-02-15 11:00:00',
    ngayCapNhat: '2026-09-03 16:45:00',
    trangThai: 'Hoạt động'
  },
  {
    idKh: '0903456789',
    hoTen: 'Lê Hoàng Long',
    loaiKhachHang: 'Tổ chức',
    tenCongTy: 'Công ty Cổ phần Đầu tư Xây dựng Thăng Long',
    chucVu: 'Chủ tịch Hội đồng Quản trị',
    sdt: '0903456789',
    ngaySinh: '1978-03-08',
    diaChi: 'Tầng 18 Tòa nhà Lotte Center, 54 Liễu Giai, Ba Đình, Hà Nội',
    latitude: 21.0333,
    longitude: 105.8142,
    googleMapUrl: 'https://maps.google.com/?q=21.0333,105.8142',
    nganhNghe: 'Chủ tịch HĐQT - Công ty CP Đầu tư Xây dựng Thăng Long',
    nhuCau: 'Vay trung dài hạn dự án khu công nghiệp 120 tỷ, phát hành trái phiếu DN',
    ghiChu: 'Đang có quan hệ tín dụng tại 2 ngân hàng bạn, đang so sánh phí bảo lãnh.',
    phanLoai: 'Đã có quan hệ tín dụng',
    cheDoChamSoc: 'Bật',
    canBoPhuTrach: 'Mai Như Thế',
    userCanBo: 'themn',
    emailCanBo: 'THEMN@VIETINBANK.VN',
    nguoiKhoiTao: 'Mai Như Thế',
    userKhoiTao: 'themn',
    phongBanKhoiTao: 'Phòng Khách hàng Bán lẻ',
    ngayTao: '2025-11-20 08:30:00',
    ngayCapNhat: '2026-08-28 10:15:00',
    trangThai: 'Hoạt động'
  },
  {
    idKh: '0979112233',
    hoTen: 'Hoàng Quốc Tuấn',
    loaiKhachHang: 'Tổ chức',
    tenCongTy: 'Công ty TNHH Giải pháp Công nghệ NextAI',
    chucVu: 'Giám đốc Điều hành (CEO)',
    sdt: '0979112233',
    ngaySinh: '1988-12-05',
    diaChi: 'Khu Đô Thị Ecopark, Văn Giang, Hưng Yên',
    latitude: 20.9723,
    longitude: 105.9321,
    googleMapUrl: 'https://maps.google.com/?q=20.9723,105.9321',
    nganhNghe: 'Nhà sáng lập Startup Công nghệ AI & E-commerce',
    nhuCau: 'Mở tài khoản doanh nghiệp số đẹp, cổng thanh toán thẻ, vay thấu chi tín chấp 2 tỷ',
    ghiChu: 'Tiềm năng tăng trưởng cao, đang tiếp cận tư vấn gói giải pháp số.',
    phanLoai: 'Đang tiếp thị',
    cheDoChamSoc: 'Tắt',
    canBoPhuTrach: 'Dương Vân Lan Anh',
    userCanBo: 'anhdvl',
    emailCanBo: 'ANHDVL@VIETINBANK.VN',
    nguoiKhoiTao: 'Dương Vân Lan Anh',
    userKhoiTao: 'anhdvl',
    phongBanKhoiTao: 'Phòng Khách hàng Bán lẻ',
    ngayTao: '2026-08-01 14:00:00',
    ngayCapNhat: '2026-09-02 09:30:00',
    trangThai: 'Hoạt động'
  },
  {
    idKh: '0918889999',
    hoTen: 'Vũ Thị Minh Hạnh',
    loaiKhachHang: 'Cá nhân',
    tenCongTy: '',
    chucVu: '',
    sdt: '0918889999',
    ngaySinh: '1985-07-27',
    diaChi: 'Số 12 Phố Tràng Tiền, Hoàn Kiếm, Hà Nội',
    latitude: 21.0252,
    longitude: 105.8576,
    googleMapUrl: 'https://maps.google.com/?q=21.0252,105.8576',
    nganhNghe: 'Giám đốc Chuỗi Trang sức Vàng bạc Đá quý Bảo Tín Hạnh',
    nhuCau: 'Hạn mức thấu chi vàng, dịch vụ nộp rút tiền mặt tại chỗ, bảo lãnh thuế hải quan',
    ghiChu: 'Dòng tiền mặt dồi dào hàng ngày, cần cán bộ quản lý tài khoản riêng biệt VIP.',
    phanLoai: 'Khách hàng Siêu VIP',
    cheDoChamSoc: 'Bật',
    canBoPhuTrach: 'Nguyễn Trọng Đức',
    userCanBo: 'ducnt4',
    emailCanBo: 'DUCNT4@VIETINBANK.VN',
    nguoiKhoiTao: 'Nguyễn Trọng Đức',
    userKhoiTao: 'ducnt4',
    phongBanKhoiTao: 'Phòng Khách hàng Doanh nghiệp',
    ngayTao: '2025-06-12 10:00:00',
    ngayCapNhat: '2026-09-04 15:00:00',
    trangThai: 'Hoạt động'
  }
];

export const INITIAL_MEETINGS: MeetingHistory[] = [
  {
    idLichSu: 'LS_001',
    idKh: '0912345678',
    thoiGianGap: '2026-09-05 14:20',
    hinhThucGap: 'Gặp trực tiếp',
    latitude: 21.0234,
    longitude: 105.8521,
    googleMapUrl: 'https://maps.google.com/?q=21.0234,105.8521',
    noiDungTraoDoi: 'Gặp anh Hùng tại văn phòng công ty. Thống nhất phương án cấp hạn mức 50 tỷ tài trợ xuất khẩu cà phê niên vụ mới. Anh Hùng đồng ý chuyển 80% doanh thu ngoại tệ về tài khoản ngân hàng mình nếu được giảm 0.3% phí LC.',
    nhuCauKhachHang: 'Hạn mức 50 tỷ tài trợ XNK, giảm phí bảo lãnh LC',
    tinhTrangSauGap: 'Đang xử lý',
    congViecTiepTheo: 'Trình tờ trình phê duyệt hạn mức tín dụng 50 tỷ lên Ban Giám đốc',
    ngayHenLienHe: '2026-09-10',
    ghiChu: 'Khách hàng rất hài lòng về tiến độ xử lý hồ sơ nhanh.',
    canBoThucHien: 'Trần Minh Đức',
    thoiGianCapNhat: '2026-09-05 15:10:00'
  },
  {
    idLichSu: 'LS_002',
    idKh: '0912345678',
    thoiGianGap: '2026-08-20 10:00',
    hinhThucGap: 'Điện thoại',
    latitude: null,
    longitude: null,
    googleMapUrl: '',
    noiDungTraoDoi: 'Gọi điện trao đổi trước về nhu cầu dòng tiền quý 4 và khảo sát báo cáo tài chính 6 tháng đầu năm của công ty.',
    nhuCauKhachHang: 'Cần tài trợ vốn lưu động mùa vụ thu hoạch nông sản',
    tinhTrangSauGap: 'Đang tư vấn',
    congViecTiepTheo: 'Hẹn gặp trực tiếp tại văn phòng công ty để thu thập hồ sơ pháp lý & BCTC',
    ngayHenLienHe: '2026-09-05',
    ghiChu: 'Khách hàng vừa ký xong hợp đồng xuất khẩu sang thị trường EU.',
    canBoThucHien: 'Trần Minh Đức',
    thoiGianCapNhat: '2026-08-20 10:30:00'
  },
  {
    idLichSu: 'LS_003',
    idKh: '0988765432',
    thoiGianGap: '2026-09-03 16:45',
    hinhThucGap: 'Gặp trực tiếp',
    latitude: 21.0482,
    longitude: 105.9084,
    googleMapUrl: 'https://maps.google.com/?q=21.0482,105.9084',
    noiDungTraoDoi: 'Đến tư vấn tại cơ sở Spa Lavender. Tư vấn chương trình lãi suất đặc quyền dành cho khách hàng VIP và tặng thẻ Priority Pass phòng chờ sân bay.',
    nhuCauKhachHang: 'Gửi tiết kiệm 15 tỷ kỳ hạn 12 tháng nhận lãi định kỳ',
    tinhTrangSauGap: 'Có nhu cầu',
    congViecTiepTheo: 'Chuẩn bị hợp đồng tiền gửi VIP và hoa chúc mừng ngày sinh nhật sắp tới',
    ngayHenLienHe: '2026-09-12',
    ghiChu: 'Chị Trang quan tâm quà tặng tri ân sinh nhật vào tháng 10.',
    canBoThucHien: 'Trần Minh Đức',
    thoiGianCapNhat: '2026-09-03 17:30:00'
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    idCongViec: 'CV_001',
    idKh: '0912345678',
    noiDung: 'Hoàn thiện Tờ trình phê duyệt hạn mức tín dụng 50 tỷ và trình Trưởng phòng',
    ngayHan: '2026-09-10',
    canBo: 'Trần Minh Đức',
    trangThai: 'Đang thực hiện',
    ngayTao: '2026-09-05 15:10:00',
    ngayHoanThanh: '',
    ghiChu: 'Cần đính kèm hợp đồng ngoại thương mới ký với đối tác Đức'
  },
  {
    idCongViec: 'CV_002',
    idKh: '0988765432',
    noiDung: 'Lập hợp đồng tiền gửi tiết kiệm bậc thang 15 tỷ kỳ hạn 1 năm',
    ngayHan: '2026-09-12',
    canBo: 'Trần Minh Đức',
    trangThai: 'Chưa thực hiện',
    ngayTao: '2026-09-03 17:30:00',
    ngayHoanThanh: '',
    ghiChu: 'Áp dụng mức lãi suất ưu đãi hội sở phê duyệt'
  },
  {
    idCongViec: 'CV_003',
    idKh: '0903456789',
    noiDung: 'Gửi bảng so sánh phí phát hành bảo lãnh dự thầu cho Kế toán trưởng',
    ngayHan: '2026-09-01', // Quá hạn
    canBo: 'Nguyễn Thị Lan Anh',
    trangThai: 'Quá hạn',
    ngayTao: '2026-08-28 10:30:00',
    ngayHoanThanh: '',
    ghiChu: 'Cần liên hệ lại gấp để không mất cơ hội thầu'
  }
];

export const INITIAL_CARE_EVENTS: CareEvent[] = [
  {
    idSuKien: 'SK_01',
    tenSuKien: 'Sinh nhật khách hàng',
    ngay: 'SINH_NHAT',
    loai: 'SinhNhat',
    soNgayNhacTruoc: 3,
    trangThai: 'Bật'
  },
  {
    idSuKien: 'SK_02',
    tenSuKien: 'Ngày Phụ nữ Việt Nam 20/10',
    ngay: '20/10',
    loai: 'NgayLe',
    soNgayNhacTruoc: 5,
    trangThai: 'Bật'
  },
  {
    idSuKien: 'SK_03',
    tenSuKien: 'Ngày Doanh nhân Việt Nam 13/10',
    ngay: '13/10',
    loai: 'NgayLe',
    soNgayNhacTruoc: 3,
    trangThai: 'Bật'
  },
  {
    idSuKien: 'SK_04',
    tenSuKien: 'Quốc khánh 2/9',
    ngay: '02/09',
    loai: 'NgayLe',
    soNgayNhacTruoc: 3,
    trangThai: 'Bật'
  },
  {
    idSuKien: 'SK_05',
    tenSuKien: 'Ngày Quốc tế Phụ nữ 8/3',
    ngay: '08/03',
    loai: 'NgayLe',
    soNgayNhacTruoc: 3,
    trangThai: 'Bật'
  },
  {
    idSuKien: 'SK_06',
    tenSuKien: 'Tết Nguyên Đán',
    ngay: '01/01_AL',
    loai: 'Tet',
    soNgayNhacTruoc: 7,
    trangThai: 'Bật'
  }
];

export const INITIAL_EMAIL_CONFIG: EmailConfig = {
  adminEmail: 'trongduc.ict@gmail.com',
  emailFromName: 'Sổ Tay QHKH - CRM Bank',
  emailEnabled: true,
  reminderDays: '7,3,1',
  testEmail: 'trongduc.ict@gmail.com',
  appUrl: window.location.origin
};

export const INITIAL_EMAIL_LOGS: EmailLog[] = [
  {
    idLog: 'LOG_001',
    thoiGian: '2026-09-08 07:00:15',
    idKh: '0912345678',
    hoTenKh: 'Nguyễn Văn Hùng',
    emailNhan: 'trongduc.ict@gmail.com',
    loaiSuKien: 'Sinh nhật',
    ngaySuKien: '15/09/2026',
    soNgayTruoc: 7,
    thoiGianGui: '2026-09-08 07:00:16',
    trangThai: 'SENT',
    loiChiTiet: '',
    messageIdNhapNeuCo: 'MSG_998124'
  },
  {
    idLog: 'LOG_002',
    thoiGian: '2026-09-07 15:30:20',
    idKh: 'SYSTEM_TEST',
    hoTenKh: 'Kiểm tra hệ thống',
    emailNhan: 'trongduc.ict@gmail.com',
    loaiSuKien: 'TEST_EMAIL',
    ngaySuKien: '07/09/2026',
    soNgayTruoc: 0,
    thoiGianGui: '2026-09-07 15:30:21',
    trangThai: 'SENT',
    loiChiTiet: 'Gửi email test thành công qua MailApp.',
    messageIdNhapNeuCo: 'MSG_TEST_01'
  }
];

export const INITIAL_SYSTEM_HEALTH: SystemHealthStatus = {
  googleSheet: {
    status: 'OK',
    details: '10 Sheets đã sẵn sàng (KHACH_HANG, LICH_SU_GAP, CONG_VIEC, SU_KIEN_CHAM_SOC, CAN_BO, EMAIL_CONFIG, EMAIL_LOG, LICH_SU_CHAM_SOC, AUDIT_LOG, DM_NHU_CAU)',
    sheetCount: 10
  },
  appsScriptApi: {
    status: 'OK',
    details: 'API Apps Script Web App phản hồi nhanh và ổn định.',
    responseTimeMs: 240
  },
  emailService: {
    status: 'OK',
    details: 'MailApp Quota: 98/100 email còn lại hôm nay.',
    configuredEmail: 'trongduc.ict@gmail.com',
    enabled: true,
    quotaRemaining: 98
  },
  trigger: {
    status: 'OK',
    details: 'Trigger checkCareReminders tự động kích hoạt 07:00 AM mỗi ngày.',
    activeTriggersCount: 1
  },
  config: {
    status: 'OK',
    details: 'Các thông số hệ thống và email template chuẩn.'
  }
};

export const INITIAL_CARE_HISTORIES: import('../types').CareHistory[] = [
  {
    idChamSoc: 'CS_001',
    idKh: '0912345678',
    thoiGian: '2026-09-08 09:30:00',
    hinhThuc: 'Gọi điện',
    suKien: 'Sinh nhật',
    noiDung: 'Gọi điện gửi lời chúc mừng sinh nhật sớm từ VietinBank tới Tổng giám đốc',
    ketQua: 'Khách hàng rất vui và hài lòng, hẹn sang tuần trao đổi về hạn mức tín dụng',
    canBo: 'Trần Minh Đức',
    ghiChu: 'Gửi thiệp và hoa quà chúc mừng sinh nhật'
  },
  {
    idChamSoc: 'CS_002',
    idKh: '0988765432',
    thoiGian: '2026-09-04 14:15:00',
    hinhThuc: 'Tin nhắn',
    suKien: 'Thường xuyên',
    noiDung: 'Nhắn tin cập nhật biểu lãi suất tiền gửi bậc thang kỳ hạn 12 tháng ưu đãi',
    ketQua: 'Khách đã đọc và đồng ý sang chi nhánh làm thủ tục',
    canBo: 'Trần Minh Đức',
    ghiChu: 'Đã chuẩn bị trước hồ sơ'
  }
];

export const INITIAL_DEMAND_CATEGORIES: import('../types').DemandCategory[] = [
  { idNhuCau: 'NC_01', nhomNhuCau: 'VAY', tenNhuCau: 'Vay SXKD / Hạn mức kinh doanh', trangThai: 'Hoạt động', thuTu: 1 },
  { idNhuCau: 'NC_02', nhomNhuCau: 'VAY', tenNhuCau: 'Vay mua bất động sản / Nhà ở', trangThai: 'Hoạt động', thuTu: 2 },
  { idNhuCau: 'NC_03', nhomNhuCau: 'VAY', tenNhuCau: 'Vay mua ô tô', trangThai: 'Hoạt động', thuTu: 3 },
  { idNhuCau: 'NC_04', nhomNhuCau: 'VAY', tenNhuCau: 'Vay tiêu dùng tín chấp / Cán bộ nhân viên', trangThai: 'Hoạt động', thuTu: 4 },
  { idNhuCau: 'NC_05', nhomNhuCau: 'TIEN_GUI', tenNhuCau: 'Tiền gửi tiết kiệm dân cư', trangThai: 'Hoạt động', thuTu: 5 },
  { idNhuCau: 'NC_06', nhomNhuCau: 'TIEN_GUI', tenNhuCau: 'Tiền gửi thanh toán / CASA Doanh nghiệp', trangThai: 'Hoạt động', thuTu: 6 },
  { idNhuCau: 'NC_07', nhomNhuCau: 'THE', tenNhuCau: 'Thẻ tín dụng quốc tế (Visa/Master)', trangThai: 'Hoạt động', thuTu: 7 },
  { idNhuCau: 'NC_08', nhomNhuCau: 'THE', tenNhuCau: 'Thẻ ghi nợ / Thẻ thấu chi', trangThai: 'Hoạt động', thuTu: 8 },
  { idNhuCau: 'NC_09', nhomNhuCau: 'NGAN_HANG_SO', tenNhuCau: 'VietinBank iPay Mobile', trangThai: 'Hoạt động', thuTu: 9 },
  { idNhuCau: 'NC_10', nhomNhuCau: 'NGAN_HANG_SO', tenNhuCau: 'Ngân hàng số eFAST cho Doanh nghiệp', trangThai: 'Hoạt động', thuTu: 10 },
  { idNhuCau: 'NC_11', nhomNhuCau: 'NGAN_HANG_SO', tenNhuCau: 'QR Pay / POS chấp nhận thanh toán', trangThai: 'Hoạt động', thuTu: 11 },
  { idNhuCau: 'NC_12', nhomNhuCau: 'BAO_HIEM', tenNhuCau: 'Bảo hiểm nhân thọ Aviva / Manulife', trangThai: 'Hoạt động', thuTu: 12 },
  { idNhuCau: 'NC_13', nhomNhuCau: 'BAO_HIEM', tenNhuCau: 'Bảo hiểm phi nhân thọ VBI (Xe, Kho, Tài sản)', trangThai: 'Hoạt động', thuTu: 13 },
  { idNhuCau: 'NC_14', nhomNhuCau: 'NGOAI_TE', tenNhuCau: 'Mua bán ngoại tệ / Kiều hối', trangThai: 'Hoạt động', thuTu: 14 },
  { idNhuCau: 'NC_15', nhomNhuCau: 'THANH_TOAN', tenNhuCau: 'Dịch vụ trả lương qua tài khoản (Payroll)', trangThai: 'Hoạt động', thuTu: 15 }
];

export const INITIAL_AUDIT_LOGS: import('../types').AuditLog[] = [
  {
    idLog: 'LOG_INIT_01',
    thoiGian: '2026-09-08 08:00:00',
    user: 'admin',
    hoTen: 'Quản trị viên Hệ thống',
    action: 'SYSTEM_CONFIG',
    objectType: 'CONFIG',
    objectId: 'V2_INIT',
    noiDung: 'Nâng cấp kiến trúc V2: Thêm 3 bảng chuẩn hóa và tối ưu quy trình trải nghiệm di động'
  }
];
