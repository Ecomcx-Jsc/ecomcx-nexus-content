import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(new URL("../../style.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Bỏ mọi :where(...) (kể cả lồng) → phần còn lại chỉ được là dấu nối/khoảng trắng. */
function outsideWhere(sel: string) {
  let out = "", i = 0;
  while (i < sel.length) {
    if (sel.startsWith(":where(", i)) {
      let depth = 0, j = i + 6;
      for (; j < sel.length; j++) { if (sel[j] === "(") depth++; else if (sel[j] === ")" && --depth === 0) break; }
      i = j + 1;
    } else out += sel[i++];
  }
  return out;
}

test("style.css: mọi selector có độ ưu tiên 0 (theme luôn ghi đè được)", () => {
  const selectors = [...css.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim()).filter((s) => s && !s.startsWith("@"));
  assert.ok(selectors.length > 20);
  for (const s of selectors) assert.match(outsideWhere(s), /^[\s>+~]*$/, `selector có độ ưu tiên: ${s}`);
});

test("style.css: nằm trọn trong @layer ecx-content", () => {
  assert.match(css.trim(), /^@layer ecx-content \{[\s\S]*\}$/);
});

test("style.css: bảng có viền và ô trống không co về 0", () => {
  assert.match(css, /:where\(th, td\) \{[^}]*border: 1px solid/);
  assert.match(css, /:where\(th, td\) \{[^}]*height:/);
});
