/**
 * URL an toàn cho href/src: http(s), mailto, tel, tương đối (/, #, ?, ./), ảnh data:image/* (không SVG).
 * Cùng quy tắc với ContentSanitizer.IsSafeUrl của máy chủ.
 */
export declare function isSafeUrl(url: unknown): boolean;
/** URL an toàn hoặc chuỗi thay thế. */
export declare const safeUrl: (url: unknown, fallback?: string) => string;
