import { Separator } from "@/components/ui/separator"

export function OAuthDivider() {
    return (
        <div className="relative flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Or
            </span>
            <Separator className="flex-1" />
        </div>
    )
}
