// dist/ is committed (like next-fetch-kit): npm 11 skips "prepare" of GitHub dependencies when installing with
// --ignore-scripts (the CMS Builder does), so consumers must get built files straight from the repo.
// This check rebuilds into a temp dir and fails when the committed dist/ differs from src/.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const tmp = mkdtempSync(path.join(os.tmpdir(), "content-dist-"));
try {
  execFileSync(process.execPath, [path.join(root, "node_modules", "typescript", "bin", "tsc"), "-p", path.join(root, "tsconfig.json"), "--outDir", tmp], { stdio: "inherit" });
  const files = (d) => readdirSync(d).sort();
  const expected = files(tmp), actual = files(path.join(root, "dist"));
  const stale = expected.filter((f) => !actual.includes(f) || readFileSync(path.join(tmp, f), "utf8") !== readFileSync(path.join(root, "dist", f), "utf8"));
  const extra = actual.filter((f) => !expected.includes(f));
  if (stale.length || extra.length) {
    console.error(`dist/ is out of date (${[...stale, ...extra].join(", ")}). Run: npm run build, then commit dist/.`);
    process.exit(1);
  }
  console.log("dist/ matches src/");
} finally { rmSync(tmp, { recursive: true, force: true }); }
