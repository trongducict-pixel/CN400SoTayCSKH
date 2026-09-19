/**
 * =========================================================================
 * BỘ QUẢN LÝ CACHE SWR (STALE-WHILE-REVALIDATE ENGINE)
 * Lưu trữ dữ liệu chuẩn: data + timestamp + version
 * Ưu tiên hiển thị ngay từ Cache, đồng bộ nền và cập nhật State không giật lag
 * =========================================================================
 */

export const CACHE_VERSION = 'v2.1';
const CACHE_PREFIX = 'CRM_SWR_CACHE_';
const OLD_STORAGE_PREFIX = 'CRM_LOCAL_DB_';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

export class CacheEngine {
  /**
   * Đọc dữ liệu từ Cache đồng bộ (Synchronous) để State có dữ liệu ngay lập tức (<10ms)
   */
  public static get<T>(key: string, defaultVal: T, maxAgeMs: number = 24 * 60 * 60 * 1000): {
    data: T;
    timestamp: number;
    hasData: boolean;
    isStale: boolean;
  } {
    try {
      const fullKey = CACHE_PREFIX + key;
      const raw = localStorage.getItem(fullKey);

      if (raw) {
        const parsed: CacheEntry<T> = JSON.parse(raw);
        if (parsed && parsed.version === CACHE_VERSION && parsed.data !== undefined) {
          const now = Date.now();
          const age = now - (parsed.timestamp || 0);
          return {
            data: parsed.data,
            timestamp: parsed.timestamp || now,
            hasData: true,
            isStale: age > maxAgeMs
          };
        }
      }

      // Fallback: Kiểm tra dữ liệu cũ từ tiền tố CRM_LOCAL_DB_ nếu có
      const oldRaw = localStorage.getItem(OLD_STORAGE_PREFIX + key);
      if (oldRaw) {
        try {
          const oldData = JSON.parse(oldRaw);
          if (oldData !== null && oldData !== undefined) {
            // Tự động nâng cấp lên định dạng SWR Cache mới
            this.set(key, oldData);
            return {
              data: oldData,
              timestamp: Date.now(),
              hasData: true,
              isStale: true
            };
          }
        } catch {
          // Bỏ qua nếu dữ liệu cũ không hợp lệ
        }
      }

      return {
        data: defaultVal,
        timestamp: 0,
        hasData: false,
        isStale: true
      };
    } catch (err) {
      console.warn(`[CacheEngine] Lỗi đọc cache '${key}':`, err);
      return {
        data: defaultVal,
        timestamp: 0,
        hasData: false,
        isStale: true
      };
    }
  }

  /**
   * Ghi dữ liệu vào Cache kèm timestamp & version
   */
  public static set<T>(key: string, data: T): void {
    try {
      const fullKey = CACHE_PREFIX + key;
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION
      };
      localStorage.setItem(fullKey, JSON.stringify(entry));
    } catch (err) {
      console.warn(`[CacheEngine] Không thể lưu cache '${key}':`, err);
    }
  }

  /**
   * Lấy thời gian đồng bộ gần nhất của một nhóm dữ liệu
   */
  public static getTimestamp(key: string): number | null {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.timestamp || null;
    } catch {
      return null;
    }
  }

  /**
   * Định dạng thời gian đồng bộ dễ đọc: HH:mm hoặc DD/MM HH:mm
   */
  public static formatTime(timestamp: number | null | undefined): string {
    if (!timestamp) return 'Chưa đồng bộ';
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    // Nếu trong cùng ngày
    const today = new Date();
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return `${hours}:${minutes}`;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${hours}:${minutes} ${day}/${month}`;
  }

  /**
   * Xóa cache của một key hoặc toàn bộ cache của app
   */
  public static remove(key: string): void {
    try {
      localStorage.removeItem(CACHE_PREFIX + key);
    } catch (e) {
      console.warn(`[CacheEngine] Lỗi xóa key '${key}':`, e);
    }
  }
}
