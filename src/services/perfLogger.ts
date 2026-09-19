/**
 * =========================================================================
 * BỘ ĐO LƯỜNG HIỆU NĂNG (PERFORMANCE LOGGER)
 * Đo lường chính xác thời gian khởi động, đọc cache và gọi API
 * =========================================================================
 */

interface PerfMark {
  name: string;
  time: number;
}

class PerfLogger {
  private marks: Map<string, number> = new Map();
  private isDev = true;

  public start(name: string): void {
    const now = performance.now();
    this.marks.set(name, now);
    if (this.isDev) {
      console.log(`⏱️ [PERF START] ${name} @ 0ms`);
    }
  }

  public end(name: string, details?: string): number {
    const endTime = performance.now();
    const startTime = this.marks.get(name);
    if (startTime === undefined) {
      if (this.isDev) {
        console.warn(`[PERF WARNING] Chưa gọi start('${name}') trước khi end.`);
      }
      return 0;
    }

    const duration = Math.round(endTime - startTime);
    if (this.isDev) {
      console.log(
        `⚡ [PERF COMPLETED] ${name}: ${duration}ms ${details ? `(${details})` : ''}`
      );
    }
    return duration;
  }

  public mark(label: string, data?: any): void {
    if (this.isDev) {
      console.log(`📌 [PERF MARK] ${label} @ ${Math.round(performance.now())}ms`, data || '');
    }
  }

  public getSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    this.marks.forEach((start, key) => {
      summary[key] = Math.round(performance.now() - start);
    });
    return summary;
  }
}

export const perf = new PerfLogger();
