"use client";

import type { ButtonHTMLAttributes } from "react";

interface AsyncActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onClick"> {
  idleLabel: string;
  pendingLabel: string;
  pending: boolean;
  onClick: () => void | Promise<void>;
}

export function AsyncActionButton({
  disabled,
  idleLabel,
  onClick,
  pending,
  pendingLabel,
  type = "button",
  ...buttonProps
}: AsyncActionButtonProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      disabled={pending || disabled}
      onClick={() => void onClick()}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
