import { NavLink } from "react-router"
import { Dumbbell, House, Plus, UtensilsCrossed, Wallet } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = { to: string; label: string; icon: LucideIcon }

const leftTabs: Tab[] = [
  { to: "/", label: "Home", icon: House },
  { to: "/diet", label: "Diet", icon: UtensilsCrossed },
]

const rightTabs: Tab[] = [
  { to: "/gym", label: "Gym", icon: Dumbbell },
  { to: "/money", label: "Money", icon: Wallet },
]

function TabLink({ tab }: { tab: Tab }) {
  const Icon = tab.icon
  return (
    <NavLink
      to={tab.to}
      end={tab.to === "/"}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
          isActive ? "text-primary" : "text-muted-foreground",
        )
      }
    >
      <Icon className="size-5" aria-hidden="true" />
      {tab.label}
    </NavLink>
  )
}

export function BottomNav({ onQuickAdd }: { onQuickAdd: () => void }) {
  return (
    <nav className="shrink-0 border-t bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid h-16 w-full max-w-md grid-cols-5">
        {leftTabs.map((tab) => (
          <TabLink key={tab.to} tab={tab} />
        ))}
        <div className="relative">
          <button
            type="button"
            onClick={onQuickAdd}
            aria-label="Quick add"
            className="absolute left-1/2 top-0 flex size-14 -translate-x-1/2 -translate-y-1/3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
          >
            <Plus className="size-7" aria-hidden="true" />
          </button>
        </div>
        {rightTabs.map((tab) => (
          <TabLink key={tab.to} tab={tab} />
        ))}
      </div>
    </nav>
  )
}
