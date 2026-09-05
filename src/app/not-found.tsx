import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-6">
      <h1 className="text-page font-semibold text-fg">찾을 수 없는 페이지입니다</h1>
      <p className="mt-1 text-body text-fg-muted">
        주소가 바뀌었거나 존재하지 않는 콘텐츠입니다.
      </p>
      <Link
        href="/"
        className="mt-3 inline-block rounded-box border border-line-strong bg-surface px-2.5 py-1 text-body font-medium text-fg"
      >
        대시보드로 이동
      </Link>
    </div>
  );
}
