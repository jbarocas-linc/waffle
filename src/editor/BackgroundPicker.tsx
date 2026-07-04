import { useState } from "react";
import type { Background } from "../types";
import { TILE_COLORS, TILE_GRADIENTS } from "../lib/palette";
import { bgStyle } from "../lib/format";
import { UploadField } from "./UploadField";

export function BackgroundPicker({
  value,
  onChange,
  gridId,
}: {
  value: Background;
  onChange: (bg: Background) => void;
  gridId: string;
}) {
  const [tab, setTab] = useState<"color" | "gradient" | "image">(value.kind);

  return (
    <div>
      <div className="flex gap-1 rounded-lg bg-ink/5 p-1 text-sm font-medium">
        {(["color", "gradient", "image"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`min-h-[36px] flex-1 rounded-md capitalize transition-colors ${
              tab === t ? "bg-white shadow-sm" : "text-ink/55 hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "color" && (
        <div className="mt-3 grid grid-cols-8 gap-2">
          {TILE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Background color ${c}`}
              onClick={() => onChange({ kind: "color", value: c })}
              className={`aspect-square rounded-lg border-2 ${
                value.kind === "color" && value.value === c ? "border-accent" : "border-ink/10"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      {tab === "gradient" && (
        <div className="mt-3 grid grid-cols-6 gap-2">
          {TILE_GRADIENTS.map((g, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Background gradient ${i + 1}`}
              onClick={() => onChange({ kind: "gradient", ...g })}
              className={`aspect-square rounded-lg border-2 ${
                value.kind === "gradient" && value.from === g.from ? "border-accent" : "border-ink/10"
              }`}
              style={bgStyle({ kind: "gradient", ...g })}
            />
          ))}
        </div>
      )}

      {tab === "image" && (
        <div className="mt-3">
          {value.kind === "image" && (
            <div className="mb-3 h-24 rounded-xl" style={bgStyle(value)}>
              <div
                className="h-full w-full rounded-xl"
                style={{ backgroundColor: `rgba(0,0,0,${value.dim ?? 0.4})` }}
              />
            </div>
          )}
          <UploadField
            accept="image/*"
            gridId={gridId}
            label={value.kind === "image" ? "Replace image" : "Upload a background image"}
            onUploaded={(src) =>
              onChange({ kind: "image", src, dim: value.kind === "image" ? value.dim ?? 0.4 : 0.4 })
            }
          />
          {value.kind === "image" && (
            <label className="mt-3 block text-sm font-medium">
              Darken for legibility
              <input
                type="range"
                min={0}
                max={0.8}
                step={0.05}
                value={value.dim ?? 0.4}
                onChange={(e) => onChange({ ...value, dim: Number(e.target.value) })}
                className="mt-1 w-full accent-[#A9690F]"
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
