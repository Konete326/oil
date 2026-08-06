import { useState, useEffect } from "react";
import { Agentation } from "agentation";
import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";
import { CategoryManager } from "@/components/category-manager";

export default function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || "#/dashboard");

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || "#/dashboard");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <>
      <AppShell>
        {currentHash === "#/categories" ? <CategoryManager /> : <Dashboard />}
      </AppShell>
      {import.meta.env.DEV && (
        <Agentation
          endpoint="http://localhost:4747"
          onSessionCreated={(sessionId) => {
            console.log("Session started:", sessionId);
          }}
        />
      )}
    </>
  );
}
