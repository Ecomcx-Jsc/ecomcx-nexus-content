const BLOCK_BREAK = new Set(["paragraph", "heading", "listItem", "taskItem", "blockquote", "codeBlock", "tableCell", "tableHeader"]);
/** Chữ thuần của một nút (không định dạng). */
export function nodeText(node) {
    if (node.type === "text")
        return node.text ?? "";
    if (node.type === "hardBreak")
        return "\n";
    if (node.type === "button")
        return typeof node.attrs?.text === "string" && node.attrs.text ? node.attrs.text + "\n" : "";
    return (node.content ?? []).map(nodeText).join("") + (BLOCK_BREAK.has(node.type) ? "\n" : "");
}
/** Chữ thuần của cả bài (tìm kiếm, tóm tắt, đếm từ). Khối HTML bỏ thẻ; khối plugin bỏ qua. */
export function contentText(doc) {
    return doc.blocks.map((b) => (b.type === "richtext" && b.data ? nodeText(b.data) : b.type === "html" ? String(b.data?.html ?? "").replace(/<[^>]+>/g, " ") : ""))
        .join("\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
/** Số từ (tách theo khoảng trắng — đúng cho tiếng Việt và tiếng Anh). */
export const wordCount = (doc) => contentText(doc).split(/\s+/).filter(Boolean).length;
/** Duyệt mọi nút soạn thảo của bài (kể cả lồng nhau). Trả false để không đi vào con. */
export function visitNodes(doc, visit) {
    const walk = (node, parent) => {
        if (visit(node, parent) === false)
            return;
        for (const c of node.content ?? [])
            walk(c, node);
    };
    for (const b of doc.blocks)
        if (b.type === "richtext" && b.data)
            walk(b.data, null);
}
