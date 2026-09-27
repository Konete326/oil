import { useEffect, useState } from "react";
import { fetchProducts } from "@/lib/api";
import { StockRegisterModal } from "@/components/stock-register-modal";

export function StockRegisterPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts().then((res) => {
      if (res?.success && Array.isArray(res.data)) {
        setProducts(res.data);
      }
    });
  }, []);

  return (
    <div className="p-3 md:p-4 space-y-4">
      <StockRegisterModal
        isOpen={true}
        products={products}
        isPage={true}
      />
    </div>
  );
}
