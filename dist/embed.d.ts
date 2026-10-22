/**
 * Nhúng theo đường dẫn (khối `embed`): chỉ nhà cung cấp trong danh sách dưới đây được hiển thị dạng khung nhúng.
 * Địa chỉ khung luôn do hàm này dựng từ mã nhận ra trong đường dẫn (không dùng HTML/URL nhúng do người dùng dán) →
 * dữ liệu bài viết không thể chèn khung tới trang tuỳ ý. Đường dẫn không nhận ra → website hiện liên kết thường.
 * Trình soạn (xem trước) và website (theme-sdk) dùng chung hàm này.
 */
export interface EmbedInfo {
    /** Mã nhà cung cấp (youtube, vimeo…). */
    provider: string;
    /** Tên hiển thị (title của iframe). */
    title: string;
    /** Địa chỉ khung nhúng. */
    src: string;
    /** Tỉ lệ rộng/cao (khung co giãn theo bề ngang). Không có → dùng `height` cố định. */
    aspect?: number;
    height?: number;
    /** Bề ngang tối đa (vd video dọc TikTok). */
    maxWidth?: number;
}
/** Thông tin nhúng của một đường dẫn, hoặc null nếu không thuộc nhà cung cấp nào được hỗ trợ. */
export declare function embedInfo(raw: unknown): EmbedInfo | null;
/** Nhà cung cấp được hỗ trợ (để hiện gợi ý trong trình soạn / tài liệu). */
export declare const EMBED_PROVIDERS: readonly string[];
