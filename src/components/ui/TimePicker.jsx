import { useState, useRef, useEffect } from "react";
import { Clock, X } from "lucide-react";
import { cn } from "../../lib/utils";

// 24 hours in 12-hour AM/PM display
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const label =
    i === 0 ? "12 AM"
    : i < 12 ? `${i} AM`
    : i === 12 ? "12 PM"
    : `${i - 12} PM`;
  return { value: String(i).padStart(2, "0"), label };
});

// Quarter-hour intervals
const MINUTES = ["00", "15", "30", "45"];

function formatDisplay(val) {
  if (!val) return null;
  const [h, m] = val.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
}

export function TimePicker({ value, onChange, disabled, placeholder = "Pick a time", className }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const hourListRef = useRef(null);

  const [selHour, selMinute] = value ? value.split(":") : ["", ""];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Scroll selected hour into view when the panel opens
  useEffect(() => {
    if (!open || !selHour || !hourListRef.current) return;
    const btn = hourListRef.current.querySelector(`[data-hour="${selHour}"]`);
    if (btn) btn.scrollIntoView({ block: "center", behavior: "instant" });
  }, [open, selHour]);

  const handleHourClick = (h) => {
    // If minute already selected, pick the full time and close
    if (selMinute) {
      onChange(`${h}:${selMinute}`);
      setOpen(false);
    } else {
      onChange(`${h}:00`);
      setOpen(false);
    }
  };

  const handleMinuteClick = (m) => {
    const h = selHour || "09";
    onChange(`${h}:${m}`);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors",
          "hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          value ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <Clock size={14} className="flex-shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left">{formatDisplay(value) || placeholder}</span>
        {value && (
          <X
            size={13}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
          />
        )}
      </button>

      {/* Time panel — opens upward */}
      {open && (
        <div className="absolute left-0 bottom-full mb-1 z-50 w-56 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Select time
            </span>
            <span className="text-xs text-muted-foreground">
              {value ? formatDisplay(value) : "—"}
            </span>
          </div>

          <div className="flex" style={{ height: 200 }}>
            {/* Hour column */}
            <div
              ref={hourListRef}
              className="flex-1 overflow-y-auto border-r border-border"
            >
              <div className="py-1">
                {HOURS.map(({ value: h, label }) => (
                  <button
                    key={h}
                    type="button"
                    data-hour={h}
                    onClick={() => handleHourClick(h)}
                    className={cn(
                      "w-full px-2 py-1.5 text-xs text-center transition-colors",
                      selHour === h
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Minute column */}
            <div className="flex-1 overflow-y-auto">
              <div className="py-1">
                <p className="text-[10px] text-muted-foreground text-center py-1 uppercase tracking-wide font-medium">
                  Min
                </p>
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinuteClick(m)}
                    className={cn(
                      "w-full px-2 py-2 text-sm text-center transition-colors font-medium",
                      selMinute === m && selHour
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    :{m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
