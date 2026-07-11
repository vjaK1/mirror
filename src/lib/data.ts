// Data-access layer (CLAUDE.md rule 6).
//
// Every Supabase table read/write in the app goes through this module —
// feature code never imports `supabase` directly for data access. This keeps
// a single seam where the offline queue (IndexedDB) can be inserted later
// without touching features. Auth calls are exempt (they are not data).
//
// Session 2 adds generated database types and the first typed accessors;
// until then these two funnels are the only entry points.
import { supabase } from "./supabase"

/** Single write funnel. All inserts pass through here — append-only tables
 * mean inserts are the only mutation the app performs (CLAUDE.md rule 3). */
export async function insertRow<Row extends object>(table: string, values: Row) {
  const { data, error } = await supabase.from(table).insert(values).select().single()
  if (error) throw error
  return data
}

/** Single read funnel for plain selects. Feature modules wrap this with
 * typed, view-specific accessors as they land. */
export async function selectRows(table: string, columns = "*") {
  const { data, error } = await supabase.from(table).select(columns)
  if (error) throw error
  return data
}
