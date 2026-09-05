"use client";

import { TierBadge } from "@/components/AxNote";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { AX_IDEAS, TIER_DEF, axKind } from "@/data/ax";
import { STAGES } from "@/data/types";

const FUNNEL = [
  { label: "촬영 원본", count: 800, note: "프리뷰 기준", tier: null, time: null },
  {
    label: "결함 필터",
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
    label: "공간 분류 · 대표 컷",
    count: 82,
    note: "중복 그룹은 대표 1장만 분류 후 상속",
    tier: "LLM 비전",
    time: "2분 18초",
  },
] as const;

const STAGE_ORDER = [...STAGES.map((s) => s.key), "전 구간", "확장"] as const;

const STAGE_TITLE: Record<string, string> = {
  촬영: "1. 촬영 일정 관리",
  업로드: "2. 촬영 사진 업로드",
  보정검수: "3. 사진 보정 및 검수",
  발행: "4. 채널별 콘텐츠 업로드",
  "전 구간": "전 구간",
  확장: "확장 아이디어",
};

export default function AxPage() {
  const maxCount = FUNNEL[0].count;
  const notAi = AX_IDEAS.filter((i) => axKind(i) === "자동화").length;

  return (
    <div>
      <PageHeader
        title="AX 관점 아이디어"
        purpose="업무 흐름의 각 단계에 AI 또는 자동화를 어디에 넣을지, 그리고 어디에 넣지 않을지 정리했습니다."
      />

      <div className="max-w-4xl space-y-6 p-4 lg:p-6">
        <Panel className="border-ai-line">
          <div className="bg-ai-bg p-4">
            <h2 className="text-section font-semibold text-fg">
              관리 화면에는 AI를 넣지 않았습니다
            </h2>
            <p className="mt-1.5 text-body leading-[21px] text-fg-muted">
              보드, 캘린더, 상태 배지, 정체 일수, 발행 링크 기록은 전부 쿼리와 조건
              분기입니다. 여기에 AI를 붙이면 억지입니다. AI는{" "}
              <span className="font-semibold text-fg">
                관리 대상인 노동 안에 있고
              </span>
              , 관리 화면은 그 결과를 신호로 띄웁니다. 왼쪽 토글을 끄면 지금 쓰고 있을
              법한 화면이 되고, 켜면 어디에 무엇을 얹을지가 보입니다.
            </p>
          </div>
        </Panel>

        <section>
          <h2 className="text-section font-semibold text-fg">수단 층위 정의</h2>
          <p className="mt-1 text-body leading-[21px] text-fg-muted">
            &ldquo;AI로 처리합니다&rdquo;가 실제로는 서로 다른 네 가지를 가리킵니다.
            비용도 운영 방식도 다르므로 구분해서 씁니다.
          </p>
          <Panel className="mt-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-body">
                <thead>
                  <tr className="bg-surface text-left">
                    <Th className="w-28">층위</Th>
                    <Th>무엇인가</Th>
                    <Th className="w-56">실제 도구</Th>
                    <Th className="w-40">비용</Th>
                  </tr>
                </thead>
                <tbody>
                  {(["연산", "전용 모델", "LLM 비전", "LLM", "AI 아님"] as const).map(
                    (tier) => (
                      <tr key={tier} className="border-b border-line align-top">
                        <td className="px-2.5 py-2">
                          <TierBadge tier={tier} />
                        </td>
                        <td className="px-2.5 py-2 leading-[21px] text-fg">
                          {TIER_DEF[tier].what}
                        </td>
                        <td className="px-2.5 py-2 leading-[21px] text-fg-muted">
                          {TIER_DEF[tier].tools}
                        </td>
                        <td className="px-2.5 py-2 leading-[21px] text-fg-muted">
                          {TIER_DEF[tier].cost}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line bg-surface px-4 py-2.5">
              <p className="flex flex-wrap items-center gap-2 text-badge leading-[18px] text-fg-muted">
                <span className="inline-flex items-center gap-1 rounded-box border border-ai-line bg-ai-bg px-1.5 py-0.5 font-semibold text-ai">
                  AI를 씁니다
                </span>
                LLM · LLM 비전 · 전용 모델
                <span className="inline-flex items-center gap-1 rounded-box border border-auto-line bg-auto-bg px-1.5 py-0.5 font-semibold text-auto">
                  자동화 (AI 아님)
                </span>
                순수 연산 · 규칙
              </p>
            </div>
          </Panel>
        </section>

        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-section font-semibold text-fg">단계별 개선 지점</h2>
            <p className="text-badge text-fg-muted">
              <span className="tnum font-semibold text-fg">{AX_IDEAS.length}</span>개 중{" "}
              <span className="tnum font-semibold text-fg">{notAi}</span>개는 AI를 쓰지
              않습니다
            </p>
          </div>

          <div className="mt-3 space-y-4">
            {STAGE_ORDER.map((stageKey) => {
              const ideas = AX_IDEAS.filter((i) => i.stage === stageKey);
              if (ideas.length === 0) return null;
              return (
                <Panel key={stageKey}>
                  <PanelHeader title={STAGE_TITLE[stageKey]} />
                  <ul className="divide-y divide-line">
                    {ideas.map((idea) => (
                      <li key={idea.id} className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-body font-semibold text-fg">
                            {idea.title}
                          </h3>
                          {idea.tiers.map((t) => (
                            <TierBadge key={t} tier={t} means={idea.means[t]} />
                          ))}
                        </div>

                        <dl className="mt-2 space-y-1.5 text-body">
                          <div className="flex gap-2">
                            <dt className="w-14 shrink-0 text-fg-subtle">지금</dt>
                            <dd className="min-w-0 flex-1 leading-[21px] text-fg-muted">
                              {idea.asIs}
                            </dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-14 shrink-0 text-fg-subtle">개선 후</dt>
                            <dd className="min-w-0 flex-1 leading-[21px] text-fg">
                              {idea.toBe}
                            </dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-14 shrink-0 text-fg-subtle">근거</dt>
                            <dd className="min-w-0 flex-1 leading-[21px] text-fg-muted">
                              {idea.why}
                            </dd>
                          </div>
                        </dl>
                      </li>
                    ))}
                  </ul>
                </Panel>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-section font-semibold text-fg">처리 순서가 비용입니다</h2>
          <p className="mt-1 text-body leading-[21px] text-fg-muted">
            800장을 전부 큰 AI에 던지면 비용과 시간이 몇 배가 됩니다. 앞단에서 싼
            방법으로 걸러내고, 의미 판단이 필요한 것만 넘깁니다. 아래 숫자는 한 건에
            800장을 찍었다고 가정한 예시이며, 실제 비율은 촬영 습관에 따라 달라집니다.
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
                      className={
                        i === FUNNEL.length - 1 ? "h-full bg-ai" : "h-full bg-line-strong"
                      }
                      style={{ width: `${(f.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-badge text-fg-subtle">{f.note}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-line bg-surface p-4">
              <h3 className="text-body font-semibold text-fg">한 건당 실제 비용</h3>
              <p className="mt-1 text-badge leading-[18px] text-fg-muted">
                중복 제거 후 남은 346장을 긴 변 768px로 줄여 분류할 때입니다. 라벨링은
                실시간일 이유가 없어 배치로 돌리면 절반입니다. 반복되는 분류 기준은
                프롬프트 캐싱으로 다시 줄어듭니다.
              </p>
              <table className="mt-2 w-full border-collapse text-body">
                <thead>
                  <tr className="text-left text-badge text-fg-muted">
                    <th className="border-b border-line py-1.5 font-semibold">모델</th>
                    <th className="border-b border-line py-1.5 text-right font-semibold">
                      즉시 처리
                    </th>
                    <th className="border-b border-line py-1.5 text-right font-semibold">
                      배치 처리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-b border-line py-1.5 text-fg">Haiku 4.5</td>
                    <td className="tnum border-b border-line py-1.5 text-right text-fg-muted">
                      약 $0.45
                    </td>
                    <td className="tnum border-b border-line py-1.5 text-right font-semibold text-fg">
                      약 $0.23
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-fg">Sonnet 5</td>
                    <td className="tnum py-1.5 text-right text-fg-muted">약 $0.90</td>
                    <td className="tnum py-1.5 text-right text-fg-muted">약 $0.45</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-2 text-badge leading-[18px] text-fg-subtle">
                한 건당 300~600원, 월 30건이면 만 원 안팎입니다. 이미지 토큰은 해상도에
                비례하므로 실제 값은 측정이 필요하고, 위 숫자는 자릿수 감각용입니다.
              </p>
            </div>
          </Panel>
        </section>

        <section>
          <h2 className="text-section font-semibold text-fg">AI가 못 하는 것</h2>
          <p className="mt-1 text-body leading-[21px] text-fg-muted">
            할 수 있는 것만 적으면 못 하는 게 뭔지 안 보입니다. 판정할 수 없는 걸
            체크리스트에 넣으면 충족 여부가 거짓이 됩니다.
          </p>
          <Panel className="mt-3">
            <ul className="divide-y divide-line text-body">
              <li className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-fg">객실 등급 · 호수 구분</h3>
                  <Badge variant="danger">판정 불가</Badge>
                </div>
                <p className="mt-1 leading-[21px] text-fg-muted">
                  스탠다드룸인지 디럭스룸인지는 그 숙소가 정한 상품명이지 시각적
                  속성이 아닙니다. 같은 숙소의 객실 두 장을 놓고 어느 쪽이 몇 번인지
                  가릴 근거가 이미지에 없습니다. 그래서 체크리스트를{" "}
                  <span className="font-medium text-fg">
                    객실 5컷 × 객실 수
                  </span>{" "}
                  로 합산해서 관리합니다.
                </p>
                <p className="mt-1.5 leading-[21px] text-fg-muted">
                  확인해 주는 것은 &ldquo;객실로 분류된 컷이 10장 있다&rdquo;까지이고,
                  그 10장이 두 객실에 고르게 퍼졌는지는 판정하지 못합니다. 그건
                  촬영자가 챙겨야 합니다.
                </p>
              </li>
            </ul>
          </Panel>
        </section>

        <section>
          <h2 className="text-section font-semibold text-fg">도입 전 확인할 것</h2>
          <Panel className="mt-3">
            <ul className="divide-y divide-line text-body">
              <li className="px-4 py-2.5 leading-[21px] text-fg-muted">
                이 목업의 보정 4.2일과 재촬영 4회는 가정한 숫자입니다. 실제 로그를
                집계해야 병목이 정말 보정 구간인지 확인됩니다.
              </li>
              <li className="px-4 py-2.5 leading-[21px] text-fg-muted">
                이 목업은 촬영을 마치고 복귀한 뒤 사무실에서 업로드한다고 가정했습니다.
                현장에서 바로 올릴 수 있는 조건이라면 발견 시점을 더 당길 수 있습니다.
              </li>
              <li className="px-4 py-2.5 leading-[21px] text-fg-muted">
                이미 쓰는 시스템이 있다면 갈아엎지 않고 AI 처리 계층만 붙이는 쪽이
                맞습니다.
              </li>
            </ul>
          </Panel>
        </section>

        <section className="rounded-box border border-line-strong bg-surface p-4">
          <h2 className="text-body font-semibold text-fg">이 목업의 범위</h2>
          <p className="mt-1 text-body leading-[21px] text-fg-muted">
            서버, DB, 로그인, 실제 AI 호출은 구현하지 않았습니다. 화면의 AI 결과는 위에
            적은 방식이 내놓을 출력의 형태를 더미 데이터로 재현한 것이며,{" "}
            <Badge variant="ai">AI 결과 (모의)</Badge> 배지로 구분했습니다. 사진은
            라벨명이 적힌 회색 자리표시자입니다.
          </p>
        </section>
      </div>
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
