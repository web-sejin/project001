"use client";

import { useRef, useState } from "react";
import { PhotoBox } from "@/components/ui/PhotoBox";

export interface Pin {
  id: string;
  x: number;
  y: number;
}

/**
 * 원본 ↔ 보정본 비교.
 * 보정 작업 자체는 라이트룸에서 일어난다. 시스템은 결과를 비교하고 기록만 한다.
 */
export function CompareView({
  photoId,
  label,
  pins,
  onAddPin,
  pinMode,
}: {
  photoId: string;
  label: string;
  pins: Pin[];
  onAddPin: (x: number, y: number) => void;
  pinMode: boolean;
}) {
  const [split, setSplit] = useState(50);
  const frameRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <div
        ref={frameRef}
        onClick={(e) => {
          if (!pinMode || !frameRef.current) return;
          const rect = frameRef.current.getBoundingClientRect();
          onAddPin(
            Math.round(((e.clientX - rect.left) / rect.width) * 100),
            Math.round(((e.clientY - rect.top) / rect.height) * 100),
          );
        }}
        className={`relative select-none ${pinMode ? "cursor-crosshair" : ""}`}
      >
        <PhotoBox id={photoId} label={label} variant="retouched" aspect="3/2" />

        <div className="absolute inset-0 overflow-hidden" style={{ width: `${split}%` }}>
          <div
            className="h-full"
            style={{ width: `${(100 / Math.max(1, split)) * 100}%` }}
          >
            <PhotoBox
              id={photoId}
              label={label}
              variant="raw"
              aspect="3/2"
              className="h-full w-full rounded-r-none"
            />
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 w-px bg-fg/60"
          style={{ left: `${split}%` }}
        />
        <span className="pointer-events-none absolute top-1.5 left-1.5 rounded-box bg-canvas/90 px-1.5 py-0.5 text-badge font-semibold text-fg-muted">
          원본
        </span>
        <span className="pointer-events-none absolute top-1.5 right-1.5 rounded-box bg-canvas/90 px-1.5 py-0.5 text-badge font-semibold text-fg-muted">
          보정본
        </span>

        {pins.map((pin, i) => (
          <span
            key={pin.id}
            className="pointer-events-none absolute flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-danger text-[9px] font-semibold text-white"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          >
            {i + 1}
          </span>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="shrink-0 text-badge text-fg-subtle">비교</span>
        <input
          type="range"
          min={0}
          max={100}
          value={split}
          aria-label="원본 보정본 비교 슬라이더"
          onChange={(e) => setSplit(Number(e.target.value))}
          className="h-1 flex-1 accent-[#6940A5]"
        />
      </div>
    </div>
  );
}
