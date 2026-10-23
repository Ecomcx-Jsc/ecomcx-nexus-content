/**
 * Kiểu dáng của khối (`attrs.style`, mọi khối): khoảng cách, cỡ chữ, màu, viền, ẩn theo khổ màn hình.
 * Giá trị theo khổ: `{ base, tablet, mobile }` (tablet ≤ 1024px, mobile ≤ 640px). Giá trị là preset của theme
 * (`lg`, `primary` → biến CSS `--ecx-spacing-lg`, `--ecx-color-primary`) hoặc giá trị CSS đã kiểm (độ dài, màu).
 * Chỉ nhận giá trị trong danh sách → không chèn được CSS tuỳ ý. Máy chủ chạy cùng quy tắc (ContentFormat.cs).
 */
export const BREAKPOINTS = { tablet: 1024, mobile: 640 } as const;
export const DEVICES = ["base", "tablet", "mobile"] as const;
export type Device = (typeof DEVICES)[number];
export type Responsive<T> = Partial<Record<Device, T>>;
export type Box = string | Partial<Record<"top" | "right" | "bottom" | "left", string>>;

export interface BlockStyle {
  padding?: Responsive<Box>;
  margin?: Responsive<Box>;
  gap?: Responsive<string>;
  width?: Responsive<string>;
  maxWidth?: Responsive<string>;
  minHeight?: Responsive<string>;
  fontFamily?: string;
  fontSize?: Responsive<string>;
  lineHeight?: Responsive<number>;
  letterSpacing?: Responsive<string>;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  textTransform?: string;
  textAlign?: Responsive<string>;
  color?: { text?: string; background?: string };
  border?: { width?: string; style?: string; color?: string };
  radius?: string;
  hide?: Array<"desktop" | "tablet" | "mobile">;
}

const SIDES = ["top", "right", "bottom", "left"] as const;
const LENGTH = /^(0|-?\d{1,4}(\.\d{1,3})?(px|rem|em|%|vw|vh))$/;
const PRESET = /^([a-z][a-z0-9-]{0,30}|[1-9]x[sl])$/;
const COLOR = /^(#[0-9a-f]{3,8}|(rgb|hsl)a?\([\d\s.,%/]{1,40}\))$/i;
const WEIGHTS = ["300", "400", "500", "600", "700", "800", "900"];
const ALIGNS = ["left", "center", "right", "justify"];
const BORDER_STYLES = ["solid", "dashed", "dotted"];
const HIDE = ["desktop", "tablet", "mobile"] as const;
const FONT_STYLES = ["normal", "italic"];
const DECORATIONS = ["none", "underline", "line-through"];
const TRANSFORMS = ["none", "uppercase", "lowercase", "capitalize"];
const preset = (v: unknown) => (typeof v === "string" && PRESET.test(v) ? v : undefined);

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const size = (v: unknown) => (typeof v === "string" && (LENGTH.test(v) || PRESET.test(v)) ? v : undefined);
const color = (v: unknown) => (typeof v === "string" && (COLOR.test(v.trim()) || PRESET.test(v)) ? v.trim() : undefined);
const oneOf = (list: readonly string[]) => (v: unknown) => (typeof v === "string" && list.includes(v) ? v : undefined);
const lineHeight = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0.5 && n <= 4 ? Math.round(n * 100) / 100 : undefined;
};
function box(v: unknown): Box | undefined {
  if (typeof v === "string") return size(v);
  if (!isObj(v)) return undefined;
  const out: Record<string, string> = {};
  for (const s of SIDES) { const x = size(v[s]); if (x !== undefined) out[s] = x; }
  return Object.keys(out).length ? out : undefined;
}
/** Giá trị theo khổ: nhận cả dạng gọn (một giá trị = base). */
function responsive<T>(v: unknown, fn: (x: unknown) => T | undefined): Responsive<T> | undefined {
  const src = isObj(v) && DEVICES.some((d) => d in v) ? v : { base: v };
  const out: Responsive<T> = {};
  for (const d of DEVICES) { const x = fn(src[d]); if (x !== undefined) out[d] = x; }
  return Object.keys(out).length ? out : undefined;
}
function group<K extends string>(v: unknown, fields: Record<K, (x: unknown) => string | undefined>) {
  if (!isObj(v)) return undefined;
  const out: Partial<Record<K, string>> = {};
  for (const k of Object.keys(fields) as K[]) { const x = fields[k](v[k]); if (x !== undefined) out[k] = x; }
  return Object.keys(out).length ? out : undefined;
}

/** Chuẩn hoá `attrs.style`: giữ đúng thứ tự khoá, bỏ giá trị không hợp lệ. Rỗng → undefined. */
export function normalizeStyle(v: unknown): BlockStyle | undefined {
  if (!isObj(v)) return undefined;
  const out: BlockStyle = {};
  const set = <K extends keyof BlockStyle>(k: K, x: BlockStyle[K] | undefined) => { if (x !== undefined) out[k] = x; };
  set("padding", responsive(v.padding, box));
  set("margin", responsive(v.margin, box));
  set("gap", responsive(v.gap, size));
  set("width", responsive(v.width, size));
  set("maxWidth", responsive(v.maxWidth, size));
  set("minHeight", responsive(v.minHeight, size));
  set("fontFamily", preset(v.fontFamily));
  set("fontSize", responsive(v.fontSize, size));
  set("lineHeight", responsive(v.lineHeight, lineHeight));
  set("letterSpacing", responsive(v.letterSpacing, size));
  set("fontWeight", oneOf(WEIGHTS)(typeof v.fontWeight === "number" ? String(v.fontWeight) : v.fontWeight));
  set("fontStyle", oneOf(FONT_STYLES)(v.fontStyle));
  set("textDecoration", oneOf(DECORATIONS)(v.textDecoration));
  set("textTransform", oneOf(TRANSFORMS)(v.textTransform));
  set("textAlign", responsive(v.textAlign, oneOf(ALIGNS)));
  set("color", group(v.color, { text: color, background: color }));
  set("border", group(v.border, { width: size, style: oneOf(BORDER_STYLES), color }));
  set("radius", size(v.radius));
  if (Array.isArray(v.hide)) { const h = HIDE.filter((d) => (v.hide as unknown[]).includes(d)); if (h.length) out.hide = [...h]; }
  return Object.keys(out).length ? out : undefined;
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------
const lit = (v: string) => v === "auto" || v === "0" || LENGTH.test(v);
const spacing = (v: string) => (lit(v) ? v : `var(--ecx-spacing-${v})`);
const fontSize = (v: string) => (lit(v) ? v : `var(--ecx-font-size-${v})`);
const colorValue = (v: string) => (COLOR.test(v) ? v : `var(--ecx-color-${v}, ${v})`);

function boxDecl(prop: "padding" | "margin", v: Box): string[] {
  if (typeof v === "string") return [`${prop}:${spacing(v)}`];
  return SIDES.filter((s) => v[s] !== undefined).map((s) => `${prop}-${s}:${spacing(v[s]!)}`);
}

/** Khai báo CSS cho từng khổ màn hình. */
function declarations(style: BlockStyle): Record<Device, string[]> {
  const out: Record<Device, string[]> = { base: [], tablet: [], mobile: [] };
  for (const d of DEVICES) {
    const p = style.padding?.[d]; if (p !== undefined) out[d].push(...boxDecl("padding", p));
    const m = style.margin?.[d]; if (m !== undefined) out[d].push(...boxDecl("margin", m));
    const g = style.gap?.[d]; if (g !== undefined) out[d].push(`gap:${spacing(g)}`);
    const w = style.width?.[d]; if (w !== undefined) out[d].push(`width:${spacing(w)}`);
    const mw = style.maxWidth?.[d]; if (mw !== undefined) out[d].push(`max-width:${spacing(mw)}`);
    const mh = style.minHeight?.[d]; if (mh !== undefined) out[d].push(`min-height:${spacing(mh)}`);
    const fs = style.fontSize?.[d]; if (fs !== undefined) out[d].push(`font-size:${fontSize(fs)}`);
    const lh = style.lineHeight?.[d]; if (lh !== undefined) out[d].push(`line-height:${lh}`);
    const ls = style.letterSpacing?.[d]; if (ls !== undefined) out[d].push(`letter-spacing:${lit(ls) ? ls : `var(--ecx-letter-spacing-${ls})`}`);
    const ta = style.textAlign?.[d]; if (ta !== undefined) out[d].push(`text-align:${ta}`);
  }
  if (style.fontFamily) out.base.push(`font-family:var(--ecx-font-family-${style.fontFamily}, inherit)`);
  if (style.fontWeight) out.base.push(`font-weight:${style.fontWeight}`);
  if (style.fontStyle) out.base.push(`font-style:${style.fontStyle}`);
  if (style.textDecoration) out.base.push(`text-decoration:${style.textDecoration}`);
  if (style.textTransform) out.base.push(`text-transform:${style.textTransform}`);
  if (style.color?.text) out.base.push(`color:${colorValue(style.color.text)}`);
  if (style.color?.background) out.base.push(`background:${colorValue(style.color.background)}`);
  if (style.border?.width || style.border?.style || style.border?.color)
    out.base.push(`border:${style.border.width ? spacing(style.border.width) : "1px"} ${style.border.style ?? "solid"} ${style.border.color ? colorValue(style.border.color) : "currentColor"}`);
  if (style.radius) out.base.push(`border-radius:${spacing(style.radius)}`);
  return out;
}

/** Độ dài / preset khoảng cách hợp lệ → giá trị CSS (preset thành biến); không hợp lệ → undefined. Dùng cho thuộc tính khối như chiều cao khoảng trống. */
export function spacingValue(v: unknown): string | undefined {
  const x = size(v);
  return x === undefined ? undefined : spacing(x);
}

/** Màu hợp lệ (hex/rgb/hsl hoặc preset) → giá trị CSS; không hợp lệ → undefined. */
export function colorCss(v: unknown): string | undefined {
  const x = color(v);
  return x === undefined ? undefined : colorValue(x);
}

/** Tên class ổn định theo nội dung style (cùng kiểu dáng → cùng class). */
export function styleClass(style: BlockStyle): string {
  let h = 0x811c9dc5;
  const s = JSON.stringify(style);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return `ecx-s-${h.toString(36)}`;
}

/** CSS của một kiểu dáng: `.cls.cls{…}` + media query cho tablet / mobile + ẩn theo khổ. Rỗng → "". */
export function styleCss(style: BlockStyle, cls = styleClass(style)): string {
  const sel = `.${cls}.${cls}`;
  const d = declarations(style);
  let css = d.base.length ? `${sel}{${d.base.join(";")}}` : "";
  if (d.tablet.length) css += `@media (max-width:${BREAKPOINTS.tablet}px){${sel}{${d.tablet.join(";")}}}`;
  if (d.mobile.length) css += `@media (max-width:${BREAKPOINTS.mobile}px){${sel}{${d.mobile.join(";")}}}`;
  for (const h of style.hide ?? []) {
    const q = h === "desktop" ? `(min-width:${BREAKPOINTS.tablet + 1}px)` : h === "tablet" ? `(min-width:${BREAKPOINTS.mobile + 1}px) and (max-width:${BREAKPOINTS.tablet}px)` : `(max-width:${BREAKPOINTS.mobile}px)`;
    css += `@media ${q}{${sel}{display:none!important}}`;
  }
  return css;
}

/** Gom CSS cho cả một cây nội dung: trả về css (mỗi class một lần) — website và trình soạn dùng chung. */
export function collectStyles(styles: Iterable<BlockStyle>): string {
  const seen = new Map<string, string>();
  for (const s of styles) { const cls = styleClass(s); if (!seen.has(cls)) seen.set(cls, styleCss(s, cls)); }
  return [...seen.values()].join("");
}

// ---------------------------------------------------------------------------
// Thuộc tính chung của khối (1.10): biến thể kiểu, neo, class riêng
// ---------------------------------------------------------------------------
const ANCHOR = /^[A-Za-z][\w-]{0,63}$/;
const CLASS_TOKEN = /^-?[_a-zA-Z][\w-]{0,40}$/;

/** Biến thể kiểu (`blockStyle`): tên preset → class `ecx-is-<tên>`. */
export function normalizeBlockStyleName(v: unknown): string | undefined {
  return typeof v === "string" && /^[a-z][a-z0-9-]{0,30}$/.test(v) ? v : undefined;
}
/** Neo (`anchor`) → id của phần tử. */
export function normalizeAnchor(v: unknown): string | undefined {
  return typeof v === "string" && ANCHOR.test(v.trim()) ? v.trim() : undefined;
}
/** Class CSS riêng (`className`): tối đa 5 class hợp lệ, cách nhau bởi dấu cách. */
export function normalizeClassName(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const tokens = v.split(/\s+/).filter(Boolean).filter((t) => CLASS_TOKEN.test(t)).slice(0, 5);
  return tokens.length ? [...new Set(tokens)].join(" ") : undefined;
}

/** Biến thể có sẵn của lõi (CSS trong style.css); theme thêm bằng theme.json › blockStyles. */
export const CORE_BLOCK_STYLES: Record<string, string[]> = {
  table: ["stripes"],
  image: ["rounded", "circle"],
  blockquote: ["plain"],
  horizontalRule: ["dots", "wide"],
  button: ["pill"],
  group: ["card"],
};

// ---------------------------------------------------------------------------
// Preset toàn site (1.10): theme.json › styles + bản sửa của quản trị viên → biến CSS
// ---------------------------------------------------------------------------
export interface StylePresets {
  colors?: Record<string, string>;
  fontSizes?: Record<string, string>;
  spacing?: Record<string, string>;
  fonts?: Record<string, string>;
}
const FLUID = /^clamp\(\s*-?[\d.]+(px|rem|em|vw|vh|%)?\s*,\s*[\d.\s+\-*()a-z%]{1,60},\s*-?[\d.]+(px|rem|em|vw|vh|%)?\s*\)$/;
const FONT = /^[\w\s"',.\-]{1,200}$/;
const presetSize = (v: unknown) => (typeof v === "string" && (LENGTH.test(v.trim()) || FLUID.test(v.trim())) ? v.trim() : undefined);
const presetColor = (v: unknown) => (typeof v === "string" && COLOR.test(v.trim()) ? v.trim() : undefined);
const presetFont = (v: unknown) => (typeof v === "string" && FONT.test(v.trim()) ? v.trim() : undefined);

/** Chuẩn hoá preset: tên preset hợp lệ, giá trị đã kiểm (màu hex/rgb/hsl, độ dài hoặc clamp(), danh sách phông không có ; { }). */
export function normalizePresets(v: unknown): StylePresets {
  const out: StylePresets = {};
  if (!isObj(v)) return out;
  const pick = (key: keyof StylePresets, fn: (x: unknown) => string | undefined) => {
    const src = v[key];
    if (!isObj(src)) return;
    const r: Record<string, string> = {};
    for (const [k, x] of Object.entries(src)) {
      const value = isObj(x) ? (x as Record<string, unknown>).value : x;
      const ok = /^([a-z][a-z0-9-]{0,30}|[1-9]x[sl])$/.test(k) ? fn(value) : undefined;
      if (ok !== undefined) r[k] = ok;
    }
    if (Object.keys(r).length) out[key] = r;
  };
  pick("colors", presetColor); pick("fontSizes", presetSize); pick("spacing", presetSize); pick("fonts", presetFont);
  return out;
}

/** Gộp preset theo thứ tự (sau đè trước): theme → bản sửa của quản trị viên. */
export function mergePresets(...list: unknown[]): StylePresets {
  const out: StylePresets = {};
  for (const p of list.map(normalizePresets))
    for (const k of Object.keys(p) as Array<keyof StylePresets>) out[k] = { ...out[k], ...p[k] };
  return out;
}

/** Biến CSS của preset: `--ecx-color-*`, `--ecx-font-size-*`, `--ecx-spacing-*`, `--ecx-font-family-*`. */
export function presetCss(presets: unknown, selector = ":root"): string {
  const p = normalizePresets(presets);
  const decl = [
    ...Object.entries(p.colors ?? {}).map(([k, v]) => `--ecx-color-${k}:${v}`),
    ...Object.entries(p.fontSizes ?? {}).map(([k, v]) => `--ecx-font-size-${k}:${v}`),
    ...Object.entries(p.spacing ?? {}).map(([k, v]) => `--ecx-spacing-${k}:${v}`),
    ...Object.entries(p.fonts ?? {}).map(([k, v]) => `--ecx-font-family-${k}:${v}`),
  ];
  return decl.length ? `${selector}{${decl.join(";")}}` : "";
}
