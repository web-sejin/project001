"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useStore } from "@/store/MockStore";
import type { ShotRule } from "@/data/types";

/**
 * 촬영 필수 컷 규칙 관리.
 *
 * 별도 메뉴로 두면 사이드바가 무거워지고, 과제의 4단계 흐름에서 시선이 흩어진다.
 * 숙소 관리에서 필요할 때 열어보는 설정으로 붙여 둔다.
 */
export function FacilityRulesDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const store = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  const editing = store.facilities.find((f) => f.id === editingId) ?? null;

  const patchRule = (index: number, patch: Partial<ShotRule>) => {
    if (!editing) return;
    store.updateFacility(editing.id, {
      rules: editing.rules.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    });
  };

  const close = () => {
    setEditingId(null);
    setDraftName("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={editing ? `${editing.label} 규칙` : "촬영 필수 컷 규칙"}
      description={
        editing
          ? editing.description
          : "시설 항목마다 어떤 컷이 몇 장 필요한지 정합니다. 여기서 정한 규칙이 모든 숙소의 체크리스트로 전개됩니다."
      }
      width="660px"
      footer={
        editing ? (
          <>
            {editing.scope === "선택" ? (
              <Button
                variant="danger"
                onClick={() => {
                  store.removeFacility(editing.id);
                  setEditingId(null);
                }}
              >
                시설 삭제
              </Button>
            ) : null}
            <Button onClick={() => setEditingId(null)}>목록으로</Button>
          </>
        ) : (
          <Button variant="primary" onClick={close}>
            닫기
          </Button>
        )
      }
    >
      {editing ? (
        <div className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              value={editing.label}
              onChange={(e) => store.updateFacility(editing.id, { label: e.target.value })}
              disabled={editing.scope !== "선택"}
              aria-label="시설명"
              className="min-w-0 flex-1 rounded-box border border-line-strong px-2 py-1.5 text-body outline-none focus:border-ai disabled:bg-surface disabled:text-fg-muted"
            />
            <Badge variant={editing.scope === "선택" ? "outline" : "ai"}>
              {editing.scope}
            </Badge>
            <span className="text-badge text-fg-muted">
              {editing.scope === "선택"
                ? `${store.usageOf(editing.id)}곳에서 사용 중`
                : "모든 숙소 적용"}
            </span>
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

          <div className="mt-2 flex items-center justify-between gap-2">
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
            <p className="text-badge text-fg-subtle">
              필수를 해제하면 없어도 촬영 완료로 봅니다
            </p>
          </div>

          {editing.scope === "객실" ? (
            <p className="mt-3 rounded-box bg-surface px-3 py-2 text-badge leading-[16px] text-fg-muted">
              객실 규칙은 객실 1개 기준입니다. 객실 2개인 숙소면 객실 5컷이 10컷이
              됩니다. 객실별로 행을 나누지 않는 이유는{" "}
              <span className="text-fg">
                AI가 같은 숙소의 객실 두 장을 구분할 수 없기 때문
              </span>
              입니다.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="p-4">
          <table className="w-full border-collapse text-body">
            <thead>
              <tr className="bg-surface text-left">
                <Th>시설 항목</Th>
                <Th className="w-20">적용</Th>
                <Th>컷 규칙</Th>
                <Th className="w-20 text-right">사용 숙소</Th>
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

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="새 시설명 (예: 루프탑 라운지)"
              className="min-w-0 flex-1 rounded-box border border-line-strong px-2 py-1.5 text-body outline-none focus:border-ai"
            />
            <Button
              disabled={!draftName.trim()}
              onClick={() => {
                const label = draftName.trim();
                const created = store.addFacility({
                  label,
                  scope: "선택",
                  description: `숙소가 ${label}을(를) 보유하면 아래 컷이 추가됩니다`,
                  rules: [{ label, minCount: 2 }],
                });
                setDraftName("");
                setEditingId(created.id);
              }}
            >
              시설 추가
            </Button>
          </div>

        </div>
      )}
    </Dialog>
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
