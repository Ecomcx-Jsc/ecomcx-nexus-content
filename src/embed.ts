/**
 * Nhúng theo đường dẫn (khối `embed`): chỉ nhà cung cấp trong danh sách dưới đây được hiển thị dạng khung nhúng.
 * Địa chỉ khung luôn do hàm này dựng từ mã nhận ra trong đường dẫn (không dùng HTML/URL nhúng do người dùng dán) →
 * dữ liệu bài viết không thể chèn khung tới trang tuỳ ý. Đường dẫn không nhận ra → website hiện liên kết thường.
 * Trình soạn (xem trước) và website (theme-sdk) dùng chung hàm này.
 */
export interface EmbedInfo {
  /** Mã nhà cung cấp (youtube, vimeo…). */
  provider: string;
  /** Tên hiển thị (title của iframe). */
  title: string;
  /** Địa chỉ khung nhúng. */
  src: string;
  /** Tỉ lệ rộng/cao (khung co giãn theo bề ngang). Không có → dùng `height` cố định. */
  aspect?: number;
  height?: number;
  /** Bề ngang tối đa (vd video dọc TikTok). */
  maxWidth?: number;
}

// URL có sẵn ở mọi môi trường chạy (trình duyệt, Node ≥ 10) — khai báo kiểu tối thiểu, gói không phụ thuộc lib "dom"
interface Url { href: string; protocol: string; origin: string; pathname: string; searchParams: { get(name: string): string | null } }
const UrlCtor = (globalThis as unknown as { URL: new (input: string) => Url }).URL;

type Rule = { provider: string; title: string; match: RegExp; src(m: RegExpMatchArray, url: Url): string; aspect?: number; height?: number | ((m: RegExpMatchArray) => number); maxWidth?: number };

const enc = encodeURIComponent;

/** Giây bắt đầu từ ?t=1m30s / ?t=90 / ?start=90. */
function startSeconds(url: Url): number {
  const t = url.searchParams.get("t") ?? url.searchParams.get("start") ?? "";
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

const RULES: Rule[] = [
  { provider: "youtube", title: "YouTube", aspect: 16 / 9,
    match: /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})(?:[?&#/]|$)/,
    src: (m, u) => `https://www.youtube-nocookie.com/embed/${m[1]}${startSeconds(u) ? `?start=${startSeconds(u)}` : ""}` },
  { provider: "vimeo", title: "Vimeo", aspect: 16 / 9, match: /^https:\/\/(?:www\.)?vimeo\.com\/(?:video\/)?(\d+)(?:[?#/]|$)/, src: (m) => `https://player.vimeo.com/video/${m[1]}?dnt=1` },
  { provider: "loom", title: "Loom", aspect: 16 / 9, match: /^https:\/\/(?:www\.)?loom\.com\/share\/([a-f0-9]+)(?:[?#]|$)/, src: (m) => `https://www.loom.com/embed/${m[1]}` },
  { provider: "spotify", title: "Spotify", height: (m) => (m[1] === "track" || m[1] === "episode" ? 152 : 352),
    match: /^https:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)(?:[?#]|$)/, src: (m) => `https://open.spotify.com/embed/${m[1]}/${m[2]}` },
  { provider: "soundcloud", title: "SoundCloud", height: 166, match: /^https:\/\/(?:www\.)?soundcloud\.com\/[\w-]+\/[\w-]+(?:\/sets\/[\w-]+)?(?:[?#]|$)/,
    src: (_m, u) => `https://w.soundcloud.com/player/?url=${enc(u.origin + u.pathname)}&visual=false` },
  { provider: "tiktok", title: "TikTok", aspect: 9 / 16, maxWidth: 340, match: /^https:\/\/(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)(?:[?#]|$)/, src: (m) => `https://www.tiktok.com/embed/v2/${m[1]}` },
  { provider: "x", title: "X (Twitter)", height: 520, maxWidth: 550, match: /^https:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\/\w+\/status\/(\d+)(?:[?#/]|$)/,
    src: (m) => `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}&dnt=true` },
  { provider: "instagram", title: "Instagram", height: 640, maxWidth: 540, match: /^https:\/\/(?:www\.)?instagram\.com\/(p|reel)\/([\w-]+)(?:[?#/]|$)/, src: (m) => `https://www.instagram.com/${m[1]}/${m[2]}/embed` },
  { provider: "facebook", title: "Facebook", aspect: 16 / 9, match: /^https:\/\/(?:www\.)?facebook\.com\/[\w.-]+\/videos\/(?:[\w.-]+\/)?(\d+)(?:[?#/]|$)/,
    src: (_m, u) => `https://www.facebook.com/plugins/video.php?href=${enc(u.origin + u.pathname)}` },
  { provider: "codepen", title: "CodePen", height: 420, match: /^https:\/\/codepen\.io\/([\w-]+)\/(?:pen|full|details)\/(\w+)(?:[?#/]|$)/, src: (m) => `https://codepen.io/${m[1]}/embed/${m[2]}?default-tab=result` },
  { provider: "figma", title: "Figma", aspect: 16 / 9, match: /^https:\/\/(?:www\.)?figma\.com\/(?:file|design|proto|board)\/[\w-]+/,
    src: (_m, u) => `https://www.figma.com/embed?embed_host=cms&url=${enc(u.href)}` },
  { provider: "googlemaps", title: "Google Maps", aspect: 4 / 3, match: /^https:\/\/(?:www\.)?google\.com\/maps\/embed\?pb=[\w!.%-]+$/, src: (_m, u) => u.href },
];

/** Thông tin nhúng của một đường dẫn, hoặc null nếu không thuộc nhà cung cấp nào được hỗ trợ. */
export function embedInfo(raw: unknown): EmbedInfo | null {
  if (typeof raw !== "string" || raw.length > 2048) return null;
  let url: Url;
  try { url = new UrlCtor(raw.trim().replace(/^http:\/\//i, "https://")); } catch { return null; }
  if (url.protocol !== "https:") return null;
  const href = url.href;
  for (const r of RULES) {
    const m = href.match(r.match);
    if (!m) continue;
    const height = typeof r.height === "function" ? r.height(m) : r.height;
    const info: EmbedInfo = { provider: r.provider, title: r.title, src: r.src(m, url) };
    if (r.aspect) info.aspect = r.aspect;
    if (height) info.height = height;
    if (r.maxWidth) info.maxWidth = r.maxWidth;
    return info;
  }
  return null;
}

/** Nhà cung cấp được hỗ trợ (để hiện gợi ý trong trình soạn / tài liệu). */
export const EMBED_PROVIDERS: readonly string[] = RULES.map((r) => r.title);
