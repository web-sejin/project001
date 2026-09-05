"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "default" | "quiet" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "border-ai bg-ai text-white hover:bg-[#5B3691]",
  default: "border-line-strong bg-canvas text-fg hover:bg-surface",
  quiet: "border-transparent bg-transparent text-fg-muted hover:text-fg",
  danger: "border-line-strong bg-canvas text-danger hover:bg-surface",
};

const SIZES: Record<Size, string> = {
  sm: "px-2 py-1 text-badge",
  md: "px-3 py-1.5 text-body",
};

export function Button({
  variant = "default",
  size = "md",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      type="button"
      {...rest}
      className={`rounded-box border font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    />
  );
}
