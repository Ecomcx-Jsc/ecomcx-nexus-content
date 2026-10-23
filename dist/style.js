/**
 * Kiểu dáng của khối (`attrs.style`, mọi khối): khoảng cách, cỡ chữ, màu, viền, ẩn theo khổ màn hình.
 * Giá trị theo khổ: `{ base, tablet, mobile }` (tablet ≤ 1024px, mobile ≤ 640px). Giá trị là preset của theme
 * (`lg`, `primary` → biến CSS `--ecx-spacing-lg`, `--ecx-color-primary`) hoặc giá trị CSS đã kiểm (độ dài, màu).
 * Chỉ nhận giá trị trong danh sách → không chèn được CSS tuỳ ý. Máy chủ chạy cùng quy tắc (ContentFormat.cs).
 */
export const BREAKPOINTS = { tablet: 1024, mobile: 640 };
export const DEVICES = ["base", "tablet", "mobile"];
const SIDES = ["top", "right", "bottom", "left"];
const LENGTH = /^(0|-?\d{1,4}(\.\d{1,3})?(px|rem|em|%|vw|vh))$/;
const PRESET = /^([a-z][a-z0-9-]{0,30}|[1-9]x[sl])$/;
const COLOR = /^(#[0-9a-f]{3,8}|(rgb|hsl)a?\([\d\s.,%/]{1,40}\))$/i;
const WEIGHTS = ["300", "400", "500", "600", "700", "800", "900"];
const ALIGNS = ["left", "center", "right", "justify"];
const BORDER_STYLES = ["solid", "dashed", "dotted"];
const HIDE = ["desktop", "tablet", "mobile"];
const FONT_STYLES = ["normal", "italic"];
const DECORATIONS = ["none", "underline", "line-through"];
const TRANSFORMS = ["none", "uppercase", "lowercase", "capitalize"];
const preset = (v) => (typeof v === "string" && PRESET.test(v) ? v : undefined);
const isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const size = (v) => (typeof v === "string" && (LENGTH.test(v) || PRESET.test(v)) ? v : undefined);
const color = (v) => (typeof v === "string" && (COLOR.test(v.trim()) || PRESET.test(v)) ? v.trim() : undefined);
const oneOf = (list) => (v) => (typeof v === "string" && list.includes(v) ? v : undefined);
const lineHeight = (v) => {
    const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
    return Number.isFinite(n) && n >= 0.5 && n <= 4 ? Math.round(n * 100) / 100 : undefined;
};
function box(v) {
    if (typeof v === "string")
        return size(v);
    if (!isObj(v))
        return undefined;
    const out = {};
    for (const s of SIDES) {
        const x = size(v[s]);
        if (x !== undefined)
            out[s] = x;
    }
    return Object.keys(out).length ? out : undefined;
}
/** Giá trị theo khổ: nhận cả dạng gọn (một giá trị = base). */
function responsive(v, fn) {
    const src = isObj(v) && DEVICES.some((d) => d in v) ? v : { base: v };
    const out = {};
    for (const d of DEVICES) {
        const x = fn(src[d]);
        if (x !== undefined)
            out[d] = x;
    }
    return Object.keys(out).length ? out : undefined;
}
function group(v, fields) {
    if (!isObj(v))
        return undefined;
    const out = {};
    for (const k of Object.keys(fields)) {
        const x = fields[k](v[k]);
        if (x !== undefined)
            out[k] = x;
    }
    return Object.keys(out).length ? out : undefined;
}
/** Chuẩn hoá `attrs.style`: giữ đúng thứ tự khoá, bỏ giá trị không hợp lệ. Rỗng → undefined. */
export function normalizeStyle(v) {
    if (!isObj(v))
        return undefined;
    const out = {};
    const set = (k, x) => { if (x !== undefined)
        out[k] = x; };
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
    if (Array.isArray(v.hide)) {
        const h = HIDE.filter((d) => v.hide.includes(d));
        if (h.length)
            out.hide = [...h];
    }
    return Object.keys(out).length ? out : undefined;
}
// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------
const lit = (v) => v === "auto" || v === "0" || LENGTH.test(v);
const spacing = (v) => (lit(v) ? v : `var(--ecx-spacing-${v})`);
const fontSize = (v) => (lit(v) ? v : `var(--ecx-font-size-${v})`);
const colorValue = (v) => (COLOR.test(v) ? v : `var(--ecx-color-${v}, ${v})`);
function boxDecl(prop, v) {
    if (typeof v === "string")
        return [`${prop}:${spacing(v)}`];
    return SIDES.filter((s) => v[s] !== undefined).map((s) => `${prop}-${s}:${spacing(v[s])}`);
}
/** Khai báo CSS cho từng khổ màn hình. */
function declarations(style) {
    const out = { base: [], tablet: [], mobile: [] };
    for (const d of DEVICES) {
        const p = style.padding?.[d];
        if (p !== undefined)
            out[d].push(...boxDecl("padding", p));
        const m = style.margin?.[d];
        if (m !== undefined)
            out[d].push(...boxDecl("margin", m));
        const g = style.gap?.[d];
        if (g !== undefined)
            out[d].push(`gap:${spacing(g)}`);
        const w = style.width?.[d];
        if (w !== undefined)
            out[d].push(`width:${spacing(w)}`);
        const mw = style.maxWidth?.[d];
        if (mw !== undefined)
            out[d].push(`max-width:${spacing(mw)}`);
        const mh = style.minHeight?.[d];
        if (mh !== undefined)
            out[d].push(`min-height:${spacing(mh)}`);
        const fs = style.fontSize?.[d];
        if (fs !== undefined)
            out[d].push(`font-size:${fontSize(fs)}`);
        const lh = style.lineHeight?.[d];
        if (lh !== undefined)
            out[d].push(`line-height:${lh}`);
        const ls = style.letterSpacing?.[d];
        if (ls !== undefined)
            out[d].push(`letter-spacing:${lit(ls) ? ls : `var(--ecx-letter-spacing-${ls})`}`);
        const ta = style.textAlign?.[d];
        if (ta !== undefined)
            out[d].push(`text-align:${ta}`);
    }
    if (style.fontFamily)
        out.base.push(`font-family:var(--ecx-font-family-${style.fontFamily}, inherit)`);
    if (style.fontWeight)
        out.base.push(`font-weight:${style.fontWeight}`);
    if (style.fontStyle)
        out.base.push(`font-style:${style.fontStyle}`);
    if (style.textDecoration)
        out.base.push(`text-decoration:${style.textDecoration}`);
    if (style.textTransform)
        out.base.push(`text-transform:${style.textTransform}`);
    if (style.color?.text)
        out.base.push(`color:${colorValue(style.color.text)}`);
    if (style.color?.background)
        out.base.push(`background:${colorValue(style.color.background)}`);
    if (style.border?.width || style.border?.style || style.border?.color)
        out.base.push(`border:${style.border.width ? spacing(style.border.width) : "1px"} ${style.border.style ?? "solid"} ${style.border.color ? colorValue(style.border.color) : "currentColor"}`);
    if (style.radius)
        out.base.push(`border-radius:${spacing(style.radius)}`);
    return out;
}
/** Độ dài / preset khoảng cách hợp lệ → giá trị CSS (preset thành biến); không hợp lệ → undefined. Dùng cho thuộc tính khối như chiều cao khoảng trống. */
export function spacingValue(v) {
    const x = size(v);
    return x === undefined ? undefined : spacing(x);
}
/** Màu hợp lệ (hex/rgb/hsl hoặc preset) → giá trị CSS; không hợp lệ → undefined. */
export function colorCss(v) {
    const x = color(v);
    return x === undefined ? undefined : colorValue(x);
}
/** Tên class ổn định theo nội dung style (cùng kiểu dáng → cùng class). */
export function styleClass(style) {
    let h = 0x811c9dc5;
    const s = JSON.stringify(style);
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return `ecx-s-${h.toString(36)}`;
}
/** CSS của một kiểu dáng: `.cls.cls{…}` + media query cho tablet / mobile + ẩn theo khổ. Rỗng → "". */
export function styleCss(style, cls = styleClass(style)) {
    const sel = `.${cls}.${cls}`;
    const d = declarations(style);
    let css = d.base.length ? `${sel}{${d.base.join(";")}}` : "";
    if (d.tablet.length)
        css += `@media (max-width:${BREAKPOINTS.tablet}px){${sel}{${d.tablet.join(";")}}}`;
    if (d.mobile.length)
        css += `@media (max-width:${BREAKPOINTS.mobile}px){${sel}{${d.mobile.join(";")}}}`;
    for (const h of style.hide ?? []) {
        const q = h === "desktop" ? `(min-width:${BREAKPOINTS.tablet + 1}px)` : h === "tablet" ? `(min-width:${BREAKPOINTS.mobile + 1}px) and (max-width:${BREAKPOINTS.tablet}px)` : `(max-width:${BREAKPOINTS.mobile}px)`;
        css += `@media ${q}{${sel}{display:none!important}}`;
    }
    return css;
}
/** Gom CSS cho cả một cây nội dung: trả về css (mỗi class một lần) — website và trình soạn dùng chung. */
export function collectStyles(styles) {
    const seen = new Map();
    for (const s of styles) {
        const cls = styleClass(s);
        if (!seen.has(cls))
            seen.set(cls, styleCss(s, cls));
    }
    return [...seen.values()].join("");
}
