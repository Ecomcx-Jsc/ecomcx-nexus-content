import assert from "node:assert/strict";
import { test } from "node:test";
import { collectStyles, normalizeContent, normalizeStyle, styleClass, styleCss } from "../src/index.js";

test("style: dạng gọn thành theo khổ, thứ tự khoá cố định, giá trị lạ bị bỏ", () => {
  assert.deepEqual(normalizeStyle({
    hide: ["mobile", "desktop", "tv"], color: { background: "#fff7ed", text: "primary" },
    padding: "lg", margin: { base: { top: "xl", bottom: "0", left: "1e9px" }, mobile: { top: "md" } },
    fontSize: { base: "2xl", mobile: "18px", tablet: "calc(1px)" }, lineHeight: "1.456", fontWeight: 700,
    textAlign: { mobile: "center", base: "middle" }, radius: "8px", border: { style: "groove", width: "2px" }, width: "100%",
  }), {
    padding: { base: "lg" }, margin: { base: { top: "xl", bottom: "0" }, mobile: { top: "md" } }, width: { base: "100%" },
    fontSize: { base: "2xl", mobile: "18px" }, lineHeight: { base: 1.46 }, fontWeight: "700", textAlign: { mobile: "center" },
    color: { text: "primary", background: "#fff7ed" }, border: { width: "2px" }, radius: "8px", hide: ["desktop", "mobile"],
  });
});

test("style: chặn chèn CSS", () => {
  for (const bad of ["red;}body{display:none", "url(https://x)", "expression(alert(1))", "10", "1px 2px", "var(--x)", "#ff;", "rgb(1,2,3);x"]) {
    assert.equal(normalizeStyle({ padding: bad, color: { text: bad }, fontSize: bad, radius: bad }), undefined, bad);
  }
});

test("style: CSS theo khổ màn hình, preset thành biến, ẩn theo khổ", () => {
  const style = normalizeStyle({ padding: { base: "lg", mobile: { top: "sm", bottom: "sm" } }, fontSize: { base: "2xl", tablet: "20px" }, color: { text: "primary", background: "#000" }, hide: ["tablet"] })!;
  const cls = styleClass(style);
  assert.match(cls, /^ecx-s-[0-9a-z]+$/);
  assert.equal(styleCss(style, "x"),
    ".x.x{padding:var(--ecx-spacing-lg);font-size:var(--ecx-font-size-2xl);color:var(--ecx-color-primary, primary);background:#000}" +
    "@media (max-width:1024px){.x.x{font-size:20px}}" +
    "@media (max-width:640px){.x.x{padding-top:var(--ecx-spacing-sm);padding-bottom:var(--ecx-spacing-sm)}}" +
    "@media (min-width:641px) and (max-width:1024px){.x.x{display:none!important}}");
});

test("style: cùng kiểu dáng → cùng class, gom CSS một lần", () => {
  const a = normalizeStyle({ padding: "md" })!, b = normalizeStyle({ padding: { base: "md" } })!;
  assert.equal(styleClass(a), styleClass(b));
  assert.equal(collectStyles([a, b]).match(/\{padding/g)?.length, 1);
});

test("style: nằm trong attrs của mọi khối (lõi + plugin), không hợp lệ thì bỏ hẳn", () => {
  const { doc } = normalizeContent({ type: "doc", content: [
    { type: "paragraph", attrs: { style: { padding: "lg" } } },
    { type: "demo/hero", attrs: { title: "x", style: { margin: "auto" } } },
    { type: "heading", attrs: { level: 2, style: { padding: "url(x)" } } },
  ] });
  const c = doc.blocks[0].data.content;
  assert.deepEqual(c[0].attrs, { style: { padding: { base: "lg" } } });
  assert.deepEqual(c[1].attrs, { title: "x", style: { margin: { base: "auto" } } });
  assert.deepEqual(c[2].attrs, { level: 2 });
});
