import { ActivityCard } from "@/features/gym/activity-card"
import { AdherenceCard } from "@/features/gym/adherence-card"
import { SessionView } from "@/features/gym/session-view"
import { StartSession } from "@/features/gym/start-session"
import { useTodaySession } from "@/features/gym/queries"

export function GymScreen() {
  const { data: today, isLoading } = useTodaySession()

  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="font-heading text-lg font-semibold">Gym</h1>
      {!isLoading && (today ? <SessionView session={today} /> : <StartSession />)}
      <ActivityCard />
      <AdherenceCard />
    </div>
  )
}
