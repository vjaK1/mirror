import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import { AppShell } from "@/components/app-shell"
import { RequireAuth } from "@/components/require-auth"
import { DietScreen } from "@/screens/diet"
import { GymScreen } from "@/screens/gym"
import { HomeScreen } from "@/screens/home"
import { LoginScreen } from "@/screens/login"
import { MoneyScreen } from "@/screens/money"
import { NotesScreen } from "@/screens/notes"
import { SettingsScreen } from "@/screens/settings"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<HomeScreen />} />
            <Route path="diet" element={<DietScreen />} />
            <Route path="gym" element={<GymScreen />} />
            <Route path="money" element={<MoneyScreen />} />
            <Route path="notes" element={<NotesScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
