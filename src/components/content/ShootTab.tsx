"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AxHighlight } from "@/components/AxNote";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import type { ContentAnalysis } from "@/data/analysis";
import type { Accommodation, Content, ShotItem } from "@/data/types";

export function ShootTab({
  content,
  acc,
  analysis,
}: {
  content: Content;
  acc: Accommodation;
  analysis: ContentAnalysis;
}) {
  const [excluded, setExcluded] = useState<string[]>(analysis.excludedShotLabels);
  const [extra, setExtra] = useState<ShotItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftCount, setDraftCount] = useState("2");

  const rows = useMemo(
    () =>
      [...analysis.shotList, ...extra].map((s) => ({
        ...s,
        current: analysis.shotCounts[s.label] ?? 0,
      })),
    [analysis, extra],
  );

  const active = rows.filter((r) => !excluded.includes(r.label) && r.isRequired);
  const met = active.filter((r) => r.current >= r.minCount).length;

  const addItem = () => {
    const label = draftLabel.trim();
    const n = Number(draftCount);
    if (!label || !Number.isFinite(n) || n <= 0) return;
    setExtra((prev) => [
      ...prev,
      {
        id: `${acc.id}-manual-${prev.length + 1}`,
        facilityId: "manual",
        label,
        minCount: n,
        isRequired: true,
        derivedFrom: "이 촬영 건만의 예외",
      },
    ]);
    setDraftLabel("");
    setDraftCount("2");
    setAdding(false);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <AxHighlight id="ax-01">
        <Panel>
          <PanelHeader
            title="촬영 필수 컷 체크리스트"
            description="숙소가 보유한 시설에서 전개된 목록입니다. 이 건만의 예외는 추가·제외할 수 있습니다."
            right={
              <Badge variant={met === active.length ? "success" : "outline"}>
                <span className="tnum">
                  {met}/{active.length}
                </span>
                {" 충족"}
              </Badge>
            }
          />

          <ul className="divide-y divide-line">
            {rows.map((row) => {
              const isExcluded = excluded.includes(row.label);
              const ok = row.current >= row.minCount;
              return (
                <li
                  key={row.id}
                  className={`flex items-center gap-3 px-4 py-2 ${
                    isExcluded ? "bg-surface/60" : ""
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-box border text-[10px] leading-none ${
                      isExcluded
                        ? "border-line text-fg-subtle"
                        : ok
                          ? "border-[#B9D9D3] bg-[#E8F2F0] text-success"
                          : "border-[#EFC2C1] bg-[#FBEAEA] text-danger"
                    }`}
                  >
                    {isExcluded ? "–" : ok ? "✓" : "✗"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-body font-medium ${
                          isExcluded ? "text-fg-subtle line-through" : "text-fg"
                        }`}
                      >
                        {row.label}
                      </span>
                      {!row.isRequired ? <Badge variant="neutral">권장</Badge> : null}
                    </div>
                    <p className="mt-px text-badge text-fg-subtle">{row.derivedFrom}</p>
                  </div>

                  <span
                    className={`tnum shrink-0 text-body ${
                      isExcluded
                        ? "text-fg-subtle"
                        : ok
                          ? "text-fg-muted"
                          : "font-semibold text-danger"
                    }`}
                  >
                    {row.current} / {row.minCount}
                  </span>

                  <Button
                    size="sm"
                    variant="quiet"
                    onClick={() =>
                      setExcluded((prev) =>
                        isExcluded
                          ? prev.filter((l) => l !== row.label)
                          : [...prev, row.label],
                      )
                    }
                  >
                    {isExcluded ? "복구" : "제외"}
                  </Button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-line px-4 py-2">
            {adding ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  autoFocus
                  value={draftLabel}
                  onChange={(e) => setDraftLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addItem()}
                  placeholder="항목명 (예: 루프탑 스파)"
                  className="min-w-0 flex-1 rounded-box border border-line-strong px-2 py-1 text-body outline-none focus:border-ai"
                />
                <input
                  value={draftCount}
                  onChange={(e) => setDraftCount(e.target.value)}
                  inputMode="numeric"
                  aria-label="필요 장수"
                  className="tnum w-16 rounded-box border border-line-strong px-2 py-1 text-right text-body outline-none focus:border-ai"
                />
                <Button size="sm" onClick={addItem}>
                  추가
                </Button>
                <Button size="sm" variant="quiet" onClick={() => setAdding(false)}>
                  취소
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="quiet" onClick={() => setAdding(true)}>
                + 항목 추가
              </Button>
            )}
          </div>
        </Panel>
        </AxHighlight>
      </div>

      <Panel>
        <PanelHeader title="촬영 정보" />
        <dl className="divide-y divide-line text-body">
          <Field label="숙소" value={acc.name} />
          <Field label="유형" value={acc.type} />
          <Field label="주소" value={acc.address} />
          <Field label="객실 수" value={`${acc.roomCount}개`} />
          <Field label="촬영일" value={content.shootDate} />
          <Field label="작가" value={content.photographer} />
          <Field
            label="재촬영"
            value={
              content.reshootCount > 0 ? (
                <span className="text-danger">{content.reshootCount}회 발생</span>
              ) : (
                "없음"
              )
            }
          />
        </dl>
      </Panel>
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-2">
      <dt className="w-16 shrink-0 text-fg-subtle">{label}</dt>
      <dd className="min-w-0 flex-1 text-fg">{value}</dd>
    </div>
  );
}
