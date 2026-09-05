"use client";

import { useState } from "react";
import { PHOTOGRAPHERS, TODAY } from "@/data/contents";
import { useStore } from "@/store/MockStore";

/**
 * 촬영 일정(콘텐츠 건) 등록 폼.
 *
 * 숙소 관리에서 숙소를 저장한 직후에도, 캘린더에서 빈 날짜를 클릭했을 때도
 * 같은 폼을 쓴다. 등록 경로는 둘이지만 만들어지는 건 같은 레코드다.
 */
export function ScheduleForm({
  fixedAccommodationId,
  fixedDate,
  onCreated,
  onCancel,
}: {
  fixedAccommodationId?: string;
  fixedDate?: string;
  onCreated: (contentId: string) => void;
  onCancel?: () => void;
}) {
  const store = useStore();
  const [accId, setAccId] = useState(
    fixedAccommodationId ?? store.accommodations[0]?.id ?? "",
  );
  const [date, setDate] = useState(fixedDate ?? TODAY);
  const [photographer, setPhotographer] = useState(PHOTOGRAPHERS[0]);

  const acc = store.accommodationOf(accId);
  const shotList = store.shotListOf(accId);
  const requiredCuts = shotList
    .filter((s) => s.isRequired)
    .reduce((sum, s) => sum + s.minCount, 0);

  const submit = () => {
    if (!accId || !date) return;
    const created = store.addContent({
      accommodationId: accId,
      shootDate: date,
      photographer,
    });
    onCreated(created.id);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-badge font-semibold text-fg-muted">
            숙소
          </span>
          <select
            value={accId}
            onChange={(e) => setAccId(e.target.value)}
            disabled={Boolean(fixedAccommodationId)}
            className="w-full rounded-box border border-line-strong bg-canvas px-2 py-1.5 text-body text-fg outline-none focus:border-fg-subtle disabled:bg-surface disabled:text-fg-muted"
          >
            {store.accommodations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-badge font-semibold text-fg-muted">
            촬영일
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="tnum w-full rounded-box border border-line-strong bg-canvas px-2 py-1.5 text-body text-fg outline-none focus:border-fg-subtle"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-badge font-semibold text-fg-muted">
            촬영 작가
          </span>
          <select
            value={photographer}
            onChange={(e) => setPhotographer(e.target.value)}
            className="w-full rounded-box border border-line-strong bg-canvas px-2 py-1.5 text-body text-fg outline-none focus:border-fg-subtle"
          >
            {PHOTOGRAPHERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>

      {acc ? (
        <p className="text-badge leading-[16px] text-fg-muted">
          등록하면 <span className="font-semibold text-fg">{acc.name}</span>의 시설
          정보에서 전개된 필수 컷{" "}
          <span className="tnum font-semibold text-fg">{shotList.length}</span>항목 (총{" "}
          <span className="tnum font-semibold text-fg">{requiredCuts}</span>컷)이
          촬영 체크리스트로 함께 만들어집니다. 담당자 배정과 리마인드는 조건 분기와
          스케줄러로 처리하는 영역이라 AI를 쓰지 않습니다.
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={!accId || !date}
          className="rounded-box border border-fg bg-fg px-3 py-1.5 text-body font-semibold text-canvas disabled:cursor-not-allowed disabled:opacity-40"
        >
          촬영 일정 등록
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-box border border-line-strong px-3 py-1.5 text-body text-fg-muted hover:text-fg"
          >
            취소
          </button>
        ) : null}
      </div>
    </div>
  );
}
