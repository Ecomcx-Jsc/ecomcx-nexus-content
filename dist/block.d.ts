import type { AttrSpec, NodeSpec } from "./schema.js";
/**
 * Cách nhập một thuộc tính trong form cài đặt của khối (trình soạn tự sinh form). Mặc định suy từ kiểu:
 * string → text (có enum → select), number/integer → number, boolean → checkbox, url → url.
 */
export type AttrControl = "text" | "textarea" | "number" | "checkbox" | "select" | "color" | "url" | "media" | "hidden";
export interface BlockAttrSpec extends AttrSpec {
    /** Nhãn trong form cài đặt (chữ hoặc "%khoá%" dịch theo locales của plugin). */
    label?: string;
    control?: AttrControl;
    /** Nhãn cho từng giá trị của enum (cùng thứ tự). */
    enumLabels?: readonly string[];
    help?: string;
}
/** Khối chứa gì: không gì (khối nguyên — ảnh, thẻ sản phẩm), chữ (một dòng có định dạng), hoặc các khối khác (hộp lưu ý chứa đoạn văn). */
export type BlockContent = "none" | "inline" | "blocks";
export interface BlockDefinitionInput {
    /** Tên khối, duy nhất trong mọi plugin — nên đặt tiền tố plugin: "ten-plugin/callout" hoặc "tenPluginCallout". */
    name: string;
    /** Tên hiển thị (slash menu, khung khối). */
    title: string;
    description?: string;
    /** Biểu tượng (tên icon lucide, vd "star") — trình soạn hiển thị nếu có. */
    icon?: string;
    /** Từ khoá tìm trong slash menu (không dấu, cách nhau bởi khoảng trắng). */
    keywords?: string;
    category?: string;
    content?: BlockContent;
    attributes?: Record<string, BlockAttrSpec>;
    /**
     * Phiên bản cấu trúc thuộc tính (mặc định 1). Đổi cấu trúc → tăng version + thêm migrate[phiên-bản-cũ]:
     * bài lưu bằng bản cũ được nâng khi đọc (trình soạn, website, máy chủ đều đọc qua normalizeContent).
     */
    version?: number;
    migrate?: Record<number, (attrs: Record<string, unknown>) => Record<string, unknown>>;
}
export interface BlockDefinition extends Required<Pick<BlockDefinitionInput, "name" | "title" | "content" | "version">> {
    description?: string;
    icon?: string;
    keywords: string;
    category?: string;
    attributes: Record<string, BlockAttrSpec>;
    migrate: Record<number, (attrs: Record<string, unknown>) => Record<string, unknown>>;
}
/** Thuộc tính lưu phiên bản của khối trong dữ liệu (chỉ khi version > 1). */
export declare const BLOCK_VERSION_ATTR = "_v";
/**
 * Khai báo một khối — dùng chung cho trình soạn (admin) và website: cùng một file định nghĩa, import ở cả hai phía.
 * Chỉ là dữ liệu (không phụ thuộc trình soạn nào): trình soạn tự sinh node + form cài đặt + mục slash menu, website
 * chuẩn hoá thuộc tính rồi đưa cho component hiển thị của plugin. Khối của plugin đã tắt: dữ liệu giữ nguyên.
 */
export declare function defineBlock(input: BlockDefinitionInput): BlockDefinition;
/** Giá trị mặc định của các thuộc tính (khi chèn khối mới). */
export declare function blockDefaults(def: BlockDefinition): Record<string, unknown>;
/** Mô tả thuộc tính để chuẩn hoá (normalizeContent → options.nodes). */
export declare function blockNodeSpec(def: BlockDefinition): NodeSpec;
/** Nâng thuộc tính của một khối lưu bằng bản cũ lên bản hiện tại. */
export declare function migrateBlockAttrs(def: BlockDefinition, attrs: Record<string, unknown> | undefined): Record<string, unknown> | undefined;
