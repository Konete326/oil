import { createSystemLogApi } from "./api";

let initialized = false;
const recentLogs = new Set();

const sendLog = (title, message, stack, level, source = "frontend") => {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  const msgStr = String(message || "");
  if (
    msgStr.includes("offline") ||
    msgStr.includes("sync") ||
    msgStr.includes("IndexedDB") ||
    msgStr.includes("ERR_INTERNET_DISCONNECTED") ||
    msgStr.includes("System logs API error") ||
    msgStr.includes("Failed to create system log")
  ) {
    return;
  }

  const key = `${level}:${title}:${msgStr.slice(0, 100)}`;
  if (recentLogs.has(key)) return;
  recentLogs.add(key);
  setTimeout(() => recentLogs.delete(key), 5000);

  createSystemLogApi({
    title,
    message: msgStr,
    stack: String(stack || ""),
    level,
    source,
  }).catch(() => {});
};

export function initConsoleLogger() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("error", (event) => {
    sendLog(
      "Unhandled UI Error",
      event.message || "Script execution error",
      event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
      "error",
      "frontend"
    );
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || "Unhandled Promise Rejection");
    const stack = reason?.stack || "";
    sendLog("Unhandled Promise Rejection", msg, stack, "error", "frontend");
  });

  const originalConsoleError = console.error;
  console.error = (...args) => {
    originalConsoleError.apply(console, args);
    const msg = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
    sendLog("Console Error Log", msg, "", "error", "frontend");
  };

  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    originalConsoleWarn.apply(console, args);
    const msg = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
    sendLog("Console Warning Log", msg, "", "warning", "frontend");
  };
}
