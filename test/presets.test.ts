import assert from "node:assert/strict";
import { test } from "node:test";
import { mergePresets, normalizeContent, normalizePresets, presetCss } from "../src/index.js";

test("preset: gộp theme → bản sửa, chỉ nhận giá trị đã kiểm", () => {
  const theme = { colors: { primary: { label: "%c.primary%", value: "#0ea5e9" }, accent: "#f97316" }, fontSizes: { lg: "1.25rem", xl: "clamp(1.5rem, 1rem + 2vw, 2.5rem)" },
    spacing: { md: "1rem" }, fonts: { heading: "\"Be Vietnam Pro\", sans-serif" } };
  const user = { colors: { primary: "#111827", bad: "red;}x{" , "Hoa": "#fff" }, fontSizes: { lg: "url(x)" }, fonts: { body: "x;}" } };
  assert.deepEqual(mergePresets(theme, user), {
    colors: { primary: "#111827", accent: "#f97316" }, fontSizes: { lg: "1.25rem", xl: "clamp(1.5rem, 1rem + 2vw, 2.5rem)" }, spacing: { md: "1rem" },
    fonts: { heading: "\"Be Vietnam Pro\", sans-serif" },
  });
  assert.equal(presetCss({ colors: { primary: "#111" }, spacing: { md: "12px" } }), ":root{--ecx-color-primary:#111;--ecx-spacing-md:12px}");
  assert.equal(presetCss({ colors: { primary: "expression(1)" } }), "");
  assert.deepEqual(normalizePresets(null), {});
});

test("khối: biến thể kiểu, neo, class riêng — giá trị lạ bị bỏ", () => {
  const { doc } = normalizeContent({ type: "doc", content: [
    { type: "table", attrs: { blockStyle: "stripes", anchor: " bang-gia ", className: "pricing  pricing  x\"y  -ok" } },
    { type: "paragraph", attrs: { blockStyle: "Bad Style", anchor: "1abc", className: "<script>" } },
  ] });
  const [a, b] = doc.blocks[0].data.content;
  assert.deepEqual(a.attrs, { blockStyle: "stripes", anchor: "bang-gia", className: "pricing -ok" });
  assert.equal(b.attrs, undefined);
});
