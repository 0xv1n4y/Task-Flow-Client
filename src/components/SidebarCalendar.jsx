import { useState } from "react";
import {
  format,
  subDays,
  addDays,
  startOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
} from "date-fns";

const VIEWS = ["Week", "Month", "Year"];

function cellColor(count, isFuture) {
  if (isFuture) return "bg-transparent";
  if (count === 0) return "bg-muted";
  if (count === 1) return "bg-primary/30";
  if (count === 2) return "bg-primary/55";
  if (count === 3) return "bg-primary/75";
  return "bg-primary";
}

export default function SidebarCalendar({ tasks }) {
  const [view, setView] = useState("Week");
  const today = new Date();

  // date -> completed count map
  const completionMap = {};
  tasks.forEach((t) => {
    if (t.completedAt) {
      completionMap[t.completedAt] = (completionMap[t.completedAt] || 0) + 1;
    }
  });

  // ── Heatmap: last 16 weeks ──────────────────────────────────────────────
  const heatmapWeeks = Array.from({ length: 16 }, (_, wi) => {
    const weekStart = startOfWeek(subWeeks(today, 15 - wi), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, di) => {
      const date = addDays(weekStart, di);
      const dateStr = format(date, "yyyy-MM-dd");
      const isFuture = date > today;
      return { dateStr, count: isFuture ? 0 : (completionMap[dateStr] || 0), isFuture };
    });
  });

  const totalCompleted = tasks.filter((t) => t.completed).length;

  // ── Week stats: last 7 days ─────────────────────────────────────────────
  const weekStats = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    return {
      day: format(date, "EEE"),
      count: completionMap[dateStr] || 0,
      isToday: i === 6,
    };
  });
  const maxWeek = Math.max(...weekStats.map((d) => d.count), 1);

  // ── Month stats: weeks inside current month ─────────────────────────────
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthWeeks = [];
  let cur = startOfWeek(monthStart, { weekStartsOn: 1 });
  let weekNum = 1;
  while (cur <= monthEnd) {
    const count = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(cur, i);
      return completionMap[format(d, "yyyy-MM-dd")] || 0;
    }).reduce((a, b) => a + b, 0);
    monthWeeks.push({ label: `W${weekNum++}`, count });
    cur = addDays(cur, 7);
  }
  const maxMonth = Math.max(...monthWeeks.map((w) => w.count), 1);

  // ── Year stats: last 12 months ──────────────────────────────────────────
  const yearStats = Array.from({ length: 12 }, (_, i) => {
    const monthDate = subMonths(today, 11 - i);
    const days = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
    const count = days.reduce((acc, d) => acc + (completionMap[format(d, "yyyy-MM-dd")] || 0), 0);
    return { month: format(monthDate, "MMM"), count };
  });
  const maxYear = Math.max(...yearStats.map((m) => m.count), 1);

  return (
    <div className="px-3 pt-3 pb-1 border-t border-border">
      {/* Section label */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Activity
      </p>

      {/* ── Heatmap grid ── */}
      <div className="flex gap-0.5 mb-2">
        {heatmapWeeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day, di) => (
              <div
                key={di}
                title={day.isFuture ? "" : `${day.dateStr}: ${day.count} completed`}
                className={`w-2.5 h-2.5 rounded-sm ${cellColor(day.count, day.isFuture)}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{totalCompleted} done total</span>
        <div className="flex items-center gap-0.5">
          <span className="text-xs text-muted-foreground mr-1">Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <div key={l} className={`w-2 h-2 rounded-sm ${cellColor(l, false)}`} />
          ))}
          <span className="text-xs text-muted-foreground ml-1">More</span>
        </div>
      </div>

      {/* ── View toggle ── */}
      <div className="flex rounded-lg bg-muted p-0.5 mb-3">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 text-xs py-1 rounded-md font-medium transition-all ${
              view === v
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* ── Bar chart by view ── */}
      {view === "Week" && (
        <div className="flex items-end gap-1" style={{ height: 56 }}>
          {weekStats.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end flex-1">
                <div
                  className={`w-full rounded-sm transition-all duration-300 ${
                    d.isToday ? "bg-primary" : "bg-primary/40"
                  }`}
                  style={{
                    height: `${(d.count / maxWeek) * 100}%`,
                    minHeight: d.count > 0 ? 3 : 0,
                  }}
                />
              </div>
              <span
                className={`text-xs leading-none ${
                  d.isToday ? "text-primary font-bold" : "text-muted-foreground"
                }`}
              >
                {d.day.charAt(0)}
              </span>
            </div>
          ))}
        </div>
      )}

      {view === "Month" && (
        <div className="flex items-end gap-1" style={{ height: 56 }}>
          {monthWeeks.map((w, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end flex-1">
                <div
                  className="w-full rounded-sm bg-primary/50 transition-all duration-300"
                  style={{
                    height: `${(w.count / maxMonth) * 100}%`,
                    minHeight: w.count > 0 ? 3 : 0,
                  }}
                />
              </div>
              <span className="text-xs leading-none text-muted-foreground">{w.label}</span>
            </div>
          ))}
        </div>
      )}

      {view === "Year" && (
        <div className="flex items-end gap-0.5" style={{ height: 56 }}>
          {yearStats.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end flex-1">
                <div
                  className="w-full rounded-sm bg-primary/50 transition-all duration-300"
                  style={{
                    height: `${(m.count / maxYear) * 100}%`,
                    minHeight: m.count > 0 ? 3 : 0,
                  }}
                />
              </div>
              <span className="leading-none text-muted-foreground" style={{ fontSize: 9 }}>
                {m.month.charAt(0)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
