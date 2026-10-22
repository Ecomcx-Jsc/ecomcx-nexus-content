import type { AttrSpec, NodeSpec } from "./schema.js";

/**
 * Cách nhập một thuộc tính trong form cài đặt của khối (trình soạn tự sinh form). Mặc định suy từ kiểu:
 * string → text (có enum → select), number/integer → number, boolean → checkbox, url → url.
 */
export type AttrControl = "text" | "textarea" | "number" | "checkbox" | "select" | "color" | "url" | "hidden";

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
export const BLOCK_VERSION_ATTR = "_v";

const NAME = /^[a-zA-Z][\w-]*(\/[a-zA-Z][\w-]*)?$/;

/**
 * Khai báo một khối — dùng chung cho trình soạn (admin) và website: cùng một file định nghĩa, import ở cả hai phía.
 * Chỉ là dữ liệu (không phụ thuộc trình soạn nào): trình soạn tự sinh node + form cài đặt + mục slash menu, website
 * chuẩn hoá thuộc tính rồi đưa cho component hiển thị của plugin. Khối của plugin đã tắt: dữ liệu giữ nguyên.
 */
export function defineBlock(input: BlockDefinitionInput): BlockDefinition {
  if (!NAME.test(input.name)) throw new Error(`defineBlock: tên khối không hợp lệ "${input.name}" (chữ, số, -, _; tuỳ chọn tiền tố "plugin/")`);
  const version = input.version ?? 1;
  if (!Number.isInteger(version) || version < 1) throw new Error(`defineBlock(${input.name}): version phải là số nguyên ≥ 1`);
  for (let v = 1; v < version; v++)
    if (!input.migrate?.[v]) throw new Error(`defineBlock(${input.name}): thiếu migrate[${v}] (nâng từ bản ${v} lên ${v + 1})`);
  if (input.attributes?.[BLOCK_VERSION_ATTR]) throw new Error(`defineBlock(${input.name}): "${BLOCK_VERSION_ATTR}" là tên dành riêng`);
  return Object.freeze({
    name: input.name,
    title: input.title,
    description: input.description,
    icon: input.icon,
    keywords: input.keywords ?? "",
    category: input.category,
    content: input.content ?? "none",
    attributes: { ...input.attributes },
    version,
    migrate: { ...input.migrate },
  });
}

/** Giá trị mặc định của các thuộc tính (khi chèn khối mới). */
export function blockDefaults(def: BlockDefinition): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, spec] of Object.entries(def.attributes)) if (spec.default !== undefined) out[k] = structuredClone(spec.default);
  if (def.version > 1) out[BLOCK_VERSION_ATTR] = def.version;
  return out;
}

/** Mô tả thuộc tính để chuẩn hoá (normalizeContent → options.nodes). */
export function blockNodeSpec(def: BlockDefinition): NodeSpec {
  return { attrs: { ...def.attributes, [BLOCK_VERSION_ATTR]: { type: "integer", min: 1 } } };
}

/** Nâng thuộc tính của một khối lưu bằng bản cũ lên bản hiện tại. */
export function migrateBlockAttrs(def: BlockDefinition, attrs: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (def.version <= 1) return attrs;
  let current = { ...(attrs ?? {}) };
  let v = typeof current[BLOCK_VERSION_ATTR] === "number" ? (current[BLOCK_VERSION_ATTR] as number) : 1;
  if (v >= def.version) return attrs;
  delete current[BLOCK_VERSION_ATTR];
  for (; v < def.version; v++) current = def.migrate[v]({ ...current });
  current[BLOCK_VERSION_ATTR] = def.version;
  return current;
}
