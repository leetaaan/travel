import * as React from "react";
import { cn } from "@/lib/utils";

const LiquidButton = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn("btn-liquid group", className)}
        {...props}
      >
        <div className="btn-liquid-shine" />
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </button>
    );
  },
);

LiquidButton.displayName = "LiquidButton";

export { LiquidButton };
