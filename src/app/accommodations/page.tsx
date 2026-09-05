"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Explain, PageHeader } from "@/components/PageHeader";
import { ScheduleForm } from "@/components/ScheduleForm";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Panel, PanelHeader, PanelNote } from "@/components/ui/Panel";
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
  const [createdContentId, setCreatedContentId] = useState<string | null>(null);

  const selectable = store.facilities.filter((f) => f.scope === "선택");

  const preview = useMemo(
    () =>
      form
        ? generateShotList(store.facilities, form.roomTypes, form.facilityIds)
        : [],
    [store.facilities, form],
  );
  const previewCuts = preview.reduce((s, i) => s + i.minCount, 0);

  const openNew = () => {
    setForm({ ...BLANK });
    setSavedId(null);
    setCreatedContentId(null);
  };

  const openEdit = (acc: Accommodation) => {
    setForm({ ...acc });
    setSavedId(null);
    setCreatedContentId(null);
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

  const toggleFacility = (id: string) => {
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
  };

  const isNew = form !== null && !store.accommodations.some((a) => a.id === form.id);

  return (
    <div>
      <PageHeader
        title="숙소 관리"
        purpose="촬영 대상 숙소를 등록하고, 보유한 시설을 고르는 화면입니다. 시설을 고르면 촬영 필수 컷 목록이 자동으로 만들어지고, 저장 직후 바로 촬영 일정까지 등록할 수 있습니다."
        right={
          <button
            type="button"
            onClick={openNew}
            className="rounded-box border border-fg bg-fg px-3 py-1.5 text-body font-semibold text-canvas"
          >
            + 새 숙소 등록
          </button>
        }
      />

      <div className="space-y-4 p-4 lg:p-6">
        <Explain label="등록 순서">
          <Link href="/facilities" className="underline underline-offset-2">
            1. 시설 관리
          </Link>
          에서 정의한 규칙이 아래 &ldquo;보유 시설&rdquo; 선택지가 됩니다 →{" "}
          <strong className="font-semibold text-fg">2. 숙소 저장</strong> →{" "}
          <strong className="font-semibold text-fg">3. 촬영 일정 등록</strong>까지
          마치면 현황판과 캘린더에 촬영 건이 나타납니다.
        </Explain>

        {form ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-4">
              <Panel>
                <PanelHeader
                  title={isNew ? "새 숙소 등록" : `${form.name || "숙소"} 수정`}
                  description="시설을 체크하면 오른쪽 필수 컷 목록이 즉시 다시 만들어집니다."
                  right={
                    <button
                      type="button"
                      onClick={() => {
                        setForm(null);
                        setSavedId(null);
                        setCreatedContentId(null);
                      }}
                      className="rounded-box border border-line-strong px-2 py-1 text-badge text-fg-muted hover:text-fg"
                    >
                      닫기
                    </button>
                  }
                />

                <div className="space-y-3 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="숙소명">
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="예: 제주 애월 오션뷰 풀빌라"
                        className="w-full rounded-box border border-line-strong px-2 py-1.5 text-body outline-none focus:border-fg-subtle"
                      />
                    </Field>
                    <Field label="지역">
                      <input
                        value={form.region}
                        onChange={(e) => setForm({ ...form, region: e.target.value })}
                        placeholder="예: 제주"
                        className="w-full rounded-box border border-line-strong px-2 py-1.5 text-body outline-none focus:border-fg-subtle"
                      />
                    </Field>
                  </div>

                  <Field label="주소">
                    <input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full rounded-box border border-line-strong px-2 py-1.5 text-body outline-none focus:border-fg-subtle"
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
                              ? "border-fg bg-surface font-semibold text-fg"
                              : "border-line-strong text-fg-muted hover:text-fg"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="객실 타입 수">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setForm({ ...form, roomTypes: n })}
                          className={`tnum rounded-box border px-4 py-1 text-body ${
                            form.roomTypes === n
                              ? "border-fg bg-surface font-semibold text-fg"
                              : "border-line-strong text-fg-muted hover:text-fg"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="보유 시설">
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      {selectable.map((f) => (
                        <label
                          key={f.id}
                          className="flex cursor-pointer items-center gap-1.5 rounded-box border border-line px-2 py-1.5 text-body text-fg hover:border-line-strong"
                        >
                          <input
                            type="checkbox"
                            checked={form.facilityIds.includes(f.id)}
                            onChange={() => toggleFacility(f.id)}
                            className="h-3.5 w-3.5 accent-[#37352F]"
                          />
                          {f.label}
                        </label>
                      ))}
                    </div>
                  </Field>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={save}
                      disabled={!form.name.trim()}
                      className="rounded-box border border-fg bg-fg px-3 py-1.5 text-body font-semibold text-canvas disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isNew ? "숙소 저장" : "변경 저장"}
                    </button>
                    {savedId ? (
                      <span className="text-body font-medium text-success">
                        저장됐습니다
                      </span>
                    ) : null}
                  </div>
                </div>
              </Panel>

              {savedId ? (
                <Panel>
                  <PanelHeader
                    title="3. 촬영 일정 등록"
                    description="숙소가 저장됐습니다. 이어서 촬영 일정을 잡으면 현황판 · 캘린더에 촬영 건이 생깁니다."
                  />
                  <div className="p-4">
                    {createdContentId ? (
                      <div className="space-y-2">
                        <p className="text-body font-medium text-success">
                          촬영 일정이 등록됐습니다.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/content/${createdContentId}`}
                            className="rounded-box border border-line-strong bg-surface px-3 py-1.5 text-body font-semibold text-fg"
                          >
                            콘텐츠 상세 열기
                          </Link>
                          <Link
                            href="/calendar"
                            className="rounded-box border border-line-strong px-3 py-1.5 text-body text-fg-muted hover:text-fg"
                          >
                            캘린더에서 보기
                          </Link>
                          <Link
                            href="/"
                            className="rounded-box border border-line-strong px-3 py-1.5 text-body text-fg-muted hover:text-fg"
                          >
                            현황판에서 보기
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <ScheduleForm
                        fixedAccommodationId={savedId}
                        onCreated={setCreatedContentId}
                      />
                    )}
                  </div>
                </Panel>
              ) : null}
            </div>

            <Panel>
              <PanelHeader
                title="필수 컷 목록"
                description="시설 마스터의 규칙에서 전개됩니다. 촬영팀이 숙소마다 체크리스트를 새로 쓰지 않습니다."
                right={
                  <Badge variant="outline">
                    <span className="tnum">{preview.length}</span>항목 ·{" "}
                    <span className="tnum">{previewCuts}</span>컷
                  </Badge>
                }
              />
              <div className="border-b border-line bg-surface px-4 py-2">
                <p className="text-badge text-fg-muted">
                  {`객실 ${form.roomTypes}타입`}
                  {selectable
                    .filter((f) => form.facilityIds.includes(f.id))
                    .map((f) => ` / ${f.label}`)
                    .join("")}
                </p>
                <p className="mt-0.5 text-badge text-fg-subtle">↓ 자동 생성</p>
              </div>
              <ul className="max-h-[520px] divide-y divide-line overflow-y-auto">
                {preview.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 px-4 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-body text-fg">
                      {s.label}
                      {!s.isRequired ? (
                        <span className="ml-1.5 text-badge text-fg-subtle">권장</span>
                      ) : null}
                    </span>
                    <span className="tnum w-10 shrink-0 text-right text-body text-fg-muted">
                      {s.minCount}컷
                    </span>
                  </li>
                ))}
              </ul>
              <PanelNote>
                AI가 아닙니다. 이미 가진 데이터를 규칙으로 연결해 입력 자체를 없앤
                자동화입니다.
              </PanelNote>
            </Panel>
          </div>
        ) : null}

        <Panel>
          <PanelHeader
            title="숙소 목록"
            description="행을 클릭하면 시설 정보를 수정하고 촬영 일정을 추가할 수 있습니다."
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
                  <Th className="text-right">객실</Th>
                  <Th>보유 시설</Th>
                  <Th>촬영 건</Th>
                </tr>
              </thead>
              <tbody>
                {store.accommodations.map((a, i) => {
                  const shoots = store.contentsOfAccommodation(a.id);
                  const latest = shoots[shoots.length - 1];
                  return (
                    <tr
                      key={a.id}
                      onClick={() => openEdit(a)}
                      className={`h-9 cursor-pointer border-b border-line ${
                        form?.id === a.id
                          ? "bg-surface"
                          : i % 2 === 1
                            ? "bg-surface/40 hover:bg-surface"
                            : "hover:bg-surface"
                      }`}
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
                            <span className="tnum text-fg-muted">{shoots.length}건</span>
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
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-badge font-semibold text-fg-muted">{label}</p>
      {children}
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
