import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { TRANSLATIONS } from "@/i18n/translations";
import { updateUserLanguageApi } from "@/lib/api";

const LanguageContext = createContext(null);

const textMap = new WeakMap();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("app_language") || "en";
  });

  const langRef = useRef(language);
  langRef.current = language;

  const applyLanguageDOM = useCallback((langCode) => {
    document.documentElement.lang = langCode;
    if (langCode === "ur") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }
  }, []);

  const translateNodeTree = useCallback((rootNode, lang) => {
    if (!rootNode) return;

    try {
      const fontTags = rootNode.querySelectorAll("font");
      fontTags.forEach((font) => {
        if (font.parentNode) {
          const textNode = document.createTextNode(font.textContent);
          font.parentNode.replaceChild(textNode, font);
        }
      });
    } catch (e) {}

    const dictionary = TRANSLATIONS[lang] || TRANSLATIONS["en"];
    const enDict = TRANSLATIONS["en"];

    const walk = (node) => {
      if (!node) return;

      if (node.nodeType === Node.TEXT_NODE) {
        const raw = node.nodeValue;
        if (!raw) return;
        const trimmed = raw.trim();
        if (!trimmed || trimmed.length < 2 || !/[a-zA-Z]/.test(trimmed)) return;

        if (!textMap.has(node)) {
          textMap.set(node, trimmed);
        }
        const originalText = textMap.get(node) || trimmed;

        if (lang === "en") {
          if (node.nodeValue.includes(originalText) === false) {
            node.nodeValue = raw.replace(trimmed, originalText);
          }
        } else if (dictionary[originalText]) {
          const translated = dictionary[originalText];
          node.nodeValue = raw.replace(trimmed, translated);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        if (tag === "script" || tag === "style" || tag === "code" || tag === "pre" || tag === "svg") {
          return;
        }

        if (node.placeholder && typeof node.placeholder === "string") {
          const pTrimmed = node.placeholder.trim();
          if (pTrimmed && dictionary[pTrimmed]) {
            node.placeholder = dictionary[pTrimmed];
          }
        }

        for (let child = node.firstChild; child; child = child.nextSibling) {
          walk(child);
        }
      }
    };

    walk(rootNode);
  }, []);

  const runDOMTranslationPass = useCallback(() => {
    const root = document.getElementById("root");
    if (root) {
      translateNodeTree(root, langRef.current);
    }
  }, [translateNodeTree]);

  const changeLanguage = useCallback(
    (langCode) => {
      setLanguageState(langCode);
      langRef.current = langCode;
      localStorage.setItem("app_language", langCode);
      applyLanguageDOM(langCode);

      if (navigator.onLine) {
        updateUserLanguageApi(langCode).catch(() => {});
      }

      requestAnimationFrame(() => {
        runDOMTranslationPass();
      });
      return true;
    },
    [applyLanguageDOM, runDOMTranslationPass]
  );

  useEffect(() => {
    const saved = localStorage.getItem("app_language") || "en";
    applyLanguageDOM(saved);

    const observer = new MutationObserver((mutations) => {
      let shouldTranslate = false;
      for (const m of mutations) {
        if (m.type === "childList" && m.addedNodes.length > 0) {
          shouldTranslate = true;
          break;
        }
      }
      if (shouldTranslate && langRef.current !== "en") {
        requestAnimationFrame(() => {
          runDOMTranslationPass();
        });
      }
    });

    const root = document.getElementById("root");
    if (root) {
      observer.observe(root, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, [applyLanguageDOM, runDOMTranslationPass]);

  useEffect(() => {
    const handleLocationChange = () => {
      requestAnimationFrame(() => {
        runDOMTranslationPass();
      });
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, [runDOMTranslationPass]);

  const t = useCallback(
    (key, fallback) => {
      if (!key) return "";
      const langDict = TRANSLATIONS[language] || TRANSLATIONS["en"];
      if (langDict[key]) return langDict[key];
      if (TRANSLATIONS["en"][key]) return TRANSLATIONS["en"][key];
      return fallback !== undefined ? fallback : key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, runDOMTranslationPass }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
