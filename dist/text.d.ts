import type { ContentDoc, RichNode } from "./types.js";
/** Chữ thuần của một nút (không định dạng). */
export declare function nodeText(node: RichNode): string;
/** Chữ thuần của cả bài (tìm kiếm, tóm tắt, đếm từ). Khối HTML bỏ thẻ; khối plugin bỏ qua. */
export declare function contentText(doc: ContentDoc): string;
/** Số từ (tách theo khoảng trắng — đúng cho tiếng Việt và tiếng Anh). */
export declare const wordCount: (doc: ContentDoc) => number;
/** Duyệt mọi nút soạn thảo của bài (kể cả lồng nhau). Trả false để không đi vào con. */
export declare function visitNodes(doc: ContentDoc, visit: (node: RichNode, parent: RichNode | null) => void | false): void;
