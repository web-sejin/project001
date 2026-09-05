import { CalendarBoard, type CalendarEvent } from "@/components/CalendarBoard";
import { PageHeader } from "@/components/PageHeader";
import { getAccommodation } from "@/data/accommodations";
import { CONTENTS, TODAY } from "@/data/contents";

export default function CalendarPage() {
  const events: CalendarEvent[] = CONTENTS.map((c) => ({
    id: c.id,
    date: c.shootDate,
    name: getAccommodation(c.accommodationId)?.name ?? c.accommodationId,
    photographer: c.photographer,
    status: c.status,
    reshoot: c.reshootCount,
  }));

  return (
    <div>
      <PageHeader
        title="촬영 캘린더"
        description="날씨나 숙소 사정으로 밀린 일정을 다시 잡는 화면입니다. 파이프라인이 현재를 본다면 캘린더는 앞으로 할 일을 봅니다."
      />
      <div className="p-4 lg:p-6">
        <CalendarBoard
          events={events}
          today={TODAY}
          initialYear={2026}
          initialMonth={9}
        />
        <p className="mt-3 text-badge leading-[16px] text-fg-subtle">
          일정 카드를 클릭하면 해당 콘텐츠 상세로 이동합니다. 담당자 배정과 리마인드
          알림은 조건 분기와 스케줄러로 처리하는 영역이라 AI를 쓰지 않습니다.
        </p>
      </div>
    </div>
  );
}
