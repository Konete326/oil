import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Globe, Check, Languages, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "ur", label: "Urdu", native: "اردو", flag: "🇵🇰" },
  { code: "hinglish", label: "Aasan Urdu (Roman)", native: "Aasan Urdu", flag: "🔤" },
];

export function LanguageSelector({ variant = "header", className }) {
  const { language: currentLang, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLanguage = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  const activeLanguageObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  if (variant === "full-settings") {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Globe className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                Language & Translation Settings
              </h3>
              <p className="text-xs text-muted-foreground">
                Switch system language instantly between English, Urdu (اردو), and Aasan Urdu (Roman).
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary shadow-xs font-semibold"
                    : "border-border hover:bg-muted/50 text-foreground hover:border-primary/40"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl leading-none">{lang.flag}</span>
                  <div>
                    <p className="text-xs font-medium">{lang.label}</p>
                    <p className="text-[11px] text-muted-foreground font-sans">{lang.native}</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <Check className="size-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/50 mt-3">
          <Sparkles className="size-4 text-primary shrink-0" />
          <span>
            Active Language: <strong className="text-foreground">{activeLanguageObj.label} ({activeLanguageObj.native})</strong>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={cn("relative inline-block text-left", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="size-9 p-0 rounded-lg border-border/80 bg-background/50 hover:bg-muted/80 cursor-pointer shrink-0 relative flex items-center justify-center"
        aria-label="Language Selector"
        title={`Language: ${activeLanguageObj.label} (${activeLanguageObj.native})`}
      >
        <Globe className="size-4 text-foreground/80" />
        <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-black leading-none bg-primary text-primary-foreground px-1 py-0.5 rounded-sm shadow-xs uppercase">
          {currentLang === "hinglish" ? "RO" : currentLang.toUpperCase()}
        </span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden animate-in fade-in-50 duration-100 p-1 space-y-0.5">
          <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground border-b border-border/50 flex items-center justify-between">
            <span>Select Language / زبان</span>
            <Globe className="size-3 text-primary" />
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={cn(
                    "w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer",
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{lang.flag}</span>
                    <span>{lang.label}</span>
                  </div>
                  {isSelected && <Check className="size-3 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
