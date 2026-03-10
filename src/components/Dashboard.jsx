import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { format, subDays } from "date-fns";
import {
  CheckCircle2,
  Circle,
  TrendingUp,
  TrendingDown,
  ListTodo,
  Target,
  Flame,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Badge } from "./ui/Badge";

const CATEGORY_COLORS = {
  Work: "#6366f1",
  Health: "#22c55e",
  Learning: "#f59e0b",
  Personal: "#ec4899",
};

const PRIORITY_COLORS = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

function StatCard({ icon: Icon, label, value, change, changeLabel, color }) {
  const isPositive = change >= 0;
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon size={20} className="text-white" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-green-600" : "text-red-500"}`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground mt-1">{label}</div>
        {changeLabel && (
          <div className="text-xs text-muted-foreground mt-1">{changeLabel}</div>
        )}
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="text-xs">
            {p.name}: <span className="font-semibold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function Dashboard({ tasks }) {
  // Today's stats
  const today = format(new Date(), "yyyy-MM-dd");
  const todayTasks = tasks.filter((t) => t.createdAt === today);
  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const todayTotal = todayTasks.length;
  const todayRate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  // Yesterday for comparison
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const yesterdayTasks = tasks.filter((t) => t.createdAt === yesterday);
  const yesterdayCompleted = yesterdayTasks.filter((t) => t.completed).length;
  const yesterdayTotal = yesterdayTasks.length;
  const yesterdayRate = yesterdayTotal > 0 ? Math.round((yesterdayCompleted / yesterdayTotal) * 100) : 0;
  const rateChange = todayRate - yesterdayRate;

  // Overall stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Weekly data (last 7 days)
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayTasks = tasks.filter((t) => t.createdAt === dateStr);
    const completed = dayTasks.filter((t) => t.completed).length;
    const pending = dayTasks.length - completed;
    return {
      day: format(date, "EEE"),
      Completed: completed,
      Pending: pending,
      Total: dayTasks.length,
      rate: dayTasks.length > 0 ? Math.round((completed / dayTasks.length) * 100) : 0,
    };
  });

  // Category breakdown
  const categories = ["Work", "Health", "Learning", "Personal"];
  const categoryData = categories.map((cat) => {
    const catTasks = tasks.filter((t) => t.category === cat);
    const completed = catTasks.filter((t) => t.completed).length;
    return {
      name: cat,
      value: catTasks.length,
      completed,
      pending: catTasks.length - completed,
      rate: catTasks.length > 0 ? Math.round((completed / catTasks.length) * 100) : 0,
    };
  }).filter((c) => c.value > 0);

  // Priority distribution
  const priorityData = ["high", "medium", "low"].map((p) => {
    const pTasks = tasks.filter((t) => t.priority === p);
    return {
      name: p.charAt(0).toUpperCase() + p.slice(1),
      value: pTasks.length,
      completed: pTasks.filter((t) => t.completed).length,
    };
  });

  // Streak (consecutive days with at least 1 completed task)
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = format(subDays(new Date(), i), "yyyy-MM-dd");
    const dayCompleted = tasks.filter((t) => t.completedAt === d).length;
    if (dayCompleted > 0) streak++;
    else if (i > 0) break;
  }

  // Completion trend (last 7 days rates)
  const trendData = weeklyData.map((d) => ({
    day: d.day,
    "Completion Rate": d.rate,
    Tasks: d.Total,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")} — Track your daily progress
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          label="Today's Progress"
          value={`${todayCompleted}/${todayTotal}`}
          change={rateChange}
          changeLabel="vs yesterday"
          color="bg-indigo-500"
        />
        <StatCard
          icon={CheckCircle2}
          label="Total Completed"
          value={completedTasks}
          change={overallRate}
          changeLabel="completion rate"
          color="bg-green-500"
        />
        <StatCard
          icon={ListTodo}
          label="Pending Tasks"
          value={pendingTasks}
          color="bg-amber-500"
        />
        <StatCard
          icon={Flame}
          label="Day Streak"
          value={streak}
          changeLabel="consecutive days"
          color="bg-rose-500"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Completion Radial */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Completion</CardTitle>
            <CardDescription>Daily task completion rate</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative w-44 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="80%"
                  startAngle={90}
                  endAngle={-270}
                  data={[{ value: 100, fill: "#e2e8f0" }, { value: todayRate, fill: "#6366f1" }]}
                >
                  <RadialBar dataKey="value" cornerRadius={10} background={false} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{todayRate}%</span>
                <span className="text-xs text-muted-foreground">complete</span>
              </div>
            </div>
            <div className="flex gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-muted-foreground">Done <span className="font-semibold text-foreground">{todayCompleted}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <span className="text-muted-foreground">Left <span className="font-semibold text-foreground">{todayTotal - todayCompleted}</span></span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Overview</CardTitle>
            <CardDescription>Completed vs pending tasks per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} barSize={12} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="Completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pending" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Completion Rate Trend</CardTitle>
            <CardDescription>7-day completion percentage trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<CustomTooltip />} formatter={(v) => [`${v}%`, "Completion Rate"]} />
                <Area type="monotone" dataKey="Completion Rate" stroke="#6366f1" strokeWidth={2} fill="url(#colorRate)" dot={{ fill: "#6366f1", r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Task distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[cat.name] }}
                      />
                      <span className="text-xs text-muted-foreground">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{cat.value}</span>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {cat.rate}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Tasks grouped by priority level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {priorityData.map((p) => {
              const rate = p.value > 0 ? Math.round((p.completed / p.value) * 100) : 0;
              return (
                <div key={p.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: PRIORITY_COLORS[p.name.toLowerCase()] }}
                      />
                      <span className="text-sm font-medium">{p.name} Priority</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {p.completed}/{p.value} — {rate}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${rate}%`,
                        backgroundColor: PRIORITY_COLORS[p.name.toLowerCase()],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Category Performance Bars */}
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>Completed vs pending per category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={categoryData} layout="vertical" barSize={10} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={65} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="completed" name="Completed" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#94a3b8"} />
                  ))}
                </Bar>
                <Bar dataKey="pending" name="Pending" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>Latest 6 tasks across all categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
              >
                {task.completed ? (
                  <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                ) : (
                  <Circle size={18} className="text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{task.createdAt}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    style={{ backgroundColor: `${CATEGORY_COLORS[task.category]}20`, color: CATEGORY_COLORS[task.category], borderColor: "transparent" }}
                    className="text-xs"
                  >
                    {task.category}
                  </Badge>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                    title={`${task.priority} priority`}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
