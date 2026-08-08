import { useState, useEffect, useRef } from "react";
import { fetchCustomers, fetchSuppliers } from "@/lib/api";
import { UserIcon, SearchIcon, CheckIcon, UserPlusIcon, PhoneIcon, CreditCardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CustomerVendorSelect({
  value,
  onChange,
  onSelectCustomer,
  type = "customer",
  placeholder = "Search or enter name...",
}) {
  const [query, setQuery] = useState(value || "");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchData = async (text) => {
    setLoading(true);
    if (type === "customer") {
      const res = await fetchCustomers({ search: text, limit: 10 });
      if (res && res.data) setOptions(res.data);
    } else {
      const res = await fetchSuppliers(text);
      if (res && res.data) setOptions(res.data);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    onChange(text);
    setIsOpen(true);
    searchData(text);
  };

  const handleSelect = (item) => {
    setQuery(item.name);
    onChange(item.name);
    if (onSelectCustomer) onSelectCustomer(item);
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
    searchData(query);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <UserIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {loading && (
          <div className="absolute right-2.5 top-2.5 size-3.5 border-2 border-primary border-t-transparent animate-spin rounded-full" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-card shadow-xl p-1 text-xs">
          {options.length > 0 ? (
            options.map((item) => (
              <div
                key={item._id}
                onClick={() => handleSelect(item)}
                className="flex items-center justify-between p-2 hover:bg-primary/10 rounded-md cursor-pointer transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>{item.name}</span>
                    {item.customerType && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/15 text-primary font-mono">
                        {item.customerType}
                      </span>
                    )}
                  </div>
                  {item.phone && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <PhoneIcon className="size-3" />
                      <span>{item.phone}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-mono font-medium text-emerald-500">
                    Bal: Rs {(item.currentBalance || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-muted-foreground">
              No matching records found. Using generic name: <strong className="text-foreground">{query || "Walk-in Customer"}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
