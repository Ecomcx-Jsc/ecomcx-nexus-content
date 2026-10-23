/**
 * Kiểu dáng của khối (`attrs.style`, mọi khối): khoảng cách, cỡ chữ, màu, viền, ẩn theo khổ màn hình.
 * Giá trị theo khổ: `{ base, tablet, mobile }` (tablet ≤ 1024px, mobile ≤ 640px). Giá trị là preset của theme
 * (`lg`, `primary` → biến CSS `--ecx-spacing-lg`, `--ecx-color-primary`) hoặc giá trị CSS đã kiểm (độ dài, màu).
 * Chỉ nhận giá trị trong danh sách → không chèn được CSS tuỳ ý. Máy chủ chạy cùng quy tắc (ContentFormat.cs).
 */
export declare const BREAKPOINTS: {
    readonly tablet: 1024;
    readonly mobile: 640;
};
export declare const DEVICES: readonly ["base", "tablet", "mobile"];
export type Device = (typeof DEVICES)[number];
export type Responsive<T> = Partial<Record<Device, T>>;
export type Box = string | Partial<Record<"top" | "right" | "bottom" | "left", string>>;
export interface BlockStyle {
    padding?: Responsive<Box>;
    margin?: Responsive<Box>;
    gap?: Responsive<string>;
    width?: Responsive<string>;
    maxWidth?: Responsive<string>;
    minHeight?: Responsive<string>;
    fontFamily?: string;
    fontSize?: Responsive<string>;
    lineHeight?: Responsive<number>;
    letterSpacing?: Responsive<string>;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    textTransform?: string;
    textAlign?: Responsive<string>;
    color?: {
        text?: string;
        background?: string;
    };
    border?: {
        width?: string;
        style?: string;
        color?: string;
    };
    radius?: string;
    hide?: Array<"desktop" | "tablet" | "mobile">;
}
/** Chuẩn hoá `attrs.style`: giữ đúng thứ tự khoá, bỏ giá trị không hợp lệ. Rỗng → undefined. */
export declare function normalizeStyle(v: unknown): BlockStyle | undefined;
/** Độ dài / preset khoảng cách hợp lệ → giá trị CSS (preset thành biến); không hợp lệ → undefined. Dùng cho thuộc tính khối như chiều cao khoảng trống. */
export declare function spacingValue(v: unknown): string | undefined;
/** Màu hợp lệ (hex/rgb/hsl hoặc preset) → giá trị CSS; không hợp lệ → undefined. */
export declare function colorCss(v: unknown): string | undefined;
/** Tên class ổn định theo nội dung style (cùng kiểu dáng → cùng class). */
export declare function styleClass(style: BlockStyle): string;
/** CSS của một kiểu dáng: `.cls.cls{…}` + media query cho tablet / mobile + ẩn theo khổ. Rỗng → "". */
export declare function styleCss(style: BlockStyle, cls?: string): string;
/** Gom CSS cho cả một cây nội dung: trả về css (mỗi class một lần) — website và trình soạn dùng chung. */
export declare function collectStyles(styles: Iterable<BlockStyle>): string;
/** Biến thể kiểu (`blockStyle`): tên preset → class `ecx-is-<tên>`. */
export declare function normalizeBlockStyleName(v: unknown): string | undefined;
/** Neo (`anchor`) → id của phần tử. */
export declare function normalizeAnchor(v: unknown): string | undefined;
/** Class CSS riêng (`className`): tối đa 5 class hợp lệ, cách nhau bởi dấu cách. */
export declare function normalizeClassName(v: unknown): string | undefined;
/** Biến thể có sẵn của lõi (CSS trong style.css); theme thêm bằng theme.json › blockStyles. */
export declare const CORE_BLOCK_STYLES: Record<string, string[]>;
export interface StylePresets {
    colors?: Record<string, string>;
    fontSizes?: Record<string, string>;
    spacing?: Record<string, string>;
    fonts?: Record<string, string>;
}
/** Chuẩn hoá preset: tên preset hợp lệ, giá trị đã kiểm (màu hex/rgb/hsl, độ dài hoặc clamp(), danh sách phông không có ; { }). */
export declare function normalizePresets(v: unknown): StylePresets;
/** Gộp preset theo thứ tự (sau đè trước): theme → bản sửa của quản trị viên. */
export declare function mergePresets(...list: unknown[]): StylePresets;
/** Biến CSS của preset: `--ecx-color-*`, `--ecx-font-size-*`, `--ecx-spacing-*`, `--ecx-font-family-*`. */
export declare function presetCss(presets: unknown, selector?: string): string;
