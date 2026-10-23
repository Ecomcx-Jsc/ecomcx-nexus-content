import { blockNodeSpec, migrateBlockAttrs, type BlockDefinition } from "./block.js";
import { migrateContent } from "./migrate.js";
import { CORE_MARKS, CORE_NODES, normalizeAttrs, type NodeSpec } from "./schema.js";
import { normalizeAnchor, normalizeBlockStyleName, normalizeClassName, normalizeStyle } from "./style.js";
import { CONTENT_VERSION, type Block, type ContentDoc, type RichMark, type RichNode } from "./types.js";

export interface NormalizeOptions {
  /** Độ sâu lồng tối đa của nội dung soạn thảo (chống nội dung độc làm treo máy). Mặc định 64. */
  maxDepth?: number;
  /** Số nút tối đa của một bài. Mặc định 100 000. */
  maxNodes?: number;
  /** Khối của plugin (defineBlock): ép kiểu thuộc tính + nâng phiên bản khối lưu bằng bản cũ. */
  blocks?: readonly BlockDefinition[];
  /** Mô tả thuộc tính của nút ngoài lõi (cấp thấp — khối plugin dùng `blocks`). */
  nodes?: Record<string, NodeSpec>;
  marks?: Record<string, NodeSpec>;
}

export interface NormalizeResult {
  doc: ContentDoc;
  /** Những gì đã bị sửa/bỏ — để ghi log, không phải lỗi. */
  issues: string[];
}

const empty = (): ContentDoc => ({ version: CONTENT_VERSION, blocks: [] });
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/**
 * Chuẩn hoá nội dung về định dạng của CMS. Nhận: {version, blocks}, cây TipTap/ProseMirror thuần (`type: "doc"`),
 * chuỗi HTML. Sửa cấu trúc sai (bỏ nút không hợp lệ, ép kiểu thuộc tính khối lõi, bỏ null), giữ nguyên khối/nút lạ.
 * Chạy hai lần cho cùng kết quả (idempotent). Máy chủ chạy cùng quy tắc (ContentFormat.cs).
 */
export function normalizeContent(input: unknown, options: NormalizeOptions = {}): NormalizeResult {
  const issues: string[] = [];
  const state = { count: 0, issues, maxDepth: options.maxDepth ?? 64, maxNodes: options.maxNodes ?? 100_000,
    nodes: { ...CORE_NODES, ...options.nodes, ...Object.fromEntries((options.blocks ?? []).map((b) => [b.name, blockNodeSpec(b)])) },
    marks: { ...CORE_MARKS, ...options.marks }, blocks: new Map((options.blocks ?? []).map((b) => [b.name, b])) };

  if (input == null) return { doc: empty(), issues };
  if (typeof input === "string") return { doc: { version: CONTENT_VERSION, blocks: input ? [{ id: "main", type: "html", data: { html: input } }] : [] }, issues };
  if (!isObj(input)) { issues.push("content is not an object"); return { doc: empty(), issues }; }
  if (input.type === "doc") input = { version: CONTENT_VERSION, blocks: [{ id: "main", type: "richtext", data: input }] };
  const raw = input as Record<string, unknown>;
  if (!Array.isArray(raw.blocks)) { issues.push("content has no blocks"); return { doc: empty(), issues }; }

  const version = typeof raw.version === "number" && Number.isInteger(raw.version) && raw.version > 0 ? raw.version : CONTENT_VERSION;
  const blocks: Block[] = [];
  for (const b of raw.blocks) {
    const block = normalizeBlock(b, state);
    if (block) blocks.push(block);
  }
  return { doc: migrateContent({ version, blocks }, issues), issues };
}

type State = { count: number; issues: string[]; maxDepth: number; maxNodes: number; nodes: Record<string, NodeSpec>; marks: Record<string, NodeSpec>; blocks: Map<string, BlockDefinition> };

function normalizeBlock(b: unknown, state: State): Block | null {
  if (!isObj(b) || typeof b.type !== "string" || !b.type || b.type.length > 100) { state.issues.push("dropped invalid block"); return null; }
  let data: unknown;
  switch (b.type) {
    case "richtext": {
      const node = normalizeNode(b.data, 0, state);
      if (!node || node.type !== "doc") state.issues.push("richtext block without doc");
      data = node && node.type === "doc" ? node : { type: "doc" };
      break;
    }
    case "html":
      data = { html: isObj(b.data) && typeof b.data.html === "string" ? b.data.html : "" };
      break;
    default:
      // Khối của plugin: dữ liệu do plugin quyết định — giữ nguyên (kể cả khi plugin đã tắt)
      data = b.data === undefined ? null : b.data;
  }
  return typeof b.id === "string" && b.id ? { id: b.id, type: b.type, data } : { type: b.type, data };
}

function normalizeNode(node: unknown, depth: number, state: State): RichNode | null {
  if (!isObj(node) || typeof node.type !== "string" || !node.type) { state.issues.push("dropped node without type"); return null; }
  if (depth > state.maxDepth) { state.issues.push(`dropped node deeper than ${state.maxDepth}`); return null; }
  if (++state.count > state.maxNodes) { if (state.count === state.maxNodes + 1) state.issues.push(`content truncated at ${state.maxNodes} nodes`); return null; }

  if (node.type === "text") {
    if (typeof node.text !== "string" || node.text === "") { state.issues.push("dropped empty text node"); return null; }
    const marks = normalizeMarks(node.marks, state);
    return marks ? { type: "text", text: node.text, marks } : { type: "text", text: node.text };
  }

  const out: RichNode = { type: node.type };
  const def = state.blocks.get(node.type);
  let raw = node.attrs;
  if (def && def.version > 1) {
    try { raw = migrateBlockAttrs(def, (isObj(raw) ? raw : {}) as Record<string, unknown>); }
    catch (e) { state.issues.push(`block ${node.type}: migrate failed (${(e as Error).message}) — kept as is`); }
  }
  const attrs = normalizeAttrs(raw, state.nodes[node.type]?.attrs);
  // Kiểu dáng của khối (mọi khối, kể cả khối plugin): chỉ giữ giá trị hợp lệ
  if (attrs && "style" in attrs) {
    const style = normalizeStyle(attrs.style);
    if (style) attrs.style = style; else delete attrs.style;
  }
  // Biến thể kiểu, neo, class riêng (mọi khối)
  for (const [k, fn] of [["blockStyle", normalizeBlockStyleName], ["anchor", normalizeAnchor], ["className", normalizeClassName]] as const) {
    if (attrs && k in attrs) { const v = fn(attrs[k]); if (v === undefined) delete attrs[k]; else attrs[k] = v; }
  }
  if (attrs && Object.keys(attrs).length) out.attrs = attrs;
  if (Array.isArray(node.content)) {
    const children: RichNode[] = [];
    for (const c of node.content) {
      const child = normalizeNode(c, depth + 1, state);
      if (child) children.push(child);
    }
    if (children.length) out.content = children;
  }
  return out;
}

function normalizeMarks(marks: unknown, state: State): RichMark[] | undefined {
  if (!Array.isArray(marks)) return undefined;
  const out: RichMark[] = [];
  for (const m of marks) {
    if (!isObj(m) || typeof m.type !== "string" || !m.type) { state.issues.push("dropped invalid mark"); continue; }
    if (out.some((x) => x.type === m.type)) continue; // cùng một định dạng hai lần
    const attrs = normalizeAttrs(m.attrs, state.marks[m.type]?.attrs);
    out.push(attrs ? { type: m.type, attrs } : { type: m.type });
  }
  return out.length ? out : undefined;
}
