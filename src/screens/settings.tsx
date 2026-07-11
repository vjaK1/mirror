import { LogOut, Monitor, Moon, Sun } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useTheme } from "@/components/theme-provider"
import type { Theme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

export function SettingsScreen() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="font-heading text-lg font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Theme follows your device unless overridden.</CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            variant="outline"
            value={theme}
            onValueChange={(value) => {
              if (value) setTheme(value as Theme)
            }}
            className="w-full"
          >
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <ToggleGroupItem
                key={value}
                value={value}
                className="flex-1"
                aria-label={`${label} theme`}
              >
                <Icon aria-hidden="true" />
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => void supabase.auth.signOut()}
          >
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">Mirror v0.1 — scaffold</p>
    </div>
  )
}
