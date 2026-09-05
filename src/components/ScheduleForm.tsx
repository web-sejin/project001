"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PHOTOGRAPHERS, TODAY } from "@/data/contents";
import { useStore } from "@/store/MockStore";

/**
 * 촬영 일정(콘텐츠 건) 등록 폼.
 * 숙소 저장 직후에도, 캘린더 날짜의 + 버튼에서도 같은 폼을 쓴다.
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

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-badge font-semibold text-fg-muted">숙소</span>
          <select
            value={accId}
            onChange={(e) => setAccId(e.target.value)}
            disabled={Boolean(fixedAccommodationId)}
            className="w-full rounded-box border border-line-strong bg-canvas px-2 py-1.5 text-body text-fg outline-none focus:border-ai disabled:bg-surface disabled:text-fg-muted"
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
            className="tnum w-full rounded-box border border-line-strong bg-canvas px-2 py-1.5 text-body text-fg outline-none focus:border-ai"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-badge font-semibold text-fg-muted">
            촬영 작가
          </span>
          <select
            value={photographer}
            onChange={(e) => setPhotographer(e.target.value)}
            className="w-full rounded-box border border-line-strong bg-canvas px-2 py-1.5 text-body text-fg outline-none focus:border-ai"
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
        <p className="rounded-box bg-surface px-3 py-2 text-badge leading-[16px] text-fg-muted">
          {acc.name}의 시설 정보에서 필수 컷{" "}
          <span className="tnum font-semibold text-fg">{shotList.length}</span>항목 (
          <span className="tnum font-semibold text-fg">{requiredCuts}</span>컷)이
          촬영 체크리스트로 함께 만들어집니다.
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={() => {
            if (!accId || !date) return;
            const created = store.addContent({
              accommodationId: accId,
              shootDate: date,
              photographer,
            });
            onCreated(created.id);
          }}
          disabled={!accId || !date}
        >
          촬영 일정 등록
        </Button>
        {onCancel ? (
          <Button variant="quiet" onClick={onCancel}>
            취소
          </Button>
        ) : null}
      </div>
    </div>
  );
}
