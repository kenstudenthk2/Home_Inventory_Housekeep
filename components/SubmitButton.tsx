"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  pendingChildren?: ReactNode;
};

export function SubmitButton({ children, pendingChildren, className, ...props }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className ?? ""} ${pending ? "opacity-60" : ""}`}
      {...props}
    >
      {pending ? (pendingChildren ?? children) : children}
    </button>
  );
}
