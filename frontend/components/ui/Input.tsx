import { InputHTMLAttributes } from "react";
import clsx from "clsx";

export default function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full",
        "rounded-full",
        "border border-white/10",
        "bg-white/5",
        "px-5 py-3",
        "outline-none",
        "transition",
        "focus:border-[#0A84FF]",
        className,
      )}
    />
  );
}
