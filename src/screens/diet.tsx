import { FoodSearch } from "@/features/diet/food-search"
import { PhaseCard } from "@/features/diet/phase-card"
import { QuickAddRow } from "@/features/diet/quick-add-row"
import { TodayLog } from "@/features/diet/today-log"
import { WeighInCard } from "@/features/diet/weigh-in-card"

export function DietScreen() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="font-heading text-lg font-semibold">Diet</h1>
      <TodayLog />
      <QuickAddRow />
      <FoodSearch />
      <WeighInCard />
      <PhaseCard />
    </div>
  )
}
