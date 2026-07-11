import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"

export function PlaceholderScreen({ title, note }: { title: string; note: ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <h1 className="font-heading text-lg font-semibold">{title}</h1>
      <Card className="flex flex-1 items-center justify-center border border-dashed bg-transparent ring-0">
        <CardContent className="max-w-[26ch] text-center text-sm text-muted-foreground">
          {note}
        </CardContent>
      </Card>
    </div>
  )
}
