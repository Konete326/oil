import { Routes, Route } from "react-router-dom";
import { Agentation } from "agentation";
import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";
import { CategoryManager } from "@/components/category-manager";
import { ProductManager } from "@/components/product-manager";

export default function App() {
  return (
    <>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/categories" element={<CategoryManager />} />
          <Route path="/products" element={<ProductManager />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
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
