"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ScheduleForm } from "@/components/ScheduleForm";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { generateShotList } from "@/data/facilities";
import { useStore } from "@/store/MockStore";
import type { Accommodation, AccommodationType } from "@/data/types";

const TYPES: AccommodationType[] = [
  "풀빌라",
  "독채",
  "호텔",
  "펜션",
  "글램핑",
  "한옥",
  "리조트",
];

const BLANK: Accommodation = {
  id: "",
  name: "",
  type: "풀빌라",
  address: "",
  region: "",
  roomTypes: 2,
  facilityIds: ["f-outdoor"],
};

export default function AccommodationsPage() {
  const store = useStore();
  const [form, setForm] = useState<Accommodation | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [createdContentId, setCreatedContentId] = useState<string | null>(null);

  const selectable = store.facilities.filter((f) => f.scope === "선택");
  const roomFacility = store.facilities.find((f) => f.scope === "객실");
  const facilityLabel = (id: string) =>
    store.facilities.find((f) => f.id === id)?.label ?? "직접 추가";

  const preview = useMemo(
    () =>
      form ? generateShotList(store.facilities, form.roomTypes, form.facilityIds) : [],
    [store.facilities, form],
  );
  const previewCuts = preview.reduce((s, i) => s + i.minCount, 0);

  const closeForm = () => {
    setForm(null);
    setSavedId(null);
    setCreatedContentId(null);
    setScheduling(false);
  };

  const open = (acc: Accommodation | null) => {
    setForm(acc ? { ...acc } : { ...BLANK });
    setSavedId(null);
    setCreatedContentId(null);
    setScheduling(false);
  };

  const save = () => {
    if (!form || !form.name.trim()) return;
    const saved = store.saveAccommodation({
      ...form,
      name: form.name.trim(),
      region: form.region.trim() || form.address.split(" ")[0] || "미지정",
    });
    setForm(saved);
    setSavedId(saved.id);
  };

  const toggleFacility = (id: string) =>
    setForm((f) =>
      f
        ? {
            ...f,
            facilityIds: f.facilityIds.includes(id)
              ? f.facilityIds.filter((x) => x !== id)
              : [...f.facilityIds, id],
          }
        : f,
    );

  const isNew = form !== null && !store.accommodations.some((a) => a.id === form.id);

  /* ------------------------- 등록 · 수정 화면 ------------------------- */
  if (form) {
    return (
      <div>
        <PageHeader
          title={isNew ? "숙소 등록" : form.name || "숙소 수정"}
          purpose="보유한 시설을 고르면 촬영 필수 컷 목록이 자동으로 만들어집니다."
          right={<Button onClick={closeForm}>목록으로</Button>}
        />

        <div className="grid gap-4 p-4 lg:p-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <Panel>
            <PanelHeader title="숙소 정보" />
            <div className="space-y-4 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="숙소명">
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="예: 제주 애월 오션뷰 풀빌라"
                    className="w-full rounded-box border border-line-strong px-2 py-1.5 text-body outline-none focus:border-ai"
                  />
                </Field>
                <Field label="지역">
                  <input
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    placeholder="예: 제주"
                    className="w-full rounded-box border border-line-strong px-2 py-1.5 text-body outline-none focus:border-ai"
                  />
                </Field>
              </div>

              <Field label="주소">
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-box border border-line-strong px-2 py-1.5 text-body outline-none focus:border-ai"
                />
              </Field>

              <Field label="유형">
                <div className="flex flex-wrap gap-1">
                  {TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={`rounded-box border px-2.5 py-1 text-body ${
                        form.type === t
                          ? "border-ai bg-ai-bg font-semibold text-ai"
                          : "border-line-strong text-fg-muted hover:text-fg"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>

              <Field
                label="객실 타입 수"
                help={
                  <>
                    이 숫자만큼 객실·욕실 컷이 반복 전개됩니다. 객실 1타입당 몇 컷인지는{" "}
                    <Link
                      href="/facilities"
                      className="font-medium text-ai underline underline-offset-2"
                    >
                      시설 관리 &gt; {roomFacility?.label ?? "객실"}
                    </Link>
                    에서 정합니다
                    {roomFacility
                      ? ` (현재 ${roomFacility.rules
                          .map((r) => `${r.label} ${r.minCount}컷`)
                          .join(", ")})`
                      : ""}
                    .
                  </>
                }
              >
                <div className="flex gap-1">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm({ ...form, roomTypes: n })}
                      className={`tnum rounded-box border px-4 py-1 text-body ${
                        form.roomTypes === n
                          ? "border-ai bg-ai-bg font-semibold text-ai"
                          : "border-line-strong text-fg-muted hover:text-fg"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </Field>

              <Field
                label="보유 시설"
                help={
                  <>
                    선택지는{" "}
                    <Link
                      href="/facilities"
                      className="font-medium text-ai underline underline-offset-2"
                    >
                      시설 관리
                    </Link>
                    에서 정의한 항목입니다.
                  </>
                }
              >
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {selectable.map((f) => (
                    <label
                      key={f.id}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-box border px-2 py-1.5 text-body ${
                        form.facilityIds.includes(f.id)
                          ? "border-ai bg-ai-bg text-ai"
                          : "border-line text-fg hover:border-line-strong"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.facilityIds.includes(f.id)}
                        onChange={() => toggleFacility(f.id)}
                        className="h-3.5 w-3.5 accent-[#6940A5]"
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
              </Field>

              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <Button variant="primary" onClick={save} disabled={!form.name.trim()}>
                  {isNew ? "숙소 저장" : "변경 저장"}
                </Button>
                {savedId ? (
                  <>
                    <span className="text-body font-medium text-success">
                      저장됐습니다
                    </span>
                    <Button onClick={() => setScheduling(true)}>
                      촬영 일정 등록
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="촬영 필수 컷 목록"
              description="시설 관리의 컷 규칙 + 위에서 고른 보유 시설 + 객실 타입 수로 만들어집니다."
              right={
                <Badge variant="ai">
                  <span className="tnum">{preview.length}</span>항목 ·{" "}
                  <span className="tnum">{previewCuts}</span>컷
                </Badge>
              }
            />
            <table className="w-full border-collapse text-body">
              <thead>
                <tr className="bg-surface text-left">
                  <th className="border-b border-line-strong px-2.5 py-2 text-badge font-semibold text-fg-muted">
                    컷 이름
                  </th>
                  <th className="border-b border-line-strong px-2.5 py-2 text-badge font-semibold text-fg-muted">
                    가져온 곳
                  </th>
                  <th className="border-b border-line-strong px-2.5 py-2 text-right text-badge font-semibold text-fg-muted">
                    최소 장수
                  </th>
                </tr>
              </thead>
              <tbody>
                {preview.map((s) => (
                  <tr key={s.id} className="border-b border-line">
                    <td className="px-2.5 py-1.5 text-fg">
                      {s.label}
                      {!s.isRequired ? (
                        <span className="ml-1.5 text-badge text-fg-subtle">권장</span>
                      ) : null}
                    </td>
                    <td className="px-2.5 py-1.5 text-badge text-fg-muted">
                      {facilityLabel(s.facilityId)}
                    </td>
                    <td className="tnum px-2.5 py-1.5 text-right text-fg-muted">
                      {s.minCount}컷
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <Dialog
          open={scheduling}
          onClose={() => {
            setScheduling(false);
            setCreatedContentId(null);
          }}
          title="촬영 일정 등록"
          description={form.name}
          width="560px"
        >
          <div className="p-4">
            {createdContentId ? (
              <div className="space-y-3">
                <p className="text-body font-medium text-success">
                  촬영 일정이 등록됐습니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/content/${createdContentId}`}
                    className="rounded-box border border-ai bg-ai px-3 py-1.5 text-body font-semibold text-white"
                  >
                    콘텐츠 상세 열기
                  </Link>
                  <Link
                    href="/"
                    className="rounded-box border border-line-strong px-3 py-1.5 text-body font-semibold text-fg-muted hover:text-fg"
                  >
                    현황판에서 보기
                  </Link>
                  <Button variant="quiet" onClick={() => setCreatedContentId(null)}>
                    하나 더 등록
                  </Button>
                </div>
              </div>
            ) : savedId ? (
              <ScheduleForm
                fixedAccommodationId={savedId}
                onCreated={setCreatedContentId}
                onCancel={() => setScheduling(false)}
              />
            ) : null}
          </div>
        </Dialog>
      </div>
    );
  }

  /* ------------------------------ 목록 ------------------------------ */
  return (
    <div>
      <PageHeader
        title="숙소 관리"
        purpose="촬영 대상 숙소를 등록하고 보유 시설을 관리합니다."
        right={
          <Button variant="primary" onClick={() => open(null)}>
            + 새 숙소 등록
          </Button>
        }
      />

      <div className="p-4 lg:p-6">
        <Panel>
          <PanelHeader
            title="숙소 목록"
            description="행을 클릭하면 시설 정보를 수정하고 촬영 일정을 추가합니다."
            right={
              <Badge variant="neutral">
                <span className="tnum">{store.accommodations.length}</span>곳
              </Badge>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-body">
              <thead>
                <tr className="bg-surface text-left">
                  <Th>숙소명</Th>
                  <Th>유형</Th>
                  <Th>지역</Th>
                  <Th className="text-right">객실 타입</Th>
                  <Th>보유 시설</Th>
                  <Th>촬영 건</Th>
                </tr>
              </thead>
              <tbody>
                {store.accommodations.map((a) => {
                  const shoots = store.contentsOfAccommodation(a.id);
                  const latest = shoots[shoots.length - 1];
                  return (
                    <tr
                      key={a.id}
                      onClick={() => open(a)}
                      className="h-9 cursor-pointer border-b border-line hover:bg-surface"
                    >
                      <td className="px-2.5 font-semibold text-fg">{a.name}</td>
                      <td className="px-2.5 text-fg-muted">{a.type}</td>
                      <td className="px-2.5 text-fg-muted">{a.region}</td>
                      <td className="tnum px-2.5 text-right text-fg-muted">
                        {a.roomTypes}
                      </td>
                      <td className="px-2.5 py-1.5">
                        <span className="flex flex-wrap gap-1">
                          {selectable
                            .filter((f) => a.facilityIds.includes(f.id))
                            .map((f) => (
                              <Badge key={f.id} variant="neutral">
                                {f.label}
                              </Badge>
                            ))}
                          {a.facilityIds.length === 0 ? (
                            <span className="text-badge text-fg-subtle">없음</span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5">
                        {latest ? (
                          <span className="flex items-center gap-1.5">
                            <span className="tnum text-fg-muted">
                              {shoots.length}건
                            </span>
                            <StatusBadge status={latest.status} />
                          </span>
                        ) : (
                          <span className="text-badge text-fg-subtle">없음</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-badge font-semibold text-fg-muted">{label}</p>
      {children}
      {help ? (
        <p className="mt-1 text-badge leading-[16px] text-fg-subtle">{help}</p>
      ) : null}
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
