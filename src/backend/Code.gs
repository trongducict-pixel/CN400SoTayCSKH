/**
 * =========================================================================
 * SỔ TAY QHKH – QUẢN LÝ VÀ CHĂM SÓC KHÁCH HÀNG CHỦ ĐỘNG
 * NGÂN HÀNG TMCP CÔNG THƯƠNG VIỆT NAM - CHI NHÁNH NINH BÌNH
 * Backend Google Apps Script (Production Ready - Full CRUD & Beautiful Formatting)
 * =========================================================================
 * 
 * Hướng dẫn triển khai:
 * 1. Mở file Google Sheets trên Google Drive của bạn.
 * 2. Vào Tiện ích mở rộng > Apps Script (Extensions > Apps Script).
 * 3. Xóa hết mã cũ và dán toàn bộ nội dung file này vào Code.gs.
 * 4. Chạy hàm setupDatabase() lần đầu để tự động khởi tạo và định dạng 7 Sheet chuẩn VietinBank.
 * 5. Chạy hàm setupTriggers() để tạo trigger tự động kiểm tra nhắc việc hàng ngày (07:00 AM).
 * 6. Bấm Triển khai (Deploy) > Tùy chọn triển khai mới (New deployment):
 *    - Loại: Ứng dụng web (Web app)
 *    - Thực thi dưới dạng: Tôi (Execute as: Me)
 *    - Người có quyền truy cập: Bất kỳ ai (Who has access: Anyone)
 * 7. Copy URL Web App (đuôi /exec) và dán vào phần Cài đặt của WebApp!
 */

const SHEET_NAMES = {
  KHACH_HANG: 'KHACH_HANG',
  LICH_SU_GAP: 'LICH_SU_GAP',
  CONG_VIEC: 'CONG_VIEC',
  SU_KIEN_CHAM_SOC: 'SU_KIEN_CHAM_SOC',
  CAN_BO: 'CAN_BO',
  EMAIL_CONFIG: 'EMAIL_CONFIG',
  EMAIL_LOG: 'EMAIL_LOG',
  // Bổ sung các Sheet mới V2 (Không đổi tên hay xoá Sheet cũ)
  LICH_SU_CHAM_SOC: 'LICH_SU_CHAM_SOC',
  AUDIT_LOG: 'AUDIT_LOG',
  DM_NHU_CAU: 'DM_NHU_CAU'
};

// Màu sắc nhận diện chuẩn VietinBank
const BRAND_COLORS = {
  HEADER_BG: '#004D99',       // Xanh đậm VietinBank
  HEADER_FG: '#FFFFFF',       // Trắng
  ZEBRA_BG: '#F8FAFC',        // Nền xen kẽ nhạt
  BORDER: '#CBD5E1',          // Viền kẻ mảnh
  HIGHLIGHT_VIP: '#FEF9C3',   // Vàng gold nhẹ cho VIP
  SUCCESS_BG: '#DCFCE7',      // Xanh lá nhẹ
  SUCCESS_FG: '#166534',
  WARNING_BG: '#FEF3C7',      // Vàng hổ phách
  WARNING_FG: '#92400E',
  DANGER_BG: '#FFE4E6',       // Đỏ hồng nhẹ
  DANGER_FG: '#9F1239'
};

/**
 * Xử lý yêu cầu HTTP GET từ Frontend WebApp
 */
function doGet(e) {
  return handleRequest(e, 'GET');
}

/**
 * Xử lý yêu cầu HTTP POST từ Frontend WebApp
 */
function doPost(e) {
  return handleRequest(e, 'POST');
}

/**
 * Bộ định tuyến (Router) xử lý API tập trung, trả về JSON chuẩn
 */
function handleRequest(e, method) {
  var output = {
    success: false,
    message: '',
    data: null,
    error: null
  };

  try {
    var params = {};
    if (method === 'GET') {
      params = (e && e.parameter) ? e.parameter : {};
    } else {
      if (e && e.postData && e.postData.contents) {
        try {
          params = JSON.parse(e.postData.contents);
        } catch (err) {
          params = e.parameter || {};
        }
      } else {
        params = (e && e.parameter) ? e.parameter : {};
      }
    }

    var action = params.action || 'ping';

    switch (action) {
      case 'ping':
      case 'healthCheck':
        output = getSystemHealth();
        break;

      case 'setupDatabase':
        output = setupDatabase();
        break;

      case 'formatDatabaseSheets':
        output = formatDatabaseSheets();
        break;

      case 'setupTriggers':
        output = setupTriggers();
        break;

      case 'login':
        output = loginUser(params.username, params.password);
        break;

      case 'getUsers':
        output = getUsers();
        break;

      case 'addUser':
        output = addUser(params.user);
        break;

      case 'updateUser':
        output = updateUser(params.user);
        break;

      case 'resetUserPassword':
        output = resetUserPassword(params.username, params.newPassword);
        break;

      case 'deleteUser':
        output = deleteUser(params.username);
        break;

      case 'getInitialData':
        output = getInitialData(params.userEmail, params.userRole);
        break;

      case 'getBootstrapData':
        output = getBootstrapData(params.userEmail, params.userRole, params.recentLimit);
        break;

      case 'getCustomers':
        output = getCustomers(params.userEmail, params.userRole);
        break;

      case 'addCustomer':
        output = addCustomer(params.customer);
        break;

      case 'updateCustomer':
        output = updateCustomer(params.customer);
        break;

      case 'deleteCustomer':
        output = deleteCustomer(params.idKh);
        break;

      case 'toggleCareMode':
        output = toggleCareMode(params.idKh, params.cheDoChamSoc);
        break;

      case 'recordMeeting':
        output = recordMeeting(params.meeting, params.newTask);
        break;

      case 'updateMeeting':
        output = updateMeeting(params.meeting);
        break;

      case 'deleteMeeting':
        output = deleteMeeting(params.idLichSu);
        break;

      case 'createTask':
        output = createTask(params.task);
        break;

      case 'updateTask':
        output = updateTask(params.task);
        break;

      case 'updateTaskStatus':
        output = updateTaskStatus(params.idCongViec, params.trangThai);
        break;

      case 'deleteTask':
        output = deleteTask(params.idCongViec);
        break;

      case 'saveCareEvent':
        output = saveCareEvent(params.careEvent);
        break;

      case 'deleteCareEvent':
        output = deleteCareEvent(params.idSuKien);
        break;

      case 'updateEmailConfig':
        output = updateEmailConfig(params.config);
        break;

      case 'sendTestEmail':
        output = sendTestEmail(params.targetEmail);
        break;

      case 'manualCheckCareReminders':
        output = manualCheckCareReminders();
        break;

      case 'getEmailLogs':
        output = getEmailLogs(params.statusFilter);
        break;

      case 'syncAllToSheets':
        output = syncAllToSheets(params.payload || params);
        break;

      // CÁC HÀNH ĐỘNG V2 MỚI
      case 'addCareHistory':
        output = addCareHistory(params.care, params.nextTask);
        break;

      case 'getCareHistories':
        output = getCareHistories(params.idKh);
        break;

      case 'getAuditLogs':
        output = getAuditLogs(params.limit);
        break;

      case 'getDemandCategories':
        output = getDemandCategories();
        break;

      case 'recordQuickActivity':
        output = recordQuickActivity(params.activity);
        break;

      default:
        output.success = false;
        output.message = 'Hành động (action) không hợp lệ: ' + action;
        break;
    }

    // Tự động xóa cache backend nếu là thao tác cập nhật dữ liệu
    var writeActions = [
      'addCustomer', 'updateCustomer', 'deleteCustomer', 'toggleCareMode',
      'recordMeeting', 'updateMeeting', 'deleteMeeting', 'createTask', 'updateTask', 
      'updateTaskStatus', 'deleteTask', 'saveCareEvent', 'deleteCareEvent', 'recordQuickActivity', 'syncAllToSheets'
    ];
    if (output && output.success && writeActions.indexOf(action) !== -1) {
      invalidateBackendCache();
    }

  } catch (err) {
    output.success = false;
    output.message = 'Lỗi xử lý máy chủ Apps Script: ' + err.toString();
    output.error = err.stack || err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * =========================================================================
 * I. THIẾT LẬP VÀ ĐỊNH DẠNG DATABASE GOOGLE SHEETS
 * =========================================================================
 */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return { success: false, message: 'Không thể mở Spreadsheet hiện tại. Vui lòng kiểm tra quyền.' };
  }

  var createdSheets = [];

  // 1. KHACH_HANG
  var khHeaders = [
    'ID_KH', 'HO_TEN', 'LOAI_KHACH_HANG', 'TEN_CONG_TY', 'CHUC_VU',
    'SDT', 'NGAY_SINH', 'DIA_CHI', 'LATITUDE', 'LONGITUDE', 'GOOGLE_MAP_URL',
    'NGANH_NGHE', 'NHU_CAU', 'GHI_CHU', 'PHAN_LOAI', 'CHE_DO_CHAM_SOC', 'SU_KIEN_CHAM_SOC',
    'CAN_BO_PHU_TRACH', 'USER_CAN_BO', 'EMAIL_CAN_BO',
    'NGUOI_KHOI_TAO', 'USER_KHOI_TAO', 'PHONG_BAN_KHOI_TAO',
    'NGUOI_CAP_NHAT_CUOI', 'USER_CAP_NHAT_CUOI',
    'NGAY_TAO', 'NGAY_CAP_NHAT', 'TRANG_THAI'
  ];
  ensureSheetWithHeaders(ss, SHEET_NAMES.KHACH_HANG, khHeaders, createdSheets);

  // 2. LICH_SU_GAP (Bổ sung 3 cột V2 ở cuối: CHECK_IN_TIME, GPS_ACCURACY, CHECK_IN_STATUS)
  var lsgHeaders = [
    'ID_LICH_SU', 'ID_KH', 'THOI_GIAN_GAP', 'HINH_THUC_GAP', 
    'LATITUDE', 'LONGITUDE', 'GOOGLE_MAP_URL', 'NOI_DUNG_TRAO_DOI', 
    'NHU_CAU_KHACH_HANG', 'TINH_TRANG_SAU_GAP', 'CONG_VIEC_TIEP_THEO', 
    'NGAY_HEN_LIEN_HE', 'GHI_CHU', 'CAN_BO_THUC_HIEN', 'THOI_GIAN_CAP_NHAT',
    'CHECK_IN_TIME', 'GPS_ACCURACY', 'CHECK_IN_STATUS'
  ];
  ensureSheetWithHeaders(ss, SHEET_NAMES.LICH_SU_GAP, lsgHeaders, createdSheets);

  // 3. CONG_VIEC (Bổ sung 2 cột V2 ở cuối: NGUON_TAO, PRIORITY)
  var cvHeaders = [
    'ID_CONG_VIEC', 'ID_KH', 'NOI_DUNG', 'NGAY_HAN', 
    'CAN_BO', 'TRANG_THAI', 'NGAY_TAO', 'NGAY_HOAN_THANH', 'GHI_CHU',
    'NGUON_TAO', 'PRIORITY'
  ];
  ensureSheetWithHeaders(ss, SHEET_NAMES.CONG_VIEC, cvHeaders, createdSheets);

  // 4. SU_KIEN_CHAM_SOC
  var skHeaders = [
    'ID_SU_KIEN', 'TEN_SU_KIEN', 'NGAY', 'LOAI', 'SO_NGAY_NHAC_TRUOC', 'TRANG_THAI'
  ];
  var skSheet = ensureSheetWithHeaders(ss, SHEET_NAMES.SU_KIEN_CHAM_SOC, skHeaders, createdSheets);
  if (skSheet.getLastRow() === 1) {
    var defaultEvents = [
      ['SK_01', 'Sinh nhật khách hàng', 'SINH_NHAT', 'SinhNhat', 3, 'Bật'],
      ['SK_02', 'Ngày Quốc tế Phụ nữ 8/3', '08/03', 'NgayLe', 3, 'Bật'],
      ['SK_03', 'Ngày Phụ nữ Việt Nam 20/10', '20/10', 'NgayLe', 3, 'Bật'],
      ['SK_04', 'Ngày Thương binh Liệt sĩ 27/7', '27/07', 'NgayLe', 2, 'Bật'],
      ['SK_05', 'Quốc khánh 2/9', '02/09', 'NgayLe', 3, 'Bật'],
      ['SK_06', 'Tết Nguyên Đán', '01/01_AL', 'Tet', 7, 'Bật'],
      ['SK_07', 'Ngày Doanh nhân Việt Nam 13/10', '13/10', 'NgayLe', 3, 'Bật']
    ];
    skSheet.getRange(2, 1, defaultEvents.length, defaultEvents[0].length).setValues(defaultEvents);
  }

  // 5. CAN_BO
  var cbHeaders = [
    'STT', 'MA_NV', 'HO_TEN', 'USER', 'PASSWORD', 'PHONG_BAN', 'VI_TRI', 'SDT', 'EMAIL', 'ROLE', 'IS_LEADER', 'TRANG_THAI'
  ];
  var cbSheet = ensureSheetWithHeaders(ss, SHEET_NAMES.CAN_BO, cbHeaders, createdSheets);
  if (cbSheet.getLastRow() === 1) {
    var defaultUsers = [
      [1, 'ADMIN01', 'Quản trị viên Hệ thống', 'admin', 'admin123', 'Quản trị hệ thống', 'Quản trị viên cấp cao', '0943882109', 'trongduc.ict@gmail.com', 'ADMIN', 'true', 'Hoạt động'],
      [2, '00005568', 'Đinh Xuân Thắng', 'thangdx', '123', 'Ban giám đốc', 'Giám đốc CN', '0979792099', 'THANGDX@VIETINBANK.VN', 'LANH_DAO', 'true', 'Hoạt động'],
      [3, '00006961', 'Bùi Thị Thu Dung', 'dung.bt', '123', 'Ban giám đốc', 'Phó Giám đốc CN (KHDN)', '0945040477', 'DUNG.BT@VIETINBANK.VN', 'LANH_DAO', 'true', 'Hoạt động'],
      [4, '00006962', 'Đoàn Mạnh Dương', 'duongdm', '123', 'Ban giám đốc', 'Phó Giám đốc Đầu mối Bán lẻ', '0915518668', 'DUONGDM@VIETINBANK.VN', 'LANH_DAO', 'true', 'Hoạt động'],
      [5, '00057053', 'Nguyễn Trọng Đức', 'ducnt4', '123', 'Phòng Khách hàng Bán lẻ', 'Phó Trưởng phòng Phụ trách', '0914882109', 'DUCNT4@VIETINBANK.VN', 'LANH_DAO', 'true', 'Hoạt động']
    ];
    cbSheet.getRange(2, 1, defaultUsers.length, defaultUsers[0].length).setValues(defaultUsers);
  }

  // 6. EMAIL_CONFIG
  var cfgHeaders = ['KEY', 'VALUE', 'MO_TA'];
  var cfgSheet = ensureSheetWithHeaders(ss, SHEET_NAMES.EMAIL_CONFIG, cfgHeaders, createdSheets);
  if (cfgSheet.getLastRow() === 1) {
    var defaultConfigs = [
      ['ADMIN_EMAIL', 'DUCNT4@VIETINBANK.VN', 'Email nhận thông báo hệ thống'],
      ['EMAIL_FROM_NAME', 'Sổ Tay QHKH - VietinBank Ninh Bình', 'Tên hiển thị người gửi email'],
      ['EMAIL_ENABLED', 'true', 'Bật (true) hoặc Tắt (false) gửi email tự động'],
      ['REMINDER_DAYS', '7,3,1', 'Các mốc ngày gửi email nhắc trước'],
      ['TEST_EMAIL', 'trongduc.ict@gmail.com', 'Email nhận thử nghiệm'],
      ['APP_URL', 'https://crm-pocket-bank.web.app', 'Đường dẫn mở WebApp']
    ];
    cfgSheet.getRange(2, 1, defaultConfigs.length, defaultConfigs[0].length).setValues(defaultConfigs);
  }

  // 7. EMAIL_LOG
  var logHeaders = [
    'ID_LOG', 'THOI_GIAN', 'ID_KH', 'HO_TEN_KH', 'EMAIL_NHAN', 
    'LOAI_SU_KIEN', 'NGAY_SU_KIEN', 'SO_NGAY_TRUOC', 'THOI_GIAN_GUI', 
    'TRANG_THAI', 'LOI_CHI_TIET', 'MESSAGE_ID_NHAP_NEU_CO'
  ];
  ensureSheetWithHeaders(ss, SHEET_NAMES.EMAIL_LOG, logHeaders, createdSheets);

  // 8. LICH_SU_CHAM_SOC (Mới V2)
  var lscsHeaders = [
    'ID_CHAM_SOC', 'ID_KH', 'THOI_GIAN', 'HINH_THUC', 'SU_KIEN', 
    'NOI_DUNG', 'KET_QUA', 'CAN_BO', 'GHI_CHU'
  ];
  ensureSheetWithHeaders(ss, SHEET_NAMES.LICH_SU_CHAM_SOC, lscsHeaders, createdSheets);

  // 9. AUDIT_LOG (Mới V2)
  var auditHeaders = [
    'ID_LOG', 'THOI_GIAN', 'USER', 'HO_TEN', 'ACTION', 
    'OBJECT_TYPE', 'OBJECT_ID', 'NOI_DUNG'
  ];
  ensureSheetWithHeaders(ss, SHEET_NAMES.AUDIT_LOG, auditHeaders, createdSheets);

  // 10. DM_NHU_CAU (Mới V2 - Danh mục chuẩn hóa nhu cầu tài chính)
  var dmNhuCauHeaders = [
    'ID_NHU_CAU', 'NHOM_NHU_CAU', 'TEN_NHU_CAU', 'TRANG_THAI', 'THU_TU'
  ];
  var dmSheet = ensureSheetWithHeaders(ss, SHEET_NAMES.DM_NHU_CAU, dmNhuCauHeaders, createdSheets);
  if (dmSheet.getLastRow() === 1) {
    var defaultDemands = [
      ['NC_01', 'VAY', 'Vay SXKD / Hạn mức kinh doanh', 'Hoạt động', 1],
      ['NC_02', 'VAY', 'Vay mua bất động sản / Nhà ở', 'Hoạt động', 2],
      ['NC_03', 'VAY', 'Vay mua ô tô', 'Hoạt động', 3],
      ['NC_04', 'VAY', 'Vay tiêu dùng tín chấp / Cán bộ nhân viên', 'Hoạt động', 4],
      ['NC_05', 'TIEN_GUI', 'Tiền gửi tiết kiệm dân cư', 'Hoạt động', 5],
      ['NC_06', 'TIEN_GUI', 'Tiền gửi thanh toán / CASA Doanh nghiệp', 'Hoạt động', 6],
      ['NC_07', 'THE', 'Thẻ tín dụng quốc tế (Visa/Master)', 'Hoạt động', 7],
      ['NC_08', 'THE', 'Thẻ ghi nợ / Thẻ thấu chi', 'Hoạt động', 8],
      ['NC_09', 'NGAN_HANG_SO', 'VietinBank iPay Mobile', 'Hoạt động', 9],
      ['NC_10', 'NGAN_HANG_SO', 'Ngân hàng số eFAST cho Doanh nghiệp', 'Hoạt động', 10],
      ['NC_11', 'NGAN_HANG_SO', 'QR Pay / POS chấp nhận thanh toán', 'Hoạt động', 11],
      ['NC_12', 'BAO_HIEM', 'Bảo hiểm nhân thọ Aviva / Manulife', 'Hoạt động', 12],
      ['NC_13', 'BAO_HIEM', 'Bảo hiểm phi nhân thọ VBI (Xe, Kho, Tài sản)', 'Hoạt động', 13],
      ['NC_14', 'NGOAI_TE', 'Mua bán ngoại tệ / Kiều hối', 'Hoạt động', 14],
      ['NC_15', 'THANH_TOAN', 'Dịch vụ trả lương qua tài khoản (Payroll)', 'Hoạt động', 15]
    ];
    dmSheet.getRange(2, 1, defaultDemands.length, defaultDemands[0].length).setValues(defaultDemands);
  }

  // Định dạng làm đẹp tất cả Sheet chuẩn VietinBank
  formatAllSheetsPrettily(ss);

  return {
    success: true,
    message: 'Thiết lập và định dạng Database thành công! Đã chuẩn hóa 10 Sheet: KHACH_HANG, LICH_SU_GAP, CONG_VIEC, SU_KIEN_CHAM_SOC, CAN_BO, EMAIL_CONFIG, EMAIL_LOG, LICH_SU_CHAM_SOC, AUDIT_LOG, DM_NHU_CAU.',
    data: { createdSheets: createdSheets }
  };
}

/**
 * Đảm bảo Sheet tồn tại với danh sách cột chuẩn, tự động bổ sung cột còn thiếu
 */
function ensureSheetWithHeaders(ss, sheetName, headers, createdList) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    createdList.push(sheetName);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    // Nếu sheet đã có, kiểm tra xem có thiếu cột nào không để bổ sung vào cuối
    var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var existingMap = {};
    for (var i = 0; i < existingHeaders.length; i++) {
      existingMap[String(existingHeaders[i]).trim()] = true;
    }
    var missingHeaders = [];
    for (var j = 0; j < headers.length; j++) {
      if (!existingMap[headers[j]]) {
        missingHeaders.push(headers[j]);
      }
    }
    if (missingHeaders.length > 0) {
      var startCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
    }
  }
  return sheet;
}

/**
 * Hàm định dạng làm đẹp tất cả 7 Sheet theo quy chuẩn nhận diện VietinBank
 */
function formatDatabaseSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return { success: false, message: 'Spreadsheet không khả dụng.' };
  formatAllSheetsPrettily(ss);
  return {
    success: true,
    message: 'Đã định dạng thành công toàn bộ 7 Sheet theo chuẩn nhận diện VietinBank: dòng tiêu đề xanh #004D99, viền kẻ mảnh, độ rộng cột tối ưu, đóng băng dòng đầu và bật bộ lọc tự động.'
  };
}

function formatAllSheetsPrettily(ss) {
  var sheetConfigs = [
    {
      name: SHEET_NAMES.KHACH_HANG,
      colWidths: {
        1: 120, // ID_KH
        2: 210, // HO_TEN
        3: 130, // LOAI_KHACH_HANG
        4: 230, // TEN_CONG_TY
        5: 140, // CHUC_VU
        6: 120, // SDT
        7: 110, // NGAY_SINH
        8: 260, // DIA_CHI
        9: 100, // LATITUDE
        10: 100, // LONGITUDE
        11: 140, // GOOGLE_MAP_URL
        12: 150, // NGANH_NGHE
        13: 200, // NHU_CAU
        14: 200, // GHI_CHU
        15: 160, // PHAN_LOAI
        16: 120, // CHE_DO_CHAM_SOC
        17: 180, // SU_KIEN_CHAM_SOC
        18: 180, // CAN_BO_PHU_TRACH
        19: 110, // USER_CAN_BO
        20: 190, // EMAIL_CAN_BO
        21: 170, // NGUOI_KHOI_TAO
        22: 120, // USER_KHOI_TAO
        23: 170, // PHONG_BAN_KHOI_TAO
        24: 170, // NGUOI_CAP_NHAT_CUOI
        25: 120, // USER_CAP_NHAT_CUOI
        26: 150, // NGAY_TAO
        27: 150, // NGAY_CAP_NHAT
        28: 120  // TRANG_THAI
      }
    },
    {
      name: SHEET_NAMES.LICH_SU_GAP,
      colWidths: {
        1: 120, // ID_LICH_SU
        2: 120, // ID_KH
        3: 150, // THOI_GIAN_GAP
        4: 130, // HINH_THUC_GAP
        5: 100, // LATITUDE
        6: 100, // LONGITUDE
        7: 140, // GOOGLE_MAP_URL
        8: 300, // NOI_DUNG_TRAO_DOI
        9: 220, // NHU_CAU_KHACH_HANG
        10: 160, // TINH_TRANG_SAU_GAP
        11: 220, // CONG_VIEC_TIEP_THEO
        12: 140, // NGAY_HEN_LIEN_HE
        13: 200, // GHI_CHU
        14: 180, // CAN_BO_THUC_HIEN
        15: 150  // THOI_GIAN_CAP_NHAT
      }
    },
    {
      name: SHEET_NAMES.CONG_VIEC,
      colWidths: {
        1: 120, // ID_CONG_VIEC
        2: 120, // ID_KH
        3: 320, // NOI_DUNG
        4: 140, // NGAY_HAN
        5: 180, // CAN_BO
        6: 140, // TRANG_THAI
        7: 150, // NGAY_TAO
        8: 150, // NGAY_HOAN_THANH
        9: 200  // GHI_CHU
      }
    },
    {
      name: SHEET_NAMES.SU_KIEN_CHAM_SOC,
      colWidths: {
        1: 110, // ID_SU_KIEN
        2: 240, // TEN_SU_KIEN
        3: 120, // NGAY
        4: 120, // LOAI
        5: 140, // SO_NGAY_NHAC_TRUOC
        6: 120  // TRANG_THAI
      }
    },
    {
      name: SHEET_NAMES.CAN_BO,
      colWidths: {
        1: 60,  // STT
        2: 110, // MA_NV
        3: 200, // HO_TEN
        4: 120, // USER
        5: 110, // PASSWORD
        6: 180, // PHONG_BAN
        7: 180, // VI_TRI
        8: 120, // SDT
        9: 200, // EMAIL
        10: 110, // ROLE
        11: 100, // IS_LEADER
        12: 120  // TRANG_THAI
      }
    },
    {
      name: SHEET_NAMES.EMAIL_CONFIG,
      colWidths: {
        1: 180, // KEY
        2: 260, // VALUE
        3: 280  // MO_TA
      }
    },
    {
      name: SHEET_NAMES.EMAIL_LOG,
      colWidths: {
        1: 120, // ID_LOG
        2: 150, // THOI_GIAN
        3: 120, // ID_KH
        4: 200, // HO_TEN_KH
        5: 220, // EMAIL_NHAN
        6: 160, // LOAI_SU_KIEN
        7: 120, // NGAY_SU_KIEN
        8: 120, // SO_NGAY_TRUOC
        9: 150, // THOI_GIAN_GUI
        10: 120, // TRANG_THAI
        11: 260, // LOI_CHI_TIET
        12: 160  // MESSAGE_ID
      }
    },
    {
      name: SHEET_NAMES.LICH_SU_CHAM_SOC,
      colWidths: {
        1: 120, // ID_CHAM_SOC
        2: 120, // ID_KH
        3: 150, // THOI_GIAN
        4: 120, // HINH_THUC
        5: 180, // SU_KIEN
        6: 250, // NOI_DUNG
        7: 180, // KET_QUA
        8: 180, // CAN_BO
        9: 200  // GHI_CHU
      }
    },
    {
      name: SHEET_NAMES.AUDIT_LOG,
      colWidths: {
        1: 120, // ID_LOG
        2: 160, // THOI_GIAN
        3: 120, // USER
        4: 180, // HO_TEN
        5: 140, // ACTION
        6: 130, // OBJECT_TYPE
        7: 130, // OBJECT_ID
        8: 300  // NOI_DUNG
      }
    },
    {
      name: SHEET_NAMES.DM_NHU_CAU,
      colWidths: {
        1: 110, // ID_NHU_CAU
        2: 140, // NHOM_NHU_CAU
        3: 280, // TEN_NHU_CAU
        4: 120, // TRANG_THAI
        5: 80   // THU_TU
      }
    }
  ];

  sheetConfigs.forEach(function(cfg) {
    var sheet = ss.getSheetByName(cfg.name);
    if (!sheet) return;

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastCol === 0) return;

    // 1. Dòng tiêu đề (Header row 1)
    var headerRange = sheet.getRange(1, 1, 1, lastCol);
    headerRange
      .setBackground(BRAND_COLORS.HEADER_BG)
      .setFontColor(BRAND_COLORS.HEADER_FG)
      .setFontWeight('bold')
      .setFontSize(11)
      .setVerticalAlignment('middle')
      .setHorizontalAlignment('center')
      .setWrap(true);

    sheet.setRowHeight(1, 38);
    sheet.setFrozenRows(1);

    // 2. Viền và kẻ bảng toàn bộ vùng dữ liệu
    var totalRows = Math.max(lastRow, 2);
    var dataRange = sheet.getRange(1, 1, totalRows, lastCol);
    dataRange.setBorder(true, true, true, true, true, true, BRAND_COLORS.BORDER, SpreadsheetApp.BorderStyle.SOLID);

    // 3. Định dạng hàng dữ liệu xen kẽ (Zebra striping)
    if (lastRow > 1) {
      sheet.setRowHeights(2, lastRow - 1, 28);
      for (var r = 2; r <= lastRow; r++) {
        var rowRange = sheet.getRange(r, 1, 1, lastCol);
        rowRange.setFontSize(10).setVerticalAlignment('middle');
        if (r % 2 === 1) {
          rowRange.setBackground(BRAND_COLORS.ZEBRA_BG);
        } else {
          rowRange.setBackground('#FFFFFF');
        }
      }
    }

    // 4. Áp dụng độ rộng cột khoa học
    if (cfg.colWidths) {
      Object.keys(cfg.colWidths).forEach(function(colIndexStr) {
        var c = parseInt(colIndexStr, 10);
        if (c <= lastCol) {
          sheet.setColumnWidth(c, cfg.colWidths[colIndexStr]);
        }
      });
    }

    // 5. Bật bộ lọc tự động nếu chưa có
    try {
      if (!sheet.getFilter() && lastRow >= 1) {
        sheet.getDataRange().createFilter();
      }
    } catch (e) {}
  });
}

/**
 * =========================================================================
 * II. QUẢN TRỊ NGƯỜI DÙNG & ĐĂNG NHẬP (CAN_BO)
 * =========================================================================
 */
function getUsers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.CAN_BO) : null;
  if (!sheet) return { success: false, message: 'Bảng CAN_BO không tồn tại.' };

  var rows = sheetToObjects(sheet);
  var users = rows.map(mapUserFromSheet);

  return {
    success: true,
    message: 'Tải danh sách cán bộ thành công.',
    data: users
  };
}

function loginUser(username, password) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.CAN_BO) : null;
  if (!sheet) return { success: false, message: 'Bảng CAN_BO không tồn tại.' };

  var uName = String(username || '').trim().toLowerCase();
  var pWord = String(password || '').trim();

  var rows = sheetToObjects(sheet);
  var users = rows.map(mapUserInternalWithPassword);

  var found = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].user.toLowerCase() === uName) {
      found = users[i];
      break;
    }
  }

  if (!found) {
    return { success: false, message: 'Tên đăng nhập không tồn tại trong danh bạ cán bộ ngân hàng.' };
  }

  if (found.trangThai === 'Khóa') {
    return { success: false, message: 'Tài khoản cán bộ này đã bị khóa. Vui lòng liên hệ Quản trị viên.' };
  }

  var expectedPwd = found.password || (found.user === 'admin' ? 'admin123' : '123');
  if (pWord !== expectedPwd) {
    return { success: false, message: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!' };
  }

  // Ghi nhận Audit Log Đăng nhập
  try {
    recordAuditLogInternal('LOGIN', 'AUTH', found.user, 'Cán bộ ' + found.hoTen + ' (' + found.user + ') đăng nhập thành công vào hệ thống.', found.user, found.hoTen);
  } catch (e) {}

  var safeUser = cloneObject(found);
  delete safeUser.password;
  safeUser.token = Utilities.base64Encode(Utilities.computeHmacSha256Signature(found.user + ':' + found.role + ':' + new Date().toDateString(), 'VIETINBANK_SECURE_SALT_V2'));

  return {
    success: true,
    message: 'Đăng nhập thành công! Chào mừng ' + found.hoTen + ' (' + found.viTri + ').',
    data: safeUser
  };
}

function addUser(user) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.CAN_BO) : null;
  if (!sheet) return { success: false, message: 'Bảng CAN_BO không tồn tại.' };

  var headerMap = getHeaderMap(sheet);
  var data = sheet.getDataRange().getValues();
  var userCol = headerMap['USER'];

  var targetUser = String(user.user || '').trim().toLowerCase();
  if (userCol !== undefined) {
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][userCol]).trim().toLowerCase() === targetUser) {
        return { success: false, message: 'Tên đăng nhập "' + user.user + '" đã tồn tại.' };
      }
    }
  }

  var newRow = [];
  var lastCol = sheet.getLastColumn();
  for (var c = 0; c < lastCol; c++) newRow.push('');

  setCellByHeader(newRow, headerMap, 'STT', sheet.getLastRow());
  setCellByHeader(newRow, headerMap, 'MA_NV', user.maNv || '');
  setCellByHeader(newRow, headerMap, 'HO_TEN', user.hoTen || '');
  setCellByHeader(newRow, headerMap, 'USER', user.user || '');
  setCellByHeader(newRow, headerMap, 'PASSWORD', user.password || '123');
  setCellByHeader(newRow, headerMap, 'PHONG_BAN', user.phongBan || '');
  setCellByHeader(newRow, headerMap, 'VI_TRI', user.viTri || '');
  setCellByHeader(newRow, headerMap, 'SDT', user.sdt || '');
  setCellByHeader(newRow, headerMap, 'EMAIL', user.email || '');
  setCellByHeader(newRow, headerMap, 'ROLE', user.role || 'QHKH');
  setCellByHeader(newRow, headerMap, 'IS_LEADER', String(user.isLeader || false));
  setCellByHeader(newRow, headerMap, 'TRANG_THAI', user.trangThai || 'Hoạt động');

  sheet.appendRow(newRow);
  formatSingleRow(sheet, sheet.getLastRow());

  return { success: true, message: 'Thêm cán bộ thành công.', data: user };
}

function updateUser(user) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.CAN_BO) : null;
  if (!sheet) return { success: false, message: 'Bảng CAN_BO không tồn tại.' };

  var headerMap = getHeaderMap(sheet);
  var userCol = headerMap['USER'];
  if (userCol === undefined) return { success: false, message: 'Không tìm thấy cột USER trong bảng CAN_BO.' };

  var data = sheet.getDataRange().getValues();
  var targetUser = String(user.user || '').trim().toLowerCase();
  var targetRow = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][userCol]).trim().toLowerCase() === targetUser) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    return { success: false, message: 'Không tìm thấy cán bộ với tên đăng nhập: ' + user.user };
  }

  updateSheetRowByHeaderMap(sheet, targetRow, headerMap, {
    MA_NV: user.maNv,
    HO_TEN: user.hoTen,
    PHONG_BAN: user.phongBan,
    VI_TRI: user.viTri,
    SDT: user.sdt,
    EMAIL: user.email,
    ROLE: user.role,
    IS_LEADER: user.isLeader !== undefined ? String(user.isLeader) : undefined,
    TRANG_THAI: user.trangThai,
    PASSWORD: user.password
  });

  return { success: true, message: 'Cập nhật cán bộ thành công.', data: user };
}

function resetUserPassword(username, newPassword) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.CAN_BO) : null;
  if (!sheet) return { success: false, message: 'Bảng CAN_BO không tồn tại.' };

  var headerMap = getHeaderMap(sheet);
  var userCol = headerMap['USER'];
  var pwdCol = headerMap['PASSWORD'];
  if (userCol === undefined || pwdCol === undefined) {
    return { success: false, message: 'Cấu trúc bảng CAN_BO không đúng.' };
  }

  var data = sheet.getDataRange().getValues();
  var targetUser = String(username || '').trim().toLowerCase();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][userCol]).trim().toLowerCase() === targetUser) {
      var pwd = newPassword || (targetUser === 'admin' ? 'admin123' : '123');
      sheet.getRange(i + 1, pwdCol + 1).setValue(pwd);
      return { success: true, message: 'Đã đặt lại mật khẩu cho cán bộ ' + username + ' thành: ' + pwd };
    }
  }

  return { success: false, message: 'Không tìm thấy cán bộ: ' + username };
}

function deleteUser(username) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.CAN_BO) : null;
  if (!sheet) return { success: false, message: 'Bảng CAN_BO không tồn tại.' };

  var headerMap = getHeaderMap(sheet);
  var userCol = headerMap['USER'];
  if (userCol === undefined) return { success: false, message: 'Cột USER không tồn tại.' };

  var data = sheet.getDataRange().getValues();
  var targetUser = String(username || '').trim().toLowerCase();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][userCol]).trim().toLowerCase() === targetUser) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Đã xóa tài khoản cán bộ: ' + username };
    }
  }

  return { success: false, message: 'Không tìm thấy cán bộ: ' + username };
}

/**
 * =========================================================================
 * III. CÁC HÀM CRUD KHÁCH HÀNG (KHACH_HANG)
 * =========================================================================
 */
function getCustomers(userEmail, userRole) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.KHACH_HANG) : null;
  if (!sheet) return { success: true, data: [] };

  var raw = sheetToObjects(sheet);
  var customers = raw.map(mapCustomerFromSheet);

  if (userRole === 'QHKH' && userEmail) {
    customers = customers.filter(function(c) {
      return (c.emailCanBo && c.emailCanBo.toLowerCase() === userEmail.toLowerCase()) ||
             (c.canBoPhuTrach && userEmail.toLowerCase().indexOf(c.canBoPhuTrach.toLowerCase()) !== -1);
    });
  }

  return { success: true, data: customers };
}

function addCustomer(cust) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.KHACH_HANG) : null;
  if (!sheet) return { success: false, message: 'Bảng KHACH_HANG không tồn tại.' };

  var headerMap = getHeaderMap(sheet);
  var idKh = cust.idKh || (cust.sdt ? String(cust.sdt).replace(/\D/g, '') : ('KH_' + Utilities.getUuid().slice(0, 8).toUpperCase()));
  var nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');

  var newRow = [];
  var lastCol = sheet.getLastColumn();
  for (var c = 0; c < lastCol; c++) newRow.push('');

  setCellByHeader(newRow, headerMap, 'ID_KH', idKh);
  setCellByHeader(newRow, headerMap, 'HO_TEN', cust.hoTen || '');
  setCellByHeader(newRow, headerMap, 'LOAI_KHACH_HANG', cust.loaiKhachHang || 'Cá nhân');
  setCellByHeader(newRow, headerMap, 'TEN_CONG_TY', cust.tenCongTy || '');
  setCellByHeader(newRow, headerMap, 'CHUC_VU', cust.chucVu || '');
  setCellByHeader(newRow, headerMap, 'SDT', cust.sdt || '');
  setCellByHeader(newRow, headerMap, 'NGAY_SINH', cust.ngaySinh || '');
  setCellByHeader(newRow, headerMap, 'DIA_CHI', cust.diaChi || '');
  setCellByHeader(newRow, headerMap, 'LATITUDE', cust.latitude || '');
  setCellByHeader(newRow, headerMap, 'LONGITUDE', cust.longitude || '');
  setCellByHeader(newRow, headerMap, 'GOOGLE_MAP_URL', cust.googleMapUrl || '');
  setCellByHeader(newRow, headerMap, 'NGANH_NGHE', cust.nganhNghe || '');
  setCellByHeader(newRow, headerMap, 'NHU_CAU', cust.nhuCau || '');
  setCellByHeader(newRow, headerMap, 'GHI_CHU', cust.ghiChu || '');
  setCellByHeader(newRow, headerMap, 'PHAN_LOAI', cust.phanLoai || 'Đang tiếp thị');
  setCellByHeader(newRow, headerMap, 'CHE_DO_CHAM_SOC', cust.cheDoChamSoc || 'Tắt');
  setCellByHeader(newRow, headerMap, 'SU_KIEN_CHAM_SOC', Array.isArray(cust.suKienChamSoc) ? cust.suKienChamSoc.join(', ') : (cust.suKienChamSoc || ''));
  setCellByHeader(newRow, headerMap, 'CAN_BO_PHU_TRACH', cust.canBoPhuTrach || '');
  setCellByHeader(newRow, headerMap, 'USER_CAN_BO', cust.userCanBo || '');
  setCellByHeader(newRow, headerMap, 'EMAIL_CAN_BO', cust.emailCanBo || '');
  setCellByHeader(newRow, headerMap, 'NGUOI_KHOI_TAO', cust.nguoiKhoiTao || cust.canBoPhuTrach || '');
  setCellByHeader(newRow, headerMap, 'USER_KHOI_TAO', cust.userKhoiTao || cust.userCanBo || '');
  setCellByHeader(newRow, headerMap, 'PHONG_BAN_KHOI_TAO', cust.phongBanKhoiTao || '');
  setCellByHeader(newRow, headerMap, 'NGUOI_CAP_NHAT_CUOI', cust.nguoiCapNhatCuoi || cust.canBoPhuTrach || '');
  setCellByHeader(newRow, headerMap, 'USER_CAP_NHAT_CUOI', cust.userCapNhatCuoi || cust.userCanBo || '');
  setCellByHeader(newRow, headerMap, 'NGAY_TAO', nowStr);
  setCellByHeader(newRow, headerMap, 'NGAY_CAP_NHAT', nowStr);
  setCellByHeader(newRow, headerMap, 'TRANG_THAI', cust.trangThai || 'Hoạt động');

  sheet.appendRow(newRow);
  formatSingleRow(sheet, sheet.getLastRow());

  cust.idKh = idKh;
  cust.ngayTao = nowStr;
  cust.ngayCapNhat = nowStr;

  return {
    success: true,
    message: 'Thêm khách hàng thành công vào Google Sheet.',
    data: cust
  };
}

function updateCustomer(cust) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.KHACH_HANG) : null;
  if (!sheet) return { success: false, message: 'Bảng KHACH_HANG không tồn tại.' };

  var headerMap = getHeaderMap(sheet);
  var idCol = headerMap['ID_KH'];
  if (idCol === undefined) return { success: false, message: 'Không tìm thấy cột ID_KH.' };

  var data = sheet.getDataRange().getValues();
  var targetRow = -1;
  var targetId = String(cust.idKh).trim();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]).trim() === targetId) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    return { success: false, message: 'Không tìm thấy khách hàng với mã: ' + cust.idKh };
  }

  var nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
  var updates = {
    HO_TEN: cust.hoTen,
    LOAI_KHACH_HANG: cust.loaiKhachHang,
    TEN_CONG_TY: cust.tenCongTy,
    CHUC_VU: cust.chucVu,
    SDT: cust.sdt,
    NGAY_SINH: cust.ngaySinh,
    DIA_CHI: cust.diaChi,
    LATITUDE: cust.latitude,
    LONGITUDE: cust.longitude,
    GOOGLE_MAP_URL: cust.googleMapUrl,
    NGANH_NGHE: cust.nganhNghe,
    NHU_CAU: cust.nhuCau,
    GHI_CHU: cust.ghiChu,
    PHAN_LOAI: cust.phanLoai,
    CHE_DO_CHAM_SOC: cust.cheDoChamSoc,
    SU_KIEN_CHAM_SOC: Array.isArray(cust.suKienChamSoc) ? cust.suKienChamSoc.join(', ') : cust.suKienChamSoc,
    CAN_BO_PHU_TRACH: cust.canBoPhuTrach,
    USER_CAN_BO: cust.userCanBo,
    EMAIL_CAN_BO: cust.emailCanBo,
    NGUOI_KHOI_TAO: cust.nguoiKhoiTao,
    USER_KHOI_TAO: cust.userKhoiTao,
    PHONG_BAN_KHOI_TAO: cust.phongBanKhoiTao,
    NGUOI_CAP_NHAT_CUOI: cust.nguoiCapNhatCuoi,
    USER_CAP_NHAT_CUOI: cust.userCapNhatCuoi,
    NGAY_CAP_NHAT: nowStr,
    TRANG_THAI: cust.trangThai
  };

  updateSheetRowByHeaderMap(sheet, targetRow, headerMap, updates);

  cust.ngayCapNhat = nowStr;
  return {
    success: true,
    message: 'Cập nhật thông tin khách hàng thành công trên Google Sheet.',
    data: cust
  };
}

function deleteCustomer(idKh) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.KHACH_HANG) : null;
  if (!sheet) return { success: false, message: 'Bảng KHACH_HANG không tồn tại.' };

  var headerMap = getHeaderMap(sheet);
  var idCol = headerMap['ID_KH'];
  if (idCol === undefined) return { success: false, message: 'Cột ID_KH không tồn tại.' };

  var data = sheet.getDataRange().getValues();
  var targetId = String(idKh).trim();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]).trim() === targetId) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Đã xóa khách hàng khỏi Google Sheet.' };
    }
  }

  return { success: false, message: 'Không tìm thấy khách hàng: ' + idKh };
}

function toggleCareMode(idKh, mode) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.KHACH_HANG) : null;
  if (!sheet) return { success: false, message: 'Bảng KHACH_HANG không tồn tại.' };

  var headerMap = getHeaderMap(sheet);
  var idCol = headerMap['ID_KH'];
  var careCol = headerMap['CHE_DO_CHAM_SOC'];
  var updateCol = headerMap['NGAY_CAP_NHAT'];

  if (idCol === undefined || careCol === undefined) {
    return { success: false, message: 'Cấu trúc bảng KHACH_HANG chưa đúng.' };
  }

  var data = sheet.getDataRange().getValues();
  var targetId = String(idKh).trim();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]).trim() === targetId) {
      var curMode = data[i][careCol];
      var targetMode = (mode === 'Bật' || mode === 'Tắt') ? mode : (curMode === 'Bật' ? 'Tắt' : 'Bật');
      sheet.getRange(i + 1, careCol + 1).setValue(targetMode);

      var nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
      if (updateCol !== undefined) {
        sheet.getRange(i + 1, updateCol + 1).setValue(nowStr);
      }

      return {
        success: true,
        message: 'Đã ' + targetMode + ' Chế độ chăm sóc cho khách hàng.',
        data: { idKh: idKh, cheDoChamSoc: targetMode }
      };
    }
  }

  return { success: false, message: 'Không tìm thấy khách hàng: ' + idKh };
}

/**
 * =========================================================================
 * IV. CÁC HÀM CRUD CUỘC GẶP (LICH_SU_GAP)
 * =========================================================================
 */
function recordMeeting(meeting, newTask) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var lsgSheet = ss ? ss.getSheetByName(SHEET_NAMES.LICH_SU_GAP) : null;
  var khSheet = ss ? ss.getSheetByName(SHEET_NAMES.KHACH_HANG) : null;
  var cvSheet = ss ? ss.getSheetByName(SHEET_NAMES.CONG_VIEC) : null;

  if (!lsgSheet) return { success: false, message: 'Bảng LICH_SU_GAP không tồn tại.' };

  var idLichSu = meeting.idLichSu || ('LS_' + Utilities.getUuid().slice(0, 8).toUpperCase());
  var nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');

  var headerMap = getHeaderMap(lsgSheet);
  var newRow = [];
  for (var c = 0; c < lsgSheet.getLastColumn(); c++) newRow.push('');

  setCellByHeader(newRow, headerMap, 'ID_LICH_SU', idLichSu);
  setCellByHeader(newRow, headerMap, 'ID_KH', meeting.idKh || '');
  setCellByHeader(newRow, headerMap, 'THOI_GIAN_GAP', meeting.thoiGianGap || nowStr);
  setCellByHeader(newRow, headerMap, 'HINH_THUC_GAP', meeting.hinhThucGap || 'Gặp trực tiếp');
  setCellByHeader(newRow, headerMap, 'LATITUDE', meeting.latitude || '');
  setCellByHeader(newRow, headerMap, 'LONGITUDE', meeting.longitude || '');
  setCellByHeader(newRow, headerMap, 'GOOGLE_MAP_URL', meeting.googleMapUrl || '');
  setCellByHeader(newRow, headerMap, 'NOI_DUNG_TRAO_DOI', meeting.noiDungTraoDoi || '');
  setCellByHeader(newRow, headerMap, 'NHU_CAU_KHACH_HANG', meeting.nhuCauKhachHang || '');
  setCellByHeader(newRow, headerMap, 'TINH_TRANG_SAU_GAP', meeting.tinhTrangSauGap || 'Đã gặp khách hàng');
  setCellByHeader(newRow, headerMap, 'CONG_VIEC_TIEP_THEO', meeting.congViecTiepTheo || '');
  setCellByHeader(newRow, headerMap, 'NGAY_HEN_LIEN_HE', meeting.ngayHenLienHe || '');
  setCellByHeader(newRow, headerMap, 'GHI_CHU', meeting.ghiChu || '');
  setCellByHeader(newRow, headerMap, 'CAN_BO_THUC_HIEN', meeting.canBoThucHien || '');
  setCellByHeader(newRow, headerMap, 'THOI_GIAN_CAP_NHAT', nowStr);
  // Cột mở rộng V2
  setCellByHeader(newRow, headerMap, 'CHECK_IN_TIME', meeting.checkInTime || nowStr);
  setCellByHeader(newRow, headerMap, 'GPS_ACCURACY', meeting.gpsAccuracy || '');
  setCellByHeader(newRow, headerMap, 'CHECK_IN_STATUS', meeting.checkInStatus || (meeting.latitude ? 'SUCCESS' : 'MANUAL'));

  lsgSheet.appendRow(newRow);
  formatSingleRow(lsgSheet, lsgSheet.getLastRow());

  // Cập nhật ngày gặp và nhu cầu vào bảng KHACH_HANG
  if (khSheet) {
    var khHeaderMap = getHeaderMap(khSheet);
    var khIdCol = khHeaderMap['ID_KH'];
    var khUpdCol = khHeaderMap['NGAY_CAP_NHAT'];
    var khDemCol = khHeaderMap['NHU_CAU'];
    var khData = khSheet.getDataRange().getValues();

    for (var i = 1; i < khData.length; i++) {
      if (String(khData[i][khIdCol]).trim() === String(meeting.idKh).trim()) {
        if (khUpdCol !== undefined) khSheet.getRange(i + 1, khUpdCol + 1).setValue(nowStr);
        if (khDemCol !== undefined && meeting.nhuCauKhachHang) {
          khSheet.getRange(i + 1, khDemCol + 1).setValue(meeting.nhuCauKhachHang);
        }
        break;
      }
    }
  }

  // Tạo công việc mới nếu có
  var createdTaskData = null;
  if (newTask && newTask.noiDung && cvSheet) {
    var idCv = 'CV_' + Utilities.getUuid().slice(0, 8).toUpperCase();
    var cvHeaderMap = getHeaderMap(cvSheet);
    var cvRow = [];
    for (var k = 0; k < cvSheet.getLastColumn(); k++) cvRow.push('');

    setCellByHeader(cvRow, cvHeaderMap, 'ID_CONG_VIEC', idCv);
    setCellByHeader(cvRow, cvHeaderMap, 'ID_KH', meeting.idKh || '');
    setCellByHeader(cvRow, cvHeaderMap, 'NOI_DUNG', newTask.noiDung);
    setCellByHeader(cvRow, cvHeaderMap, 'NGAY_HAN', newTask.ngayHan || '');
    setCellByHeader(cvRow, cvHeaderMap, 'CAN_BO', meeting.canBoThucHien || '');
    setCellByHeader(cvRow, cvHeaderMap, 'TRANG_THAI', 'Chưa thực hiện');
    setCellByHeader(cvRow, cvHeaderMap, 'NGAY_TAO', nowStr);
    setCellByHeader(cvRow, cvHeaderMap, 'NGAY_HOAN_THANH', '');
    setCellByHeader(cvRow, cvHeaderMap, 'GHI_CHU', newTask.ghiChu || '');
    // Cột mở rộng V2 cho Công việc
    setCellByHeader(cvRow, cvHeaderMap, 'NGUON_TAO', newTask.nguonTao || 'MEETING');
    setCellByHeader(cvRow, cvHeaderMap, 'PRIORITY', newTask.priority || 'TRUNG_BINH');

    cvSheet.appendRow(cvRow);
    formatSingleRow(cvSheet, cvSheet.getLastRow());

    createdTaskData = {
      idCongViec: idCv,
      idKh: meeting.idKh,
      noiDung: newTask.noiDung,
      ngayHan: newTask.ngayHan,
      canBo: meeting.canBoThucHien,
      trangThai: 'Chưa thực hiện',
      ngayTao: nowStr,
      nguonTao: newTask.nguonTao || 'MEETING',
      priority: newTask.priority || 'TRUNG_BINH'
    };
  }

  // Ghi nhận Audit Log
  try {
    recordAuditLogInternal('RECORD_MEETING', 'MEETING', idLichSu, 'Ghi nhận cuộc gặp KH ' + meeting.idKh + ' (' + (meeting.hinhThucGap || 'Gặp trực tiếp') + ')', meeting.userThucHien || '', meeting.canBoThucHien || '');
  } catch (e) {}

  meeting.idLichSu = idLichSu;
  meeting.thoiGianCapNhat = nowStr;

  return {
    success: true,
    message: 'Đã ghi nhận cuộc gặp thành công lên Google Sheet!',
    data: { meeting: meeting, task: createdTaskData }
  };
}

function updateMeeting(meeting) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.LICH_SU_GAP) : null;
  if (!sheet) return { success: false, message: 'Bảng LICH_SU_GAP không tồn tại.' };

  var headerMap = getHeaderMap(sheet);
  var idCol = headerMap['ID_LICH_SU'];
  if (idCol === undefined) return { success: false, message: 'Cột ID_LICH_SU không tồn tại.' };

  var data = sheet.getDataRange().getValues();
  var targetId = String(meeting.idLichSu).trim();
  var targetRow = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]).trim() === targetId) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    return { success: false, message: 'Không tìm thấy cuộc gặp: ' + meeting.idLichSu };
  }

  var nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
  updateSheetRowByHeaderMap(sheet, targetRow, headerMap, {
    THOI_GIAN_GAP: meeting.thoiGianGap,
    HINH_THUC_GAP: meeting.hinhThucGap,
    LATITUDE: meeting.latitude,
    LONGITUDE: meeting.longitude,
    GOOGLE_MAP_URL: meeting.googleMapUrl,
    NOI_DUNG_TRAO_DOI: meeting.noiDungTraoDoi,
    NHU_CAU_KHACH_HANG: meeting.nhuCauKhachHang,
    TINH_TRANG_SAU_GAP: meeting.tinhTrangSauGap,
    CONG_VIEC_TIEP_THEO: meeting.congViecTiepTheo,
    NGAY_HEN_LIEN_HE: meeting.ngayHenLienHe,
    GHI_CHU: meeting.ghiChu,
    CAN_BO_THUC_HIEN: meeting.canBoThucHien,
    THOI_GIAN_CAP_NHAT: nowStr
  });

  return { success: true, message: 'Cập nhật cuộc gặp thành công trên Google Sheet.', data: meeting };
}

function deleteMeeting(idLichSu) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.LICH_SU_GAP) : null;
  if (!sheet) return { success: false, message: 'Bảng LICH_SU_GAP không tồn tại.' };

  var headerMap = getHeaderMap(sheet);
  var idCol = headerMap['ID_LICH_SU'];
  if (idCol === undefined) return { success: false, message: 'Cột ID_LICH_SU không tồn tại.' };

  var data = sheet.getDataRange().getValues();
  var targetId = String(idLichSu).trim();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]).trim() === targetId) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Đã xóa cuộc gặp khỏi Google Sheet.' };
    }
  }

  return { success: false, message: 'Không tìm thấy cuộc gặp: ' + idLichSu };
}

/**
 * =========================================================================
 * V. CÁC HÀM CRUD CÔNG VIỆC (CONG_VIEC)
 * =========================================================================
 */
function createTask(task) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.CONG_VIEC) : null;
  if (!sheet) return { success: false, message: 'Bảng CONG_VIEC không tồn tại.' };

  var idCv = task.idCongViec || ('CV_' + Utilities.getUuid().slice(0, 8).toUpperCase());
  var nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');

  var headerMap = getHeaderMap(sheet);
  var newRow = [];
  for (var c = 0; c < sheet.getLastColumn(); c++) newRow.push('');

  setCellByHeader(newRow, headerMap, 'ID_CONG_VIEC', idCv);
  setCellByHeader(newRow, headerMap, 'ID_KH', task.idKh || '');
  setCellByHeader(newRow, headerMap, 'NOI_DUNG', task.noiDung || '');
  setCellByHeader(newRow, headerMap, 'NGAY_HAN', task.ngayHan || '');
  setCellByHeader(newRow, headerMap, 'CAN_BO', task.canBo || '');
  setCellByHeader(newRow, headerMap, 'TRANG_THAI', task.trangThai || 'Chưa thực hiện');
  setCellByHeader(newRow, headerMap, 'NGAY_TAO', nowStr);
  setCellByHeader(newRow, headerMap, 'NGAY_HOAN_THANH', task.ngayHoanThanh || '');
  setCellByHeader(newRow, headerMap, 'GHI_CHU', task.ghiChu || '');
  // Cột mở rộng V2
  setCellByHeader(newRow, headerMap, 'NGUON_TAO', task.nguonTao || 'MANUAL');
  setCellByHeader(newRow, headerMap, 'PRIORITY', task.priority || 'TRUNG_BINH');

  sheet.appendRow(newRow);
  formatSingleRow(sheet, sheet.getLastRow());

  task.idCongViec = idCv;
  task.ngayTao = nowStr;
  task.nguonTao = task.nguonTao || 'MANUAL';
  task.priority = task.priority || 'TRUNG_BINH';

  return { success: true, message: 'Tạo công việc thành công trên Google Sheet.', data: task };
}

function updateTask(task) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.CONG_VIEC) : null;
  if (!sheet) return { success: false, message: 'Bảng CONG_VIEC không tồn tại.' };

  var headerMap = getHeaderMap(sheet);
  var idCol = headerMap['ID_CONG_VIEC'];
  if (idCol === undefined) return { success: false, message: 'Cột ID_CONG_VIEC không tồn tại.' };

  var data = sheet.getDataRange().getValues();
  var targetId = String(task.idCongViec).trim();
  var targetRow = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]).trim() === targetId) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    return { success: false, message: 'Không tìm thấy công việc: ' + task.idCongViec };
  }

  var updates = {
    NOI_DUNG: task.noiDung,
    NGAY_HAN: task.ngayHan,
    CAN_BO: task.canBo,
    TRANG_THAI: task.trangThai,
    NGAY_HOAN_THANH: task.trangThai === 'Hoàn thành' ? (task.ngayHoanThanh || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss')) : '',
    GHI_CHU: task.ghiChu,
    NGUON_TAO: task.nguonTao,
    PRIORITY: task.priority
  };

  updateSheetRowByHeaderMap(sheet, targetRow, headerMap, updates);

  return { success: true, message: 'Cập nhật công việc thành công trên Google Sheet.', data: task };
}

function updateTaskStatus(idCongViec, trangThai) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.CONG_VIEC) : null;
  if (!sheet) return { success: false, message: 'Bảng CONG_VIEC không tồn tại.' };

  var headerMap = getHeaderMap(sheet);
  var idCol = headerMap['ID_CONG_VIEC'];
  var statusCol = headerMap['TRANG_THAI'];
  var doneCol = headerMap['NGAY_HOAN_THANH'];

  if (idCol === undefined || statusCol === undefined) {
    return { success: false, message: 'Cấu trúc bảng CONG_VIEC không đúng.' };
  }

  var data = sheet.getDataRange().getValues();
  var targetId = String(idCongViec).trim();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]).trim() === targetId) {
      sheet.getRange(i + 1, statusCol + 1).setValue(trangThai);
      if (doneCol !== undefined) {
        var doneStr = trangThai === 'Hoàn thành' ? Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss') : '';
        sheet.getRange(i + 1, doneCol + 1).setValue(doneStr);
      }
      return {
        success: true,
        message: 'Đã cập nhật trạng thái công việc sang: ' + trangThai,
        data: { idCongViec: idCongViec, trangThai: trangThai }
      };
    }
  }

  return { success: false, message: 'Không tìm thấy công việc: ' + idCongViec };
}

function deleteTask(idCongViec) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.CONG_VIEC) : null;
  if (!sheet) return { success: false, message: 'Bảng CONG_VIEC không tồn tại.' };

  var headerMap = getHeaderMap(sheet);
  var idCol = headerMap['ID_CONG_VIEC'];
  if (idCol === undefined) return { success: false, message: 'Cột ID_CONG_VIEC không tồn tại.' };

  var data = sheet.getDataRange().getValues();
  var targetId = String(idCongViec).trim();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]).trim() === targetId) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Đã xóa công việc khỏi Google Sheet.' };
    }
  }

  return { success: false, message: 'Không tìm thấy công việc: ' + idCongViec };
}

/**
 * =========================================================================
 * VI. SỰ KIỆN CHĂM SÓC & EMAIL CẤU HÌNH
 * =========================================================================
 */
function saveCareEvent(evt) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.SU_KIEN_CHAM_SOC) : null;
  if (!sheet) return { success: false, message: 'Bảng SU_KIEN_CHAM_SOC không tồn tại.' };

  var headerMap = getHeaderMap(sheet);
  var idCol = headerMap['ID_SU_KIEN'];
  var data = sheet.getDataRange().getValues();

  var idSuKien = evt.idSuKien;
  if (idSuKien && idCol !== undefined) {
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]).trim() === String(idSuKien).trim()) {
        updateSheetRowByHeaderMap(sheet, i + 1, headerMap, {
          TEN_SU_KIEN: evt.tenSuKien,
          NGAY: evt.ngay,
          LOAI: evt.loai,
          SO_NGAY_NHAC_TRUOC: evt.soNgayNhacTruoc,
          TRANG_THAI: evt.trangThai
        });
        return { success: true, message: 'Cập nhật sự kiện thành công.', data: evt };
      }
    }
  }

  idSuKien = 'SK_' + Utilities.getUuid().slice(0, 6).toUpperCase();
  var newRow = [];
  for (var c = 0; c < sheet.getLastColumn(); c++) newRow.push('');

  setCellByHeader(newRow, headerMap, 'ID_SU_KIEN', idSuKien);
  setCellByHeader(newRow, headerMap, 'TEN_SU_KIEN', evt.tenSuKien || '');
  setCellByHeader(newRow, headerMap, 'NGAY', evt.ngay || '');
  setCellByHeader(newRow, headerMap, 'LOAI', evt.loai || 'NgayLe');
  setCellByHeader(newRow, headerMap, 'SO_NGAY_NHAC_TRUOC', evt.soNgayNhacTruoc || 3);
  setCellByHeader(newRow, headerMap, 'TRANG_THAI', evt.trangThai || 'Bật');

  sheet.appendRow(newRow);
  formatSingleRow(sheet, sheet.getLastRow());
  evt.idSuKien = idSuKien;

  return { success: true, message: 'Thêm sự kiện chăm sóc thành công.', data: evt };
}

function deleteCareEvent(idSuKien) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.SU_KIEN_CHAM_SOC) : null;
  if (!sheet) return { success: false, message: 'Bảng SU_KIEN_CHAM_SOC không tồn tại.' };

  var headerMap = getHeaderMap(sheet);
  var idCol = headerMap['ID_SU_KIEN'];
  if (idCol === undefined) return { success: false, message: 'Cột ID_SU_KIEN không tồn tại.' };

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]).trim() === String(idSuKien).trim()) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Đã xóa sự kiện chăm sóc khỏi Google Sheet.' };
    }
  }

  return { success: false, message: 'Không tìm thấy sự kiện: ' + idSuKien };
}

/**
 * =========================================================================
 * V-B. LỊCH SỬ CHĂM SÓC, DANH MỤC NHU CẦU & AUDIT LOG (V2 MỚI)
 * =========================================================================
 */
function addCareHistory(care, nextTask) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.LICH_SU_CHAM_SOC) : null;
  var khSheet = ss ? ss.getSheetByName(SHEET_NAMES.KHACH_HANG) : null;
  var cvSheet = ss ? ss.getSheetByName(SHEET_NAMES.CONG_VIEC) : null;

  if (!sheet) return { success: false, message: 'Bảng LICH_SU_CHAM_SOC không tồn tại.' };

  var idChamSoc = care.idChamSoc || ('CS_' + Utilities.getUuid().slice(0, 8).toUpperCase());
  var nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
  var headerMap = getHeaderMap(sheet);

  var newRow = [];
  for (var c = 0; c < sheet.getLastColumn(); c++) newRow.push('');

  setCellByHeader(newRow, headerMap, 'ID_CHAM_SOC', idChamSoc);
  setCellByHeader(newRow, headerMap, 'ID_KH', care.idKh || '');
  setCellByHeader(newRow, headerMap, 'THOI_GIAN', care.thoiGian || nowStr);
  setCellByHeader(newRow, headerMap, 'HINH_THUC', care.hinhThuc || 'Gọi điện');
  setCellByHeader(newRow, headerMap, 'SU_KIEN', care.suKien || 'Thường xuyên');
  setCellByHeader(newRow, headerMap, 'NOI_DUNG', care.noiDung || '');
  setCellByHeader(newRow, headerMap, 'KET_QUA', care.ketQua || 'Đã liên hệ thành công');
  setCellByHeader(newRow, headerMap, 'CAN_BO', care.canBo || '');
  setCellByHeader(newRow, headerMap, 'GHI_CHU', care.ghiChu || '');

  sheet.appendRow(newRow);
  formatSingleRow(sheet, sheet.getLastRow());

  care.idChamSoc = idChamSoc;

  // Cập nhật ngày cập nhật khách hàng
  if (khSheet) {
    var khHeaderMap = getHeaderMap(khSheet);
    var khIdCol = khHeaderMap['ID_KH'];
    var khUpdCol = khHeaderMap['NGAY_CAP_NHAT'];
    var khData = khSheet.getDataRange().getValues();
    for (var i = 1; i < khData.length; i++) {
      if (String(khData[i][khIdCol]).trim() === String(care.idKh).trim()) {
        if (khUpdCol !== undefined) khSheet.getRange(i + 1, khUpdCol + 1).setValue(nowStr);
        break;
      }
    }
  }

  // Tự động tạo task nếu có yêu cầu việc tiếp theo
  var createdTask = null;
  if (nextTask && nextTask.noiDung && cvSheet) {
    nextTask.nguonTao = 'CARE_EVENT';
    nextTask.idKh = care.idKh;
    nextTask.canBo = nextTask.canBo || care.canBo;
    var taskRes = createTask(nextTask);
    if (taskRes.success) createdTask = taskRes.data;
  }

  // Ghi nhận Audit Log
  try {
    recordAuditLogInternal('ADD_CARE', 'CARE', idChamSoc, 'Chăm sóc KH ' + care.idKh + ' (' + (care.suKien || 'Chăm sóc') + ')', care.user || '', care.canBo || '');
  } catch (e) {}

  return {
    success: true,
    message: 'Ghi nhận lịch sử chăm sóc khách hàng thành công!',
    data: { care: care, task: createdTask }
  };
}

function getCareHistories(idKh) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.LICH_SU_CHAM_SOC) : null;
  if (!sheet) return { success: true, data: [] };

  var rows = sheetToObjects(sheet).map(mapCareHistoryFromSheet);
  if (idKh) {
    rows = rows.filter(function(r) { return String(r.idKh).trim() === String(idKh).trim(); });
  }
  return { success: true, data: rows };
}

function recordAuditLogInternal(action, objectType, objectId, noiDung, user, hoTen) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss ? ss.getSheetByName(SHEET_NAMES.AUDIT_LOG) : null;
    if (!sheet) return;

    var idLog = 'LOG_' + Utilities.getUuid().slice(0, 8).toUpperCase();
    var nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
    var headerMap = getHeaderMap(sheet);

    var newRow = [];
    for (var c = 0; c < sheet.getLastColumn(); c++) newRow.push('');

    setCellByHeader(newRow, headerMap, 'ID_LOG', idLog);
    setCellByHeader(newRow, headerMap, 'THOI_GIAN', nowStr);
    setCellByHeader(newRow, headerMap, 'USER', user || 'system');
    setCellByHeader(newRow, headerMap, 'HO_TEN', hoTen || '');
    setCellByHeader(newRow, headerMap, 'ACTION', action || '');
    setCellByHeader(newRow, headerMap, 'OBJECT_TYPE', objectType || 'CONFIG');
    setCellByHeader(newRow, headerMap, 'OBJECT_ID', objectId || '');
    setCellByHeader(newRow, headerMap, 'NOI_DUNG', noiDung || '');

    sheet.appendRow(newRow);
  } catch (e) {}
}

function getAuditLogs(limit) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.AUDIT_LOG) : null;
  if (!sheet) return { success: true, data: [] };

  var rows = sheetToObjects(sheet).map(mapAuditLogFromSheet);
  rows.reverse(); // Mới nhất lên trước
  var max = limit ? parseInt(limit, 10) : 100;
  return { success: true, data: rows.slice(0, max) };
}

function getDemandCategories() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.DM_NHU_CAU) : null;
  if (!sheet) return { success: true, data: [] };

  var rows = sheetToObjects(sheet).map(mapDemandCategoryFromSheet);
  rows.sort(function(a, b) { return a.thuTu - b.thuTu; });
  return { success: true, data: rows };
}

function recordQuickActivity(activity) {
  if (!activity) {
    return { success: false, message: 'Dữ liệu hoạt động không hợp lệ (activity is missing).' };
  }

  // Hoạt động chăm sóc (CARE: Gọi điện, Tin nhắn, Tặng quà)
  if (activity.activityType === 'CARE') {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var careSheet = ss ? ss.getSheetByName(SHEET_NAMES.LICH_SU_CHAM_SOC) : null;
    
    // Nếu có sẵn bảng LICH_SU_CHAM_SOC, lưu trực tiếp vào bảng đó
    if (careSheet && typeof addCareHistory === 'function') {
      return addCareHistory(activity.careData || {}, activity.nextTask);
    }

    // Nếu chỉ có 7 bảng chuẩn (chưa có LICH_SU_CHAM_SOC), quy đổi thành cuộc gặp/tương tác chuẩn vào LICH_SU_GAP
    var careData = activity.careData || {};
    var meetingFromCare = {
      idKh: careData.idKh || '',
      thoiGianGap: careData.thoiGian || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss'),
      hinhThucGap: careData.hinhThuc || 'Gọi điện',
      noiDungTraoDoi: careData.noiDung || (careData.suKien ? ('Chăm sóc: ' + careData.suKien) : 'Chăm sóc khách hàng'),
      nhuCauKhachHang: careData.ghiChu || '',
      tinhTrangSauGap: careData.ketQua || 'Đã hoàn thành chăm sóc',
      canBoThucHien: careData.canBo || ''
    };
    return recordMeeting(meetingFromCare, activity.nextTask);
  } else {
    // Hoạt động Cuộc gặp (MEETING: Gặp trực tiếp, Họp trực tuyến...)
    return recordMeeting(activity.meetingData || {}, activity.nextTask);
  }
}

function updateEmailConfig(cfg) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss ? ss.getSheetByName(SHEET_NAMES.EMAIL_CONFIG) : null;
  if (!sheet) return { success: false, message: 'Bảng EMAIL_CONFIG không tồn tại.' };

  var keysToUpdate = {
    ADMIN_EMAIL: cfg.adminEmail,
    EMAIL_FROM_NAME: cfg.emailFromName,
    EMAIL_ENABLED: String(cfg.emailEnabled),
    REMINDER_DAYS: cfg.reminderDays,
    TEST_EMAIL: cfg.testEmail,
    APP_URL: cfg.appUrl
  };

  var data = sheet.getDataRange().getValues();
  var existingKeys = {};
  for (var i = 1; i < data.length; i++) {
    var k = String(data[i][0]).trim();
    existingKeys[k] = i + 1;
  }

  Object.keys(keysToUpdate).forEach(function(k) {
    var val = keysToUpdate[k];
    if (val !== undefined) {
      if (existingKeys[k]) {
        sheet.getRange(existingKeys[k], 2).setValue(val);
      } else {
        sheet.appendRow([k, val, '']);
      }
    }
  });

  return { success: true, message: 'Đã cập nhật cấu hình email thành công trên Google Sheet.', data: cfg };
}

function getEmailLogs(statusFilter) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss ? ss.getSheetByName(SHEET_NAMES.EMAIL_LOG) : null;
  if (!logSheet) return { success: true, data: [] };

  var rawLogs = sheetToObjects(logSheet).map(mapLogFromSheet);
  if (statusFilter && statusFilter !== 'ALL') {
    rawLogs = rawLogs.filter(function(l) { return l.trangThai === statusFilter; });
  }

  return { success: true, data: rawLogs };
}

/**
 * =========================================================================
 * VII. TẢI DỮ LIỆU BAN ĐẦU & ĐỒNG BỘ TOÀN DIỆN (SYNC ALL)
 * =========================================================================
 */
function getInitialData(userEmail, userRole) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return { success: false, message: 'Spreadsheet chưa được khởi tạo.' };

  var khSheet = ss.getSheetByName(SHEET_NAMES.KHACH_HANG);
  var lsgSheet = ss.getSheetByName(SHEET_NAMES.LICH_SU_GAP);
  var cvSheet = ss.getSheetByName(SHEET_NAMES.CONG_VIEC);
  var skSheet = ss.getSheetByName(SHEET_NAMES.SU_KIEN_CHAM_SOC);
  var cbSheet = ss.getSheetByName(SHEET_NAMES.CAN_BO);
  var logSheet = ss.getSheetByName(SHEET_NAMES.EMAIL_LOG);
  var lscsSheet = ss.getSheetByName(SHEET_NAMES.LICH_SU_CHAM_SOC);
  var dmSheet = ss.getSheetByName(SHEET_NAMES.DM_NHU_CAU);

  var rawCustomers = khSheet ? sheetToObjects(khSheet) : [];
  var rawMeetings = lsgSheet ? sheetToObjects(lsgSheet) : [];
  var rawTasks = cvSheet ? sheetToObjects(cvSheet) : [];
  var rawEvents = skSheet ? sheetToObjects(skSheet) : [];
  var rawUsers = cbSheet ? sheetToObjects(cbSheet) : [];
  var rawLogs = logSheet ? sheetToObjects(logSheet) : [];
  var rawCareHistories = lscsSheet ? sheetToObjects(lscsSheet) : [];
  var rawDemandCategories = dmSheet ? sheetToObjects(dmSheet) : [];
  var emailConfig = getEmailConfigMap();

  var customers = rawCustomers.map(mapCustomerFromSheet);
  var meetings = rawMeetings.map(mapMeetingFromSheet);
  var tasks = rawTasks.map(mapTaskFromSheet);
  var events = rawEvents.map(mapEventFromSheet);
  var users = rawUsers.map(mapUserFromSheet);
  var logs = rawLogs.map(mapLogFromSheet);
  var careHistories = rawCareHistories.map(mapCareHistoryFromSheet);
  var demandCategories = rawDemandCategories.map(mapDemandCategoryFromSheet);

  // Phân quyền cho QHKH
  if (userRole === 'QHKH' && userEmail) {
    var filteredKhIds = {};
    customers = customers.filter(function(c) {
      var match = (c.emailCanBo && c.emailCanBo.toLowerCase() === userEmail.toLowerCase()) ||
                  (c.canBoPhuTrach && userEmail.toLowerCase().indexOf(c.canBoPhuTrach.toLowerCase()) !== -1);
      if (match) filteredKhIds[c.idKh] = true;
      return match;
    });

    meetings = meetings.filter(function(m) { return filteredKhIds[m.idKh]; });
    tasks = tasks.filter(function(t) { return filteredKhIds[t.idKh]; });
    careHistories = careHistories.filter(function(ch) { return filteredKhIds[ch.idKh]; });
  }

  return {
    success: true,
    message: 'Tải dữ liệu từ Google Sheets thành công.',
    data: {
      customers: customers,
      meetings: meetings,
      tasks: tasks,
      careEvents: events,
      careHistories: careHistories,
      demandCategories: demandCategories,
      users: users,
      emailConfig: {
        adminEmail: emailConfig.ADMIN_EMAIL || '',
        emailFromName: emailConfig.EMAIL_FROM_NAME || 'Sổ Tay QHKH',
        emailEnabled: emailConfig.EMAIL_ENABLED === 'true',
        reminderDays: emailConfig.REMINDER_DAYS || '7,3,1',
        testEmail: emailConfig.TEST_EMAIL || '',
        appUrl: emailConfig.APP_URL || ''
      },
      emailLogs: logs
    }
  };
}

/**
 * =========================================================================
 * TỐI ƯU KHỞI ĐỘNG: LẤY DỮ LIỆU CỐT LÕI (BOOTSTRAP DATA)
 * Chỉ đọc các sheet cần thiết cho Dashboard: Khách hàng, Lịch sử gặp gần nhất,
 * Công việc, Sự kiện chăm sóc, Danh mục nhu cầu.
 * Bỏ qua Email Logs và danh sách Cán bộ đầy đủ để giảm 60-70% thời gian tải.
 * Hỗ trợ CacheService để phản hồi siêu tốc (<100ms) cho các lần mở tiếp theo.
 * =========================================================================
 */
function getBootstrapData(userEmail, userRole, recentLimit) {
  var cache = CacheService.getScriptCache();
  var safeRole = userRole || 'QHKH';
  var safeEmail = (userEmail || 'GUEST').toLowerCase().trim();
  var cacheKey = 'BOOT_' + (safeRole === 'QHKH' ? safeEmail : 'ALL');

  try {
    var cached = cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return { success: false, message: 'Spreadsheet chưa được khởi tạo.' };

  var khSheet = ss.getSheetByName(SHEET_NAMES.KHACH_HANG);
  var lsgSheet = ss.getSheetByName(SHEET_NAMES.LICH_SU_GAP);
  var cvSheet = ss.getSheetByName(SHEET_NAMES.CONG_VIEC);
  var skSheet = ss.getSheetByName(SHEET_NAMES.SU_KIEN_CHAM_SOC);
  var dmSheet = ss.getSheetByName(SHEET_NAMES.DM_NHU_CAU);

  var rawCustomers = khSheet ? sheetToObjects(khSheet) : [];
  var rawMeetings = lsgSheet ? sheetToObjects(lsgSheet) : [];
  var rawTasks = cvSheet ? sheetToObjects(cvSheet) : [];
  var rawEvents = skSheet ? sheetToObjects(skSheet) : [];
  var rawDemandCategories = dmSheet ? sheetToObjects(dmSheet) : [];

  var customers = rawCustomers.map(mapCustomerFromSheet);
  var meetings = rawMeetings.map(mapMeetingFromSheet);
  var tasks = rawTasks.map(mapTaskFromSheet);
  var events = rawEvents.map(mapEventFromSheet);
  var demandCategories = rawDemandCategories.map(mapDemandCategoryFromSheet);

  // Phân quyền cho QHKH
  if (safeRole === 'QHKH' && safeEmail) {
    var filteredKhIds = {};
    customers = customers.filter(function(c) {
      var match = (c.emailCanBo && c.emailCanBo.toLowerCase() === safeEmail) ||
                  (c.canBoPhuTrach && safeEmail.indexOf(c.canBoPhuTrach.toLowerCase()) !== -1);
      if (match) filteredKhIds[c.idKh] = true;
      return match;
    });

    meetings = meetings.filter(function(m) { return filteredKhIds[m.idKh]; });
    tasks = tasks.filter(function(t) { return filteredKhIds[t.idKh]; });
  }

  // Tối ưu meetings: Dashboard chỉ cần danh sách gần đây nhất
  var limit = Number(recentLimit) || 50;
  if (meetings.length > limit) {
    meetings.sort(function(a, b) {
      return new Date(b.thoiGian || 0).getTime() - new Date(a.thoiGian || 0).getTime();
    });
    meetings = meetings.slice(0, limit);
  }

  var responseObj = {
    success: true,
    message: 'Tải bootstrap data từ Google Sheets thành công.',
    data: {
      customers: customers,
      meetings: meetings,
      tasks: tasks,
      careEvents: events,
      demandCategories: demandCategories,
      serverTimestamp: new Date().toISOString()
    }
  };

  try {
    var jsonStr = JSON.stringify(responseObj);
    if (jsonStr.length < 95000) {
      cache.put(cacheKey, jsonStr, 300); // 5 phút cache
    }
  } catch (e) {}

  return responseObj;
}

function invalidateBackendCache() {
  try {
    var cache = CacheService.getScriptCache();
    cache.remove('BOOT_ALL');
  } catch (e) {}
}

/**
 * ĐỒNG BỘ TẤT CẢ DỮ LIỆU TỪ CLIENT LÊN GOOGLE SHEETS (UPSERT AN TOÀN)
 */
function syncAllToSheets(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return { success: false, message: 'Spreadsheet không khả dụng.' };

  var customers = payload.customers || [];
  var meetings = payload.meetings || [];
  var tasks = payload.tasks || [];
  var careEvents = payload.careEvents || [];
  var users = payload.users || [];
  var emailConfig = payload.emailConfig || null;

  var stats = {
    customers: 0,
    meetings: 0,
    tasks: 0,
    careEvents: 0,
    users: 0
  };

  // 1. Sync Khách hàng
  if (customers.length > 0) {
    var khSheet = ss.getSheetByName(SHEET_NAMES.KHACH_HANG);
    if (khSheet) {
      customers.forEach(function(c) {
        var res = updateCustomer(c);
        if (!res.success) {
          addCustomer(c);
        }
        stats.customers++;
      });
    }
  }

  // 2. Sync Cuộc gặp
  if (meetings.length > 0) {
    var lsgSheet = ss.getSheetByName(SHEET_NAMES.LICH_SU_GAP);
    if (lsgSheet) {
      meetings.forEach(function(m) {
        var res = updateMeeting(m);
        if (!res.success) {
          recordMeeting(m);
        }
        stats.meetings++;
      });
    }
  }

  // 3. Sync Công việc
  if (tasks.length > 0) {
    var cvSheet = ss.getSheetByName(SHEET_NAMES.CONG_VIEC);
    if (cvSheet) {
      tasks.forEach(function(t) {
        var res = updateTask(t);
        if (!res.success) {
          createTask(t);
        }
        stats.tasks++;
      });
    }
  }

  // 4. Sync Sự kiện
  if (careEvents.length > 0) {
    careEvents.forEach(function(e) {
      saveCareEvent(e);
      stats.careEvents++;
    });
  }

  // 5. Sync Cán bộ
  if (users.length > 0) {
    users.forEach(function(u) {
      var res = updateUser(u);
      if (!res.success) {
        addUser(u);
      }
      stats.users++;
    });
  }

  // 6. Sync Config
  if (emailConfig) {
    updateEmailConfig(emailConfig);
  }

  // Định dạng lại giao diện Sheet cho đẹp mắt sau khi đồng bộ
  formatAllSheetsPrettily(ss);

  return {
    success: true,
    message: 'Đồng bộ toàn bộ dữ liệu lên Google Sheets thành công!',
    data: stats
  };
}

/**
 * =========================================================================
 * VIII. KIỂM TRA HỆ THỐNG & GỬI EMAIL TỰ ĐỘNG
 * =========================================================================
 */
function getSystemHealth() {
  var startTime = new Date().getTime();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetOk = false;
  var sheetCount = 0;
  var sheetMsg = '';

  if (ss) {
    var sheets = ss.getSheets();
    sheetCount = sheets.length;
    var missing = [];
    Object.keys(SHEET_NAMES).forEach(function(k) {
      if (!ss.getSheetByName(SHEET_NAMES[k])) {
        missing.push(SHEET_NAMES[k]);
      }
    });
    if (missing.length === 0) {
      sheetOk = true;
      sheetMsg = 'Tất cả 7 bảng dữ liệu Google Sheets hoạt động tốt.';
    } else {
      sheetMsg = 'Thiếu các bảng: ' + missing.join(', ') + '. Hãy chạy setupDatabase()!';
    }
  } else {
    sheetMsg = 'Không kết nối được Google Spreadsheet.';
  }

  var emailConfig = getEmailConfigMap();
  var emailQuota = 0;
  try {
    emailQuota = MailApp.getRemainingDailyQuota();
  } catch (e) {}

  var triggers = ScriptApp.getProjectTriggers();
  var careTriggerExists = false;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'checkCareReminders') {
      careTriggerExists = true;
      break;
    }
  }

  var responseTime = new Date().getTime() - startTime;

  return {
    success: true,
    message: 'Kiểm tra trạng thái hệ thống hoàn tất.',
    data: {
      googleSheet: {
        status: sheetOk ? 'OK' : 'ERROR',
        details: sheetMsg,
        sheetCount: sheetCount
      },
      appsScriptApi: {
        status: 'OK',
        details: 'API Apps Script Web App phản hồi tốt.',
        responseTimeMs: responseTime
      },
      emailService: {
        status: (emailConfig.EMAIL_ENABLED === 'true' && emailConfig.ADMIN_EMAIL) ? 'OK' : 'WARNING',
        details: 'MailApp Quota còn lại: ' + emailQuota + ' email/ngày.',
        configuredEmail: emailConfig.ADMIN_EMAIL || '',
        enabled: emailConfig.EMAIL_ENABLED === 'true',
        quotaRemaining: emailQuota
      },
      trigger: {
        status: careTriggerExists ? 'OK' : 'WARNING',
        details: careTriggerExists ? 'Trigger tự động hàng ngày (checkCareReminders) đang chạy.' : 'Chưa thiết lập trigger. Hãy chạy setupTriggers()!',
        activeTriggersCount: triggers.length
      },
      config: {
        status: 'OK',
        details: 'Cấu hình hệ thống sẵn sàng.'
      }
    }
  };
}

function setupTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  var removedCount = 0;

  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'checkCareReminders') {
      ScriptApp.deleteTrigger(triggers[i]);
      removedCount++;
    }
  }

  ScriptApp.newTrigger('checkCareReminders')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  return {
    success: true,
    message: 'Đã thiết lập Trigger tự động thành công! Đã dọn dẹp ' + removedCount + ' trigger cũ và tạo 1 trigger chạy lúc 07:00 AM hàng ngày.'
  };
}

function manualCheckCareReminders() {
  var result = checkCareReminders();
  return {
    success: true,
    message: 'Đã hoàn thành kiểm tra chăm sóc khách hàng thủ công.',
    data: result
  };
}

function checkCareReminders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var khSheet = ss.getSheetByName(SHEET_NAMES.KHACH_HANG);
  var skSheet = ss.getSheetByName(SHEET_NAMES.SU_KIEN_CHAM_SOC);
  var logSheet = ss.getSheetByName(SHEET_NAMES.EMAIL_LOG);
  var config = getEmailConfigMap();

  if (!khSheet || !skSheet || !logSheet) return { error: 'Thiếu bảng dữ liệu cần thiết.' };
  if (config.EMAIL_ENABLED !== 'true') return { message: 'Chức năng gửi email đang Tắt (EMAIL_ENABLED=false).' };

  var customers = sheetToObjects(khSheet);
  var events = sheetToObjects(skSheet);
  var sentLogs = sheetToObjects(logSheet);

  var sentCache = {};
  sentLogs.forEach(function(log) {
    if (String(log.TRANG_THAI).toUpperCase() === 'SENT') {
      var key = String(log.ID_KH) + '|' + String(log.LOAI_SU_KIEN) + '|' + String(log.NGAY_SU_KIEN) + '|' + String(log.SO_NGAY_TRUOC);
      sentCache[key] = true;
    }
  });

  var reminderDays = (config.REMINDER_DAYS || '7,3,1').split(',').map(function(d) {
    return parseInt(d.trim(), 10);
  }).filter(function(n) { return !isNaN(n); });

  var today = new Date();
  var todayYear = today.getFullYear();
  var sendCount = 0;
  var skipCount = 0;

  var activeCustomers = customers.filter(function(c) {
    return String(c.CHE_DO_CHAM_SOC).trim() === 'Bật';
  });

  activeCustomers.forEach(function(cust) {
    var recipientEmail = cust.EMAIL_CAN_BO || config.ADMIN_EMAIL;
    if (!recipientEmail) return;

    // Sinh nhật
    if (cust.NGAY_SINH) {
      var bday = parseDateStr(cust.NGAY_SINH);
      if (bday) {
        var daysUntil = getDaysUntilNextAnniversary(bday.day, bday.month, today);
        if (reminderDays.indexOf(daysUntil) !== -1 || daysUntil === 0) {
          var eventDateStr = pad2(bday.day) + '/' + pad2(bday.month) + '/' + todayYear;
          var cacheKey = cust.ID_KH + '|SINH_NHAT|' + eventDateStr + '|' + daysUntil;

          if (sentCache[cacheKey]) {
            skipCount++;
          } else {
            var sentOk = sendReminderEmail({
              cust: cust,
              tenSuKien: 'Sinh nhật khách hàng',
              ngaySuKien: eventDateStr,
              soNgayTruoc: daysUntil,
              recipientEmail: recipientEmail,
              config: config,
              logSheet: logSheet
            });
            if (sentOk.success) {
              sendCount++;
              sentCache[cacheKey] = true;
            }
          }
        }
      }
    }
  });

  return { checked: activeCustomers.length, sent: sendCount, skipped: skipCount };
}

function sendReminderEmail(opts) {
  var cust = opts.cust;
  var tenSuKien = opts.tenSuKien;
  var ngaySuKien = opts.ngaySuKien;
  var soNgayTruoc = opts.soNgayTruoc;
  var recipientEmail = opts.recipientEmail;
  var config = opts.config;
  var logSheet = opts.logSheet;

  var logId = 'LOG_' + Utilities.getUuid().slice(0, 8);
  var now = new Date();
  var timestamp = Utilities.formatDate(now, 'GMT+7', 'yyyy-MM-dd HH:mm:ss');

  var subject = '[NHẮC CHĂM SÓC KH] ' + cust.HO_TEN + ' - ' + tenSuKien + ' (còn ' + soNgayTruoc + ' ngày)';
  var body = 'Kính gửi Cán bộ QHKH: ' + (cust.CAN_BO_PHU_TRACH || '') + ',\n\n' +
    'Khách hàng ' + cust.HO_TEN + ' sắp tới ' + tenSuKien + ' vào ngày ' + ngaySuKien + ' (còn ' + soNgayTruoc + ' ngày).\n' +
    'SĐT: ' + cust.SDT + '\nĐịa chỉ: ' + (cust.DIA_CHI || 'Chưa có') + '\n\n' +
    'Đề nghị cán bộ chủ động liên hệ chăm sóc.\nTrân trọng,\nVietinBank Chi nhánh Ninh Bình';

  try {
    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      body: body,
      name: config.EMAIL_FROM_NAME || 'VietinBank Ninh Bình'
    });

    logSheet.appendRow([
      logId, timestamp, cust.ID_KH, cust.HO_TEN, recipientEmail,
      tenSuKien, ngaySuKien, soNgayTruoc, timestamp, 'SENT', '', ''
    ]);
    formatSingleRow(logSheet, logSheet.getLastRow());

    return { success: true };
  } catch (err) {
    logSheet.appendRow([
      logId, timestamp, cust.ID_KH, cust.HO_TEN, recipientEmail,
      tenSuKien, ngaySuKien, soNgayTruoc, '', 'FAILED', err.toString(), ''
    ]);
    formatSingleRow(logSheet, logSheet.getLastRow());
    return { success: false, error: err.toString() };
  }
}

function sendTestEmail(targetEmail) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss ? ss.getSheetByName(SHEET_NAMES.EMAIL_LOG) : null;
  var config = getEmailConfigMap();

  var recipient = targetEmail || config.TEST_EMAIL || config.ADMIN_EMAIL || Session.getActiveUser().getEmail();
  if (!recipient || recipient.indexOf('@') === -1) {
    return { success: false, message: 'Địa chỉ email người nhận không hợp lệ: ' + recipient };
  }

  var logId = 'TEST_' + Utilities.getUuid().slice(0, 8);
  var now = new Date();
  var timestamp = Utilities.formatDate(now, 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
  var subject = '[VIETINBANK CRM TEST] Kiểm Tra Kết Nối Gửi Email - ' + timestamp;
  var body = 'Kính gửi Quản trị viên,\n\n' +
    'Đây là email kiểm tra chức năng từ Google Apps Script Backend của Sổ Tay QHKH VietinBank Ninh Bình.\n' +
    'Thời gian thực thi: ' + timestamp + '\n\n' +
    'Trân trọng,\nVietinBank Ninh Bình CRM';

  try {
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      body: body,
      name: config.EMAIL_FROM_NAME || 'VietinBank Ninh Bình'
    });

    if (logSheet) {
      logSheet.appendRow([
        logId, timestamp, 'SYSTEM_TEST', 'Kiểm tra hệ thống', recipient,
        'TEST_EMAIL', Utilities.formatDate(now, 'GMT+7', 'dd/MM/yyyy'), 0,
        timestamp, 'SENT', 'Gửi email test thành công qua MailApp.', ''
      ]);
      formatSingleRow(logSheet, logSheet.getLastRow());
    }

    return {
      success: true,
      message: 'Apps Script đã gửi email test thành công đến: ' + recipient + '!'
    };
  } catch (err) {
    return { success: false, message: 'Lỗi gửi email: ' + err.toString() };
  }
}

/**
 * =========================================================================
 * IX. HELPER UTILS: TỰ ĐỘNG MAP HEADER ĐỘNG, PARSING, FORMATTING
 * =========================================================================
 */
function getHeaderMap(sheet) {
  var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = {};
  for (var c = 0; c < headerRow.length; c++) {
    var key = String(headerRow[c]).trim();
    if (key) map[key] = c;
  }
  return map;
}

function setCellByHeader(rowArr, headerMap, colName, val) {
  var col = headerMap[colName];
  if (col !== undefined && col < rowArr.length) {
    rowArr[col] = val !== undefined && val !== null ? val : '';
  }
}

function updateSheetRowByHeaderMap(sheet, rowIndex, headerMap, updates) {
  Object.keys(updates).forEach(function(k) {
    var val = updates[k];
    if (val !== undefined && headerMap[k] !== undefined) {
      var colIdx = headerMap[k] + 1; // 1-based
      sheet.getRange(rowIndex, colIdx).setValue(val !== null ? val : '');
    }
  });
}

function formatSingleRow(sheet, rowIdx) {
  try {
    var lastCol = sheet.getLastColumn();
    sheet.setRowHeight(rowIdx, 28);
    var range = sheet.getRange(rowIdx, 1, 1, lastCol);
    range.setFontSize(10).setVerticalAlignment('middle');
    if (rowIdx % 2 === 1) {
      range.setBackground(BRAND_COLORS.ZEBRA_BG);
    } else {
      range.setBackground('#FFFFFF');
    }
    range.setBorder(true, true, true, true, true, true, BRAND_COLORS.BORDER, SpreadsheetApp.BorderStyle.SOLID);
  } catch (e) {}
}

function getEmailConfigMap() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cfgSheet = ss ? ss.getSheetByName(SHEET_NAMES.EMAIL_CONFIG) : null;
  var map = {};
  if (cfgSheet) {
    var data = cfgSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var k = String(data[i][0]).trim();
      var v = String(data[i][1]).trim();
      if (k) map[k] = v;
    }
  }
  return map;
}

function sheetToObjects(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rows = [];

  for (var r = 1; r < data.length; r++) {
    var rowObj = {};
    var hasVal = false;
    for (var c = 0; c < headers.length; c++) {
      var val = data[r][c];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
      }
      rowObj[headers[c]] = val;
      if (val !== '' && val !== null && val !== undefined) hasVal = true;
    }
    if (hasVal) rows.push(rowObj);
  }
  return rows;
}

function mapCustomerFromSheet(r) {
  var eventsArr = [];
  if (r.SU_KIEN_CHAM_SOC) {
    eventsArr = String(r.SU_KIEN_CHAM_SOC).split(',').map(function(s) { return s.trim(); }).filter(Boolean);
  }

  return {
    idKh: String(r.ID_KH || ''),
    hoTen: String(r.HO_TEN || ''),
    loaiKhachHang: r.LOAI_KHACH_HANG || 'Cá nhân',
    tenCongTy: String(r.TEN_CONG_TY || ''),
    chucVu: String(r.CHUC_VU || ''),
    sdt: String(r.SDT || ''),
    ngaySinh: String(r.NGAY_SINH || ''),
    diaChi: String(r.DIA_CHI || ''),
    latitude: r.LATITUDE ? parseFloat(r.LATITUDE) : null,
    longitude: r.LONGITUDE ? parseFloat(r.LONGITUDE) : null,
    googleMapUrl: String(r.GOOGLE_MAP_URL || ''),
    nganhNghe: String(r.NGANH_NGHE || ''),
    nhuCau: String(r.NHU_CAU || ''),
    ghiChu: String(r.GHI_CHU || ''),
    phanLoai: r.PHAN_LOAI || 'Đang tiếp thị',
    cheDoChamSoc: r.CHE_DO_CHAM_SOC || 'Tắt',
    suKienChamSoc: eventsArr,
    canBoPhuTrach: String(r.CAN_BO_PHU_TRACH || ''),
    userCanBo: String(r.USER_CAN_BO || ''),
    emailCanBo: String(r.EMAIL_CAN_BO || ''),
    nguoiKhoiTao: String(r.NGUOI_KHOI_TAO || ''),
    userKhoiTao: String(r.USER_KHOI_TAO || ''),
    phongBanKhoiTao: String(r.PHONG_BAN_KHOI_TAO || ''),
    nguoiCapNhatCuoi: String(r.NGUOI_CAP_NHAT_CUOI || ''),
    userCapNhatCuoi: String(r.USER_CAP_NHAT_CUOI || ''),
    ngayTao: String(r.NGAY_TAO || ''),
    ngayCapNhat: String(r.NGAY_CAP_NHAT || ''),
    trangThai: String(r.TRANG_THAI || 'Hoạt động')
  };
}

function mapMeetingFromSheet(r) {
  return {
    idLichSu: String(r.ID_LICH_SU || ''),
    idKh: String(r.ID_KH || ''),
    thoiGianGap: String(r.THOI_GIAN_GAP || ''),
    hinhThucGap: r.HINH_THUC_GAP || 'Gặp trực tiếp',
    latitude: r.LATITUDE ? parseFloat(r.LATITUDE) : null,
    longitude: r.LONGITUDE ? parseFloat(r.LONGITUDE) : null,
    googleMapUrl: String(r.GOOGLE_MAP_URL || ''),
    noiDungTraoDoi: String(r.NOI_DUNG_TRAO_DOI || ''),
    nhuCauKhachHang: String(r.NHU_CAU_KHACH_HANG || ''),
    tinhTrangSauGap: r.TINH_TRANG_SAU_GAP || 'Đã gặp khách hàng',
    congViecTiepTheo: String(r.CONG_VIEC_TIEP_THEO || ''),
    ngayHenLienHe: String(r.NGAY_HEN_LIEN_HE || ''),
    ghiChu: String(r.GHI_CHU || ''),
    canBoThucHien: String(r.CAN_BO_THUC_HIEN || ''),
    thoiGianCapNhat: String(r.THOI_GIAN_CAP_NHAT || ''),
    // Cột mở rộng V2
    checkInTime: String(r.CHECK_IN_TIME || ''),
    gpsAccuracy: r.GPS_ACCURACY !== undefined && r.GPS_ACCURACY !== '' ? parseFloat(r.GPS_ACCURACY) : null,
    checkInStatus: r.CHECK_IN_STATUS || (r.LATITUDE && r.LONGITUDE ? 'SUCCESS' : 'MANUAL')
  };
}

function mapTaskFromSheet(r) {
  return {
    idCongViec: String(r.ID_CONG_VIEC || ''),
    idKh: String(r.ID_KH || ''),
    noiDung: String(r.NOI_DUNG || ''),
    ngayHan: String(r.NGAY_HAN || ''),
    canBo: String(r.CAN_BO || ''),
    trangThai: r.TRANG_THAI || 'Chưa thực hiện',
    ngayTao: String(r.NGAY_TAO || ''),
    ngayHoanThanh: String(r.NGAY_HOAN_THANH || ''),
    ghiChu: String(r.GHI_CHU || ''),
    // Cột mở rộng V2
    nguonTao: r.NGUON_TAO || 'MANUAL',
    priority: r.PRIORITY || 'TRUNG_BINH'
  };
}

function mapCareHistoryFromSheet(r) {
  return {
    idChamSoc: String(r.ID_CHAM_SOC || ''),
    idKh: String(r.ID_KH || ''),
    thoiGian: String(r.THOI_GIAN || ''),
    hinhThuc: r.HINH_THUC || 'Gọi điện',
    suKien: String(r.SU_KIEN || ''),
    noiDung: String(r.NOI_DUNG || ''),
    ketQua: String(r.KET_QUA || ''),
    canBo: String(r.CAN_BO || ''),
    ghiChu: String(r.GHI_CHU || '')
  };
}

function mapAuditLogFromSheet(r) {
  return {
    idLog: String(r.ID_LOG || ''),
    thoiGian: String(r.THOI_GIAN || ''),
    user: String(r.USER || ''),
    hoTen: String(r.HO_TEN || ''),
    action: String(r.ACTION || ''),
    objectType: r.OBJECT_TYPE || 'CONFIG',
    objectId: String(r.OBJECT_ID || ''),
    noiDung: String(r.NOI_DUNG || '')
  };
}

function mapDemandCategoryFromSheet(r) {
  return {
    idNhuCau: String(r.ID_NHU_CAU || ''),
    nhomNhuCau: r.NHOM_NHU_CAU || 'KHAC',
    tenNhuCau: String(r.TEN_NHU_CAU || ''),
    trangThai: r.TRANG_THAI || 'Hoạt động',
    thuTu: parseInt(r.THU_TU, 10) || 0
  };
}

function mapEventFromSheet(r) {
  return {
    idSuKien: String(r.ID_SU_KIEN || ''),
    tenSuKien: String(r.TEN_SU_KIEN || ''),
    ngay: String(r.NGAY || ''),
    loai: String(r.LOAI || ''),
    soNgayNhacTruoc: parseInt(r.SO_NGAY_NHAC_TRUOC, 10) || 3,
    trangThai: r.TRANG_THAI || 'Bật'
  };
}

function mapUserFromSheet(r) {
  return {
    stt: parseInt(r.STT, 10) || 0,
    maNv: String(r.MA_NV || ''),
    hoTen: String(r.HO_TEN || ''),
    user: String(r.USER || ''),
    // BẢO MẬT V2: Tuyệt đối KHÔNG trả password về client/frontend
    phongBan: String(r.PHONG_BAN || ''),
    viTri: String(r.VI_TRI || ''),
    sdt: String(r.SDT || ''),
    email: String(r.EMAIL || ''),
    role: r.ROLE || 'QHKH',
    isLeader: String(r.IS_LEADER) === 'true',
    trangThai: r.TRANG_THAI || 'Hoạt động'
  };
}

function mapUserInternalWithPassword(r) {
  return {
    stt: parseInt(r.STT, 10) || 0,
    maNv: String(r.MA_NV || ''),
    hoTen: String(r.HO_TEN || ''),
    user: String(r.USER || ''),
    password: String(r.PASSWORD || ''),
    phongBan: String(r.PHONG_BAN || ''),
    viTri: String(r.VI_TRI || ''),
    sdt: String(r.SDT || ''),
    email: String(r.EMAIL || ''),
    role: r.ROLE || 'QHKH',
    isLeader: String(r.IS_LEADER) === 'true',
    trangThai: r.TRANG_THAI || 'Hoạt động'
  };
}

function mapLogFromSheet(r) {
  return {
    idLog: String(r.ID_LOG || ''),
    thoiGian: String(r.THOI_GIAN || ''),
    idKh: String(r.ID_KH || ''),
    hoTenKh: String(r.HO_TEN_KH || ''),
    emailNhan: String(r.EMAIL_NHAN || ''),
    loaiSuKien: String(r.LOAI_SU_KIEN || ''),
    ngaySuKien: String(r.NGAY_SU_KIEN || ''),
    soNgayTruoc: parseInt(r.SO_NGAY_TRUOC, 10) || 0,
    thoiGianGui: String(r.THOI_GIAN_GUI || ''),
    trangThai: r.TRANG_THAI || 'PENDING',
    loiChiTiet: String(r.LOI_CHI_TIET || ''),
    messageIdNhapNeuCo: String(r.MESSAGE_ID_NHAP_NEU_CO || '')
  };
}

function parseDateStr(str) {
  if (!str) return null;
  var parts = String(str).split('-');
  if (parts.length === 3) {
    return { day: parseInt(parts[2], 10), month: parseInt(parts[1], 10), year: parseInt(parts[0], 10) };
  }
  parts = String(str).split('/');
  if (parts.length >= 2) {
    return { day: parseInt(parts[0], 10), month: parseInt(parts[1], 10), year: parts[2] ? parseInt(parts[2], 10) : null };
  }
  return null;
}

function getDaysUntilNextAnniversary(day, month, today) {
  var curYear = today.getFullYear();
  var thisYearDate = new Date(curYear, month - 1, day, 0, 0, 0, 0);
  var todayMidnight = new Date(curYear, today.getMonth(), today.getDate(), 0, 0, 0, 0);

  var diffMs = thisYearDate.getTime() - todayMidnight.getTime();
  var diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    var nextYearDate = new Date(curYear + 1, month - 1, day, 0, 0, 0, 0);
    diffDays = Math.round((nextYearDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
  }
  return diffDays;
}

function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

function cloneObject(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    return obj;
  }
}
