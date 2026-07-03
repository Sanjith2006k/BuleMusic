import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export default function Button({
  variant = "primary",
  className,
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={clsx(
        "rounded-full",
        "px-6 py-3",
        "transition-all duration-300",
        "font-medium",
        variant === "primary"
          ? "bg-[#0A84FF] hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30"
          : "bg-white/5 border border-white/10 hover:bg-white/10",
        className,
      )}
    />
  );
}
