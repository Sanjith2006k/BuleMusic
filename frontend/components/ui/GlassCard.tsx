import { HTMLAttributes } from "react";
import clsx from "clsx";

interface Props extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export default function GlassCard({ children, className, ...rest }: Props) {
  return (
    <div
      className={clsx(
        "rounded-[20px]",
        "border border-white/10",
        "bg-white/5",
        "backdrop-blur-xl",
        "shadow-2xl",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

