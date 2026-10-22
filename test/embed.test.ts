import assert from "node:assert/strict";
import { test } from "node:test";
import { embedInfo } from "../src/index.js";

test("nhúng: nhận ra nhà cung cấp, dựng địa chỉ khung từ mã trong đường dẫn", () => {
  const cases: Array<[string, string, string]> = [
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s", "youtube", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=90"],
    ["https://youtu.be/dQw4w9WgXcQ", "youtube", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "youtube", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["http://vimeo.com/76979871", "vimeo", "https://player.vimeo.com/video/76979871?dnt=1"],
    ["https://open.spotify.com/intl-vi/track/4uLU6hMCjMI75M1A2tKUQC?si=x", "spotify", "https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC"],
    ["https://soundcloud.com/forss/flickermood", "soundcloud", "https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fforss%2Fflickermood&visual=false"],
    ["https://www.tiktok.com/@user.name/video/7106594312292453675", "tiktok", "https://www.tiktok.com/embed/v2/7106594312292453675"],
    ["https://x.com/jack/status/20", "x", "https://platform.twitter.com/embed/Tweet.html?id=20&dnt=true"],
    ["https://www.instagram.com/p/CxYz_12/", "instagram", "https://www.instagram.com/p/CxYz_12/embed"],
    ["https://codepen.io/team/pen/abcXYZ", "codepen", "https://codepen.io/team/embed/abcXYZ?default-tab=result"],
  ];
  for (const [url, provider, src] of cases) {
    const info = embedInfo(url);
    assert.equal(info?.provider, provider, url);
    assert.equal(info?.src, src, url);
    assert.ok(info.aspect || info.height, url);
  }
});

test("nhúng: đường dẫn lạ / nguy hiểm → null (website hiện liên kết thường)", () => {
  for (const url of ["https://evil.example/embed?v=dQw4w9WgXcQ", "javascript:alert(1)", "https://youtube.com.evil.vn/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=short", "ftp://vimeo.com/1", "", null, 42, "https://www.google.com/maps/place/Hanoi"]) {
    assert.equal(embedInfo(url as any), null, String(url));
  }
  // Ký tự đặc biệt bị mã hoá trong địa chỉ khung (không thoát ra khỏi thuộc tính src)
  assert.equal(embedInfo('https://www.google.com/maps/embed?pb=x"><script>')?.src, "https://www.google.com/maps/embed?pb=x%22%3E%3Cscript%3E");
});
