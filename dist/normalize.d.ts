import { type NodeSpec } from "./schema.js";
import { type ContentDoc } from "./types.js";
export interface NormalizeOptions {
    /** Độ sâu lồng tối đa của nội dung soạn thảo (chống nội dung độc làm treo máy). Mặc định 64. */
    maxDepth?: number;
    /** Số nút tối đa của một bài. Mặc định 100 000. */
    maxNodes?: number;
    /** Mô tả thuộc tính của khối ngoài lõi (khối plugin đăng ký bằng defineBlock). */
    nodes?: Record<string, NodeSpec>;
    marks?: Record<string, NodeSpec>;
}
export interface NormalizeResult {
    doc: ContentDoc;
    /** Những gì đã bị sửa/bỏ — để ghi log, không phải lỗi. */
    issues: string[];
}
/**
 * Chuẩn hoá nội dung về định dạng của CMS. Nhận: {version, blocks}, cây TipTap/ProseMirror thuần (`type: "doc"`),
 * chuỗi HTML. Sửa cấu trúc sai (bỏ nút không hợp lệ, ép kiểu thuộc tính khối lõi, bỏ null), giữ nguyên khối/nút lạ.
 * Chạy hai lần cho cùng kết quả (idempotent). Máy chủ chạy cùng quy tắc (ContentFormat.cs).
 */
export declare function normalizeContent(input: unknown, options?: NormalizeOptions): NormalizeResult;
