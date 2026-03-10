import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  CalendarClock,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import TaskForm from "./TaskForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/Dialog";

const CATEGORY_COLORS = {
  Work: { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  Health: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  Learning: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  Personal: { bg: "bg-pink-100", text: "text-pink-700", dot: "bg-pink-500" },
};

const PRIORITY_CONFIG = {
  high: { label: "High", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  medium: { label: "Medium", bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  low: { label: "Low", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
};

function formatDueLabel(dueDate, dueTime) {
  if (!dueDate) return null;
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  let label;
  if (dueDate === today) label = "Today";
  else if (dueDate === tomorrow) label = "Tomorrow";
  else {
    // e.g. "Mar 15"
    const [y, m, d] = dueDate.split("-");
    label = new Date(+y, +m - 1, +d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return dueTime ? `${label} at ${dueTime}` : label;
}

function getDueStatus(dueDate, dueTime, completed) {
  if (!dueDate || completed) return "none";
  const now = new Date();
  const due = dueTime
    ? new Date(`${dueDate}T${dueTime}`)
    : new Date(`${dueDate}T23:59:59`);
  if (due < now) return "overdue";
  const diffMs = due - now;
  if (diffMs < 24 * 60 * 60 * 1000) return "soon"; // within 24 h
  return "upcoming";
}

function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const cat = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.Work;
  const pri = PRIORITY_CONFIG[task.priority];
  const dueLabel = formatDueLabel(task.dueDate, task.dueTime);
  const dueStatus = getDueStatus(task.dueDate, task.dueTime, task.completed);

  const dueBadgeClass =
    dueStatus === "overdue"
      ? "text-red-600 bg-red-50 border border-red-200"
      : dueStatus === "soon"
      ? "text-amber-600 bg-amber-50 border border-amber-200"
      : "text-blue-600 bg-blue-50 border border-blue-200";

  return (
    <div
      className={`group flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
        task.completed
          ? "border-border bg-muted/30 opacity-75"
          : dueStatus === "overdue"
          ? "border-red-200 bg-card hover:border-red-300"
          : "border-border bg-card hover:border-primary/30"
      }`}
    >
      <button
        onClick={() => onToggle(task.id)}
        className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
      >
        {task.completed ? (
          <CheckCircle2 size={20} className="text-green-500" />
        ) : (
          <Circle size={20} className="text-muted-foreground hover:text-primary" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p
            className={`font-medium text-sm leading-snug flex-1 ${
              task.completed ? "line-through text-muted-foreground" : "text-foreground"
            }`}
          >
            {task.title}
          </p>
          {dueStatus === "overdue" && !task.completed && (
            <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
          )}
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cat.bg} ${cat.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
            {task.category}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${pri.bg} ${pri.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
            {pri.label}
          </span>
          {dueLabel && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${dueBadgeClass}`}
            >
              <CalendarClock size={11} />
              {dueLabel}
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{task.createdAt}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onEdit(task)}
          aria-label="Edit task"
        >
          <Pencil size={13} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:text-destructive"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
}

export default function Tasks({ tasks, onAdd, onUpdate, onDelete, onToggle }) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...tasks];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q)
      );
    }
    if (filterCategory !== "all") result = result.filter((t) => t.category === filterCategory);
    if (filterPriority !== "all") result = result.filter((t) => t.priority === filterPriority);
    if (filterStatus === "completed") result = result.filter((t) => t.completed);
    if (filterStatus === "pending") result = result.filter((t) => !t.completed);

    result.sort((a, b) => {
      if (sortBy === "due") {
        // Tasks with no due date go to the bottom
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        const cmp = a.dueDate.localeCompare(b.dueDate);
        if (cmp !== 0) return cmp;
        return (a.dueTime || "").localeCompare(b.dueTime || "");
      }
      if (sortBy === "date") return b.createdAt.localeCompare(a.createdAt);
      if (sortBy === "priority") {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      }
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });

    return result;
  }, [tasks, search, filterCategory, filterPriority, filterStatus, sortBy]);

  const completedCount = filtered.filter((t) => t.completed).length;
  const pendingCount = filtered.length - completedCount;
  const overdueCount = tasks.filter(
    (t) => !t.completed && getDueStatus(t.dueDate, t.dueTime, t.completed) === "overdue"
  ).length;

  const handleEdit = (task) => {
    setEditTask(task);
    setFormOpen(true);
  };

  const handleFormSubmit = (data) => {
    if (editTask) {
      onUpdate(editTask.id, data);
    } else {
      onAdd(data);
    }
    setEditTask(null);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditTask(null);
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {completedCount} done · {pendingCount} remaining
            {overdueCount > 0 && (
              <span className="ml-2 text-red-500 font-medium">· {overdueCount} overdue</span>
            )}
          </p>
        </div>
        <Button onClick={() => { setEditTask(null); setFormOpen(true); }} className="gap-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Add Task</span>
        </Button>
      </div>

      {/* Search + Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              className="gap-2 sm:w-auto"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={15} />
              Filters
              {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="all">All Categories</option>
                  <option value="Work">Work</option>
                  <option value="Health">Health</option>
                  <option value="Learning">Learning</option>
                  <option value="Personal">Personal</option>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                <Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Sort By</label>
                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="date">Newest First</option>
                  <option value="due">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="title">Title A-Z</option>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: filtered.length, color: "text-foreground" },
          { label: "Pending", value: pendingCount, color: "text-amber-600" },
          { label: "Done", value: completedCount, color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-muted-foreground font-medium">No tasks found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || filterCategory !== "all" || filterPriority !== "all" || filterStatus !== "all"
                  ? "Try adjusting your filters"
                  : "Add your first task to get started"}
              </p>
              {!search && filterCategory === "all" && filterPriority === "all" && filterStatus === "all" && (
                <Button className="mt-4 gap-2" onClick={() => setFormOpen(true)}>
                  <Plus size={16} /> Add Task
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          ))
        )}
      </div>

      {/* Task Form Dialog */}
      <TaskForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        task={editTask}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogContent onClose={() => setDeleteId(null)}>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-6">
            Are you sure you want to delete this task? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
