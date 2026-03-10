import { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "../../lib/utils";

const ToastContext = createContext(null);

const ICONS = {
  success: { icon: CheckCircle2, color: "text-green-500", bar: "bg-green-500", bg: "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800" },
  error:   { icon: XCircle,      color: "text-red-500",   bar: "bg-red-500",   bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800" },
  info:    { icon: Info,          color: "text-blue-500",  bar: "bg-blue-500",  bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bar: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" },
};

function ToastItem({ toast, onDismiss }) {
  const cfg = ICONS[toast.type] || ICONS.info;
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 w-full max-w-sm rounded-xl border px-4 py-3.5 shadow-lg backdrop-blur-sm transition-all duration-300 overflow-hidden",
        cfg.bg,
        toast.visible ? "animate-slide-in" : "animate-slide-out"
      )}
      role="alert"
    >
      {/* progress bar */}
      <div
        className={cn("absolute bottom-0 left-0 h-0.5 rounded-full", cfg.bar)}
        style={{
          animation: `shrink ${toast.duration}ms linear forwards`,
        }}
      />

      <Icon size={18} className={cn("flex-shrink-0 mt-0.5", cfg.color)} />

      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-foreground leading-tight">{toast.title}</p>
        )}
        {toast.message && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{toast.message}</p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className={cn("text-xs font-semibold mt-1.5 underline underline-offset-2 hover:opacity-80", cfg.color)}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ type = "info", title, message, action, duration = 4000 }) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message, action, duration, visible: true }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full max-w-sm">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
