"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type"> & {
  children: ReactNode | ((pending: boolean) => ReactNode);
};

export function SubmitButton({ children, className, ...props }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className ?? ""} ${pending ? "opacity-60" : ""}`}
      {...props}
    >
      {typeof children === "function" ? children(pending) : children}
    </button>
  );
}
