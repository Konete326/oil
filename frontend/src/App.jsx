import { Agentation } from "agentation"
import { AppShell } from "@/components/app-shell"
import { Dashboard } from "@/components/dashboard"

export default function App() {
  return (
    <>
      <AppShell>
        <Dashboard />
      </AppShell>
      {import.meta.env.DEV && (
        <Agentation
          endpoint="http://localhost:4747"
          onSessionCreated={(sessionId) => {
            console.log("Session started:", sessionId)
          }}
        />
      )}
    </>
  )
}
