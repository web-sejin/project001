"use client";

import { CalendarBoard } from "@/components/CalendarBoard";
import { PageHeader } from "@/components/PageHeader";

export default function CalendarPage() {
  return (
    <div>
      <PageHeader
        title="촬영 캘린더"
        purpose="앞으로 할 촬영을 날짜 기준으로 봅니다. 밀린 일정을 다시 잡을 때 씁니다."
      />
      <div className="p-4 lg:p-6">
        <CalendarBoard />
      </div>
    </div>
  );
}
