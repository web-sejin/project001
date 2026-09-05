"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { generateShotList } from "@/data/accommodations";
import type { Accommodation, AccommodationType, Facilities } from "@/data/types";

const TYPES: AccommodationType[] = [
  "풀빌라",
  "독채",
  "호텔",
  "펜션",
  "글램핑",
  "한옥",
  "리조트",
];

const FACILITY_FIELDS: Array<{ key: keyof Omit<Facilities, "roomTypes">; label: string }> = [
  { key: "pool", label: "수영장" },
  { key: "breakfast", label: "조식" },
  { key: "bbq", label: "바비큐" },
  { key: "spa", label: "스파 · 사우나" },
  { key: "pet", label: "반려동물 동반" },
  { key: "outdoor", label: "정원 · 테라스" },
];

const EMPTY: Accommodation = {
  id: "new",
  name: "",
  type: "풀빌라",
  address: "",
  region: "",
  facilities: {
    roomTypes: 2,
    pool: false,
    breakfast: false,
    bbq: false,
    pet: false,
    spa: false,
    outdoor: true,
  },
};

export function AccommodationManager({ list }: { list: Accommodation[] }) {
  const [form, setForm] = useState<Accommodation>(list[0] ?? EMPTY);

  const shots = useMemo(
    () => generateShotList(form.facilities, form.id),
    [form.facilities, form.id],
  );
  const totalCuts = shots.reduce((s, i) => s + i.minCount, 0);

  const setFacility = <K extends keyof Facilities>(key: K, value: Facilities[K]) =>
    setForm((f) => ({ ...f, facilities: { ...f.facilities, [key]: value } }));

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="숙소 목록"
          description="행을 클릭하면 아래 폼에 불러옵니다."
          right={
            <button
              type="button"
              onClick={() => setForm(EMPTY)}
              className="rounded-box border border-line-strong bg-surface px-2 py-1 text-badge font-medium text-fg"
            >
              + 새 숙소
            </button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-body">
            <thead>
              <tr className="bg-surface text-left text-fg-muted">
                <th className="border-b border-line px-2.5 py-2 font-medium">숙소명</th>
                <th className="border-b border-line px-2.5 py-2 font-medium">유형</th>
                <th className="border-b border-line px-2.5 py-2 font-medium">지역</th>
                <th className="border-b border-line px-2.5 py-2 font-medium">객실 타입</th>
                <th className="border-b border-line px-2.5 py-2 font-medium">시설</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a, i) => (
                <tr
                  key={a.id}
                  onClick={() => setForm(a)}
                  className={`h-9 cursor-pointer ${
                    form.id === a.id
                      ? "bg-surface"
                      : i % 2 === 1
                        ? "bg-surface/40"
                        : ""
                  } hover:bg-surface`}
                >
                  <td className="border-b border-line px-2.5 font-medium text-fg">
                    {a.name}
                  </td>
                  <td className="border-b border-line px-2.5 text-fg-muted">{a.type}</td>
                  <td className="border-b border-line px-2.5 text-fg-muted">
                    {a.region}
                  </td>
                  <td className="tnum border-b border-line px-2.5 text-fg-muted">
                    {a.facilities.roomTypes}
                  </td>
                  <td className="border-b border-line px-2.5">
                    <span className="flex flex-wrap gap-1">
                      {FACILITY_FIELDS.filter((f) => a.facilities[f.key]).map((f) => (
                        <Badge key={f.key} variant="neutral">
                          {f.label}
                        </Badge>
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title={form.id === "new" ? "숙소 등록" : "숙소 수정"}
            description="시설 정보를 바꾸면 오른쪽 필수 컷 목록이 즉시 다시 생성됩니다."
          />
          <div className="space-y-3 p-4">
            <Field label="숙소명">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="예: 제주 애월 오션뷰 풀빌라"
                className="w-full rounded-box border border-line-strong px-2 py-1 text-body outline-none focus:border-fg-subtle"
              />
            </Field>

            <Field label="유형">
              <div className="flex flex-wrap gap-1">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={`rounded-box border px-2 py-0.5 text-badge transition-colors ${
                      form.type === t
                        ? "border-line-strong bg-surface font-medium text-fg"
                        : "border-line text-fg-muted hover:text-fg"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="주소">
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full rounded-box border border-line-strong px-2 py-1 text-body outline-none focus:border-fg-subtle"
              />
            </Field>

            <Field label="객실 타입 수">
              <div className="flex gap-1">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFacility("roomTypes", n)}
                    className={`tnum rounded-box border px-3 py-0.5 text-badge transition-colors ${
                      form.facilities.roomTypes === n
                        ? "border-line-strong bg-surface font-medium text-fg"
                        : "border-line text-fg-muted hover:text-fg"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="시설 정보">
              <div className="grid grid-cols-2 gap-1.5">
                {FACILITY_FIELDS.map((f) => (
                  <label
                    key={f.key}
                    className="flex cursor-pointer items-center gap-1.5 text-body text-fg"
                  >
                    <input
                      type="checkbox"
                      checked={form.facilities[f.key]}
                      onChange={(e) => setFacility(f.key, e.target.checked)}
                      className="h-3.5 w-3.5 accent-[#37352F]"
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            </Field>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="필수 컷 목록"
            description="입력한 시설 정보에서 규칙으로 파생됩니다. 촬영팀은 이 목록을 따로 작성하지 않습니다."
            right={
              <>
                <Badge variant="neutral">자동 생성됨</Badge>
                <Badge variant="outline">
                  <span className="tnum">{shots.length}</span>항목 ·{" "}
                  <span className="tnum">{totalCuts}</span>컷
                </Badge>
              </>
            }
          />

          <div className="border-b border-line bg-surface px-4 py-2">
            <p className="text-badge text-fg-muted">
              {`객실 ${form.facilities.roomTypes}타입`}
              {FACILITY_FIELDS.filter((f) => form.facilities[f.key])
                .map((f) => ` / ${f.label}`)
                .join("")}
            </p>
            <p className="mt-0.5 text-badge text-fg-subtle">↓ 자동 생성</p>
          </div>

          <ul className="divide-y divide-line">
            {shots.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-1.5">
                <span className="min-w-0 flex-1 text-body text-fg">{s.label}</span>
                <span className="shrink-0 text-badge text-fg-subtle">
                  {s.derivedFrom}
                </span>
                <span className="tnum w-10 shrink-0 text-right text-body text-fg-muted">
                  {s.minCount}컷
                </span>
              </li>
            ))}
          </ul>

          <div className="border-t border-line px-4 py-2.5">
            <p className="text-badge leading-[16px] text-fg-muted">
              여기에는 AI가 없습니다. 이미 가진 데이터를 규칙으로 연결해 입력 자체를
              없앤 자동화입니다. AI를 쓸 곳과 안 쓸 곳을 나누는 것이 설계의 핵심입니다.
            </p>
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
      <p className="mb-1 text-badge font-medium text-fg-muted">{label}</p>
      {children}
    </div>
  );
}
