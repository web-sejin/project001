"use client";

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
      className={`relative h-[18px] w-8 shrink-0 rounded-full border transition-colors duration-150 ${
        checked ? "border-ai bg-ai" : "border-line-strong bg-line"
      }`}
    >
      <span
        className={`absolute top-[2px] h-3 w-3 rounded-full bg-canvas transition-transform duration-150 ${
          checked ? "translate-x-[16px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}
