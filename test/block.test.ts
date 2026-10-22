import assert from "node:assert/strict";
import { test } from "node:test";
import { blockDefaults, defineBlock, normalizeContent } from "../src/index.js";

const callout = defineBlock({
  name: "demo/callout", title: "Hộp lưu ý", content: "blocks", keywords: "luu y callout",
  attributes: { tone: { type: "string", enum: ["info", "warning"], default: "info", label: "Kiểu" }, title: { type: "string", label: "Tiêu đề" } },
});

test("defineBlock: dữ liệu thuần, mặc định content none, version 1", () => {
  const b = defineBlock({ name: "x", title: "X" });
  assert.equal(b.content, "none");
  assert.equal(b.version, 1);
  assert.ok(Object.isFrozen(b));
});

test("defineBlock: báo lỗi khai báo sai", () => {
  assert.throws(() => defineBlock({ name: "có dấu", title: "x" }), /tên khối/);
  assert.throws(() => defineBlock({ name: "x", title: "x", version: 2 }), /migrate\[1\]/);
  assert.throws(() => defineBlock({ name: "x", title: "x", attributes: { _v: { type: "integer" } } }), /dành riêng/);
});

test("mặc định khi chèn khối mới", () => {
  assert.deepEqual(blockDefaults(callout), { tone: "info" });
});

test("chuẩn hoá: thuộc tính khối plugin được ép kiểu, nội dung con giữ nguyên", () => {
  const { doc } = normalizeContent({ type: "doc", content: [{ type: "demo/callout", attrs: { tone: "loud", title: 5, extra: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "Chú ý" }] }] }] }, { blocks: [callout] });
  assert.deepEqual(doc.blocks[0].data.content[0], { type: "demo/callout", attrs: { title: "5", extra: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "Chú ý" }] }] });
});

// Bản 2 đổi "color" (bản 1) thành "tone"; bản 3 thêm "icon" mặc định
const v3 = defineBlock({
  name: "demo/badge", title: "Nhãn", version: 3,
  attributes: { tone: { type: "string" }, icon: { type: "string" } },
  migrate: {
    1: ({ color, ...rest }) => ({ ...rest, tone: color === "red" ? "danger" : "info" }),
    2: (a) => ({ ...a, icon: a.icon ?? "star" }),
  },
});

test("nâng phiên bản: bài lưu bằng bản 1 → bản 3 khi đọc, chạy lại không nâng nữa", () => {
  const old = { type: "doc", content: [{ type: "demo/badge", attrs: { color: "red" } }] };
  const { doc } = normalizeContent(old, { blocks: [v3] });
  const node = doc.blocks[0].data.content[0];
  assert.deepEqual(node.attrs, { tone: "danger", icon: "star", _v: 3 });
  assert.deepEqual(normalizeContent(doc, { blocks: [v3] }).doc, doc);
});

test("bản 2 → bản 3 chỉ chạy bước còn thiếu", () => {
  const { doc } = normalizeContent({ type: "doc", content: [{ type: "demo/badge", attrs: { tone: "info", icon: "bell", _v: 2 } }] }, { blocks: [v3] });
  assert.deepEqual(doc.blocks[0].data.content[0].attrs, { tone: "info", icon: "bell", _v: 3 });
});

test("migrate ném lỗi: giữ nguyên dữ liệu + ghi issue, không mất bài", () => {
  const bad = defineBlock({ name: "demo/bad", title: "Bad", version: 2, migrate: { 1: () => { throw new Error("boom"); } } });
  const { doc, issues } = normalizeContent({ type: "doc", content: [{ type: "demo/bad", attrs: { a: 1 } }] }, { blocks: [bad] });
  assert.deepEqual(doc.blocks[0].data.content[0].attrs, { a: 1 });
  assert.ok(issues.some((i) => i.includes("migrate failed")));
});

test("không có định nghĩa (plugin tắt): khối giữ nguyên, không nâng", () => {
  const raw = { type: "doc", content: [{ type: "demo/badge", attrs: { color: "red" } }] };
  assert.deepEqual(normalizeContent(raw).doc.blocks[0].data.content[0].attrs, { color: "red" });
});
