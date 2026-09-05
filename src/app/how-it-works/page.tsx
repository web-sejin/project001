import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { CHANNELS } from "@/data/contents";

const AS_IS = [
  {
    stage: "촬영 일정",
    visible: "캘린더 관리",
    pain: "날씨·숙소 사정으로 밀린 일정을 매번 다시 조율한다",
  },
  {
    stage: "사진 업로드",
    visible: "파일 올리기",
    pain: "800~1000장 중 쓸 컷 셀렉. 그리고 촬영 누락을 너무 늦게 발견한다",
  },
  {
    stage: "보정 · 검수",
    visible: "리터처 작업",
    pain: "반려 사유가 카톡에 흩어진다. 리터처별로 톤이 갈린다. 왕복이 길다",
  },
  {
    stage: "채널 업로드",
    visible: "각 채널에 올리기",
    pain: "채널마다 규격·장수·문구 톤이 달라 같은 일을 4~6번 반복한다",
  },
];

const FUNNEL = [
  { label: "촬영 원본", count: 800, note: "프리뷰 기준", tier: null, time: null },
  {
    label: "기술적 결함 필터",
    count: 758,
    note: "흔들림 34 · 노출 오류 8 제외",
    tier: "연산",
    time: "3초",
  },
  {
    label: "중복 제거",
    count: 346,
    note: "유사 컷 412 제외",
    tier: "전용 모델",
    time: "41초",
  },
  {
    label: "공간 라벨링 · 대표 컷",
    count: 82,
    note: "중복 그룹은 대표 1장만 라벨링 후 상속",
    tier: "LLM 비전",
    time: "2분 18초",
  },
];

const TOOLS = [
  { task: "흔들림 · 초점 검출", tier: "연산", how: "라플라시안 분산 (엣지 선명도)" },
  { task: "노출 오류", tier: "연산", how: "히스토그램 분석" },
  { task: "색온도 편차", tier: "연산", how: "RGB 평균값 비교" },
  { task: "수평 틀어짐", tier: "연산", how: "허프 변환 직선 검출 후 각도 계산" },
  { task: "중복 · 유사 컷", tier: "전용 모델", how: "임베딩 코사인 유사도 (CLIP 계열)" },
  { task: "스마트 크롭", tier: "전용 모델", how: "객체 검출 후 피사체 영역 계산" },
  { task: "눈감음 검출", tier: "전용 모델", how: "얼굴 랜드마크" },
  { task: "공간 라벨링", tier: "LLM 비전", how: "숙소마다 공간 구성이 달라 고정 클래스로 부족" },
  {
    task: "객실 등급 · 호수 구분",
    tier: "불가",
    how: "같은 숙소의 침실 두 장에 시각적 차이가 없다. 체크리스트에서 뺐다",
  },
  { task: "촬영 누락 판단", tier: "LLM 비전", how: "라벨링 결과 + 체크리스트 대조" },
  { task: "채널별 카피 생성", tier: "LLM", how: "채널 톤 프로필 기반 초안" },
  { task: "담당자 배정 · 리마인드", tier: "AI 아님", how: "조건 분기 + 스케줄러" },
  { task: "병목 대시보드", tier: "AI 아님", how: "쿼리 / 집계" },
  { task: "채널별 리사이즈", tier: "AI 아님", how: "이미지 처리 라이브러리" },
  { task: "필수 컷 대조", tier: "AI 아님", how: "배열 차집합" },
];

const STORAGE = [
  {
    target: "RAW 원본",
    where: "콜드 스토리지 (S3 Glacier · NAS)",
    use: "보관. 거의 꺼내지 않는다",
    size: "장당 25~50MB",
  },
  {
    target: "프리뷰 (긴 변 2048px)",
    where: "오브젝트 스토리지",
    use: "검수 화면",
    size: "장당 약 1MB",
  },
  {
    target: "썸네일 (400px)",
    where: "CDN",
    use: "목록 · 그리드",
    size: "장당 약 60KB",
  },
];

const EFFECTS = [
  {
    layer: "시간 단축",
    body: "라벨 분류, 1차 보정 검수, 채널 변환이 자동화된다. 사람은 판단만 한다.",
    common: true,
  },
  {
    layer: "낭비 제거",
    body: "촬영 누락을 현장에서 잡아 재촬영 자체를 없앤다. 재방문 협의와 일정 재조정이 사라진다.",
    common: false,
  },
  {
    layer: "품질 균일화",
    body: "리터처가 달라도 색온도·밝기 편차가 측정되고 관리된다.",
    common: false,
  },
  {
    layer: "가시성 확보",
    body: "어느 단계가 병목인지 숫자로 드러난다. 보정 4.2일이라는 사실을 아무도 몰랐다면 개선할 대상도 없다.",
    common: false,
  },
];

function TierBadge({ tier }: { tier: string }) {
  if (tier === "불가") return <Badge variant="danger">판정 불가</Badge>;
  if (tier === "AI 아님") return <Badge variant="neutral">AI 아님</Badge>;
  if (tier === "LLM 비전" || tier === "LLM") return <Badge variant="ai">{tier}</Badge>;
  return <Badge variant="outline">{tier}</Badge>;
}

export default function HowItWorksPage() {
  const maxCount = FUNNEL[0].count;

  return (
    <div>
      <PageHeader
        title="처리 구조"
        purpose="화면을 이렇게 만든 근거를 정리한 문서 화면입니다. 어디가 병목이고, 각 지점에 어떤 수단을 왜 골랐는지 — 특히 어디에 AI를 쓰고 어디에 안 썼는지를 밝힙니다."
      />

      <div className="max-w-4xl space-y-6 p-4 lg:p-6">
        <section>
          <h2 className="text-section font-semibold text-fg">0. 화면 구성</h2>
          <p className="mt-1 text-body text-fg-muted">
            운영 화면과 기준 정보 화면을 나눴습니다. 기준 정보는 등록 순서대로 세워
            둡니다.
          </p>
          <Panel className="mt-3">
            <ul className="divide-y divide-line text-body">
              <li className="px-4 py-2.5">
                <span className="font-semibold text-fg">시설 관리</span>
                <span className="ml-2 text-fg-muted">
                  촬영 필수 컷 규칙을 정의합니다. 이 시스템에서 자동화의 출발점입니다.
                </span>
              </li>
              <li className="px-4 py-2.5">
                <span className="font-semibold text-fg">숙소 관리</span>
                <span className="ml-2 text-fg-muted">
                  숙소가 보유한 시설을 고르면 체크리스트가 전개되고, 저장 직후 촬영
                  일정까지 등록합니다.
                </span>
              </li>
              <li className="px-4 py-2.5">
                <span className="font-semibold text-fg">촬영 캘린더</span>
                <span className="ml-2 text-fg-muted">
                  날짜를 먼저 정하는 경로. 빈 날짜를 클릭해도 같은 촬영 건이
                  만들어집니다.
                </span>
              </li>
              <li className="px-4 py-2.5">
                <span className="font-semibold text-fg">현황판</span>
                <span className="ml-2 text-fg-muted">
                  등록된 촬영 건의 진행 상태와 병목을 봅니다. 지표와 보드를 한 화면에
                  둬서 &ldquo;정체 3건&rdquo;에서 바로 그 건으로 내려갈 수 있게 했습니다.
                </span>
              </li>
              <li className="px-4 py-2.5">
                <span className="font-semibold text-fg">콘텐츠 상세</span>
                <span className="ml-2 text-fg-muted">
                  촬영 → 업로드·분류 → 보정·검수 → 발행. 업무 흐름 네 단계가 그대로 탭
                  네 개입니다.
                </span>
              </li>
            </ul>
          </Panel>
        </section>

        <section>
          <h2 className="text-section font-semibold text-fg">1. 지금의 흐름과 병목</h2>
          <p className="mt-1 text-body text-fg-muted">
            촬영 일정 관리 → 촬영 사진 업로드 → 사진 보정 및 검수 → 채널별 콘텐츠 업로드.
            겉으로 보이는 일과 실제 고통이 다릅니다.
          </p>
          <Panel className="mt-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-body">
                <thead>
                  <tr className="bg-surface text-left text-fg-muted">
                    <th className="border-b border-line px-2.5 py-2 font-medium">단계</th>
                    <th className="border-b border-line px-2.5 py-2 font-medium">
                      겉으로 보이는 일
                    </th>
                    <th className="border-b border-line px-2.5 py-2 font-medium">
                      실제 고통
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {AS_IS.map((r) => (
                    <tr key={r.stage}>
                      <td className="border-b border-line px-2.5 py-2 font-medium text-fg">
                        {r.stage}
                      </td>
                      <td className="border-b border-line px-2.5 py-2 text-fg-muted">
                        {r.visible}
                      </td>
                      <td className="border-b border-line px-2.5 py-2 text-fg">
                        {r.pain}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="mt-3 rounded-box border border-danger/30 bg-[#FBEBEB] p-3">
            <p className="text-body font-medium text-danger">최악의 시나리오</p>
            <p className="mt-1 text-body leading-[19px] text-fg">
              편집 단계에서 &ldquo;화장실 컷이 없네&rdquo;를 발견하는 것. 이 시점엔
              촬영팀이 철수했고, 숙소 재방문 협의를 다시 해야 하고, 며칠이 날아갑니다.
              이 시스템의 1차 목표는 그 발견 시점을 촬영 현장으로 당기는 것입니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-section font-semibold text-fg">2. 3층 처리 파이프라인</h2>
          <p className="mt-1 text-body text-fg-muted">
            LLM에 도달하기 전에 대상을 최대한 줄입니다. 800장을 전부 LLM에 던지면 비용과
            시간이 몇 배가 됩니다. 앞단에서 싼 방법으로 걸러내고, 비싼 판단만 넘깁니다.
          </p>

          <Panel className="mt-3">
            <div className="space-y-3 p-4">
              {FUNNEL.map((f, i) => (
                <div key={f.label}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-body font-medium text-fg">
                      {f.label}
                      {f.tier ? <TierBadge tier={f.tier} /> : null}
                    </span>
                    <span className="tnum text-body text-fg-muted">
                      {f.count}장{f.time ? ` · ${f.time}` : ""}
                    </span>
                  </div>
                  <div className="mt-1 h-3 w-full overflow-hidden rounded-box bg-surface">
                    <div
                      className={i === FUNNEL.length - 1 ? "h-full bg-ai" : "h-full bg-line-strong"}
                      style={{ width: `${(f.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-badge text-fg-subtle">{f.note}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-line bg-surface px-4 py-2.5">
              <p className="text-badge leading-[16px] text-fg-muted">
                마지막에 체크리스트와 대조하는 것은 단순 배열 비교입니다. 그리고 LLM에
                넘기는 이미지는 원본이 아니라 축소본(512~768px)입니다. 라벨링에 4000px이
                필요 없고, 토큰 비용은 해상도에 비례합니다.
              </p>
            </div>
          </Panel>
        </section>

        <section>
          <h2 className="text-section font-semibold text-fg">3. 수단 선정 근거</h2>
          <p className="mt-1 text-body text-fg-muted">
            &ldquo;AI가 처리합니다&rdquo;로 뭉뚱그리지 않습니다. 수단이 세 층위로
            나뉘고, 어떤 것은 아예 AI가 아니며, 애초에 판정이 불가능한 것도 있습니다.
          </p>
          <Panel className="mt-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-body">
                <thead>
                  <tr className="bg-surface text-left text-fg-muted">
                    <th className="border-b border-line px-2.5 py-2 font-medium">기능</th>
                    <th className="border-b border-line px-2.5 py-2 font-medium">층위</th>
                    <th className="border-b border-line px-2.5 py-2 font-medium">수단</th>
                  </tr>
                </thead>
                <tbody>
                  {TOOLS.map((t) => (
                    <tr key={t.task} className="h-9">
                      <td className="border-b border-line px-2.5 text-fg">{t.task}</td>
                      <td className="border-b border-line px-2.5">
                        <TierBadge tier={t.tier} />
                      </td>
                      <td className="border-b border-line px-2.5 text-fg-muted">
                        {t.how}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>

        <section>
          <h2 className="text-section font-semibold text-fg">4. 저장 계층 분리</h2>
          <p className="mt-1 text-body text-fg-muted">
            RAW는 장당 25~50MB입니다. 한 건에 800장이면 20~40GB, 월 30건이면{" "}
            <span className="font-medium text-fg">월 600GB~1.2TB</span>. 일반 웹서버
            디스크로는 불가능한 규모입니다.
          </p>
          <Panel className="mt-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-body">
                <thead>
                  <tr className="bg-surface text-left text-fg-muted">
                    <th className="border-b border-line px-2.5 py-2 font-medium">대상</th>
                    <th className="border-b border-line px-2.5 py-2 font-medium">저장 위치</th>
                    <th className="border-b border-line px-2.5 py-2 font-medium">용도</th>
                    <th className="border-b border-line px-2.5 py-2 font-medium">크기</th>
                  </tr>
                </thead>
                <tbody>
                  {STORAGE.map((s) => (
                    <tr key={s.target} className="h-9">
                      <td className="border-b border-line px-2.5 text-fg">{s.target}</td>
                      <td className="border-b border-line px-2.5 text-fg-muted">
                        {s.where}
                      </td>
                      <td className="border-b border-line px-2.5 text-fg-muted">{s.use}</td>
                      <td className="tnum border-b border-line px-2.5 text-fg-muted">
                        {s.size}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line px-4 py-2.5">
              <p className="text-badge leading-[16px] text-fg-muted">
                웹 시스템은 프리뷰와 썸네일만 다룹니다. DB에는 경로와 메타데이터만
                저장합니다. 업로드도 브라우저가 presigned URL로 스토리지에 직접 올려
                웹서버를 거치지 않습니다. 24GB를 올리는 데 걸리는 30분은 어떤 기술로도
                줄일 수 없어서, 현장에서는 RAW+JPG 동시 저장의 JPG(총 4GB)만 먼저
                올립니다. 이것이 현장 모드를 기술적으로 성립시키는 근거입니다.
              </p>
            </div>
          </Panel>
        </section>

        <section>
          <h2 className="text-section font-semibold text-fg">5. 채널별 발행 가능 여부</h2>
          <p className="mt-1 text-body text-fg-muted">
            실제 API 정책을 조사한 결과입니다. 되는 것과 안 되는 것을 구분해 두지 않으면
            도입 후에 계획이 무너집니다.
          </p>
          <Panel className="mt-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-body">
                <thead>
                  <tr className="bg-surface text-left text-fg-muted">
                    <th className="border-b border-line px-2.5 py-2 font-medium">채널</th>
                    <th className="border-b border-line px-2.5 py-2 font-medium">자동 발행</th>
                    <th className="border-b border-line px-2.5 py-2 font-medium">방식</th>
                  </tr>
                </thead>
                <tbody>
                  {CHANNELS.map((ch) => (
                    <tr key={ch.id}>
                      <td className="border-b border-line px-2.5 py-2 text-fg">
                        {ch.name}
                      </td>
                      <td className="border-b border-line px-2.5 py-2">
                        <Badge
                          variant={
                            ch.publishMode === "자동 발행"
                              ? "success"
                              : ch.publishMode === "심사 필요"
                                ? "warn"
                                : "neutral"
                          }
                        >
                          {ch.publishMode}
                        </Badge>
                      </td>
                      <td className="border-b border-line px-2.5 py-2 text-fg-muted">
                        {ch.apiNote}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line bg-surface px-4 py-2.5">
              <p className="text-badge leading-[16px] text-fg-muted">
                자동 발행이 안 되는 채널이 있어도 가치는 대부분 유지됩니다. 진짜 반복
                노동은 업로드 버튼을 누르는 것이 아니라 채널마다 사진을 자르고 고르고
                문구를 쓰는 것이고, 그 부분은 API 없이도 전부 자동화됩니다.
              </p>
            </div>
          </Panel>
        </section>

        <section>
          <h2 className="text-section font-semibold text-fg">6. 기대 효과</h2>
          <p className="mt-1 text-body text-fg-muted">
            시간 단축만 말하면 다른 제안과 구분되지 않습니다. 네 층위로 나눕니다.
          </p>
          <div className="mt-3 grid gap-px overflow-hidden rounded-box border border-line bg-line sm:grid-cols-2">
            {EFFECTS.map((e) => (
              <div key={e.layer} className="bg-canvas p-4">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-body font-semibold text-fg">{e.layer}</h3>
                  {!e.common ? <Badge variant="success">차별점</Badge> : null}
                </div>
                <p className="mt-1 text-body leading-[19px] text-fg-muted">{e.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-section font-semibold text-fg">7. 실제 도입 시</h2>
          <Panel className="mt-3">
            <PanelHeader title="아키텍처 판단" />
            <ul className="divide-y divide-line text-body">
              <li className="px-4 py-2.5 leading-[19px] text-fg-muted">
                기존 시스템이 있다면 갈아엎지 않습니다. AI 처리 계층만 분리해 HTTP로
                연결합니다.
              </li>
              <li className="px-4 py-2.5 leading-[19px] text-fg-muted">
                이미지 처리(EXIF 파싱, 리사이즈, 유사도 기반 중복 제거, 색온도 편차
                검출)는 Python 워커로 분리하고 큐로 연결합니다. 대량 배치가 웹 응답을
                막지 않게 하기 위해서입니다.
              </li>
              <li className="px-4 py-2.5 leading-[19px] text-fg-muted">
                DB를 직접 노출하는 대신 API 계층을 둡니다. 서버리스는 요청마다 커넥션이
                새로 열려 커넥션 고갈 위험이 있습니다.
              </li>
              <li className="px-4 py-2.5 leading-[19px] text-fg">
                새 언어·새 스택을 쓸 줄 아는 것보다, 안 쓸 때를 판단하는 게 도입
                담당자의 역할입니다.
              </li>
            </ul>
          </Panel>

          <Panel className="mt-3">
            <PanelHeader title="확장 아이디어" />
            <ul className="divide-y divide-line text-body">
              <li className="px-4 py-2.5 leading-[19px] text-fg-muted">
                반려 사유가 쌓이면 패턴이 보입니다. LLM으로 요약해 리터처별 가이드를
                만들면 반려 자체가 줄어듭니다.
              </li>
              <li className="px-4 py-2.5 leading-[19px] text-fg-muted">
                촬영 누락 현장 감지와 같은 방향입니다. 사후 처리에서 사전 예방으로
                넘어가는 사례입니다.
              </li>
            </ul>
          </Panel>
        </section>

        <section className="rounded-box border border-line bg-surface p-4">
          <h2 className="text-body font-semibold text-fg">이 목업의 범위</h2>
          <p className="mt-1 text-body leading-[19px] text-fg-muted">
            서버, DB, 로그인, 실제 AI API 호출은 구현하지 않았습니다. 화면에 보이는 AI
            결과는 위에 적은 파이프라인이 실제로 내놓을 출력의 형태를 더미 데이터로
            재현한 것입니다. 어디까지가 확정된 로직이고 어디부터가 가정인지 구분되도록{" "}
            <Badge variant="ai">AI 결과 (모의)</Badge> 배지를 붙였습니다.
          </p>
        </section>
      </div>
    </div>
  );
}
