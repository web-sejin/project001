"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * 모달.
 *
 * 라이브러리를 쓰지 않는다. 필요한 건 배경 클릭·Esc로 닫기, 포커스 이동,
 * 배경 스크롤 잠금 정도다.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  width = "560px",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  footer?: ReactNode;
  width?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="dialog-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-fg/40 p-4 sm:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={{ maxWidth: width }}
        className="w-full rounded-box border border-line-strong bg-canvas shadow-[0_12px_32px_rgba(30,25,50,0.22)] outline-none"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line-strong bg-surface px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-section font-semibold text-fg">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-badge leading-[18px] text-fg-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 rounded-box border border-line-strong bg-canvas px-2 py-1 text-badge text-fg-muted hover:text-fg"
          >
            닫기
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto">{children}</div>

        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line-strong bg-surface px-4 py-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
