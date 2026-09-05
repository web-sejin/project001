"use client";

/**
 * 노브를 absolute 로 띄우면 테두리 두께 때문에 정렬이 어긋난다.
 * flex 로 세로 정렬하고 가로만 transform 으로 움직인다.
 */
export function Toggle({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  id: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-[18px] w-8 shrink-0 items-center rounded-full border px-[2px] transition-colors duration-150 ${
        checked ? "border-ai bg-ai" : "border-line-strong bg-line"
      }`}
    >
      <span
        className={`block h-3 w-3 rounded-full bg-white transition-transform duration-150 ${
          checked ? "translate-x-[14px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}
