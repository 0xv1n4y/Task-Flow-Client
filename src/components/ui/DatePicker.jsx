import { useState, useRef, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "../../lib/utils";

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({ value, onChange, placeholder = "Pick a date", disabled, className }) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    value ? new Date(value + "T12:00:00") : new Date()
  );
  const containerRef = useRef(null);

  // Sync view month when value changes externally
  useEffect(() => {
    if (value) setViewMonth(new Date(value + "T12:00:00"));
  }, [value]);

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

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const gridDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 }),
  });

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
        <Calendar size={14} className="flex-shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left truncate">
          {value
            ? format(new Date(value + "T12:00:00"), "MMM d, yyyy")
            : placeholder}
        </span>
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

      {/* Calendar popover — opens upward */}
      {open && (
        <div className="absolute left-0 bottom-full mb-1 z-50 w-72 rounded-xl border border-border bg-card p-3 shadow-xl">
          {/* Month navigation */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="select-none text-sm font-semibold text-foreground">
              {format(viewMonth, "MMMM yyyy")}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Day-of-week labels */}
          <div className="mb-1 grid grid-cols-7">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="py-1 text-center text-xs font-semibold text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {gridDays.map((day) => {
              const ds = format(day, "yyyy-MM-dd");
              const isSelected = ds === value;
              const isToday = ds === todayStr;
              const inMonth = isSameMonth(day, viewMonth);
              return (
                <button
                  key={ds}
                  type="button"
                  onClick={() => {
                    onChange(ds);
                    setOpen(false);
                  }}
                  className={cn(
                    "h-8 w-full select-none rounded-md text-xs font-medium transition-all",
                    !inMonth && "pointer-events-none opacity-25",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isToday
                      ? "ring-2 ring-primary text-primary font-bold hover:bg-primary hover:text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Footer shortcuts */}
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <button
              type="button"
              onClick={() => {
                onChange(todayStr);
                setOpen(false);
              }}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(format(addMonths(new Date(), 0), "yyyy-MM-") + "01");
                setViewMonth(new Date());
              }}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              This month
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
