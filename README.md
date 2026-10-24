# @ecomcx/ecomweb-content — định dạng nội dung của CMS

Chuẩn lưu nội dung bài viết/trang của CMS, **không phụ thuộc trình soạn**. Trình soạn (hiện là TipTap/ProseMirror trong `@ecomcx/ecomweb-editor`) chuyển sang chuẩn này; website (`@ecomcx/ecomweb-theme-sdk`) và máy chủ (`ContentFormat.cs`) chỉ đọc chuẩn này. Đổi hay thay trình soạn không đổi dữ liệu đã lưu, website vẫn chạy.

CMS lưu **dữ liệu**, HTML vẽ lúc hiển thị → theme đổi giao diện khối thì bài cũ tự theo, không có HTML cũ lệch với mã mới.

## Định dạng (bản 1)

```jsonc
{
  "version": 1,
  "blocks": [
    { "id": "main", "type": "richtext", "data": { "type": "doc", "content": [ /* RichNode */ ] } },
    { "id": "b2", "type": "html", "data": { "html": "<p>nội dung nhập từ hệ thống cũ</p>" } },
    { "id": "b3", "type": "ecommerce/products", "data": { "ids": [1, 2] } }   // khối của plugin
  ]
}
```

**RichNode** — cây nội dung soạn thảo:

```jsonc
{ "type": "paragraph", "attrs": { "textAlign": "center" }, "content": [
  { "type": "text", "text": "Xin chào ", "marks": [{ "type": "bold" }] },
  { "type": "text", "text": "liên kết", "marks": [{ "type": "link", "attrs": { "href": "https://…" } }] }
] }
```

- Khối lõi và thuộc tính: `CORE_NODES`, `CORE_MARKS` trong `src/schema.ts` (1.9: mục lục `tableOfContents`, ảnh bìa `cover`, nhiều nút `buttons` > `button`, khoảng trống `spacer`, ảnh + chữ `mediaText`, trích dẫn nổi bật `pullquote`, chi tiết `details`, HTML tuỳ chỉnh `customHtml` (máy chủ lọc khi người soạn thiếu quyền `unfiltered_html`), mạng xã hội `socialLinks`, văn bản định dạng sẵn `preformatted`; đoạn, tiêu đề, danh sách, danh sách việc, trích dẫn, mã, ảnh, bộ ảnh, video, âm thanh, tệp, bảng, YouTube; từ 1.2: cột `columns` > `column`, nhóm `group`, hộp lưu ý `callout`, nút `button`, nhúng `embed`; đậm, nghiêng, gạch chân, gạch ngang, mã, chỉ số trên/dưới, tô nền, màu chữ, liên kết).
- `null` = không có: thuộc tính null không được lưu. Thuộc tính khối lõi sai kiểu được ép (`"3"` → `3`, kẹp min/max) hoặc bỏ.
- **Khối / nút lạ được giữ nguyên** (khối của plugin, kể cả khi plugin đã tắt) — website bỏ qua khối không có renderer, nút lạ trong nội dung soạn thảo vẫn hiện phần chữ bên trong.
- Giới hạn: lồng tối đa 64 cấp, tối đa 100 000 nút một bài.
- `version` tăng khi đổi cấu trúc, kèm hàm nâng cấp (`src/migrate.ts`) — bài lưu bằng bản cũ được nâng khi đọc.

## Khối động (1.6)

Khối không chứa chữ cố định — lấy dữ liệu lúc hiển thị theo ngữ cảnh (dùng trong template của theme / Trình dựng, hoặc trang dựng bằng khối). Danh sách: `DYNAMIC_NODES`.

| Nhóm | Khối | Thuộc tính |
|---|---|---|
| Website | `siteTitle`, `siteLogo`, `siteTagline`, `navigation`, `search`, `languageSwitcher`, `copyright` | `level`, `link`, `width`, `location` (vị trí menu), `orientation`, `mobile`, `placeholder`, `buttonText`, `text`, `textAlign` |
| Bài / trang đang xem (hoặc bài trong vòng lặp) | `postTitle`, `postContent`, `postExcerpt`, `featuredImage`, `postDate`, `postAuthor`, `postTerms`, `comments` | `level`, `link`, `moreText`, `size`, `aspect`, `avatar`, `taxonomy`, `separator` |
| Danh sách bài | `query` > `postTemplate` (khuôn lặp cho từng bài) + `pagination` + `queryEmpty` | `inherit` (dùng danh sách của trang đang xem), `postType`, `perPage`, `category`, `tag`, `orderBy`, `order`; `layout` (`list`/`grid`), `columns` |
| Ghép | `templatePart` | `slug` (vd `header`, `footer`), `tagName` |
| Mẫu đồng bộ | `syncedPattern` | `ref` (id của mẫu — sửa mẫu gốc thì mọi chỗ dùng đổi theo) |

## Kiểu dáng khối (1.7) — `attrs.style`

Mọi khối (lõi và plugin) có thể mang `attrs.style`:

```jsonc
"style": {
  "padding": { "base": "xl", "tablet": "lg", "mobile": { "top": "md", "bottom": "md" } },   // tablet ≤ 1024px, mobile ≤ 640px
  "margin": { "base": "auto" }, "gap": { "base": "lg" }, "width": { "base": "100%" }, "maxWidth": { "base": "640px" },
  "minHeight": { "base": "60vh" }, "fontFamily": "heading",
  "fontSize": { "base": "3xl", "mobile": "2xl" }, "lineHeight": { "base": 1.2 }, "letterSpacing": { "base": "0.05em" },
  "fontWeight": "700", "fontStyle": "italic", "textDecoration": "underline", "textTransform": "uppercase", "textAlign": { "base": "center" },
  "color": { "text": "white", "background": "#0f172a" }, "border": { "width": "1px", "style": "dashed", "color": "primary" }, "radius": "12px",
  "hide": ["mobile"]
}
```

- Giá trị: preset của theme (`lg`, `2xl`, `primary` → `var(--ecx-spacing-lg)`, `var(--ecx-font-size-2xl)`, `var(--ecx-color-primary, primary)`) hoặc giá trị CSS đã kiểm (độ dài `px|rem|em|%|vw|vh`, `0`, `auto`, màu hex/rgb/hsl). Giá trị khác bị bỏ khi chuẩn hoá → không chèn được CSS.
- Một giá trị gọn (`"padding": "lg"`) được chuẩn hoá thành `{ "base": "lg" }`.
- `styleClass(style)` → class ổn định (`ecx-s-…`), `styleCss(style)` → CSS (`.cls.cls{…}` + media query), `collectStyles([...])` gom CSS cả trang. Website và trình soạn dùng chung.
- `fontFamily` chỉ nhận tên preset (`body`, `heading`, `mono`… → `var(--ecx-font-family-heading, inherit)`), theme khai báo phông.
- Preset mặc định nằm trong `style.css` (`--ecx-spacing-xs…3xl`, `--ecx-font-size-xs…4xl`, `--ecx-color-primary|muted|surface|white|black`); theme đặt lại biến để đổi.

## Biến thể kiểu, neo, class riêng (1.10)

Mọi khối có thể mang `attrs.blockStyle` (tên biến thể → class `ecx-is-<tên>`), `attrs.anchor` (id để làm neo, vd `#bang-gia`), `attrs.className` (tối đa 5 class CSS hợp lệ). Biến thể có sẵn của lõi (`CORE_BLOCK_STYLES`, CSS trong `style.css`): bảng `stripes`; ảnh `rounded`, `circle`; trích dẫn `plain`; đường kẻ `dots`, `wide`; nút `pill`; nhóm `card`. Theme thêm biến thể bằng `theme.json › blockStyles` và CSS `.ecx-is-<tên>`.

## Preset toàn site (1.10)

`theme.json › styles` (`colors`, `fontSizes`, `spacing`, `fonts`) + bản sửa của quản trị viên → `mergePresets(theme, user)` → `presetCss()` sinh `:root{--ecx-color-*;--ecx-font-size-*;--ecx-spacing-*;--ecx-font-family-*}`. Giá trị được kiểm: màu hex/rgb/hsl, độ dài hoặc `clamp()`, danh sách phông không có `; { }`.

## Nhúng theo đường dẫn — `embedInfo`

Khối `embed` chỉ lưu `url` (+ `caption`). `embedInfo(url)` nhận ra nhà cung cấp trong danh sách (YouTube, Vimeo, Loom, Spotify, SoundCloud, TikTok, X, Instagram, Facebook video, CodePen, Figma, Google Maps dạng embed) và **tự dựng** địa chỉ khung từ mã trong đường dẫn — không dùng HTML nhúng do người dùng dán, nên bài viết không chèn được khung tới trang tuỳ ý. Không nhận ra → `null`, website hiện liên kết thường. Trình soạn (xem trước) và website dùng chung hàm này.

## Cài

```bash
npm install github:Ecomcx-Jsc/ecomweb-content#semver:^1
```

```json
"dependencies": { "@ecomcx/ecomweb-content": "github:Ecomcx-Jsc/ecomweb-content#semver:^1" }
```

`#semver:^1` = mọi bản 1.x (tag `v1.*`): `npm update @ecomcx/ecomweb-content` lấy bản mới nhất, bản 2.0 (đổi làm vỡ API) phải chủ động đổi. `package-lock.json` ghi đúng commit đã cài. `dist/` được commit sẵn trong repo (npm 11 bỏ qua `prepare` của gói GitHub khi cài với `--ignore-scripts` — Builder của CMS cài như vậy). Không phụ thuộc thư viện nào lúc chạy — dùng được trong trình duyệt, Node, Next.js, công cụ dòng lệnh.

## Dùng

```ts
import { normalizeContent, contentText, wordCount, isSafeUrl } from "@ecomcx/ecomweb-content";

const { doc, issues } = normalizeContent(input);   // {version, blocks}, cây TipTap thuần hoặc chuỗi HTML
contentText(doc);                                  // chữ thuần (tìm kiếm, tóm tắt)
```

## Giao diện nền — `style.css`

```ts
import "@ecomcx/ecomweb-content/style.css";
```

CSS tối thiểu cho nội dung nằm trong phần tử có class `ecx-content` (bảng có viền, danh sách, trích dẫn, mã, ảnh, chú thích, khung nhúng, khối bố cục) và form `ecx-form`. Website (`PostContent`) và trình soạn (`@ecomcx/ecomweb-editor`) cùng nạp file này → theme không viết CSS cho nội dung vẫn hiển thị đúng, trình soạn và website giống nhau.

- Nằm trong `@layer ecx-content`, mọi selector trong `:where()` → CSS của theme luôn thắng, kể cả CSS có layer (Tailwind). Nạp file này **trước** CSS của theme. Ứng dụng có sẵn layer (vd Tailwind trong admin) mà muốn nền thắng reset của mình thì khai báo `@layer ecx-content;` sau các layer đó.
- Đổi màu bằng biến: `--ecx-border`, `--ecx-muted`, `--ecx-accent` (mặc định `--primary`), `--ecx-surface`, `--ecx-code-bg`, `--ecx-code-fg`, `--ecx-button-bg`, `--ecx-button-fg`. Không đặt thì màu suy ra từ màu chữ (`currentColor`) → hợp cả nền sáng lẫn tối.
- Class của khối có tiền tố `ecx-` (`ecx-table`, `ecx-columns`, `ecx-callout`, `ecx-button`, `ecx-embed`, `ecx-align-left`…). Website vẫn xuất kèm class cũ `cms-*` / `table-wrap` / `alignleft` tới bản 2.0.
- `ecx-full-width` (template trang "full-width" của theme-sdk): trải hết chiều ngang màn hình dù nằm trong khung giới hạn của theme.

## Khối của plugin — `defineBlock`

Khai báo một lần, dùng ở cả trình soạn (admin) lẫn website — đặt trong file dùng chung của plugin: Tên khối luôn có dạng `slug-plugin/tên` — tên không có `/` dành cho khối lõi (khối lõi mới có thể được thêm ở bản 1.x).

```ts
// blocks.ts
import { defineBlock } from "@ecomcx/ecomweb-content";
export const callout = defineBlock({
  name: "lien-he/callout", title: "Hộp lưu ý", icon: "info", keywords: "luu y callout", content: "blocks",
  attributes: {
    tone: { type: "string", enum: ["info", "warning"], enumLabels: ["Thông tin", "Cảnh báo"], default: "info", label: "Kiểu" },
    title: { type: "string", label: "Tiêu đề" },
  },
});
```

- Admin (`@ecomcx/ecomweb-admin-sdk`): `registerBlock(callout)` → trình soạn tự có mục slash menu, khung khối, form cài đặt sinh từ `attributes` (không viết TipTap).
- Website (`@ecomcx/ecomweb-theme-sdk`): `definePlugin({ blocks: { [callout.name]: Callout }, blockTypes: [callout] })` — `Callout` nhận `data` (thuộc tính đã chuẩn hoá) và `children` (nội dung bên trong).
- `content`: `"none"` (khối nguyên), `"inline"` (một dòng chữ), `"blocks"` (chứa khối khác).
- Đổi cấu trúc thuộc tính: tăng `version`, thêm `migrate[bản-cũ]` — bài đã lưu được nâng khi đọc (lưu kèm `_v`). Migrate lỗi → giữ nguyên dữ liệu.
- Plugin tắt / gỡ: dữ liệu khối nằm nguyên trong bài; website hiện phần chữ bên trong (nếu có), bật lại là hiện như cũ.

## Hợp đồng

`fixtures/*.json` — mỗi file `{ name, note, input, expected }`. Ba bên cùng chạy bộ này:

| Bên | Test |
|---|---|
| `@ecomcx/ecomweb-content` | `normalizeContent(input) == expected`, chuẩn hoá lần hai không đổi |
| Máy chủ (core) | `ContentFormatTests` — cùng fixture (bản chép ở `backend/tests/Cms.Tests/ContentFixtures/` của repo core) |
| Website (`@ecomcx/ecomweb-theme-sdk`) | vẽ mỗi fixture ra đúng HTML đã duyệt (`test/snapshots/`) |
| Trình soạn (`@ecomcx/ecomweb-editor`) | mở fixture rồi xuất lại → chuẩn hoá ra đúng `expected` |

Đổi quy tắc: sửa `src/` + `ContentFormat.cs` + fixture cùng lúc. Thay trình soạn: chỉ cần qua bộ test của trình soạn.

## Phát triển

```bash
npm install
npm test        # biên dịch + node --test
npm run build   # dist/ — commit cùng src/ (npm test báo lỗi nếu dist/ cũ)
```

Phát hành: tăng `version` (MAJOR.MINOR.PATCH — chỉ tăng MAJOR khi làm vỡ API), commit, `git tag vX.Y.Z && git push --tags`; bên dùng chạy `npm update @ecomcx/ecomweb-content`.
