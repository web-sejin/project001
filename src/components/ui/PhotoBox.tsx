import { hashSeed } from "@/lib/rand";

/**
 * 사진 자리표시자.
 *
 * 실제 이미지 대신 라벨이 적힌 회색 박스를 그린다.
 * 목업에 스톡 사진을 채워 넣으면 "AI 라벨링 결과"인지
 * "사람이 고른 예쁜 사진"인지 구분이 안 된다.
 */
export function PhotoBox({
  id,
  label,
  aspect = "4/3",
  variant = "raw",
  className = "",
}: {
  id: string;
  label: string;
  aspect?: string;
  variant?: "raw" | "retouched";
  className?: string;
}) {
  const h = hashSeed(id);
  const light = 80 + (h % 11);
  const hue = 30 + (h % 20);
  const bg =
    variant === "retouched"
      ? `hsl(${hue} 10% ${Math.min(93, light + 5)}%)`
      : `hsl(${hue} 4% ${light}%)`;

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-box border border-line ${className}`}
      style={{ aspectRatio: aspect, backgroundColor: bg }}
    >
      <span className="px-1 text-center text-badge font-medium text-fg-subtle">
        {label}
      </span>
    </div>
  );
}
