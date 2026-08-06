import { useState, useEffect } from "react";
import { Agentation } from "agentation";
import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";
import { CategoryManager } from "@/components/category-manager";
import { ProductManager } from "@/components/product-manager";

export default function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || "#/dashboard");

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || "#/dashboard");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const renderContent = () => {
    switch (currentHash) {
      case "#/categories":
        return <CategoryManager />;
      case "#/products":
        return <ProductManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <AppShell>
        {renderContent()}
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
