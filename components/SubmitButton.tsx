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
      className={`${className ?? ""} ${pending ? "opacity-60" : ""} transition-[transform,opacity] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100`}
      {...props}
    >
      {pending ? (pendingChildren ?? children) : children}
    </button>
  );
}
