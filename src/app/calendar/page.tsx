"use client";

import { CalendarBoard } from "@/components/CalendarBoard";
import { Explain, PageHeader } from "@/components/PageHeader";

export default function CalendarPage() {
  return (
    <div>
      <PageHeader
        title="촬영 캘린더"
        purpose="앞으로 할 촬영을 날짜 기준으로 보는 화면입니다. 날씨나 숙소 사정으로 밀린 일정을 다시 잡을 때 씁니다. 현황판이 지금 진행 중인 건을 본다면, 캘린더는 아직 시작하지 않은 일정을 봅니다."
      />
      <div className="space-y-4 p-4 lg:p-6">
        <Explain label="이 화면">
          빈 날짜를 클릭하면 그 자리에서 촬영 일정을 등록합니다. 날짜를 먼저 정하는
          사람의 사고 흐름에 맞춘 경로이고, 숙소 관리에서 숙소를 저장한 직후에도 같은
          폼으로 등록할 수 있습니다. 어느 쪽으로 등록하든 같은 촬영 건이 만들어지고
          현황판 보드에 나타납니다.
        </Explain>
        <CalendarBoard />
      </div>
    </div>
  );
}
