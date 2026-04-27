"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sound-pref";

export function SoundPreferences() {
  const [enabled, setEnabled] = React.useState(true);

  React.useEffect(() => {
    setEnabled(isSoundEnabled());
  }, []);

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold tracking-tight">
        Preferences
      </h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Label htmlFor="sound-effects" className="text-base">
            Sound effects
          </Label>
          <p className="text-sm text-muted-foreground">
            Play subtle sounds on interactions like theme toggle
          </p>
        </div>
        <Switch
          id="sound-effects"
          checked={enabled}
          onCheckedChange={(v) => {
            const next = Boolean(v);
            setSoundEnabled(next);
            setEnabled(next);
          }}
          className="shrink-0 sm:mt-0"
        />
      </div>
    </div>
  );
}
