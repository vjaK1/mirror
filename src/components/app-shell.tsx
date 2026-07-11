import { useState } from "react"
import { Outlet } from "react-router"
import { BottomNav } from "@/components/bottom-nav"
import { QuickAddSheet } from "@/components/quick-add-sheet"

export function AppShell() {
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  return (
    <div className="flex h-dvh flex-col bg-background">
      <main className="mx-auto min-h-0 w-full max-w-md flex-1 overflow-y-auto pt-[env(safe-area-inset-top)]">
        <Outlet />
      </main>
      <BottomNav onQuickAdd={() => setQuickAddOpen(true)} />
      <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  )
}
