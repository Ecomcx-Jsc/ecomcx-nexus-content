import { CONTENT_VERSION } from "./types.js";
/**
 * Nâng định dạng nội dung: MIGRATIONS[n] chuyển bản n → n+1. Bài lưu bằng bản cũ được nâng khi đọc,
 * nên đổi cấu trúc không làm vỡ bài đã đăng. Chưa có bản nào cần nâng (định dạng 1).
 */
const MIGRATIONS = {};
export function migrateContent(doc, issues = []) {
    let current = doc;
    if (current.version > CONTENT_VERSION) {
        // Nội dung từ bản CMS mới hơn: giữ nguyên, không đoán
        issues.push(`content version ${current.version} is newer than ${CONTENT_VERSION}`);
        return current;
    }
    while (current.version < CONTENT_VERSION) {
        const step = MIGRATIONS[current.version];
        current = step ? step(current) : { ...current, version: current.version + 1 };
    }
    return current;
}
