"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { SFX } from "@/lib/audio/sounds"
import { playSound } from "@/lib/audio/play-sound"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                primary:
                    "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/85",
                gold: "bg-gold text-gold-foreground shadow-lg shadow-gold/20 hover:bg-gold/85",
                outline:
                    "border-border bg-transparent hover:border-border-strong hover:bg-muted hover:text-foreground",
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
                "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
            },
            pill: {
                true: "rounded-full",
                false: "",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
            pill: false,
        },
    }
)

function Button({
    className,
    variant = "default",
    size = "default",
    pill = false,
    sound = SFX.click,
    onClick,
    ...props
}: Omit<ButtonPrimitive.Props, "className"> &
    VariantProps<typeof buttonVariants> & {
        className?: string
        /** Sound to play on click. Defaults to click SFX. Pass `null` to disable. */
        sound?: string | null
    }) {
    return (
        <ButtonPrimitive
            data-slot="button"
            className={cn(buttonVariants({ variant, size, pill, className }))}
            {...props}
            onClick={(event) => {
                if (sound) playSound(sound)
                onClick?.(event)
            }}
        />
    )
}

export { Button, buttonVariants }
