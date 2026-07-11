import { createContext, useContext, useState } from "react"
import type { ReactNode } from "react"

type PrivacyState = {
  hidden: boolean
  toggle: () => void
}

// Deliberately NOT persisted: money amounts reset to hidden on every fresh
// app open (CLAUDE.md rule 9).
const PrivacyContext = createContext<PrivacyState>({
  hidden: true,
  toggle: () => null,
})

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(true)
  return (
    <PrivacyContext.Provider
      value={{ hidden, toggle: () => setHidden((h) => !h) }}
    >
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  return useContext(PrivacyContext)
}
