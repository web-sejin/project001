"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Explain, PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Panel, PanelHeader, PanelNote } from "@/components/ui/Panel";
import { generateShotList } from "@/data/facilities";
import { useStore } from "@/store/MockStore";
import type { ShotRule } from "@/data/types";

export default function FacilitiesPage() {
  const store = useStore();
  const [selectedId, setSelectedId] = useState<string>(store.facilities[0]?.id ?? "");
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");

  // 규칙을 바꿨을 때 체크리스트가 어떻게 달라지는지 바로 보여주는 미리보기용 가상 숙소
  const [previewRooms, setPreviewRooms] = useState(3);
  const [previewFacilityIds, setPreviewFacilityIds] = useState<string[]>([
    "f-pool",
    "f-breakfast",
    "f-bbq",
  ]);

  const selected = store.facilities.find((f) => f.id === selectedId) ?? null;
  const selectable = store.facilities.filter((f) => f.scope === "선택");

  const preview = useMemo(
    () => generateShotList(store.facilities, previewRooms, previewFacilityIds),
    [store.facilities, previewRooms, previewFacilityIds],
  );
  const previewCuts = preview.reduce((s, i) => s + i.minCount, 0);

  const patchRule = (index: number, patch: Partial<ShotRule>) => {
    if (!selected) return;
    const rules = selected.rules.map((r, i) => (i === index ? { ...r, ...patch } : r));
    store.updateFacility(selected.id, { rules });
  };

  const addRule = () => {
    if (!selected) return;
    store.updateFacility(selected.id, {
      rules: [...selected.rules, { label: "새 컷", minCount: 2 }],
    });
  };

  const removeRule = (index: number) => {
    if (!selected) return;
    store.updateFacility(selected.id, {
      rules: selected.rules.filter((_, i) => i !== index),
    });
  };

  const createFacility = () => {
    const label = draftName.trim();
    if (!label) return;
    const created = store.addFacility({
      label,
      scope: "선택",
      description: "숙소가 이 시설을 보유하면 아래 컷이 체크리스트에 추가됩니다.",
      rules: [{ label, minCount: 2 }],
    });
    setSelectedId(created.id);
    setDraftName("");
    setCreating(false);
  };

  return (
    <div>
      <PageHeader
        title="시설 관리"
        purpose="촬영 필수 컷 규칙을 정의하는 화면입니다. 여기서 정한 규칙이 숙소 등록 시 선택지가 되고, 숙소가 보유한 시설에 맞춰 촬영 체크리스트가 자동으로 만들어집니다."
        right={
          <Badge variant="neutral">
            시설 <span className="tnum">{store.facilities.length}</span>항목
          </Badge>
        }
      />

      <div className="space-y-4 p-4 lg:p-6">
        <Explain label="등록 순서">
          <strong className="font-semibold text-fg">1. 시설 관리</strong>에서 규칙을
          정의합니다 →{" "}
          <Link href="/accommodations" className="underline underline-offset-2">
            2. 숙소 관리
          </Link>
          에서 숙소가 보유한 시설을 고릅니다 → 같은 화면에서 3. 촬영 일정을 등록하면
          현황판과 캘린더에 나타납니다. 시설 규칙을 한 번 고치면 그 시설을 가진 모든
          숙소의 체크리스트가 같이 바뀝니다.
        </Explain>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Panel>
            <PanelHeader
              title="시설 항목"
              description="행을 클릭하면 오른쪽에서 컷 규칙을 수정할 수 있습니다."
              right={
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="rounded-box border border-line-strong bg-canvas px-2 py-1 text-badge font-semibold text-fg hover:bg-surface"
                >
                  + 시설 추가
                </button>
              }
            />

            {creating ? (
              <div className="flex flex-wrap items-center gap-2 border-b border-line bg-ai-bg px-4 py-2.5">
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createFacility()}
                  placeholder="시설명 (예: 루프탑 라운지)"
                  className="min-w-0 flex-1 rounded-box border border-line-strong bg-canvas px-2 py-1 text-body outline-none focus:border-fg-subtle"
                />
                <button
                  type="button"
                  onClick={createFacility}
                  className="rounded-box border border-line-strong bg-canvas px-2 py-1 text-body font-semibold text-fg"
                >
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="px-1 text-body text-fg-muted"
                >
                  취소
                </button>
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-body">
                <thead>
                  <tr className="bg-surface text-left">
                    <Th>시설 항목</Th>
                    <Th>적용</Th>
                    <Th>컷 규칙</Th>
                    <Th className="text-right">사용 숙소</Th>
                  </tr>
                </thead>
                <tbody>
                  {store.facilities.map((f) => (
                    <tr
                      key={f.id}
                      onClick={() => setSelectedId(f.id)}
                      className={`cursor-pointer border-b border-line ${
                        f.id === selectedId ? "bg-surface" : "hover:bg-surface/60"
                      }`}
                    >
                      <td className="px-2.5 py-2 align-top">
                        <span className="font-semibold text-fg">{f.label}</span>
                        <span className="mt-px block max-w-xs text-badge leading-[15px] text-fg-subtle">
                          {f.description}
                        </span>
                      </td>
                      <td className="px-2.5 py-2 align-top">
                        <Badge variant={f.scope === "선택" ? "outline" : "neutral"}>
                          {f.scope}
                        </Badge>
                      </td>
                      <td className="px-2.5 py-2 align-top">
                        <span className="flex flex-wrap gap-1">
                          {f.rules.map((r) => (
                            <Badge key={r.label} variant="neutral">
                              {r.label} <span className="tnum">{r.minCount}</span>컷
                              {r.optional ? " (권장)" : ""}
                            </Badge>
                          ))}
                        </span>
                      </td>
                      <td className="tnum px-2.5 py-2 text-right align-top text-fg-muted">
                        {f.scope === "선택" ? `${store.usageOf(f.id)}곳` : "전체"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PanelNote>
              여기에는 AI가 없습니다. 이미 가진 데이터를 규칙으로 연결해 입력 자체를
              없앤 자동화입니다. 어디에 AI를 쓰고 어디에 안 쓸지를 나누는 것이 설계의
              핵심입니다.
            </PanelNote>
          </Panel>

          <div className="space-y-4">
            {selected ? (
              <Panel>
                <PanelHeader
                  title={`${selected.label} 규칙`}
                  description="컷 이름과 최소 장수를 정합니다. 권장으로 표시한 컷은 없어도 촬영 완료로 봅니다."
                  right={
                    selected.scope === "선택" ? (
                      <button
                        type="button"
                        onClick={() => {
                          store.removeFacility(selected.id);
                          setSelectedId(store.facilities[0]?.id ?? "");
                        }}
                        className="rounded-box border border-line-strong px-2 py-1 text-badge text-danger hover:bg-canvas"
                      >
                        시설 삭제
                      </button>
                    ) : (
                      <Badge variant="neutral">시스템 항목</Badge>
                    )
                  }
                />

                <ul className="divide-y divide-line">
                  {selected.rules.map((rule, i) => (
                    <li key={i} className="flex items-center gap-2 px-4 py-2">
                      <input
                        value={rule.label}
                        onChange={(e) => patchRule(i, { label: e.target.value })}
                        aria-label="컷 이름"
                        className="min-w-0 flex-1 rounded-box border border-line px-2 py-1 text-body text-fg outline-none focus:border-fg-subtle"
                      />
                      <input
                        value={rule.minCount}
                        onChange={(e) =>
                          patchRule(i, { minCount: Math.max(1, Number(e.target.value) || 1) })
                        }
                        inputMode="numeric"
                        aria-label="최소 장수"
                        className="tnum w-14 rounded-box border border-line px-2 py-1 text-body text-fg outline-none focus:border-fg-subtle"
                      />
                      <label className="flex shrink-0 items-center gap-1 text-badge text-fg-muted">
                        <input
                          type="checkbox"
                          checked={Boolean(rule.optional)}
                          onChange={(e) => patchRule(i, { optional: e.target.checked })}
                          className="h-3.5 w-3.5 accent-[#37352F]"
                        />
                        권장
                      </label>
                      <button
                        type="button"
                        onClick={() => removeRule(i)}
                        aria-label="규칙 삭제"
                        className="shrink-0 rounded-box border border-line px-1.5 py-1 text-badge text-fg-muted hover:border-line-strong hover:text-fg"
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-line px-4 py-2">
                  <button
                    type="button"
                    onClick={addRule}
                    className="text-body font-medium text-fg-muted hover:text-fg"
                  >
                    + 컷 규칙 추가
                  </button>
                </div>
              </Panel>
            ) : null}

            <Panel>
              <PanelHeader
                title="전개 미리보기"
                description="가상의 숙소에 지금 규칙을 적용하면 체크리스트가 이렇게 만들어집니다."
                right={
                  <Badge variant="outline">
                    <span className="tnum">{preview.length}</span>항목 ·{" "}
                    <span className="tnum">{previewCuts}</span>컷
                  </Badge>
                }
              />

              <div className="space-y-2 border-b border-line bg-surface px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-badge font-semibold text-fg">객실 타입</span>
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPreviewRooms(n)}
                      className={`tnum rounded-box border px-2.5 py-0.5 text-badge ${
                        previewRooms === n
                          ? "border-fg bg-canvas font-semibold text-fg"
                          : "border-line-strong text-fg-muted hover:text-fg"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-badge font-semibold text-fg">보유 시설</span>
                  {selectable.map((f) => {
                    const on = previewFacilityIds.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() =>
                          setPreviewFacilityIds((prev) =>
                            on ? prev.filter((x) => x !== f.id) : [...prev, f.id],
                          )
                        }
                        className={`rounded-box border px-2 py-0.5 text-badge ${
                          on
                            ? "border-fg bg-canvas font-semibold text-fg"
                            : "border-line-strong text-fg-muted hover:text-fg"
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-badge text-fg-subtle">↓ 자동 생성</p>
              </div>

              <ul className="max-h-96 divide-y divide-line overflow-y-auto">
                {preview.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 px-4 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-body text-fg">
                      {s.label}
                      {!s.isRequired ? (
                        <span className="ml-1.5 text-badge text-fg-subtle">권장</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-badge text-fg-subtle">
                      {s.derivedFrom}
                    </span>
                    <span className="tnum w-10 shrink-0 text-right text-body text-fg-muted">
                      {s.minCount}컷
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`border-b border-line-strong px-2.5 py-2 text-badge font-semibold text-fg-muted ${className}`}
    >
      {children}
    </th>
  );
}
