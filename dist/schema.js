const s = (extra = {}) => ({ type: "string", ...extra });
const n = (extra = {}) => ({ type: "number", ...extra });
const i = (extra = {}) => ({ type: "integer", ...extra });
const b = (extra = {}) => ({ type: "boolean", ...extra });
const url = () => ({ type: "url" });
const align = s({ enum: ["left", "center", "right", "justify"] });
const media = { src: url(), name: s(), mime: s(), mediaId: { type: "json" }, caption: s() };
/**
 * Khối lõi trong nội dung soạn thảo (khối `richtext`). Thuộc tính không có trong danh sách vẫn được giữ nguyên
 * (plugin có thể thêm thuộc tính vào khối lõi) — chỉ thuộc tính có mô tả mới được kiểm kiểu.
 */
export const CORE_NODES = {
    doc: {},
    text: {},
    paragraph: { attrs: { textAlign: align } },
    heading: { attrs: { level: i({ min: 1, max: 6, default: 2 }), textAlign: align, id: s() } },
    bulletList: {},
    orderedList: { attrs: { start: i({ min: 0, default: 1 }) } },
    listItem: {},
    taskList: {},
    taskItem: { attrs: { checked: b({ default: false }) } },
    blockquote: {},
    codeBlock: { attrs: { language: s() } },
    hardBreak: {},
    horizontalRule: {},
    image: {
        attrs: {
            src: url(), alt: s(), title: s(), width: n({ min: 1 }), height: n({ min: 1 }), srcset: s(), webpSrcset: s(),
            mediaId: { type: "json" }, size: s({ default: "large" }), caption: s(), align: s({ enum: ["left", "right", "center", "wide", "full"] }),
        },
    },
    gallery: { attrs: { images: { type: "json", default: [] }, columns: i({ min: 1, max: 6, default: 3 }), caption: s() } },
    video: { attrs: { ...media, poster: url() } },
    audio: { attrs: { ...media } },
    file: { attrs: { ...media, size: n({ min: 0 }), embed: b({ default: true }), download: b() } },
    table: {},
    tableRow: {},
    tableHeader: { attrs: { colspan: i({ min: 1, default: 1 }), rowspan: i({ min: 1, default: 1 }), colwidth: { type: "json" } } },
    tableCell: { attrs: { colspan: i({ min: 1, default: 1 }), rowspan: i({ min: 1, default: 1 }), colwidth: { type: "json" } } },
    youtube: { attrs: { src: url(), start: i({ min: 0 }), width: n({ min: 1 }), height: n({ min: 1 }) } },
    // Bố cục (1.2): cột, nhóm, hộp lưu ý chứa khối khác; nút; nhúng theo đường dẫn (embedInfo)
    columns: { attrs: { verticalAlign: s({ enum: ["top", "center", "bottom"] }), stack: b({ default: true }) } },
    column: { attrs: { width: n({ min: 5, max: 100 }) } },
    group: { attrs: { background: s(), textColor: s(), padding: s({ enum: ["none", "small", "medium", "large"], default: "medium" }) } },
    callout: { attrs: { tone: s({ enum: ["info", "success", "warning", "danger"], default: "info" }), title: s() } },
    button: {
        attrs: {
            text: s(), href: url(), target: s(), rel: s(),
            variant: s({ enum: ["primary", "secondary", "outline"], default: "primary" }), align: s({ enum: ["left", "center", "right"] }),
        },
    },
    embed: { attrs: { url: url(), caption: s() } },
};
export const CORE_MARKS = {
    bold: {}, italic: {}, underline: {}, strike: {}, code: {}, subscript: {}, superscript: {},
    highlight: { attrs: { color: s() } },
    textStyle: { attrs: { color: s() } },
    link: { attrs: { href: url(), target: s(), rel: s() } },
};
/** Ép giá trị theo mô tả. Trả về undefined = bỏ thuộc tính (dùng mặc định). */
export function coerceAttr(spec, value) {
    if (value === null || value === undefined)
        return undefined;
    let v = value;
    switch (spec.type) {
        case "string":
        case "url":
            if (typeof v === "number" || typeof v === "boolean")
                v = String(v);
            if (typeof v !== "string")
                return undefined;
            break;
        case "number":
        case "integer": {
            const num = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
            if (!Number.isFinite(num))
                return undefined;
            let x = spec.type === "integer" ? Math.round(num) : num;
            if (spec.min !== undefined)
                x = Math.max(spec.min, x);
            if (spec.max !== undefined)
                x = Math.min(spec.max, x);
            v = x;
            break;
        }
        case "boolean":
            if (v === "true")
                v = true;
            else if (v === "false")
                v = false;
            if (typeof v !== "boolean")
                return undefined;
            break;
        case "json":
            break;
    }
    if (spec.enum && !spec.enum.includes(v))
        return undefined;
    return v;
}
/** Chuẩn hoá bộ thuộc tính: ép kiểu thuộc tính có mô tả, giữ nguyên thuộc tính khác, bỏ null. Rỗng → undefined. */
export function normalizeAttrs(attrs, spec) {
    if (!attrs || typeof attrs !== "object" || Array.isArray(attrs))
        return undefined;
    const out = {};
    for (const [key, value] of Object.entries(attrs)) {
        const v = spec?.[key] ? coerceAttr(spec[key], value) : value === null ? undefined : value;
        if (v !== undefined)
            out[key] = v;
    }
    return Object.keys(out).length ? out : undefined;
}
