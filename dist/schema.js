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
    table: { attrs: { footer: b({ default: false }), fixed: b({ default: false }) } },
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
    // Bộ khối cơ bản (1.9)
    spacer: { attrs: { height: s({ default: "lg" }) } },
    buttons: { attrs: { align: s({ enum: ["left", "center", "right", "space-between"] }) } },
    cover: {
        attrs: {
            src: url(), mediaId: { type: "json" }, alt: s(), overlay: s(), opacity: i({ min: 0, max: 100, default: 50 }), minHeight: s({ default: "400px" }),
            contentAlign: s({ enum: ["top", "center", "bottom"], default: "center" }), fixed: b({ default: false }),
        },
    },
    mediaText: {
        attrs: {
            src: url(), mediaId: { type: "json" }, alt: s(), position: s({ enum: ["left", "right"], default: "left" }), width: i({ min: 20, max: 80, default: 50 }),
            verticalAlign: s({ enum: ["top", "center", "bottom"], default: "center" }), stack: b({ default: true }),
        },
    },
    pullquote: { attrs: { citation: s() } },
    details: { attrs: { summary: s(), open: b({ default: false }) } },
    customHtml: { attrs: { html: s() } },
    socialLinks: { attrs: { links: { type: "json", default: [] }, size: s({ enum: ["small", "medium", "large"], default: "medium" }), align: s({ enum: ["left", "center", "right"] }) } },
    tableOfContents: { attrs: { title: s(), maxLevel: i({ min: 2, max: 4, default: 3 }) } },
    preformatted: {},
    // Khối động (1.6): lấy dữ liệu lúc hiển thị theo ngữ cảnh (website, trang đang xem, bài trong vòng lặp) — dùng trong template
    siteTitle: { attrs: { level: i({ min: 0, max: 6, default: 0 }), link: b({ default: true }), textAlign: align } },
    siteLogo: { attrs: { width: n({ min: 16, max: 600, default: 120 }), link: b({ default: true }) } },
    siteTagline: { attrs: { textAlign: align } },
    navigation: { attrs: { location: s({ default: "primary" }), orientation: s({ enum: ["horizontal", "vertical"], default: "horizontal" }), mobile: b({ default: true }) } },
    search: { attrs: { placeholder: s(), buttonText: s() } },
    languageSwitcher: {},
    copyright: { attrs: { text: s(), textAlign: align } },
    postTitle: { attrs: { level: i({ min: 1, max: 6, default: 1 }), link: b({ default: false }), textAlign: align } },
    postContent: {},
    postExcerpt: { attrs: { moreText: s() } },
    featuredImage: { attrs: { size: s({ default: "large" }), link: b({ default: false }), aspect: s({ enum: ["auto", "16/9", "4/3", "1/1", "3/4"], default: "auto" }) } },
    postDate: { attrs: { textAlign: align } },
    postAuthor: { attrs: { avatar: b({ default: false }) } },
    postTerms: { attrs: { taxonomy: s({ default: "category" }), separator: s({ default: ", " }) } },
    comments: {},
    query: {
        attrs: {
            inherit: b({ default: true }), postType: s({ default: "post" }), perPage: i({ min: 1, max: 50, default: 10 }),
            category: s(), tag: s(), orderBy: s({ enum: ["date", "title", "menu_order"], default: "date" }), order: s({ enum: ["desc", "asc"], default: "desc" }),
        },
    },
    postTemplate: { attrs: { layout: s({ enum: ["list", "grid"], default: "list" }), columns: i({ min: 1, max: 6, default: 3 }) } },
    pagination: {},
    queryEmpty: {},
    templatePart: { attrs: { slug: s(), tagName: s({ enum: ["div", "header", "footer", "aside", "section"], default: "div" }) } },
};
/** Khối động: nội dung lấy theo ngữ cảnh lúc hiển thị (website, trang, bài trong vòng lặp). */
export const DYNAMIC_NODES = [
    "siteTitle", "siteLogo", "siteTagline", "navigation", "search", "languageSwitcher", "copyright",
    "postTitle", "postContent", "postExcerpt", "featuredImage", "postDate", "postAuthor", "postTerms", "comments",
    "query", "postTemplate", "pagination", "queryEmpty", "templatePart",
];
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
