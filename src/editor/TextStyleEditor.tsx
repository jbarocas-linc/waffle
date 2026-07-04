import { AlignCenter, AlignLeft, AlignRight, Bold, Italic } from "lucide-react";
import type { TextStyle } from "../types";
import { TEXT_BG_COLORS, TEXT_COLORS, textStyleCss, textWrapperCss } from "../lib/textStyle";

const SIZE_OPTIONS: { value: TextStyle["size"]; label: string }[] = [
  { value: "sm", label: "S" },
  { value: "md", label: "M" },
  { value: "lg", label: "L" },
  { value: "xl", label: "XL" },
];

const TRACKING_OPTIONS: { value: TextStyle["tracking"]; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "wide", label: "Wide" },
  { value: "wider", label: "Very wide" },
];

const BG_OPTIONS: { value: TextStyle["bg"]; label: string }[] = [
  { value: "none", label: "None" },
  { value: "scrim", label: "Soft scrim" },
  { value: "solid", label: "Solid" },
];

const segmentCls = (active: boolean) =>
  `flex min-h-[36px] flex-1 items-center justify-center gap-1 rounded-md text-xs font-medium transition-colors ${
    active ? "bg-white shadow-sm" : "text-ink/55 hover:text-ink"
  }`;

/**
 * Expressive text-styling panel shared by text tiles (body) and image tiles
 * (overlay text). The preview at the top reflects every control live.
 */
export function TextStyleEditor({
  value,
  onChange,
  previewText,
}: {
  value: TextStyle;
  onChange: (v: TextStyle) => void;
  previewText: string;
}) {
  const set = (patch: Partial<TextStyle>) => onChange({ ...value, ...patch });

  return (
    <div>
      <div className="mb-3 flex h-32 items-center justify-center overflow-hidden rounded-xl bg-[#3a2f26] p-4">
        <p
          className="line-clamp-3 max-w-full [text-wrap:balance]"
          style={{ ...textStyleCss(value), ...textWrapperCss(value) }}
        >
          {previewText || "Preview text"}
        </p>
      </div>

      <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Size</p>
      <div className="mt-1 flex gap-1 rounded-lg bg-ink/5 p-1">
        {SIZE_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value.size === o.value}
            onClick={() => set({ size: o.value })}
            className={segmentCls(value.size === o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <div className="flex flex-1 gap-1 rounded-lg bg-ink/5 p-1">
          <button
            type="button"
            aria-label="Bold"
            aria-pressed={value.weight === "bold"}
            onClick={() => set({ weight: value.weight === "bold" ? "normal" : "bold" })}
            className={segmentCls(value.weight === "bold")}
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            aria-label="Italic"
            aria-pressed={value.italic}
            onClick={() => set({ italic: !value.italic })}
            className={segmentCls(value.italic)}
          >
            <Italic size={14} />
          </button>
        </div>
        <div className="flex flex-1 gap-1 rounded-lg bg-ink/5 p-1">
          <button
            type="button"
            aria-label="Align left"
            aria-pressed={value.align === "left"}
            onClick={() => set({ align: "left" })}
            className={segmentCls(value.align === "left")}
          >
            <AlignLeft size={14} />
          </button>
          <button
            type="button"
            aria-label="Align center"
            aria-pressed={value.align === "center"}
            onClick={() => set({ align: "center" })}
            className={segmentCls(value.align === "center")}
          >
            <AlignCenter size={14} />
          </button>
          <button
            type="button"
            aria-label="Align right"
            aria-pressed={value.align === "right"}
            onClick={() => set({ align: "right" })}
            className={segmentCls(value.align === "right")}
          >
            <AlignRight size={14} />
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink/50">Color</p>
      <div className="mt-1 grid grid-cols-5 gap-2">
        {TEXT_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-label={c.label}
            title={c.label}
            onClick={() => set({ color: c.value })}
            className={`aspect-square rounded-lg border-2 ${
              value.color === c.value ? "border-accent-deep" : "border-ink/10"
            }`}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink/50">Text background</p>
      <div className="mt-1 flex gap-1 rounded-lg bg-ink/5 p-1">
        {BG_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value.bg === o.value}
            onClick={() => set({ bg: o.value })}
            className={segmentCls(value.bg === o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {value.bg === "solid" && (
        <div className="mt-2 flex gap-2">
          {TEXT_BG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Text background color ${c}`}
              onClick={() => set({ bgColor: c })}
              className={`h-8 w-8 rounded-lg border-2 ${
                value.bgColor === c ? "border-accent-deep" : "border-ink/10"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink/50">Letter spacing</p>
      <div className="mt-1 flex gap-1 rounded-lg bg-ink/5 p-1">
        {TRACKING_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value.tracking === o.value}
            onClick={() => set({ tracking: o.value })}
            className={segmentCls(value.tracking === o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
