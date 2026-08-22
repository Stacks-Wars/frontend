"use client"

import { RiMusic2Line, RiVolumeDownLine, RiVolumeMuteLine, RiVolumeUpLine } from "@remixicon/react"

import { Label, Slider, Switch } from "@/components/ui"
import { playSfx } from "@/lib/audio/play-sound"
import { useSoundActions, useMusicEnabled, useMusicVolume, useSfxEnabled, useSfxVolume } from "@/stores/sound"

function VolumeRow({
    value,
    onChange,
    preview,
}: {
    value: number
    onChange: (v: number) => void
    preview?: () => void
}) {
    const pct = Math.round(value * 100)
    const Icon =
        pct === 0 ? RiVolumeMuteLine : pct < 40 ? RiVolumeDownLine : RiVolumeUpLine

    return (
        <div className="flex items-center gap-3 pl-1">
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <Slider
                min={0}
                max={100}
                step={1}
                value={pct}
                onValueChange={(next) => {
                    const n = Array.isArray(next) ? next[0] : next
                    onChange(n / 100)
                }}
                onValueCommitted={() => preview?.()}
                className="flex-1"
            />
            <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {pct}%
            </span>
        </div>
    )
}

export function SoundPreferences() {
    const musicEnabled = useMusicEnabled()
    const sfxEnabled = useSfxEnabled()
    const musicVolume = useMusicVolume()
    const sfxVolume = useSfxVolume()
    const {
        setMusicEnabled,
        setSfxEnabled,
        setMusicVolume,
        setSfxVolume,
    } = useSoundActions()

    return (
        <div className="space-y-5 rounded-2xl border border-border/70 p-5 surface-raised">
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <RiMusic2Line className="mt-0.5 size-5 text-primary" />
                        <div className="space-y-1">
                            <Label className="text-sm font-medium">
                                Background music
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Soft shuffled loop across the arena playlist.
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={musicEnabled}
                        onCheckedChange={setMusicEnabled}
                    />
                </div>
                {musicEnabled ? (
                    <VolumeRow
                        value={musicVolume}
                        onChange={setMusicVolume}
                    />
                ) : null}
            </div>

            <div className="space-y-3 border-t border-border/60 pt-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <RiVolumeUpLine className="mt-0.5 size-5 text-gold" />
                        <div className="space-y-1">
                            <Label className="text-sm font-medium">
                                Sound effects
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Clicks, match alerts, and in-game cues.
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={sfxEnabled}
                        onCheckedChange={(on) => {
                            setSfxEnabled(on)
                            if (on) playSfx("click")
                        }}
                    />
                </div>
                {sfxEnabled ? (
                    <VolumeRow
                        value={sfxVolume}
                        onChange={setSfxVolume}
                        preview={() => playSfx("click")}
                    />
                ) : null}
            </div>
        </div>
    )
}
