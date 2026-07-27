import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/90",
                primary:
                    "bg-primary text-primary-foreground hover:bg-primary/85",
                outline:
                    "border-border bg-transparent hover:bg-muted hover:text-foreground",
                ghost: "hover:bg-muted hover:text-foreground",
                destructive:
                    "bg-destructive/15 text-destructive hover:bg-destructive/25",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 gap-2 px-5",
                sm: "h-8 gap-1.5 px-3.5 text-xs",
                lg: "h-12 gap-2 px-7 text-base",
                icon: "size-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

function Button({
    className,
    variant = "default",
    size = "default",
    ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
    return (
        <ButtonPrimitive
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    )
}

export { Button, buttonVariants }
