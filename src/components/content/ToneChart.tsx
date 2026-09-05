"use client";

import { Badge } from "@/components/ui/Badge";
import type { Photo } from "@/data/types";

/**
 * 보정 톤 일관성.
 *
 * 리터처가 여러 명이면 같은 숙소 사진의 색온도가 갈린다. 실무 고질병이다.
 * 측정은 RGB 평균 비교 — 순수 연산이지 AI가 아니다.
 */
export function ToneChart({ photos }: { photos: Photo[] }) {
  const points = photos.filter((p) => p.selected && p.retoucher);
  if (points.length === 0) return null;

  const temps = points.map((p) => p.colorTempK).sort((a, b) => a - b);
  const median = temps[Math.floor(temps.length / 2)];
  const outliers = points.filter((p) => Math.abs(p.colorTempK - median) > 260);

  const minT = 5300;
  const maxT = 6500;
  const retouchers = Array.from(new Set(points.map((p) => p.retoucher as string)));

  const byRetoucher = retouchers.map((r) => {
    const list = points.filter((p) => p.retoucher === r);
    return {
      retoucher: r,
      count: list.length,
      avg: Math.round(list.reduce((s, p) => s + p.colorTempK, 0) / list.length),
    };
  });

  const spread =
    byRetoucher.length > 1 ? Math.abs(byRetoucher[0].avg - byRetoucher[1].avg) : 0;

  return (
    <div>
      <div className="relative h-28 rounded-box border border-line bg-surface">
        <div
          className="absolute inset-y-0 w-px bg-line-strong"
          style={{ left: `${((median - minT) / (maxT - minT)) * 100}%` }}
        />
        {points.map((p) => {
          const x = ((p.colorTempK - minT) / (maxT - minT)) * 100;
          const y = 100 - ((p.brightness - 0.3) / 0.3) * 100;
          const isOut = Math.abs(p.colorTempK - median) > 260;
          const second = retouchers.length > 1 && p.retoucher === retouchers[1];
          return (
            <span
              key={p.id}
              title={`${p.aiLabel} · ${p.colorTempK}K · ${p.retoucher}`}
              className={`absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 ${
                second ? "" : "rounded-full"
              } ${isOut ? "bg-warn" : "bg-fg-subtle"}`}
              style={{
                left: `${Math.min(98, Math.max(2, x))}%`,
                top: `${Math.min(94, Math.max(6, y))}%`,
              }}
            />
          );
        })}
        <span className="tnum absolute bottom-1 left-2 text-badge text-fg-subtle">
          {minT}K
        </span>
        <span className="tnum absolute right-2 bottom-1 text-badge text-fg-subtle">
          {maxT}K
        </span>
      </div>

      <div className="mt-2 space-y-1.5">
        {byRetoucher.map((r, i) => (
          <div key={r.retoucher} className="flex items-center gap-2 text-body">
            <span
              aria-hidden
              className={`h-1.5 w-1.5 bg-fg-subtle ${i === 1 ? "" : "rounded-full"}`}
            />
            <span className="text-fg">{r.retoucher}</span>
            <span className="tnum text-fg-muted">{r.count}장</span>
            <span className="tnum text-fg-muted">평균 {r.avg}K</span>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {outliers.length > 0 ? (
          <Badge variant="warn">튀는 컷 {outliers.length}장</Badge>
        ) : (
          <Badge variant="success">편차 정상 범위</Badge>
        )}
        {spread > 300 ? (
          <Badge variant="warn">
            리터처 간 <span className="tnum">{spread}K</span> 차이
          </Badge>
        ) : null}
      </div>

      {spread > 300 ? (
        <p className="mt-2 text-badge leading-[18px] text-fg-muted">
          두 리터처의 톤 기준이 다릅니다. 발행 세트에 섞이면 상세페이지에서 바로 티가
          납니다.
        </p>
      ) : null}
    </div>
  );
}
