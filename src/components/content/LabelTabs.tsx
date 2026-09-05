"use client";

import { UNCLASSIFIED } from "@/lib/photoLabel";
import type { ShotItem } from "@/data/types";

export interface LabelTab {
  label: string;
  current: number;
  required: number | null;
  ok: boolean;
}

/**
 * 분류 탭.
 *
 * 이 숙소가 찍어야 하는 공간을 전부 늘어놓고 각각 몇 장 들어왔는지 보여준다.
 * 사진이 하나도 없는 항목이야말로 봐야 할 것이라, 없는 탭도 감추지 않는다.
 */
export function buildLabelTabs(
  shotList: ShotItem[],
  counts: Record<string, number>,
): LabelTab[] {
  const tabs: LabelTab[] = shotList.map((s) => ({
    label: s.label,
    current: counts[s.label] ?? 0,
    required: s.isRequired ? s.minCount : null,
    ok: (counts[s.label] ?? 0) >= s.minCount,
  }));

  if (counts[UNCLASSIFIED]) {
    tabs.push({
      label: UNCLASSIFIED,
      current: counts[UNCLASSIFIED],
      required: null,
      ok: false,
    });
  }
  return tabs;
}

export function LabelTabs({
  tabs,
  total,
  active,
  onChange,
}: {
  tabs: LabelTab[];
  total: number;
  active: string;
  onChange: (label: string) => void;
}) {
  return (
    <div className="thin-scroll flex flex-wrap gap-1">
      <button
        type="button"
        onClick={() => onChange("전체")}
        className={`shrink-0 rounded-box border px-2 py-1 text-badge ${
          active === "전체"
            ? "border-fg bg-surface font-semibold text-fg"
            : "border-line-strong text-fg-muted hover:text-fg"
        }`}
      >
        전체 <span className="tnum">{total}</span>
      </button>

      {tabs.map((t) => {
        const isActive = active === t.label;
        const unclassified = t.label === UNCLASSIFIED;
        const tone = unclassified
          ? "border-warn text-warn"
          : t.ok
            ? "border-line-strong text-fg-muted"
            : "border-[#EFC2C1] text-danger";
        return (
          <button
            key={t.label}
            type="button"
            onClick={() => onChange(t.label)}
            className={`shrink-0 rounded-box border px-2 py-1 text-badge ${
              isActive ? "bg-surface font-semibold" : "hover:bg-surface"
            } ${isActive && !unclassified && !t.ok ? "border-danger text-danger" : tone}`}
          >
            {t.label}{" "}
            <span className="tnum">
              {t.current}
              {t.required !== null ? `/${t.required}` : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
