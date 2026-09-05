import { AccommodationManager } from "@/components/AccommodationManager";
import { PageHeader } from "@/components/PageHeader";
import { ACCOMMODATIONS } from "@/data/accommodations";

export default function AccommodationsPage() {
  return (
    <div>
      <PageHeader
        title="숙소 관리"
        description="시설 정보를 입력하면 촬영 필수 컷 목록이 자동으로 만들어집니다. 촬영팀이 매번 체크리스트를 새로 쓰지 않게 하는 것이 목적입니다."
      />
      <div className="p-4 lg:p-6">
        <AccommodationManager list={ACCOMMODATIONS} />
      </div>
    </div>
  );
}
