"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { useStore } from "@/store/MockStore";
import type { FacilityDef, ShotRule } from "@/data/types";

const SCOPE_HELP: Record<FacilityDef["scope"], string> = {
  공통: "모든 숙소에 무조건 적용됩니다.",
  객실: "객실 타입 1개당 필요한 컷 수입니다. 숙소의 객실 타입 수를 곱해 합계로 관리합니다.",
  선택: "숙소가 보유를 체크했을 때만 적용됩니다.",
};

export default function FacilitiesPage() {
  const store = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");

  const editing = store.facilities.find((f) => f.id === editingId) ?? null;

  const patchRule = (index: number, patch: Partial<ShotRule>) => {
    if (!editing) return;
    store.updateFacility(editing.id, {
      rules: editing.rules.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    });
  };

  const createFacility = () => {
    const label = draftName.trim();
    if (!label) return;
    const created = store.addFacility({
      label,
      scope: "선택",
      description: `숙소가 ${label}을(를) 보유하면 아래 컷이 체크리스트에 추가됩니다.`,
      rules: [{ label, minCount: 2 }],
    });
    setDraftName("");
    setCreating(false);
    setEditingId(created.id);
  };

  return (
    <div>
      <PageHeader
        title="시설 관리"
        purpose="촬영 필수 컷 규칙을 정의합니다. 여기서 정한 규칙이 숙소 등록 시 선택지가 되고, 촬영 체크리스트로 자동 전개됩니다."
        right={
          <Button variant="primary" onClick={() => setCreating(true)}>
            + 시설 추가
          </Button>
        }
      />

      <div className="p-4 lg:p-6">
        <Panel>
          <PanelHeader
            title="시설 항목"
            description="행을 클릭하면 컷 규칙을 수정합니다."
            right={
              <Badge variant="neutral">
                <span className="tnum">{store.facilities.length}</span>항목
              </Badge>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-body">
              <thead>
                <tr className="bg-surface text-left">
                  <Th>시설 항목</Th>
                  <Th>적용 범위</Th>
                  <Th>촬영 컷 규칙</Th>
                  <Th className="text-right">사용 숙소</Th>
                </tr>
              </thead>
              <tbody>
                {store.facilities.map((f) => (
                  <tr
                    key={f.id}
                    onClick={() => setEditingId(f.id)}
                    className="cursor-pointer border-b border-line hover:bg-surface"
                  >
                    <td className="px-2.5 py-2 align-top font-semibold text-fg">
                      {f.label}
                    </td>
                    <td className="px-2.5 py-2 align-top">
                      <Badge variant={f.scope === "선택" ? "outline" : "ai"}>
                        {f.scope}
                      </Badge>
                    </td>
                    <td className="px-2.5 py-2 align-top">
                      <span className="flex flex-wrap gap-1">
                        {f.rules.map((r) => (
                          <Badge key={r.label} variant="neutral">
                            {r.label} <span className="tnum">{r.minCount}</span>컷
                            {r.optional ? " · 권장" : ""}
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
          <div className="border-t border-line bg-surface px-4 py-2.5">
            <p className="text-badge leading-[16px] text-fg-muted">
              여기에는 AI가 없습니다. 이미 가진 데이터를 규칙으로 연결해 입력 자체를
              없앤 자동화입니다.
            </p>
          </div>
        </Panel>
      </div>

      {/* 시설 추가 */}
      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        title="시설 추가"
        description="추가한 시설은 숙소 등록 화면의 보유 시설 선택지가 됩니다."
        width="440px"
        footer={
          <>
            <Button onClick={() => setCreating(false)}>취소</Button>
            <Button variant="primary" onClick={createFacility} disabled={!draftName.trim()}>
              추가
            </Button>
          </>
        }
      >
        <div className="p-4">
          <label className="block">
            <span className="mb-1 block text-badge font-semibold text-fg-muted">
              시설명
            </span>
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createFacility()}
              placeholder="예: 루프탑 라운지"
              className="w-full rounded-box border border-line-strong px-2 py-1.5 text-body outline-none focus:border-ai"
            />
          </label>
          <p className="mt-2 text-badge leading-[16px] text-fg-muted">
            추가하면 같은 이름의 컷 규칙 1개(2컷)가 기본으로 만들어집니다. 이어서
            수정할 수 있습니다.
          </p>
        </div>
      </Dialog>

      {/* 시설 상세 · 규칙 수정 */}
      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditingId(null)}
        title={editing ? `${editing.label} 시설` : ""}
        description={editing ? SCOPE_HELP[editing.scope] : undefined}
        width="620px"
        footer={
          editing?.scope === "선택" ? (
            <>
              <Button
                variant="danger"
                onClick={() => {
                  store.removeFacility(editing.id);
                  setEditingId(null);
                }}
              >
                시설 삭제
              </Button>
              <Button variant="primary" onClick={() => setEditingId(null)}>
                완료
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => setEditingId(null)}>
              완료
            </Button>
          )
        }
      >
        {editing ? (
          <div className="divide-y divide-line">
            <section className="grid gap-3 p-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-badge font-semibold text-fg-muted">
                  시설명
                </span>
                <input
                  value={editing.label}
                  onChange={(e) =>
                    store.updateFacility(editing.id, { label: e.target.value })
                  }
                  disabled={editing.scope !== "선택"}
                  className="w-full rounded-box border border-line-strong px-2 py-1.5 text-body outline-none focus:border-ai disabled:bg-surface disabled:text-fg-muted"
                />
              </label>
              <div>
                <span className="mb-1 block text-badge font-semibold text-fg-muted">
                  적용 범위
                </span>
                <div className="flex h-[34px] items-center gap-2">
                  <Badge variant={editing.scope === "선택" ? "outline" : "ai"}>
                    {editing.scope}
                  </Badge>
                  <span className="text-badge text-fg-muted">
                    {editing.scope === "선택"
                      ? `${store.usageOf(editing.id)}곳에서 사용 중`
                      : "모든 숙소 적용"}
                  </span>
                </div>
              </div>
            </section>

            <section className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-body font-semibold text-fg">촬영 컷 규칙</h3>
                <Button
                  size="sm"
                  onClick={() =>
                    store.updateFacility(editing.id, {
                      rules: [...editing.rules, { label: "새 컷", minCount: 2 }],
                    })
                  }
                >
                  + 컷 규칙 추가
                </Button>
              </div>

              <table className="w-full border-collapse text-body">
                <thead>
                  <tr className="bg-surface text-left">
                    <Th>컷 이름</Th>
                    <Th className="w-32">최소 장수</Th>
                    <Th className="w-20">구분</Th>
                    <Th className="w-16 text-right">삭제</Th>
                  </tr>
                </thead>
                <tbody>
                  {editing.rules.map((rule, i) => (
                    <tr key={i} className="border-b border-line">
                      <td className="px-2.5 py-1.5">
                        <input
                          value={rule.label}
                          onChange={(e) => patchRule(i, { label: e.target.value })}
                          aria-label={`${i + 1}번째 컷 이름`}
                          className="w-full rounded-box border border-line px-2 py-1 text-body outline-none focus:border-ai"
                        />
                      </td>
                      <td className="px-2.5 py-1.5">
                        <span className="flex items-center gap-1">
                          <input
                            value={rule.minCount}
                            onChange={(e) =>
                              patchRule(i, {
                                minCount: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                            inputMode="numeric"
                            aria-label={`${rule.label} 최소 장수`}
                            className="tnum w-16 rounded-box border border-line px-2 py-1 text-right text-body outline-none focus:border-ai"
                          />
                          <span className="text-body text-fg-muted">컷</span>
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <label className="flex items-center gap-1.5 text-badge text-fg-muted">
                          <input
                            type="checkbox"
                            checked={!rule.optional}
                            onChange={(e) => patchRule(i, { optional: !e.target.checked })}
                            className="h-3.5 w-3.5 accent-[#6940A5]"
                          />
                          필수
                        </label>
                      </td>
                      <td className="px-2.5 py-1.5 text-right">
                        <Button
                          size="sm"
                          variant="quiet"
                          aria-label={`${rule.label} 규칙 삭제`}
                          onClick={() =>
                            store.updateFacility(editing.id, {
                              rules: editing.rules.filter((_, k) => k !== i),
                            })
                          }
                        >
                          삭제
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="mt-2 text-badge leading-[16px] text-fg-muted">
                필수 해제(권장)로 두면 그 컷이 없어도 촬영 완료로 봅니다. 컷 이름은
                사진만 보고 판정할 수 있는 공간 유형이어야 합니다.
                {editing.scope === "객실" ? (
                  <>
                    {" "}
                    객실 규칙은 타입 1개 기준입니다. 3타입 숙소면 침실 5컷이 15컷으로
                    합산됩니다. 타입별로 행을 나누지 않는 이유는 AI가 같은 숙소의 침실
                    두 장을 보고 어느 타입인지 가릴 수 없기 때문입니다.
                  </>
                ) : null}
              </p>
            </section>

            {editing.scope === "선택" ? (
              <section className="p-4">
                <h3 className="mb-2 text-body font-semibold text-fg">
                  이 시설을 보유한 숙소
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {store.accommodations
                    .filter((a) => a.facilityIds.includes(editing.id))
                    .map((a) => (
                      <Link
                        key={a.id}
                        href="/accommodations"
                        className="rounded-box border border-line-strong px-2 py-0.5 text-badge text-fg-muted hover:text-fg"
                      >
                        {a.name}
                      </Link>
                    ))}
                  {store.usageOf(editing.id) === 0 ? (
                    <span className="text-badge text-fg-subtle">
                      아직 이 시설을 보유한 숙소가 없습니다.
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-badge leading-[16px] text-fg-muted">
                  규칙을 고치면 위 숙소들의 촬영 체크리스트가 함께 바뀝니다.
                </p>
              </section>
            ) : null}
          </div>
        ) : null}
      </Dialog>
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
