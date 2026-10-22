/** Thuộc tính lưu phiên bản của khối trong dữ liệu (chỉ khi version > 1). */
export const BLOCK_VERSION_ATTR = "_v";
const NAME = /^[a-zA-Z][\w-]*(\/[a-zA-Z][\w-]*)?$/;
/**
 * Khai báo một khối — dùng chung cho trình soạn (admin) và website: cùng một file định nghĩa, import ở cả hai phía.
 * Chỉ là dữ liệu (không phụ thuộc trình soạn nào): trình soạn tự sinh node + form cài đặt + mục slash menu, website
 * chuẩn hoá thuộc tính rồi đưa cho component hiển thị của plugin. Khối của plugin đã tắt: dữ liệu giữ nguyên.
 */
export function defineBlock(input) {
    if (!NAME.test(input.name))
        throw new Error(`defineBlock: tên khối không hợp lệ "${input.name}" (chữ, số, -, _; tuỳ chọn tiền tố "plugin/")`);
    const version = input.version ?? 1;
    if (!Number.isInteger(version) || version < 1)
        throw new Error(`defineBlock(${input.name}): version phải là số nguyên ≥ 1`);
    for (let v = 1; v < version; v++)
        if (!input.migrate?.[v])
            throw new Error(`defineBlock(${input.name}): thiếu migrate[${v}] (nâng từ bản ${v} lên ${v + 1})`);
    if (input.attributes?.[BLOCK_VERSION_ATTR])
        throw new Error(`defineBlock(${input.name}): "${BLOCK_VERSION_ATTR}" là tên dành riêng`);
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
export function blockDefaults(def) {
    const out = {};
    for (const [k, spec] of Object.entries(def.attributes))
        if (spec.default !== undefined)
            out[k] = structuredClone(spec.default);
    if (def.version > 1)
        out[BLOCK_VERSION_ATTR] = def.version;
    return out;
}
/** Mô tả thuộc tính để chuẩn hoá (normalizeContent → options.nodes). */
export function blockNodeSpec(def) {
    return { attrs: { ...def.attributes, [BLOCK_VERSION_ATTR]: { type: "integer", min: 1 } } };
}
/** Nâng thuộc tính của một khối lưu bằng bản cũ lên bản hiện tại. */
export function migrateBlockAttrs(def, attrs) {
    if (def.version <= 1)
        return attrs;
    let current = { ...(attrs ?? {}) };
    let v = typeof current[BLOCK_VERSION_ATTR] === "number" ? current[BLOCK_VERSION_ATTR] : 1;
    if (v >= def.version)
        return attrs;
    delete current[BLOCK_VERSION_ATTR];
    for (; v < def.version; v++)
        current = def.migrate[v]({ ...current });
    current[BLOCK_VERSION_ATTR] = def.version;
    return current;
}
