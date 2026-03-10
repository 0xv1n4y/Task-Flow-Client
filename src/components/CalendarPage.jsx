import { useState, useMemo } from "react";
import {
  format,
  subDays,
  addDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
  addMonths,
  isSameMonth,
  parseISO,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import {
  CheckCircle2,
  Circle,
  CalendarDays,
  TrendingUp,
  Flame,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CATEGORY_COLORS = {
  Work: "#6366f1",
  Health: "#22c55e",
  Learning: "#f59e0b",
  Personal: "#ec4899",
};

const PRIORITY_COLORS = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function heatCell(count, isFuture, selected) {
  if (selected) return "bg-primary ring-2 ring-primary ring-offset-1";
  if (isFuture) return "bg-transparent border border-dashed border-border/30";
  if (count === 0) return "bg-muted hover:bg-muted/70";
  if (count === 1) return "bg-primary/30 hover:bg-primary/40";
  if (count === 2) return "bg-primary/55 hover:bg-primary/65";
  if (count === 3) return "bg-primary/75 hover:bg-primary/85";
  return "bg-primary hover:bg-primary/90";
}

function calDayColor(count) {
  if (count === 0) return "";
  if (count === 1) return "bg-primary/20";
  if (count === 2) return "bg-primary/40";
  if (count === 3) return "bg-primary/60";
  return "bg-primary/80";
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || "#6366f1" }} className="text-xs">
            {p.name}: <span className="font-semibold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function CalendarPage({ tasks }) {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [chartView, setChartView] = useState("Week");

  // ── Build maps ──────────────────────────────────────────────────────────
  const completionMap = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (t.completedAt) map[t.completedAt] = (map[t.completedAt] || 0) + 1;
    });
    return map;
  }, [tasks]);

  // Tasks grouped by their dueDate (for the day detail panel)
  const dueDateMap = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (t.dueDate) {
        if (!map[t.dueDate]) map[t.dueDate] = [];
        map[t.dueDate].push(t);
      }
    });
    return map;
  }, [tasks]);

  // Tasks without a due date, grouped by createdAt (fallback for non-due tasks)
  const createdMap = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!map[t.createdAt]) map[t.createdAt] = [];
      map[t.createdAt].push(t);
    });
    return map;
  }, [tasks]);

  // ── Selected date derived data ───────────────────────────────────────────
  const selDate = parseISO(selectedDate);
  const isFutureSelected = selDate > today;
  // For future dates show due tasks; for past/today show both due tasks and created tasks
  const selDayTasks = isFutureSelected
    ? (dueDateMap[selectedDate] || [])
    : [...new Set([...(dueDateMap[selectedDate] || []), ...(createdMap[selectedDate] || [])])];
  const selDayCompleted = selDayTasks.filter((t) => t.completed).length;

  // week of selected date
  const selWeekStart = startOfWeek(selDate, { weekStartsOn: 0 });
  const selWeekEnd = endOfWeek(selDate, { weekStartsOn: 0 });
  const selWeekDays = eachDayOfInterval({ start: selWeekStart, end: selWeekEnd });
  const selWeekCount = selWeekDays.reduce(
    (acc, d) => acc + (completionMap[format(d, "yyyy-MM-dd")] || 0),
    0
  );

  // month of selected date
  const selMonthDays = eachDayOfInterval({ start: startOfMonth(selDate), end: endOfMonth(selDate) });
  const selMonthCount = selMonthDays.reduce(
    (acc, d) => acc + (completionMap[format(d, "yyyy-MM-dd")] || 0),
    0
  );

  // streak from selected date backwards
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = format(subDays(selDate, i), "yyyy-MM-dd");
    if ((completionMap[d] || 0) > 0) streak++;
    else if (i > 0) break;
  }

  // ── Chart data based on chartView + selectedDate ─────────────────────────
  const chartData = useMemo(() => {
    if (chartView === "Week") {
      return selWeekDays.map((d) => {
        const ds = format(d, "yyyy-MM-dd");
        return {
          label: format(d, "EEE"),
          Completed: completionMap[ds] || 0,
          isSelected: ds === selectedDate,
          date: ds,
        };
      });
    }
    if (chartView === "Month") {
      return selMonthDays.map((d) => {
        const ds = format(d, "yyyy-MM-dd");
        return {
          label: format(d, "d"),
          Completed: completionMap[ds] || 0,
          isSelected: ds === selectedDate,
          date: ds,
        };
      });
    }
    // Year: 12 months centered on selected date's year
    return Array.from({ length: 12 }, (_, i) => {
      const mDate = subMonths(
        new Date(selDate.getFullYear(), 11, 1),
        11 - i
      );
      const days = eachDayOfInterval({ start: startOfMonth(mDate), end: endOfMonth(mDate) });
      const count = days.reduce((acc, d) => acc + (completionMap[format(d, "yyyy-MM-dd")] || 0), 0);
      return { label: format(mDate, "MMM"), Completed: count, date: format(mDate, "yyyy-MM") };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartView, selectedDate, completionMap]);

  // ── Month calendar grid ──────────────────────────────────────────────────
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // ── Heatmap: 53 weeks ───────────────────────────────────────────────────
  const heatmapWeeks = useMemo(() => {
    return Array.from({ length: 53 }, (_, wi) => {
      const weekStart = startOfWeek(subWeeks(today, 52 - wi), { weekStartsOn: 0 });
      return Array.from({ length: 7 }, (_, di) => {
        const date = addDays(weekStart, di);
        const dateStr = format(date, "yyyy-MM-dd");
        const isFuture = date > today;
        return { date, dateStr, count: isFuture ? 0 : (completionMap[dateStr] || 0), isFuture };
      });
    });
  }, [completionMap]);

  const monthLabels = useMemo(() => {
    const labels = [];
    heatmapWeeks.forEach((week, wi) => {
      const firstDay = week[0];
      if (firstDay && parseInt(format(firstDay.date, "d")) <= 7) {
        labels.push({ wi, label: format(firstDay.date, "MMM") });
      }
    });
    return labels;
  }, [heatmapWeeks]);

  const handleHeatClick = (day) => {
    if (day.isFuture) return;
    setSelectedDate(day.dateStr);
    setViewMonth(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
  };

  const handleCalDayClick = (d) => {
    setSelectedDate(format(d, "yyyy-MM-dd"));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity Calendar</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Viewing <span className="font-medium text-foreground">{format(selDate, "EEEE, MMMM d, yyyy")}</span>
          {selectedDate === todayStr && " — Today"}
        </p>
      </div>

      {/* ── Stat Cards (reactive to selectedDate) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: CheckCircle2, label: "This Day", value: selDayCompleted, sub: `${selDayTasks.length} total tasks`, color: "bg-indigo-500" },
          { icon: CalendarDays, label: "This Week", value: selWeekCount, sub: `${format(selWeekStart, "MMM d")} – ${format(selWeekEnd, "MMM d")}`, color: "bg-sky-500" },
          { icon: TrendingUp, label: "This Month", value: selMonthCount, sub: format(selDate, "MMMM yyyy"), color: "bg-emerald-500" },
          { icon: Flame, label: "Streak", value: streak, sub: "days back from selection", color: "bg-rose-500" },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className={`inline-flex p-2 rounded-lg ${color} mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
              <div className="text-xs text-muted-foreground mt-1">{sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main interactive area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Month calendar grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{format(viewMonth, "MMMM yyyy")}</CardTitle>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMonth((m) => subMonths(m, 1))}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => { setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(todayStr); }}
                  className="px-2 py-1 text-xs rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => setViewMonth((m) => addMonths(m, 1))}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_LABELS.map((d) => (
                <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">
                  {d.charAt(0)}
                </div>
              ))}
            </div>
            {/* Grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {gridDays.map((d) => {
                const ds = format(d, "yyyy-MM-dd");
                const count = completionMap[ds] || 0;
                const dueCount = (dueDateMap[ds] || []).length;
                const isSelected = ds === selectedDate;
                const isThisMonth = isSameMonth(d, viewMonth);
                const isToday_ = ds === todayStr;
                const isFuture = d > today;
                return (
                  <button
                    key={ds}
                    onClick={() => handleCalDayClick(d)}
                    className={[
                      "relative aspect-square flex flex-col items-center justify-center rounded-md text-xs transition-all cursor-pointer",
                      !isThisMonth ? "opacity-30" : "",
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold ring-2 ring-primary ring-offset-1"
                        : isToday_
                        ? "ring-1 ring-primary text-primary font-semibold hover:bg-accent"
                        : !isFuture && count > 0
                        ? `${calDayColor(count)} hover:opacity-80 text-foreground font-medium`
                        : "hover:bg-accent text-foreground",
                    ].join(" ")}
                  >
                    <span>{format(d, "d")}</span>
                    {/* Completion dot (past) */}
                    {!isFuture && count > 0 && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/70" />
                    )}
                    {/* Due-task dot (future) */}
                    {isFuture && dueCount > 0 && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Completions:</span>
                <span className="text-xs text-muted-foreground">Less</span>
                {[0, 1, 2, 3, 4].map((l) => (
                  <div key={l} className={`w-3 h-3 rounded-sm ${l === 0 ? "bg-muted" : `bg-primary/${l === 1 ? 20 : l === 2 ? 40 : l === 3 ? 60 : 80}`}`} />
                ))}
                <span className="text-xs text-muted-foreground">More</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                <span className="text-xs text-muted-foreground">Due tasks</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected day detail panel */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{format(selDate, "EEEE, MMMM d")}</CardTitle>
            <CardDescription>
              {isFutureSelected
                ? `${selDayTasks.length} task${selDayTasks.length !== 1 ? "s" : ""} due`
                : `${selDayCompleted} completed · ${selDayTasks.length - selDayCompleted} pending`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selDayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <CalendarDays size={32} className="opacity-30" />
                <p className="text-sm">
                  {isFutureSelected ? "No tasks scheduled for this day" : "No tasks on this day"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {selDayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
                  >
                    {task.completed ? (
                      <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle size={16} className="text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.title}
                      </p>
                      {task.dueTime && (
                        <p className="text-xs text-blue-500 mt-0.5">{task.dueTime}</p>
                      )}
                      {task.description && (
                        <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[task.category]}20`,
                          color: CATEGORY_COLORS[task.category],
                        }}
                      >
                        {task.category}
                      </span>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                        title={`${task.priority} priority`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Chart with view toggle (reactive) ── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Completion Breakdown</CardTitle>
              <CardDescription>
                {chartView === "Week"
                  ? `Week of ${format(selWeekStart, "MMM d")} – ${format(selWeekEnd, "MMM d, yyyy")}`
                  : chartView === "Month"
                  ? format(selDate, "MMMM yyyy")
                  : `Year ${selDate.getFullYear()}`}
              </CardDescription>
            </div>
            <div className="flex rounded-lg bg-muted p-0.5">
              {["Week", "Month", "Year"].map((v) => (
                <button
                  key={v}
                  onClick={() => setChartView(v)}
                  className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                    chartView === v
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              barSize={chartView === "Month" ? 10 : chartView === "Year" ? 28 : 32}
              onClick={(data) => {
                if (!data?.activePayload?.[0]) return;
                const item = data.activePayload[0].payload;
                if (item.date && chartView !== "Year") {
                  setSelectedDate(item.date);
                  setViewMonth(new Date(parseISO(item.date).getFullYear(), parseISO(item.date).getMonth(), 1));
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                interval={chartView === "Month" ? 4 : 0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent))" }} />
              <Bar
                dataKey="Completed"
                radius={[4, 4, 0, 0]}
                shape={(props) => {
                  const { x, y, width, height, index } = props;
                  const entry = chartData[index];
                  const fill = entry?.isSelected ? "#6366f1" : "#6366f180";
                  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} />;
                }}
              />
            </BarChart>
          </ResponsiveContainer>
          {chartView !== "Year" && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Click a bar to jump to that day
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Heatmap (clickable) ── */}
      <Card>
        <CardHeader>
          <CardTitle>Yearly Activity Heatmap</CardTitle>
          <CardDescription>Click any cell to jump to that day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-2">
            {/* Month labels */}
            <div className="flex mb-1 ml-7">
              {heatmapWeeks.map((_, wi) => {
                const ml = monthLabels.find((m) => m.wi === wi);
                return (
                  <div key={wi} className="w-3.5 flex-shrink-0">
                    {ml && (
                      <span className="text-muted-foreground" style={{ fontSize: 10 }}>
                        {ml.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1">
              {/* Day labels */}
              <div className="flex flex-col gap-0.5 mr-1" style={{ paddingTop: 1 }}>
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} className="h-3 flex items-center">
                    {i % 2 === 1 && (
                      <span className="text-muted-foreground" style={{ fontSize: 9 }}>{d}</span>
                    )}
                  </div>
                ))}
              </div>
              {/* Cells */}
              <div className="flex gap-0.5">
                {heatmapWeeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-0.5">
                    {week.map((day, di) => (
                      <button
                        key={di}
                        onClick={() => handleHeatClick(day)}
                        disabled={day.isFuture}
                        title={day.isFuture ? "" : `${day.dateStr}: ${day.count} completed`}
                        className={`w-3 h-3 rounded-sm transition-all ${heatCell(day.count, day.isFuture, day.dateStr === selectedDate)}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-1.5 mt-3">
              <span className="text-xs text-muted-foreground">Less</span>
              {[0, 1, 2, 3, 4].map((l) => (
                <div key={l} className={`w-3 h-3 rounded-sm ${heatCell(l, false, false)}`} />
              ))}
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
