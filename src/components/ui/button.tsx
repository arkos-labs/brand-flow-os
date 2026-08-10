import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--shape-control)] border-2 text-sm font-bold cursor-pointer transition-[transform,box-shadow,background-color,color,border-color] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-navy bg-primary text-primary-foreground shadow-offset hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-primary/90 hover:shadow-offset-sm active:translate-x-1 active:translate-y-1 active:shadow-none",
        destructive: "border-destructive bg-destructive text-destructive-foreground shadow-offset-sm hover:bg-destructive/90",
        outline:
          "border-navy bg-card text-foreground shadow-offset-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-accent hover:text-accent-foreground hover:shadow-none",
        secondary: "border-navy/35 bg-secondary text-secondary-foreground shadow-offset-sm hover:bg-secondary/80",
        ghost: "border-transparent shadow-none hover:border-primary/25 hover:bg-accent hover:text-accent-foreground",
        link: "border-transparent text-primary shadow-none underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
